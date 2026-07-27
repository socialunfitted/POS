import { authStore } from '../store/auth.store.js';

/**
 * Role-Based Access Control (RBAC) Route Guard Middleware
 * Evaluates route.meta.allowedRoles (e.g. ['owner', 'admin']) against current user role.
 */
export async function RoleGuard(route, context) {
  if (route.meta?.allowedRoles && Array.isArray(route.meta.allowedRoles)) {
    const { role } = authStore.getState();

    if (!role || !route.meta.allowedRoles.includes(role)) {
      context.redirectPath = '#/forbidden';
      return false;
    }
  }
  return true;
}
