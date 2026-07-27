import { tenantStore } from '../store/tenant.store.js';

/**
 * Multi-Tenant Middleware Guard
 */
export async function TenantGuard(route, context) {
  if (route.meta?.tenantOnly) {
    const { tenant } = tenantStore.getState();
    if (!tenant) {
      context.redirectPath = '#/login';
      return false;
    }
  }
  return true;
}
