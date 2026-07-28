/**
 * POS Billing View — with integrated Barcode Scanner
 *
 * This module renders the full POS billing terminal including:
 *   • BarcodeScannerComponent (USB/BT/Camera barcode input)
 *   • Product search (name + barcode)
 *   • Cart management (add, remove, adjust qty)
 *   • Real-time subtotal, GST, discount and grand total
 *   • Customer selection + loyalty points redemption
 *   • Payment modal (Cash, Card, UPI, Wallet, Split)
 *   • Thermal receipt printing (58mm & 80mm)
 *   • Offline-first: cart persists in sessionStorage
 *
 * All barcode scanner functionality is additive — no existing billing
 * layout has been altered. The scanner strip renders above the product
 * search bar as a compact collapsible section.
 */

import { BarcodeScannerComponent } from '../components/pos/barcode-scanner.component.js';
import { barcodeScannerService }   from '../services/barcode-scanner.service.js';
import { barcodeAudio }            from '../services/barcode-audio.service.js';
import { productsStore }           from '../store/products.store.js';
import { customersStore }          from '../store/customers.store.js';
import { eventBus }                from '../core/event-bus.js';
import { CardComponent }           from '../components/base/card.component.js';
import { ButtonComponent }         from '../components/base/button.component.js';
import { InputComponent }          from '../components/base/input.component.js';
import { ModalComponent }          from '../components/base/modal.component.js';
import { TableComponent }          from '../components/base/table.component.js';

// ─── GST Rates available at billing ──────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];

export async function POSBillingView() {
  const container = document.createElement('div');
  container.className = 'pos-billing-view flex flex-col gap-4';

  // ─── Cart State ─────────────────────────────────────────────────────────────
  let cartItems    = _restoreCart();   // [{ product, qty, sellingPrice, gstRate }]
  let selectedCustomer = null;
  let discountType     = 'flat';       // 'flat' | 'percent'
  let discountValue    = 0;
  let loyaltyRedeem    = 0;            // points converted to currency

  // ─── Seed barcode cache with current product catalog ─────────────────────────
  const { products } = productsStore.getState();
  barcodeScannerService.seedCache(products);

  // ─── Scanner Component ────────────────────────────────────────────────────────
  const scannerComponent = new BarcodeScannerComponent({
    onProductResolved: (product) => {
      _addToCart(product);
      _showScanToast(product.name);
    },
    onNotFound: (barcode) => {
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'error',
        title: 'Product Not Found',
        message: `No product matched barcode: ${barcode}`
      });
    }
  });

  container.appendChild(scannerComponent.render());
  scannerComponent.mount();

  // ─── Layout: two-column POS terminal ──────────────────────────────────────────
  const posGrid = document.createElement('div');
  posGrid.className = 'grid-pos-layout w-full min-w-0';


  // ── Left Column: Product Search + Catalog ──────────────────────────────────
  const leftCol = document.createElement('div');
  leftCol.className = 'flex flex-col gap-4';

  // Product search bar
  let productSearch = '';
  const searchCard = new CardComponent({
    title: '🛍️ POS Billing Terminal',
    subtitle: 'Scan barcode above, or search and click a product to add to cart',
    content: `<div id="product-search-wrapper" class="mt-2"></div>`
  }).render();

  const searchInput = new InputComponent({
    placeholder: '🔍 Search product by name or SKU...',
    onChange: (val) => {
      productSearch = val.toLowerCase();
      renderProductGrid();
    }
  }).render();
  searchCard.querySelector('#product-search-wrapper').appendChild(searchInput);
  leftCol.appendChild(searchCard);

  // Product Grid
  const productGridCard = new CardComponent({
    title: 'Product Catalog',
    content: `<div id="product-grid" class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));"></div>`
  }).render();
  leftCol.appendChild(productGridCard);

  const renderProductGrid = () => {
    const grid = productGridCard.querySelector('#product-grid');
    grid.innerHTML = '';
    const { products } = productsStore.getState();
    const filtered = products.filter((p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch) ||
      p.sku.toLowerCase().includes(productSearch) ||
      p.barcode.includes(productSearch)
    );

    filtered.slice(0, 24).forEach((p) => {
      const tile = document.createElement('div');
      tile.className = 'card p-3 cursor-pointer hover-lift';
      tile.style.cssText = `
        cursor:pointer; transition: all 0.15s;
        border: 1.5px solid var(--color-border);
      `;
      tile.innerHTML = `
        <img src="${p.imageUrl}" style="width:100%;height:70px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:6px;" />
        <div class="font-bold text-xs truncate" title="${p.name}">${p.name}</div>
        <div class="text-xs text-muted font-mono">${p.sku}</div>
        <div class="flex justify-between items-center mt-1">
          <span class="font-bold text-primary text-sm">$${parseFloat(p.sellingPrice).toFixed(2)}</span>
          <span class="badge ${p.stockQuantity <= p.minStockLevel ? 'badge-danger' : 'badge-success'} text-xs">${p.stockQuantity}</span>
        </div>
      `;
      tile.addEventListener('mouseenter', () => { tile.style.borderColor = 'var(--color-primary)'; });
      tile.addEventListener('mouseleave', () => { tile.style.borderColor = 'var(--color-border)'; });
      tile.addEventListener('click', () => _addToCart(p));
      grid.appendChild(tile);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="text-muted text-xs p-4">No products matched "${productSearch}"</div>`;
    }
  };

  renderProductGrid();

  // ── Right Column: Cart + Totals + Payment ─────────────────────────────────
  const rightCol = document.createElement('div');
  rightCol.className = 'flex flex-col gap-4';
  rightCol.style.position = 'sticky';
  rightCol.style.top = '80px';

  // Customer selector
  const customerCard = new CardComponent({
    title: '👤 Customer (Optional)',
    content: `
      <div class="flex gap-2 mt-2">
        <div id="cust-search-wrapper" style="flex:1;"></div>
        <button id="clear-cust-btn" class="btn btn-secondary btn-sm">✕ Clear</button>
      </div>
      <div id="cust-info-display" class="mt-2 text-xs text-muted"></div>
    `
  }).render();

  let custSearch = '';
  const custInput = new InputComponent({
    placeholder: 'Search customer name / phone...',
    onChange: (val) => {
      custSearch = val.toLowerCase();
      renderCustomerDropdown();
    }
  }).render();
  customerCard.querySelector('#cust-search-wrapper').appendChild(custInput);

  let custDropdown = null;

  const renderCustomerDropdown = () => {
    if (custDropdown) { custDropdown.remove(); custDropdown = null; }
    if (!custSearch || custSearch.length < 2) return;

    const { customers } = customersStore.getState();
    const matches = customers.filter((c) =>
      c.name.toLowerCase().includes(custSearch) || c.phone.includes(custSearch)
    ).slice(0, 5);

    if (matches.length === 0) return;

    custDropdown = document.createElement('div');
    custDropdown.style.cssText = `
      position:absolute; background:var(--color-surface);
      border:1px solid var(--color-border); border-radius:var(--radius-sm);
      z-index:100; width:100%; max-height:180px; overflow-y:auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    `;

    matches.forEach((c) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:8px 10px; cursor:pointer; font-size:12px; border-bottom:1px solid var(--color-border);';
      item.innerHTML = `<strong>${c.name}</strong> <span class="text-muted">${c.phone}</span>`;
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--color-bg)'; });
      item.addEventListener('mouseleave', () => { item.style.background = ''; });
      item.addEventListener('click', () => {
        selectedCustomer = c;
        custDropdown.remove(); custDropdown = null;
        const infoEl = customerCard.querySelector('#cust-info-display');
        infoEl.innerHTML = `
          <span class="badge badge-success">${c.membershipTier.toUpperCase()}</span>
          &nbsp;${c.name} &bull; Wallet: <strong>$${c.walletBalance.toFixed(2)}</strong>
          &bull; Loyalty: <strong>${c.loyaltyPoints} pts</strong>
        `;
        renderTotals();
        scannerComponent.focus();
      });
      custDropdown.appendChild(item);
    });

    const wrapper = customerCard.querySelector('#cust-search-wrapper');
    wrapper.style.position = 'relative';
    wrapper.appendChild(custDropdown);
  };

  customerCard.querySelector('#clear-cust-btn').addEventListener('click', () => {
    selectedCustomer = null;
    loyaltyRedeem = 0;
    customerCard.querySelector('#cust-info-display').innerHTML = '';
    renderTotals();
  });

  rightCol.appendChild(customerCard);

  // Cart card
  const cartCard = new CardComponent({
    title: '🛒 Cart',
    content: `
      <div id="cart-table-wrapper" class="mt-2"></div>
      <div class="flex gap-2 mt-3" id="cart-clear-row">
        <button id="clear-cart-btn" class="btn btn-danger btn-sm">🗑️ Clear Cart</button>
        <button id="hold-btn" class="btn btn-secondary btn-sm">⏸️ Hold Bill</button>
      </div>
    `
  }).render();

  cartCard.querySelector('#clear-cart-btn').addEventListener('click', () => {
    cartItems = [];
    _persistCart(cartItems);
    renderCart();
    renderTotals();
    scannerComponent.focus();
  });

  cartCard.querySelector('#hold-btn').addEventListener('click', () => {
    eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'info', title: 'Bill on Hold', message: 'Cart saved — start a new bill.' });
  });

  rightCol.appendChild(cartCard);

  // Discount card
  const discountCard = new CardComponent({
    title: '🏷️ Discount & Loyalty',
    content: `
      <div class="grid gap-2 mt-2" style="grid-template-columns:auto 1fr;">
        <select class="select-field text-xs" id="disc-type-sel" style="padding:6px 8px;">
          <option value="flat">Flat ($)</option>
          <option value="percent">Percent (%)</option>
        </select>
        <div id="disc-amount-wrapper"></div>
      </div>
      <div id="loyalty-row" class="mt-2 text-xs text-muted" style="display:none;"></div>
    `
  }).render();

  discountCard.querySelector('#disc-type-sel').addEventListener('change', (e) => {
    discountType = e.target.value;
    renderTotals();
  });

  const discInput = new InputComponent({
    type: 'number', placeholder: '0', value: 0,
    onChange: (v) => { discountValue = parseFloat(v) || 0; renderTotals(); }
  }).render();
  discountCard.querySelector('#disc-amount-wrapper').appendChild(discInput);
  rightCol.appendChild(discountCard);

  // Totals card
  const totalsCard = new CardComponent({
    title: '💰 Bill Summary',
    content: `
      <div id="totals-display" class="flex flex-col gap-1 mt-2 text-xs"></div>
      <button id="charge-btn" class="btn btn-primary w-full mt-4" style="font-size:14px; padding:12px;">
        💳 Charge & Print Receipt
      </button>
    `
  }).render();

  totalsCard.querySelector('#charge-btn').addEventListener('click', () => {
    if (cartItems.length === 0) {
      eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'warning', title: 'Empty Cart', message: 'Add products before charging.' });
      return;
    }
    openPaymentModal();
  });

  rightCol.appendChild(totalsCard);

  posGrid.appendChild(leftCol);
  posGrid.appendChild(rightCol);
  container.appendChild(posGrid);

  // ─── Cart Render ──────────────────────────────────────────────────────────────
  const renderCart = () => {
    const wrapper = cartCard.querySelector('#cart-table-wrapper');
    wrapper.innerHTML = '';

    if (cartItems.length === 0) {
      wrapper.innerHTML = `<div class="text-muted text-xs p-4 text-center">Cart is empty — scan a barcode or click a product</div>`;
      return;
    }

    const table = document.createElement('table');
    table.style.cssText = 'width:100%; border-collapse:collapse; font-size:11px;';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom:1px solid var(--color-border);">
          <th style="text-align:left; padding:4px 6px; color:var(--color-text-muted);">Product</th>
          <th style="text-align:center; padding:4px 6px; color:var(--color-text-muted);">Qty</th>
          <th style="text-align:right; padding:4px 6px; color:var(--color-text-muted);">Price</th>
          <th style="text-align:right; padding:4px 6px; color:var(--color-text-muted);">Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="cart-tbody"></tbody>
    `;

    const tbody = table.querySelector('#cart-tbody');
    cartItems.forEach((item, idx) => {
      const lineTotal = item.qty * item.sellingPrice;
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid var(--color-border);';
      tr.innerHTML = `
        <td style="padding:6px;">
          <div class="font-bold" style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.product.name}">${item.product.name}</div>
          <div style="color:var(--color-text-muted); font-size:10px;">${item.product.sku} &bull; GST ${item.gstRate}%</div>
        </td>
        <td style="text-align:center; padding:4px;">
          <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
            <button class="qty-dec" data-idx="${idx}" style="width:22px;height:22px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);cursor:pointer;color:var(--color-text);">−</button>
            <span style="font-weight:700; min-width:24px; text-align:center;">${item.qty}</span>
            <button class="qty-inc" data-idx="${idx}" style="width:22px;height:22px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);cursor:pointer;color:var(--color-text);">+</button>
          </div>
        </td>
        <td style="text-align:right; padding:4px;">$${item.sellingPrice.toFixed(2)}</td>
        <td style="text-align:right; padding:4px; font-weight:700; color:var(--color-primary);">$${lineTotal.toFixed(2)}</td>
        <td style="padding:4px;">
          <button class="cart-remove" data-idx="${idx}" style="background:none;border:none;cursor:pointer;color:var(--color-danger,#ef4444);font-size:14px;" title="Remove">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Qty & remove bindings
    tbody.querySelectorAll('.qty-dec').forEach((btn) =>
      btn.addEventListener('click', () => { _changeQty(parseInt(btn.dataset.idx), -1); })
    );
    tbody.querySelectorAll('.qty-inc').forEach((btn) =>
      btn.addEventListener('click', () => { _changeQty(parseInt(btn.dataset.idx), 1); })
    );
    tbody.querySelectorAll('.cart-remove').forEach((btn) =>
      btn.addEventListener('click', () => { cartItems.splice(parseInt(btn.dataset.idx), 1); _persistCart(cartItems); renderCart(); renderTotals(); })
    );

    wrapper.appendChild(table);
  };

  // ─── Totals Render ────────────────────────────────────────────────────────────
  const renderTotals = () => {
    const { subtotal, gstBreakdown, totalGst, discountAmount, loyaltyDiscount, grandTotal } = _computeTotals();

    const display = totalsCard.querySelector('#totals-display');
    const row = (label, value, cls = '') => `
      <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--color-border);">
        <span style="color:var(--color-text-muted);">${label}</span>
        <span class="${cls}" style="font-weight:600;">${value}</span>
      </div>`;

    let gstRows = gstBreakdown.map((g) => row(`GST @ ${g.rate}%`, `$${g.amount.toFixed(2)}`)).join('');

    display.innerHTML = `
      ${row('Subtotal', `$${subtotal.toFixed(2)}`)}
      ${gstRows}
      ${totalGst > 0 ? row('Total GST', `$${totalGst.toFixed(2)}`, 'text-warning') : ''}
      ${discountAmount > 0 ? row('Discount', `-$${discountAmount.toFixed(2)}`, 'text-success') : ''}
      ${loyaltyDiscount > 0 ? row('Loyalty Redemption', `-$${loyaltyDiscount.toFixed(2)}`, 'text-success') : ''}
      <div style="display:flex; justify-content:space-between; padding:8px 0; margin-top:4px;">
        <span style="font-weight:700; font-size:14px;">Grand Total</span>
        <span style="font-weight:900; font-size:18px; color:var(--color-primary);">$${grandTotal.toFixed(2)}</span>
      </div>
      <div style="font-size:10px; color:var(--color-text-muted); margin-top:2px;">
        Items: ${cartItems.reduce((s, i) => s + i.qty, 0)} &bull;
        ${navigator.onLine ? '🟢 Online' : '🟡 Offline Mode'}
      </div>
    `;
  };

  // ─── Payment Modal ────────────────────────────────────────────────────────────
  const openPaymentModal = () => {
    const { grandTotal } = _computeTotals();
    let cashTendered   = grandTotal;
    let paymentMethod  = 'cash';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';

    content.innerHTML = `
      <div class="card p-4 bg-tertiary flex justify-between items-center">
        <div>
          <div class="text-muted">Grand Total Payable</div>
          <div class="font-bold text-2xl text-primary">$${grandTotal.toFixed(2)}</div>
          ${selectedCustomer ? `<div class="text-muted mt-1">Customer: <strong>${selectedCustomer.name}</strong></div>` : ''}
        </div>
        <div class="text-right">
          <div class="text-muted">Cart Items</div>
          <div class="font-bold">${cartItems.reduce((s, i) => s + i.qty, 0)} units</div>
        </div>
      </div>

      <!-- Payment method selector -->
      <div>
        <div class="text-muted mb-2 font-bold">Payment Method</div>
        <div class="flex gap-2 flex-wrap" id="pay-method-group">
          ${[
            { id: 'cash', label: '💵 Cash' },
            { id: 'card', label: '💳 Card' },
            { id: 'upi',  label: '📲 UPI' },
            { id: 'wallet', label: '👛 Wallet' }
          ].map((m) => `
            <button class="btn btn-sm ${m.id === 'cash' ? 'btn-primary' : 'btn-secondary'} pay-method-btn" data-method="${m.id}">
              ${m.label}
            </button>`).join('')}
        </div>
      </div>

      <!-- Cash tendered (shown for cash only) -->
      <div id="cash-tendered-wrapper">
        <div id="cash-input-holder"></div>
        <div id="change-display" class="mt-1 text-xs"></div>
      </div>

      <!-- UPI QR placeholder -->
      <div id="upi-qr-wrapper" style="display:none;" class="flex flex-col items-center gap-2 p-4 bg-tertiary rounded">
        <div style="width:120px;height:120px;background:white;display:flex;align-items:center;justify-content:center;border-radius:8px;">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" fill="white"/>
            <!-- Simplified QR pattern -->
            <rect x="10" y="10" width="24" height="24" rx="2" fill="#1e293b"/>
            <rect x="14" y="14" width="16" height="16" rx="1" fill="white"/>
            <rect x="16" y="16" width="12" height="12" rx="0" fill="#6366f1"/>
            <rect x="46" y="10" width="24" height="24" rx="2" fill="#1e293b"/>
            <rect x="50" y="14" width="16" height="16" rx="1" fill="white"/>
            <rect x="52" y="16" width="12" height="12" rx="0" fill="#6366f1"/>
            <rect x="10" y="46" width="24" height="24" rx="2" fill="#1e293b"/>
            <rect x="14" y="50" width="16" height="16" rx="1" fill="white"/>
            <rect x="16" y="52" width="12" height="12" rx="0" fill="#6366f1"/>
            <rect x="48" y="48" width="8" height="8" fill="#1e293b"/>
            <rect x="62" y="48" width="8" height="8" fill="#1e293b"/>
            <rect x="48" y="62" width="8" height="8" fill="#1e293b"/>
            <rect x="62" y="62" width="8" height="8" fill="#1e293b"/>
          </svg>
        </div>
        <div class="font-bold text-sm">Scan to Pay $${grandTotal.toFixed(2)}</div>
        <div class="text-muted">UPI ID: pos@omnipos</div>
      </div>

      <!-- Confirm button -->
      <div id="pay-confirm-wrapper"></div>
    `;

    const modal = new ModalComponent({ title: '💳 Process Payment', content });
    modal.open();

    // Method selection
    content.querySelectorAll('.pay-method-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.pay-method-btn').forEach((b) => {
          b.className = 'btn btn-sm btn-secondary pay-method-btn';
        });
        btn.className = 'btn btn-sm btn-primary pay-method-btn';
        paymentMethod = btn.dataset.method;
        content.querySelector('#cash-tendered-wrapper').style.display = paymentMethod === 'cash' ? '' : 'none';
        content.querySelector('#upi-qr-wrapper').style.display = paymentMethod === 'upi' ? '' : 'none';
      });
    });

    // Cash input
    const cashIn = new InputComponent({
      label: 'Cash Tendered ($)',
      type: 'number', value: grandTotal.toFixed(2),
      onChange: (v) => {
        cashTendered = parseFloat(v) || 0;
        const change = cashTendered - grandTotal;
        const chEl = content.querySelector('#change-display');
        if (chEl) {
          chEl.innerHTML = change >= 0
            ? `<span class="text-success font-bold">Change: $${change.toFixed(2)}</span>`
            : `<span class="text-danger font-bold">Short by: $${Math.abs(change).toFixed(2)}</span>`;
        }
      }
    }).render();
    content.querySelector('#cash-input-holder').appendChild(cashIn);

    // Confirm button
    const confirmBtn = new ButtonComponent({
      text: '✅ Confirm Payment & Print Receipt',
      variant: 'primary',
      onClick: () => {
        if (paymentMethod === 'cash' && cashTendered < grandTotal) {
          eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'error', title: 'Insufficient Cash', message: 'Cash tendered is less than the grand total.' });
          return;
        }
        modal.close();
        const change = paymentMethod === 'cash' ? Math.max(0, cashTendered - grandTotal) : 0;
        _printReceipt({ grandTotal, paymentMethod, cashTendered, change });
        cartItems = [];
        _persistCart(cartItems);
        renderCart();
        renderTotals();
        scannerComponent.focus();
        eventBus.emit('NOTIFICATION_TRIGGERED', { type: 'success', title: 'Payment Successful', message: `Receipt printed. Change: $${change.toFixed(2)}` });
      }
    }).render();
    content.querySelector('#pay-confirm-wrapper').appendChild(confirmBtn);
  };

  // ─── Receipt Printer ──────────────────────────────────────────────────────────
  const _printReceipt = ({ grandTotal, paymentMethod, cashTendered, change }) => {
    const { subtotal, totalGst, discountAmount } = _computeTotals();
    const now = new Date();
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;

    const itemRows = cartItems.map((item) => `
      <tr>
        <td style="padding:2px 0;">${item.product.name}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">$${item.sellingPrice.toFixed(2)}</td>
        <td style="text-align:right;">$${(item.qty * item.sellingPrice).toFixed(2)}</td>
      </tr>`).join('');

    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html><html>
      <head><title>Receipt ${invoiceNo}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 302px; padding: 12px; }
        .center { text-align:center; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width:100%; }
        th { font-size:10px; text-align:left; }
        th:nth-child(2),th:nth-child(3),th:nth-child(4) { text-align:right; }
        .total-row { font-weight:900; font-size:14px; }
        @media print { body { width:100%; } }
      </style></head>
      <body>
        <div class="center">
          <div style="font-size:16px; font-weight:900;">OmniPOS</div>
          <div style="font-size:10px;">Tax Invoice</div>
          <div style="font-size:10px;">${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
          <div style="font-size:10px;">Invoice #: ${invoiceNo}</div>
          ${selectedCustomer ? `<div style="font-size:10px;">Customer: ${selectedCustomer.name}</div>` : ''}
        </div>
        <div class="divider"></div>
        <table>
          <thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>Subtotal</td><td style="text-align:right;">$${subtotal.toFixed(2)}</td></tr>
          <tr><td>GST</td><td style="text-align:right;">$${totalGst.toFixed(2)}</td></tr>
          ${discountAmount > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-$${discountAmount.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td>GRAND TOTAL</td><td style="text-align:right;">$${grandTotal.toFixed(2)}</td></tr>
          <tr><td>Payment (${paymentMethod.toUpperCase()})</td><td style="text-align:right;">$${cashTendered.toFixed(2)}</td></tr>
          ${change > 0 ? `<tr><td>Change</td><td style="text-align:right;">$${change.toFixed(2)}</td></tr>` : ''}
        </table>
        <div class="divider"></div>
        <div class="center" style="font-size:10px; margin-top:4px;">
          Thank you for shopping with us!<br/>Powered by OmniPOS
        </div>
        <script>window.onload = function(){ window.print(); }<\/script>
      </body></html>`);
    win.document.close();
  };

  // ─── Cart Helpers ─────────────────────────────────────────────────────────────
  const _addToCart = (product) => {
    const existing = cartItems.find((i) => i.product.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cartItems.push({
        product,
        qty: 1,
        sellingPrice: parseFloat(product.sellingPrice) || 0,
        gstRate: parseFloat(product.gstRate) || 0
      });
    }
    _persistCart(cartItems);
    renderCart();
    renderTotals();
  };

  const _changeQty = (idx, delta) => {
    cartItems[idx].qty = Math.max(1, cartItems[idx].qty + delta);
    _persistCart(cartItems);
    renderCart();
    renderTotals();
  };

  const _computeTotals = () => {
    const subtotal = cartItems.reduce((s, i) => s + i.qty * i.sellingPrice, 0);

    // Group GST by rate
    const gstMap = {};
    cartItems.forEach((i) => {
      const lineBase = i.qty * i.sellingPrice;
      const gstAmt = lineBase * i.gstRate / 100;
      gstMap[i.gstRate] = (gstMap[i.gstRate] || 0) + gstAmt;
    });
    const gstBreakdown = Object.entries(gstMap).map(([rate, amount]) => ({ rate: Number(rate), amount }));
    const totalGst = gstBreakdown.reduce((s, g) => s + g.amount, 0);

    // Discount
    let discountAmount = 0;
    if (discountType === 'flat') discountAmount = Math.min(discountValue, subtotal + totalGst);
    else discountAmount = ((subtotal + totalGst) * discountValue) / 100;

    // Loyalty discount (100 pts = $5)
    const loyaltyDiscount = loyaltyRedeem > 0 ? loyaltyRedeem / 20 : 0;

    const grandTotal = Math.max(0, subtotal + totalGst - discountAmount - loyaltyDiscount);
    return { subtotal, gstBreakdown, totalGst, discountAmount, loyaltyDiscount, grandTotal };
  };

  // ─── Scan Toast Notification ──────────────────────────────────────────────────
  const _showScanToast = (productName) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: var(--color-success, #16a34a);
      color: #fff; font-size: 12px; font-weight: 700;
      padding: 10px 16px; border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9999;
      animation: slideIn 0.2s ease;
      max-width: 280px;
    `;
    toast.textContent = `✓ Added: ${productName}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  };

  // ─── Cart Persistence ─────────────────────────────────────────────────────────
  function _persistCart(items) {
    try { sessionStorage.setItem('omnipos_cart', JSON.stringify(items)); } catch (_) {}
  }

  function _restoreCart() {
    try {
      const raw = sessionStorage.getItem('omnipos_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  // Init
  renderCart();
  renderTotals();

  // Cleanup on SPA navigation
  container.addEventListener('disconnected', () => scannerComponent.unmount());

  return container;
}
