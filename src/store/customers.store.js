import { Store } from '../core/store.js';

export const customersStore = new Store({
  customers: [
    {
      id: 'c-101',
      name: 'Sarah Connor',
      phone: '+1 555-0192',
      email: 'sarah@skynet.com',
      address: '742 Evergreen Terrace',
      membershipTier: 'gold', // bronze | silver | gold | platinum
      walletBalance: 120.00,
      loyaltyPoints: 450,
      creditLimit: 500.00,
      outstandingCredit: 45.00,
      totalSpend: 1450.00,
      visitsCount: 18,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'c-102',
      name: 'John Doe',
      phone: '+1 555-0144',
      email: 'john@doe.com',
      address: '100 Main Street',
      membershipTier: 'silver',
      walletBalance: 35.50,
      loyaltyPoints: 290,
      creditLimit: 250.00,
      outstandingCredit: 0.00,
      totalSpend: 980.50,
      visitsCount: 12,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'c-103',
      name: 'Robert Paul',
      phone: '+1 555-0177',
      email: 'robert@paul.com',
      address: '12 Baker Street',
      membershipTier: 'bronze',
      walletBalance: 0.00,
      loyaltyPoints: 110,
      creditLimit: 100.00,
      outstandingCredit: 120.00,
      totalSpend: 720.00,
      visitsCount: 9,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60'
    }
  ],
  membershipTiers: {
    bronze: { name: 'Bronze Member', discountPercent: 0, minSpend: 0, color: 'var(--color-warning)' },
    silver: { name: 'Silver Member', discountPercent: 5, minSpend: 500, color: '#94a3b8' },
    gold: { name: 'Gold Member', discountPercent: 10, minSpend: 1000, color: '#f59e0b' },
    platinum: { name: 'Platinum Member', discountPercent: 15, minSpend: 2500, color: '#8b5cf6' }
  },
  purchaseHistory: [
    { invoiceNo: 'INV-2026-1087', customerId: 'c-101', total: '$128.40', date: '2026-07-27', itemsCount: 8, paymentMethod: 'card' },
    { invoiceNo: 'INV-2026-1052', customerId: 'c-101', total: '$45.00', date: '2026-07-20', itemsCount: 3, paymentMethod: 'wallet' },
    { invoiceNo: 'INV-2026-1089', customerId: 'c-102', total: '$45.50', date: '2026-07-27', itemsCount: 4, paymentMethod: 'upi' }
  ],
  walletTransactions: [
    { id: 'w-1', customerId: 'c-101', type: 'deposit', amount: 150.00, balanceAfter: 165.00, date: '2026-07-15', note: 'Prepaid Wallet Top-up' },
    { id: 'w-2', customerId: 'c-101', type: 'debit', amount: 45.00, balanceAfter: 120.00, date: '2026-07-20', note: 'Bill Payment INV-2026-1052' }
  ],
  searchQuery: '',
  selectedTier: 'all',
  crmAnalytics: {
    totalClv: 3150.50,
    avgOrderValue: 48.50,
    totalLoyaltyPointsGiven: 850
  },
  isLoading: false
});
