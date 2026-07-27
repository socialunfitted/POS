/**
 * BarcodeScannerComponent
 *
 * A compact, self-contained UI component that renders:
 *   • A barcode text input field (with scan icon) that auto-focuses on mount.
 *   • A "Scan with Camera" toggle button (hidden on browsers without camera support).
 *   • A live camera preview panel (video + canvas) that appears when camera mode is active.
 *   • A scanner connection status indicator badge.
 *   • A product-not-found / multiple-match selection dialog.
 *
 * This component is intentionally UI-neutral — it applies inline styles that
 * complement the existing OmniPOS design tokens without touching the billing layout.
 *
 * Usage:
 *   const scanner = new BarcodeScannerComponent({ onProductResolved });
 *   billingContainerEl.prepend(scanner.render());
 *   scanner.mount();   // starts wedge listener + focuses input
 *   scanner.unmount(); // cleans up listeners and camera
 */

import { barcodeScannerService } from '../../services/barcode-scanner.service.js';
import { eventBus } from '../../core/event-bus.js';

export class BarcodeScannerComponent {
  /**
   * @param {Object} options
   * @param {Function} options.onProductResolved  — called with (product) when a single match is found
   * @param {Function} [options.onMultipleMatches] — called with (products[]) when >1 matches
   * @param {Function} [options.onNotFound]        — called with (barcode) when no product found
   */
  constructor({ onProductResolved, onMultipleMatches, onNotFound } = {}) {
    this._onProductResolved  = onProductResolved  || (() => {});
    this._onMultipleMatches  = onMultipleMatches  || (() => {});
    this._onNotFound         = onNotFound         || (() => {});

    this._root          = null;
    this._inputEl       = null;
    this._statusEl      = null;
    this._cameraPanel   = null;
    this._videoEl       = null;
    this._canvasEl      = null;
    this._cameraActive  = false;

    this._eventUnsubs   = [];  // eventBus unsubscribe functions

    this._cameraSupported = 'mediaDevices' in navigator && 'BarcodeDetector' in window;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Build and return the root DOM element (does not mount yet). */
  render() {
    this._root = document.createElement('div');
    this._root.className = 'barcode-scanner-component';
    this._root.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
      background: var(--color-surface, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 8px);
      margin-bottom: 12px;
    `;

    this._root.appendChild(this._buildInputRow());
    this._root.appendChild(this._buildCameraPanel());

    return this._root;
  }

  /** Attach event listeners and start the keyboard-wedge listener. */
  mount() {
    if (!this._root) throw new Error('BarcodeScannerComponent: call render() before mount().');

    barcodeScannerService.startKeyboardWedge();

    // Subscribe to scanner events
    this._eventUnsubs.push(
      eventBus.on('barcode:scanned',          (e) => this._handleScanned(e)),
      eventBus.on('barcode:not_found',        (e) => this._handleNotFound(e)),
      eventBus.on('barcode:multiple_matches', (e) => this._handleMultiple(e)),
      eventBus.on('barcode:error',            (e) => this._handleError(e))
    );

    // Auto-focus the barcode input
    requestAnimationFrame(() => this._inputEl && this._inputEl.focus());

    this._setStatus('ready');
  }

  /** Remove event listeners, stop camera, clean up. */
  unmount() {
    barcodeScannerService.stopKeyboardWedge();
    barcodeScannerService.stopCamera();
    this._eventUnsubs.forEach((fn) => typeof fn === 'function' && fn());
    this._eventUnsubs = [];
    this._cameraActive = false;
  }

  /** Programmatically focus the barcode input (e.g. after a modal closes). */
  focus() {
    this._inputEl && this._inputEl.focus();
  }

  // ─── Private: DOM Builders ───────────────────────────────────────────────────

  _buildInputRow() {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:8px;';

    // Scanner icon label
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary,#6366f1)" stroke-width="2" stroke-linecap="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <line x1="7" y1="12" x2="7" y2="12.01"/>
        <line x1="12" y1="7" x2="12" y2="17"/>
        <line x1="17" y1="12" x2="17" y2="12.01"/>
      </svg>`;
    icon.title = 'Barcode Scanner';
    icon.style.flexShrink = '0';

    // Barcode text input
    this._inputEl = document.createElement('input');
    this._inputEl.id              = 'barcode-scan-input';
    this._inputEl.type            = 'text';
    this._inputEl.placeholder     = 'Scan barcode or type & press Enter...';
    this._inputEl.autocomplete    = 'off';
    this._inputEl.autocorrect     = 'off';
    this._inputEl.autocapitalize  = 'off';
    this._inputEl.spellcheck      = false;
    this._inputEl.maxLength       = 64;
    this._inputEl.style.cssText   = `
      flex: 1;
      padding: 7px 10px;
      border: 1.5px solid var(--color-border, #334155);
      border-radius: var(--radius-sm, 6px);
      background: var(--color-bg, #0f172a);
      color: var(--color-text, #f1f5f9);
      font-family: 'JetBrains Mono', monospace, sans-serif;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    `;

    this._inputEl.addEventListener('focus',   () => { this._inputEl.style.borderColor = 'var(--color-primary, #6366f1)'; });
    this._inputEl.addEventListener('blur',    () => { this._inputEl.style.borderColor = 'var(--color-border, #334155)'; });
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = this._inputEl.value.trim();
        this._inputEl.value = '';
        if (val) barcodeScannerService.processBarcode(val);
      }
    });

    // Status badge
    this._statusEl = document.createElement('span');
    this._statusEl.id = 'scanner-status-badge';
    this._statusEl.style.cssText = `
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
      white-space: nowrap;
      flex-shrink: 0;
    `;

    // Camera toggle button (only shown if BarcodeDetector available)
    if (this._cameraSupported) {
      const camBtn = document.createElement('button');
      camBtn.id = 'camera-scan-btn';
      camBtn.title = 'Scan with Camera';
      camBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>`;
      camBtn.style.cssText = `
        padding: 6px 8px;
        border: 1.5px solid var(--color-border, #334155);
        border-radius: var(--radius-sm, 6px);
        background: var(--color-surface, #1e293b);
        color: var(--color-text, #f1f5f9);
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: background 0.15s;
        flex-shrink: 0;
      `;
      camBtn.addEventListener('mouseenter', () => { camBtn.style.background = 'var(--color-primary, #6366f1)'; });
      camBtn.addEventListener('mouseleave', () => { camBtn.style.background = 'var(--color-surface, #1e293b)'; });
      camBtn.addEventListener('click', () => this._toggleCamera());
      row.appendChild(camBtn);
    }

    row.appendChild(icon);
    row.appendChild(this._inputEl);
    row.appendChild(this._statusEl);
    return row;
  }

  _buildCameraPanel() {
    this._cameraPanel = document.createElement('div');
    this._cameraPanel.id = 'camera-scan-panel';
    this._cameraPanel.style.cssText = 'display:none; flex-direction:column; gap:8px;';

    // Video preview
    this._videoEl = document.createElement('video');
    this._videoEl.muted     = true;
    this._videoEl.playsInline = true;
    this._videoEl.style.cssText = `
      width: 100%;
      max-height: 200px;
      border-radius: var(--radius-sm, 6px);
      background: #000;
      object-fit: cover;
    `;

    // Hidden canvas (used by scanner internally)
    this._canvasEl = document.createElement('canvas');
    this._canvasEl.style.display = 'none';

    // Instruction label
    const label = document.createElement('div');
    label.textContent = '📷 Point camera at a barcode — auto-detects EAN, UPC, Code 128, QR';
    label.style.cssText = 'font-size:10px; color:var(--color-text-muted,#64748b); text-align:center;';

    // Close camera button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close Camera';
    closeBtn.className = 'btn btn-secondary btn-sm';
    closeBtn.addEventListener('click', () => this._toggleCamera());

    this._cameraPanel.appendChild(this._videoEl);
    this._cameraPanel.appendChild(this._canvasEl);
    this._cameraPanel.appendChild(label);
    this._cameraPanel.appendChild(closeBtn);

    return this._cameraPanel;
  }

  // ─── Private: Camera Toggle ───────────────────────────────────────────────────

  async _toggleCamera() {
    if (this._cameraActive) {
      barcodeScannerService.stopCamera();
      this._cameraActive = false;
      this._cameraPanel.style.display = 'none';
      this._setStatus('ready');
    } else {
      this._cameraPanel.style.display = 'flex';
      this._setStatus('camera');
      await barcodeScannerService.startCamera(this._videoEl, this._canvasEl);
      this._cameraActive = true;
    }
  }

  // ─── Private: Status Badge ────────────────────────────────────────────────────

  _setStatus(state) {
    const map = {
      ready:  { text: '● SCANNER READY',  bg: '#16a34a22', color: '#4ade80', border: '#16a34a' },
      camera: { text: '📷 CAMERA ACTIVE', bg: '#7c3aed22', color: '#a78bfa', border: '#7c3aed' },
      success:{ text: '✓ SCAN OK',        bg: '#16a34a44', color: '#4ade80', border: '#16a34a' },
      error:  { text: '✕ NOT FOUND',      bg: '#dc262622', color: '#f87171', border: '#dc2626' },
      offline:{ text: '⚡ OFFLINE MODE',   bg: '#b4530922', color: '#fbbf24', border: '#b45309' }
    };
    const cfg = map[state] || map.ready;
    Object.assign(this._statusEl.style, {
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`
    });
    this._statusEl.textContent = cfg.text;

    if (state === 'success' || state === 'error') {
      setTimeout(() => this._setStatus(navigator.onLine ? 'ready' : 'offline'), 2000);
    }
  }

  // ─── Private: Event Handlers ─────────────────────────────────────────────────

  _handleScanned({ product }) {
    this._setStatus('success');
    this._inputEl && (this._inputEl.value = '');
    setTimeout(() => this._inputEl && this._inputEl.focus(), 50);
    this._onProductResolved(product);
  }

  _handleNotFound({ barcode }) {
    this._setStatus('error');
    this._inputEl && (this._inputEl.value = '');
    setTimeout(() => this._inputEl && this._inputEl.focus(), 50);
    this._onNotFound(barcode);
  }

  _handleMultiple({ products }) {
    this._buildSelectionDialog(products);
  }

  _handleError({ code, message }) {
    this._setStatus('error');
    console.warn(`[BarcodeScanner] ${code}: ${message}`);
    this._inputEl && (this._inputEl.value = '');
  }

  // ─── Private: Multiple-Match Selection Dialog ─────────────────────────────────

  _buildSelectionDialog(products) {
    // Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: var(--color-surface, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 12px);
      padding: 20px;
      min-width: 340px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 24px 48px rgba(0,0,0,0.5);
    `;

    dialog.innerHTML = `
      <div style="font-weight:700; font-size:14px; margin-bottom:12px; color:var(--color-text,#f1f5f9);">
        🔍 Multiple Products Found — Select One
      </div>
    `;

    products.forEach((p) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        width: 100%; padding: 10px 12px;
        background: var(--color-bg, #0f172a);
        border: 1px solid var(--color-border, #334155);
        border-radius: var(--radius-sm, 6px);
        margin-bottom: 8px;
        cursor: pointer; text-align: left;
        color: var(--color-text, #f1f5f9);
        transition: border-color 0.15s;
      `;
      btn.innerHTML = `
        <div>
          <div style="font-weight:600; font-size:12px;">${this._escapeHtml(p.name)}</div>
          <div style="font-size:11px; color:var(--color-text-muted,#64748b);">
            SKU: ${this._escapeHtml(p.sku)} &bull; $${parseFloat(p.sellingPrice || 0).toFixed(2)}
          </div>
        </div>
      `;
      btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--color-primary,#6366f1)'; });
      btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--color-border,#334155)'; });
      btn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        this._onProductResolved(p);
        this._setStatus('success');
        setTimeout(() => this._inputEl && this._inputEl.focus(), 50);
      });
      dialog.appendChild(btn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-secondary btn-sm';
    cancelBtn.style.marginTop = '4px';
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      setTimeout(() => this._inputEl && this._inputEl.focus(), 50);
    });
    dialog.appendChild(cancelBtn);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  _escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
