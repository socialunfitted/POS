import { Store } from '../core/store.js';

export const expensesStore = new Store({
  expenses: [
    {
      id: 'exp-101',
      title: 'Store Premises Monthly Rent',
      categoryId: 'cat-rent',
      categoryName: 'Rent & Lease',
      amount: 1500.00,
      paymentMethod: 'bank_transfer',
      referenceNo: 'RENT-2026-07',
      date: '2026-07-01',
      status: 'paid',
      notes: 'Paid via direct bank wire'
    },
    {
      id: 'exp-102',
      title: 'Electricity & Utility Bill',
      categoryId: 'cat-util',
      categoryName: 'Utilities',
      amount: 240.50,
      paymentMethod: 'upi',
      referenceNo: 'ELEC-9812',
      date: '2026-07-15',
      status: 'paid',
      notes: 'Monthly power bill'
    },
    {
      id: 'exp-103',
      title: 'Staff Weekly Wages',
      categoryId: 'cat-salary',
      categoryName: 'Salaries & Wages',
      amount: 850.00,
      paymentMethod: 'cash',
      referenceNo: 'PAY-WEEK-29',
      date: '2026-07-22',
      status: 'paid',
      notes: 'Cash wages for 2 part-time staff'
    },
    {
      id: 'exp-104',
      title: 'High-Speed Fiber Internet',
      categoryId: 'cat-util',
      categoryName: 'Utilities',
      amount: 79.99,
      paymentMethod: 'card',
      referenceNo: 'NET-7712',
      date: '2026-07-25',
      status: 'paid',
      notes: 'Broadband internet subscription'
    }
  ],
  incomes: [
    {
      id: 'inc-101',
      title: 'Government Small Business Grant',
      source: 'Government Subsidy',
      amount: 1000.00,
      paymentMethod: 'bank_transfer',
      referenceNo: 'SUB-2026-01',
      date: '2026-07-10',
      notes: 'Direct business relief grant'
    },
    {
      id: 'inc-102',
      title: 'Scrap Packaging Material Sale',
      source: 'Salvage Sales',
      amount: 120.00,
      paymentMethod: 'cash',
      referenceNo: 'SCRAP-042',
      date: '2026-07-18',
      notes: 'Recycled cardboard box sales'
    }
  ],
  recurringExpenses: [
    {
      id: 'rec-1',
      title: 'Monthly Store Premises Rent',
      categoryName: 'Rent & Lease',
      amount: 1500.00,
      frequency: 'monthly', // monthly | weekly | yearly
      nextDueDate: '2026-08-01',
      autoProcess: true
    },
    {
      id: 'rec-2',
      title: 'Commercial Fiber Internet',
      categoryName: 'Utilities',
      amount: 79.99,
      frequency: 'monthly',
      nextDueDate: '2026-08-25',
      autoProcess: true
    }
  ],
  categories: [
    { id: 'cat-rent', name: 'Rent & Lease', color: '#6366f1' },
    { id: 'cat-util', name: 'Utilities', color: '#f59e0b' },
    { id: 'cat-salary', name: 'Salaries & Wages', color: '#10b981' },
    { id: 'cat-mkt', name: 'Marketing & Ads', color: '#ec4899' },
    { id: 'cat-office', name: 'Office Supplies', color: '#8b5cf6' },
    { id: 'cat-logistics', name: 'Logistics & Freight', color: '#06b6d4' }
  ],
  financialSummary: {
    grossRevenue: 18450.00,
    cogs: 6200.00,
    grossProfit: 12250.00,
    totalExpenses: 2670.49,
    otherIncome: 1120.00,
    netProfit: 10699.51,
    marginPercent: 57.99,
    operatingCashInflow: 19570.00,
    operatingCashOutflow: 8870.49,
    netCashFlow: 10699.51
  },
  searchQuery: '',
  selectedCategory: 'all',
  isLoading: false
});
