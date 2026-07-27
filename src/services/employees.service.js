import { employeesStore } from '../store/employees.store.js';
import { supabaseService } from './supabase.service.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Employee Management & HR Service
 * Manages Staff Directory, Attendance, Clock In/Out Terminal, Shifts, Salary/Commissions & RBAC Permissions.
 */
export class EmployeesService {
  /**
   * Add New Employee Profile
   */
  async addEmployee(data) {
    employeesStore.setState({ isLoading: true });

    const newEmp = {
      id: `emp-${Date.now()}`,
      name: data.name,
      role: data.role || 'cashier',
      email: data.email || 'staff@omnipos.com',
      phone: data.phone || '+1 555-0000',
      pin: data.pin || '1234',
      shiftId: data.shiftId || 'shift-morning',
      shiftName: data.shiftName || 'Morning Shift (08:00 - 16:00)',
      baseSalary: parseFloat(data.baseSalary) || 2400.00,
      payCycle: data.payCycle || 'monthly',
      commissionRate: parseFloat(data.commissionRate) || 1.5,
      earnedCommission: 0.0,
      salesTotal: 0.0,
      ordersCount: 0,
      status: 'active',
      isClockedIn: false,
      clockInTime: null,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    };

    const current = employeesStore.getState().employees;
    employeesStore.setState({ employees: [newEmp, ...current], isLoading: false });

    // Database insertion
    await supabaseService.insert('employees', {
      name: newEmp.name,
      role: newEmp.role,
      phone: newEmp.phone,
      email: newEmp.email,
      pin_code: newEmp.pin
    });

    this.logActivity(newEmp.name, 'STAFF_ADDED', `New employee profile created (${newEmp.role})`);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Employee Registered',
      message: `Staff member "${newEmp.name}" added to HR database.`
    });

    return { success: true, employee: newEmp };
  }

  /**
   * Update Employee Profile
   */
  async updateEmployee(id, data) {
    const current = employeesStore.getState().employees;
    const updated = current.map((e) => (e.id === id ? { ...e, ...data } : e));

    employeesStore.setState({ employees: updated });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Employee Updated',
      message: 'Staff profile changes saved.'
    });
  }

  /**
   * Delete Employee Profile
   */
  async deleteEmployee(id) {
    const current = employeesStore.getState().employees;
    const filtered = current.filter((e) => e.id !== id);

    employeesStore.setState({ employees: filtered });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'warning',
      title: 'Employee Removed',
      message: 'Staff profile removed from system.'
    });
  }

  /**
   * Clock In Terminal Time Logger
   */
  clockIn(employeeId, pin) {
    const employees = employeesStore.getState().employees;
    const emp = employees.find((e) => e.id === employeeId);

    if (!emp) return { success: false, message: 'Employee not found' };
    if (emp.pin !== pin) return { success: false, message: 'Invalid PIN code' };
    if (emp.isClockedIn) return { success: false, message: 'Already clocked in' };

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = employees.map((e) => (e.id === employeeId ? { ...e, isClockedIn: true, clockInTime: timeStr } : e));

    const logs = employeesStore.getState().attendanceLogs;
    const newLog = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: emp.name,
      date: new Date().toISOString().split('T')[0],
      clockIn: timeStr,
      clockOut: 'In Session',
      duration: '0h 01m',
      status: 'present'
    };

    employeesStore.setState({ employees: updated, attendanceLogs: [newLog, ...logs] });
    this.logActivity(emp.name, 'CLOCK_IN', `Clocked in at ${timeStr}`);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Clock In Successful',
      message: `${emp.name} clocked in at ${timeStr}.`
    });

    return { success: true };
  }

  /**
   * Clock Out Terminal Time Logger
   */
  clockOut(employeeId) {
    const employees = employeesStore.getState().employees;
    const emp = employees.find((e) => e.id === employeeId);

    if (!emp || !emp.isClockedIn) return { success: false, message: 'Employee not currently clocked in' };

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = employees.map((e) => (e.id === employeeId ? { ...e, isClockedIn: false, clockInTime: null } : e));

    const logs = employeesStore.getState().attendanceLogs;
    const updatedLogs = logs.map((l) => (l.employeeId === employeeId && l.clockOut === 'In Session' ? { ...l, clockOut: timeStr, duration: '8h 00m' } : l));

    employeesStore.setState({ employees: updated, attendanceLogs: updatedLogs });
    this.logActivity(emp.name, 'CLOCK_OUT', `Clocked out at ${timeStr}`);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Clock Out Successful',
      message: `${emp.name} clocked out at ${timeStr}.`
    });

    return { success: true };
  }

  /**
   * Update RBAC Permissions Matrix
   */
  updateRolePermissions(role, permissions) {
    const matrix = employeesStore.getState().rolePermissions;
    const updatedMatrix = { ...matrix, [role]: permissions };

    employeesStore.setState({ rolePermissions: updatedMatrix });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Permissions Matrix Saved',
      message: `Role permissions for "${role.toUpperCase()}" updated successfully.`
    });
  }

  /**
   * Log Staff Activity into Audit Trail
   */
  logActivity(employeeName, action, details) {
    const logs = employeesStore.getState().activityLogs;
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      employeeName,
      action,
      details
    };
    employeesStore.setState({ activityLogs: [newLog, ...logs] });
  }

  /**
   * Export Staff Roster to CSV
   */
  exportEmployeesToCSV() {
    const { employees } = employeesStore.getState();
    const headers = ['ID', 'Name', 'Role', 'Email', 'Phone', 'Shift', 'Base Salary', 'Commission Rate %', 'Total Sales'];
    const rows = employees.map((e) => [
      e.id,
      `"${e.name}"`,
      e.role,
      e.email,
      e.phone,
      `"${e.shiftName}"`,
      e.baseSalary.toFixed(2),
      e.commissionRate,
      e.salesTotal.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `omnipos_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const employeesService = new EmployeesService();
