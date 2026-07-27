import { SUBSCRIPTION_PLANS, MOCK_COUPONS } from '../config/subscription.config.js';
import { subscriptionStore } from '../store/subscription.store.js';
import { featureFlagService } from './feature-flag.service.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Enterprise SaaS Subscription Service
 * Handles plan switching, trial lifecycles, renewal reminders, coupons, payment ledger & invoices.
 */
export class SubscriptionService {
  /**
   * Load active subscription plan for tenant from DB or state defaults
   * @param {string} tenantId 
   */
  async loadTenantSubscription(tenantId) {
    subscriptionStore.setState({ isLoading: true });

    const { data: subData } = await supabaseService.executeQuery((client) =>
      client.from('subscriptions').select('*').eq('tenant_id', tenantId).single()
    );

    const planTierKey = (subData?.plan_tier || 'STARTER').toUpperCase();
    const planConfig = SUBSCRIPTION_PLANS[planTierKey] || SUBSCRIPTION_PLANS.STARTER;

    const renewsAt = subData?.renews_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const trialEndsAt = subData?.trial_ends_at || null;
    const status = subData?.status || 'active';

    const daysRemaining = this.calculateDaysRemaining(renewsAt);

    subscriptionStore.setState({
      planTier: planConfig.id,
      status,
      billingCycle: subData?.billing_cycle || 'monthly',
      renewsAt,
      trialEndsAt,
      daysRemaining,
      limits: {
        maxUsers: subData?.max_users || planConfig.maxUsers,
        maxRegisters: subData?.max_registers || planConfig.maxRegisters,
        maxProducts: subData?.max_products || planConfig.maxProducts,
        maxOutlets: subData?.max_outlets || planConfig.maxOutlets
      },
      features: planConfig.features,
      isLoading: false
    });

    featureFlagService.syncWithSubscriptionPlan();
    this.checkRenewalReminder();
  }

  /**
   * Calculate remaining days until expiration or renewal
   * @param {string} dateStr 
   * @returns {number}
   */
  calculateDaysRemaining(dateStr) {
    if (!dateStr) return 30;
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Fire notification if subscription or trial expires within 7 days
   */
  checkRenewalReminder() {
    const { daysRemaining, planTier, status } = subscriptionStore.getState();

    if (status === 'expired') {
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'error',
        title: 'Subscription Expired',
        message: 'Your SaaS subscription has expired. Please upgrade or renew to unlock features.',
        duration: 8000
      });
    } else if (daysRemaining <= 7 && daysRemaining > 0) {
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'warning',
        title: 'Renewal Reminder',
        message: `Your ${planTier.toUpperCase()} plan renews in ${daysRemaining} day(s).`,
        duration: 6000
      });
    }
  }

  /**
   * Upgrade or Downgrade Subscription Plan
   * @param {string} newPlanId - 'free'|'starter'|'professional'|'business'|'enterprise'
   * @param {string} cycle - 'monthly'|'annual'
   * @param {string} couponCode 
   */
  async changePlan(newPlanId, cycle = 'monthly', couponCode = '') {
    subscriptionStore.setState({ isLoading: true });

    const targetKey = newPlanId.toUpperCase();
    const planConfig = SUBSCRIPTION_PLANS[targetKey];

    if (!planConfig) {
      subscriptionStore.setState({ isLoading: false });
      return { success: false, error: 'Invalid plan selected.' };
    }

    // Coupon discount logic
    const coupon = couponCode ? this.validateCoupon(couponCode, cycle === 'annual' ? planConfig.annualPrice : planConfig.monthlyPrice) : null;
    const basePrice = cycle === 'annual' ? planConfig.annualPrice : planConfig.monthlyPrice;
    const discountAmount = coupon ? coupon.discountAmount : 0;
    const finalAmount = Math.max(0, basePrice - discountAmount);

    const renewsAt = new Date(Date.now() + (cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

    // Update store state immediately for instant reactive feature toggling
    subscriptionStore.setState({
      planTier: planConfig.id,
      status: 'active',
      billingCycle: cycle,
      renewsAt,
      daysRemaining: cycle === 'annual' ? 365 : 30,
      limits: {
        maxUsers: planConfig.maxUsers,
        maxRegisters: planConfig.maxRegisters,
        maxProducts: planConfig.maxProducts,
        maxOutlets: planConfig.maxOutlets
      },
      features: planConfig.features,
      appliedCoupon: coupon ? coupon.code : null,
      isLoading: false
    });

    // Record payment in transaction history
    const invNo = `INV-SUB-${Date.now().toString().slice(-6)}`;
    const newPayment = {
      id: `pay-${Date.now()}`,
      invoiceNumber: invNo,
      date: new Date().toISOString().split('T')[0],
      amount: `$${finalAmount.toFixed(2)}`,
      planName: planConfig.name,
      billingCycle: cycle,
      status: 'paid',
      couponCode: coupon ? coupon.code : null,
      receiptUrl: '#'
    };

    const currentHistory = subscriptionStore.getState().paymentHistory;
    subscriptionStore.setState({ paymentHistory: [newPayment, ...currentHistory] });

    // Sync features
    featureFlagService.syncWithSubscriptionPlan();

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Plan Updated',
      message: `Successfully updated to ${planConfig.name} (${cycle}). All plan features are now active!`
    });

    return { success: true, plan: planConfig, invoice: newPayment };
  }

  /**
   * Start 14-Day Free Trial for a Plan
   * @param {string} planId 
   */
  startFreeTrial(planId = 'professional') {
    const planConfig = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.PROFESSIONAL;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    subscriptionStore.setState({
      planTier: planConfig.id,
      status: 'trialing',
      trialEndsAt,
      renewsAt: trialEndsAt,
      daysRemaining: 14,
      limits: {
        maxUsers: planConfig.maxUsers,
        maxRegisters: planConfig.maxRegisters,
        maxProducts: planConfig.maxProducts,
        maxOutlets: planConfig.maxOutlets
      },
      features: planConfig.features
    });

    featureFlagService.syncWithSubscriptionPlan();

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Free Trial Activated',
      message: `14-day Free Trial started for ${planConfig.name}. Enjoy full access!`
    });
  }

  /**
   * Validate Coupon Code against plan price
   * @param {string} code 
   * @param {number} basePrice 
   */
  validateCoupon(code, basePrice) {
    if (!code) return null;
    const coupon = MOCK_COUPONS[code.trim().toUpperCase()];
    if (!coupon) return null;

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (basePrice * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    }

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      finalPrice: Math.max(0, basePrice - discountAmount)
    };
  }

  /**
   * Check entitlement for feature key
   * @param {string} featureKey 
   */
  hasFeatureEntitlement(featureKey) {
    const { features, status } = subscriptionStore.getState();
    if (status === 'expired') return false;
    return Array.isArray(features) && features.includes(featureKey);
  }
}

export const subscriptionService = new SubscriptionService();
