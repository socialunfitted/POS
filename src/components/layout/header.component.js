import { uiStore } from '../../store/ui.store.js';
import { authStore } from '../../store/auth.store.js';
import { notificationsStore } from '../../store/notifications.store.js';
import { authService } from '../../services/auth.service.js';
import { StoreSwitcherComponent } from './store-switcher.component.js';
import { BadgeComponent } from '../base/badge.component.js';

export class HeaderComponent {
  render() {
    const header = document.createElement('header');
    header.className = 'app-header';

    const { user, role } = authStore.getState();
    const { theme } = uiStore.getState();
    const { unreadCount } = notificationsStore.getState();

    header.innerHTML = `
      <div class="flex items-center gap-4">
        <button id="sidebar-toggle-btn" class="btn btn-secondary btn-sm">
          <span>☰</span>
        </button>
        <div id="store-switcher-container"></div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Notification Bell Button -->
        <a href="#/notifications" id="notif-bell-btn" class="btn btn-secondary btn-sm relative" title="Notification Center">
          <span>🔔</span>
          ${unreadCount > 0 ? `<span class="badge badge-danger text-xs font-bold" style="padding: 1px 5px; font-size: 10px;">${unreadCount}</span>` : ''}
        </a>

        <button id="theme-toggle-btn" class="btn btn-secondary btn-sm">
          <span>${theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
        </button>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="font-semibold text-sm flex items-center gap-2 justify-end">
              <span>${user?.fullName || 'Cashier'}</span>
              ${new BadgeComponent({ text: (role || 'CASHIER').toUpperCase(), variant: role === 'owner' ? 'primary' : 'success' }).render().outerHTML}
            </div>
            <div class="text-xs text-muted">${user?.email || 'user@pos.local'}</div>
          </div>
          <button id="logout-btn" class="btn btn-secondary btn-sm" title="Sign Out">
            <span>🚪 Logout</span>
          </button>
        </div>
      </div>
    `;

    // Embed Store Switcher Component
    header.querySelector('#store-switcher-container').appendChild(new StoreSwitcherComponent().render());

    // Sidebar Toggle
    header.querySelector('#sidebar-toggle-btn').addEventListener('click', () => {
      const currentState = uiStore.getState().isSidebarCollapsed;
      uiStore.setState({ isSidebarCollapsed: !currentState });
      const layout = document.querySelector('.app-layout');
      if (layout) {
        layout.classList.toggle('sidebar-collapsed', !currentState);
      }
    });

    // Theme Toggle
    header.querySelector('#theme-toggle-btn').addEventListener('click', () => {
      const currentTheme = uiStore.getState().theme;
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      uiStore.setState({ theme: nextTheme });
      localStorage.setItem('omnipos_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    });

    // Logout Action
    header.querySelector('#logout-btn').addEventListener('click', async () => {
      await authService.signOut();
    });

    return header;
  }
}
