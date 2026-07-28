/**
 * BarcodeAudioService
 * Generates crisp success and error audio feedback using Web Audio API.
 * Purely synthesised tones with automatic mobile Web Audio API unlocking.
 */
export class BarcodeAudioService {
  constructor() {
    this._ctx = null;
    this._unlockAudio();
  }

  _unlockAudio() {
    const unlock = () => {
      try {
        const ctx = this._getContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
      } catch (_) {}
    };
    document.addEventListener('touchstart', unlock, { once: true, capture: true });
    document.addEventListener('click', unlock, { once: true, capture: true });
  }

  _getContext() {
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._ctx = new AudioCtx();
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    return this._ctx;
  }

  /**
   * Play a sharp, crisp retail scanner "BEEP!" tone on successful scan.
   * Frequency: 1760 Hz (A6) -> 2637 Hz (E7), Duration: 100ms
   */
  playSuccess() {
    try {
      const ctx = this._getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // High-frequency dual-tone retail scanner chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);      // A6 tone
      osc.frequency.setValueAtTime(2637, ctx.currentTime + 0.045); // E7 tone

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {
      // Audio unavailable — fail silently
    }
  }

  /**
   * Play a short low-frequency "BUZZ" sound on failed scan / product not found.
   * Frequency: 220 Hz -> 180 Hz, Duration: 180ms
   */
  playError() {
    try {
      const ctx = this._getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) {
      // Audio unavailable — fail silently
    }
  }
}

export const barcodeAudio = new BarcodeAudioService();

