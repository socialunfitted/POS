import { customersStore } from '../store/customers.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Customer Management (CRM) Service
 * Manages Customer Profiles, Store Wallet, Loyalty Points, Credit Ledgers, SMS & WhatsApp Sharing.
 */
export class CustomersService {
  /**
   * Add New Customer Profile
   */
  async addCustomer(customerData) {
    customersStore.setState({ isLoading: true });

    const newCust = {
      id: `c-${Date.now()}`,
      name: customerData.name,
      phone: customerData.phone || '+1 555-0000',
      email: customerData.email || 'customer@client.com',
      address: customerData.address || 'Local Customer Address',
      membershipTier: customerData.membershipTier || 'bronze',
      walletBalance: parseFloat(customerData.walletBalance) || 0.0,
      loyaltyPoints: parseInt(customerData.loyaltyPoints) || 0,
      creditLimit: parseFloat(customerData.creditLimit) || 200.0,
      outstandingCredit: 0.0,
      totalSpend: 0.0,
      visitsCount: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    };

    const currentCusts = customersStore.getState().customers;
    customersStore.setState({ customers: [newCust, ...currentCusts], isLoading: false });

    // Database insertion
    await supabaseService.insert('customers', {
      name: newCust.name,
      phone: newCust.phone,
      email: newCust.email,
      address: newCust.address,
      credit_balance: newCust.outstandingCredit,
      loyalty_points: newCust.loyaltyPoints
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Customer Profile Created',
      message: `Customer "${newCust.name}" added to CRM system.`
    });

    return { success: true, customer: newCust };
  }

  /**
   * Update Customer Details
   */
  async updateCustomer(id, customerData) {
    const currentCusts = customersStore.getState().customers;
    const updated = currentCusts.map((c) => (c.id === id ? { ...c, ...customerData } : c));

    customersStore.setState({ customers: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Customer Updated',
      message: 'Customer profile updated successfully.'
    });
  }

  /**
   * Delete Customer Profile
   */
  async deleteCustomer(id) {
    const currentCusts = customersStore.getState().customers;
    const filtered = currentCusts.filter((c) => c.id !== id);

    customersStore.setState({ customers: filtered });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Customer Removed',
      message: 'Customer profile deleted from CRM.'
    });
  }

  /**
   * Deposit Funds into Store Wallet
   */
  addWalletBalance(customerId, amount) {
    const numAmount = parseFloat(amount) || 0;
    const customers = customersStore.getState().customers;

    const updated = customers.map((c) => {
      if (c.id === customerId) {
        const newBal = c.walletBalance + numAmount;
        return { ...c, walletBalance: newBal };
      }
      return c;
    });

    customersStore.setState({ customers: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Wallet Deposit Completed',
      message: `Deposited $${numAmount.toFixed(2)} into customer store wallet.`
    });
  }

  /**
   * Record Customer Store Credit Payment Collection
   */
  recordCreditPayment(customerId, amount) {
    const numAmount = parseFloat(amount) || 0;
    const customers = customersStore.getState().customers;

    const updated = customers.map((c) => {
      if (c.id === customerId) {
        const newOut = Math.max(0, c.outstandingCredit - numAmount);
        return { ...c, outstandingCredit: newOut };
      }
      return c;
    });

    customersStore.setState({ customers: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Credit Payment Collected',
      message: `Collected $${numAmount.toFixed(2)} toward customer outstanding balance.`
    });
  }

  /**
   * Redeem Loyalty Points
   */
  redeemLoyaltyPoints(customerId, pointsToRedeem) {
    const points = parseInt(pointsToRedeem) || 0;
    const customers = customersStore.getState().customers;

    const updated = customers.map((c) => {
      if (c.id === customerId) {
        const newPts = Math.max(0, c.loyaltyPoints - points);
        return { ...c, loyaltyPoints: newPts };
      }
      return c;
    });

    customersStore.setState({ customers: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Loyalty Points Redeemed',
      message: `Redeemed ${points} loyalty points for checkout bill discount.`
    });
  }

  /**
   * Generate WhatsApp Direct Receipt Sharing Link
   * @param {string} phone 
   * @param {string} invoiceNo 
   * @param {string} total 
   */
  generateWhatsAppInvoiceLink(phone, invoiceNo, total) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hello! Thank you for shopping with us. Your invoice receipt #${invoiceNo} for total ${total} has been processed successfully.`);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  }

  /**
   * Send SMS Notification Simulation
   */
  sendSMSNotification(phone, message) {
    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'SMS Sent',
      message: `SMS sent to ${phone}: "${message}"`
    });
  }
}

export const customersService = new CustomersService();
