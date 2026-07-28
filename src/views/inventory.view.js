import { inventoryStore } from '../store/inventory.store.js';
import { inventoryService } from '../services/inventory.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function InventoryView() {
  const container = document.createElement('div');
  container.className = 'inventory-view flex flex-col gap-6';

  let activeTab = 'warehouse'; // 12 sub-modules: warehouse | stock-entry | stock-adjustment | purchase-entry | transfer | supplier-stock | expiry | batch-number | low-stock | dead-stock | auto-reorder | reports

  const modules = [
    { id: 'warehouse', label: '🏭 Warehouses' },
    { id: 'stock-entry', label: '📦 Stock Entry (GRN)' },
    { id: 'stock-adjustment', label: '🛠️ Adjustments' },
    { id: 'purchase-entry', label: '🛒 Purchases' },
    { id: 'transfer', label: '🔄 Inter-Transfer' },
    { id: 'supplier-stock', label: '🚛 Supplier Stock' },
    { id: 'expiry', label: '⏳ Expiry Alert' },
    { id: 'batch-number', label: '🏷️ Batches' },
    { id: 'low-stock', label: '⚠️ Low Stock' },
    { id: 'dead-stock', label: '🧊 Dead Stock' },
    { id: 'auto-reorder', label: '🤖 Auto Reorder' },
    { id: 'reports', label: '📊 Valuation Reports' }
  ];

  // Header Banner Card
  const headerCard = new CardComponent({
    title: '🏬 Enterprise Multi-Warehouse & Inventory System',
    subtitle: 'Manage stock entries, GRNs, transfers, batch expiry tracking, and auto-reorders',
    content: `
      <div class="flex items-center gap-4 mt-2">
        ${new BadgeComponent({ text: 'Multi-Warehouse: Active', variant: 'primary' }).render().outerHTML}
        ${new BadgeComponent({ text: 'Batch Expiry: Enabled', variant: 'success' }).render().outerHTML}
      </div>
    `
  }).render();

  container.appendChild(headerCard);

  // Sub-Module Tabs Navigation Bar
  const navCard = document.createElement('div');
  navCard.className = 'card p-3 bg-secondary overflow-x-auto';

  const navFlex = document.createElement('div');
  navFlex.className = 'flex gap-2 flex-nowrap';

  const contentArea = document.createElement('div');
  contentArea.className = 'inventory-module-content flex flex-col gap-6';

  const renderTabs = () => {
    navFlex.innerHTML = '';
    modules.forEach((mod) => {
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

  // Render Active Sub-Module
  const renderModuleContent = () => {
    contentArea.innerHTML = '';

    switch (activeTab) {
      case 'warehouse':
        contentArea.appendChild(renderWarehouseModule());
        break;
      case 'stock-entry':
        contentArea.appendChild(renderStockEntryModule());
        break;
      case 'stock-adjustment':
        contentArea.appendChild(renderStockAdjustmentModule());
        break;
      case 'purchase-entry':
        contentArea.appendChild(renderPurchaseEntryModule());
        break;
      case 'transfer':
        contentArea.appendChild(renderTransferModule());
        break;
      case 'supplier-stock':
        contentArea.appendChild(renderSupplierStockModule());
        break;
      case 'expiry':
        contentArea.appendChild(renderExpiryModule());
        break;
      case 'batch-number':
        contentArea.appendChild(renderBatchNumberModule());
        break;
      case 'low-stock':
        contentArea.appendChild(renderLowStockModule());
        break;
      case 'dead-stock':
        contentArea.appendChild(renderDeadStockModule());
        break;
      case 'auto-reorder':
        contentArea.appendChild(renderAutoReorderModule());
        break;
      case 'reports':
        contentArea.appendChild(renderReportsModule());
        break;
      default:
        contentArea.appendChild(renderWarehouseModule());
    }
  };

  // 1. Warehouse Sub-Module
  const renderWarehouseModule = () => {
    const { warehouses } = inventoryStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-6';

    const card = new CardComponent({
      title: 'Warehouse & Store Outlets Locations',
      subtitle: 'Manage central distribution centers and retail outlets',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Active Warehouses: ${warehouses.length}</span>
          <div id="add-wh-btn-wrapper"></div>
        </div>
        <div id="wh-table"></div>
      `
    }).render();

    const addWhBtn = new ButtonComponent({
      text: '➕ Add Warehouse Location',
      variant: 'primary',
      size: 'sm',
      onClick: () => openAddWarehouseModal()
    }).render();

    card.querySelector('#add-wh-btn-wrapper').appendChild(addWhBtn);

    const table = new TableComponent({
      columns: [
        { key: 'code', title: 'Location Code', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'name', title: 'Warehouse Name', render: (val, row) => `<strong>${val}</strong> ${row.isPrimary ? '<span class="badge badge-primary">PRIMARY</span>' : ''}` },
        { key: 'address', title: 'Address' }
      ],
      data: warehouses
    }).render();

    card.querySelector('#wh-table').appendChild(table);
    wrap.appendChild(card);
    return wrap;
  };

  // Add Warehouse Modal Builder
  const openAddWarehouseModal = () => {
    let whName = '';
    let whCode = '';
    let whAddress = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3';

    const nameIn = new InputComponent({ label: 'Warehouse Name', placeholder: 'e.g. Westside Storage Hub', onChange: (v) => { whName = v; } }).render();
    const codeIn = new InputComponent({ label: 'Location Code', placeholder: 'e.g. WH-WEST', onChange: (v) => { whCode = v; } }).render();
    const addrIn = new InputComponent({ label: 'Address', placeholder: 'Address location...', onChange: (v) => { whAddress = v; } }).render();

    content.appendChild(nameIn);
    content.appendChild(codeIn);
    content.appendChild(addrIn);

    const modal = new ModalComponent({
      title: '➕ Register Warehouse Location',
      content
    });
    modal.open();

    const btn = new ButtonComponent({
      text: 'Register Warehouse',
      variant: 'primary',
      onClick: () => {
        if (whName && whCode) {
          inventoryService.createWarehouse(whName, whCode, whAddress);
          modal.close();
          renderModuleContent();
        }
      }
    }).render();

    content.appendChild(btn);
  };

  // 2. Stock Entry (GRN) Sub-Module
  const renderStockEntryModule = () => {
    const { stockEntries } = inventoryStore.getState();
    const card = new CardComponent({
      title: 'Goods Received Notes (GRN) Stock Entry',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Logged GRN Entries</span>
          <button id="new-grn-btn" class="btn btn-primary btn-sm">➕ New GRN Entry</button>
        </div>
        <div id="grn-table"></div>
      `
    }).render();

    card.querySelector('#new-grn-btn').addEventListener('click', () => {
      inventoryService.createStockEntry('Dairy Fresh Wholesalers', 5);
      renderModuleContent();
    });

    const table = new TableComponent({
      columns: [
        { key: 'grnNumber', title: 'GRN Number', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'supplier', title: 'Supplier' },
        { key: 'itemsCount', title: 'Items Count' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` }
      ],
      data: stockEntries
    }).render();

    card.querySelector('#grn-table').appendChild(table);
    return card;
  };

  // 3. Stock Adjustment Sub-Module
  const renderStockAdjustmentModule = () => {
    const { stockAdjustments } = inventoryStore.getState();
    const card = new CardComponent({
      title: 'Stock Audit & Reconciliation Adjustments',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Manual Adjustments Log</span>
          <button id="new-adj-btn" class="btn btn-primary btn-sm">🛠️ New Adjustment</button>
        </div>
        <div id="adj-table"></div>
      `
    }).render();

    card.querySelector('#new-adj-btn').addEventListener('click', () => {
      inventoryService.createStockAdjustment('Organic Whole Milk 1L', 'damage', -2, 'Packaging leakage');
      renderModuleContent();
    });

    const table = new TableComponent({
      columns: [
        { key: 'refNo', title: 'Ref #' },
        { key: 'productName', title: 'Product' },
        { key: 'type', title: 'Adjustment Type', render: (val) => `<span class="badge badge-warning">${val.toUpperCase()}</span>` },
        { key: 'quantity', title: 'Qty Change', render: (val) => `<strong class="text-danger">${val}</strong>` },
        { key: 'reason', title: 'Reason' },
        { key: 'date', title: 'Date' }
      ],
      data: stockAdjustments
    }).render();

    card.querySelector('#adj-table').appendChild(table);
    return card;
  };

  // 4. Purchase Entry Sub-Module
  const renderPurchaseEntryModule = () => {
    const { purchases } = inventoryStore.getState();
    const card = new CardComponent({
      title: 'Supplier Purchase Orders & Bill Entry',
      content: `<div id="po-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'poNumber', title: 'PO Number' },
        { key: 'supplier', title: 'Supplier' },
        { key: 'totalAmount', title: 'Total Amount' },
        { key: 'date', title: 'Date' },
        { key: 'paymentStatus', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` }
      ],
      data: purchases
    }).render();

    card.querySelector('#po-table').appendChild(table);
    return card;
  };

  // 5. Inter-Warehouse Transfer Sub-Module
  const renderTransferModule = () => {
    const { transfers } = inventoryStore.getState();
    const card = new CardComponent({
      title: 'Inter-Warehouse Stock Transfer',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Stock Movement Log</span>
          <button id="new-transfer-btn" class="btn btn-primary btn-sm">🔄 Create Stock Transfer</button>
        </div>
        <div id="transfer-table"></div>
      `
    }).render();

    card.querySelector('#new-transfer-btn').addEventListener('click', () => {
      inventoryService.transferStock('Main Central Warehouse', 'Downtown Retail Outlet', 15);
      renderModuleContent();
    });

    const table = new TableComponent({
      columns: [
        { key: 'transferNo', title: 'Transfer #' },
        { key: 'fromWarehouse', title: 'Origin' },
        { key: 'toWarehouse', title: 'Destination' },
        { key: 'itemsCount', title: 'Items Moved' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` }
      ],
      data: transfers
    }).render();

    card.querySelector('#transfer-table').appendChild(table);
    return card;
  };

  // 6. Supplier Stock Sub-Module
  const renderSupplierStockModule = () => {
    const { suppliers } = inventoryStore.getState();
    const card = new CardComponent({
      title: 'Supplier Stock Breakdown & Balances',
      content: `<div id="sup-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'companyName', title: 'Supplier Company' },
        { key: 'contactPerson', title: 'Contact Person' },
        { key: 'phone', title: 'Phone' },
        { key: 'balance', title: 'Outstanding Balance', render: (val) => `<strong class="text-warning">${val}</strong>` }
      ],
      data: suppliers
    }).render();

    card.querySelector('#sup-table').appendChild(table);
    return card;
  };

  // 7. Batch Expiry Tracker Sub-Module
  const renderExpiryModule = () => {
    const { batches } = inventoryStore.getState();
    const card = new CardComponent({
      title: '⏳ Batch Expiry Tracking & Alerts',
      subtitle: 'Monitor perishable batches expiring in 30 days',
      content: `<div id="expiry-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'batchNumber', title: 'Batch #' },
        { key: 'productName', title: 'Product' },
        { key: 'expiryDate', title: 'Expiry Date', render: (val) => `<strong class="text-danger">${val}</strong>` },
        { key: 'quantity', title: 'Stock Left' },
        { key: 'status', title: 'Alert Status', render: (val) => `<span class="badge ${val === 'expiring_soon' ? 'badge-warning' : 'badge-success'}">${val.toUpperCase()}</span>` }
      ],
      data: batches
    }).render();

    card.querySelector('#expiry-table').appendChild(table);
    return card;
  };

  // 8. Batch Numbers Sub-Module
  const renderBatchNumberModule = () => {
    const { batches } = inventoryStore.getState();
    const card = new CardComponent({
      title: '🏷️ Batch / Lot Number Lookup',
      content: `<div id="batches-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'batchNumber', title: 'Batch Number', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'productName', title: 'Product' },
        { key: 'mfgDate', title: 'Mfg Date' },
        { key: 'expiryDate', title: 'Expiry Date' }
      ],
      data: batches
    }).render();

    card.querySelector('#batches-table').appendChild(table);
    return card;
  };

  // 9. Low Stock Alerts Sub-Module
  const renderLowStockModule = () => {
    const card = new CardComponent({
      title: '⚠️ Critical Low Stock Alerts',
      subtitle: 'Products below reorder threshold requiring stock replenishment',
      content: `
        <div class="p-4 bg-warning-bg border-l-4 border-warning text-warning-text rounded text-xs mb-4">
          ⚠️ 4 products currently require urgent supplier purchase reorder.
        </div>
      `
    }).render();

    return card;
  };

  // 10. Dead Stock Identification Sub-Module
  const renderDeadStockModule = () => {
    const { deadStockItems } = inventoryStore.getState();
    const card = new CardComponent({
      title: '🧊 Slow-Moving & Dead Stock Identification',
      subtitle: 'Products with zero or low sales movement over 60+ days',
      content: `<div id="dead-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'sku', title: 'SKU' },
        { key: 'name', title: 'Product Name' },
        { key: 'stock', title: 'Idle Stock' },
        { key: 'lastSold', title: 'Last Sale' },
        { key: 'value', title: 'Tied Capital', render: (val) => `<strong class="text-danger">${val}</strong>` }
      ],
      data: deadStockItems
    }).render();

    card.querySelector('#dead-table').appendChild(table);
    return card;
  };

  // 11. Auto Reorder Suggestions Sub-Module
  const renderAutoReorderModule = () => {
    const { autoReorderSuggestions } = inventoryStore.getState();
    const card = new CardComponent({
      title: '🤖 Automated Reorder Quantity Suggestions',
      subtitle: 'AI & rule-based replenishment suggestions based on sales velocity',
      content: `<div id="reorder-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'productName', title: 'Product' },
        { key: 'currentStock', title: 'Current' },
        { key: 'minStock', title: 'Min Threshold' },
        { key: 'suggestedOrderQty', title: 'Suggested Qty Order', render: (val) => `<span class="badge badge-primary font-bold">+${val} units</span>` },
        { key: 'supplier', title: 'Supplier' },
        { key: 'estCost', title: 'Est. Cost' }
      ],
      data: autoReorderSuggestions
    }).render();

    card.querySelector('#reorder-table').appendChild(table);
    return card;
  };

  // 12. Inventory Valuation Reports Sub-Module
  const renderReportsModule = () => {
    const { inventoryValuation } = inventoryStore.getState();
    const wrap = document.createElement('div');
    wrap.className = 'grid-pos-layout';

    const card = new CardComponent({
      title: '📊 Inventory Asset Valuation Report',
      content: `
        <div class="flex flex-col gap-3 mt-2">
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Total Catalog SKUs</span>
            <span class="font-bold text-lg text-primary">${inventoryValuation.totalItemsCount.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Inventory Asset Cost Value</span>
            <span class="font-bold text-xl text-primary">$${inventoryValuation.totalValuationCost.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Inventory Retail Sales Value</span>
            <span class="font-bold text-xl text-success">$${inventoryValuation.totalValuationRetail.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-tertiary rounded">
            <span>Estimated Gross Profit</span>
            <span class="font-bold text-xl text-info">$${inventoryValuation.potentialProfit.toLocaleString()}</span>
          </div>
        </div>
      `
    }).render();

    wrap.appendChild(card);
    return wrap;
  };

  renderTabs();
  renderModuleContent();
  return container;
}
