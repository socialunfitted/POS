import { employeesStore } from '../store/employees.store.js';
import { employeesService } from '../services/employees.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function EmployeesView() {
  const container = document.createElement('div');
  container.className = 'employees-view flex flex-col gap-6';

  let activeTab = 'performance'; // performance | roster | attendance | shifts | salary | permissions | activity

  // Top HR KPI Strip
  const renderKpiStrip = () => {
    const { hrAnalytics } = employeesStore.getState();
    const strip = document.createElement('div');
    strip.className = 'grid grid-cols-4 gap-4';

    strip.innerHTML = `
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Active Staff On Duty</div>
        <div class="font-bold text-2xl text-primary">${hrAnalytics.activeStaffOnDuty} / ${hrAnalytics.totalStaff}</div>
        <div class="text-xs text-success mt-1">Clocked In Sessions</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Today Attendance Rate</div>
        <div class="font-bold text-2xl text-success">${hrAnalytics.attendanceRate}%</div>
        <div class="text-xs text-secondary mt-1">On-time Attendance</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Monthly Payroll Total</div>
        <div class="font-bold text-2xl text-info">$${hrAnalytics.totalPayrollMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-secondary mt-1">Base Salary Budget</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Commissions Earned</div>
        <div class="font-bold text-2xl text-warning">$${hrAnalytics.totalCommissionPaid.toFixed(2)}</div>
        <div class="text-xs text-secondary mt-1">Staff Sales Incentives</div>
      </div>
    `;

    return strip;
  };

  container.appendChild(renderKpiStrip());

  // Sub-Module Navigation Tabs
  const navCard = document.createElement('div');
  navCard.className = 'card p-3 bg-secondary overflow-x-auto';
  const navFlex = document.createElement('div');
  navFlex.className = 'flex gap-2 flex-nowrap';

  const contentArea = document.createElement('div');
  contentArea.className = 'employees-module-content flex flex-col gap-6';

  const tabs = [
    { id: 'performance', label: '📊 Staff Performance Dashboard' },
    { id: 'roster', label: '👥 Employee Roster' },
    { id: 'attendance', label: '⏱️ Attendance & Time Clock' },
    { id: 'shifts', label: '📅 Shift Schedules' },
    { id: 'salary', label: '💰 Salary & Commissions' },
    { id: 'permissions', label: '🛡️ Role Permissions (RBAC)' },
    { id: 'activity', label: '📜 Activity Audit Logs' }
  ];

  const renderTabs = () => {
    navFlex.innerHTML = '';
    tabs.forEach((tab) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${tab.id === activeTab ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeTab = tab.id;
        renderTabs();
        renderActiveTabContent();
      });
      navFlex.appendChild(btn);
    });
  };

  navCard.appendChild(navFlex);
  container.appendChild(navCard);
  container.appendChild(contentArea);

  // Render Active Sub-Module
  const renderActiveTabContent = () => {
    contentArea.innerHTML = '';

    switch (activeTab) {
      case 'performance':
        contentArea.appendChild(renderPerformanceModule());
        break;
      case 'roster':
        contentArea.appendChild(renderRosterModule());
        break;
      case 'attendance':
        contentArea.appendChild(renderAttendanceModule());
        break;
      case 'shifts':
        contentArea.appendChild(renderShiftsModule());
        break;
      case 'salary':
        contentArea.appendChild(renderSalaryModule());
        break;
      case 'permissions':
        contentArea.appendChild(renderPermissionsModule());
        break;
      case 'activity':
        contentArea.appendChild(renderActivityModule());
        break;
      default:
        contentArea.appendChild(renderPerformanceModule());
    }
  };

  // 1. Staff Performance Leaderboard Dashboard
  const renderPerformanceModule = () => {
    const { employees } = employeesStore.getState();
    const sorted = [...employees].sort((a, b) => b.salesTotal - a.salesTotal);

    const card = new CardComponent({
      title: '🏆 Employee Sales Leaderboard & Performance Dashboard',
      subtitle: 'Rankings by POS sales volume, order count, and earned commissions',
      content: `<div id="perf-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        {
          key: 'rank',
          title: 'Rank',
          render: (_, __, idx) => `<span class="badge ${idx === 0 ? 'badge-primary' : 'badge-secondary'}">#${idx + 1}</span>`
        },
        {
          key: 'avatarUrl',
          title: 'Staff',
          render: (val, row) => `<div class="flex items-center gap-2"><img src="${val}" width="32" height="32" style="border-radius:50%;" /><strong>${row.name}</strong></div>`
        },
        { key: 'role', title: 'Role', render: (val) => `<span class="badge badge-secondary">${val.toUpperCase()}</span>` },
        { key: 'ordersCount', title: 'Completed Bills', render: (val) => `<strong class="text-primary">${val} bills</strong>` },
        { key: 'salesTotal', title: 'Total POS Sales', render: (val) => `<strong class="text-success">$${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>` },
        { key: 'commissionRate', title: 'Commission %', render: (val) => `<span class="badge badge-warning">${val}%</span>` },
        { key: 'earnedCommission', title: 'Earned Commission', render: (val) => `<strong class="text-warning">$${parseFloat(val).toFixed(2)}</strong>` }
      ],
      data: sorted
    }).render();

    card.querySelector('#perf-table').appendChild(table);
    return card;
  };

  // 2. Employee Roster Module
  const renderRosterModule = () => {
    const { employees } = employeesStore.getState();
    const card = new CardComponent({
      title: '👥 Employee Roster & Staff Profiles',
      subtitle: 'Manage team directory, PIN codes, roles & shift assignments',
      content: `
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-2">
            <button id="add-emp-btn" class="btn btn-primary btn-sm">➕ Add Employee</button>
            <button id="export-emp-csv-btn" class="btn btn-secondary btn-sm">📥 Export Roster CSV</button>
          </div>
          <span class="text-xs text-secondary">Total Staff: ${employees.length}</span>
        </div>
        <div id="roster-table"></div>
      `
    }).render();

    card.querySelector('#add-emp-btn').addEventListener('click', () => openEmployeeModal());
    card.querySelector('#export-emp-csv-btn').addEventListener('click', () => employeesService.exportEmployeesToCSV());

    const table = new TableComponent({
      columns: [
        {
          key: 'avatarUrl',
          title: 'Employee Name',
          render: (val, row) => `<div class="flex items-center gap-2"><img src="${val}" width="32" height="32" style="border-radius:50%;" /><div><strong>${row.name}</strong><br/><span class="text-xs text-muted">${row.email}</span></div></div>`
        },
        { key: 'role', title: 'Role', render: (val) => `<span class="badge badge-primary">${val.toUpperCase()}</span>` },
        { key: 'phone', title: 'Phone' },
        { key: 'pin', title: 'PIN Code', render: (val) => `<code class="font-mono text-xs text-primary">**** (${val})</code>` },
        { key: 'shiftName', title: 'Assigned Shift', render: (val) => `<span class="badge badge-secondary">${val}</span>` },
        {
          key: 'isClockedIn',
          title: 'Duty Status',
          render: (val, row) => val ? `<span class="badge badge-success">ON DUTY (${row.clockInTime})</span>` : `<span class="badge badge-secondary">OFF DUTY</span>`
        },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const btn = new ButtonComponent({
              text: '🗑️',
              variant: 'danger',
              size: 'sm',
              onClick: () => {
                employeesService.deleteEmployee(row.id);
                renderActiveTabContent();
              }
            }).render();
            return btn;
          }
        }
      ],
      data: employees
    }).render();

    card.querySelector('#roster-table').appendChild(table);
    return card;
  };

  // Add Employee Modal Builder
  const openEmployeeModal = () => {
    let name = '';
    let role = 'cashier';
    let email = '';
    let phone = '';
    let pin = '1234';
    let baseSalary = 2400.0;
    let commissionRate = 1.5;

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    content.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <div id="emp-name-in"></div>
        <div id="emp-email-in"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div id="emp-phone-in"></div>
        <div id="emp-pin-in"></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="input-group">
          <label class="input-label">Role</label>
          <select class="select-field" id="emp-role-select">
            <option value="manager">Manager</option>
            <option value="cashier" selected>Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div id="emp-salary-in"></div>
        <div id="emp-comm-in"></div>
      </div>
      <div id="save-emp-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({ title: '➕ Register New Employee', content });
    modal.open();

    const nameInput = new InputComponent({ label: 'Full Name', placeholder: 'e.g. John Smith', onChange: (v) => { name = v; } }).render();
    const emailInput = new InputComponent({ label: 'Email Address', placeholder: 'john@omnipos.com', onChange: (v) => { email = v; } }).render();
    const phoneInput = new InputComponent({ label: 'Phone Number', placeholder: '+1 555-0100', onChange: (v) => { phone = v; } }).render();
    const pinInput = new InputComponent({ label: '4-Digit PIN Code', placeholder: '1234', onChange: (v) => { pin = v; } }).render();
    const salaryInput = new InputComponent({ label: 'Base Monthly Salary ($)', type: 'number', value: baseSalary, onChange: (v) => { baseSalary = v; } }).render();
    const commInput = new InputComponent({ label: 'Commission Rate (%)', type: 'number', value: commissionRate, onChange: (v) => { commissionRate = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Register Employee',
      variant: 'primary',
      onClick: async () => {
        if (name) {
          const roleSelect = content.querySelector('#emp-role-select');
          role = roleSelect.value;
          await employeesService.addEmployee({ name, role, email, phone, pin, baseSalary, commissionRate });
          modal.close();
          renderActiveTabContent();
        }
      }
    }).render();

    content.querySelector('#emp-name-in').appendChild(nameInput);
    content.querySelector('#emp-email-in').appendChild(emailInput);
    content.querySelector('#emp-phone-in').appendChild(phoneInput);
    content.querySelector('#emp-pin-in').appendChild(pinInput);
    content.querySelector('#emp-salary-in').appendChild(salaryInput);
    content.querySelector('#emp-comm-in').appendChild(commInput);
    content.querySelector('#save-emp-btn').appendChild(btn);
  };

  // 3. Attendance & Time Clock Terminal Module
  const renderAttendanceModule = () => {
    const { attendanceLogs, employees } = employeesStore.getState();
    const card = new CardComponent({
      title: '⏱️ Staff Attendance & Time Clock Terminal',
      subtitle: 'Real-time clock in / clock out logs and session duration computation',
      content: `
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-secondary">Today Attendance Records: ${attendanceLogs.length}</span>
          <button id="clock-terminal-btn" class="btn btn-primary btn-sm">⏱️ Time Clock Terminal</button>
        </div>
        <div id="att-table"></div>
      `
    }).render();

    card.querySelector('#clock-terminal-btn').addEventListener('click', () => openClockTerminalModal());

    const table = new TableComponent({
      columns: [
        { key: 'date', title: 'Date' },
        { key: 'employeeName', title: 'Employee Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'clockIn', title: 'Clock In Time', render: (val) => `<span class="badge badge-success">${val}</span>` },
        { key: 'clockOut', title: 'Clock Out Time', render: (val) => val === 'In Session' ? `<span class="badge badge-warning">IN SESSION</span>` : `<span class="badge badge-secondary">${val}</span>` },
        { key: 'duration', title: 'Work Duration', render: (val) => `<code class="font-mono text-primary">${val}</code>` },
        { key: 'status', title: 'Attendance Status', render: (val) => `<span class="badge ${val === 'present' ? 'badge-success' : 'badge-warning'}">${val.toUpperCase()}</span>` }
      ],
      data: attendanceLogs
    }).render();

    card.querySelector('#att-table').appendChild(table);
    return card;
  };

  // Time Clock Terminal Modal Builder
  const openClockTerminalModal = () => {
    const { employees } = employeesStore.getState();
    let selectedEmpId = employees[0]?.id || '';
    let pinCode = '';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4 text-xs text-center';

    content.innerHTML = `
      <div class="p-3 bg-tertiary rounded">
        <span class="text-secondary text-xs">Select Employee & Enter 4-Digit Staff PIN Code to Clock In / Out</span>
      </div>
      <div class="input-group text-left">
        <label class="input-label">Select Staff Member</label>
        <select class="select-field" id="clock-emp-select">
          ${employees.map((e) => `<option value="${e.id}">${e.name} (${e.isClockedIn ? 'ON DUTY' : 'OFF DUTY'})</option>`).join('')}
        </select>
      </div>
      <div id="clock-pin-in" class="text-left"></div>
      <div class="flex gap-2 justify-center mt-2">
        <button id="do-clock-in-btn" class="btn btn-primary flex-1">🟢 Clock In</button>
        <button id="do-clock-out-btn" class="btn btn-secondary flex-1">🔴 Clock Out</button>
      </div>
    `;

    const modal = new ModalComponent({ title: '⏱️ Staff Time Clock Terminal', content });
    modal.open();

    const pinInput = new InputComponent({ label: 'PIN Code', type: 'password', placeholder: '****', onChange: (v) => { pinCode = v; } }).render();
    content.querySelector('#clock-pin-in').appendChild(pinInput);

    content.querySelector('#clock-emp-select').addEventListener('change', (e) => { selectedEmpId = e.target.value; });

    content.querySelector('#do-clock-in-btn').addEventListener('click', () => {
      const res = employeesService.clockIn(selectedEmpId, pinCode);
      if (res.success) {
        modal.close();
        renderActiveTabContent();
      }
    });

    content.querySelector('#do-clock-out-btn').addEventListener('click', () => {
      const res = employeesService.clockOut(selectedEmpId);
      if (res.success) {
        modal.close();
        renderActiveTabContent();
      }
    });
  };

  // 4. Shift Schedules Module
  const renderShiftsModule = () => {
    const { shifts } = employeesStore.getState();
    const card = new CardComponent({
      title: '📅 Shift Schedule Definitions',
      subtitle: 'Define store shift timings and work hours',
      content: `<div id="shift-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'name', title: 'Shift Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'startTime', title: 'Start Time', render: (val) => `<span class="badge badge-primary">${val}</span>` },
        { key: 'endTime', title: 'End Time', render: (val) => `<span class="badge badge-secondary">${val}</span>` },
        { key: 'totalHours', title: 'Shift Duration', render: (val) => `<code class="font-mono text-primary">${val} Hours</code>` }
      ],
      data: shifts
    }).render();

    card.querySelector('#shift-table').appendChild(table);
    return card;
  };

  // 5. Salary & Commissions Module
  const renderSalaryModule = () => {
    const { employees } = employeesStore.getState();
    const card = new CardComponent({
      title: '💰 Base Salary & Sales Commissions Payouts',
      subtitle: 'Employee payroll budget and earned sales commission incentives',
      content: `<div id="salary-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'name', title: 'Employee Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'role', title: 'Role', render: (val) => `<span class="badge badge-secondary">${val.toUpperCase()}</span>` },
        { key: 'baseSalary', title: 'Base Salary ($)', render: (val) => `<strong class="text-primary">$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'salesTotal', title: 'Sales Total ($)', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'commissionRate', title: 'Commission Rate', render: (val) => `<span class="badge badge-warning">${val}%</span>` },
        { key: 'earnedCommission', title: 'Earned Commission', render: (val) => `<strong class="text-warning">+$${parseFloat(val).toFixed(2)}</strong>` },
        {
          key: 'totalPayout',
          title: 'Total Pay',
          render: (_, row) => `<strong class="text-success">$${(row.baseSalary + row.earnedCommission).toFixed(2)}</strong>`
        }
      ],
      data: employees
    }).render();

    card.querySelector('#salary-table').appendChild(table);
    return card;
  };

  // 6. Role Permissions (RBAC) Module
  const renderPermissionsModule = () => {
    const { rolePermissions } = employeesStore.getState();
    const roles = ['owner', 'admin', 'manager', 'cashier'];

    const card = new CardComponent({
      title: '🛡️ Role-Based Access Control (RBAC) Permissions Matrix',
      subtitle: 'Configure module access and authorization rights per role',
      content: `
        <div class="flex flex-col gap-4 mt-2">
          ${roles.map((r) => `
            <div class="card p-3 bg-tertiary">
              <div class="font-bold text-sm text-primary mb-2 uppercase">${r} ROLE PERMISSIONS</div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                ${Object.entries(rolePermissions[r] || {}).map(([perm, val]) => `
                  <div class="flex items-center gap-2">
                    <input type="checkbox" ${val ? 'checked' : ''} disabled />
                    <span>${perm}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `
    }).render();

    return card;
  };

  // 7. Activity Audit Logs Module
  const renderActivityModule = () => {
    const { activityLogs } = employeesStore.getState();
    const card = new CardComponent({
      title: '📜 Staff Security Activity Audit Logs',
      subtitle: 'Audit trail of staff operations and system events',
      content: `<div id="activity-table"></div>`
    }).render();

    const table = new TableComponent({
      columns: [
        { key: 'timestamp', title: 'Timestamp', render: (val) => `<code class="font-mono text-xs text-muted">${val}</code>` },
        { key: 'employeeName', title: 'Staff Member', render: (val) => `<strong>${val}</strong>` },
        { key: 'action', title: 'Action', render: (val) => `<span class="badge badge-primary">${val}</span>` },
        { key: 'details', title: 'Details' }
      ],
      data: activityLogs
    }).render();

    card.querySelector('#activity-table').appendChild(table);
    return card;
  };

  renderTabs();
  renderActiveTabContent();
  return container;
}
