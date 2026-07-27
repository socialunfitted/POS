import { Store } from '../core/store.js';

export const settingsStore = new Store({
  storeProfile: {
    storeName: 'OmniPOS Main Retail Store',
    storeLogo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&auto=format&fit=crop&q=60',
    gstin: 'GST29AA1234A1Z5',
    address: '742 Evergreen Terrace, New York, NY 10001',
    phone: '+1 555-0199',
    email: 'contact@omnipos-store.com',
    operatingHours: '08:00 AM - 10:00 PM'
  },
  taxSettings: {
    defaultGstRate: 18,
    inclusiveTaxPricing: true,
    enableCgstSgst: true,
    hsnCodeMandatory: false
  },
  receiptSettings: {
    showStoreLogo: true,
    showCustomerDetails: true,
    showBarcodeOnReceipt: true,
    footerMessage: 'Thank you for shopping with OmniPOS! Visit us again.',
    termsText: 'Goods once sold are eligible for exchange within 7 days with valid receipt.',
    printCopies: 1
  },
  printerSettings: {
    paperWidth: '80mm', // 58mm | 80mm
    connectionType: 'usb', // usb | bluetooth | network
    printerIP: '192.168.1.150',
    autoPrintOnSettlement: true,
    drawerKickSignal: true
  },
  localeSettings: {
    language: 'en', // en | es | hi | fr | de
    currency: 'USD', // USD | EUR | INR | GBP | AUD
    currencySymbol: '$',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h'
  },
  themeSettings: {
    mode: 'light', // light | dark
    accentColor: '#6366f1'
  },
  securitySettings: {
    twoFactorEnabled: false,
    staffPinEnforced: true,
    sessionTimeoutMinutes: 30,
    lockOnIdle: true
  },
  notificationSettings: {
    lowStockPushAlerts: true,
    dailySalesEmailSummary: true,
    unusualExpenseAlerts: true,
    customerBirthdayAlerts: false
  },
  apiKeys: {
    supabaseUrl: 'https://givqmvmpjssqklhufigr.supabase.co',
    publishableKey: 'sb_publishable_f8uUSMWyMr4l4X67dLWm1A_j2M1ADG6',
    webhookEndpoint: 'https://api.omnipos.com/v1/webhooks/store-1'
  },
  integrations: [
    { id: 'stripe', name: 'Stripe Card Payments', isEnabled: true, description: 'Accept Credit/Debit Cards via Stripe Terminal' },
    { id: 'whatsapp', name: 'WhatsApp Business API', isEnabled: true, description: 'Send instant digital invoice receipts via WhatsApp' },
    { id: 'quickbooks', name: 'QuickBooks Online Accounting', isEnabled: false, description: 'Sync sales and expense ledgers with QuickBooks' },
    { id: 'thermal_spooler', name: 'RawBT Thermal Spooler', isEnabled: true, description: 'Direct Android thermal printer spooler driver' }
  ],
  backupMetadata: {
    lastBackupDate: '2026-07-27 10:30 AM',
    backupSize: '2.4 MB'
  },
  isLoading: false
});
