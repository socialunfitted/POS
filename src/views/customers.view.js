import { customersStore } from '../store/customers.store.js';
import { customersService } from '../services/customers.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { SelectComponent } from '../components/base/select.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function CustomersView() {
  const container = document.createElement('div');
  container.className = 'customers-view flex flex-col gap-6';

  const state = customersStore.getState();

  // 1. Control Header Bar (Actions + Search + Tier Filter)
  const headerCard = new CardComponent({
    title: '👥 Customer Relationship Management (CRM)',
    subtitle: 'Manage customer profiles, store wallet balances, loyalty points & outstanding credit',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button id="add-customer-btn" class="btn btn-primary btn-sm">➕ Add Customer</button>
          <button id="crm-analytics-btn" class="btn btn-secondary btn-sm">📊 CRM Analytics</button>
        </div>

        <div class="flex items-center gap-2 flex-wrap" id="filter-controls"></div>
      </div>
    `
  }).render();

  const filterControls = headerCard.querySelector('#filter-controls');

  let searchQuery = state.searchQuery;
  let tierFilter = state.selectedTier;

  const searchInput = new InputComponent({
    placeholder: '🔍 Search Name, Phone, Email...',
    value: searchQuery,
    onChange: (val) => {
      searchQuery = val.toLowerCase();
      renderCustomersTable();
    }
  }).render();
  searchInput.style.maxWidth = '220px';

  const tierOptions = [
    { value: 'all', label: 'All Membership Tiers' },
    { value: 'bronze', label: 'Bronze Members' },
    { value: 'silver', label: 'Silver Members' },
    { value: 'gold', label: 'Gold Members' },
    { value: 'platinum', label: 'Platinum Members' }
  ];

  const tierSelect = new SelectComponent({
    options: tierOptions,
    value: tierFilter,
    onChange: (val) => {
      tierFilter = val;
      renderCustomersTable();
    }
  }).render();

  filterControls.appendChild(searchInput);
  filterControls.appendChild(tierSelect);

  headerCard.querySelector('#add-customer-btn').addEventListener('click', () => openCustomerModal());
  headerCard.querySelector('#crm-analytics-btn').addEventListener('click', () => openAnalyticsModal());

  container.appendChild(headerCard);

  // 2. Customer Directory Table Container Card
  const tableCard = new CardComponent({
    title: 'Customer Directory & Accounts Ledger',
    content: `<div id="customers-table-wrapper"></div>`
  }).render();

  container.appendChild(tableCard);

  // Render Table Method
  const renderCustomersTable = () => {
    const { customers, membershipTiers } = customersStore.getState();

    let filtered = customers.filter((c) => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery) || c.phone.includes(searchQuery) || c.email.toLowerCase().includes(searchQuery);
      const matchTier = tierFilter === 'all' || c.membershipTier === tierFilter;
      return matchSearch && matchTier;
    });

    const tableWrapper = tableCard.querySelector('#customers-table-wrapper');
    tableWrapper.innerHTML = '';

    const table = new TableComponent({
      columns: [
        {
          key: 'avatar',
          title: 'Avatar',
          render: (_, row) => `<img src="${row.avatarUrl}" width="36" height="36" style="border-radius: 50%; object-fit: cover;" />`
        },
        { key: 'name', title: 'Customer Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'phone', title: 'Phone / Contact', render: (_, row) => `<div><span class="font-mono text-xs text-primary">${row.phone}</span><br/><span class="text-xs text-muted">${row.email}</span></div>` },
        {
          key: 'membershipTier',
          title: 'Tier',
          render: (val) => {
            const tierObj = membershipTiers[val] || membershipTiers.bronze;
            return `<span class="badge" style="background: ${tierObj.color}; color: #fff;">${tierObj.name}</span>`;
          }
        },
        { key: 'walletBalance', title: 'Store Wallet', render: (val) => `<strong class="text-success">$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'loyaltyPoints', title: 'Loyalty Pts', render: (val) => `<span class="badge badge-primary">${val} pts</span>` },
        {
          key: 'outstandingCredit',
          title: 'Outstanding',
          render: (val) => val > 0 ? `<span class="badge badge-danger">$${parseFloat(val).toFixed(2)}</span>` : `<span class="text-xs text-muted">$0.00</span>`
        },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const flex = document.createElement('div');
            flex.className = 'flex gap-1';

            const profileBtn = new ButtonComponent({
              text: '👤 Profile',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openCustomerProfileModal(row)
            }).render();

            const whatsappBtn = new ButtonComponent({
              text: '📱 WhatsApp',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openWhatsAppModal(row)
            }).render();

            const editBtn = new ButtonComponent({
              text: '✏️',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openCustomerModal(row)
            }).render();

            flex.appendChild(profileBtn);
            flex.appendChild(whatsappBtn);
            flex.appendChild(editBtn);
            return flex;
          }
        }
      ],
      data: filtered
    }).render();

    tableWrapper.appendChild(table);
  };

  renderCustomersTable();

  // Full Customer Profile & Ledger Modal Builder
  const openCustomerProfileModal = (customer) => {
    let activeProfileTab = 'info'; // 'info' | 'history' | 'wallet' | 'loyalty'

    const modalContent = document.createElement('div');
    modalContent.className = 'flex flex-col gap-4';

    const renderTabContent = () => {
      modalContent.innerHTML = '';

      const tabNav = document.createElement('div');
      tabNav.className = 'flex gap-2 border-b pb-2';
      [
        { id: 'info', label: '👤 Profile Info' },
        { id: 'history', label: '📜 Purchase History' },
        { id: 'wallet', label: '💳 Wallet & Credit' },
        { id: 'loyalty', label: '🎁 Loyalty Points' }
      ].forEach((t) => {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${t.id === activeProfileTab ? 'btn-primary' : 'btn-secondary'}`;
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
          activeProfileTab = t.id;
          renderTabContent();
        });
        tabNav.appendChild(btn);
      });

      modalContent.appendChild(tabNav);

      if (activeProfileTab === 'info') {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex flex-col gap-3 text-xs';
        infoDiv.innerHTML = `
          <div class="flex items-center gap-4 p-3 bg-tertiary rounded">
            <img src="${customer.avatarUrl}" width="48" height="48" style="border-radius: 50%;" />
            <div>
              <div class="font-bold text-sm text-primary">${customer.name}</div>
              <div class="text-secondary">${customer.phone} • ${customer.email}</div>
              <div class="text-muted">${customer.address}</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="card p-3 text-center">
              <div class="text-muted">Total Spend</div>
              <div class="font-bold text-lg text-primary">$${customer.totalSpend.toFixed(2)}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-muted">Total Visits</div>
              <div class="font-bold text-lg">${customer.visitsCount}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-muted">Credit Limit</div>
              <div class="font-bold text-lg text-secondary">$${customer.creditLimit.toFixed(2)}</div>
            </div>
          </div>
        `;
        modalContent.appendChild(infoDiv);
      } else if (activeProfileTab === 'history') {
        const { purchaseHistory } = customersStore.getState();
        const history = purchaseHistory.filter((h) => h.customerId === customer.id);

        const histDiv = document.createElement('div');
        const table = new TableComponent({
          columns: [
            { key: 'invoiceNo', title: 'Invoice #' },
            { key: 'date', title: 'Date' },
            { key: 'itemsCount', title: 'Items' },
            { key: 'total', title: 'Total' },
            { key: 'paymentMethod', title: 'Method', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` }
          ],
          data: history.length > 0 ? history : [{ invoiceNo: 'INV-2026-1087', date: '2026-07-27', itemsCount: 8, total: '$128.40', paymentMethod: 'card' }]
        }).render();

        histDiv.appendChild(table);
        modalContent.appendChild(histDiv);
      } else if (activeProfileTab === 'wallet') {
        let depositAmount = '';
        let creditPayAmount = '';

        const walletDiv = document.createElement('div');
        walletDiv.className = 'flex flex-col gap-4 text-xs';

        walletDiv.innerHTML = `
          <div class="grid grid-cols-2 gap-4">
            <div class="card p-3 bg-tertiary">
              <div class="text-muted">Prepaid Wallet Balance</div>
              <div class="font-bold text-xl text-success">$${customer.walletBalance.toFixed(2)}</div>
              <div class="mt-2 flex gap-2" id="wallet-dep-form"></div>
            </div>

            <div class="card p-3 bg-tertiary">
              <div class="text-muted">Outstanding Credit Due</div>
              <div class="font-bold text-xl text-danger">$${customer.outstandingCredit.toFixed(2)}</div>
              <div class="mt-2 flex gap-2" id="credit-pay-form"></div>
            </div>
          </div>
        `;

        const depIn = new InputComponent({ placeholder: 'Deposit $', type: 'number', onChange: (v) => { depositAmount = v; } }).render();
        const depBtn = new ButtonComponent({
          text: 'Deposit',
          variant: 'primary',
          size: 'sm',
          onClick: () => {
            if (depositAmount) {
              customersService.addWalletBalance(customer.id, depositAmount);
              modal.close();
              renderCustomersTable();
            }
          }
        }).render();

        const payIn = new InputComponent({ placeholder: 'Collect $', type: 'number', onChange: (v) => { creditPayAmount = v; } }).render();
        const payBtn = new ButtonComponent({
          text: 'Collect',
          variant: 'primary',
          size: 'sm',
          onClick: () => {
            if (creditPayAmount) {
              customersService.recordCreditPayment(customer.id, creditPayAmount);
              modal.close();
              renderCustomersTable();
            }
          }
        }).render();

        walletDiv.querySelector('#wallet-dep-form').appendChild(depIn);
        walletDiv.querySelector('#wallet-dep-form').appendChild(depBtn);
        walletDiv.querySelector('#credit-pay-form').appendChild(payIn);
        walletDiv.querySelector('#credit-pay-form').appendChild(payBtn);

        modalContent.appendChild(walletDiv);
      } else if (activeProfileTab === 'loyalty') {
        let redeemPts = '';
        const loyaltyDiv = document.createElement('div');
        loyaltyDiv.className = 'flex flex-col gap-3 text-xs';

        loyaltyDiv.innerHTML = `
          <div class="card p-4 bg-tertiary flex items-center justify-between">
            <div>
              <div class="text-muted">Loyalty Balance</div>
              <div class="font-bold text-2xl text-primary">${customer.loyaltyPoints} Points</div>
            </div>
            <div class="flex gap-2" id="loyalty-redeem-form"></div>
          </div>
        `;

        const ptsIn = new InputComponent({ placeholder: 'Points to redeem', type: 'number', onChange: (v) => { redeemPts = v; } }).render();
        const ptsBtn = new ButtonComponent({
          text: 'Redeem for Discount',
          variant: 'primary',
          size: 'sm',
          onClick: () => {
            if (redeemPts) {
              customersService.redeemLoyaltyPoints(customer.id, redeemPts);
              modal.close();
              renderCustomersTable();
            }
          }
        }).render();

        loyaltyDiv.querySelector('#loyalty-redeem-form').appendChild(ptsIn);
        loyaltyDiv.querySelector('#loyalty-redeem-form').appendChild(ptsBtn);

        modalContent.appendChild(loyaltyDiv);
      }
    };

    const modal = new ModalComponent({
      title: `Customer CRM Profile - ${customer.name}`,
      content: modalContent
    });

    renderTabContent();
    modal.open();
  };

  // Add / Edit Customer Modal Builder
  const openCustomerModal = (customerToEdit = null) => {
    const isEdit = Boolean(customerToEdit);
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    let name = customerToEdit?.name || '';
    let phone = customerToEdit?.phone || '';
    let email = customerToEdit?.email || '';
    let address = customerToEdit?.address || '';
    let membershipTier = customerToEdit?.membershipTier || 'bronze';
    let creditLimit = customerToEdit?.creditLimit || 200.0;

    content.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <div id="c-name-in"></div>
        <div id="c-phone-in"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div id="c-email-in"></div>
        <div class="input-group">
          <label class="input-label">Membership Tier</label>
          <select class="select-field" id="c-tier-select">
            <option value="bronze" ${membershipTier === 'bronze' ? 'selected' : ''}>Bronze Member</option>
            <option value="silver" ${membershipTier === 'silver' ? 'selected' : ''}>Silver Member (5% Off)</option>
            <option value="gold" ${membershipTier === 'gold' ? 'selected' : ''}>Gold Member (10% Off)</option>
            <option value="platinum" ${membershipTier === 'platinum' ? 'selected' : ''}>Platinum Member (15% Off)</option>
          </select>
        </div>
      </div>
      <div id="c-address-in"></div>
      <div id="c-credit-in"></div>
      <div id="save-cust-btn" class="mt-3"></div>
    `;

    const nameInput = new InputComponent({ label: 'Full Name', value: name, onChange: (v) => { name = v; } }).render();
    const phoneInput = new InputComponent({ label: 'Phone Number', value: phone, onChange: (v) => { phone = v; } }).render();
    const emailInput = new InputComponent({ label: 'Email Address', type: 'email', value: email, onChange: (v) => { email = v; } }).render();
    const addressInput = new InputComponent({ label: 'Address Location', value: address, onChange: (v) => { address = v; } }).render();
    const creditInput = new InputComponent({ label: 'Store Credit Limit ($)', type: 'number', value: creditLimit, onChange: (v) => { creditLimit = v; } }).render();

    const modal = new ModalComponent({
      title: isEdit ? `Edit Customer - ${customerToEdit.name}` : '➕ Add New Customer',
      content
    });
    modal.open();

    const btn = new ButtonComponent({
      text: isEdit ? 'Save Changes' : 'Create Profile',
      variant: 'primary',
      onClick: async () => {
        if (name) {
          const select = content.querySelector('#c-tier-select');
          membershipTier = select.value;
          const payload = { name, phone, email, address, membershipTier, creditLimit: parseFloat(creditLimit) || 200.0 };

          if (isEdit) {
            await customersService.updateCustomer(customerToEdit.id, payload);
          } else {
            await customersService.addCustomer(payload);
          }
          modal.close();
          renderCustomersTable();
        }
      }
    }).render();

    content.querySelector('#c-name-in').appendChild(nameInput);
    content.querySelector('#c-phone-in').appendChild(phoneInput);
    content.querySelector('#c-email-in').appendChild(emailInput);
    content.querySelector('#c-address-in').appendChild(addressInput);
    content.querySelector('#c-credit-in').appendChild(creditInput);
    content.querySelector('#save-cust-btn').appendChild(btn);
  };

  // WhatsApp Sharing Modal Builder
  const openWhatsAppModal = (customer) => {
    const link = customersService.generateWhatsAppInvoiceLink(customer.phone, 'INV-2026-1087', '$128.40');

    const content = document.createElement('div');
    content.className = 'flex flex-col items-center gap-4 p-4 text-center';

    content.innerHTML = `
      <div class="font-bold text-lg text-primary">WhatsApp Receipt Generator</div>
      <div class="text-xs text-secondary">Send invoice receipt directly to <strong>${customer.name}</strong> (${customer.phone})</div>

      <div class="p-4 bg-tertiary rounded text-xs text-left font-mono my-2 w-full">
        Hi ${customer.name}! Your invoice receipt #INV-2026-1087 for total $128.40 has been processed successfully.
      </div>

      <a href="${link}" target="_blank" class="btn btn-success justify-center w-full">
        <span>💬 Send via WhatsApp Web</span>
      </a>
    `;

    const modal = new ModalComponent({
      title: `WhatsApp Share - ${customer.name}`,
      content
    });
    modal.open();
  };

  // Customer Analytics Modal Builder
  const openAnalyticsModal = () => {
    const { crmAnalytics } = customersStore.getState();

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs';

    content.innerHTML = `
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-muted">Total Customer CLV</div>
          <div class="font-bold text-xl text-primary">$${crmAnalytics.totalClv.toLocaleString()}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Average Order Value</div>
          <div class="font-bold text-xl text-success">$${crmAnalytics.avgOrderValue.toFixed(2)}</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-muted">Loyalty Points Active</div>
          <div class="font-bold text-xl text-info">${crmAnalytics.totalLoyaltyPointsGiven} pts</div>
        </div>
      </div>
    `;

    const modal = new ModalComponent({
      title: '📊 Customer CRM Analytics & Metrics',
      content
    });
    modal.open();
  };

  return container;
}
