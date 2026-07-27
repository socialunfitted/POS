import { adminStore } from '../../store/admin.store.js';
import { adminService } from '../../services/admin.service.js';
import { CardComponent } from '../../components/base/card.component.js';
import { BadgeComponent } from '../../components/base/badge.component.js';
import { ButtonComponent } from '../../components/base/button.component.js';
import { InputComponent } from '../../components/base/input.component.js';
import { TableComponent } from '../../components/base/table.component.js';
import { ModalComponent } from '../../components/base/modal.component.js';
import { SwitchComponent } from '../../components/base/switch.component.js';

export async function AdminView() {
  const container = document.createElement('div');
  container.className = 'admin-control-panel flex flex-col gap-6';

  let activeTab = 'dashboard'; // 13 modules: dashboard | stores | subscriptions | payments | revenue | coupons | support | analytics | feature-toggle | system-logs | ai-usage | announcements | settings

  const modulesList = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'stores', label: '🏪 Stores' },
    { id: 'subscriptions', label: '💳 Subscriptions' },
    { id: 'payments', label: '💰 Payments' },
    { id: 'revenue', label: '📈 Revenue' },
    { id: 'coupons', label: '🎟️ Coupons' },
    { id: 'support', label: '🎧 Support' },
    { id: 'analytics', label: '⚡ Analytics' },
    { id: 'feature-toggle', label: '🎛️ Feature Flags' },
    { id: 'system-logs', label: '📜 System Logs' },
    { id: 'ai-usage', label: '🤖 AI Usage' },
    { id: 'announcements', label: '📢 Broadcasts' },
    { id: 'settings', label: '⚙️ Settings' }
  ];

  // Render Top Header Banner
  const headerCard = new CardComponent({
    title: '👑 Super Admin Platform Control Center',
    subtitle: 'Global multi-tenant SaaS administration, analytics, subscriptions & system settings',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2">
          ${new BadgeComponent({ text: 'Super Admin: Authorized', variant: 'primary' }).render().outerHTML}
          ${new BadgeComponent({ text: 'Platform: Healthy', variant: 'success' }).render().outerHTML}
        </div>
        <div class="text-xs text-secondary font-mono">System Time: ${new Date().toLocaleDateString()}</div>
      </div>
    `
  }).render();

  container.appendChild(headerCard);

  // Render Sub-Module Tabs Navigation Bar
  const navCard = document.createElement('div');
  navCard.className = 'card p-3 bg-secondary overflow-x-auto';

  const navFlex = document.createElement('div');
  navFlex.className = 'flex gap-2 flex-nowrap';

  const contentArea = document.createElement('div');
  contentArea.className = 'admin-module-content flex flex-col gap-6';

  const renderTabs = () => {
    navFlex.innerHTML = '';
    modulesList.forEach((mod) => {
      const btn = document.createElement('button');
      const isActive = mod.id === activeTab;
      btn.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`;
      btn.textContent = mod.label;
      btn.addEventListener('click', () => {
        activeTab = mod.id;
        renderTabs();
        renderModuleContent();
      });
      navFlex.appendChild(btn);
    });
  };

  navCard.appendChild(navFlex);
  container.appendChild(navCard);
  container.appendChild(contentArea);

  // Render Active Sub-Module Content
  const renderModuleContent = () => {
    contentArea.innerHTML = '';

    switch (activeTab) {
      case 'dashboard':
        contentArea.appendChild(renderDashboardModule());
        break;
      case 'stores':
        contentArea.appendChild(renderStoresModule());
        break;
      case 'subscriptions':
        contentArea.appendChild(renderSubscriptionsModule());
        break;
      case 'payments':
        contentArea.appendChild(renderPaymentsModule());
        break;
      case 'revenue':
        contentArea.appendChild(renderRevenueModule());
        break;
      case 'coupons':
        contentArea.appendChild(renderCouponsModule());
        break;
      case 'support':
        contentArea.appendChild(renderSupportModule());
        break;
      case 'analytics':
        contentArea.appendChild(renderAnalyticsModule());
        break;
      case 'feature-toggle':
        contentArea.appendChild(renderFeatureToggleModule());
        break;
      case 'system-logs':
        contentArea.appendChild(renderSystemLogsModule());
        break;
      case 'ai-usage':
        contentArea.appendChild(renderAIUsageModule());
        break;
      case 'announcements':
        contentArea.appendChild(renderAnnouncementsModule());
        break;
      case 'settings':
        contentArea.appendChild(renderSettingsModule());
        break;
      default:
        contentArea.appendChild(renderDashboardModule());
    }
  };

  // 1. Dashboard Sub-Module
  const renderDashboardModule = () => {
    const { metrics } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-6';

    const kpiGrid = document.createElement('div');
    kpiGrid.style.display = 'grid';
    kpiGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    kpiGrid.style.gap = 'var(--space-4)';

    const cardsData = [
      { title: 'Monthly Recurring (MRR)', val: `$${metrics.mrr.toLocaleString()}`, badge: '+12.4% mo' },
      { title: 'Annual Recurring (ARR)', val: `$${metrics.arr.toLocaleString()}`, badge: 'Healthy' },
      { title: 'Total Active Stores', val: metrics.totalStores, badge: 'Multi-Tenant' },
      { title: 'Active Subscriptions', val: metrics.activeSubscriptions, badge: '90.1% Rate' },
      { title: 'Daily POS Sales Count', val: metrics.dailyBillsCount.toLocaleString(), badge: 'Realtime' }
    ];

    cardsData.forEach((cd) => {
      const card = new CardComponent({
        title: cd.title,
        content: `
          <div class="flex items-center justify-between mt-2">
            <span class="text-2xl font-bold text-primary">${cd.val}</span>
            <span class="badge badge-success">${cd.badge}</span>
          </div>
        `
      }).render();
      kpiGrid.appendChild(card);
    });

    wrap.appendChild(kpiGrid);
    return wrap;
  };

  // 2. Stores Management Sub-Module
  const renderStoresModule = () => {
    const { stores } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-4';

    const card = new CardComponent({
      title: 'Multi-Tenant Store Management',
      subtitle: 'Monitor, suspend, activate, or override plans for all stores',
      content: `<div id="stores-table-container"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'name', title: 'Store Name' },
        { key: 'owner', title: 'Owner' },
        { key: 'email', title: 'Email' },
        { key: 'plan', title: 'Plan', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge ${val === 'active' ? 'badge-success' : 'badge-danger'}">${val.toUpperCase()}</span>` },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const flex = document.createElement('div');
            flex.className = 'flex gap-2';

            const toggleBtn = new ButtonComponent({
              text: row.status === 'active' ? 'Suspend' : 'Activate',
              variant: row.status === 'active' ? 'danger' : 'primary',
              size: 'sm',
              onClick: () => {
                adminService.updateStoreStatus(row.id, row.status === 'active' ? 'suspended' : 'active');
                renderModuleContent();
              }
            }).render();

            const overrideBtn = new ButtonComponent({
              text: 'Override Plan',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openPlanOverrideModal(row)
            }).render();

            flex.appendChild(toggleBtn);
            flex.appendChild(overrideBtn);
            return flex;
          }
        }
      ],
      data: stores
    }).render();

    card.querySelector('#stores-table-container').appendChild(table);
    wrap.appendChild(card);
    return wrap;
  };

  // Plan Override Modal
  const openPlanOverrideModal = (store) => {
    let selectedPlan = store.plan;

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4';
    content.innerHTML = `
      <p class="text-sm text-secondary">Manually set subscription plan tier for <strong>${store.name}</strong>:</p>
      <select class="select-field" id="override-select">
        <option value="free" ${store.plan === 'free' ? 'selected' : ''}>Free Plan</option>
        <option value="starter" ${store.plan === 'starter' ? 'selected' : ''}>Starter Plan</option>
        <option value="professional" ${store.plan === 'professional' ? 'selected' : ''}>Professional Plan</option>
        <option value="business" ${store.plan === 'business' ? 'selected' : ''}>Business Plan</option>
        <option value="enterprise" ${store.plan === 'enterprise' ? 'selected' : ''}>Enterprise Plan</option>
      </select>
      <div id="save-override-wrapper" class="mt-2"></div>
    `;

    const modal = new ModalComponent({
      title: `Override Plan - ${store.name}`,
      content
    });
    modal.open();

    const saveBtn = new ButtonComponent({
      text: 'Save Plan Override',
      variant: 'primary',
      onClick: () => {
        const select = content.querySelector('#override-select');
        adminService.overrideStorePlan(store.id, select.value);
        modal.close();
        renderModuleContent();
      }
    }).render();

    content.querySelector('#save-override-wrapper').appendChild(saveBtn);
  };

  // 3. Subscriptions Ledger Sub-Module
  const renderSubscriptionsModule = () => {
    const { subscriptions } = adminStore.getState();
    const card = new CardComponent({
      title: 'Global Subscriptions Ledger',
      content: `<div id="sub-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'tenantId', title: 'Tenant ID' },
        { key: 'storeName', title: 'Store' },
        { key: 'plan', title: 'Plan Tier', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'cycle', title: 'Cycle' },
        { key: 'amount', title: 'Amount' },
        { key: 'renewsAt', title: 'Renews At' },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` }
      ],
      data: subscriptions
    }).render();

    card.querySelector('#sub-table').appendChild(table);
    return card;
  };

  // 4. Payments Sub-Module
  const renderPaymentsModule = () => {
    const { payments } = adminStore.getState();
    const card = new CardComponent({
      title: 'Global SaaS Payment Transactions',
      content: `<div id="pay-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'invoiceNumber', title: 'Invoice #' },
        { key: 'storeName', title: 'Store Name' },
        { key: 'amount', title: 'Amount' },
        { key: 'method', title: 'Payment Method' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` }
      ],
      data: payments
    }).render();

    card.querySelector('#pay-table').appendChild(table);
    return card;
  };

  // 5. Revenue Analytics Sub-Module
  const renderRevenueModule = () => {
    const { metrics } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'grid-pos-layout';

    const card1 = new CardComponent({
      title: 'Financial Revenue Metrics',
      content: `
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Monthly Recurring Revenue (MRR)</span>
            <span class="font-bold text-xl text-primary">$${metrics.mrr.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Annual Recurring Revenue (ARR)</span>
            <span class="font-bold text-xl text-primary">$${metrics.arr.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Average Revenue Per User (ARPU)</span>
            <span class="font-bold text-xl text-primary">$${metrics.arpu.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Net Revenue Churn Rate</span>
            <span class="font-bold text-xl text-success">${metrics.churnRate}%</span>
          </div>
        </div>
      `
    }).render();

    wrap.appendChild(card1);
    return wrap;
  };

  // 6. Coupons Manager Sub-Module
  const renderCouponsModule = () => {
    const { coupons } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-6';

    let couponCode = '';
    let discountType = 'percentage';
    let discountVal = 20;

    const createCard = new CardComponent({
      title: 'Create Promo Coupon',
      content: `
        <div class="flex items-center gap-4 flex-wrap">
          <div id="code-input" class="flex-1"></div>
          <div class="input-group" style="width: 150px;">
            <label class="input-label">Type</label>
            <select class="select-field" id="type-select">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div id="val-input" style="width: 120px;"></div>
          <div id="create-coupon-btn" class="mt-4"></div>
        </div>
      `
    }).render();

    const codeIn = new InputComponent({ label: 'Coupon Code', placeholder: 'e.g. SUMMER30', onChange: (v) => { couponCode = v; } }).render();
    const valIn = new InputComponent({ label: 'Value', type: 'number', value: discountVal, onChange: (v) => { discountVal = v; } }).render();
    const btn = new ButtonComponent({
      text: 'Create Coupon',
      variant: 'primary',
      onClick: () => {
        if (couponCode) {
          adminService.createCoupon({ code: couponCode, type: discountType, value: discountVal });
          renderModuleContent();
        }
      }
    }).render();

    createCard.querySelector('#code-input').appendChild(codeIn);
    createCard.querySelector('#val-input').appendChild(valIn);
    createCard.querySelector('#create-coupon-btn').appendChild(btn);

    createCard.querySelector('#type-select').addEventListener('change', (e) => {
      discountType = e.target.value;
    });

    wrap.appendChild(createCard);

    const listCard = new CardComponent({
      title: 'Active Platform Coupons',
      content: `<div id="coupons-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'code', title: 'Coupon Code', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'type', title: 'Discount Type' },
        { key: 'value', title: 'Discount Value', render: (val, row) => row.type === 'percentage' ? `${val}%` : `$${val}` },
        { key: 'usedCount', title: 'Redemptions', render: (val, row) => `${val} / ${row.maxUses}` },
        { key: 'is_active', title: 'Status', render: (val) => `<span class="badge ${val ? 'badge-success' : 'badge-danger'}">${val ? 'ACTIVE' : 'DISABLED'}</span>` }
      ],
      data: coupons
    }).render();

    listCard.querySelector('#coupons-table').appendChild(table);
    wrap.appendChild(listCard);
    return wrap;
  };

  // 7. Support Tickets Sub-Module
  const renderSupportModule = () => {
    const { supportTickets } = adminStore.getState();
    const card = new CardComponent({
      title: 'Platform Support Tickets Queue',
      content: `<div id="tickets-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'id', title: 'Ticket ID' },
        { key: 'storeName', title: 'Store Name' },
        { key: 'subject', title: 'Subject' },
        { key: 'priority', title: 'Priority', render: (val) => `<span class="badge ${val === 'high' ? 'badge-danger' : 'badge-primary'}">${val.toUpperCase()}</span>` },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge ${val === 'open' ? 'badge-warning' : 'badge-success'}">${val.toUpperCase()}</span>` },
        {
          key: 'action',
          title: 'Resolve',
          render: (_, row) => {
            if (row.status === 'resolved') return '<span class="text-xs text-muted">✓ Closed</span>';
            const btn = new ButtonComponent({
              text: 'Reply & Resolve',
              variant: 'primary',
              size: 'sm',
              onClick: () => {
                adminService.replySupportTicket(row.id, 'Support response sent.');
                renderModuleContent();
              }
            }).render();
            return btn;
          }
        }
      ],
      data: supportTickets
    }).render();

    card.querySelector('#tickets-table').appendChild(table);
    return card;
  };

  // 8. Analytics Sub-Module
  const renderAnalyticsModule = () => {
    const { metrics } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'grid-pos-layout';

    const card = new CardComponent({
      title: 'Platform Resources & Usage Metrics',
      content: `
        <div class="flex flex-col gap-3 mt-2">
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Daily Completed Bills</span>
            <span class="font-bold text-xl text-primary">${metrics.dailyBillsCount.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Cashiers Online Now</span>
            <span class="font-bold text-xl text-success">${metrics.activeCashiers}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Supabase Storage Used</span>
            <span class="font-bold text-xl text-info">${metrics.storageUsedGb} GB</span>
          </div>
        </div>
      `
    }).render();

    wrap.appendChild(card);
    return wrap;
  };

  // 9. Feature Toggle Matrix Sub-Module
  const renderFeatureToggleModule = () => {
    const { globalFeatureFlags } = adminStore.getState();
    const card = new CardComponent({
      title: 'Global Platform Feature Flags Matrix',
      subtitle: 'Enable or disable platform features globally across all tenant stores',
      content: `<div id="feature-switches" class="flex flex-col gap-4 mt-2"></div>`
    }).render();

    const containerEl = card.querySelector('#feature-switches');

    Object.entries(globalFeatureFlags).forEach(([key, isEnabled]) => {
      const sw = new SwitchComponent({
        label: `Feature: ${key.replace(/_/g, ' ').toUpperCase()}`,
        checked: isEnabled,
        onChange: () => {
          adminService.toggleGlobalFeatureFlag(key);
        }
      }).render();

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-3 bg-tertiary rounded';
      row.appendChild(sw);
      containerEl.appendChild(row);
    });

    return card;
  };

  // 10. System Audit Logs Sub-Module
  const renderSystemLogsModule = () => {
    const { systemLogs } = adminStore.getState();
    const card = new CardComponent({
      title: 'System Audit & Event Logs',
      content: `<div id="logs-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'timestamp', title: 'Timestamp' },
        { key: 'level', title: 'Severity', render: (val) => `<span class="badge ${val === 'ERROR' ? 'badge-danger' : val === 'WARN' ? 'badge-warning' : 'badge-primary'}">${val}</span>` },
        { key: 'event', title: 'Event Details' }
      ],
      data: systemLogs
    }).render();

    card.querySelector('#logs-table').appendChild(table);
    return card;
  };

  // 11. AI Usage Monitor Sub-Module
  const renderAIUsageModule = () => {
    const { aiUsageLogs } = adminStore.getState();
    const card = new CardComponent({
      title: 'AI Token Usage Monitor',
      content: `<div id="ai-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'storeName', title: 'Tenant Store' },
        { key: 'model', title: 'AI Model', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'promptTokens', title: 'Prompt Tokens' },
        { key: 'completionTokens', title: 'Completion Tokens' },
        { key: 'totalTokens', title: 'Total Tokens', render: (val) => `<strong>${val.toLocaleString()}</strong>` }
      ],
      data: aiUsageLogs
    }).render();

    card.querySelector('#ai-table').appendChild(table);
    return card;
  };

  // 12. Announcements Sub-Module
  const renderAnnouncementsModule = () => {
    const { announcements } = adminStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-6';

    let annTitle = '';
    let annMsg = '';

    const createCard = new CardComponent({
      title: 'Broadcast Platform Announcement',
      content: `
        <div class="flex flex-col gap-3">
          <div id="ann-title-field"></div>
          <div id="ann-msg-field"></div>
          <div id="ann-btn-wrapper" class="mt-2"></div>
        </div>
      `
    }).render();

    const titleInput = new InputComponent({ label: 'Title', placeholder: 'e.g. Scheduled Maintenance', onChange: (v) => { annTitle = v; } }).render();
    const msgInput = new InputComponent({ label: 'Message Body', placeholder: 'Enter announcement message...', onChange: (v) => { annMsg = v; } }).render();
    const btn = new ButtonComponent({
      text: 'Broadcast Announcement',
      variant: 'primary',
      onClick: () => {
        if (annTitle && annMsg) {
          adminService.createAnnouncement(annTitle, annMsg);
          renderModuleContent();
        }
      }
    }).render();

    createCard.querySelector('#ann-title-field').appendChild(titleInput);
    createCard.querySelector('#ann-msg-field').appendChild(msgInput);
    createCard.querySelector('#ann-btn-wrapper').appendChild(btn);

    wrap.appendChild(createCard);

    const listCard = new CardComponent({
      title: 'Active Broadcast Feed',
      content: `<div id="ann-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'title', title: 'Title' },
        { key: 'message', title: 'Message Body' },
        { key: 'createdAt', title: 'Date' },
        {
          key: 'actions',
          title: 'Action',
          render: (_, row) => {
            const delBtn = new ButtonComponent({
              text: 'Delete',
              variant: 'danger',
              size: 'sm',
              onClick: () => {
                adminService.deleteAnnouncement(row.id);
                renderModuleContent();
              }
            }).render();
            return delBtn;
          }
        }
      ],
      data: announcements
    }).render();

    listCard.querySelector('#ann-table').appendChild(table);
    wrap.appendChild(listCard);
    return wrap;
  };

  // 13. Platform Settings Sub-Module
  const renderSettingsModule = () => {
    const { platformSettings } = adminStore.getState();

    let pName = platformSettings.platformName;
    let pEmail = platformSettings.supportEmail;
    let pSecret = platformSettings.stripeWebhookSecret;

    const card = new CardComponent({
      title: 'Super Admin Platform Configuration',
      content: `
        <div class="flex flex-col gap-4">
          <div id="pname-field"></div>
          <div id="pemail-field"></div>
          <div id="psecret-field"></div>
          <div id="save-settings-btn" class="mt-4"></div>
        </div>
      `
    }).render();

    const nameIn = new InputComponent({ label: 'Platform Name', value: pName, onChange: (v) => { pName = v; } }).render();
    const emailIn = new InputComponent({ label: 'Support Email', value: pEmail, onChange: (v) => { pEmail = v; } }).render();
    const secretIn = new InputComponent({ label: 'Stripe Webhook Secret Key', value: pSecret, onChange: (v) => { pSecret = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Save Platform Settings',
      variant: 'primary',
      onClick: () => {
        adminService.updatePlatformSettings({
          platformName: pName,
          supportEmail: pEmail,
          stripeWebhookSecret: pSecret
        });
      }
    }).render();

    card.querySelector('#pname-field').appendChild(nameIn);
    card.querySelector('#pemail-field').appendChild(emailIn);
    card.querySelector('#psecret-field').appendChild(secretIn);
    card.querySelector('#save-settings-btn').appendChild(btn);

    return card;
  };

  renderTabs();
  renderModuleContent();
  return container;
}
