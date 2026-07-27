import { Store } from '../core/store.js';

export const employeesStore = new Store({
  employees: [
    {
      id: 'emp-101',
      name: 'Alex Mercer',
      role: 'manager',
      email: 'alex@omnipos.com',
      phone: '+1 555-0101',
      pin: '1234',
      shiftId: 'shift-morning',
      shiftName: 'Morning Shift (08:00 - 16:00)',
      baseSalary: 3500.00,
      payCycle: 'monthly',
      commissionRate: 2.0, // 2% on sales
      earnedCommission: 240.50,
      salesTotal: 12025.00,
      ordersCount: 142,
      status: 'active',
      isClockedIn: true,
      clockInTime: '08:02 AM',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'emp-102',
      name: 'David Miller',
      role: 'cashier',
      email: 'david@omnipos.com',
      phone: '+1 555-0102',
      pin: '5678',
      shiftId: 'shift-morning',
      shiftName: 'Morning Shift (08:00 - 16:00)',
      baseSalary: 2400.00,
      payCycle: 'monthly',
      commissionRate: 1.5, // 1.5% on sales
      earnedCommission: 142.00,
      salesTotal: 9466.00,
      ordersCount: 118,
      status: 'active',
      isClockedIn: true,
      clockInTime: '08:15 AM',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'emp-103',
      name: 'Emily Watson',
      role: 'cashier',
      email: 'emily@omnipos.com',
      phone: '+1 555-0103',
      pin: '9988',
      shiftId: 'shift-evening',
      shiftName: 'Evening Shift (14:00 - 22:00)',
      baseSalary: 2400.00,
      payCycle: 'monthly',
      commissionRate: 1.5,
      earnedCommission: 98.00,
      salesTotal: 6533.00,
      ordersCount: 84,
      status: 'active',
      isClockedIn: false,
      clockInTime: null,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60'
    }
  ],
  shifts: [
    { id: 'shift-morning', name: 'Morning Shift', startTime: '08:00', endTime: '16:00', totalHours: 8 },
    { id: 'shift-evening', name: 'Evening Shift', startTime: '14:00', endTime: '22:00', totalHours: 8 },
    { id: 'shift-night', name: 'Night Shift', startTime: '22:00', endTime: '06:00', totalHours: 8 }
  ],
  attendanceLogs: [
    { id: 'att-1', employeeId: 'emp-101', employeeName: 'Alex Mercer', date: '2026-07-27', clockIn: '08:02 AM', clockOut: 'In Session', duration: '5h 40m', status: 'present' },
    { id: 'att-2', employeeId: 'emp-102', employeeName: 'David Miller', date: '2026-07-27', clockIn: '08:15 AM', clockOut: 'In Session', duration: '5h 27m', status: 'late' },
    { id: 'att-3', employeeId: 'emp-103', employeeName: 'Emily Watson', date: '2026-07-26', clockIn: '02:00 PM', clockOut: '10:05 PM', duration: '8h 05m', status: 'present' }
  ],
  rolePermissions: {
    owner: { posBilling: true, applyDiscounts: true, voidItems: true, editInventory: true, viewReports: true, manageSettings: true },
    admin: { posBilling: true, applyDiscounts: true, voidItems: true, editInventory: true, viewReports: true, manageSettings: false },
    manager: { posBilling: true, applyDiscounts: true, voidItems: true, editInventory: true, viewReports: true, manageSettings: false },
    cashier: { posBilling: true, applyDiscounts: false, voidItems: false, editInventory: false, viewReports: false, manageSettings: false }
  },
  activityLogs: [
    { id: 'log-1', timestamp: '2026-07-27 08:02 AM', employeeName: 'Alex Mercer', action: 'CLOCK_IN', details: 'Clocked in for Morning Shift' },
    { id: 'log-2', timestamp: '2026-07-27 09:30 AM', employeeName: 'David Miller', action: 'POS_SALE', details: 'Completed bill #INV-2026-1089 ($45.50)' },
    { id: 'log-3', timestamp: '2026-07-27 10:15 AM', employeeName: 'Alex Mercer', action: 'INVENTORY_EDIT', details: 'Adjusted stock for SKU MILK-001 (-2)' }
  ],
  hrAnalytics: {
    activeStaffOnDuty: 2,
    totalStaff: 3,
    attendanceRate: 87.5,
    totalPayrollMonthly: 8300.00,
    totalCommissionPaid: 480.50
  },
  searchQuery: '',
  selectedRole: 'all',
  isLoading: false
});
