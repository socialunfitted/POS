import { notificationsStore } from '../store/notifications.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Multi-Channel Notification Center Service
 * Manages In-App Alerts, Email, SMS, WhatsApp API dispatchers, and notification lifecycles.
 */
export class NotificationsService {
  /**
   * Dispatch New Multi-Channel Notification
   */
  async sendNotification({ title, message, type = 'system', channels = ['in_app'], actionLabel = null, actionRoute = null }) {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      channels,
      isRead: false,
      timestamp: 'Just now',
      actionLabel: actionLabel || 'View Details',
      actionRoute: actionRoute || '#/dashboard'
    };

    const current = notificationsStore.getState().notifications;
    const updated = [newNotif, ...current];
    const unread = updated.filter((n) => !n.isRead).length;

    notificationsStore.setState({ notifications: updated, unreadCount: unread });

    // Database insertion
    await supabaseService.insert('notifications', {
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type,
      is_read: false
    });

    // Multi-channel dispatch triggers
    this.dispatchChannels(newNotif);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: newNotif.title,
      message: newNotif.message
    });

    return newNotif;
  }

  /**
   * Mark Specific Notification as Read
   */
  markAsRead(id) {
    const current = notificationsStore.getState().notifications;
    const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    const unread = updated.filter((n) => !n.isRead).length;

    notificationsStore.setState({ notifications: updated, unreadCount: unread });
  }

  /**
   * Mark All Notifications as Read
   */
  markAllAsRead() {
    const current = notificationsStore.getState().notifications;
    const updated = current.map((n) => ({ ...n, isRead: true }));

    notificationsStore.setState({ notifications: updated, unreadCount: 0 });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Notifications Read',
      message: 'All notifications marked as read.'
    });
  }

  /**
   * Delete Notification
   */
  clearNotification(id) {
    const current = notificationsStore.getState().notifications;
    const updated = current.filter((n) => n.id !== id);
    const unread = updated.filter((n) => !n.isRead).length;

    notificationsStore.setState({ notifications: updated, unreadCount: unread });
  }

  /**
   * Channel Dispatcher Engine
   */
  dispatchChannels(notification) {
    notification.channels.forEach((ch) => {
      if (ch === 'email') {
        console.log(`[Email Dispatcher] Sent email for: ${notification.title}`);
      } else if (ch === 'sms') {
        console.log(`[SMS Gateway] Sent SMS for: ${notification.title}`);
      } else if (ch === 'whatsapp') {
        console.log(`[WhatsApp API] Sent WhatsApp alert for: ${notification.title}`);
      }
    });
  }
}

export const notificationsService = new NotificationsService();
