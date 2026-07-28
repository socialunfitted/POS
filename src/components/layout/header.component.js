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
      <div class="flex items-center gap-2 md:gap-3 min-w-0">
        <button id="sidebar-toggle-btn" class="btn btn-secondary btn-sm flex-shrink-0" aria-label="Toggle Menu" title="Toggle Navigation Menu">
          <span class="text-base font-bold">☰</span>
        </button>
        <div id="store-switcher-container" class="min-w-0 flex-shrink"></div>
      </div>

      <div class="flex items-center gap-2 md:gap-3 ml-auto flex-shrink-0">
        <!-- Notification Bell Button -->
        <a href="#/notifications" id="notif-bell-btn" class="btn btn-secondary btn-sm relative p-2" title="Notification Center">
          <span>🔔</span>
          ${unreadCount > 0 ? `<span class="badge badge-danger text-xs font-bold absolute -top-1 -right-1 px-1 rounded-full" style="font-size: 9px; min-width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center;">${unreadCount}</span>` : ''}
        </a>

        <!-- Theme Toggle Button -->
        <button id="theme-toggle-btn" class="btn btn-secondary btn-sm" title="Toggle Light/Dark Theme">
          <span>${theme === 'dark' ? '☀️' : '🌙'}</span>
          <span class="hidden md:inline">${theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <!-- User Profile & Logout -->
        <div class="flex items-center gap-2">
          <div class="text-right hidden sm:block">
            <div class="font-semibold text-xs md:text-sm flex items-center gap-1.5 justify-end">
              <span class="truncate max-w-[90px] md:max-w-[140px]">${user?.fullName || 'Cashier'}</span>
              ${new BadgeComponent({ text: (role || 'CASHIER').toUpperCase(), variant: role === 'owner' ? 'primary' : 'success' }).render().outerHTML}
            </div>
          </div>
          
          <button id="logout-btn" class="btn btn-secondary btn-sm" title="Sign Out">
            <span>🚪</span>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    `;

    // Embed Store Switcher Component
    const storeContainer = header.querySelector('#store-switcher-container');
    if (storeContainer) {
      storeContainer.appendChild(new StoreSwitcherComponent().render());
    }

    // Sidebar Toggle
    header.querySelector('#sidebar-toggle-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.querySelector('.app-sidebar');
      const layout = document.querySelector('.app-layout');

      if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.toggle('mobile-open');
      } else {
        if (sidebar) sidebar.classList.remove('mobile-open');

        const currentState = uiStore.getState().isSidebarCollapsed;
        uiStore.setState({ isSidebarCollapsed: !currentState });
        if (layout) {
          layout.classList.toggle('sidebar-collapsed', !currentState);
        }
      }
    });




    // Theme Toggle
    header.querySelector('#theme-toggle-btn').addEventListener('click', () => {
      const currentTheme = uiStore.getState().theme;
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      uiStore.setState({ theme: nextTheme });
      localStorage.setItem('omnipos_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      
      const themeBtn = header.querySelector('#theme-toggle-btn');
      if (themeBtn) {
        themeBtn.innerHTML = `
          <span>${nextTheme === 'dark' ? '☀️' : '🌙'}</span>
          <span class="hidden md:inline">${nextTheme === 'dark' ? 'Light' : 'Dark'}</span>
        `;
      }
    });

    // Logout Action
    header.querySelector('#logout-btn').addEventListener('click', async () => {
      await authService.signOut();
    });

    return header;
  }
}

