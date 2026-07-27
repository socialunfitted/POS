/**
 * SaaS Subscription Plans & Entitlements Matrix Definition
 * Supports 5 Tiers: Free, Starter, Professional, Business, Enterprise
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Plan',
    tagline: 'Ideal for small pop-ups & trial evaluation',
    monthlyPrice: 0,
    annualPrice: 0,
    maxUsers: 1,
    maxRegisters: 1,
    maxProducts: 50,
    maxOutlets: 1,
    features: [
      'basic_billing',
      'daily_reports'
    ]
  },
  STARTER: {
    id: 'starter',
    name: 'Starter Plan',
    tagline: 'Essential tools for growing retail shops',
    monthlyPrice: 19,
    annualPrice: 180, // $15/mo billed annually
    maxUsers: 3,
    maxRegisters: 1,
    maxProducts: 500,
    maxOutlets: 1,
    features: [
      'basic_billing',
      'daily_reports',
      'customer_management',
      'discounts'
    ]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional Plan',
    tagline: 'Advanced inventory & multi-register billing',
    monthlyPrice: 49,
    annualPrice: 468, // $39/mo billed annually
    maxUsers: 10,
    maxRegisters: 3,
    maxProducts: 5000,
    maxOutlets: 1,
    features: [
      'basic_billing',
      'daily_reports',
      'customer_management',
      'discounts',
      'inventory_tracking',
      'barcode_scanner',
      'multi_register',
      'advanced_analytics',
      'bulk_import_export'
    ]
  },
  BUSINESS: {
    id: 'business',
    name: 'Business Plan',
    tagline: 'Multi-outlet management & AI business assistant',
    monthlyPrice: 99,
    annualPrice: 948, // $79/mo billed annually
    maxUsers: 25,
    maxRegisters: 10,
    maxProducts: 25000,
    maxOutlets: 3,
    features: [
      'basic_billing',
      'daily_reports',
      'customer_management',
      'discounts',
      'inventory_tracking',
      'barcode_scanner',
      'multi_register',
      'advanced_analytics',
      'bulk_import_export',
      'multi_outlet',
      'ai_assistant',
      'thermal_printing',
      'qr_payment'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    tagline: 'Unlimited scale, custom API access & SLA support',
    monthlyPrice: 199,
    annualPrice: 1908, // $159/mo billed annually
    maxUsers: 999,
    maxRegisters: 99,
    maxProducts: 100000,
    maxOutlets: 10,
    features: [
      'basic_billing',
      'daily_reports',
      'customer_management',
      'discounts',
      'inventory_tracking',
      'barcode_scanner',
      'multi_register',
      'advanced_analytics',
      'bulk_import_export',
      'multi_outlet',
      'ai_assistant',
      'thermal_printing',
      'qr_payment',
      'api_access',
      'custom_branding',
      'priority_support',
      'audit_logs'
    ]
  }
};

/**
 * Pre-configured Active Coupons
 */
export const MOCK_COUPONS = {
  'WELCOME50': { code: 'WELCOME50', type: 'percentage', value: 50 },
  'SAVE20': { code: 'SAVE20', type: 'fixed', value: 20 },
  'SAAS2026': { code: 'SAAS2026', type: 'percentage', value: 25 }
};
