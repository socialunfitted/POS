import { Store } from '../core/store.js';

export const dashboardStore = new Store({
  todaySales: 1845.50,
  todayOrderCount: 38,
  todayRevenue: 1845.50,
  netProfit: 520.00,
  profitMargin: 28.18,
  totalProductsCount: 1240,
  activeCategoriesCount: 12,
  lowStockCount: 14,
  lowStockItems: [
    { id: 'p-101', name: 'Organic Whole Milk 1L', sku: 'MILK-001', stock: 2, minLevel: 10, unit: 'pcs' },
    { id: 'p-102', name: 'Whole Wheat Bread 400g', sku: 'BREAD-002', stock: 4, minLevel: 15, unit: 'pcs' },
    { id: 'p-103', name: 'Arabica Coffee Beans 250g', sku: 'COFFEE-003', stock: 1, minLevel: 8, unit: 'pcs' },
    { id: 'p-104', name: 'Extra Virgin Olive Oil 500ml', sku: 'OIL-004', stock: 3, minLevel: 10, unit: 'pcs' }
  ],
  recentBills: [
    { invoiceNo: 'INV-2026-1089', customer: 'John Doe', itemsCount: 4, total: '$45.50', paymentMethod: 'upi', status: 'paid', time: '10 mins ago' },
    { invoiceNo: 'INV-2026-1088', customer: 'Walk-in Customer', itemsCount: 2, total: '$12.00', paymentMethod: 'cash', status: 'paid', time: '25 mins ago' },
    { invoiceNo: 'INV-2026-1087', customer: 'Sarah Connor', itemsCount: 8, total: '$128.40', paymentMethod: 'card', status: 'paid', time: '42 mins ago' },
    { invoiceNo: 'INV-2026-1086', customer: 'Emma Watson', itemsCount: 1, total: '$8.50', paymentMethod: 'upi', status: 'paid', time: '1 hour ago' }
  ],
  topCustomers: [
    { id: 'c-1', name: 'Sarah Connor', phone: '+1 555-0192', totalSpend: '$1,450.00', visits: 18, loyaltyPoints: 450 },
    { id: 'c-2', name: 'John Doe', phone: '+1 555-0144', totalSpend: '$980.50', visits: 12, loyaltyPoints: 290 },
    { id: 'c-3', name: 'Robert Paul', phone: '+1 555-0177', totalSpend: '$720.00', visits: 9, loyaltyPoints: 210 }
  ],
  hourlySalesData: [
    { hour: '8 AM', sales: 120 },
    { hour: '10 AM', sales: 280 },
    { hour: '12 PM', sales: 450 },
    { hour: '2 PM', sales: 310 },
    { hour: '4 PM', sales: 390 },
    { hour: '6 PM', sales: 295.50 }
  ],
  categoryDistributionData: [
    { category: 'Grocery', percent: 40, color: 'var(--color-primary)' },
    { category: 'Dairy', percent: 25, color: 'var(--color-secondary)' },
    { category: 'Beverages', percent: 20, color: 'var(--color-success)' },
    { category: 'Snacks', percent: 15, color: 'var(--color-warning)' }
  ],
  businessSummary: {
    grossSales: 1845.50,
    taxCollected: 147.64,
    discountsGiven: 65.00,
    cogs: 1112.86,
    netProfit: 520.00
  },
  notifications: [
    { id: 'n-1', type: 'warning', title: 'Low Stock Alert', message: '4 products have reached critical reorder threshold.' },
    { id: 'n-2', type: 'info', title: 'Daily Report Ready', message: 'Yesterday end-of-day report generated.' }
  ],
  isLoading: false
});
