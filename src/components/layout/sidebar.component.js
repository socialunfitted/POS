import { subscriptionStore } from '../../store/subscription.store.js';
import { authStore } from '../../store/auth.store.js';
import { notificationsStore } from '../../store/notifications.store.js';

export class SidebarComponent {
  render() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar p-4';

    const { planTier } = subscriptionStore.getState();
    const { role } = authStore.getState();
    const { unreadCount } = notificationsStore.getState();

    const isSuperAdmin = role === 'owner' || role === 'admin';
    const currentHash = window.location.hash || '#/dashboard';

    sidebar.innerHTML = `
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div style="width: 32px; height: 32px; background: var(--color-primary); border-radius: var(--radius-md);" class="flex items-center justify-center text-white font-bold shadow-sm">POS</div>
          <div class="font-bold text-lg text-primary">OmniPOS</div>
        </div>
        <button id="sidebar-close-btn" class="btn btn-secondary btn-sm md:hidden p-1.5" title="Close Navigation Menu">
          <span>✕</span>
        </button>
      </div>

      <nav class="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
        <a href="#/pos" class="btn ${currentHash === '#/pos' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🧾</span> <span>POS Billing</span></span>
          <span class="badge badge-success">LIVE</span>
        </a>
        <a href="#/dashboard" class="btn ${currentHash === '#/dashboard' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>📊</span> <span>Dashboard</span></span>
        </a>
        <a href="#/products" class="btn ${currentHash === '#/products' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>📦</span> <span>Products</span></span>
        </a>
        <a href="#/inventory" class="btn ${currentHash === '#/inventory' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🏬</span> <span>Inventory</span></span>
        </a>
        <a href="#/customers" class="btn ${currentHash === '#/customers' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>👥</span> <span>Customers</span></span>
        </a>
        <a href="#/suppliers" class="btn ${currentHash === '#/suppliers' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🚛</span> <span>Suppliers</span></span>
        </a>
        <a href="#/purchases" class="btn ${currentHash === '#/purchases' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🛒</span> <span>Purchases</span></span>
        </a>
        <a href="#/expenses" class="btn ${currentHash === '#/expenses' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>💸</span> <span>Expenses</span></span>
        </a>
        <a href="#/employees" class="btn ${currentHash === '#/employees' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>👔</span> <span>Employees</span></span>
        </a>
        <a href="#/reports" class="btn ${currentHash === '#/reports' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>📈</span> <span>Reports</span></span>
        </a>
        <a href="#/ai-assistant" class="btn ${currentHash === '#/ai-assistant' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🤖</span> <span>AI Assistant</span></span>
          <span class="badge badge-primary">AI</span>
        </a>
        <a href="#/notifications" class="btn ${currentHash === '#/notifications' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>🔔</span> <span>Notifications</span></span>
          ${unreadCount > 0 ? `<span class="badge badge-danger">${unreadCount} NEW</span>` : ''}
        </a>
        <a href="#/subscription" class="btn ${currentHash === '#/subscription' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>💳</span> <span>Subscription</span></span>
          <span class="badge badge-primary">${planTier.toUpperCase()}</span>
        </a>
        <a href="#/settings" class="btn ${currentHash === '#/settings' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full">
          <span class="flex items-center gap-2"><span>⚙️</span> <span>Settings</span></span>
        </a>
        ${isSuperAdmin ? `
          <a href="#/admin" class="btn ${currentHash === '#/admin' ? 'btn-primary active' : 'btn-secondary'} justify-between w-full mt-2">
            <span class="flex items-center gap-2"><span>👑</span> <span>Super Admin</span></span>
            <span class="badge badge-success">PLATFORM</span>
          </a>
        ` : ''}
      </nav>

      <div class="card p-3 mt-auto bg-tertiary">
        <div class="text-xs text-muted">Subscription Plan</div>
        <div class="font-bold text-sm text-primary uppercase">${planTier} PLAN</div>
      </div>
    `;

    const closeMobileSidebar = () => {
      sidebar.classList.remove('mobile-open');
    };

    // Close button click handler
    const closeBtn = sidebar.querySelector('#sidebar-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileSidebar);
    }

    // Programmatic mobile navigation on link click
    sidebar.querySelectorAll('nav a').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href) {
          window.location.hash = href;
        }
        if (window.innerWidth <= 768) {
          closeMobileSidebar();
        }
      });
    });



    return sidebar;
  }
}

