import { dashboardStore } from '../store/dashboard.store.js';
import { tenantStore } from '../store/tenant.store.js';
import { authStore } from '../store/auth.store.js';
import { dashboardService } from '../services/dashboard.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { ChartComponent } from '../components/base/chart.component.js';
import { ModalComponent } from '../components/base/modal.component.js';
import { eventBus } from '../core/event-bus.js';

export async function DashboardView() {
  const container = document.createElement('div');
  container.className = 'dashboard-view flex flex-col gap-6 w-full min-w-0';

  const { tenant } = tenantStore.getState();
  const { user } = authStore.getState();
  const state = dashboardStore.getState();

  // 1. Top Header Banner & Actions
  const headerCard = new CardComponent({
    title: `Welcome back, ${user?.fullName || 'Store Owner'}! 👋`,
    subtitle: `Real-time Business Management for ${tenant?.name || 'OmniPOS Store'}`,
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-3 flex-wrap">
          ${new BadgeComponent({ text: 'Register: OPEN', variant: 'success' }).render().outerHTML}
          ${new BadgeComponent({ text: 'Sync: ONLINE', variant: 'primary' }).render().outerHTML}
          <span class="text-xs text-muted">Date: ${new Date().toLocaleDateString()}</span>
        </div>

        <div class="flex items-center gap-2">
          <button id="print-summary-btn" class="btn btn-secondary btn-sm">🖨️ Print Daily Summary</button>
        </div>
      </div>
    `
  }).render();

  headerCard.querySelector('#print-summary-btn').addEventListener('click', () => {
    openBusinessSummaryModal();
  });

  container.appendChild(headerCard);

  // 2. Top KPI Metrics Grid
  const kpiGrid = document.createElement('div');
  kpiGrid.style.display = 'grid';
  kpiGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))';
  kpiGrid.style.gap = 'var(--space-4)';
  kpiGrid.style.width = '100%';


  const kpis = [
    { title: "Today's Sales", val: `$${state.todaySales.toFixed(2)}`, badge: `${state.todayOrderCount} Orders`, color: 'var(--color-primary)' },
    { title: "Today's Revenue", val: `$${state.todayRevenue.toFixed(2)}`, badge: `Profit: $${state.netProfit.toFixed(2)}`, color: 'var(--color-success)' },
    { title: 'Products & Inventory', val: state.totalProductsCount.toLocaleString(), badge: `${state.lowStockCount} Low Stock`, color: 'var(--color-warning)' },
    { title: 'Active Registers', val: '2 Active', badge: 'Online', color: 'var(--color-info)' }
  ];

  kpis.forEach((kpi) => {
    const card = new CardComponent({
      title: kpi.title,
      content: `
        <div class="flex items-center justify-between mt-2">
          <span class="text-3xl font-bold" style="color: ${kpi.color};">${kpi.val}</span>
          <span class="badge badge-primary">${kpi.badge}</span>
        </div>
      `
    }).render();
    kpiGrid.appendChild(card);
  });

  container.appendChild(kpiGrid);

  // 3. Quick Actions Floating Bar
  const quickActionsCard = document.createElement('div');
  quickActionsCard.className = 'card p-4 bg-secondary flex items-center justify-between flex-wrap gap-4';
  quickActionsCard.innerHTML = `
    <div class="font-bold text-sm text-primary">⚡ Quick Register Actions</div>
    <div class="flex items-center gap-2 flex-wrap" id="quick-btns"></div>
  `;

  const quickBtnsContainer = quickActionsCard.querySelector('#quick-btns');

  const newBillBtn = new ButtonComponent({
    text: '🛒 New Bill',
    variant: 'primary',
    size: 'sm',
    onClick: () => {
      eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'info', title: 'POS Register Ready', message: 'Ready to process new billing cart.' });
    }
  }).render();

  const addProdBtn = new ButtonComponent({
    text: '📦 Add Product',
    variant: 'secondary',
    size: 'sm',
    onClick: () => {
      eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'info', title: 'Product Catalog', message: 'Product modal ready.' });
    }
  }).render();

  const addCustBtn = new ButtonComponent({
    text: '👤 Add Customer',
    variant: 'secondary',
    size: 'sm',
    onClick: () => {
      eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'info', title: 'Customer Directory', message: 'Customer form ready.' });
    }
  }).render();

  quickBtnsContainer.appendChild(newBillBtn);
  quickBtnsContainer.appendChild(addProdBtn);
  quickBtnsContainer.appendChild(addCustBtn);

  container.appendChild(quickActionsCard);

  // 4. Interactive Charts Section Grid
  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'grid-pos-layout';

  const hourlyChart = new ChartComponent({
    type: 'bar',
    title: 'Today Sales Trend (Hourly)',
    data: state.hourlySalesData
  }).render();

  const distributionChart = new ChartComponent({
    type: 'distribution',
    title: 'Category Sales Distribution',
    data: state.categoryDistributionData
  }).render();

  chartsGrid.appendChild(hourlyChart);
  chartsGrid.appendChild(distributionChart);

  container.appendChild(chartsGrid);

  // 5. Low Stock Alerts & Recent Bills Grid
  const tablesGrid = document.createElement('div');
  tablesGrid.className = 'grid-pos-layout';

  // Low Stock Table Card
  const lowStockCard = new CardComponent({
    title: '⚠️ Low Stock Inventory Warnings',
    subtitle: 'Items at or below critical reorder thresholds',
    content: `<div id="low-stock-table"></div>`
  }).render();

  const lowStockTable = new TableComponent({
    columns: [
      { key: 'name', title: 'Product' },
      { key: 'sku', title: 'SKU', render: (val) => `<code class="font-mono text-xs">${val}</code>` },
      { key: 'stock', title: 'Stock Left', render: (val, row) => `<span class="badge badge-danger">${val} ${row.unit}</span>` },
      {
        key: 'action',
        title: 'Reorder',
        render: (_, row) => {
          const btn = new ButtonComponent({
            text: 'Reorder',
            variant: 'primary',
            size: 'sm',
            onClick: () => dashboardService.reorderProduct(row.id)
          }).render();
          return btn;
        }
      }
    ],
    data: state.lowStockItems
  }).render();

  lowStockCard.querySelector('#low-stock-table').appendChild(lowStockTable);
  tablesGrid.appendChild(lowStockCard);

  // Recent Bills Table Card
  const recentBillsCard = new CardComponent({
    title: '📜 Recent Sales Invoices',
    subtitle: 'Latest billing transactions processed today',
    content: `<div id="recent-bills-table"></div>`
  }).render();

  const billsTable = new TableComponent({
    columns: [
      { key: 'invoiceNo', title: 'Invoice #' },
      { key: 'customer', title: 'Customer' },
      { key: 'total', title: 'Total' },
      { key: 'paymentMethod', title: 'Method', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
      {
        key: 'action',
        title: 'Receipt',
        render: (_, row) => {
          const btn = new ButtonComponent({
            text: '📄 View',
            variant: 'secondary',
            size: 'sm',
            onClick: () => openReceiptModal(row)
          }).render();
          return btn;
        }
      }
    ],
    data: state.recentBills
  }).render();

  recentBillsCard.querySelector('#recent-bills-table').appendChild(billsTable);
  tablesGrid.appendChild(recentBillsCard);

  container.appendChild(tablesGrid);

  // 6. Top Customers & End-of-Day Business Summary Grid
  const summaryGrid = document.createElement('div');
  summaryGrid.className = 'grid-pos-layout';

  // Top Customers Table Card
  const topCustCard = new CardComponent({
    title: '🌟 Top Spending Retail Customers',
    content: `<div id="top-cust-table"></div>`
  }).render();

  const custTable = new TableComponent({
    columns: [
      { key: 'name', title: 'Customer' },
      { key: 'phone', title: 'Phone' },
      { key: 'totalSpend', title: 'Total Spend', render: (val) => `<strong class="text-primary">${val}</strong>` },
      { key: 'loyaltyPoints', title: 'Loyalty Pts', render: (val) => `<span class="badge badge-success">${val} pts</span>` }
    ],
    data: state.topCustomers
  }).render();

  topCustCard.querySelector('#top-cust-table').appendChild(custTable);
  summaryGrid.appendChild(topCustCard);

  // End of Day Business Summary Card
  const busSummaryCard = new CardComponent({
    title: '💼 End-of-Day Business Summary',
    content: `
      <div class="flex flex-col gap-3 mt-2">
        <div class="flex justify-between items-center p-2 border-b">
          <span class="text-xs text-secondary">Gross Sales</span>
          <span class="font-bold text-sm">$${state.businessSummary.grossSales.toFixed(2)}</span>
        </div>
        <div class="flex justify-between items-center p-2 border-b">
          <span class="text-xs text-secondary">Tax Collected (VAT/GST)</span>
          <span class="font-bold text-sm">$${state.businessSummary.taxCollected.toFixed(2)}</span>
        </div>
        <div class="flex justify-between items-center p-2 border-b">
          <span class="text-xs text-secondary">Discounts Offered</span>
          <span class="font-bold text-sm text-warning">-$${state.businessSummary.discountsGiven.toFixed(2)}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-tertiary rounded">
          <span class="font-bold text-sm">Net Profit</span>
          <span class="font-bold text-xl text-success">$${state.businessSummary.netProfit.toFixed(2)}</span>
        </div>
      </div>
    `
  }).render();

  summaryGrid.appendChild(busSummaryCard);
  container.appendChild(summaryGrid);

  // Receipt Modal Builder
  const openReceiptModal = (bill) => {
    const html = document.createElement('div');
    html.className = 'p-4 flex flex-col gap-3 font-mono text-xs';
    html.innerHTML = `
      <div class="text-center font-bold text-sm">${tenant?.name || 'OmniPOS Store'}</div>
      <div class="text-center text-muted">Invoice #: ${bill.invoiceNo}</div>
      <div class="border-b py-2 flex justify-between">
        <span>Customer: ${bill.customer}</span>
        <span>${bill.time}</span>
      </div>
      <div class="py-2 border-b flex justify-between font-bold">
        <span>Total Amount Paid (${bill.paymentMethod.toUpperCase()})</span>
        <span class="text-primary">${bill.total}</span>
      </div>
      <div class="text-center text-muted pt-2">Thank you for shopping with us!</div>
      <button id="print-bill-btn" class="btn btn-primary btn-sm mt-4">🖨️ Print Receipt</button>
    `;

    const modal = new ModalComponent({
      title: `Receipt - ${bill.invoiceNo}`,
      content: html
    });
    modal.open();

    html.querySelector('#print-bill-btn').addEventListener('click', () => window.print());
  };

  // Business Summary Modal Builder
  const openBusinessSummaryModal = () => {
    const html = document.createElement('div');
    html.className = 'p-4 flex flex-col gap-4';
    html.innerHTML = `
      <h3 class="h4 font-bold text-primary">${tenant?.name || 'OmniPOS Store'} - Daily Summary Report</h3>
      <div class="text-xs text-muted">Generated: ${new Date().toLocaleString()}</div>

      <div class="card p-4 bg-tertiary flex flex-col gap-2 text-xs">
        <div class="flex justify-between"><span>Gross Sales:</span><strong>$${state.businessSummary.grossSales.toFixed(2)}</strong></div>
        <div class="flex justify-between"><span>Tax Collected:</span><strong>$${state.businessSummary.taxCollected.toFixed(2)}</strong></div>
        <div class="flex justify-between"><span>Discounts:</span><strong>-$${state.businessSummary.discountsGiven.toFixed(2)}</strong></div>
        <div class="flex justify-between"><span>COGS:</span><strong>-$${state.businessSummary.cogs.toFixed(2)}</strong></div>
        <div class="flex justify-between border-t pt-2 text-sm font-bold text-success"><span>Estimated Net Profit:</span><span>$${state.businessSummary.netProfit.toFixed(2)}</span></div>
      </div>

      <div class="flex justify-end gap-2">
        <button id="print-eod-btn" class="btn btn-primary btn-sm">🖨️ Print Report</button>
      </div>
    `;

    const modal = new ModalComponent({
      title: 'End-of-Day Business Summary',
      content: html
    });
    modal.open();

    html.querySelector('#print-eod-btn').addEventListener('click', () => window.print());
  };

  return container;
}
