import { SUBSCRIPTION_PLANS } from '../config/subscription.config.js';
import { subscriptionStore } from '../store/subscription.store.js';
import { subscriptionService } from '../services/subscription.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ModalComponent } from '../components/base/modal.component.js';
import { eventBus } from '../core/event-bus.js';

export async function SubscriptionView() {
  const container = document.createElement('div');
  container.className = 'subscription-view flex flex-col gap-6';

  let selectedBillingCycle = 'monthly'; // 'monthly' | 'annual'

  // Render Status Banner
  const renderStatusBanner = () => {
    const { planTier, status, daysRemaining, renewsAt, billingCycle } = subscriptionStore.getState();
    const currentPlan = SUBSCRIPTION_PLANS[planTier.toUpperCase()] || SUBSCRIPTION_PLANS.STARTER;

    let badgeVariant = 'success';
    if (status === 'expiring_soon') badgeVariant = 'warning';
    if (status === 'expired') badgeVariant = 'danger';
    if (status === 'trialing') badgeVariant = 'primary';

    const bannerCard = new CardComponent({
      title: 'Active SaaS Subscription Overview',
      subtitle: `Tenant Plan: ${currentPlan.name} (${billingCycle.toUpperCase()})`,
      content: `
        <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
          <div class="flex items-center gap-4">
            ${new BadgeComponent({ text: `Status: ${status.toUpperCase()}`, variant: badgeVariant }).render().outerHTML}
            <span class="text-sm font-semibold text-primary">${daysRemaining} Days Remaining</span>
            <span class="text-xs text-muted">Next billing date: ${new Date(renewsAt).toLocaleDateString()}</span>
          </div>

          <div class="flex items-center gap-2">
            <button id="trial-trigger-btn" class="btn btn-secondary btn-sm">🎁 Start 14-Day Pro Trial</button>
          </div>
        </div>

        ${daysRemaining <= 7 ? `
          <div class="mt-4 p-3 bg-warning-bg border-l-4 border-warning text-warning-text rounded text-xs flex items-center justify-between">
            <span>⚠️ Your subscription expires in ${daysRemaining} day(s). Renew now to prevent POS feature locking.</span>
          </div>
        ` : ''}
      `
    }).render();

    const trialBtn = bannerCard.querySelector('#trial-trigger-btn');
    if (trialBtn) {
      trialBtn.addEventListener('click', () => {
        subscriptionService.startFreeTrial('professional');
        window.location.reload();
      });
    }

    return bannerCard;
  };

  container.appendChild(renderStatusBanner());

  // Cycle Selector Header
  const cycleToggleCard = document.createElement('div');
  cycleToggleCard.className = 'card p-4 flex items-center justify-between bg-secondary';
  cycleToggleCard.innerHTML = `
    <div>
      <h3 class="h4">Select Your Plan</h3>
      <p class="text-xs text-secondary">Choose the tier that fits your retail operations</p>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm ${selectedBillingCycle === 'monthly' ? 'font-bold text-primary' : 'text-muted'}">Monthly Billing</span>
      <button id="cycle-switch-btn" class="btn btn-secondary btn-sm">
        ${selectedBillingCycle === 'annual' ? '⚡ Switched to Annual (Save 20%)' : 'Switch to Annual Billing'}
      </button>
      <span class="badge badge-success">Save 20% Annual</span>
    </div>
  `;

  cycleToggleCard.querySelector('#cycle-switch-btn').addEventListener('click', () => {
    selectedBillingCycle = selectedBillingCycle === 'monthly' ? 'annual' : 'monthly';
    renderPlansGrid();
  });

  container.appendChild(cycleToggleCard);

  // 5-Plan Comparison Matrix Grid Container
  const plansGridContainer = document.createElement('div');
  plansGridContainer.className = 'plans-grid-container';
  container.appendChild(plansGridContainer);

  const renderPlansGrid = () => {
    plansGridContainer.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    grid.style.gap = 'var(--space-4)';

    const activePlanTier = subscriptionStore.getState().planTier;

    Object.values(SUBSCRIPTION_PLANS).forEach((plan) => {
      const isCurrent = plan.id === activePlanTier;
      const price = selectedBillingCycle === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;

      const card = document.createElement('div');
      card.className = `card p-5 flex flex-col justify-between ${isCurrent ? 'border-primary' : ''}`;
      if (isCurrent) {
        card.style.borderWidth = '2px';
        card.style.borderColor = 'var(--color-primary)';
      }

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="h4 font-bold">${plan.name}</h4>
            ${isCurrent ? new BadgeComponent({ text: 'Current', variant: 'primary' }).render().outerHTML : ''}
          </div>
          <p class="text-xs text-muted mb-4" style="min-height: 36px;">${plan.tagline}</p>

          <div class="mb-4">
            <span class="text-3xl font-bold text-primary">$${price}</span>
            <span class="text-xs text-muted">/ month</span>
            ${selectedBillingCycle === 'annual' && plan.monthlyPrice > 0 ? `<div class="text-xs text-success">Billed $${plan.annualPrice}/yr</div>` : ''}
          </div>

          <ul class="flex flex-col gap-2 text-xs text-secondary mb-6">
            <li class="flex items-center gap-2">✓ <strong>${plan.maxUsers}</strong> User(s)</li>
            <li class="flex items-center gap-2">✓ <strong>${plan.maxRegisters}</strong> Register(s)</li>
            <li class="flex items-center gap-2">✓ <strong>${plan.maxProducts.toLocaleString()}</strong> Products</li>
            <li class="flex items-center gap-2">✓ <strong>${plan.maxOutlets}</strong> Store Outlet(s)</li>
            ${plan.features.includes('inventory_tracking') ? '<li class="flex items-center gap-2">✓ Inventory Tracking</li>' : '<li class="text-muted opacity-50">✕ Inventory Tracking</li>'}
            ${plan.features.includes('ai_assistant') ? '<li class="flex items-center gap-2">✓ AI Business Assistant</li>' : '<li class="text-muted opacity-50">✕ AI Business Assistant</li>'}
            ${plan.features.includes('multi_outlet') ? '<li class="flex items-center gap-2">✓ Multi-Outlet Sync</li>' : '<li class="text-muted opacity-50">✕ Multi-Outlet Sync</li>'}
            ${plan.features.includes('api_access') ? '<li class="flex items-center gap-2">✓ API Access & SLA</li>' : '<li class="text-muted opacity-50">✕ API Access & SLA</li>'}
          </ul>
        </div>

        <div id="plan-action-${plan.id}"></div>
      `;

      const actionContainer = card.querySelector(`#plan-action-${plan.id}`);
      if (isCurrent) {
        actionContainer.appendChild(new ButtonComponent({ text: 'Active Plan', variant: 'secondary', disabled: true }).render());
      } else {
        const btn = new ButtonComponent({
          text: plan.monthlyPrice > (SUBSCRIPTION_PLANS[activePlanTier.toUpperCase()]?.monthlyPrice || 0) ? 'Upgrade Plan' : 'Select Plan',
          variant: 'primary',
          onClick: () => openCheckoutModal(plan)
        }).render();
        actionContainer.appendChild(btn);
      }

      grid.appendChild(card);
    });

    plansGridContainer.appendChild(grid);
  };

  renderPlansGrid();

  // Checkout & Upgrade Modal Builder
  const openCheckoutModal = (plan) => {
    let couponCodeInput = '';
    let validatedCoupon = null;

    const modalContent = document.createElement('div');
    modalContent.className = 'flex flex-col gap-4';

    const price = selectedBillingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

    modalContent.innerHTML = `
      <div class="card p-4 bg-tertiary">
        <div class="font-bold text-sm text-primary">${plan.name} (${selectedBillingCycle.toUpperCase()})</div>
        <div class="text-xs text-secondary">Billing period: ${selectedBillingCycle === 'annual' ? '1 Year' : '1 Month'}</div>
        <div class="text-xl font-bold mt-2" id="summary-price">$${price.toFixed(2)}</div>
      </div>

      <div class="input-group">
        <label class="input-label">Have a Coupon Code?</label>
        <div class="flex gap-2">
          <div id="coupon-field" class="flex-1"></div>
          <button id="apply-coupon-btn" class="btn btn-secondary btn-sm">Apply</button>
        </div>
        <div id="coupon-msg" class="text-xs mt-1">Try code: <code class="font-mono text-primary">WELCOME50</code> or <code class="font-mono text-primary">SAVE20</code></div>
      </div>

      <div class="input-group">
        <label class="input-label">Payment Method Simulator</label>
        <select class="select-field" id="payment-method-select">
          <option value="credit_card">💳 Credit / Debit Card (Stripe)</option>
          <option value="upi">📱 UPI / QR Payment</option>
          <option value="bank_transfer">🏦 Bank Wire Transfer</option>
        </select>
      </div>

      <div class="border-t pt-3 flex justify-between items-center">
        <div>
          <span class="text-xs text-muted">Total Due Now:</span>
          <div class="text-2xl font-bold text-primary" id="final-due-price">$${price.toFixed(2)}</div>
        </div>
        <div id="confirm-btn-wrapper"></div>
      </div>
    `;

    const modal = new ModalComponent({
      title: `Checkout - ${plan.name}`,
      content: modalContent
    });
    modal.open();

    const couponInput = new InputComponent({
      placeholder: 'e.g. WELCOME50',
      value: couponCodeInput,
      onChange: (val) => { couponCodeInput = val; }
    }).render();
    modalContent.querySelector('#coupon-field').appendChild(couponInput);

    // Coupon Apply Handler
    modalContent.querySelector('#apply-coupon-btn').addEventListener('click', () => {
      validatedCoupon = subscriptionService.validateCoupon(couponCodeInput, price);
      const msgEl = modalContent.querySelector('#coupon-msg');
      const dueEl = modalContent.querySelector('#final-due-price');

      if (validatedCoupon) {
        msgEl.className = 'text-xs mt-1 text-success font-semibold';
        msgEl.textContent = `✓ Coupon "${validatedCoupon.code}" applied! Save $${validatedCoupon.discountAmount.toFixed(2)}`;
        dueEl.textContent = `$${validatedCoupon.finalPrice.toFixed(2)}`;
      } else {
        msgEl.className = 'text-xs mt-1 text-error font-semibold';
        msgEl.textContent = '✕ Invalid or expired coupon code.';
        dueEl.textContent = `$${price.toFixed(2)}`;
      }
    });

    // Confirm Payment & Activate Plan
    const confirmBtn = new ButtonComponent({
      text: 'Confirm & Activate Plan',
      variant: 'primary',
      onClick: async () => {
        const res = await subscriptionService.changePlan(plan.id, selectedBillingCycle, couponCodeInput);
        if (res.success) {
          modal.close();
          window.location.reload();
        }
      }
    }).render();

    modalContent.querySelector('#confirm-btn-wrapper').appendChild(confirmBtn);
  };

  // Payment History Ledger & Invoice View
  const historyCard = new CardComponent({
    title: 'Payment History & Invoices Ledger',
    subtitle: 'Track past payments, download receipts, and view subscription invoices',
    content: `<div id="payment-table-wrapper"></div>`
  }).render();

  const renderPaymentTable = () => {
    const { paymentHistory } = subscriptionStore.getState();

    const table = new TableComponent({
      columns: [
        { key: 'invoiceNumber', title: 'Invoice #' },
        { key: 'date', title: 'Date' },
        { key: 'planName', title: 'Plan' },
        { key: 'amount', title: 'Amount' },
        { key: 'status', title: 'Status', render: (val) => `<span class="badge badge-success">${val.toUpperCase()}</span>` },
        {
          key: 'actions',
          title: 'Invoice',
          render: (_, row) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-sm';
            btn.textContent = '📄 View Invoice';
            btn.addEventListener('click', () => openInvoiceModal(row));
            return btn;
          }
        }
      ],
      data: paymentHistory
    }).render();

    historyCard.querySelector('#payment-table-wrapper').appendChild(table);
  };

  renderPaymentTable();
  container.appendChild(historyCard);

  // Printable Subscription Invoice Modal
  const openInvoiceModal = (invoiceData) => {
    const invoiceHtml = document.createElement('div');
    invoiceHtml.className = 'p-4 flex flex-col gap-4 font-sans';
    invoiceHtml.innerHTML = `
      <div class="flex justify-between items-center border-b pb-4">
        <div>
          <h2 class="h3 font-bold text-primary">INVOICE</h2>
          <div class="text-xs text-muted">${invoiceData.invoiceNumber}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-sm">OmniPOS SaaS Platform</div>
          <div class="text-xs text-secondary">Date: ${invoiceData.date}</div>
        </div>
      </div>

      <table class="w-full text-xs mt-2" style="border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
            <th class="p-2">Description</th>
            <th class="p-2">Billing Cycle</th>
            <th class="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="p-2 font-semibold">${invoiceData.planName} Subscription</td>
            <td class="p-2">${invoiceData.billingCycle.toUpperCase()}</td>
            <td class="p-2 text-right font-mono">${invoiceData.amount}</td>
          </tr>
        </tbody>
      </table>

      <div class="flex justify-between items-center pt-4 border-t">
        <span class="badge badge-success">PAYMENT STATUS: ${invoiceData.status.toUpperCase()}</span>
        <div class="text-right">
          <div class="text-xs text-muted">Total Paid</div>
          <div class="text-xl font-bold text-primary">${invoiceData.amount}</div>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button id="print-invoice-btn" class="btn btn-primary btn-sm">🖨️ Print Invoice</button>
      </div>
    `;

    const modal = new ModalComponent({
      title: `Subscription Invoice - ${invoiceData.invoiceNumber}`,
      content: invoiceHtml
    });
    modal.open();

    invoiceHtml.querySelector('#print-invoice-btn').addEventListener('click', () => {
      window.print();
    });
  };

  return container;
}
