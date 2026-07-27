import { subscriptionService } from '../services/subscription.service.js';
import { subscriptionStore } from '../store/subscription.store.js';

/**
 * Subscription Tier & Entitlement Guard
 */
export async function SubscriptionGuard(route, context) {
  const { status } = subscriptionStore.getState();

  // If subscription is expired, block access to protected routes
  if (status === 'expired' && route.meta?.requiresAuth && route.path !== '#/subscription') {
    context.redirectPath = '#/subscription';
    return false;
  }

  if (route.meta?.requiredPlan) {
    const featureKey = route.meta.requiredPlan;
    if (!subscriptionService.hasFeatureEntitlement(featureKey)) {
      context.redirectPath = '#/forbidden';
      return false;
    }
  }
  return true;
}
