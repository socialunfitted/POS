import { Store } from '../core/store.js';

export const authStore = new Store({
  isAuthenticated: false,
  user: null, // { id, email, fullName, avatarUrl }
  session: null,
  token: null, // JWT Access Token
  role: 'cashier', // owner | admin | manager | cashier
  availableTenants: [], // Array of store memberships: [{ id, name, role }]
  activeTenantId: null,
  emailVerified: true,
  rememberMe: localStorage.getItem('omnipos_remember_me') !== 'false',
  isLoading: false,
  error: null
});
