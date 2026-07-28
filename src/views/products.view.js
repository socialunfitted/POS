import { productsStore } from '../store/products.store.js';
import { productsService } from '../services/products.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { TableComponent } from '../components/base/table.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { SelectComponent } from '../components/base/select.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function ProductsView() {
  const container = document.createElement('div');
  container.className = 'products-view flex flex-col gap-6';

  const state = productsStore.getState();

  // 1. Control Header Bar (Actions + Search + Filters)
  const headerCard = new CardComponent({
    title: '📦 Product Catalog & Price Management',
    subtitle: 'Manage products, SKUs, barcodes, GST tax rates, prices & variants',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button id="add-product-btn" class="btn btn-primary btn-sm">➕ Add Product</button>
          <button id="manage-cat-btn" class="btn btn-secondary btn-sm">📁 Categories</button>
          <button id="import-csv-btn" class="btn btn-secondary btn-sm">📥 Import CSV/Excel</button>
          <button id="export-csv-btn" class="btn btn-secondary btn-sm">📤 Export CSV/Excel</button>
        </div>

        <div class="flex items-center gap-2 flex-wrap" id="filter-controls"></div>
      </div>
    `
  }).render();

  // Search & Filter Inputs Builder
  const filterControls = headerCard.querySelector('#filter-controls');

  let searchQuery = state.searchQuery;
  let categoryFilter = state.selectedCategory;
  let stockFilter = state.selectedStockStatus;

  const searchInput = new InputComponent({
    placeholder: '🔍 Search Name, SKU, Barcode...',
    value: searchQuery,
    onChange: (val) => {
      searchQuery = val.toLowerCase();
      renderProductsTable();
    }
  }).render();
  searchInput.style.maxWidth = '220px';

  const catOptions = [{ value: 'all', label: 'All Categories' }, ...state.categories.map((c) => ({ value: c.id, label: c.name }))];
  const catSelect = new SelectComponent({
    options: catOptions,
    value: categoryFilter,
    onChange: (val) => {
      categoryFilter = val;
      renderProductsTable();
    }
  }).render();

  filterControls.appendChild(searchInput);
  filterControls.appendChild(catSelect);

  // Bind Header Action Buttons
  headerCard.querySelector('#add-product-btn').addEventListener('click', () => openProductModal());
  headerCard.querySelector('#manage-cat-btn').addEventListener('click', () => openCategoryModal());
  headerCard.querySelector('#import-csv-btn').addEventListener('click', () => openCSVImportModal());
  headerCard.querySelector('#export-csv-btn').addEventListener('click', () => productsService.exportProductsToCSV());

  container.appendChild(headerCard);

  // 2. Catalog Table Container Card
  const tableCard = new CardComponent({
    title: 'Product Inventory Table',
    content: `<div id="products-table-wrapper"></div><div id="pagination-wrapper" class="mt-4 border-t pt-4 flex justify-between items-center text-xs"></div>`
  }).render();

  container.appendChild(tableCard);

  // Render Filtered Table & Pagination
  const renderProductsTable = () => {
    const { products, categories } = productsStore.getState();

    let filtered = products.filter((p) => {
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery) || p.barcode.includes(searchQuery);
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return matchSearch && matchCat;
    });

    const tableWrapper = tableCard.querySelector('#products-table-wrapper');
    tableWrapper.innerHTML = '';

    const table = new TableComponent({
      columns: [
        {
          key: 'image',
          title: 'Image',
          render: (_, row) => `<img src="${row.imageUrl}" width="36" height="36" style="border-radius: var(--radius-sm); object-fit: cover;" />`
        },
        { key: 'name', title: 'Product Name', render: (val) => `<strong>${val}</strong>` },
        { key: 'sku', title: 'SKU / Barcode', render: (_, row) => `<div><code class="font-mono text-xs text-primary">${row.sku}</code><br/><span class="text-xs text-muted">${row.barcode}</span></div>` },
        { key: 'categoryName', title: 'Category', render: (val) => `<span class="badge badge-secondary">${val}</span>` },
        {
          key: 'stockQuantity',
          title: 'Stock',
          render: (val, row) => `<span class="badge ${val <= row.minStockLevel ? 'badge-danger' : 'badge-success'}">${val} ${row.unit}</span>`
        },
        { key: 'purchasePrice', title: 'Cost Price', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'sellingPrice', title: 'Selling Price', render: (val) => `<strong class="text-primary">$${parseFloat(val).toFixed(2)}</strong>` },
        { key: 'mrp', title: 'MRP', render: (val) => `$${parseFloat(val).toFixed(2)}` },
        { key: 'gstRate', title: 'GST %', render: (val) => `<span class="badge badge-primary">${val}% GST</span>` },
        {
          key: 'actions',
          title: 'Actions',
          render: (_, row) => {
            const flex = document.createElement('div');
            flex.className = 'flex gap-1';

            const editBtn = new ButtonComponent({
              text: '✏️ Edit',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openProductModal(row)
            }).render();

            const barcodeBtn = new ButtonComponent({
              text: '🏷️ Barcode',
              variant: 'secondary',
              size: 'sm',
              onClick: () => openBarcodeModal(row)
            }).render();

            const delBtn = new ButtonComponent({
              text: '🗑️',
              variant: 'danger',
              size: 'sm',
              onClick: () => {
                productsService.deleteProduct(row.id);
                renderProductsTable();
              }
            }).render();

            flex.appendChild(editBtn);
            flex.appendChild(barcodeBtn);
            flex.appendChild(delBtn);
            return flex;
          }
        }
      ],
      data: filtered
    }).render();

    tableWrapper.appendChild(table);

    // Pagination Controls
    const pagWrapper = tableCard.querySelector('#pagination-wrapper');
    pagWrapper.innerHTML = `
      <span class="text-secondary">Showing <strong>${filtered.length}</strong> products</span>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary btn-sm" disabled>❮ Previous</button>
        <span class="font-bold text-primary">Page 1 of 1</span>
        <button class="btn btn-secondary btn-sm" disabled>Next ❯</button>
      </div>
    `;
  };

  renderProductsTable();

  // Add / Edit Product Modal Builder
  const openProductModal = (productToEdit = null) => {
    const isEdit = Boolean(productToEdit);
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    let name = productToEdit?.name || '';
    let sku = productToEdit?.sku || '';
    let barcode = productToEdit?.barcode || '';
    let categoryName = productToEdit?.categoryName || 'Dairy';
    let purchasePrice = productToEdit?.purchasePrice || 10.0;
    let sellingPrice = productToEdit?.sellingPrice || 15.0;
    let mrp = productToEdit?.mrp || 18.0;
    let gstRate = productToEdit?.gstRate || 18;
    let stockQuantity = productToEdit?.stockQuantity || 25;
    let minStockLevel = productToEdit?.minStockLevel || 5;
    let unit = productToEdit?.unit || 'pcs';

    content.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <div id="p-name-in"></div>
        <div id="p-sku-in"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div id="p-barcode-in"></div>
        <div class="input-group">
          <label class="input-label">Category</label>
          <select class="select-field" id="p-cat-select">
            ${state.categories.map((c) => `<option value="${c.name}" ${c.name === categoryName ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div id="p-cost-in"></div>
        <div id="p-price-in"></div>
        <div id="p-mrp-in"></div>
        <div id="p-gst-in"></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div id="p-stock-in"></div>
        <div id="p-minstock-in"></div>
        <div id="p-unit-in"></div>
      </div>
      <div id="save-prod-btn" class="mt-3"></div>
    `;

    const nameInput = new InputComponent({ label: 'Product Name', value: name, onChange: (v) => { name = v; } }).render();
    const skuInput = new InputComponent({ label: 'SKU Code', value: sku, placeholder: 'Auto-generated if empty', onChange: (v) => { sku = v; } }).render();
    const barcodeInput = new InputComponent({ label: 'Barcode EAN/UPC', value: barcode, placeholder: 'Auto-generated if empty', onChange: (v) => { barcode = v; } }).render();

    const costInput = new InputComponent({ label: 'Cost Price ($)', type: 'number', value: purchasePrice, onChange: (v) => { purchasePrice = v; } }).render();
    const priceInput = new InputComponent({ label: 'Selling Price ($)', type: 'number', value: sellingPrice, onChange: (v) => { sellingPrice = v; } }).render();
    const mrpInput = new InputComponent({ label: 'MRP ($)', type: 'number', value: mrp, onChange: (v) => { mrp = v; } }).render();
    const gstInput = new InputComponent({ label: 'GST Rate (%)', type: 'number', value: gstRate, onChange: (v) => { gstRate = v; } }).render();

    const stockInput = new InputComponent({ label: 'Current Stock', type: 'number', value: stockQuantity, onChange: (v) => { stockQuantity = v; } }).render();
    const minStockInput = new InputComponent({ label: 'Min Stock Alert', type: 'number', value: minStockLevel, onChange: (v) => { minStockLevel = v; } }).render();
    const unitInput = new InputComponent({ label: 'Unit (pcs, kg, ltr)', value: unit, onChange: (v) => { unit = v; } }).render();

    const modal = new ModalComponent({
      title: isEdit ? `Edit Product - ${productToEdit.name}` : '➕ Add New Product',
      content
    });
    modal.open();

    const btn = new ButtonComponent({
      text: isEdit ? 'Save Changes' : 'Create Product',
      variant: 'primary',
      onClick: async () => {
        if (name) {
          const payload = { name, sku, barcode, categoryName, purchasePrice, sellingPrice, mrp, gstRate, stockQuantity, minStockLevel, unit };
          if (isEdit) {
            await productsService.updateProduct(productToEdit.id, payload);
          } else {
            await productsService.addProduct(payload);
          }
          modal.close();
          renderProductsTable();
        }
      }
    }).render();

    content.querySelector('#p-name-in').appendChild(nameInput);
    content.querySelector('#p-sku-in').appendChild(skuInput);
    content.querySelector('#p-barcode-in').appendChild(barcodeInput);
    content.querySelector('#p-cost-in').appendChild(costInput);
    content.querySelector('#p-price-in').appendChild(priceInput);
    content.querySelector('#p-mrp-in').appendChild(mrpInput);
    content.querySelector('#p-gst-in').appendChild(gstInput);
    content.querySelector('#p-stock-in').appendChild(stockInput);
    content.querySelector('#p-minstock-in').appendChild(minStockInput);
    content.querySelector('#p-unit-in').appendChild(unitInput);
    content.querySelector('#save-prod-btn').appendChild(btn);
  };

  // Category Manager Modal Builder
  const openCategoryModal = () => {
    let newCatName = '';
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4';

    const input = new InputComponent({
      label: 'New Category Name',
      placeholder: 'e.g. Frozen Foods',
      onChange: (v) => { newCatName = v; }
    }).render();

    content.appendChild(input);

    const modal = new ModalComponent({
      title: '📁 Category Taxonomy Manager',
      content
    });

    const addBtn = new ButtonComponent({
      text: 'Add Category',
      variant: 'primary',
      onClick: () => {
        if (newCatName) {
          productsService.addCategory(newCatName);
          modal.close();
          window.location.reload();
        }
      }
    }).render();

    content.appendChild(addBtn);
    modal.open();
  };

  // Barcode Generator Modal Builder
  const openBarcodeModal = (product) => {
    const content = document.createElement('div');
    content.className = 'flex flex-col items-center gap-4 p-4 text-center';

    content.innerHTML = `
      <div class="font-bold text-lg text-primary">${product.name}</div>
      <div class="text-xs text-muted">SKU: ${product.sku}</div>

      <div class="p-6 bg-white border rounded flex flex-col items-center justify-center my-2">
        <div style="width: 220px; height: 60px; background: repeating-linear-gradient(90deg, #000 0, #000 3px, #fff 3px, #fff 7px, #000 7px, #000 9px);"></div>
        <div class="font-mono text-sm tracking-widest mt-2 text-black font-bold">${product.barcode}</div>
      </div>

      <button id="print-barcode-btn" class="btn btn-primary btn-sm">🖨️ Print Barcode Label</button>
    `;

    const modal = new ModalComponent({
      title: `Barcode Generator - ${product.sku}`,
      content
    });
    modal.open();

    content.querySelector('#print-barcode-btn').addEventListener('click', () => window.print());
  };

  // CSV Import Modal Builder
  const openCSVImportModal = () => {
    let csvText = '';
    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3';

    content.innerHTML = `
      <p class="text-xs text-secondary">Paste CSV format (Name, SKU, SellingPrice, Stock):</p>
      <textarea class="input-field font-mono text-xs" rows="6" placeholder="Name,SKU,SellingPrice,Stock\nProduct A,SKU-A,15.00,50\nProduct B,SKU-B,25.00,30" id="csv-area"></textarea>
      <div id="import-btn-wrapper" class="mt-2"></div>
    `;

    const modal = new ModalComponent({
      title: '📥 Bulk CSV Import',
      content
    });
    modal.open();

    const area = content.querySelector('#csv-area');
    area.addEventListener('input', (e) => { csvText = e.target.value; });

    const btn = new ButtonComponent({
      text: 'Import CSV Records',
      variant: 'primary',
      onClick: () => {
        if (csvText) {
          productsService.importProductsFromCSV(csvText);
          modal.close();
          renderProductsTable();
        }
      }
    }).render();

    content.querySelector('#import-btn-wrapper').appendChild(btn);
  };

  return container;
}
