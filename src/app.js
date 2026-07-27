import { GlobalErrorHandler } from './core/error-handler.js';
import { PWAManager } from './core/pwa-manager.js';
import { Router } from './core/router.js';
import { ToastContainerComponent } from './components/base/toast.component.js';
import { HeaderComponent } from './components/layout/header.component.js';
import { SidebarComponent } from './components/layout/sidebar.component.js';

import { tenantService } from './services/tenant.service.js';
import { authService } from './services/auth.service.js';
import { subscriptionService } from './services/subscription.service.js';
import { featureFlagService } from './services/feature-flag.service.js';

import { AuthGuard } from './guards/auth.guard.js';
import { RoleGuard } from './guards/role.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { TenantGuard } from './guards/tenant.guard.js';
import { SubscriptionGuard } from './guards/subscription.guard.js';
import { FeatureGuard } from './guards/feature.guard.js';

import { DashboardView } from './views/dashboard.view.js';
import { POSBillingView } from './views/pos-billing.view.js';
import { AuthView } from './views/auth.view.js';
import { ProductsView } from './views/products.view.js';
import { InventoryView } from './views/inventory.view.js';
import { CustomersView } from './views/customers.view.js';
import { SuppliersView } from './views/suppliers.view.js';
import { PurchasesView } from './views/purchases.view.js';
import { ExpensesView } from './views/expenses.view.js';
import { EmployeesView } from './views/employees.view.js';
import { ReportsView } from './views/reports.view.js';
import { AIAssistantView } from './views/ai-assistant.view.js';
import { NotificationsView } from './views/notifications.view.js';
import { SettingsView } from './views/settings.view.js';
import { SubscriptionView } from './views/subscription.view.js';
import { AdminView } from './views/admin/admin.view.js';
import { ForbiddenView } from './views/forbidden.view.js';
import { NotFoundView } from './views/not-found.view.js';

import { uiStore } from './store/ui.store.js';

class App {
  constructor() {
    this.router = null;
    this.pwaManager = null;
  }

  async init() {
    // 1. Initialize Error Boundary
    GlobalErrorHandler.init();

    // 2. Initialize PWA Service Worker & Network Monitor
    this.pwaManager = new PWAManager();
    await this.pwaManager.registerServiceWorker();

    // 3. Initialize Toast Container
    new ToastContainerComponent();

    // 4. Apply saved or default theme
    const theme = uiStore.getState().theme;
    document.documentElement.setAttribute('data-theme', theme);

    // 5. Initialize Auto-Login Session Recovery & Tenant Resolution
    await authService.initAutoLogin();
    const tenant = await tenantService.resolveTenant();
    await subscriptionService.loadTenantSubscription(tenant.id);
    await featureFlagService.loadTenantFlags(tenant.id);

    // 6. Build Layout Shell
    this.renderLayoutShell();

    // 7. Setup Router & Guards
    this.router = new Router('app-main-content');
    this.router.use(AuthGuard);
    this.router.use(AdminGuard);
    this.router.use(RoleGuard);
    this.router.use(TenantGuard);
    this.router.use(SubscriptionGuard);
    this.router.use(FeatureGuard);

    // Register Routes
    this.router.register('#/pos',           { component: POSBillingView, meta: { requiresAuth: true } });
    this.router.register('#/dashboard',     { component: DashboardView, meta: { requiresAuth: true } });
    this.router.register('#/products',      { component: ProductsView, meta: { requiresAuth: true } });
    this.router.register('#/inventory',     { component: InventoryView, meta: { requiresAuth: true, requiredFeature: 'inventory_tracking' } });
    this.router.register('#/customers',     { component: CustomersView, meta: { requiresAuth: true, requiredFeature: 'customer_management' } });
    this.router.register('#/suppliers',     { component: SuppliersView, meta: { requiresAuth: true } });
    this.router.register('#/purchases',     { component: PurchasesView, meta: { requiresAuth: true } });
    this.router.register('#/expenses',      { component: ExpensesView, meta: { requiresAuth: true } });
    this.router.register('#/employees',     { component: EmployeesView, meta: { requiresAuth: true, allowedRoles: ['owner', 'admin', 'manager'] } });
    this.router.register('#/reports',       { component: ReportsView, meta: { requiresAuth: true, requiredFeature: 'advanced_analytics' } });
    this.router.register('#/ai-assistant',  { component: AIAssistantView, meta: { requiresAuth: true, requiredFeature: 'ai_insights' } });
    this.router.register('#/notifications', { component: NotificationsView, meta: { requiresAuth: true } });
    this.router.register('#/settings',      { component: SettingsView, meta: { requiresAuth: true, allowedRoles: ['owner', 'admin'] } });
    this.router.register('#/subscription',  { component: SubscriptionView, meta: { requiresAuth: true, allowedRoles: ['owner', 'admin'] } });
    this.router.register('#/admin',         { component: AdminView, meta: { requiresAuth: true, requiresSuperAdmin: true } });
    
    // Auth Routes
    this.router.register('#/login', { component: () => AuthView('#/login'), meta: { requiresAuth: false } });
    this.router.register('#/signup', { component: () => AuthView('#/signup'), meta: { requiresAuth: false } });
    this.router.register('#/reset-password', { component: () => AuthView('#/reset-password'), meta: { requiresAuth: false } });

    // Fallbacks
    this.router.register('#/forbidden', { component: ForbiddenView, meta: { requiresAuth: false } });
    this.router.register('#/404', { component: NotFoundView, meta: { requiresAuth: false } });

    // Handle initial route
    await this.router.handleRoute();

    console.log('[OmniPOS App] Multi-Channel Notification Center initialized successfully.');
  }

  renderLayoutShell() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'app-layout';

    const headerComponent = new HeaderComponent();
    const sidebarComponent = new SidebarComponent();

    layout.appendChild(sidebarComponent.render());
    layout.appendChild(headerComponent.render());

    const main = document.createElement('main');
    main.id = 'app-main-content';
    main.className = 'app-main';

    layout.appendChild(main);
    appEl.appendChild(layout);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
