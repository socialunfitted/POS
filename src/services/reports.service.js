import { reportsStore } from '../store/reports.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Reports & Business Intelligence Service
 * Handles report generation across 9 domains, date filters, PDF printable generation, and CSV downloads.
 */
export class ReportsService {
  /**
   * Set Active Report Domain & Time Period Filters
   */
  setReportFilters(domain, period, startDate = null, endDate = null) {
    const update = { selectedDomain: domain, selectedPeriod: period };
    if (startDate) update.startDate = startDate;
    if (endDate) update.endDate = endDate;

    reportsStore.setState(update);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Report Generated',
      message: `Updated report view to "${domain.toUpperCase()}" (${period.toUpperCase()}).`
    });
  }

  /**
   * Export Active Report Domain to CSV File Downloader
   */
  exportReportToCSV(domain) {
    const { domains } = reportsStore.getState();
    const rep = domains[domain] || domains.sales;

    if (!rep.tableData || rep.tableData.length === 0) {
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'warning',
        title: 'Export Failed',
        message: 'No data available for export.'
      });
      return;
    }

    const headers = Object.keys(rep.tableData[0]);
    const rows = rep.tableData.map((row) =>
      headers.map((h) => (typeof row[h] === 'string' ? `"${row[h]}"` : row[h]))
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnipos_report_${domain}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'CSV Export Downloaded',
      message: `Report exported as CSV file successfully.`
    });
  }

  /**
   * Export Active Report to PDF / Printable Document Window
   */
  exportReportToPDF(domain) {
    const { domains, selectedPeriod, startDate, endDate } = reportsStore.getState();
    const rep = domains[domain] || domains.sales;

    const win = window.open('', '_blank');
    if (!win) return;

    const headers = Object.keys(rep.tableData[0] || {});

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OmniPOS Report - ${rep.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #6366f1; }
          .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #6366f1; color: #fff; padding: 8px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">OmniPOS Business Report</div>
          <div class="meta">${rep.title} &bull; Period: ${selectedPeriod.toUpperCase()} (${startDate} to ${endDate})</div>
        </div>

        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h.toUpperCase()}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rep.tableData.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by OmniPOS Analytics Engine on ${new Date().toLocaleString()}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);

    win.document.close();
  }
}

export const reportsService = new ReportsService();
