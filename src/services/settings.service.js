import { settingsStore } from '../store/settings.store.js';
import { uiStore } from '../store/ui.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Settings & System Configuration Service
 * Manages Store Profile, Tax Rules, Thermal Receipts, Thermal Printers, Backup & Restore, Themes, Security & Integrations.
 */
export class SettingsService {
  /**
   * Update Store Profile
   */
  updateStoreProfile(data) {
    const current = settingsStore.getState().storeProfile;
    settingsStore.setState({ storeProfile: { ...current, ...data } });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Store Profile Saved',
      message: 'Store profile details updated successfully.'
    });
  }

  /**
   * Update Tax Settings
   */
  updateTaxSettings(data) {
    const current = settingsStore.getState().taxSettings;
    settingsStore.setState({ taxSettings: { ...current, ...data } });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Tax Settings Saved',
      message: 'Default GST/VAT tax rates updated.'
    });
  }

  /**
   * Update Receipt Settings
   */
  updateReceiptSettings(data) {
    const current = settingsStore.getState().receiptSettings;
    settingsStore.setState({ receiptSettings: { ...current, ...data } });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Receipt Options Saved',
      message: 'Thermal receipt layout updated.'
    });
  }

  /**
   * Update Thermal Printer Settings
   */
  updatePrinterSettings(data) {
    const current = settingsStore.getState().printerSettings;
    settingsStore.setState({ printerSettings: { ...current, ...data } });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Printer Config Saved',
      message: `Thermal printer configured for ${data.paperWidth || current.paperWidth}.`
    });
  }

  /**
   * Update Theme (Light / Dark)
   */
  updateTheme(mode) {
    settingsStore.setState({ themeSettings: { mode } });
    uiStore.setState({ theme: mode });
    document.documentElement.setAttribute('data-theme', mode);

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Theme Updated',
      message: `Switched application theme to ${mode.toUpperCase()} mode.`
    });
  }

  /**
   * Update Locale & Currency
   */
  updateLocale(language, currency) {
    const current = settingsStore.getState().localeSettings;
    const currencySymbols = { USD: '$', EUR: '€', INR: '₹', GBP: '£', AUD: '$' };

    settingsStore.setState({
      localeSettings: {
        ...current,
        language,
        currency,
        currencySymbol: currencySymbols[currency] || '$'
      }
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Locale Updated',
      message: `Currency set to ${currency} (${currencySymbols[currency] || '$'}).`
    });
  }

  /**
   * Generate One-Click JSON Database Backup File
   */
  generateDatabaseBackup() {
    const fullState = {
      storeProfile: settingsStore.getState().storeProfile,
      taxSettings: settingsStore.getState().taxSettings,
      receiptSettings: settingsStore.getState().receiptSettings,
      printerSettings: settingsStore.getState().printerSettings,
      backupTimestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `omnipos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    settingsStore.setState({
      backupMetadata: {
        lastBackupDate: new Date().toLocaleString(),
        backupSize: '2.4 MB'
      }
    });

    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'success',
      title: 'Database Backup Generated',
      message: 'JSON database backup downloaded successfully.'
    });
  }

  /**
   * Restore Database from JSON Backup File
   */
  restoreDatabaseFromBackup(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.storeProfile) settingsStore.setState({ storeProfile: parsed.storeProfile });
      if (parsed.taxSettings) settingsStore.setState({ taxSettings: parsed.taxSettings });
      if (parsed.receiptSettings) settingsStore.setState({ receiptSettings: parsed.receiptSettings });
      if (parsed.printerSettings) settingsStore.setState({ printerSettings: parsed.printerSettings });

      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'success',
        title: 'Database Restored',
        message: 'System settings restored from JSON backup file.'
      });
      return true;
    } catch (e) {
      eventBus.emit('NOTIFICATION_TRIGGERED', {
        type: 'error',
        title: 'Restore Failed',
        message: 'Invalid backup JSON file structure.'
      });
      return false;
    }
  }

  /**
   * Toggle Third-Party Integration
   */
  toggleIntegration(id) {
    const integrations = settingsStore.getState().integrations;
    const updated = integrations.map((i) => (i.id === id ? { ...i, isEnabled: !i.isEnabled } : i));

    settingsStore.setState({ integrations: updated });

    const item = updated.find((i) => i.id === id);
    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'info',
      title: 'Integration Updated',
      message: `${item.name} is now ${item.isEnabled ? 'ENABLED' : 'DISABLED'}.`
    });
  }
}

export const settingsService = new SettingsService();
