/**
 * BarcodeAudioService
 * Generates success and error audio feedback using the Web Audio API.
 * No external audio files required — purely synthesised tones.
 */
export class BarcodeAudioService {
  constructor() {
    this._ctx = null;
  }

  _getContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  /**
   * Play a short pleasant "beep" on successful scan.
   * Frequency: 1046 Hz (C6), Duration: 80ms
   */
  playSuccess() {
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);      // C6
      osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.04); // E6

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {
      // Audio unavailable — fail silently
    }
  }

  /**
   * Play a short "buzz" on failed scan / product not found.
   * Frequency: 200 Hz, Duration: 150ms
   */
  playError() {
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) {
      // Audio unavailable — fail silently
    }
  }
}

export const barcodeAudio = new BarcodeAudioService();
