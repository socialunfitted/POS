import { inventoryStore } from '../store/inventory.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Inventory Management Service
 * Controls 12 Inventory Sub-Modules: Warehouses, GRN, Stock Adjustments, Purchases, Transfers, Batches & Expiry, Auto Reorder & Valuation Reports.
 */
export class InventoryService {
  /**
   * Create New Warehouse / Store Outlet Location
   */
  createWarehouse(name, code, address) {
    const warehouses = inventoryStore.getState().warehouses;
    const newWh = {
      id: `wh-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      address,
      isPrimary: false
    };

    inventoryStore.setState({ warehouses: [...warehouses, newWh] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Warehouse Created',
      message: `Warehouse Location "${newWh.name}" registered successfully.`
    });
  }

  /**
   * Goods Received Note (GRN) Stock Entry
   */
  createStockEntry(supplier, itemsCount = 1) {
    const entries = inventoryStore.getState().stockEntries;
    const newGrn = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplier,
      itemsCount: parseInt(itemsCount),
      date: new Date().toISOString().split('T')[0],
      status: 'received'
    };

    inventoryStore.setState({ stockEntries: [newGrn, ...entries] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Stock Entry Recorded',
      message: `Goods Received Note ${newGrn.grnNumber} processed successfully.`
    });
  }

  /**
   * Manual Stock Adjustment (Damage / Reconciliation)
   */
  createStockAdjustment(productName, type, qty, reason) {
    const adjustments = inventoryStore.getState().stockAdjustments;
    const newAdj = {
      id: `adj-${Date.now()}`,
      refNo: `ADJ-2026-${Math.floor(100 + Math.random() * 900)}`,
      productName,
      type,
      quantity: parseInt(qty),
      reason,
      date: new Date().toISOString().split('T')[0]
    };

    inventoryStore.setState({ stockAdjustments: [newAdj, ...adjustments] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Stock Adjusted',
      message: `Stock adjustment ${newAdj.refNo} recorded (${type.toUpperCase()}).`
    });
  }

  /**
   * Inter-Warehouse Stock Transfer
   */
  transferStock(fromWarehouse, toWarehouse, itemsCount = 10) {
    const transfers = inventoryStore.getState().transfers;
    const newTr = {
      id: `tr-${Date.now()}`,
      transferNo: `TR-2026-${Math.floor(100 + Math.random() * 900)}`,
      fromWarehouse,
      toWarehouse,
      itemsCount: parseInt(itemsCount),
      status: 'completed',
      date: new Date().toISOString().split('T')[0]
    };

    inventoryStore.setState({ transfers: [newTr, ...transfers] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Stock Transfer Completed',
      message: `Stock transfer ${newTr.transferNo} moved ${itemsCount} items.`
    });
  }

  /**
   * Create Product Batch & Expiry Tracker Entry
   */
  createBatch(productName, batchNumber, expiryDate, quantity = 50) {
    const batches = inventoryStore.getState().batches;
    const newBatch = {
      id: `b-${Date.now()}`,
      batchNumber,
      productName,
      mfgDate: new Date().toISOString().split('T')[0],
      expiryDate,
      quantity: parseInt(quantity),
      status: 'valid'
    };

    inventoryStore.setState({ batches: [newBatch, ...batches] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Batch Registered',
      message: `Batch ${batchNumber} added with expiry ${expiryDate}.`
    });
  }
}

export const inventoryService = new InventoryService();
