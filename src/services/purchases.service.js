import { purchasesStore } from '../store/purchases.store.js';
import { inventoryStore } from '../store/inventory.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Purchase Management Service
 * Handles Purchase Order creation, Invoice recording, Inventory updates,
 * Payment settlements, Purchase Returns and PDF export.
 */
export class PurchasesService {

  /**
   * Create a new Purchase Order
   */
  createPurchaseOrder(data) {
    purchasesStore.setState({ isLoading: true });

    // Compute totals from line items
    const items = data.items || [];
    const subtotal = items.reduce((sum, it) => sum + (it.qty * it.unitCost), 0);
    const gstAmount = items.reduce((sum, it) => {
      const lineBase = it.qty * it.unitCost;
      return sum + (lineBase * it.gstRate / 100);
    }, 0);
    const totalAmount = subtotal + gstAmount - (parseFloat(data.discountAmount) || 0);

    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(902 + Math.random() * 98)}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidAmount: 0,
      discountAmount: parseFloat(data.discountAmount) || 0,
      paymentStatus: 'pending',
      orderStatus: 'ordered',
      expectedDate: data.expectedDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      receivedDate: null,
      notes: data.notes || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const current = purchasesStore.getState().purchaseOrders;
    purchasesStore.setState({ purchaseOrders: [newPO, ...current], isLoading: false });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Purchase Order Created',
      message: `${newPO.poNumber} raised for ${newPO.supplierName} — Total $${newPO.totalAmount.toFixed(2)}.`
    });

    return newPO;
  }

  /**
   * Mark Purchase Order as Received + update inventory stock entries
   */
  markAsReceived(poId) {
    const orders = purchasesStore.getState().purchaseOrders;
    const po = orders.find((o) => o.id === poId);
    if (!po) return;

    const updated = orders.map((o) =>
      o.id === poId ? { ...o, orderStatus: 'received', receivedDate: new Date().toISOString().split('T')[0] } : o
    );
    purchasesStore.setState({ purchaseOrders: updated });

    // Trigger stock entry log in inventory store
    const stockEntries = inventoryStore.getState().stockEntries;
    const newGrn = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplier: po.supplierName,
      itemsCount: po.items.length,
      date: new Date().toISOString().split('T')[0],
      status: 'received'
    };
    inventoryStore.setState({ stockEntries: [newGrn, ...stockEntries] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Stock Received',
      message: `${po.poNumber} marked as received. Inventory updated.`
    });
  }

  /**
   * Record a partial or full payment against a PO
   */
  recordPayment(poId, amount) {
    const numAmount = parseFloat(amount) || 0;
    const orders = purchasesStore.getState().purchaseOrders;

    const updated = orders.map((o) => {
      if (o.id !== poId) return o;
      const newPaid = Math.min(o.totalAmount, o.paidAmount + numAmount);
      const paymentStatus = newPaid >= o.totalAmount ? 'paid' : 'partial';
      return { ...o, paidAmount: parseFloat(newPaid.toFixed(2)), paymentStatus };
    });

    purchasesStore.setState({ purchaseOrders: updated });

    const po = updated.find((o) => o.id === poId);
    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Payment Recorded',
      message: `$${numAmount.toFixed(2)} recorded against ${po?.poNumber}. Status: ${po?.paymentStatus.toUpperCase()}.`
    });
  }

  /**
   * Create a Purchase Return against a received PO
   */
  createReturn(poId, productName, returnQty, reason) {
    const po = purchasesStore.getState().purchaseOrders.find((o) => o.id === poId);
    if (!po) return;

    const item = po.items.find((i) => i.productName === productName);
    const unitCost = item ? item.unitCost : 0;
    const refundAmount = parseFloat((returnQty * unitCost * (1 + (item?.gstRate || 0) / 100)).toFixed(2));

    const returns = purchasesStore.getState().purchaseReturns;
    const newReturn = {
      id: `ret-${Date.now()}`,
      returnNumber: `RET-2026-${Math.floor(100 + Math.random() * 900)}`,
      poReference: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      productName,
      returnQty: parseInt(returnQty),
      reason,
      refundAmount,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    purchasesStore.setState({ purchaseReturns: [newReturn, ...returns] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Purchase Return Raised',
      message: `${newReturn.returnNumber} for ${returnQty} units of "${productName}". Refund: $${refundAmount}.`
    });
  }

  /**
   * Export Purchase Orders to CSV
   */
  exportToCSV() {
    const { purchaseOrders } = purchasesStore.getState();
    const headers = ['PO Number', 'Supplier', 'Subtotal', 'GST', 'Total', 'Paid', 'Balance', 'Payment Status', 'Order Status', 'Date'];
    const rows = purchaseOrders.map((o) => [
      o.poNumber, `"${o.supplierName}"`,
      o.subtotal.toFixed(2), o.gstAmount.toFixed(2), o.totalAmount.toFixed(2),
      o.paidAmount.toFixed(2), (o.totalAmount - o.paidAmount).toFixed(2),
      o.paymentStatus, o.orderStatus, o.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `omnipos_purchases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Export Complete',
      message: 'Purchase orders exported to CSV successfully.'
    });
  }

  /**
   * Generate printable PDF-style Invoice for a PO (opens print dialog)
   */
  printPurchaseInvoice(po) {
    const win = window.open('', '_blank');
    if (!win) return;

    const itemRows = po.items.map((it) => {
      const lineBase = it.qty * it.unitCost;
      const lineTax = lineBase * it.gstRate / 100;
      return `
        <tr>
          <td>${it.productName}</td>
          <td>${it.sku}</td>
          <td style="text-align:center">${it.qty}</td>
          <td style="text-align:right">$${it.unitCost.toFixed(2)}</td>
          <td style="text-align:center">${it.gstRate}%</td>
          <td style="text-align:right">$${lineTax.toFixed(2)}</td>
          <td style="text-align:right"><strong>$${(lineBase + lineTax).toFixed(2)}</strong></td>
        </tr>`;
    }).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice - ${po.poNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 16px; }
          .logo { font-size: 24px; font-weight: 900; color: #6366f1; }
          .subtitle { font-size: 11px; color: #64748b; }
          h2 { font-size: 18px; color: #1e293b; }
          .badge { display:inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
          .badge-paid { background: #dcfce7; color: #16a34a; }
          .badge-partial { background: #fef9c3; color: #b45309; }
          .badge-pending { background: #fee2e2; color: #dc2626; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { padding: 12px; background: #f8fafc; border-radius: 8px; }
          .label { font-size: 10px; color: #64748b; margin-bottom: 4px; }
          .value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #6366f1; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) td { background: #f8fafc; }
          .totals { float: right; width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
          .totals-grand { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 900; color: #6366f1; }
          .footer { margin-top: 48px; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">OmniPOS</div>
            <div class="subtitle">Purchase Invoice</div>
          </div>
          <div style="text-align:right;">
            <h2>${po.poNumber}</h2>
            <div style="margin-top:4px;">Date: <strong>${po.createdAt}</strong></div>
            <div>Expected: <strong>${po.expectedDate}</strong></div>
            <span class="badge badge-${po.paymentStatus}">${po.paymentStatus.toUpperCase()}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="label">FROM (Supplier)</div>
            <div class="value">${po.supplierName}</div>
          </div>
          <div class="info-box">
            <div class="label">ORDER STATUS</div>
            <div class="value">${po.orderStatus.toUpperCase()}</div>
            ${po.receivedDate ? `<div class="label" style="margin-top:4px">Received: ${po.receivedDate}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Unit Cost</th>
              <th style="text-align:center">GST%</th>
              <th style="text-align:right">GST Amt</th>
              <th style="text-align:right">Line Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>$${po.subtotal.toFixed(2)}</span></div>
          <div class="totals-row"><span>GST / Tax</span><span>$${po.gstAmount.toFixed(2)}</span></div>
          <div class="totals-row"><span>Discount</span><span>-$${(po.discountAmount || 0).toFixed(2)}</span></div>
          <div class="totals-row"><span>Amount Paid</span><span style="color:#16a34a">$${po.paidAmount.toFixed(2)}</span></div>
          <div class="totals-row"><span>Balance Due</span><span style="color:#dc2626">$${(po.totalAmount - po.paidAmount).toFixed(2)}</span></div>
          <div class="totals-grand"><span>GRAND TOTAL</span><span>$${po.totalAmount.toFixed(2)}</span></div>
        </div>

        ${po.notes ? `<div style="clear:both;margin-top:16px;padding:10px;background:#f1f5f9;border-radius:6px;font-size:11px;"><strong>Notes:</strong> ${po.notes}</div>` : ''}

        <div class="footer">
          <p>Generated by OmniPOS — Purchase Invoice ${po.poNumber} — ${new Date().toLocaleDateString()}</p>
          <p style="margin-top:4px;">This is a computer-generated document and does not require a signature.</p>
        </div>
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  }
}

export const purchasesService = new PurchasesService();
