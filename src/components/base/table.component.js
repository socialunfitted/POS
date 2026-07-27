/**
 * Reusable Data Table Component
 */
export class TableComponent {
  /**
   * @param {Object} props - { columns: [{key, title, render}], data: [] }
   */
  constructor(props = {}) {
    this.props = {
      columns: [],
      data: [],
      ...props
    };
  }

  render() {
    const table = document.createElement('table');
    table.className = 'w-full text-sm';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid var(--color-border)';

    this.props.columns.forEach((col) => {
      const th = document.createElement('th');
      th.className = 'p-3 text-left font-semibold text-secondary';
      th.textContent = col.title;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    if (!this.props.data || this.props.data.length === 0) {
      const emptyRow = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this.props.columns.length;
      td.className = 'p-6 text-center text-muted';
      td.textContent = 'No record data available.';
      emptyRow.appendChild(td);
      tbody.appendChild(emptyRow);
    } else {
      this.props.data.forEach((row) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--color-border)';

        this.props.columns.forEach((col) => {
          const td = document.createElement('td');
          td.className = 'p-3 text-primary';
          if (typeof col.render === 'function') {
            const customVal = col.render(row[col.key], row);
            if (customVal instanceof HTMLElement) {
              td.appendChild(customVal);
            } else {
              td.innerHTML = customVal;
            }
          } else {
            td.textContent = row[col.key] !== undefined ? row[col.key] : '';
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    return table;
  }
}
