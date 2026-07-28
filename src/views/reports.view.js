import { reportsStore } from '../store/reports.store.js';
import { reportsService } from '../services/reports.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { SelectComponent } from '../components/base/select.component.js';
import { ChartComponent } from '../components/base/chart.component.js';

export async function ReportsView() {
  const container = document.createElement('div');
  container.className = 'reports-view flex flex-col gap-6';

  const state = reportsStore.getState();
  let currentDomain = state.selectedDomain;
  let currentPeriod = state.selectedPeriod;

  const domainOptions = [
    { value: 'sales', label: '📊 Sales & Revenue' },
    { value: 'purchase', label: '🛒 Purchase & Procurement' },
    { value: 'inventory', label: '🏬 Inventory Valuation' },
    { value: 'customer', label: '👥 Customer CRM' },
    { value: 'supplier', label: '🚛 Supplier Ledgers' },
    { value: 'employee', label: '👔 Employee Performance' },
    { value: 'gst', label: '🧾 GST Tax Audit (GSTR-1/3B)' },
    { value: 'profit', label: '📈 Profit & Loss (P&L)' },
    { value: 'cashflow', label: '💵 Operating Cash Flow' }
  ];

  const periodOptions = [
    { value: 'daily', label: '📅 Today (Daily)' },
    { value: 'weekly', label: '📅 This Week' },
    { value: 'monthly', label: '📅 This Month' },
    { value: 'yearly', label: '📅 This Year' },
    { value: 'custom', label: '📅 Custom Date Range' }
  ];

  // 1. Control Header Card (Domain + Period + Actions)
  const headerCard = new CardComponent({
    title: '📈 Enterprise Business Intelligence & Reports',
    subtitle: 'Generate comprehensive audit reports, GST tax filings, P&L statements, and export data',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap" id="domain-select-wrapper"></div>
        <div class="flex items-center gap-2 flex-wrap" id="period-select-wrapper"></div>

        <div class="flex items-center gap-2 flex-wrap">
          <button id="export-pdf-btn" class="btn btn-primary btn-sm">📄 Export PDF</button>
          <button id="export-csv-btn" class="btn btn-secondary btn-sm">📊 Export CSV</button>
          <button id="print-report-btn" class="btn btn-secondary btn-sm">🖨️ Print</button>
        </div>
      </div>
      <div id="custom-date-row" class="mt-3 grid grid-cols-2 gap-2 max-w-sm hidden"></div>
    `
  }).render();

  // Bind Selectors
  const domainSelect = new SelectComponent({
    options: domainOptions,
    value: currentDomain,
    onChange: (val) => {
      currentDomain = val;
      reportsService.setReportFilters(currentDomain, currentPeriod);
      renderReportContent();
    }
  }).render();

  const periodSelect = new SelectComponent({
    options: periodOptions,
    value: currentPeriod,
    onChange: (val) => {
      currentPeriod = val;
      const customRow = headerCard.querySelector('#custom-date-row');
      if (val === 'custom') customRow.classList.remove('hidden');
      else customRow.classList.add('hidden');

      reportsService.setReportFilters(currentDomain, currentPeriod);
      renderReportContent();
    }
  }).render();

  headerCard.querySelector('#domain-select-wrapper').appendChild(domainSelect);
  headerCard.querySelector('#period-select-wrapper').appendChild(periodSelect);

  // Custom Date Range Inputs
  const startDateInput = new InputComponent({ type: 'date', value: state.startDate, onChange: (v) => reportsService.setReportFilters(currentDomain, currentPeriod, v, null) }).render();
  const endDateInput = new InputComponent({ type: 'date', value: state.endDate, onChange: (v) => reportsService.setReportFilters(currentDomain, currentPeriod, null, v) }).render();

  const customRow = headerCard.querySelector('#custom-date-row');
  customRow.appendChild(startDateInput);
  customRow.appendChild(endDateInput);

  headerCard.querySelector('#export-pdf-btn').addEventListener('click', () => reportsService.exportReportToPDF(currentDomain));
  headerCard.querySelector('#export-csv-btn').addEventListener('click', () => reportsService.exportReportToCSV(currentDomain));
  headerCard.querySelector('#print-report-btn').addEventListener('click', () => reportsService.exportReportToPDF(currentDomain));

  container.appendChild(headerCard);

  // 2. Report Content Render Target
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'report-content flex flex-col gap-6';
  container.appendChild(contentWrapper);

  // Render Method
  const renderReportContent = () => {
    contentWrapper.innerHTML = '';
    const { domains } = reportsStore.getState();
    const repData = domains[currentDomain] || domains.sales;

    // A. Chart Visualizations Section
    const chartCard = new CardComponent({
      title: `${repData.title} — Visual Analytics`,
      subtitle: `Trend analysis for ${currentPeriod.toUpperCase()} period`,
      content: `<div id="chart-wrapper"></div>`
    }).render();

    const chartInstance = new ChartComponent({
      labels: repData.chartLabels || ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: repData.title,
          data: repData.chartData || [10, 20, 30, 40],
          color: 'var(--color-primary)'
        }
      ]
    }).render();

    chartCard.querySelector('#chart-wrapper').appendChild(chartInstance);
    contentWrapper.appendChild(chartCard);

    // B. Itemized Report Data Table Card
    const tableCard = new CardComponent({
      title: `${repData.title} — Itemized Audit Data`,
      content: `<div id="report-table-wrapper"></div>`
    }).render();

    const keys = Object.keys(repData.tableData[0] || {});
    const columns = keys.map((k) => ({
      key: k,
      title: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      render: (val) => typeof val === 'number' ? `<strong>$${val.toFixed(2)}</strong>` : String(val)
    }));

    const table = new TableComponent({
      columns,
      data: repData.tableData
    }).render();

    tableCard.querySelector('#report-table-wrapper').appendChild(table);
    contentWrapper.appendChild(tableCard);
  };

  renderReportContent();
  return container;
}
