import { purchasesStore } from '../store/purchases.store.js';
import { purchasesService } from '../services/purchases.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { SelectComponent } from '../components/base/select.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function PurchasesView() {
  const container = document.createElement('div');
  container.className = 'purchases-view flex flex-col gap-6';

  // ── KPI Summary Strip ─────────────────────────────────────────────────────
  const { reportSummary } = purchasesStore.getState();

  const kpiStrip = document.createElement('div');
  kpiStrip.className = 'grid grid-cols-5 gap-4';
  kpiStrip.innerHTML = `
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">POs This Month</div>
      <div class="font-bold text-2xl text-primary">${reportSummary.totalPOsThisMonth}</div>
      <div class="text-xs text-secondary mt-1">Total purchase orders</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Procurement Value</div>
      <div class="font-bold text-2xl text-info">$${reportSummary.totalPurchaseValue.toFixed(2)}</div>
      <div class="text-xs text-secondary mt-1">Gross purchase total</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Total Paid</div>
      <div class="font-bold text-2xl text-success">$${reportSummary.totalPaid.toFixed(2)}</div>
      <div class="text-xs text-secondary mt-1">Settled to suppliers</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Outstanding</div>
      <div class="font-bold text-2xl text-danger">$${reportSummary.totalOutstanding.toFixed(2)}</div>
      <div class="text-xs text-secondary mt-1">Pending payments</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-muted mb-1">Returns Value</div>
      <div class="font-bold text-2xl text-warning">$${reportSummary.totalReturnsValue.toFixed(2)}</div>
      <div class="text-xs text-secondary mt-1">Returned to suppliers</div>
    </div>
  `;
  container.appendChild(kpiStrip);

  // ── Control Header Bar ────────────────────────────────────────────────────
  let searchQuery = '';
  let statusFilter = 'all';

  const headerCard = new CardComponent({
    title: '🛒 Purchase Order & Invoice Management',
    subtitle: 'Create POs, track deliveries, manage supplier payments, returns & inventory updates',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button id="new-po-btn" class="btn btn-primary btn-sm">➕ New Purchase Order</button>
          <button id="view-returns-btn" class="btn btn-secondary btn-sm">↩️ Purchase Returns</button>
          <button id="view-report-btn" class="btn btn-secondary btn-sm">📊 Purchase Reports</button>
          <button id="export-csv-btn" class="btn btn-secondary btn-sm">📤 Export CSV</button>
        </div>
        <div class="flex gap-2 flex-wrap" id="po-filter-controls"></div>
      </div>
    `
  }).render();

  const filterControls = headerCard.querySelector('#po-filter-controls');

  const searchInput = new InputComponent({
    placeholder: '🔍 Search PO number or supplier...',
    onChange: (val) => { searchQuery = val.toLowerCase(); renderPOTable(); }
  }).render();
  searchInput.style.maxWidth = '230px';

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Payment' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'paid', label: 'Fully Paid' }
  ];
  const statusSelect = new SelectComponent({
    options: statusOptions, value: 'all',
    onChange: (val) => { statusFilter = val; renderPOTable(); }
  }).render();

  filterControls.appendChild(searchInput);
  filterControls.appendChild(statusSelect);

  headerCard.querySelector('#new-po-btn').addEventListener('click', () => openNewPOModal());
  headerCard.querySelector('#view-returns-btn').addEventListener('click', () => openReturnsModal());
  headerCard.querySelector('#view-report-btn').addEventListener('click', () => openReportModal());
  headerCard.querySelector('#export-csv-btn').addEventListener('click', () => purchasesService.exportToCSV());
  container.appendChild(headerCard);

  // ── Purchase Orders Table ─────────────────────────────────────────────────
  const tableCard = new CardComponent({
    title: 'Purchase Orders & Invoice Register',
    content: `<div id="po-table-wrapper"></div>`
  }).render();
  container.appendChild(tableCard);

  const renderPOTable = () => {
    const { purchaseOrders } = purchasesStore.getState();
    const filtered = purchaseOrders.filter((po) => {
      const matchSearch = !searchQuery || po.poNumber.toLowerCase().includes(searchQuery) || po.supplierName.toLowerCase().includes(searchQuery);
      const matchStatus = statusFilter === 'all' || po.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    const wrapper = tableCard.querySelector('#po-table-wrapper');
    wrapper.innerHTML = '';

    const table = new TableComponent({
      columns: [
        { key: 'poNumber', title: 'PO Number', render: (val) => `<code class="font-mono text-primary font-bold">${val}</code>` },
        { key: 'supplierName', title: 'Supplier' },
        { key: 'items', title: 'Line Items', render: (_, row) => `${row.items.length} SKUs` },
        { key: 'subtotal', title: 'Subtotal', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'gstAmount', title: 'GST', render: (val) => `<span class="text-warning">$${parseFloat(val).toFixed(2)}</span>` },
        { key: 'totalAmount', title: 'Grand Total', render: (val) => `<strong class="text-primary">$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'paidAmount', title: 'Paid', render: (val) => `<span class="text-success">$${parseFloat(val).toFixed(2)}</span>` },
        {
          key: 'paymentStatus', title: 'Payment',
          render: (val) => {
            const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
            return `<span class="badge ${map[val] || 'badge-secondary'}">${val.toUpperCase()}</span>`;
          }
        },
        {
          key: 'orderStatus', title: 'Order Status',
          render: (val) => {
            const map = { draft: 'badge-secondary', ordered: 'badge-primary', received: 'badge-success', returned: 'badge-danger' };
            return `<span class="badge ${map[val] || 'badge-secondary'}">${val.toUpperCase()}</span>`;
          }
        },
        { key: 'createdAt', title: 'Date' },
        {
          key: 'actions', title: 'Actions',
          render: (_, row) => {
            const wrap = document.createElement('div');
            wrap.className = 'flex gap-1 flex-wrap';

            // View Invoice
            wrap.appendChild(new ButtonComponent({
              text: '📄 Invoice',
              variant: 'secondary', size: 'sm',
              onClick: () => openInvoiceModal(row)
            }).render());

            // PDF Print
            wrap.appendChild(new ButtonComponent({
              text: '🖨️ PDF',
              variant: 'secondary', size: 'sm',
              onClick: () => purchasesService.printPurchaseInvoice(row)
            }).render());

            // Record Payment (if not fully paid)
            if (row.paymentStatus !== 'paid') {
              wrap.appendChild(new ButtonComponent({
                text: '💳 Pay',
                variant: 'primary', size: 'sm',
                onClick: () => openPaymentModal(row)
              }).render());
            }

            // Mark as Received (if still in ordered state)
            if (row.orderStatus === 'ordered') {
              wrap.appendChild(new ButtonComponent({
                text: '📦 Receive',
                variant: 'secondary', size: 'sm',
                onClick: () => {
                  purchasesService.markAsReceived(row.id);
                  renderPOTable();
                }
              }).render());
            }

            // Return
            if (row.orderStatus === 'received') {
              wrap.appendChild(new ButtonComponent({
                text: '↩️ Return',
                variant: 'danger', size: 'sm',
                onClick: () => openReturnModal(row)
              }).render());
            }

            return wrap;
          }
        }
      ],
      data: filtered
    }).render();

    wrapper.appendChild(table);
  };

  renderPOTable();

  // ── New Purchase Order Modal ───────────────────────────────────────────────
  const openNewPOModal = () => {
    const { suppliers } = purchasesStore.getState();
    let selectedSupplierId = suppliers[0]?.id || '';
    let selectedSupplierName = suppliers[0]?.companyName || '';
    let notes = '';
    let expectedDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let discountAmount = 0;

    // Line items collection
    let lineItems = [
      { productName: '', sku: '', qty: 1, unitCost: 10.00, gstRate: 12 }
    ];

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';

    const renderForm = () => {
      content.innerHTML = `
        <!-- Supplier & Dates -->
        <div class="grid grid-cols-3 gap-2">
          <div class="input-group col-span-1">
            <label class="input-label">Supplier *</label>
            <select class="select-field" id="po-sup-sel">
              ${suppliers.map((s) => `<option value="${s.id}" data-name="${s.companyName}" ${s.id === selectedSupplierId ? 'selected' : ''}>${s.companyName}</option>`).join('')}
            </select>
          </div>
          <div id="po-date-in"></div>
          <div id="po-disc-in"></div>
        </div>

        <!-- Line Items Table -->
        <div class="font-bold text-sm flex justify-between items-center">
          <span>Line Items</span>
          <button id="add-line-btn" class="btn btn-primary btn-sm">+ Add Item Row</button>
        </div>
        <div id="line-items-wrapper" class="flex flex-col gap-2"></div>

        <!-- Live Totals -->
        <div class="grid grid-cols-3 gap-2 p-3 bg-tertiary rounded" id="totals-calc">
          <div class="text-center">
            <div class="text-muted">Subtotal</div>
            <div class="font-bold text-lg text-primary" id="calc-subtotal">$0.00</div>
          </div>
          <div class="text-center">
            <div class="text-muted">GST Amount</div>
            <div class="font-bold text-lg text-warning" id="calc-gst">$0.00</div>
          </div>
          <div class="text-center">
            <div class="text-muted">Grand Total</div>
            <div class="font-bold text-xl text-success" id="calc-total">$0.00</div>
          </div>
        </div>

        <div id="po-notes-in"></div>
        <div id="po-submit-btn" class="mt-2"></div>
      `;

      // Bind supplier select
      content.querySelector('#po-sup-sel').addEventListener('change', (e) => {
        selectedSupplierId = e.target.value;
        selectedSupplierName = e.target.options[e.target.selectedIndex].dataset.name;
      });

      // Date & discount inputs
      const dateIn = new InputComponent({ label: 'Expected Delivery Date', type: 'date', value: expectedDate, onChange: (v) => { expectedDate = v; } }).render();
      const discIn = new InputComponent({ label: 'Discount ($)', type: 'number', value: 0, onChange: (v) => { discountAmount = v; updateTotals(); } }).render();
      const notesIn = new InputComponent({ label: 'Notes / Remarks', placeholder: 'Optional delivery instructions...', onChange: (v) => { notes = v; } }).render();

      content.querySelector('#po-date-in').appendChild(dateIn);
      content.querySelector('#po-disc-in').appendChild(discIn);
      content.querySelector('#po-notes-in').appendChild(notesIn);

      // Add line item row button
      content.querySelector('#add-line-btn').addEventListener('click', () => {
        lineItems.push({ productName: '', sku: '', qty: 1, unitCost: 10.00, gstRate: 12 });
        renderLineItems();
      });

      renderLineItems();

      // Submit
      const submitBtn = new ButtonComponent({
        text: '🛒 Create Purchase Order',
        variant: 'primary',
        onClick: () => {
          if (selectedSupplierId && lineItems.length > 0 && lineItems[0].productName) {
            purchasesService.createPurchaseOrder({
              supplierId: selectedSupplierId,
              supplierName: selectedSupplierName,
              items: lineItems,
              discountAmount,
              expectedDate,
              notes
            });
            modal.close();
            renderPOTable();
          }
        }
      }).render();

      content.querySelector('#po-submit-btn').appendChild(submitBtn);
    };

    const renderLineItems = () => {
      const wrapper = content.querySelector('#line-items-wrapper');
      if (!wrapper) return;
      wrapper.innerHTML = '';

      lineItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'grid gap-1 p-2 bg-tertiary rounded';
        row.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 1fr auto';

        row.innerHTML = `
          <input class="input-field text-xs" placeholder="Product Name *" value="${item.productName}" data-field="productName" data-idx="${idx}" />
          <input class="input-field text-xs" placeholder="SKU" value="${item.sku}" data-field="sku" data-idx="${idx}" />
          <input class="input-field text-xs" placeholder="Qty" type="number" value="${item.qty}" data-field="qty" data-idx="${idx}" />
          <input class="input-field text-xs" placeholder="Unit Cost $" type="number" value="${item.unitCost}" data-field="unitCost" data-idx="${idx}" />
          <input class="input-field text-xs" placeholder="GST %" type="number" value="${item.gstRate}" data-field="gstRate" data-idx="${idx}" />
          <button class="btn btn-danger btn-sm" data-remove="${idx}">✕</button>
        `;

        // Bind field changes
        row.querySelectorAll('[data-field]').forEach((inp) => {
          inp.addEventListener('input', (e) => {
            const i = parseInt(e.target.dataset.idx);
            const field = e.target.dataset.field;
            lineItems[i][field] = ['qty', 'unitCost', 'gstRate'].includes(field) ? parseFloat(e.target.value) || 0 : e.target.value;
            updateTotals();
          });
        });

        // Remove row
        row.querySelector('[data-remove]').addEventListener('click', (e) => {
          const i = parseInt(e.target.dataset.remove);
          lineItems.splice(i, 1);
          renderLineItems();
          updateTotals();
        });

        wrapper.appendChild(row);
      });

      updateTotals();
    };

    const updateTotals = () => {
      const subtotal = lineItems.reduce((s, it) => s + (it.qty * it.unitCost), 0);
      const gst = lineItems.reduce((s, it) => s + (it.qty * it.unitCost * it.gstRate / 100), 0);
      const total = subtotal + gst - (parseFloat(discountAmount) || 0);
      const subEl = content.querySelector('#calc-subtotal');
      const gstEl = content.querySelector('#calc-gst');
      const totEl = content.querySelector('#calc-total');
      if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;
      if (gstEl) gstEl.textContent = `$${gst.toFixed(2)}`;
      if (totEl) totEl.textContent = `$${total.toFixed(2)}`;
    };

    const modal = new ModalComponent({ title: '➕ Create New Purchase Order', content });
    modal.open();
    renderForm();
  };

  // ── Purchase Invoice View Modal ────────────────────────────────────────────
  const openInvoiceModal = (po) => {
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';

    const balance = po.totalAmount - po.paidAmount;
    const statusMap = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
    const orderMap = { draft: 'badge-secondary', ordered: 'badge-primary', received: 'badge-success', returned: 'badge-danger' };

    content.innerHTML = `
      <!-- Header -->
      <div class="flex justify-between items-start p-4 bg-tertiary rounded">
        <div>
          <div class="font-bold text-lg text-primary">${po.poNumber}</div>
          <div class="text-secondary">Supplier: <strong>${po.supplierName}</strong></div>
          <div class="text-muted">Created: ${po.createdAt} &bull; Expected: ${po.expectedDate}</div>
        </div>
        <div class="text-right flex flex-col gap-1">
          <span class="badge ${statusMap[po.paymentStatus]}">${po.paymentStatus.toUpperCase()}</span>
          <span class="badge ${orderMap[po.orderStatus]}">${po.orderStatus.toUpperCase()}</span>
        </div>
      </div>

      <!-- Line Items -->
      <div class="font-bold">Ordered Line Items (${po.items.length})</div>
      <div id="invoice-items-table"></div>

      <!-- Totals -->
      <div class="flex flex-col items-end gap-1 p-3 bg-tertiary rounded">
        <div class="flex justify-between w-56"><span class="text-muted">Subtotal</span><span>$${po.subtotal.toFixed(2)}</span></div>
        <div class="flex justify-between w-56"><span class="text-muted">GST / Tax</span><span class="text-warning">$${po.gstAmount.toFixed(2)}</span></div>
        <div class="flex justify-between w-56"><span class="text-muted">Discount</span><span>-$${(po.discountAmount || 0).toFixed(2)}</span></div>
        <div class="flex justify-between w-56 font-bold text-lg"><span>Grand Total</span><span class="text-primary">$${po.totalAmount.toFixed(2)}</span></div>
        <div class="flex justify-between w-56"><span class="text-muted">Amount Paid</span><span class="text-success">$${po.paidAmount.toFixed(2)}</span></div>
        <div class="flex justify-between w-56 font-bold"><span>Balance Due</span><span class="text-danger">$${balance.toFixed(2)}</span></div>
      </div>

      ${po.notes ? `<div class="p-2 bg-tertiary rounded text-muted"><strong>Notes:</strong> ${po.notes}</div>` : ''}

      <!-- Actions -->
      <div class="flex gap-2 justify-end mt-2" id="invoice-action-btns"></div>
    `;

    const itemsTable = new TableComponent({
      columns: [
        { key: 'productName', title: 'Product' },
        { key: 'sku', title: 'SKU', render: (val) => `<code class="font-mono text-primary text-xs">${val}</code>` },
        { key: 'qty', title: 'Qty' },
        { key: 'unitCost', title: 'Unit Cost', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'gstRate', title: 'GST %', render: (val) => `<span class="badge badge-primary">${val}%</span>` },
        {
          key: 'lineTotal', title: 'Line Total',
          render: (_, row) => {
            const base = row.qty * row.unitCost;
            const tax = base * row.gstRate / 100;
            return `<strong>$${(base + tax).toFixed(2)}</strong>`;
          }
        }
      ],
      data: po.items
    }).render();

    const modal = new ModalComponent({ title: `Purchase Invoice — ${po.poNumber}`, content });
    content.querySelector('#invoice-items-table').appendChild(itemsTable);

    // Action buttons
    const actionsWrap = content.querySelector('#invoice-action-btns');
    actionsWrap.appendChild(new ButtonComponent({
      text: '🖨️ Print PDF Invoice',
      variant: 'primary', size: 'sm',
      onClick: () => purchasesService.printPurchaseInvoice(po)
    }).render());

    if (po.paymentStatus !== 'paid') {
      actionsWrap.appendChild(new ButtonComponent({
        text: '💳 Record Payment',
        variant: 'secondary', size: 'sm',
        onClick: () => { modal.close(); openPaymentModal(po); }
      }).render());
    }

    modal.open();
  };

  // ── Record Payment Modal ───────────────────────────────────────────────────
  const openPaymentModal = (po) => {
    const balance = po.totalAmount - po.paidAmount;
    let payAmount = balance.toFixed(2);

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';
    content.innerHTML = `
      <div class="p-3 bg-tertiary rounded flex justify-between items-center">
        <div>
          <div class="text-muted">Balance Due on ${po.poNumber}</div>
          <div class="font-bold text-xl text-danger">$${balance.toFixed(2)}</div>
        </div>
        <div class="text-right">
          <div class="text-muted">Supplier</div>
          <div class="font-bold">${po.supplierName}</div>
        </div>
      </div>
      <div id="pay-amount-wrapper"></div>
      <div class="input-group">
        <label class="input-label">Payment Method</label>
        <select class="select-field" id="pay-method">
          <option value="bank_transfer">🏦 Bank Transfer</option>
          <option value="upi">📲 UPI / Digital Wallet</option>
          <option value="cash">💵 Cash</option>
          <option value="cheque">🪙 Cheque</option>
        </select>
      </div>
      <div id="pay-submit"></div>
    `;

    const modal = new ModalComponent({ title: `💳 Record Payment — ${po.poNumber}`, content });
    modal.open();

    const amountIn = new InputComponent({
      label: `Payment Amount (Max: $${balance.toFixed(2)})`,
      type: 'number', value: payAmount,
      onChange: (v) => { payAmount = v; }
    }).render();
    content.querySelector('#pay-amount-wrapper').appendChild(amountIn);

    const submitBtn = new ButtonComponent({
      text: 'Confirm Payment',
      variant: 'primary',
      onClick: () => {
        if (payAmount && parseFloat(payAmount) > 0) {
          purchasesService.recordPayment(po.id, payAmount);
          modal.close();
          renderPOTable();
        }
      }
    }).render();
    content.querySelector('#pay-submit').appendChild(submitBtn);
  };

  // ── Purchase Return Modal ──────────────────────────────────────────────────
  const openReturnModal = (po) => {
    let selectedProduct = po.items[0]?.productName || '';
    let returnQty = 1;
    let reason = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';
    content.innerHTML = `
      <div class="p-3 bg-tertiary rounded">
        <div class="text-muted">Returning items from PO</div>
        <div class="font-bold text-primary">${po.poNumber} — ${po.supplierName}</div>
      </div>
      <div class="input-group">
        <label class="input-label">Select Product to Return</label>
        <select class="select-field" id="ret-product-sel">
          ${po.items.map((it) => `<option value="${it.productName}">${it.productName} (Available: ${it.qty})</option>`).join('')}
        </select>
      </div>
      <div id="ret-qty-in"></div>
      <div id="ret-reason-in"></div>
      <div id="ret-submit" class="mt-2"></div>
    `;

    const modal = new ModalComponent({ title: `↩️ Purchase Return — ${po.poNumber}`, content });
    modal.open();

    content.querySelector('#ret-product-sel').addEventListener('change', (e) => { selectedProduct = e.target.value; });

    const qtyIn = new InputComponent({ label: 'Return Quantity', type: 'number', value: 1, onChange: (v) => { returnQty = v; } }).render();
    const reasonIn = new InputComponent({ label: 'Return Reason', placeholder: 'Damaged, wrong item, etc.', onChange: (v) => { reason = v; } }).render();

    content.querySelector('#ret-qty-in').appendChild(qtyIn);
    content.querySelector('#ret-reason-in').appendChild(reasonIn);

    const submitBtn = new ButtonComponent({
      text: 'Raise Return',
      variant: 'danger',
      onClick: () => {
        if (selectedProduct && returnQty && reason) {
          purchasesService.createReturn(po.id, selectedProduct, returnQty, reason);
          modal.close();
        }
      }
    }).render();
    content.querySelector('#ret-submit').appendChild(submitBtn);
  };

  // ── Returns Log Modal ──────────────────────────────────────────────────────
  const openReturnsModal = () => {
    const { purchaseReturns } = purchasesStore.getState();

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3';

    const table = new TableComponent({
      columns: [
        { key: 'returnNumber', title: 'Return #', render: (val) => `<code class="font-mono text-danger">${val}</code>` },
        { key: 'poReference', title: 'PO Reference' },
        { key: 'supplierName', title: 'Supplier' },
        { key: 'productName', title: 'Product' },
        { key: 'returnQty', title: 'Qty' },
        { key: 'reason', title: 'Reason' },
        { key: 'refundAmount', title: 'Refund', render: (val) => `<strong class="text-success">$${parseFloat(val).toFixed(2)}</strong>` },
        {
          key: 'status', title: 'Status',
          render: (val) => `<span class="badge ${val === 'approved' ? 'badge-success' : 'badge-warning'}">${val.toUpperCase()}</span>`
        },
        { key: 'date', title: 'Date' }
      ],
      data: purchaseReturns
    }).render();

    content.appendChild(table);

    const modal = new ModalComponent({ title: '↩️ Purchase Returns Register', content });
    modal.open();
  };

  // ── Procurement Report Modal ───────────────────────────────────────────────
  const openReportModal = () => {
    const { purchaseOrders, purchaseReturns } = purchasesStore.getState();

    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalPaid = purchaseOrders.reduce((s, o) => s + o.paidAmount, 0);
    const totalGst = purchaseOrders.reduce((s, o) => s + o.gstAmount, 0);
    const totalOutstanding = totalValue - totalPaid;
    const totalReturns = purchaseReturns.reduce((s, r) => s + r.refundAmount, 0);

    const statusBreakdown = ['paid', 'partial', 'pending'].map((status) => {
      const count = purchaseOrders.filter((o) => o.paymentStatus === status).length;
      return { status, count, pct: Math.round((count / totalOrders) * 100) };
    });

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';
    content.innerHTML = `
      <!-- Summary KPIs -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-muted">Total Purchase Orders</div>
          <div class="font-bold text-2xl text-primary">${totalOrders}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total Procurement</div>
          <div class="font-bold text-2xl text-info">$${totalValue.toFixed(2)}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Total GST Paid</div>
          <div class="font-bold text-2xl text-warning">$${totalGst.toFixed(2)}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Amount Settled</div>
          <div class="font-bold text-2xl text-success">$${totalPaid.toFixed(2)}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Outstanding Balance</div>
          <div class="font-bold text-2xl text-danger">$${totalOutstanding.toFixed(2)}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Returns Value</div>
          <div class="font-bold text-2xl text-warning">$${totalReturns.toFixed(2)}</div>
        </div>
      </div>

      <!-- Payment Status Breakdown -->
      <div class="font-bold">Payment Status Breakdown</div>
      ${statusBreakdown.map(({ status, count, pct }) => `
        <div class="flex items-center gap-3">
          <div class="w-20 capitalize font-bold">${status}</div>
          <div class="flex-1 bg-secondary rounded" style="height:8px;">
            <div style="width:${pct}%; height:8px; border-radius:99px; background:${status === 'paid' ? 'var(--color-success)' : status === 'partial' ? '#f59e0b' : 'var(--color-danger)'};"></div>
          </div>
          <div class="font-bold">${count} POs (${pct}%)</div>
        </div>
      `).join('')}

      <!-- Print Button -->
      <div class="flex justify-end mt-2">
        <button class="btn btn-primary btn-sm" onclick="window.print()">🖨️ Print Procurement Report</button>
      </div>
    `;

    const modal = new ModalComponent({ title: '📊 Procurement & Purchase Analytics Report', content });
    modal.open();
  };

  return container;
}
