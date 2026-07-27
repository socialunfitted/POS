import { Store } from '../core/store.js';

export const suppliersStore = new Store({
  suppliers: [
    {
      id: 'sup-1',
      companyName: 'Dairy Fresh Wholesalers',
      contactPerson: 'Michael Scott',
      phone: '+1 555-0199',
      email: 'michael@dairyfresh.com',
      address: '200 Industrial Park Lane, New York, NY 10001',
      gstNumber: 'GST29AA1234A1Z5',
      category: 'Dairy & Perishables',
      paymentTerms: 'Net 30',
      creditLimit: 5000.00,
      outstandingBalance: 1200.00,
      totalPurchased: 24500.00,
      rating: 5,
      avatarInitials: 'DF',
      isActive: true
    },
    {
      id: 'sup-2',
      companyName: 'Global Beverage Co',
      contactPerson: 'Jim Halpert',
      phone: '+1 555-0188',
      email: 'jim@globalbev.com',
      address: '85 Commerce Street, Chicago, IL 60601',
      gstNumber: 'GST27BB5678B2Y6',
      category: 'Beverages & Liquids',
      paymentTerms: 'Net 15',
      creditLimit: 10000.00,
      outstandingBalance: 0.00,
      totalPurchased: 18200.00,
      rating: 4,
      avatarInitials: 'GB',
      isActive: true
    },
    {
      id: 'sup-3',
      companyName: 'Organic Foods Network',
      contactPerson: 'Pam Beesly',
      phone: '+1 555-0177',
      email: 'pam@organicfoods.com',
      address: '52 Harvest Boulevard, Austin, TX 73301',
      gstNumber: 'GST24CC9012C3X7',
      category: 'Organic & Grocery',
      paymentTerms: 'Advance',
      creditLimit: 3000.00,
      outstandingBalance: 750.00,
      totalPurchased: 11450.00,
      rating: 4,
      avatarInitials: 'OF',
      isActive: true
    }
  ],
  purchaseOrders: [
    { id: 'po-1', poNumber: 'PO-2026-881', supplierId: 'sup-1', supplierName: 'Dairy Fresh Wholesalers', items: 12, subtotal: 1800.00, taxAmount: 216.00, totalAmount: 2016.00, paidAmount: 2016.00, status: 'paid', date: '2026-07-24', dueDate: '2026-08-23' },
    { id: 'po-2', poNumber: 'PO-2026-882', supplierId: 'sup-2', supplierName: 'Global Beverage Co', items: 8, subtotal: 3200.00, taxAmount: 576.00, totalAmount: 3776.00, paidAmount: 3776.00, status: 'paid', date: '2026-07-22', dueDate: '2026-08-06' },
    { id: 'po-3', poNumber: 'PO-2026-895', supplierId: 'sup-1', supplierName: 'Dairy Fresh Wholesalers', items: 6, subtotal: 1200.00, taxAmount: 144.00, totalAmount: 1344.00, paidAmount: 144.00, status: 'partial', date: '2026-07-26', dueDate: '2026-08-25' },
    { id: 'po-4', poNumber: 'PO-2026-901', supplierId: 'sup-3', supplierName: 'Organic Foods Network', items: 10, subtotal: 950.00, taxAmount: 114.00, totalAmount: 1064.00, paidAmount: 314.00, status: 'partial', date: '2026-07-27', dueDate: '2026-07-27' }
  ],
  payments: [
    { id: 'pay-1', supplierId: 'sup-1', supplierName: 'Dairy Fresh Wholesalers', poReference: 'PO-2026-881', amount: 2016.00, method: 'bank_transfer', date: '2026-07-24', note: 'Full settlement' },
    { id: 'pay-2', supplierId: 'sup-2', supplierName: 'Global Beverage Co', poReference: 'PO-2026-882', amount: 3776.00, method: 'upi', date: '2026-07-22', note: 'Full payment via UPI' },
    { id: 'pay-3', supplierId: 'sup-3', supplierName: 'Organic Foods Network', poReference: 'PO-2026-901', amount: 314.00, method: 'cash', date: '2026-07-27', note: 'Partial advance payment' }
  ],
  analytics: {
    totalSuppliers: 3,
    totalPurchasedThisMonth: 18220.00,
    totalOutstanding: 1950.00,
    avgLeadTimeDays: 3.5,
    topSupplier: 'Dairy Fresh Wholesalers'
  },
  searchQuery: '',
  selectedCategory: 'all',
  isLoading: false
});
