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

    sidebar.innerHTML = `
      <div class="mb-6 flex items-center gap-2">
        <div style="width: 32px; height: 32px; background: var(--color-primary); border-radius: var(--radius-md);" class="flex items-center justify-center text-white font-bold">POS</div>
        <div class="font-bold text-lg">OmniPOS</div>
      </div>

      <nav class="flex flex-col gap-2 flex-1">
        <a href="#/pos" class="btn btn-primary justify-between w-full">
          <span>🧾 POS Billing</span>
          <span class="badge badge-success">LIVE</span>
        </a>
        <a href="#/dashboard" class="btn btn-secondary justify-between w-full">
          <span>📊 Dashboard</span>
        </a>
        <a href="#/products" class="btn btn-secondary justify-between w-full">
          <span>📦 Products</span>
        </a>
        <a href="#/inventory" class="btn btn-secondary justify-between w-full">
          <span>🏬 Inventory</span>
        </a>
        <a href="#/customers" class="btn btn-secondary justify-between w-full">
          <span>👥 Customers</span>
        </a>
        <a href="#/suppliers" class="btn btn-secondary justify-between w-full">
          <span>🚛 Suppliers</span>
        </a>
        <a href="#/purchases" class="btn btn-secondary justify-between w-full">
          <span>🛒 Purchases</span>
        </a>
        <a href="#/expenses" class="btn btn-secondary justify-between w-full">
          <span>💸 Expenses</span>
        </a>
        <a href="#/employees" class="btn btn-secondary justify-between w-full">
          <span>👔 Employees</span>
        </a>
        <a href="#/reports" class="btn btn-secondary justify-between w-full">
          <span>📈 Reports</span>
        </a>
        <a href="#/ai-assistant" class="btn btn-secondary justify-between w-full">
          <span>🤖 AI Assistant</span>
          <span class="badge badge-primary">AI</span>
        </a>
        <a href="#/notifications" class="btn btn-secondary justify-between w-full">
          <span>🔔 Notifications</span>
          ${unreadCount > 0 ? `<span class="badge badge-danger">${unreadCount} NEW</span>` : ''}
        </a>
        <a href="#/subscription" class="btn btn-secondary justify-between w-full">
          <span>💳 Subscription</span>
          <span class="badge badge-primary">${planTier.toUpperCase()}</span>
        </a>
        <a href="#/settings" class="btn btn-secondary justify-between w-full">
          <span>⚙️ Settings</span>
        </a>
        ${isSuperAdmin ? `
          <a href="#/admin" class="btn btn-primary justify-between w-full mt-2">
            <span>👑 Super Admin</span>
            <span class="badge badge-success">PLATFORM</span>
          </a>
        ` : ''}
      </nav>

      <div class="card p-3 mt-auto bg-tertiary">
        <div class="text-xs text-muted">Subscription Plan</div>
        <div class="font-bold text-sm text-primary uppercase">${planTier} PLAN</div>
      </div>
    `;

    return sidebar;
  }
}
