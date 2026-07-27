import { Store } from '../core/store.js';

export const reportsStore = new Store({
  selectedDomain: 'sales', // sales | purchase | inventory | customer | supplier | employee | gst | profit | cashflow
  selectedPeriod: 'monthly', // daily | weekly | monthly | yearly | custom
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  domains: {
    sales: {
      title: 'Sales & Revenue Report',
      totalRevenue: 18450.00,
      totalOrders: 384,
      avgOrderValue: 48.05,
      taxCollected: 1476.00,
      chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      chartData: [2100, 2450, 1980, 2800, 3100, 3450, 2570],
      tableData: [
        { date: '2026-07-27', ordersCount: 52, paymentMethod: 'Card', totalSales: 2450.00, taxAmount: 196.00 },
        { date: '2026-07-26', ordersCount: 48, paymentMethod: 'UPI', totalSales: 2100.00, taxAmount: 168.00 },
        { date: '2026-07-25', ordersCount: 61, paymentMethod: 'Cash', totalSales: 3100.00, taxAmount: 248.00 }
      ]
    },
    purchase: {
      title: 'Procurement & Purchase Report',
      totalSpend: 14250.00,
      totalPOs: 18,
      gstPaid: 1240.00,
      outstandingPayable: 1950.00,
      chartLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      chartData: [3200, 4100, 2800, 4150],
      tableData: [
        { refNo: 'PO-2026-881', supplier: 'Dairy Fresh Wholesalers', itemsCount: 12, totalAmount: 2016.00, status: 'PAID' },
        { refNo: 'PO-2026-895', supplier: 'Global Beverage Co', itemsCount: 8, totalAmount: 1344.00, status: 'PARTIAL' }
      ]
    },
    inventory: {
      title: 'Inventory Stock & Asset Valuation Report',
      totalSKUs: 1240,
      costValuation: 14250.00,
      retailValuation: 28400.00,
      lowStockItems: 14,
      chartLabels: ['Dairy', 'Bakery', 'Beverages', 'Grocery'],
      chartData: [40, 25, 20, 15],
      tableData: [
        { sku: 'MILK-001', name: 'Organic Whole Milk 1L', category: 'Dairy', stock: 24, costPrice: 1.20, retailPrice: 2.50 },
        { sku: 'BREAD-002', name: 'Whole Wheat Bread 400g', category: 'Bakery', stock: 15, costPrice: 0.80, retailPrice: 1.80 }
      ]
    },
    customer: {
      title: 'Customer CRM & Loyalty Report',
      totalCustomers: 450,
      activeMembers: 320,
      loyaltyPointsActive: 14500,
      totalWalletBalance: 2450.00,
      chartLabels: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      chartData: [180, 140, 80, 50],
      tableData: [
        { name: 'Sarah Connor', tier: 'Gold', totalSpend: 1450.00, wallet: 120.00, points: 450 },
        { name: 'John Doe', tier: 'Silver', totalSpend: 980.50, wallet: 35.50, points: 290 }
      ]
    },
    supplier: {
      title: 'Supplier Procurement Ledger Report',
      activeSuppliers: 12,
      totalProcured: 34500.00,
      outstandingPayable: 1950.00,
      avgLeadDays: 3.5,
      chartLabels: ['Dairy Fresh', 'Global Bev', 'Organic Foods', 'Others'],
      chartData: [45, 30, 15, 10],
      tableData: [
        { company: 'Dairy Fresh Wholesalers', contact: 'Michael Scott', phone: '+1 555-0199', purchased: 24500.00, balance: 1200.00 },
        { company: 'Global Beverage Co', contact: 'Jim Halpert', phone: '+1 555-0188', purchased: 18200.00, balance: 0.00 }
      ]
    },
    employee: {
      title: 'Employee Sales & Performance Report',
      totalStaff: 8,
      onDutyNow: 6,
      monthlyPayroll: 12400.00,
      commissionsPaid: 840.50,
      chartLabels: ['Alex Mercer', 'David Miller', 'Emily Watson', 'John Smith'],
      chartData: [12025, 9466, 6533, 4200],
      tableData: [
        { name: 'Alex Mercer', role: 'Manager', sales: 12025.00, orders: 142, commission: 240.50 },
        { name: 'David Miller', role: 'Cashier', sales: 9466.00, orders: 118, commission: 142.00 }
      ]
    },
    gst: {
      title: 'GST Tax Audit Report (GSTR-1, GSTR-2 & GSTR-3B)',
      outputGstCollected: 1476.00, // GSTR-1
      inputGstPaid: 1240.00,       // GSTR-2
      netGstPayable: 236.00,       // GSTR-3B
      taxableTurnover: 18450.00,
      chartLabels: ['Output Tax (GSTR-1)', 'Input Credit (GSTR-2)', 'Net Payable (GSTR-3B)'],
      chartData: [1476, 1240, 236],
      tableData: [
        { slab: '5% GST Slab', taxableValue: 4500.00, taxAmount: 225.00 },
        { slab: '12% GST Slab', taxableValue: 6000.00, taxAmount: 720.00 },
        { slab: '18% GST Slab', taxableValue: 7950.00, taxAmount: 1431.00 }
      ]
    },
    profit: {
      title: 'Profit & Loss (P&L) Financial Report',
      grossSales: 18450.00,
      cogs: 6200.00,
      grossProfit: 12250.00,
      operatingExpenses: 2670.49,
      netProfit: 10699.51,
      marginPercent: 57.99,
      chartLabels: ['Gross Sales', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit'],
      chartData: [18450, 6200, 12250, 2670, 10699],
      tableData: [
        { lineItem: 'Gross POS Revenue', amount: 18450.00, type: 'INCOME' },
        { lineItem: 'Cost of Goods Sold (COGS)', amount: -6200.00, type: 'COST' },
        { lineItem: 'Operating Expenses', amount: -2670.49, type: 'EXPENSE' },
        { lineItem: 'Net Operating Profit', amount: 10699.51, type: 'NET' }
      ]
    },
    cashflow: {
      title: 'Operating Cash Flow Report',
      cashInflows: 19570.00,
      cashOutflows: 8870.49,
      netCashFlow: 10699.51,
      endingBalance: 24500.00,
      chartLabels: ['Inflows', 'Outflows', 'Net Flow'],
      chartData: [19570, 8870, 10699],
      tableData: [
        { category: 'Customer Sales Cash Collections', inflow: 18450.00, outflow: 0.00 },
        { category: 'Government Subsidies & Grants', inflow: 1000.00, outflow: 0.00 },
        { category: 'Supplier PO Payments', inflow: 0.00, outflow: 6200.00 },
        { category: 'Rent & Utility Expenses', inflow: 0.00, outflow: 2670.49 }
      ]
    }
  },
  isLoading: false
});
