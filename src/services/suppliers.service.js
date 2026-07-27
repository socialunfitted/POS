import { suppliersStore } from '../store/suppliers.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Supplier Management Service
 * Manages Supplier Profiles, Purchase Order history, Payment collections, Outstanding balances & Analytics.
 */
export class SuppliersService {
  /**
   * Add New Supplier Profile
   */
  async addSupplier(data) {
    suppliersStore.setState({ isLoading: true });

    const newSupplier = {
      id: `sup-${Date.now()}`,
      companyName: data.companyName,
      contactPerson: data.contactPerson || 'Contact Person',
      phone: data.phone || '+1 555-0000',
      email: data.email || 'supplier@company.com',
      address: data.address || 'Business Address',
      gstNumber: data.gstNumber || '',
      category: data.category || 'General',
      paymentTerms: data.paymentTerms || 'Net 30',
      creditLimit: parseFloat(data.creditLimit) || 5000.00,
      outstandingBalance: 0.00,
      totalPurchased: 0.00,
      rating: 5,
      avatarInitials: data.companyName.slice(0, 2).toUpperCase(),
      isActive: true
    };

    const current = suppliersStore.getState().suppliers;
    suppliersStore.setState({ suppliers: [newSupplier, ...current], isLoading: false });

    await supabaseService.insert('suppliers', {
      company_name: newSupplier.companyName,
      contact_person: newSupplier.contactPerson,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Supplier Added',
      message: `Supplier "${newSupplier.companyName}" registered successfully.`
    });

    return { success: true, supplier: newSupplier };
  }

  /**
   * Update Supplier Details
   */
  async updateSupplier(id, data) {
    const current = suppliersStore.getState().suppliers;
    const updated = current.map((s) => (s.id === id ? { ...s, ...data } : s));
    suppliersStore.setState({ suppliers: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Supplier Updated',
      message: 'Supplier profile saved successfully.'
    });
  }

  /**
   * Delete Supplier
   */
  async deleteSupplier(id) {
    const current = suppliersStore.getState().suppliers;
    suppliersStore.setState({ suppliers: current.filter((s) => s.id !== id) });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Supplier Removed',
      message: 'Supplier profile deleted.'
    });
  }

  /**
   * Record a Payment to Supplier
   */
  recordPayment(supplierId, amount, method = 'bank_transfer', poReference = '', note = '') {
    const numAmount = parseFloat(amount) || 0;

    // Reduce outstanding balance
    const suppliers = suppliersStore.getState().suppliers;
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id === supplierId) {
        return { ...s, outstandingBalance: Math.max(0, s.outstandingBalance - numAmount) };
      }
      return s;
    });

    // Add to payment ledger
    const supplier = suppliers.find((s) => s.id === supplierId);
    const payments = suppliersStore.getState().payments;
    const newPayment = {
      id: `pay-${Date.now()}`,
      supplierId,
      supplierName: supplier?.companyName || '',
      poReference: poReference || `PO-REF-${Date.now()}`,
      amount: numAmount,
      method,
      date: new Date().toISOString().split('T')[0],
      note
    };

    suppliersStore.setState({ suppliers: updatedSuppliers, payments: [newPayment, ...payments] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Payment Recorded',
      message: `Payment of $${numAmount.toFixed(2)} sent to ${supplier?.companyName}.`
    });
  }

  /**
   * Create a new Purchase Order
   */
  createPurchaseOrder(supplierId, items = 5, subtotal = 1000.00, taxRate = 12) {
    const supplier = suppliersStore.getState().suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const orders = suppliersStore.getState().purchaseOrders;
    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(900 + Math.random() * 100)}`,
      supplierId,
      supplierName: supplier.companyName,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    // Increase outstanding balance
    const suppliers = suppliersStore.getState().suppliers;
    const updatedSuppliers = suppliers.map((s) =>
      s.id === supplierId ? { ...s, outstandingBalance: s.outstandingBalance + totalAmount, totalPurchased: s.totalPurchased + totalAmount } : s
    );

    suppliersStore.setState({ purchaseOrders: [newPO, ...orders], suppliers: updatedSuppliers });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Purchase Order Created',
      message: `${newPO.poNumber} raised for ${supplier.companyName} — Total $${totalAmount.toFixed(2)}.`
    });
  }

  /**
   * Export Supplier List to CSV
   */
  exportSuppliersToCSV() {
    const { suppliers } = suppliersStore.getState();
    const headers = ['ID', 'Company', 'Contact', 'Phone', 'Email', 'Category', 'Outstanding', 'Total Purchased'];
    const rows = suppliers.map((s) => [
      s.id, `"${s.companyName}"`, `"${s.contactPerson}"`, s.phone, s.email,
      `"${s.category}"`, s.outstandingBalance.toFixed(2), s.totalPurchased.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `omnipos_suppliers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const suppliersService = new SuppliersService();
