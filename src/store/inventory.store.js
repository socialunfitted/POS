import { Store } from '../core/store.js';

export const inventoryStore = new Store({
  warehouses: [
    { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN', address: '100 Logistics Blvd', isPrimary: true },
    { id: 'wh-2', name: 'Downtown Retail Outlet', code: 'WH-STORE-1', address: '45 Main Street', isPrimary: false },
    { id: 'wh-3', name: 'Northside Branch Outlet', code: 'WH-STORE-2', address: '88 North Avenue', isPrimary: false }
  ],
  stockEntries: [
    { id: 'grn-101', grnNumber: 'GRN-2026-001', supplier: 'Dairy Fresh Wholesalers', itemsCount: 4, date: '2026-07-25', status: 'received' }
  ],
  stockAdjustments: [
    { id: 'adj-101', refNo: 'ADJ-2026-005', productName: 'Organic Whole Milk 1L', type: 'damage', quantity: -2, reason: 'Expired packaging leakage', date: '2026-07-26' }
  ],
  purchases: [
    { id: 'po-101', poNumber: 'PO-2026-881', supplier: 'Global Beverage Co', totalAmount: '$1,240.00', paymentStatus: 'paid', date: '2026-07-24' }
  ],
  transfers: [
    { id: 'tr-101', transferNo: 'TR-2026-042', fromWarehouse: 'Main Central Warehouse', toWarehouse: 'Downtown Retail Outlet', itemsCount: 25, status: 'completed', date: '2026-07-26' }
  ],
  batches: [
    { id: 'b-101', batchNumber: 'B-2026-MILK08', productName: 'Organic Whole Milk 1L', mfgDate: '2026-07-20', expiryDate: '2026-08-05', quantity: 24, status: 'expiring_soon' },
    { id: 'b-102', batchNumber: 'B-2026-COFFEE12', productName: 'Arabica Coffee Beans 250g', mfgDate: '2026-06-01', expiryDate: '2027-06-01', quantity: 4, status: 'valid' }
  ],
  suppliers: [
    { id: 'sup-1', companyName: 'Dairy Fresh Wholesalers', contactPerson: 'Michael Scott', phone: '+1 555-0199', balance: '$450.00' },
    { id: 'sup-2', companyName: 'Global Beverage Co', contactPerson: 'Jim Halpert', phone: '+1 555-0188', balance: '$0.00' }
  ],
  deadStockItems: [
    { id: 'p-901', name: 'Legacy Scanner Cable', sku: 'CABLE-901', stock: 18, lastSold: '85 days ago', value: '$270.00' }
  ],
  autoReorderSuggestions: [
    { productId: 'p-103', productName: 'Arabica Coffee Beans 250g', currentStock: 4, minStock: 10, suggestedOrderQty: 25, supplier: 'Global Beverage Co', estCost: '$137.50' },
    { productId: 'p-101', productName: 'Organic Whole Milk 1L', currentStock: 2, minStock: 10, suggestedOrderQty: 50, supplier: 'Dairy Fresh Wholesalers', estCost: '$60.00' }
  ],
  inventoryValuation: {
    totalItemsCount: 1240,
    totalValuationCost: 14250.00,
    totalValuationRetail: 28400.00,
    potentialProfit: 14150.00
  },
  isLoading: false
});
