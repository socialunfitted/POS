/**
 * BarcodeScannerService
 *
 * Handles all barcode input sources:
 *   1. USB / Bluetooth Scanners (keyboard-wedge mode)
 *   2. Camera-based scanning — native BarcodeDetector API (Chrome/Edge/Android)
 *      with seamless ZXing library fallback (Safari/iOS/Firefox).
 *   3. Manual barcode processing.
 */

import { eventBus } from '../core/event-bus.js';
import { barcodeAudio } from './barcode-audio.service.js';

const WEDGE_THRESHOLD_MS = 50;
const MIN_BARCODE_LENGTH = 6;
const DUPLICATE_BLOCK_MS = 1500;
const CACHE_KEY = 'omnipos_product_barcode_cache';

export class BarcodeScannerService {
  constructor() {
    this._wedgeBuffer = '';
    this._lastKeyTime = 0;
    this._wedgeHandler = null;

    this._lastScanned = '';
    this._lastScannedTime = 0;

    this._cameraStream = null;
    this._cameraActive = false;
    this._isStarting = false;
    this._cameraRafId = null;
    this._videoEl = null;
    this._barcodeDetector = null;
    this._zxingReader = null;

    this._cache = this._loadCache();
  }

  startKeyboardWedge() {
    try {
      this._wedgeHandler = this._handleKeyDown.bind(this);
      document.addEventListener('keydown', this._wedgeHandler, { capture: true });
    } catch (err) {
      console.error('[BarcodeScanner] Error details (startKeyboardWedge):', err);
    }
  }

  stopKeyboardWedge() {
    try {
      if (this._wedgeHandler) {
        document.removeEventListener('keydown', this._wedgeHandler, { capture: true });
        this._wedgeHandler = null;
      }
      this._wedgeBuffer = '';
    } catch (err) {
      console.error('[BarcodeScanner] Error details (stopKeyboardWedge):', err);
    }
  }

  async startCamera(videoEl, canvasEl) {
    if (this._cameraActive || this._isStarting) {
      console.warn('[BarcodeScanner] Camera start already in progress or camera active.');
      return;
    }
    this._isStarting = true;
    this._videoEl = videoEl;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[BarcodeScanner] Error details: mediaDevices.getUserMedia unavailable.');
        eventBus.emit('barcode:error', {
          code: 'CAMERA_UNAVAILABLE',
          message: 'No camera detected.'
        });
        return;
      }

      let stream = null;
      const cameraConstraints = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } },
        { video: true }
      ];

      for (const constraint of cameraConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (e) {
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            throw e; // Rethrow permission denied immediately
          }
        }
      }

      if (!stream) {
        eventBus.emit('barcode:error', {
          code: 'CAMERA_UNAVAILABLE',
          message: 'No camera detected.'
        });
        return;
      }

      this._cameraStream = stream;
      this._cameraActive = true;
      console.log('[BarcodeScanner] Camera started');

      if (videoEl) {
        videoEl.srcObject = stream;
        try {
          await videoEl.play();
        } catch (_) {}
      }

      // Initialize Detector (Native BarcodeDetector or ZXing fallback)
      await this._initDetector();

      // Start frame scanning loop
      this._scanCameraFrame(videoEl, canvasEl);
    } catch (err) {
      console.error('[BarcodeScanner] Error details:', err);
      this.stopCamera();

      let code = 'CAMERA_UNAVAILABLE';
      let message = 'No camera detected.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        code = 'CAMERA_PERMISSION_DENIED';
        message = 'Camera permission required to scan barcode.';
      }

      eventBus.emit('barcode:error', { code, message });
    } finally {
      this._isStarting = false;
    }
  }

  async _initDetector() {
    this._barcodeDetector = null;

    if ('BarcodeDetector' in window && typeof window.BarcodeDetector === 'function') {
      try {
        const validFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
        const detector = new window.BarcodeDetector({ formats: validFormats });
        if (detector && typeof detector.detect === 'function') {
          this._barcodeDetector = detector;
          console.log('[BarcodeScanner] Detector initialized: Native BarcodeDetector');
          return;
        }
      } catch (err) {
        console.warn('[BarcodeScanner] Native BarcodeDetector init failed, using fallback:', err);
        this._barcodeDetector = null;
      }
    }

    // Fallback to ZXing
    const zxingOk = await this._initZXingFallback();
    if (zxingOk) {
      console.log('[BarcodeScanner] Detector initialized: ZXing Fallback');
    } else {
      console.error('[BarcodeScanner] Error details: Both BarcodeDetector and ZXing fallback failed to initialize.');
    }
  }

  async _initZXingFallback() {
    try {
      if (this._zxingReader) return true;

      if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
        this._zxingReader = new window.ZXing.BrowserMultiFormatReader();
        return true;
      }

      return new Promise((resolve) => {
        if (document.getElementById('zxing-script')) {
          let checkCount = 0;
          const check = setInterval(() => {
            checkCount++;
            if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
              clearInterval(check);
              try {
                this._zxingReader = new window.ZXing.BrowserMultiFormatReader();
                resolve(true);
              } catch (_) { resolve(false); }
            } else if (checkCount > 50) {
              clearInterval(check);
              resolve(false);
            }
          }, 100);
          return;
        }

        const script = document.createElement('script');
        script.id = 'zxing-script';
        script.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
        script.async = true;
        script.onload = () => {
          if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
            try {
              this._zxingReader = new window.ZXing.BrowserMultiFormatReader();
              resolve(true);
            } catch (_) { resolve(false); }
          } else {
            resolve(false);
          }
        };
        script.onerror = (e) => {
          console.error('[BarcodeScanner] Error details (ZXing load):', e);
          resolve(false);
        };
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('[BarcodeScanner] Error details (_initZXingFallback):', err);
      return false;
    }
  }

  stopCamera() {
    try {
      this._cameraActive = false;
      this._isStarting = false;

      if (this._cameraRafId) {
        cancelAnimationFrame(this._cameraRafId);
        this._cameraRafId = null;
      }

      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach((track) => {
          try { track.stop(); } catch (_) {}
        });
        this._cameraStream = null;
      }

      if (this._videoEl) {
        this._videoEl.srcObject = null;
        this._videoEl = null;
      }

      console.log('[BarcodeScanner] Camera stopped');
    } catch (err) {
      console.error('[BarcodeScanner] Error details (stopCamera):', err);
    }
  }

  async _scanCameraFrame(videoEl, canvasEl) {
    if (!this._cameraActive) return;

    try {
      // 1. Native BarcodeDetector API (Chrome / Edge / Android)
      if (this._barcodeDetector && typeof this._barcodeDetector.detect === 'function') {
        try {
          if (videoEl && videoEl.readyState >= 2) {
            const barcodes = await this._barcodeDetector.detect(videoEl);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const detectedValue = barcodes[0].rawValue;
              console.log('[BarcodeScanner] Barcode detected:', detectedValue);
              await this.processBarcode(detectedValue);
              return;
            }
          }
        } catch (frameErr) {
          // Frame decode warning — continue loop
        }
      } else if (this._zxingReader && typeof this._zxingReader.decodeFromCanvas === 'function') {
        // 2. ZXing JS Fallback (Safari / Firefox / Edge)
        try {
          if (videoEl && videoEl.readyState >= 2 && canvasEl) {
            const ctx = canvasEl.getContext('2d');
            canvasEl.width = videoEl.videoWidth || 640;
            canvasEl.height = videoEl.videoHeight || 480;
            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

            const result = await this._zxingReader.decodeFromCanvas(canvasEl);
            if (result && result.getText && result.getText()) {
              const detectedValue = result.getText();
              console.log('[BarcodeScanner] Barcode detected:', detectedValue);
              await this.processBarcode(detectedValue);
              return;
            }
          }
        } catch (_) {
          // Frame decode warning — continue loop
        }
      } else {
        // No detector engine initialized
        console.warn('[BarcodeScanner] No barcode detector engine ready.');
      }
    } catch (err) {
      console.error('[BarcodeScanner] Error details (_scanCameraFrame):', err);
    }

    if (this._cameraActive) {
      this._cameraRafId = requestAnimationFrame(() => this._scanCameraFrame(videoEl, canvasEl));
    }
  }

  async processBarcode(raw) {
    try {
      const barcode = this._sanitise(raw);

      if (!barcode || barcode.length < MIN_BARCODE_LENGTH) {
        console.log('[BarcodeScanner] No barcode found.');
        eventBus.emit('barcode:error', { code: 'EMPTY_BARCODE', message: 'No barcode found.' });
        barcodeAudio.playError();
        return;
      }

      // Deduplicate scans of same barcode within window
      const now = Date.now();
      if (barcode === this._lastScanned && (now - this._lastScannedTime) < DUPLICATE_BLOCK_MS) {
        console.log('[BarcodeScanner] Duplicate scan blocked (debounced):', barcode);
        return;
      }
      this._lastScanned = barcode;
      this._lastScannedTime = now;

      const format = this._detectFormat(barcode);
      if (!format) {
        console.log('[BarcodeScanner] No barcode found (invalid format).');
        eventBus.emit('barcode:error', { code: 'INVALID_BARCODE', message: 'No barcode found.' });
        barcodeAudio.playError();
        return;
      }

      // Lookup product
      const results = await this._lookupProduct(barcode);

      if (results.length === 0) {
        console.log('[BarcodeScanner] Product not found for barcode:', barcode);
        barcodeAudio.playError();
        eventBus.emit('barcode:not_found', { barcode, format });
        return;
      }

      barcodeAudio.playSuccess();

      if (results.length === 1) {
        eventBus.emit('barcode:scanned', { barcode, format, product: results[0] });
      } else {
        eventBus.emit('barcode:multiple_matches', { barcode, format, products: results });
      }
    } catch (err) {
      console.error('[BarcodeScanner] Error details (processBarcode):', err);
    }
  }

  seedCache(products) {
    try {
      const map = {};
      (products || []).forEach((p) => {
        if (p.barcode) map[p.barcode] = p;
        if (p.barcodes) {
          String(p.barcodes).split(',').forEach((b) => {
            const bc = b.trim();
            if (bc) map[bc] = p;
          });
        }
      });
      this._cache = map;
      this._saveCache(map);
    } catch (err) {
      console.error('[BarcodeScanner] Error details (seedCache):', err);
    }
  }

  generateBarcode(sku) {
    try {
      const numeric = String(sku || '').replace(/[^0-9]/g, '').padStart(12, '0').slice(0, 12);
      const checkDigit = this._ean13CheckDigit(numeric);
      return numeric + checkDigit;
    } catch (err) {
      console.error('[BarcodeScanner] Error details (generateBarcode):', err);
      return '0000000000000';
    }
  }

  _handleKeyDown(e) {
    try {
      const now = Date.now();
      const gap = now - this._lastKeyTime;
      this._lastKeyTime = now;

      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      if (e.key === 'Enter') {
        if (this._wedgeBuffer.length >= MIN_BARCODE_LENGTH) {
          const captured = this._wedgeBuffer;
          this._wedgeBuffer = '';
          this.processBarcode(captured);
        } else {
          this._wedgeBuffer = '';
        }
        return;
      }

      if (gap > WEDGE_THRESHOLD_MS && this._wedgeBuffer.length > 0) {
        this._wedgeBuffer = '';
      }

      if (e.key.length === 1) {
        this._wedgeBuffer += e.key;
      }
    } catch (err) {
      console.error('[BarcodeScanner] Error details (_handleKeyDown):', err);
    }
  }

  async _lookupProduct(barcode) {
    try {
      if (this._cache[barcode]) {
        return [this._cache[barcode]];
      }

      const cacheMatches = Object.values(this._cache).filter(
        (p) => p.barcode === barcode || (p.barcodes || '').includes(barcode)
      );
      if (cacheMatches.length > 0) return cacheMatches;

      if (!navigator.onLine) return [];

      const { supabaseClient } = await import('../config/supabase.config.js');
      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .or(`barcode.eq.${barcode},barcodes.cs.{${barcode}}`)
        .limit(5);
      return data || [];
    } catch (err) {
      console.error('[BarcodeScanner] Error details (_lookupProduct):', err);
      return [];
    }
  }

  _sanitise(raw) {
    return String(raw || '')
      .trim()
      .replace(/[<>"'`\\;%{}|^[\]]/g, '')
      .slice(0, 64);
  }

  _detectFormat(barcode) {
    if (/^\d{13}$/.test(barcode)) return 'EAN-13';
    if (/^\d{12}$/.test(barcode)) return 'UPC-A';
    if (/^\d{8}$/.test(barcode)) return 'EAN-8';
    if (/^\d{6,8}$/.test(barcode)) return 'UPC-E';
    if (/^(?:97[89])\d{10}$/.test(barcode)) return 'ISBN';
    if (/^[A-Z0-9 \-.$/+%]{6,}$/.test(barcode)) return 'Code39';
    if (/^[\x20-\x7E]{6,}$/.test(barcode)) return 'Code128';
    if (barcode.length >= 6) return 'QR';
    return null;
  }

  _ean13CheckDigit(digits12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits12[i] || '0') * (i % 2 === 0 ? 1 : 3);
    }
    return String((10 - (sum % 10)) % 10);
  }

  _loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  _saveCache(map) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(map));
    } catch (_) {}
  }
}

export const barcodeScannerService = new BarcodeScannerService();
