import { eventBus } from './event-bus.js';

/**
 * PWA & Service Worker Lifecycle Manager
 */
export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;

    this.initNetworkListeners();
    this.initPWAInstaller();
  }

  /**
   * Register Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWAManager] Service Worker registered with scope:', registration.scope);
      } catch (error) {
        console.warn('[PWAManager] Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Listen to online / offline events
   */
  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      eventBus.emit('ONLINE_STATUS_CHANGED', { isOnline: true });
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online. POS syncing active.',
        duration: 4000
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      eventBus.emit('ONLINE_STATUS_CHANGED', { isOnline: false });
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'warning',
        title: 'Offline Mode',
        message: 'Network connection lost. Running on cached local shell.',
        duration: 6000
      });
    });
  }

  /**
   * Capture install prompt event for custom install UI button
   */
  initPWAInstaller() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      eventBus.emit('PWA_INSTALL_AVAILABLE', true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      eventBus.emit('PWA_INSTALLED', true);
      console.log('[PWAManager] App successfully installed as PWA');
    });
  }

  /**
   * Trigger native PWA install banner
   */
  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`[PWAManager] User response to install prompt: ${outcome}`);
      this.deferredPrompt = null;
    }
  }
}
