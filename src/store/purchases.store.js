import { Store } from '../core/store.js';

export const purchasesStore = new Store({
  purchaseOrders: [
    {
      id: 'po-001',
      poNumber: 'PO-2026-881',
      supplierId: 'sup-1',
      supplierName: 'Dairy Fresh Wholesalers',
      items: [
        { productId: 'p-101', productName: 'Organic Whole Milk 1L', sku: 'MILK-001', qty: 50, unitCost: 1.20, gstRate: 5, lineTotal: 63.00 },
        { productId: 'p-999', productName: 'Butter Salted 500g', sku: 'BUTT-002', qty: 24, unitCost: 2.50, gstRate: 5, lineTotal: 63.00 }
      ],
      subtotal: 120.00,
      gstAmount: 6.00,
      totalAmount: 126.00,
      paidAmount: 126.00,
      discountAmount: 0,
      paymentStatus: 'paid',   // pending | partial | paid
      orderStatus: 'received', // draft | ordered | received | returned
      expectedDate: '2026-07-28',
      receivedDate: '2026-07-26',
      notes: 'Urgent restocking order',
      createdAt: '2026-07-24'
    },
    {
      id: 'po-002',
      poNumber: 'PO-2026-895',
      supplierId: 'sup-2',
      supplierName: 'Global Beverage Co',
      items: [
        { productId: 'p-103', productName: 'Arabica Coffee Beans 250g', sku: 'COFFEE-003', qty: 30, unitCost: 5.50, gstRate: 18, lineTotal: 194.70 }
      ],
      subtotal: 165.00,
      gstAmount: 29.70,
      totalAmount: 194.70,
      paidAmount: 100.00,
      discountAmount: 0,
      paymentStatus: 'partial',
      orderStatus: 'received',
      expectedDate: '2026-07-30',
      receivedDate: '2026-07-27',
      notes: '',
      createdAt: '2026-07-26'
    },
    {
      id: 'po-003',
      poNumber: 'PO-2026-901',
      supplierId: 'sup-3',
      supplierName: 'Organic Foods Network',
      items: [
        { productId: 'p-102', productName: 'Whole Wheat Bread 400g', sku: 'BREAD-002', qty: 40, unitCost: 0.80, gstRate: 0, lineTotal: 32.00 }
      ],
      subtotal: 32.00,
      gstAmount: 0,
      totalAmount: 32.00,
      paidAmount: 0,
      discountAmount: 0,
      paymentStatus: 'pending',
      orderStatus: 'ordered',
      expectedDate: '2026-07-29',
      receivedDate: null,
      notes: 'Rush delivery required',
      createdAt: '2026-07-27'
    }
  ],
  purchaseReturns: [
    {
      id: 'ret-001',
      returnNumber: 'RET-2026-011',
      poReference: 'PO-2026-881',
      supplierId: 'sup-1',
      supplierName: 'Dairy Fresh Wholesalers',
      productName: 'Organic Whole Milk 1L',
      returnQty: 5,
      reason: 'Damaged packaging on arrival',
      refundAmount: 6.30,
      status: 'approved',
      date: '2026-07-26'
    }
  ],
  suppliers: [
    { id: 'sup-1', companyName: 'Dairy Fresh Wholesalers' },
    { id: 'sup-2', companyName: 'Global Beverage Co' },
    { id: 'sup-3', companyName: 'Organic Foods Network' }
  ],
  reportSummary: {
    totalPOsThisMonth: 3,
    totalPurchaseValue: 352.70,
    totalPaid: 226.00,
    totalOutstanding: 126.70,
    totalReturnsValue: 6.30
  },
  filterStatus: 'all',
  searchQuery: '',
  isLoading: false
});
