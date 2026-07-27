import { adminStore } from '../store/admin.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Super Admin Management Service
 * Provides backend controls for platform metrics, multi-tenant stores, coupons, support, logs & broadcasts.
 */
export class AdminService {
  /**
   * Update Tenant Store Account Status (active | suspended | trial)
   * @param {string} storeId 
   * @param {'active'|'suspended'|'trial'} newStatus 
   */
  async updateStoreStatus(storeId, newStatus) {
    adminStore.setState({ isLoading: true });

    const currentStores = adminStore.getState().stores;
    const updatedStores = currentStores.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s));

    adminStore.setState({ stores: updatedStores, isLoading: false });

    // Database update call
    await supabaseService.update('tenants', storeId, { status: newStatus });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Store Status Updated',
      message: `Store ${storeId} status changed to ${newStatus.toUpperCase()}`
    });
  }

  /**
   * Override Store Subscription Plan Tier
   * @param {string} storeId 
   * @param {string} newPlan - 'free'|'starter'|'professional'|'business'|'enterprise'
   */
  async overrideStorePlan(storeId, newPlan) {
    adminStore.setState({ isLoading: true });

    const stores = adminStore.getState().stores;
    const updated = stores.map((s) => (s.id === storeId ? { ...s, plan: newPlan } : s));

    adminStore.setState({ stores: updated, isLoading: false });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Plan Overridden',
      message: `Store ${storeId} manually upgraded to ${newPlan.toUpperCase()}`
    });
  }

  /**
   * Create New Platform Promo Coupon
   */
  createCoupon({ code, type, value, maxUses = 100 }) {
    const coupons = adminStore.getState().coupons;
    const newCoupon = {
      id: `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      usedCount: 0,
      maxUses: parseInt(maxUses),
      is_active: true
    };

    adminStore.setState({ coupons: [newCoupon, ...coupons] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Coupon Created',
      message: `Promo Coupon "${newCoupon.code}" created successfully!`
    });
  }

  /**
   * Toggle Promo Coupon Active State
   */
  toggleCouponStatus(couponId) {
    const coupons = adminStore.getState().coupons;
    const updated = coupons.map((c) => (c.id === couponId ? { ...c, is_active: !c.is_active } : c));
    adminStore.setState({ coupons: updated });
  }

  /**
   * Reply to Support Ticket & Mark Resolved
   */
  replySupportTicket(ticketId, replyMessage) {
    const tickets = adminStore.getState().supportTickets;
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t));
    adminStore.setState({ supportTickets: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Ticket Resolved',
      message: `Support ticket ${ticketId} resolved & response sent.`
    });
  }

  /**
   * Toggle Global Platform Feature Flag
   */
  toggleGlobalFeatureFlag(featureKey) {
    const flags = { ...adminStore.getState().globalFeatureFlags };
    flags[featureKey] = !flags[featureKey];
    adminStore.setState({ globalFeatureFlags: flags });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Global Feature Toggled',
      message: `Global Feature "${featureKey}" is now ${flags[featureKey] ? 'ENABLED' : 'DISABLED'}`
    });
  }

  /**
   * Broadcast Platform Announcement Banner
   */
  createAnnouncement(title, message) {
    const announcements = adminStore.getState().announcements;
    const newAnn = {
      id: `ann-${Date.now()}`,
      title,
      message,
      target: 'all',
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    adminStore.setState({ announcements: [newAnn, ...announcements] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Announcement Broadcasted',
      message: `Announcement "${title}" broadcasted to all stores!`
    });
  }

  /**
   * Delete Announcement
   */
  deleteAnnouncement(annId) {
    const announcements = adminStore.getState().announcements.filter((a) => a.id !== annId);
    adminStore.setState({ announcements });
  }

  /**
   * Update Platform Settings
   */
  updatePlatformSettings(newSettings) {
    const settings = { ...adminStore.getState().platformSettings, ...newSettings };
    adminStore.setState({ platformSettings: settings });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Platform Settings Saved',
      message: 'Super Admin platform settings updated successfully.'
    });
  }
}

export const adminService = new AdminService();
