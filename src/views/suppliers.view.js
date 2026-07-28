import { suppliersStore } from '../store/suppliers.store.js';
import { suppliersService } from '../services/suppliers.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { SelectComponent } from '../components/base/select.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function SuppliersView() {
  const container = document.createElement('div');
  container.className = 'suppliers-view flex flex-col gap-6';

  // ── Analytics KPI Strip ───────────────────────────────────────────────────
  const { analytics } = suppliersStore.getState();

  const kpiStrip = document.createElement('div');
  kpiStrip.className = 'grid grid-cols-4 gap-4';
  kpiStrip.innerHTML = `
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Total Suppliers</div>
      <div class="font-bold text-2xl text-primary">${analytics.totalSuppliers}</div>
      <div class="text-xs text-secondary mt-1">Active vendor accounts</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Purchased This Month</div>
      <div class="font-bold text-2xl text-success">$${analytics.totalPurchasedThisMonth.toLocaleString()}</div>
      <div class="text-xs text-secondary mt-1">Total procurement value</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Total Outstanding</div>
      <div class="font-bold text-2xl text-danger">$${analytics.totalOutstanding.toLocaleString()}</div>
      <div class="text-xs text-secondary mt-1">Payable to suppliers</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Avg Lead Time</div>
      <div class="font-bold text-2xl text-info">${analytics.avgLeadTimeDays} days</div>
      <div class="text-xs text-secondary mt-1">Order to delivery avg</div>
    </div>
  `;
  container.appendChild(kpiStrip);

  // ── Control Header Bar ────────────────────────────────────────────────────
  let searchQuery = '';
  let categoryFilter = 'all';

  const headerCard = new CardComponent({
    title: '🚛 Supplier & Vendor Management',
    subtitle: 'Manage supplier profiles, purchase orders, payments & outstanding balances',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button id="add-supplier-btn" class="btn btn-primary btn-sm">➕ Add Supplier</button>
          <button id="create-po-btn" class="btn btn-secondary btn-sm">🛒 New Purchase Order</button>
          <button id="export-sup-btn" class="btn btn-secondary btn-sm">📤 Export CSV</button>
          <button id="report-btn" class="btn btn-secondary btn-sm">📊 Analytics Report</button>
        </div>
        <div class="flex gap-2 flex-wrap" id="sup-filter-controls"></div>
      </div>
    `
  }).render();

  // Filters
  const filterControls = headerCard.querySelector('#sup-filter-controls');
  const searchInput = new InputComponent({
    placeholder: '🔍 Search supplier / contact...',
    onChange: (val) => { searchQuery = val.toLowerCase(); renderSuppliersTable(); }
  }).render();
  searchInput.style.maxWidth = '220px';

  const catOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Dairy & Perishables', label: 'Dairy & Perishables' },
    { value: 'Beverages & Liquids', label: 'Beverages & Liquids' },
    { value: 'Organic & Grocery', label: 'Organic & Grocery' }
  ];
  const catSelect = new SelectComponent({
    options: catOptions, value: 'all',
    onChange: (val) => { categoryFilter = val; renderSuppliersTable(); }
  }).render();

  filterControls.appendChild(searchInput);
  filterControls.appendChild(catSelect);

  headerCard.querySelector('#add-supplier-btn').addEventListener('click', () => openSupplierModal());
  headerCard.querySelector('#create-po-btn').addEventListener('click', () => openPurchaseOrderModal());
  headerCard.querySelector('#export-sup-btn').addEventListener('click', () => suppliersService.exportSuppliersToCSV());
  headerCard.querySelector('#report-btn').addEventListener('click', () => openAnalyticsModal());
  container.appendChild(headerCard);

  // ── Suppliers Directory Table ─────────────────────────────────────────────
  const tableCard = new CardComponent({
    title: 'Supplier Directory & Account Ledgers',
    content: `<div id="suppliers-table-wrapper"></div>`
  }).render();
  container.appendChild(tableCard);

  const renderSuppliersTable = () => {
    const { suppliers } = suppliersStore.getState();
    const filtered = suppliers.filter((s) => {
      const matchSearch = !searchQuery || s.companyName.toLowerCase().includes(searchQuery) || s.contactPerson.toLowerCase().includes(searchQuery);
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      return matchSearch && matchCat;
    });

    const wrapper = tableCard.querySelector('#suppliers-table-wrapper');
    wrapper.innerHTML = '';

    const table = new TableComponent({
      columns: [
        {
          key: 'avatar',
          title: '',
          render: (_, row) => `
            <div style="width:36px;height:36px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">
              ${row.avatarInitials}
            </div>`
        },
        {
          key: 'companyName', title: 'Supplier Company',
          render: (val, row) => `
            <div>
              <strong>${val}</strong>
              <div class="text-xs text-muted">${row.contactPerson}</div>
            </div>`
        },
        {
          key: 'contact', title: 'Contact',
          render: (_, row) => `
            <div class="text-xs">
              <div class="font-mono text-primary">${row.phone}</div>
              <div class="text-muted">${row.email}</div>
            </div>`
        },
        {
          key: 'category', title: 'Category',
          render: (val) => `<span class="badge badge-secondary">${val}</span>`
        },
        {
          key: 'paymentTerms', title: 'Payment Terms',
          render: (val) => `<span class="badge badge-primary">${val}</span>`
        },
        {
          key: 'totalPurchased', title: 'Total Purchased',
          render: (val) => `<strong>$${parseFloat(val).toLocaleString()}</strong>`
        },
        {
          key: 'outstandingBalance', title: 'Outstanding',
          render: (val) => val > 0
            ? `<span class="badge badge-danger">$${parseFloat(val).toFixed(2)}</span>`
            : `<span class="badge badge-success">Settled</span>`
        },
        {
          key: 'rating', title: 'Rating',
          render: (val) => '⭐'.repeat(val)
        },
        {
          key: 'actions', title: 'Actions',
          render: (_, row) => {
            const wrap = document.createElement('div');
            wrap.className = 'flex gap-1';

            [
              { text: '👁️ Profile', onClick: () => openSupplierProfileModal(row) },
              { text: '💳 Pay', onClick: () => openPaymentModal(row) },
              { text: '✏️', onClick: () => openSupplierModal(row) }
            ].forEach(({ text, onClick }) => {
              wrap.appendChild(new ButtonComponent({ text, variant: 'secondary', size: 'sm', onClick }).render());
            });

            return wrap;
          }
        }
      ],
      data: filtered
    }).render();

    wrapper.appendChild(table);
  };

  renderSuppliersTable();

  // ── Purchase Orders & Payments Sub-section ────────────────────────────────
  const poCard = new CardComponent({
    title: 'Purchase Orders & Payment Ledger',
    subtitle: 'All raised POs and recorded supplier payments',
    content: `
      <div class="flex gap-2 mb-4">
        <button id="show-po-tab" class="btn btn-primary btn-sm">📋 Purchase Orders</button>
        <button id="show-pay-tab" class="btn btn-secondary btn-sm">💳 Payment History</button>
      </div>
      <div id="po-section"><div id="po-table"></div></div>
      <div id="pay-section" style="display:none;"><div id="pay-table"></div></div>
    `
  }).render();

  poCard.querySelector('#show-po-tab').addEventListener('click', () => {
    poCard.querySelector('#po-section').style.display = '';
    poCard.querySelector('#pay-section').style.display = 'none';
    poCard.querySelector('#show-po-tab').className = 'btn btn-primary btn-sm';
    poCard.querySelector('#show-pay-tab').className = 'btn btn-secondary btn-sm';
  });

  poCard.querySelector('#show-pay-tab').addEventListener('click', () => {
    poCard.querySelector('#po-section').style.display = 'none';
    poCard.querySelector('#pay-section').style.display = '';
    poCard.querySelector('#show-po-tab').className = 'btn btn-secondary btn-sm';
    poCard.querySelector('#show-pay-tab').className = 'btn btn-primary btn-sm';
  });

  // PO Table
  const { purchaseOrders, payments } = suppliersStore.getState();

  const poTable = new TableComponent({
    columns: [
      { key: 'poNumber', title: 'PO Number', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
      { key: 'supplierName', title: 'Supplier' },
      { key: 'items', title: 'Items' },
      { key: 'subtotal', title: 'Subtotal', render: (val) => `$${parseFloat(val).toFixed(2)}` },
      { key: 'taxAmount', title: 'GST/Tax', render: (val) => `$${parseFloat(val).toFixed(2)}` },
      { key: 'totalAmount', title: 'Total', render: (val) => `<strong>$${parseFloat(val).toFixed(2)}</strong>` },
      { key: 'paidAmount', title: 'Paid', render: (val) => `<span class="text-success">$${parseFloat(val).toFixed(2)}</span>` },
      {
        key: 'status', title: 'Status',
        render: (val) => {
          const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
          return `<span class="badge ${map[val] || 'badge-secondary'}">${val.toUpperCase()}</span>`;
        }
      },
      { key: 'date', title: 'Date' },
      { key: 'dueDate', title: 'Due Date' }
    ],
    data: purchaseOrders
  }).render();

  poCard.querySelector('#po-table').appendChild(poTable);

  // Payments Table
  const payTable = new TableComponent({
    columns: [
      { key: 'supplierName', title: 'Supplier' },
      { key: 'poReference', title: 'PO Reference' },
      { key: 'amount', title: 'Amount Paid', render: (val) => `<strong class="text-success">$${parseFloat(val).toFixed(2)}</strong>` },
      { key: 'method', title: 'Payment Method', render: (val) => `<span class="badge badge-primary">${val.replace('_', ' ').toUpperCase()}</span>` },
      { key: 'date', title: 'Date' },
      { key: 'note', title: 'Note' }
    ],
    data: payments
  }).render();

  poCard.querySelector('#pay-table').appendChild(payTable);
  container.appendChild(poCard);

  // ── Supplier Profile Modal ─────────────────────────────────────────────────
  const openSupplierProfileModal = (supplier) => {
    const poHistory = suppliersStore.getState().purchaseOrders.filter((p) => p.supplierId === supplier.id);
    const payHistory = suppliersStore.getState().payments.filter((p) => p.supplierId === supplier.id);

    const totalPaid = payHistory.reduce((sum, p) => sum + p.amount, 0);

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';
    content.innerHTML = `
      <!-- Header Banner -->
      <div class="flex items-center gap-4 p-4 bg-tertiary rounded">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px;">
          ${supplier.avatarInitials}
        </div>
        <div class="flex-1">
          <div class="font-bold text-lg text-primary">${supplier.companyName}</div>
          <div class="text-secondary">${supplier.contactPerson} &bull; ${supplier.phone}</div>
          <div class="text-muted">${supplier.email}</div>
          <div class="text-muted">${supplier.address}</div>
        </div>
        <div class="text-right">
          <div class="badge badge-secondary mb-1">${supplier.category}</div><br/>
          <div class="badge badge-primary">${supplier.paymentTerms}</div><br/>
          <div class="mt-1">${'⭐'.repeat(supplier.rating)}</div>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-muted">Total Purchased</div>
          <div class="font-bold text-lg text-primary">$${supplier.totalPurchased.toLocaleString()}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total Paid</div>
          <div class="font-bold text-lg text-success">$${totalPaid.toLocaleString()}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Outstanding</div>
          <div class="font-bold text-lg text-danger">$${supplier.outstandingBalance.toFixed(2)}</div>
        </div>
      </div>

      <!-- GST & Credit -->
      <div class="card p-3 bg-tertiary">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-muted">GST Number</div>
            <div class="font-mono font-bold text-primary">${supplier.gstNumber || 'Not provided'}</div>
          </div>
          <div>
            <div class="text-muted">Credit Limit</div>
            <div class="font-bold">$${supplier.creditLimit.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- PO History Table Header -->
      <div class="font-bold text-sm">Purchase Order History (${poHistory.length})</div>
      <div id="profile-po-table"></div>
    `;

    const poTbl = new TableComponent({
      columns: [
        { key: 'poNumber', title: 'PO #', render: (val) => `<code class="font-mono text-primary">${val}</code>` },
        { key: 'items', title: 'Items' },
        { key: 'totalAmount', title: 'Total', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'paidAmount', title: 'Paid', render: (val) => `<span class="text-success">$${parseFloat(val).toFixed(2)}</span>` },
        {
          key: 'status', title: 'Status',
          render: (val) => {
            const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
            return `<span class="badge ${map[val] || 'badge-secondary'}">${val.toUpperCase()}</span>`;
          }
        },
        { key: 'date', title: 'Date' }
      ],
      data: poHistory
    }).render();

    const modal = new ModalComponent({
      title: `Supplier Profile — ${supplier.companyName}`,
      content
    });

    content.querySelector('#profile-po-table').appendChild(poTbl);
    modal.open();
  };

  // ── Make Payment Modal ─────────────────────────────────────────────────────
  const openPaymentModal = (supplier) => {
    let payAmount = '';
    let payMethod = 'bank_transfer';
    let payNote = '';
    let poRef = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    // Current outstanding badge
    content.innerHTML = `
      <div class="card p-3 bg-tertiary flex justify-between items-center mb-2">
        <div>
          <div class="text-muted">Outstanding Balance</div>
          <div class="font-bold text-xl text-danger">$${supplier.outstandingBalance.toFixed(2)}</div>
        </div>
        <div class="text-right">
          <div class="text-muted">Supplier</div>
          <div class="font-bold">${supplier.companyName}</div>
        </div>
      </div>
      <div id="pay-amount-in"></div>
      <div class="input-group">
        <label class="input-label">Payment Method</label>
        <select class="select-field" id="pay-method-sel">
          <option value="bank_transfer">🏦 Bank Transfer</option>
          <option value="upi">📲 UPI / Digital Wallet</option>
          <option value="cash">💵 Cash</option>
          <option value="cheque">🪙 Cheque</option>
        </select>
      </div>
      <div id="pay-po-in"></div>
      <div id="pay-note-in"></div>
      <div id="pay-submit-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({
      title: `💳 Record Payment — ${supplier.companyName}`,
      content
    });
    modal.open();

    const amountIn = new InputComponent({ label: 'Payment Amount ($)', type: 'number', placeholder: `Max: $${supplier.outstandingBalance.toFixed(2)}`, onChange: (v) => { payAmount = v; } }).render();
    const poIn = new InputComponent({ label: 'PO Reference (optional)', placeholder: 'PO-2026-XXX', onChange: (v) => { poRef = v; } }).render();
    const noteIn = new InputComponent({ label: 'Note / Remarks', placeholder: 'e.g. Full settlement July 2026', onChange: (v) => { payNote = v; } }).render();

    content.querySelector('#pay-amount-in').appendChild(amountIn);
    content.querySelector('#pay-po-in').appendChild(poIn);
    content.querySelector('#pay-note-in').appendChild(noteIn);

    content.querySelector('#pay-method-sel').addEventListener('change', (e) => { payMethod = e.target.value; });

    const submitBtn = new ButtonComponent({
      text: 'Confirm & Record Payment',
      variant: 'primary',
      onClick: () => {
        if (payAmount && parseFloat(payAmount) > 0) {
          suppliersService.recordPayment(supplier.id, payAmount, payMethod, poRef, payNote);
          modal.close();
          renderSuppliersTable();
        }
      }
    }).render();

    content.querySelector('#pay-submit-btn').appendChild(submitBtn);
  };

  // ── Add / Edit Supplier Modal ──────────────────────────────────────────────
  const openSupplierModal = (supplierToEdit = null) => {
    const isEdit = Boolean(supplierToEdit);

    let companyName = supplierToEdit?.companyName || '';
    let contactPerson = supplierToEdit?.contactPerson || '';
    let phone = supplierToEdit?.phone || '';
    let email = supplierToEdit?.email || '';
    let address = supplierToEdit?.address || '';
    let gstNumber = supplierToEdit?.gstNumber || '';
    let creditLimit = supplierToEdit?.creditLimit || 5000;
    let paymentTerms = supplierToEdit?.paymentTerms || 'Net 30';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';
    content.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <div id="s-company-in"></div>
        <div id="s-contact-in"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div id="s-phone-in"></div>
        <div id="s-email-in"></div>
      </div>
      <div id="s-address-in"></div>
      <div class="grid grid-cols-2 gap-2">
        <div id="s-gst-in"></div>
        <div class="input-group">
          <label class="input-label">Payment Terms</label>
          <select class="select-field" id="s-terms-sel">
            <option value="Advance" ${paymentTerms === 'Advance' ? 'selected' : ''}>Advance (Prepay)</option>
            <option value="Net 15" ${paymentTerms === 'Net 15' ? 'selected' : ''}>Net 15 Days</option>
            <option value="Net 30" ${paymentTerms === 'Net 30' ? 'selected' : ''}>Net 30 Days</option>
            <option value="Net 60" ${paymentTerms === 'Net 60' ? 'selected' : ''}>Net 60 Days</option>
          </select>
        </div>
      </div>
      <div id="s-credit-in"></div>
      <div id="s-save-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({
      title: isEdit ? `Edit Supplier — ${supplierToEdit.companyName}` : '➕ Register New Supplier',
      content
    });
    modal.open();

    const fields = [
      ['#s-company-in', 'Company Name', companyName, (v) => { companyName = v; }],
      ['#s-contact-in', 'Contact Person', contactPerson, (v) => { contactPerson = v; }],
      ['#s-phone-in', 'Phone Number', phone, (v) => { phone = v; }],
      ['#s-email-in', 'Email Address', email, (v) => { email = v; }],
      ['#s-address-in', 'Business Address', address, (v) => { address = v; }],
      ['#s-gst-in', 'GST / Tax Number', gstNumber, (v) => { gstNumber = v; }],
      ['#s-credit-in', 'Credit Limit ($)', creditLimit, (v) => { creditLimit = v; }, 'number']
    ];

    fields.forEach(([sel, label, val, onChange, type]) => {
      const el = new InputComponent({ label, value: val, onChange, type: type || 'text' }).render();
      content.querySelector(sel).appendChild(el);
    });

    content.querySelector('#s-terms-sel').addEventListener('change', (e) => { paymentTerms = e.target.value; });

    const saveBtn = new ButtonComponent({
      text: isEdit ? 'Save Changes' : 'Register Supplier',
      variant: 'primary',
      onClick: async () => {
        if (companyName) {
          const payload = { companyName, contactPerson, phone, email, address, gstNumber, creditLimit, paymentTerms };
          if (isEdit) {
            await suppliersService.updateSupplier(supplierToEdit.id, payload);
          } else {
            await suppliersService.addSupplier(payload);
          }
          modal.close();
          renderSuppliersTable();
        }
      }
    }).render();

    content.querySelector('#s-save-btn').appendChild(saveBtn);
  };

  // ── New Purchase Order Modal ───────────────────────────────────────────────
  const openPurchaseOrderModal = () => {
    const { suppliers } = suppliersStore.getState();
    let selectedSupplierId = suppliers[0]?.id || '';
    let orderItems = 5;
    let orderSubtotal = 1000.00;
    let orderTaxRate = 12;

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';
    content.innerHTML = `
      <div class="input-group">
        <label class="input-label">Select Supplier</label>
        <select class="select-field" id="po-sup-sel">
          ${suppliers.map((s) => `<option value="${s.id}">${s.companyName}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div id="po-items-in"></div>
        <div id="po-subtotal-in"></div>
        <div id="po-tax-in"></div>
      </div>
      <div class="p-3 bg-tertiary rounded" id="po-calc">
        <div class="text-muted text-xs">Estimated Grand Total</div>
        <div class="font-bold text-lg text-primary" id="po-total-display">—</div>
      </div>
      <div id="po-submit-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({ title: '🛒 Create New Purchase Order', content });
    modal.open();

    content.querySelector('#po-sup-sel').addEventListener('change', (e) => { selectedSupplierId = e.target.value; updateTotal(); });

    const updateTotal = () => {
      const tax = (parseFloat(orderSubtotal) * parseFloat(orderTaxRate)) / 100;
      const grand = parseFloat(orderSubtotal) + tax;
      const disp = content.querySelector('#po-total-display');
      if (disp) disp.textContent = isNaN(grand) ? '—' : `$${grand.toFixed(2)}`;
    };

    const itemsIn = new InputComponent({ label: 'No. of Items', type: 'number', value: orderItems, onChange: (v) => { orderItems = v; updateTotal(); } }).render();
    const subtotalIn = new InputComponent({ label: 'Subtotal ($)', type: 'number', value: orderSubtotal, onChange: (v) => { orderSubtotal = v; updateTotal(); } }).render();
    const taxIn = new InputComponent({ label: 'GST Rate (%)', type: 'number', value: orderTaxRate, onChange: (v) => { orderTaxRate = v; updateTotal(); } }).render();

    content.querySelector('#po-items-in').appendChild(itemsIn);
    content.querySelector('#po-subtotal-in').appendChild(subtotalIn);
    content.querySelector('#po-tax-in').appendChild(taxIn);
    updateTotal();

    const submitBtn = new ButtonComponent({
      text: 'Raise Purchase Order',
      variant: 'primary',
      onClick: () => {
        if (selectedSupplierId && orderSubtotal) {
          suppliersService.createPurchaseOrder(selectedSupplierId, orderItems, parseFloat(orderSubtotal), parseFloat(orderTaxRate));
          modal.close();
          renderSuppliersTable();
        }
      }
    }).render();

    content.querySelector('#po-submit-btn').appendChild(submitBtn);
  };

  // ── Analytics Report Modal ─────────────────────────────────────────────────
  const openAnalyticsModal = () => {
    const { suppliers, purchaseOrders, payments } = suppliersStore.getState();
    const totalPaidAll = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const totalPurchased = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';
    content.innerHTML = `
      <!-- Top KPI Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-3 text-center">
          <div class="text-muted">Total POs Raised</div>
          <div class="font-bold text-2xl text-primary">${purchaseOrders.length}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total Payments Made</div>
          <div class="font-bold text-2xl text-success">$${totalPaidAll.toLocaleString()}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total Procurement Value</div>
          <div class="font-bold text-2xl text-info">$${totalPurchased.toLocaleString()}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total Outstanding Payable</div>
          <div class="font-bold text-2xl text-danger">$${totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      <!-- Top Suppliers by Purchase Volume -->
      <div class="font-bold">Top Suppliers by Procurement Volume</div>
      ${suppliers
        .sort((a, b) => b.totalPurchased - a.totalPurchased)
        .map((s, i) => `
          <div class="flex items-center justify-between p-2 bg-tertiary rounded">
            <div class="flex items-center gap-2">
              <span class="font-bold text-primary">#${i + 1}</span>
              <div>
                <div class="font-bold">${s.companyName}</div>
                <div class="text-muted">${s.category}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-success">$${s.totalPurchased.toLocaleString()}</div>
              <div class="text-danger text-xs">Owes: $${s.outstandingBalance.toFixed(2)}</div>
            </div>
          </div>
        `).join('')}
    `;

    const modal = new ModalComponent({ title: '📊 Supplier Analytics & Procurement Report', content });
    modal.open();
  };

  return container;
}
