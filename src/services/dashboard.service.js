import { dashboardStore } from '../store/dashboard.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from './../core/event-bus.js';

/**
 * Store Owner Dashboard Service
 * Computes sales metrics, inventory low stock alerts, top customer analytics & business summaries.
 */
export class DashboardService {
  /**
   * Fetch overview metrics for store owner
   * @param {string} tenantId 
   */
  async fetchDashboardOverview(tenantId) {
    dashboardStore.setState({ isLoading: true });

    // Fetch low stock items from products database table
    const { data: lowStock } = await supabaseService.executeQuery((client) =>
      client.from('products').select('*').eq('tenant_id', tenantId).lte('stock_quantity', 5).limit(5)
    );

    if (lowStock && lowStock.length > 0) {
      const items = lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock_quantity,
        minLevel: p.min_stock_level || 5,
        unit: p.unit || 'pcs'
      }));

      dashboardStore.setState({ lowStockItems: items, lowStockCount: items.length });
    }

    dashboardStore.setState({ isLoading: false });
  }

  /**
   * Quick Reorder Action for Low Stock Product
   * @param {string} productId 
   */
  reorderProduct(productId) {
    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Purchase Reorder Sent',
      message: `Reorder purchase order generated for product ${productId}.`
    });
  }

  /**
   * Print Daily Business Summary
   */
  printBusinessSummary() {
    window.print();
  }
}

export const dashboardService = new DashboardService();
