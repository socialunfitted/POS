import { Store } from '../core/store.js';

export const uiStore = new Store({
  theme: localStorage.getItem('omnipos_theme') || 'light',
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  activeModal: null,
  notifications: []
});
