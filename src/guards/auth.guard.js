import { authStore } from '../store/auth.store.js';
import { authService } from '../services/auth.service.js';

/**
 * Authentication Middleware Guard
 * Validates session & token status. Redirects unauthenticated users to #/login.
 */
export async function AuthGuard(route, context) {
  if (route.meta?.requiresAuth) {
    const { isAuthenticated, token } = authStore.getState();

    // Check if token is expired and needs auto-refresh
    if (token && authService.isTokenExpired(token)) {
      const refreshed = await authService.initAutoLogin();
      if (!refreshed) {
        context.redirectPath = '#/login';
        return false;
      }
    }

    if (!isAuthenticated) {
      context.redirectPath = '#/login';
      return false;
    }
  }
  return true;
}
