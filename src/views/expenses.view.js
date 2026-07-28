import { expensesStore } from '../store/expenses.store.js';
import { expensesService } from '../services/expenses.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function ExpensesView() {
  const container = document.createElement('div');
  container.className = 'expenses-view flex flex-col gap-6';

  let activeTab = 'overview'; // overview | expenses | income | recurring | categories | reports

  // Top Financial KPI Strip
  const renderKpiStrip = () => {
    const { financialSummary } = expensesStore.getState();
    const strip = document.createElement('div');
    strip.className = 'grid grid-cols-4 gap-4';

    strip.innerHTML = `
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Gross Sales Revenue</div>
        <div class="font-bold text-2xl text-primary">$${financialSummary.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-secondary mt-1">POS Sales Volume</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Total Operating Expenses</div>
        <div class="font-bold text-2xl text-danger">$${financialSummary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-secondary mt-1">Overhead & Operating</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Net Operating Profit</div>
        <div class="font-bold text-2xl text-success">$${financialSummary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-success mt-1">${financialSummary.marginPercent}% Net Margin</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Net Cash Flow</div>
        <div class="font-bold text-2xl text-info">$${financialSummary.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-secondary mt-1">Inflow vs Outflow</div>
      </div>
    `;

    return strip;
  };

  container.appendChild(renderKpiStrip());

  // Navigation Tab Bar
  const navCard = document.createElement('div');
  navCard.className = 'card p-3 bg-secondary overflow-x-auto';
  const navFlex = document.createElement('div');
  navFlex.className = 'flex gap-2 flex-nowrap';

  const contentArea = document.createElement('div');
  contentArea.className = 'expenses-module-content flex flex-col gap-6';

  const tabs = [
    { id: 'overview', label: '📊 Financial Statements (P&L & Cash Flow)' },
    { id: 'expenses', label: '💸 Expense Entry' },
    { id: 'income', label: '💰 Operating Income' },
    { id: 'recurring', label: '🔁 Recurring Expenses' },
    { id: 'categories', label: '📂 Categories' },
    { id: 'reports', label: '📈 Reports & Export' }
  ];

  const renderTabs = () => {
    navFlex.innerHTML = '';
    tabs.forEach((tab) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${tab.id === activeTab ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeTab = tab.id;
        renderTabs();
        renderActiveTabContent();
      });
      navFlex.appendChild(btn);
    });
  };

  navCard.appendChild(navFlex);
  container.appendChild(navCard);
  container.appendChild(contentArea);

  // Render Active Sub-Module Content
  const renderActiveTabContent = () => {
    contentArea.innerHTML = '';

    switch (activeTab) {
      case 'overview':
        contentArea.appendChild(renderOverviewModule());
        break;
      case 'expenses':
        contentArea.appendChild(renderExpensesModule());
        break;
      case 'income':
        contentArea.appendChild(renderIncomeModule());
        break;
      case 'recurring':
        contentArea.appendChild(renderRecurringModule());
        break;
      case 'categories':
        contentArea.appendChild(renderCategoriesModule());
        break;
      case 'reports':
        contentArea.appendChild(renderReportsModule());
        break;
      default:
        contentArea.appendChild(renderOverviewModule());
    }
  };

  // 1. Overview: P&L Statement & Cash Flow Statement Module
  const renderOverviewModule = () => {
    const { financialSummary } = expensesStore.getState();
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-6';

    // Profit & Loss (P&L) Statement Card
    const pnlCard = new CardComponent({
      title: '📈 Income Statement (Profit & Loss)',
      subtitle: 'P&L summary computing net margin after operating expenses & COGS',
      content: `
        <div class="flex flex-col gap-3 mt-3 text-xs">
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Gross POS Sales Revenue</span>
            <span class="font-bold text-primary">$${financialSummary.grossRevenue.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Less: Cost of Goods Sold (COGS)</span>
            <span class="font-bold text-danger">-$${financialSummary.cogs.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-tertiary rounded font-bold">
            <span>Gross Profit</span>
            <span class="text-primary">$${financialSummary.grossProfit.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Less: Operating Overhead Expenses</span>
            <span class="font-bold text-danger">-$${financialSummary.totalExpenses.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Add: Other Non-POS Operating Income</span>
            <span class="font-bold text-success">+$${financialSummary.otherIncome.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-3 border-t font-bold text-sm">
            <span>Net Operating Profit</span>
            <span class="text-success">$${financialSummary.netProfit.toFixed(2)}</span>
          </div>
        </div>
      `
    }).render();

    // Cash Flow Statement Card
    const cashFlowCard = new CardComponent({
      title: '💵 Cash Flow Statement',
      subtitle: 'Summary of operating cash inflows vs cash outflows',
      content: `
        <div class="flex flex-col gap-3 mt-3 text-xs">
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Operating Cash Inflow (Sales + Subsidies)</span>
            <span class="font-bold text-success">+$${financialSummary.operatingCashInflow.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-tertiary rounded">
            <span>Operating Cash Outflow (COGS + Expenses)</span>
            <span class="font-bold text-danger">-$${financialSummary.operatingCashOutflow.toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center p-3 border-t font-bold text-sm mt-6">
            <span>Net Operating Cash Flow</span>
            <span class="text-primary">$${financialSummary.netCashFlow.toFixed(2)}</span>
          </div>
        </div>
      `
    }).render();

    grid.appendChild(pnlCard);
    grid.appendChild(cashFlowCard);
    return grid;
  };

  // 2. Expense Entry Module
  const renderExpensesModule = () => {
    const { expenses } = expensesStore.getState();
    const card = new CardComponent({
      title: '💸 Operating Expense Entries',
      subtitle: 'Log and review overhead expenditures',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Logged Expenses: ${expenses.length}</span>
          <button id="add-exp-btn" class="btn btn-primary btn-sm">➕ Add Expense</button>
        </div>
        <div id="exp-table"></div>
      `
    }).render();

    card.querySelector('#add-exp-btn').addEventListener('click', () => openExpenseModal());

    const table = new TableComponent({
      columns: [
        { key: 'referenceNo', title: 'Ref #', render: (val) => `<code class="font-mono text-primary">${val}</code>` },
        { key: 'title', title: 'Expense Description', render: (val) => `<strong>${val}</strong>` },
        { key: 'categoryName', title: 'Category', render: (val) => `<span class="badge badge-secondary">${val}</span>` },
        { key: 'amount', title: 'Amount', render: (val) => `<strong class="text-danger">-$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'paymentMethod', title: 'Method', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'date', title: 'Date' },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const btn = new ButtonComponent({
              text: '🗑️',
              variant: 'danger',
              size: 'sm',
              onClick: () => {
                expensesService.deleteExpense(row.id);
                renderActiveTabContent();
              }
            }).render();
            return btn;
          }
        }
      ],
      data: expenses
    }).render();

    card.querySelector('#exp-table').appendChild(table);
    return card;
  };

  // Add Expense Modal Builder
  const openExpenseModal = () => {
    const { categories } = expensesStore.getState();
    let title = '';
    let categoryName = categories[0]?.name || 'Utilities';
    let amount = '';
    let paymentMethod = 'cash';
    let referenceNo = '';
    let notes = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    content.innerHTML = `
      <div id="exp-title-in"></div>
      <div class="grid grid-cols-2 gap-2">
        <div class="input-group">
          <label class="input-label">Expense Category</label>
          <select class="select-field" id="exp-cat-select">
            ${categories.map((c) => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div id="exp-amount-in"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="input-group">
          <label class="input-label">Payment Method</label>
          <select class="select-field" id="exp-method-select">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
          </select>
        </div>
        <div id="exp-ref-in"></div>
      </div>
      <div id="exp-notes-in"></div>
      <div id="save-exp-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({
      title: '➕ Log New Operating Expense',
      content
    });
    modal.open();

    const titleInput = new InputComponent({ label: 'Expense Title', placeholder: 'e.g. Electricity Bill', onChange: (v) => { title = v; } }).render();
    const amountInput = new InputComponent({ label: 'Amount ($)', type: 'number', placeholder: '0.00', onChange: (v) => { amount = v; } }).render();
    const refInput = new InputComponent({ label: 'Reference / Invoice #', placeholder: 'Auto-generated if empty', onChange: (v) => { referenceNo = v; } }).render();
    const notesInput = new InputComponent({ label: 'Notes', placeholder: 'Optional notes...', onChange: (v) => { notes = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Log Expense',
      variant: 'primary',
      onClick: async () => {
        if (title && amount) {
          const catSelect = content.querySelector('#exp-cat-select');
          const methodSelect = content.querySelector('#exp-method-select');
          categoryName = catSelect.value;
          paymentMethod = methodSelect.value;

          await expensesService.addExpense({ title, categoryName, amount, paymentMethod, referenceNo, notes });
          modal.close();
          renderActiveTabContent();
        }
      }
    }).render();

    content.querySelector('#exp-title-in').appendChild(titleInput);
    content.querySelector('#exp-amount-in').appendChild(amountInput);
    content.querySelector('#exp-ref-in').appendChild(refInput);
    content.querySelector('#exp-notes-in').appendChild(notesInput);
    content.querySelector('#save-exp-btn').appendChild(btn);
  };

  // 3. Operating Income Module
  const renderIncomeModule = () => {
    const { incomes } = expensesStore.getState();
    const card = new CardComponent({
      title: '💰 Non-POS Operating Income',
      subtitle: 'Log non-POS income such as government subsidies, grants, or scrap sales',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Logged Incomes: ${incomes.length}</span>
          <button id="add-inc-btn" class="btn btn-primary btn-sm">➕ Add Income</button>
        </div>
        <div id="inc-table"></div>
      `
    }).render();

    card.querySelector('#add-inc-btn').addEventListener('click', () => openIncomeModal());

    const table = new TableComponent({
      columns: [
        { key: 'referenceNo', title: 'Ref #', render: (val) => `<code class="font-mono text-primary">${val}</code>` },
        { key: 'title', title: 'Income Source Description', render: (val) => `<strong>${val}</strong>` },
        { key: 'source', title: 'Source', render: (val) => `<span class="badge badge-success">${val}</span>` },
        { key: 'amount', title: 'Amount', render: (val) => `<strong class="text-success">+$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'paymentMethod', title: 'Method', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'date', title: 'Date' },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const btn = new ButtonComponent({
              text: '🗑️',
              variant: 'danger',
              size: 'sm',
              onClick: () => {
                expensesService.deleteIncome(row.id);
                renderActiveTabContent();
              }
            }).render();
            return btn;
          }
        }
      ],
      data: incomes
    }).render();

    card.querySelector('#inc-table').appendChild(table);
    return card;
  };

  // Add Income Modal Builder
  const openIncomeModal = () => {
    let title = '';
    let source = '';
    let amount = '';
    let paymentMethod = 'bank_transfer';
    let referenceNo = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    content.innerHTML = `
      <div id="inc-title-in"></div>
      <div class="grid grid-cols-2 gap-2">
        <div id="inc-source-in"></div>
        <div id="inc-amount-in"></div>
      </div>
      <div id="save-inc-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({
      title: '➕ Log Non-POS Operating Income',
      content
    });
    modal.open();

    const titleInput = new InputComponent({ label: 'Income Title', placeholder: 'e.g. Business Grant', onChange: (v) => { title = v; } }).render();
    const sourceInput = new InputComponent({ label: 'Income Source', placeholder: 'e.g. Government Subsidy', onChange: (v) => { source = v; } }).render();
    const amountInput = new InputComponent({ label: 'Amount ($)', type: 'number', placeholder: '0.00', onChange: (v) => { amount = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Log Income',
      variant: 'primary',
      onClick: () => {
        if (title && amount) {
          expensesService.addIncome({ title, source, amount, paymentMethod, referenceNo });
          modal.close();
          renderActiveTabContent();
        }
      }
    }).render();

    content.querySelector('#inc-title-in').appendChild(titleInput);
    content.querySelector('#inc-source-in').appendChild(sourceInput);
    content.querySelector('#inc-amount-in').appendChild(amountInput);
    content.querySelector('#save-inc-btn').appendChild(btn);
  };

  // 4. Recurring Expenses Module
  const renderRecurringModule = () => {
    const { recurringExpenses } = expensesStore.getState();
    const card = new CardComponent({
      title: '🔁 Automated Recurring Expense Schedules',
      subtitle: 'Manage fixed monthly or annual operating commitments (Rent, Broadband, Subscriptions)',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Active Recurring Schedules: ${recurringExpenses.length}</span>
          <button id="add-rec-btn" class="btn btn-primary btn-sm">➕ Add Schedule</button>
        </div>
        <div id="rec-table"></div>
      `
    }).render();

    card.querySelector('#add-rec-btn').addEventListener('click', () => openRecurringModal());

    const table = new TableComponent({
      columns: [
        { key: 'title', title: 'Schedule Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'categoryName', title: 'Category', render: (val) => `<span class="badge badge-secondary">${val}</span>` },
        { key: 'amount', title: 'Amount', render: (val) => `<strong class="text-danger">$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'frequency', title: 'Frequency', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'nextDueDate', title: 'Next Due Date', render: (val) => `<span class="badge badge-warning">${val}</span>` }
      ],
      data: recurringExpenses
    }).render();

    card.querySelector('#rec-table').appendChild(table);
    return card;
  };

  // Add Recurring Modal Builder
  const openRecurringModal = () => {
    let title = '';
    let categoryName = 'Rent & Lease';
    let amount = '';
    let frequency = 'monthly';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    content.innerHTML = `
      <div id="rec-title-in"></div>
      <div class="grid grid-cols-2 gap-2">
        <div id="rec-amount-in"></div>
        <div class="input-group">
          <label class="input-label">Frequency</label>
          <select class="select-field" id="rec-freq-select">
            <option value="weekly">Weekly</option>
            <option value="monthly" selected>Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      <div id="save-rec-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({
      title: '➕ Add Recurring Expense Schedule',
      content
    });
    modal.open();

    const titleInput = new InputComponent({ label: 'Schedule Title', placeholder: 'e.g. Premises Rent', onChange: (v) => { title = v; } }).render();
    const amountInput = new InputComponent({ label: 'Amount ($)', type: 'number', placeholder: '1500.00', onChange: (v) => { amount = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Save Schedule',
      variant: 'primary',
      onClick: () => {
        if (title && amount) {
          const freqSelect = content.querySelector('#rec-freq-select');
          frequency = freqSelect.value;
          expensesService.createRecurringExpense({ title, categoryName, amount, frequency });
          modal.close();
          renderActiveTabContent();
        }
      }
    }).render();

    content.querySelector('#rec-title-in').appendChild(titleInput);
    content.querySelector('#rec-amount-in').appendChild(amountInput);
    content.querySelector('#save-rec-btn').appendChild(btn);
  };

  // 5. Expense Categories Taxonomy Module
  const renderCategoriesModule = () => {
    const { categories } = expensesStore.getState();
    const card = new CardComponent({
      title: '📂 Expense Categories Taxonomy',
      subtitle: 'Manage expense category definitions',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Categories: ${categories.length}</span>
          <button id="add-exp-cat-btn" class="btn btn-primary btn-sm">➕ Add Category</button>
        </div>
        <div id="exp-cat-table"></div>
      `
    }).render();

    card.querySelector('#add-exp-cat-btn').addEventListener('click', () => openAddCategoryModal());

    const table = new TableComponent({
      columns: [
        { key: 'name', title: 'Category Name', render: (val, row) => `<div class="flex items-center gap-2"><div style="width:12px;height:12px;border-radius:50%;background:${row.color};"></div><strong>${val}</strong></div>` }
      ],
      data: categories
    }).render();

    card.querySelector('#exp-cat-table').appendChild(table);
    return card;
  };

  // Add Category Modal Builder
  const openAddCategoryModal = () => {
    let catName = '';
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    const input = new InputComponent({ label: 'Category Name', placeholder: 'e.g. Equipment Repair', onChange: (v) => { catName = v; } }).render();
    content.appendChild(input);

    const modal = new ModalComponent({ title: '📂 Add Expense Category', content });
    modal.open();

    const btn = new ButtonComponent({
      text: 'Add Category',
      variant: 'primary',
      onClick: () => {
        if (catName) {
          expensesService.addCategory(catName);
          modal.close();
          renderActiveTabContent();
        }
      }
    }).render();

    content.appendChild(btn);
  };

  // 6. Reports & Export Module
  const renderReportsModule = () => {
    const card = new CardComponent({
      title: '📈 Financial Reports & CSV Downloader',
      subtitle: 'Generate and export full financial ledger',
      content: `
        <div class="flex flex-col gap-4 mt-2">
          <p class="text-xs text-secondary">Download complete accounting data (Operating Expenses, Non-POS Operating Income, and Net Profit Margins) as a formatted CSV spreadsheet file.</p>
          <div>
            <button id="export-csv-fin-btn" class="btn btn-primary">📥 Export Complete Financials CSV</button>
          </div>
        </div>
      `
    }).render();

    card.querySelector('#export-csv-fin-btn').addEventListener('click', () => expensesService.exportFinancialsToCSV());
    return card;
  };

  renderTabs();
  renderActiveTabContent();
  return container;
}
