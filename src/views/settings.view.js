import { settingsStore } from '../store/settings.store.js';
import { settingsService } from '../services/settings.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';

export async function SettingsView() {
  const container = document.createElement('div');
  container.className = 'settings-view flex flex-col gap-6';

  let activeTab = 'profile'; // profile | tax-receipt | printers | theme-locale | security-backup | integrations

  // Navigation Tab Bar
  const navCard = document.createElement('div');
  navCard.className = 'card p-3 bg-secondary overflow-x-auto';
  const navFlex = document.createElement('div');
  navFlex.className = 'flex gap-2 flex-nowrap';

  const contentArea = document.createElement('div');
  contentArea.className = 'settings-module-content flex flex-col gap-6';

  const tabs = [
    { id: 'profile', label: '🏪 Store Profile' },
    { id: 'tax-receipt', label: '🧾 Tax & Receipt Customizer' },
    { id: 'printers', label: '🖨️ Thermal Printers' },
    { id: 'theme-locale', label: '🌐 Theme, Currency & Language' },
    { id: 'security-backup', label: '🛡️ Security, Backup & Restore' },
    { id: 'integrations', label: '🔌 API Keys & Integrations' }
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
      case 'profile':
        contentArea.appendChild(renderStoreProfileModule());
        break;
      case 'tax-receipt':
        contentArea.appendChild(renderTaxReceiptModule());
        break;
      case 'printers':
        contentArea.appendChild(renderPrintersModule());
        break;
      case 'theme-locale':
        contentArea.appendChild(renderThemeLocaleModule());
        break;
      case 'security-backup':
        contentArea.appendChild(renderSecurityBackupModule());
        break;
      case 'integrations':
        contentArea.appendChild(renderIntegrationsModule());
        break;
      default:
        contentArea.appendChild(renderStoreProfileModule());
    }
  };

  // 1. Store Profile Module
  const renderStoreProfileModule = () => {
    const { storeProfile } = settingsStore.getState();
    let name = storeProfile.storeName;
    let gstin = storeProfile.gstin;
    let address = storeProfile.address;
    let phone = storeProfile.phone;
    let email = storeProfile.email;

    const card = new CardComponent({
      title: '🏪 Store Profile & Business Details',
      subtitle: 'Manage official store metadata printed on receipts and invoices',
      content: `
        <div class="flex flex-col gap-3 text-xs mt-2">
          <div class="grid grid-cols-2 gap-3">
            <div id="set-name-in"></div>
            <div id="set-gstin-in"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div id="set-phone-in"></div>
            <div id="set-email-in"></div>
          </div>
          <div id="set-address-in"></div>
          <div class="mt-2" id="save-profile-btn"></div>
        </div>
      `
    }).render();

    const nameIn = new InputComponent({ label: 'Store Name', value: name, onChange: (v) => { name = v; } }).render();
    const gstinIn = new InputComponent({ label: 'GSTIN / Tax ID', value: gstin, onChange: (v) => { gstin = v; } }).render();
    const phoneIn = new InputComponent({ label: 'Store Phone', value: phone, onChange: (v) => { phone = v; } }).render();
    const emailIn = new InputComponent({ label: 'Store Email', value: email, onChange: (v) => { email = v; } }).render();
    const addressIn = new InputComponent({ label: 'Physical Store Address', value: address, onChange: (v) => { address = v; } }).render();

    const saveBtn = new ButtonComponent({
      text: 'Save Store Profile',
      variant: 'primary',
      onClick: () => {
        settingsService.updateStoreProfile({ storeName: name, gstin, address, phone, email });
      }
    }).render();

    card.querySelector('#set-name-in').appendChild(nameIn);
    card.querySelector('#set-gstin-in').appendChild(gstinIn);
    card.querySelector('#set-phone-in').appendChild(phoneIn);
    card.querySelector('#set-email-in').appendChild(emailIn);
    card.querySelector('#set-address-in').appendChild(addressIn);
    card.querySelector('#save-profile-btn').appendChild(saveBtn);

    return card;
  };

  // 2. Tax & Receipt Customizer Module
  const renderTaxReceiptModule = () => {
    const { taxSettings, receiptSettings } = settingsStore.getState();
    let defaultGst = taxSettings.defaultGstRate;
    let footerMessage = receiptSettings.footerMessage;
    let termsText = receiptSettings.termsText;

    const card = new CardComponent({
      title: '🧾 Tax Configuration & Thermal Receipt Layout',
      subtitle: 'Set default GST tax rates and receipt header/footer terms',
      content: `
        <div class="flex flex-col gap-4 text-xs mt-2">
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-2">TAX CONFIGURATION</div>
            <div class="grid grid-cols-2 gap-3">
              <div id="set-gst-in"></div>
              <div class="flex items-center gap-2 mt-4">
                <input type="checkbox" id="tax-inc-check" ${taxSettings.inclusiveTaxPricing ? 'checked' : ''} />
                <label for="tax-inc-check">Inclusive Tax Pricing Mode</label>
              </div>
            </div>
          </div>

          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-2">THERMAL RECEIPT CUSTOMIZER</div>
            <div class="flex flex-col gap-3">
              <div id="set-footer-in"></div>
              <div id="set-terms-in"></div>
            </div>
          </div>

          <div id="save-tax-rec-btn"></div>
        </div>
      `
    }).render();

    const gstIn = new InputComponent({ label: 'Default GST Tax Rate (%)', type: 'number', value: defaultGst, onChange: (v) => { defaultGst = parseFloat(v) || 18; } }).render();
    const footerIn = new InputComponent({ label: 'Receipt Footer Thank You Message', value: footerMessage, onChange: (v) => { footerMessage = v; } }).render();
    const termsIn = new InputComponent({ label: 'Receipt Terms & Exchange Policy', value: termsText, onChange: (v) => { termsText = v; } }).render();

    const saveBtn = new ButtonComponent({
      text: 'Save Tax & Receipt Options',
      variant: 'primary',
      onClick: () => {
        const incCheck = card.querySelector('#tax-inc-check');
        settingsService.updateTaxSettings({ defaultGstRate: defaultGst, inclusiveTaxPricing: incCheck.checked });
        settingsService.updateReceiptSettings({ footerMessage, termsText });
      }
    }).render();

    card.querySelector('#set-gst-in').appendChild(gstIn);
    card.querySelector('#set-footer-in').appendChild(footerIn);
    card.querySelector('#set-terms-in').appendChild(termsIn);
    card.querySelector('#save-tax-rec-btn').appendChild(saveBtn);

    return card;
  };

  // 3. Thermal Printers Module
  const renderPrintersModule = () => {
    const { printerSettings } = settingsStore.getState();
    let paperWidth = printerSettings.paperWidth;
    let connectionType = printerSettings.connectionType;
    let printerIP = printerSettings.printerIP;

    const card = new CardComponent({
      title: '𖤂 Thermal POS Printers & Hardware Spooler',
      subtitle: 'Configure thermal receipt printer specifications (58mm / 80mm)',
      content: `
        <div class="flex flex-col gap-3 text-xs mt-2">
          <div class="grid grid-cols-3 gap-3">
            <div class="input-group">
              <label class="input-label">Paper Width</label>
              <select class="select-field" id="pr-paper-select">
                <option value="58mm" ${paperWidth === '58mm' ? 'selected' : ''}>58mm Standard Receipt</option>
                <option value="80mm" ${paperWidth === '80mm' ? 'selected' : ''}>80mm Wide Receipt</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Connection Interface</label>
              <select class="select-field" id="pr-conn-select">
                <option value="usb" ${connectionType === 'usb' ? 'selected' : ''}>USB Direct Spooler</option>
                <option value="bluetooth" ${connectionType === 'bluetooth' ? 'selected' : ''}>Bluetooth POS Printer</option>
                <option value="network" ${connectionType === 'network' ? 'selected' : ''}>Network IP Printer</option>
              </select>
            </div>
            <div id="pr-ip-in"></div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="auto-print-check" ${printerSettings.autoPrintOnSettlement ? 'checked' : ''} />
            <label for="auto-print-check">Auto-Print Thermal Receipt on Payment Settlement</label>
          </div>
          <div class="mt-2" id="save-printer-btn"></div>
        </div>
      `
    }).render();

    const ipIn = new InputComponent({ label: 'Network Printer IP Address', value: printerIP, onChange: (v) => { printerIP = v; } }).render();

    const saveBtn = new ButtonComponent({
      text: 'Save Printer Settings',
      variant: 'primary',
      onClick: () => {
        const pSel = card.querySelector('#pr-paper-select');
        const cSel = card.querySelector('#pr-conn-select');
        const autoCheck = card.querySelector('#auto-print-check');
        settingsService.updatePrinterSettings({ paperWidth: pSel.value, connectionType: cSel.value, printerIP, autoPrintOnSettlement: autoCheck.checked });
      }
    }).render();

    card.querySelector('#pr-ip-in').appendChild(ipIn);
    card.querySelector('#save-printer-btn').appendChild(saveBtn);

    return card;
  };

  // 4. Theme, Currency & Language Module
  const renderThemeLocaleModule = () => {
    const { themeSettings, localeSettings } = settingsStore.getState();

    const card = new CardComponent({
      title: '🌐 Theme, Currency & Multi-Language Settings',
      subtitle: 'Customize application appearance, currency symbols and language',
      content: `
        <div class="flex flex-col gap-4 text-xs mt-2">
          <!-- Theme Toggle -->
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-2">APPEARANCE MODE</div>
            <div class="flex gap-3">
              <button id="theme-light-btn" class="btn btn-sm ${themeSettings.mode === 'light' ? 'btn-primary' : 'btn-secondary'}">☀️ Light Theme</button>
              <button id="theme-dark-btn" class="btn btn-sm ${themeSettings.mode === 'dark' ? 'btn-primary' : 'btn-secondary'}">🌙 Dark Theme</button>
            </div>
          </div>

          <!-- Currency & Language -->
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-2">CURRENCY & LOCALE</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="input-group">
                <label class="input-label">Currency</label>
                <select class="select-field" id="loc-curr-select">
                  <option value="USD" ${localeSettings.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="EUR" ${localeSettings.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                  <option value="INR" ${localeSettings.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                  <option value="GBP" ${localeSettings.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">Language</label>
                <select class="select-field" id="loc-lang-select">
                  <option value="en" ${localeSettings.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="es" ${localeSettings.language === 'es' ? 'selected' : ''}>Spanish</option>
                  <option value="hi" ${localeSettings.language === 'hi' ? 'selected' : ''}>Hindi</option>
                  <option value="fr" ${localeSettings.language === 'fr' ? 'selected' : ''}>French</option>
                </select>
              </div>
            </div>
          </div>

          <div id="save-locale-btn"></div>
        </div>
      `
    }).render();

    card.querySelector('#theme-light-btn').addEventListener('click', () => {
      settingsService.updateTheme('light');
      renderActiveTabContent();
    });

    card.querySelector('#theme-dark-btn').addEventListener('click', () => {
      settingsService.updateTheme('dark');
      renderActiveTabContent();
    });

    const saveBtn = new ButtonComponent({
      text: 'Save Locale Settings',
      variant: 'primary',
      onClick: () => {
        const currSelect = card.querySelector('#loc-curr-select');
        const langSelect = card.querySelector('#loc-lang-select');
        settingsService.updateLocale(langSelect.value, currSelect.value);
      }
    }).render();

    card.querySelector('#save-locale-btn').appendChild(saveBtn);

    return card;
  };

  // 5. Security, Backup & Restore Module
  const renderSecurityBackupModule = () => {
    const { backupMetadata } = settingsStore.getState();

    const card = new CardComponent({
      title: '🛡️ Security, One-Click Backup & Database Restore',
      subtitle: 'Manage system security policies and export/import database backups',
      content: `
        <div class="flex flex-col gap-4 text-xs mt-2">
          <!-- Database Backup Card -->
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-1">ONE-CLICK DATABASE BACKUP</div>
            <div class="text-muted mb-3">Last Backup: ${backupMetadata.lastBackupDate} (${backupMetadata.backupSize})</div>
            <button id="gen-backup-btn" class="btn btn-primary btn-sm">💾 Download JSON Backup</button>
          </div>

          <!-- Database Restore Card -->
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-1">RESTORE DATABASE FROM BACKUP</div>
            <div class="text-muted mb-3">Upload a previously saved .json backup file to restore system settings.</div>
            <input type="file" id="restore-file-input" accept=".json" class="input-field text-xs mb-2" />
            <button id="restore-btn" class="btn btn-secondary btn-sm">📥 Restore Database</button>
          </div>
        </div>
      `
    }).render();

    card.querySelector('#gen-backup-btn').addEventListener('click', () => settingsService.generateDatabaseBackup());

    card.querySelector('#restore-btn').addEventListener('click', () => {
      const fileInput = card.querySelector('#restore-file-input');
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          settingsService.restoreDatabaseFromBackup(e.target.result);
        };
        reader.readAsText(fileInput.files[0]);
      }
    });

    return card;
  };

  // 6. Integrations & API Keys Module
  const renderIntegrationsModule = () => {
    const { integrations, apiKeys } = settingsStore.getState();

    const card = new CardComponent({
      title: '🔌 API Keys & Third-Party Integrations',
      subtitle: 'Configure Supabase endpoints and enable payment & accounting integrations',
      content: `
        <div class="flex flex-col gap-4 text-xs mt-2">
          <!-- Supabase Keys -->
          <div class="card p-3 bg-tertiary">
            <div class="font-bold text-sm text-primary mb-2">SUPABASE ENDPOINTS & KEYS</div>
            <div class="flex flex-col gap-2 font-mono">
              <div><span class="text-muted">Supabase URL:</span> ${apiKeys.supabaseUrl}</div>
              <div><span class="text-muted">Publishable Key:</span> <code class="text-primary">${apiKeys.publishableKey}</code></div>
            </div>
          </div>

          <!-- Active Integrations -->
          <div class="font-bold text-sm text-primary">CONNECTED INTEGRATIONS</div>
          <div class="flex flex-col gap-2">
            ${integrations.map((item) => `
              <div class="card p-3 flex justify-between items-center bg-tertiary">
                <div>
                  <div class="font-bold">${item.name}</div>
                  <div class="text-muted text-xs">${item.description}</div>
                </div>
                <button class="btn btn-sm ${item.isEnabled ? 'btn-primary' : 'btn-secondary'} int-toggle-btn" data-id="${item.id}">
                  ${item.isEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }).render();

    card.querySelectorAll('.int-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        settingsService.toggleIntegration(id);
        renderActiveTabContent();
      });
    });

    return card;
  };

  renderTabs();
  renderActiveTabContent();
  return container;
}
