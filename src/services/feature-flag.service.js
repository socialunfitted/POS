import { DEFAULT_FEATURE_FLAGS } from '../config/features.config.js';
import { subscriptionStore } from '../store/subscription.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Feature Flag Service
 * Automatically evaluates feature flags based on the active plan features + tenant-specific overrides.
 */
export class FeatureFlagService {
  constructor() {
    this.flags = new Map(Object.entries(DEFAULT_FEATURE_FLAGS));

    // Re-evaluate features automatically whenever subscription plan changes
    subscriptionStore.subscribe((key, value) => {
      if (key === 'features' || key === 'planTier' || key === 'status') {
        this.syncWithSubscriptionPlan();
      }
    });
  }

  /**
   * Sync active feature toggles with current subscription store entitlements
   */
  syncWithSubscriptionPlan() {
    const { features, status } = subscriptionStore.getState();
    const isExpired = status === 'expired';

    // Reset all flags
    for (const key of Object.keys(DEFAULT_FEATURE_FLAGS)) {
      this.flags.set(key, false);
    }

    if (!isExpired && Array.isArray(features)) {
      features.forEach((feat) => {
        this.flags.set(feat, true);
      });
    }

    eventBus.emit('FEATURE_FLAGS_UPDATED', this.getAllFlags());
  }

  /**
   * Load database overrides for tenant
   * @param {string} tenantId 
   */
  async loadTenantFlags(tenantId) {
    if (!tenantId) return;

    this.syncWithSubscriptionPlan();

    const { data } = await supabaseService.executeQuery((client) =>
      client.from('tenant_feature_flags').select('feature_key, is_enabled').eq('tenant_id', tenantId)
    );

    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        this.flags.set(item.feature_key, Boolean(item.is_enabled));
      });
    }
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureKey 
   * @returns {boolean}
   */
  isEnabled(featureKey) {
    return Boolean(this.flags.get(featureKey));
  }

  /**
   * Return Map of all flags
   */
  getAllFlags() {
    const result = {};
    this.flags.forEach((val, key) => { result[key] = val; });
    return result;
  }
}

export const featureFlagService = new FeatureFlagService();
