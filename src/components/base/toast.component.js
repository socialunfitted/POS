import { eventBus } from '../../core/event-bus.js';

/**
 * Global Toast Notification Container & Renderer Component
 */
export class ToastContainerComponent {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    this.container = container;

    eventBus.on('NOTIFICATION_TRIGGERED', (notification) => {
      this.showToast(notification);
    });
  }

  /**
   * Render individual toast alert
   * @param {Object} notif - { type: 'success'|'error'|'warning'|'info', title, message, duration }
   */
  showToast({ type = 'info', title = '', message = '', duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <div class="flex-1">
        ${title ? `<div class="font-semibold text-sm">${title}</div>` : ''}
        <div class="text-xs text-secondary">${message}</div>
      </div>
      <button class="toast-close" style="opacity: 0.6; cursor: pointer;">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }
}
