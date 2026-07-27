import { Store } from '../core/store.js';

export const adminStore = new Store({
  isSuperAdmin: true,
  metrics: {
    mrr: 12450.00,
    arr: 149400.00,
    totalStores: 142,
    activeSubscriptions: 128,
    churnRate: 1.2,
    arpu: 42.50,
    dailyBillsCount: 8420,
    activeCashiers: 340,
    storageUsedGb: 42.5
  },
  stores: [
    { id: 'st-101', name: 'Metro Supermarket', owner: 'John Doe', email: 'john@metro.com', plan: 'business', status: 'active', createdAt: '2026-01-15' },
    { id: 'st-102', name: 'Apex Pharmacy', owner: 'Sarah Connor', email: 'sarah@apex.com', plan: 'professional', status: 'active', createdAt: '2026-02-10' },
    { id: 'st-103', name: 'Boutique Fashion', owner: 'Emma Watson', email: 'emma@boutique.com', plan: 'starter', status: 'suspended', createdAt: '2026-03-01' },
    { id: 'st-104', name: 'City Hardware', owner: 'Robert Paul', email: 'robert@hardware.com', plan: 'free', status: 'trial', createdAt: '2026-07-20' }
  ],
  subscriptions: [
    { tenantId: 'st-101', storeName: 'Metro Supermarket', plan: 'business', cycle: 'annual', status: 'active', renewsAt: '2027-01-15', amount: '$948.00' },
    { tenantId: 'st-102', storeName: 'Apex Pharmacy', plan: 'professional', cycle: 'monthly', status: 'active', renewsAt: '2026-08-10', amount: '$49.00' },
    { tenantId: 'st-103', storeName: 'Boutique Fashion', plan: 'starter', cycle: 'monthly', status: 'suspended', renewsAt: '2026-04-01', amount: '$19.00' }
  ],
  payments: [
    { id: 'pay-501', invoiceNumber: 'INV-SAAS-9001', storeName: 'Metro Supermarket', amount: '$948.00', date: '2026-01-15', status: 'paid', method: 'Stripe Credit Card' },
    { id: 'pay-502', invoiceNumber: 'INV-SAAS-9002', storeName: 'Apex Pharmacy', amount: '$49.00', date: '2026-07-10', status: 'paid', method: 'Stripe Credit Card' }
  ],
  coupons: [
    { id: 'cp-1', code: 'WELCOME50', type: 'percentage', value: 50, usedCount: 42, maxUses: 100, is_active: true },
    { id: 'cp-2', code: 'SAVE20', type: 'fixed', value: 20, usedCount: 18, maxUses: 50, is_active: true }
  ],
  supportTickets: [
    { id: 't-101', storeName: 'Metro Supermarket', subject: 'Thermal Printer Setup Assistance', priority: 'high', status: 'open', date: '2026-07-27' },
    { id: 't-102', storeName: 'Apex Pharmacy', subject: 'Custom Invoice Footer Query', priority: 'normal', status: 'resolved', date: '2026-07-25' }
  ],
  globalFeatureFlags: {
    ai_assistant: true,
    thermal_printing: true,
    multi_outlet: true,
    qr_payments: true,
    api_access: true
  },
  systemLogs: [
    { id: 'log-1', timestamp: '2026-07-27 20:15:02', level: 'INFO', event: 'Daily Analytics Edge Function Executed Successfully' },
    { id: 'log-2', timestamp: '2026-07-27 18:40:11', level: 'WARN', event: 'Tenant st-103 status changed to suspended by Super Admin' }
  ],
  aiUsageLogs: [
    { tenantId: 'st-101', storeName: 'Metro Supermarket', model: 'deepseek-r1', promptTokens: 14200, completionTokens: 9800, totalTokens: 24000 },
    { tenantId: 'st-102', storeName: 'Apex Pharmacy', model: 'deepseek-r1', promptTokens: 6100, completionTokens: 4200, totalTokens: 10300 }
  ],
  announcements: [
    { id: 'ann-1', title: 'System Maintenance Notice', message: 'Scheduled DB maintenance tonight at 2:00 AM UTC.', target: 'all', active: true, createdAt: '2026-07-27' }
  ],
  platformSettings: {
    platformName: 'OmniPOS SaaS Platform',
    supportEmail: 'admin@omnipos.saas',
    supabaseUrl: 'https://givqmvmpjssqklhufigr.supabase.co',
    stripeWebhookSecret: 'whsec_mock_stripe_key_99182',
    enableRegistration: true
  },
  isLoading: false
});
