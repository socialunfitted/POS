import { featureFlagService } from '../services/feature-flag.service.js';

/**
 * Feature Toggle Middleware Guard
 */
export async function FeatureGuard(route, context) {
  if (route.meta?.requiredFeature) {
    if (!featureFlagService.isEnabled(route.meta.requiredFeature)) {
      context.redirectPath = '#/forbidden';
      return false;
    }
  }
  return true;
}
