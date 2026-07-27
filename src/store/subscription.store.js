import { Store } from '../core/store.js';

export const subscriptionStore = new Store({
  planTier: 'starter', // free | starter | professional | business | enterprise
  status: 'active',     // active | trialing | expiring_soon | expired | canceled
  billingCycle: 'monthly', // monthly | annual
  trialEndsAt: null,
  renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  daysRemaining: 30,
  limits: {
    maxUsers: 3,
    maxRegisters: 1,
    maxProducts: 500,
    maxOutlets: 1
  },
  features: ['basic_billing', 'daily_reports', 'customer_management', 'discounts'],
  appliedCoupon: null,
  paymentHistory: [
    {
      id: 'pay-101',
      invoiceNumber: 'INV-SUB-2026-001',
      date: '2026-07-01',
      amount: '$19.00',
      planName: 'Starter Plan',
      billingCycle: 'monthly',
      status: 'paid',
      receiptUrl: '#'
    }
  ],
  isLoading: false
});
