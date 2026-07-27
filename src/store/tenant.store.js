import { Store } from '../core/store.js';

export const tenantStore = new Store({
  tenant: null,
  currency: 'USD',
  taxRate: 0,
  isLoading: false
});
