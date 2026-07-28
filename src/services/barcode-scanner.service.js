/**
 * BarcodeScannerService
 *
 * Handles all barcode input sources:
 *   1. USB / Bluetooth Scanners (keyboard-wedge mode) — detects rapid
 *      keystroke bursts that arrive within WEDGE_THRESHOLD_MS of each other.
 *   2. Camera-based scanning — uses the native BarcodeDetector API (Chrome 83+)
 *      with a live <video> stream fallback.
 *   3. Manual keyboard entry — user types a barcode and presses Enter.
 *
 * Architecture:
 *   - Emits 'barcode:scanned'  on the eventBus when a valid barcode is ready.
 *   - Emits 'barcode:error'    on the eventBus on any failure condition.
 *   - Maintains an offline product cache (localStorage) for sub-300 ms lookup.
 *   - Debounces duplicate scans within DUPLICATE_BLOCK_MS window.
 *
 * Supported formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ISBN, QR
 */

import { eventBus } from '../core/event-bus.js';
import { barcodeAudio } from './barcode-audio.service.js';

// ─── Constants ────────────────────────────────────────────────────────────────
/** Max ms gap between keystrokes to classify input as a hardware scanner wedge */
const WEDGE_THRESHOLD_MS = 50;
/** Min characters before we consider a burst a real barcode (not stray keys) */
const MIN_BARCODE_LENGTH = 6;
/** Block duplicate scans of the same barcode within this window (ms) */
const DUPLICATE_BLOCK_MS = 1500;
/** Offline product cache key in localStorage */
const CACHE_KEY = 'omnipos_product_barcode_cache';

// ─── Barcode Validation Regex Map ─────────────────────────────────────────────
const BARCODE_FORMATS = {
  'EAN-13': /^\d{13}$/,
  'EAN-8':  /^\d{8}$/,
  'UPC-A':  /^\d{12}$/,
  'UPC-E':  /^\d{6,8}$/,
  'ISBN':   /^(?:97[89])?\d{9}[\dX]$/,
  'Code39': /^[A-Z0-9 \-.$/+%]+$/,
  'Code128': /^[\x00-\x7F]+$/,
  'QR':      /^.{1,}$/             // QR can contain arbitrary data
};

export class BarcodeScannerService {
  constructor() {
    // Keyboard-wedge state
    this._wedgeBuffer  = '';
    this._lastKeyTime  = 0;
    this._wedgeHandler = null;

    // Duplicate-scan deduplication
    this._lastScanned     = '';
    this._lastScannedTime = 0;

    // Camera state
    this._cameraStream    = null;
    this._cameraActive    = false;
    this._cameraRafId     = null;
    this._barcodeDetector = null;

    // Product cache (populated by calling seedCache)
    this._cache = this._loadCache();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start listening for keyboard-wedge scanner input on the entire document.
   * Should be called when the POS billing page mounts.
   */
  startKeyboardWedge() {
    this._wedgeHandler = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._wedgeHandler, { capture: true });
  }

  /**
   * Stop keyboard-wedge listener.
   * Should be called when the POS billing page unmounts.
   */
  stopKeyboardWedge() {
    if (this._wedgeHandler) {
      document.removeEventListener('keydown', this._wedgeHandler, { capture: true });
      this._wedgeHandler = null;
    }
    this._wedgeBuffer = '';
  }

  /**
   * Start camera-based scanning.
   * @param {HTMLVideoElement} videoEl  — live preview element
   * @param {HTMLCanvasElement} canvasEl — off-screen canvas for frame capture
   * Returns Promise<void>; rejects with a typed error object on failure.
   */
  async startCamera(videoEl, canvasEl) {
    if (this._cameraActive) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      eventBus.emit('barcode:error', {
        code: 'CAMERA_UNAVAILABLE',
        message: 'Camera is not accessible on this device or browser.'
      });
      return;
    }

    // Request camera permission with preference for back camera (facingMode: environment)
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch (err) {
      const code = err.name === 'NotAllowedError' ? 'CAMERA_PERMISSION_DENIED' : 'CAMERA_UNAVAILABLE';
      eventBus.emit('barcode:error', {
        code,
        message: err.name === 'NotAllowedError' ? 'Please grant camera permission to scan barcodes.' : 'Camera stream could not be opened.'
      });
      return;
    }

    this._cameraStream = stream;
    this._cameraActive = true;
    videoEl.srcObject = stream;

    try {
      await videoEl.play();
    } catch (_) {
      // autoplay handled by playsinline
    }

    // Use native BarcodeDetector if available (with valid W3C spec format names)
    if ('BarcodeDetector' in window) {
      try {
        const validFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
        this._barcodeDetector = new BarcodeDetector({ formats: validFormats });
      } catch (err) {
        console.warn('[BarcodeScanner] Native BarcodeDetector init failed, using fallback:', err);
        this._barcodeDetector = null;
      }
    } else {
      this._barcodeDetector = null;
    }

    if (!this._barcodeDetector) {
      await this._initZXingFallback();
    }

    this._scanCameraFrame(videoEl, canvasEl);
  }

  /**
   * Initialize ZXing library fallback for browsers lacking native BarcodeDetector (iOS Safari, Firefox, etc.)
   */
  async _initZXingFallback() {
    if (this._zxingReader) return true;
    if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
      try {
        this._zxingReader = new window.ZXing.BrowserMultiFormatReader();
        return true;
      } catch (e) {
        console.warn('[BarcodeScanner] ZXing init error:', e);
        return false;
      }
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
      script.onerror = () => {
        console.warn('[BarcodeScanner] Failed to load ZXing library from CDN.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Stop camera stream and cancel animation loop.
   */
  stopCamera() {
    this._cameraActive = false;
    if (this._cameraRafId) {
      cancelAnimationFrame(this._cameraRafId);
      this._cameraRafId = null;
    }
    if (this._cameraStream) {
      this._cameraStream.getTracks().forEach((t) => t.stop());
      this._cameraStream = null;
    }
  }

  /**
   * Process a raw barcode string (from manual input or wedge).
   * Validates, deduplicates, looks up product, and emits event.
   * @param {string} raw — raw barcode string
   */
  async processBarcode(raw) {
    const barcode = this._sanitise(raw);

    // Empty / too short
    if (!barcode || barcode.length < MIN_BARCODE_LENGTH) {
      eventBus.emit('barcode:error', { code: 'EMPTY_BARCODE', message: 'Barcode is empty or too short.' });
      barcodeAudio.playError();
      return;
    }

    // Duplicate deduplication within DUPLICATE_BLOCK_MS
    const now = Date.now();
    if (barcode === this._lastScanned && (now - this._lastScannedTime) < DUPLICATE_BLOCK_MS) {
      return; // silently ignore
    }
    this._lastScanned     = barcode;
    this._lastScannedTime = now;

    // Detect format
    const format = this._detectFormat(barcode);
    if (!format) {
      eventBus.emit('barcode:error', { code: 'INVALID_BARCODE', message: `Unrecognised barcode format: "${barcode}"` });
      barcodeAudio.playError();
      return;
    }

    // Lookup product (cache-first → network fallback)
    const results = await this._lookupProduct(barcode);

    if (results.length === 0) {
      barcodeAudio.playError();
      eventBus.emit('barcode:not_found', { barcode, format });
      return;
    }

    barcodeAudio.playSuccess();

    if (results.length === 1) {
      // Single match — auto-add to cart
      eventBus.emit('barcode:scanned', { barcode, format, product: results[0] });
    } else {
      // Multiple matches — show selection dialog
      eventBus.emit('barcode:multiple_matches', { barcode, format, products: results });
    }
  }

  /**
   * Seed / refresh the offline barcode product cache from a product array.
   * Call this whenever the product catalog is loaded or updated.
   * @param {Array} products
   */
  seedCache(products) {
    const map = {};
    products.forEach((p) => {
      if (p.barcode) map[p.barcode] = p;
      // Support multiple barcodes stored as comma-separated string
      if (p.barcodes) {
        String(p.barcodes).split(',').forEach((b) => {
          const bc = b.trim();
          if (bc) map[bc] = p;
        });
      }
    });
    this._cache = map;
    this._saveCache(map);
  }

  /**
   * Generate a sequential EAN-13 barcode from a product SKU.
   * EAN-13 = 12 digit payload + 1 check digit.
   * @param {string} sku
   * @returns {string} 13-digit EAN barcode
   */
  generateBarcode(sku) {
    // Use numeric hash of SKU for first 12 digits
    const numeric = sku.replace(/[^0-9]/g, '').padStart(12, '0').slice(0, 12);
    const checkDigit = this._ean13CheckDigit(numeric);
    return numeric + checkDigit;
  }

  // ─── Private: Keyboard Wedge Detection ──────────────────────────────────────

  _handleKeyDown(e) {
    const now = Date.now();
    const gap = now - this._lastKeyTime;
    this._lastKeyTime = now;

    // Ignore modifier-only keypresses
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    if (e.key === 'Enter') {
      // Enter terminates a wedge scan burst
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
      // Gap too large — previous buffer was likely human typing, discard
      this._wedgeBuffer = '';
    }

    if (e.key.length === 1) {
      // Printable character — accumulate
      this._wedgeBuffer += e.key;
    }
  }

  // ─── Private: Camera Frame Scanning ─────────────────────────────────────────

  async _scanCameraFrame(videoEl, canvasEl) {
    if (!this._cameraActive) return;

    // 1. Native BarcodeDetector API (Chrome / Android)
    if (this._barcodeDetector) {
      try {
        const barcodes = await this._barcodeDetector.detect(videoEl);
        if (barcodes && barcodes.length > 0) {
          this._cameraActive = false;
          this.processBarcode(barcodes[0].rawValue);
          setTimeout(() => {
            if (this._cameraStream) {
              this._cameraActive = true;
              this._scanCameraFrame(videoEl, canvasEl);
            }
          }, 2000);
          return;
        }
      } catch (_) {
        // Frame processing error — continue scanning
      }
      this._cameraRafId = requestAnimationFrame(() => this._scanCameraFrame(videoEl, canvasEl));
      return;
    }

    // 2. ZXing JS Fallback (iOS Safari / Firefox / older devices)
    if (this._zxingReader) {
      try {
        if (videoEl && videoEl.readyState >= 2 && canvasEl) {
          const ctx = canvasEl.getContext('2d');
          canvasEl.width = videoEl.videoWidth || 640;
          canvasEl.height = videoEl.videoHeight || 480;
          ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

          const result = await this._zxingReader.decodeFromCanvas(canvasEl);
          if (result && result.getText()) {
            this._cameraActive = false;
            this.processBarcode(result.getText());
            setTimeout(() => {
              if (this._cameraStream) {
                this._cameraActive = true;
                this._scanCameraFrame(videoEl, canvasEl);
              }
            }, 2000);
            return;
          }
        }
      } catch (_) {
        // Frame did not contain a readable barcode — continue scanning loop
      }
      this._cameraRafId = requestAnimationFrame(() => this._scanCameraFrame(videoEl, canvasEl));
      return;
    }

    // 3. Fallback when neither engine is ready/available
    eventBus.emit('barcode:error', {
      code: 'DETECTOR_UNAVAILABLE',
      message: 'Camera barcode scanning requires BarcodeDetector API or dynamic library support.'
    });
    this.stopCamera();
  }

  // ─── Private: Product Lookup ─────────────────────────────────────────────────

  async _lookupProduct(barcode) {
    // 1. Cache-first lookup (< 1 ms)
    if (this._cache[barcode]) {
      return [this._cache[barcode]];
    }

    // 2. Offline fallback — scan entire cache for partial matches
    const cacheMatches = Object.values(this._cache).filter(
      (p) => p.barcode === barcode || (p.barcodes || '').includes(barcode)
    );
    if (cacheMatches.length > 0) return cacheMatches;

    // 3. Network lookup via Supabase (online only)
    if (!navigator.onLine) return [];

    try {
      const { supabaseClient } = await import('../config/supabase.config.js');
      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .or(`barcode.eq.${barcode},barcodes.cs.{${barcode}}`)
        .limit(5);
      return data || [];
    } catch (_) {
      return [];
    }
  }

  // ─── Private: Utilities ─────────────────────────────────────────────────────

  /**
   * Sanitise raw barcode string to prevent XSS / injection.
   */
  _sanitise(raw) {
    return String(raw || '')
      .trim()
      .replace(/[<>"'`\\;%{}|^[\]]/g, '') // strip dangerous chars
      .slice(0, 64);                        // max reasonable barcode length
  }

  /**
   * Detect barcode format from value.
   * @returns {string|null} format name or null if unrecognised
   */
  _detectFormat(barcode) {
    if (/^\d{13}$/.test(barcode)) return 'EAN-13';
    if (/^\d{12}$/.test(barcode)) return 'UPC-A';
    if (/^\d{8}$/.test(barcode)) return 'EAN-8';
    if (/^\d{6,8}$/.test(barcode)) return 'UPC-E';
    if (/^(?:97[89])\d{10}$/.test(barcode)) return 'ISBN';
    if (/^[A-Z0-9 \-.$/+%]{6,}$/.test(barcode)) return 'Code39';
    if (/^[\x20-\x7E]{6,}$/.test(barcode)) return 'Code128';
    if (barcode.length >= 6) return 'QR'; // fallback
    return null;
  }

  /**
   * Compute EAN-13 check digit using standard algorithm.
   */
  _ean13CheckDigit(digits12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3);
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
    } catch (_) {
      // Storage quota — fail silently
    }
  }
}

export const barcodeScannerService = new BarcodeScannerService();
