import { authStore } from '../store/auth.store.js';
import { adminStore } from '../store/admin.store.js';

/**
 * Super Admin Security Route Guard
 * Verifies that the logged-in user possesses super admin authorization.
 */
export async function AdminGuard(route, context) {
  if (route.meta?.requiresSuperAdmin) {
    const { role } = authStore.getState();
    const { isSuperAdmin } = adminStore.getState();

    if (!isSuperAdmin || (role !== 'owner' && role !== 'admin')) {
      context.redirectPath = '#/forbidden';
      return false;
    }
  }
  return true;
}
