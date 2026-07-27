import { Store } from '../core/store.js';

export const productsStore = new Store({
  products: [
    {
      id: 'p-101',
      name: 'Organic Whole Milk 1L',
      sku: 'MILK-001',
      barcode: '8901234567890',
      categoryId: 'cat-1',
      categoryName: 'Dairy',
      purchasePrice: 1.20,
      sellingPrice: 2.50,
      mrp: 2.80,
      gstRate: 5,
      stockQuantity: 24,
      minStockLevel: 10,
      unit: 'pcs',
      variants: ['1 Litre', 'Full Cream'],
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&auto=format&fit=crop&q=60',
      isActive: true
    },
    {
      id: 'p-102',
      name: 'Whole Wheat Bread 400g',
      sku: 'BREAD-002',
      barcode: '8901234567891',
      categoryId: 'cat-2',
      categoryName: 'Bakery',
      purchasePrice: 0.80,
      sellingPrice: 1.80,
      mrp: 2.00,
      gstRate: 0,
      stockQuantity: 15,
      minStockLevel: 8,
      unit: 'pcs',
      variants: ['Brown Wheat'],
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=60',
      isActive: true
    },
    {
      id: 'p-103',
      name: 'Arabica Coffee Beans 250g',
      sku: 'COFFEE-003',
      barcode: '8901234567892',
      categoryId: 'cat-3',
      categoryName: 'Beverages',
      purchasePrice: 5.50,
      sellingPrice: 12.00,
      mrp: 14.00,
      gstRate: 18,
      stockQuantity: 4,
      minStockLevel: 10,
      unit: 'pcs',
      variants: ['Medium Roast', 'Whole Bean'],
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&auto=format&fit=crop&q=60',
      isActive: true
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Dairy', slug: 'dairy' },
    { id: 'cat-2', name: 'Bakery', slug: 'bakery' },
    { id: 'cat-3', name: 'Beverages', slug: 'beverages' },
    { id: 'cat-4', name: 'Grocery', slug: 'grocery' }
  ],
  searchQuery: '',
  selectedCategory: 'all',
  selectedStockStatus: 'all', // all | instock | lowstock | outofstock
  currentPage: 1,
  pageSize: 10,
  selectedProduct: null,
  isLoading: false
});
