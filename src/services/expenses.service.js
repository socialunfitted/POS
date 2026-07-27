import { expensesStore } from '../store/expenses.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Expense & Financial Accounting Service
 * Handles Operating Expenses, Non-POS Operating Income, Recurring Expenses, P&L & Cash Flow Statements.
 */
export class ExpensesService {
  /**
   * Add New Expense Entry
   */
  async addExpense(expenseData) {
    expensesStore.setState({ isLoading: true });

    const newExp = {
      id: `exp-${Date.now()}`,
      title: expenseData.title,
      categoryId: expenseData.categoryId || 'cat-util',
      categoryName: expenseData.categoryName || 'Utilities',
      amount: parseFloat(expenseData.amount) || 0.0,
      paymentMethod: expenseData.paymentMethod || 'cash',
      referenceNo: expenseData.referenceNo || `EXP-REF-${Date.now().toString().slice(-6)}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: expenseData.notes || ''
    };

    const currentExps = expensesStore.getState().expenses;
    expensesStore.setState({ expenses: [newExp, ...currentExps], isLoading: false });

    // Recalculate financial summary
    this.recalculateFinancials();

    // Database insertion
    await supabaseService.insert('expenses', {
      title: newExp.title,
      amount: newExp.amount,
      category: newExp.categoryName,
      payment_method: newExp.paymentMethod,
      reference_no: newExp.referenceNo
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Expense Logged',
      message: `Expense "${newExp.title}" of $${newExp.amount.toFixed(2)} recorded.`
    });

    return { success: true, expense: newExp };
  }

  /**
   * Delete Expense Entry
   */
  async deleteExpense(id) {
    const currentExps = expensesStore.getState().expenses;
    const filtered = currentExps.filter((e) => e.id !== id);

    expensesStore.setState({ expenses: filtered });
    this.recalculateFinancials();

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Expense Removed',
      message: 'Expense entry deleted from financial ledger.'
    });
  }

  /**
   * Add Non-POS Operating Income Entry
   */
  addIncome(incomeData) {
    const newInc = {
      id: `inc-${Date.now()}`,
      title: incomeData.title,
      source: incomeData.source || 'Other Income',
      amount: parseFloat(incomeData.amount) || 0.0,
      paymentMethod: incomeData.paymentMethod || 'bank_transfer',
      referenceNo: incomeData.referenceNo || `INC-REF-${Date.now().toString().slice(-6)}`,
      date: incomeData.date || new Date().toISOString().split('T')[0],
      notes: incomeData.notes || ''
    };

    const currentIncs = expensesStore.getState().incomes;
    expensesStore.setState({ incomes: [newInc, ...currentIncs] });
    this.recalculateFinancials();

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Income Logged',
      message: `Income "${newInc.title}" of $${newInc.amount.toFixed(2)} recorded.`
    });
  }

  /**
   * Delete Income Entry
   */
  deleteIncome(id) {
    const currentIncs = expensesStore.getState().incomes;
    const filtered = currentIncs.filter((i) => i.id !== id);

    expensesStore.setState({ incomes: filtered });
    this.recalculateFinancials();

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Income Removed',
      message: 'Income entry deleted.'
    });
  }

  /**
   * Register Automated Recurring Expense Schedule
   */
  createRecurringExpense(data) {
    const newRec = {
      id: `rec-${Date.now()}`,
      title: data.title,
      categoryName: data.categoryName || 'Utilities',
      amount: parseFloat(data.amount) || 0.0,
      frequency: data.frequency || 'monthly',
      nextDueDate: data.nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      autoProcess: true
    };

    const recurring = expensesStore.getState().recurringExpenses;
    expensesStore.setState({ recurringExpenses: [...recurring, newRec] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Recurring Schedule Set',
      message: `Automated recurring expense "${newRec.title}" scheduled (${newRec.frequency}).`
    });
  }

  /**
   * Add Expense Category
   */
  addCategory(name, color = '#6366f1') {
    const categories = expensesStore.getState().categories;
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      color
    };
    expensesStore.setState({ categories: [...categories, newCat] });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Expense Category Added',
      message: `Category "${name}" created.`
    });
  }

  /**
   * Recalculate P&L & Cash Flow Statements
   */
  recalculateFinancials() {
    const { expenses, incomes, financialSummary } = expensesStore.getState();

    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOtherInc = incomes.reduce((sum, i) => sum + i.amount, 0);

    const grossRevenue = financialSummary.grossRevenue;
    const cogs = financialSummary.cogs;
    const grossProfit = grossRevenue - cogs;
    const netProfit = grossProfit - totalExp + totalOtherInc;
    const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    const operatingCashInflow = grossRevenue + totalOtherInc;
    const operatingCashOutflow = cogs + totalExp;
    const netCashFlow = operatingCashInflow - operatingCashOutflow;

    expensesStore.setState({
      financialSummary: {
        ...financialSummary,
        totalExpenses: totalExp,
        otherIncome: totalOtherInc,
        grossProfit,
        netProfit,
        marginPercent: parseFloat(marginPercent.toFixed(2)),
        operatingCashInflow,
        operatingCashOutflow,
        netCashFlow
      }
    });
  }

  /**
   * Export Expenses & Income to CSV File Downloader
   */
  exportFinancialsToCSV() {
    const { expenses, incomes } = expensesStore.getState();

    const headers = ['Type', 'ID', 'Title', 'Category / Source', 'Amount', 'Payment Method', 'Reference No', 'Date'];

    const expRows = expenses.map((e) => ['Expense', e.id, `"${e.title}"`, `"${e.categoryName}"`, e.amount.toFixed(2), e.paymentMethod, e.referenceNo, e.date]);
    const incRows = incomes.map((i) => ['Income', i.id, `"${i.title}"`, `"${i.source}"`, i.amount.toFixed(2), i.paymentMethod, i.referenceNo, i.date]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...expRows.map((r) => r.join(',')), ...incRows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `omnipos_financials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const expensesService = new ExpensesService();
