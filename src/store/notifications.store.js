import { Store } from '../core/store.js';

export const notificationsStore = new Store({
  notifications: [
    {
      id: 'notif-101',
      title: 'Critical Low Stock Warning',
      message: 'Arabica Coffee Beans 250g has dropped below minimum threshold (4 units remaining).',
      type: 'low_stock', // low_stock | subscription | payment | customer | system
      channels: ['in_app', 'email', 'sms'],
      isRead: false,
      timestamp: '10 mins ago',
      actionLabel: '📦 Reorder Stock',
      actionRoute: '#/inventory'
    },
    {
      id: 'notif-102',
      title: 'Supplier Payment Due Today',
      message: 'Payment of $1,344.00 is due today for PO-2026-895 (Global Beverage Co).',
      type: 'payment',
      channels: ['in_app', 'email', 'whatsapp'],
      isRead: false,
      timestamp: '1 hour ago',
      actionLabel: '💳 Pay Invoice',
      actionRoute: '#/purchases'
    },
    {
      id: 'notif-103',
      title: 'SaaS Subscription Renewal Notice',
      message: 'Your Professional Plan will renew in 5 days on August 1, 2026.',
      type: 'subscription',
      channels: ['in_app', 'email'],
      isRead: false,
      timestamp: '3 hours ago',
      actionLabel: '💳 Manage Plan',
      actionRoute: '#/subscription'
    },
    {
      id: 'notif-104',
      title: 'Customer Store Credit Reminder',
      message: 'Sarah Connor has an outstanding credit balance of $45.00 due for payment.',
      type: 'customer',
      channels: ['in_app', 'whatsapp'],
      isRead: true,
      timestamp: 'Yesterday',
      actionLabel: '👤 View Profile',
      actionRoute: '#/customers'
    },
    {
      id: 'notif-105',
      title: 'Database Backup Completed',
      message: 'Automated daily JSON database backup completed successfully (2.4 MB).',
      type: 'system',
      channels: ['in_app'],
      isRead: true,
      timestamp: '2 days ago',
      actionLabel: '⚙️ Settings',
      actionRoute: '#/settings'
    }
  ],
  channelsConfig: {
    inApp: { name: 'In-App Bell Alerts', isEnabled: true, status: 'ACTIVE' },
    email: { name: 'Email Dispatcher', isEnabled: true, status: 'ACTIVE' },
    sms: { name: 'SMS Gateway', isEnabled: true, status: 'ACTIVE' },
    whatsapp: { name: 'WhatsApp Business API', isEnabled: true, status: 'CONNECTED' }
  },
  filterType: 'all',
  unreadCount: 3,
  isLoading: false
});
