import { productsStore } from '../store/products.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Product Management Service
 * Handles Product CRUD, Categories, Barcodes, Pricing/GST calculations & CSV/Excel Import/Export.
 */
export class ProductsService {
  /**
   * Add New Product
   */
  async addProduct(productData) {
    productsStore.setState({ isLoading: true });

    const newProd = {
      id: `p-${Date.now()}`,
      name: productData.name,
      sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: productData.barcode || `890${Date.now().toString().slice(-10)}`,
      categoryId: productData.categoryId || 'cat-4',
      categoryName: productData.categoryName || 'Grocery',
      purchasePrice: parseFloat(productData.purchasePrice) || 0,
      sellingPrice: parseFloat(productData.sellingPrice) || 0,
      mrp: parseFloat(productData.mrp) || parseFloat(productData.sellingPrice) || 0,
      gstRate: parseFloat(productData.gstRate) || 0,
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      minStockLevel: parseInt(productData.minStockLevel) || 5,
      unit: productData.unit || 'pcs',
      variants: Array.isArray(productData.variants) ? productData.variants : (productData.variants ? productData.variants.split(',') : []),
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=60',
      isActive: true
    };

    const currentProds = productsStore.getState().products;
    productsStore.setState({ products: [newProd, ...currentProds], isLoading: false });

    // Database insertion
    await supabaseService.insert('products', {
      name: newProd.name,
      sku: newProd.sku,
      barcode: newProd.barcode,
      category_id: newProd.categoryId === 'cat-4' ? null : newProd.categoryId,
      cost_price: newProd.purchasePrice,
      selling_price: newProd.sellingPrice,
      stock_quantity: newProd.stockQuantity,
      min_stock_level: newProd.minStockLevel,
      unit: newProd.unit,
      image_url: newProd.imageUrl
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Product Added',
      message: `Product "${newProd.name}" added to catalog successfully!`
    });

    return { success: true, product: newProd };
  }

  /**
   * Update Product
   */
  async updateProduct(id, productData) {
    productsStore.setState({ isLoading: true });

    const currentProds = productsStore.getState().products;
    const updated = currentProds.map((p) => (p.id === id ? { ...p, ...productData } : p));

    productsStore.setState({ products: updated, isLoading: false });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Product Updated',
      message: `Product details saved successfully.`
    });
  }

  /**
   * Delete Product
   */
  async deleteProduct(id) {
    const currentProds = productsStore.getState().products;
    const filtered = currentProds.filter((p) => p.id !== id);

    productsStore.setState({ products: filtered });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Product Deleted',
      message: `Product removed from catalog.`
    });
  }

  /**
   * Add Category Taxonomy
   */
  addCategory(name) {
    const categories = productsStore.getState().categories;
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    };
    productsStore.setState({ categories: [...categories, newCat] });
  }

  /**
   * Parse CSV File & Bulk Import Products
   */
  importProductsFromCSV(csvText) {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return { success: false, count: 0 };

    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        this.addProduct({
          name: parts[0].trim(),
          sku: parts[1].trim(),
          sellingPrice: parts[2].trim(),
          stockQuantity: parts[3] ? parts[3].trim() : 10
        });
        importedCount++;
      }
    }

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'CSV Import Complete',
      message: `Successfully imported ${importedCount} products into catalog.`
    });

    return { success: true, count: importedCount };
  }

  /**
   * Export Products Catalog to CSV Downloader
   */
  exportProductsToCSV() {
    const { products } = productsStore.getState();
    const headers = ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'PurchasePrice', 'SellingPrice', 'MRP', 'GSTRate', 'Stock'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name}"`,
      p.sku,
      p.barcode,
      p.categoryName,
      p.purchasePrice,
      p.sellingPrice,
      p.mrp,
      p.gstRate,
      p.stockQuantity
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnipos_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const productsService = new ProductsService();
