import { supabaseService } from './supabase.service.js';
import { tenantStore } from '../store/tenant.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * Multi-Tenant Service
 * Manages tenant context resolution from subdomain/URL/user session and injects custom tenant branding CSS variables.
 */
export class TenantService {
  /**
   * Resolve and load active tenant
   * @param {string} tenantIdOrSlug 
   */
  async resolveTenant(tenantIdOrSlug) {
    tenantStore.setState({ isLoading: true });

    let tenant = null;

    if (tenantIdOrSlug) {
      const { data } = await supabaseService.findById('tenants', tenantIdOrSlug);
      tenant = data;
    } else {
      // Auto-detect from hostname subdomain e.g. "acme.pos.com"
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        const subdomain = parts[0];
        const { data } = await supabaseService.executeQuery((client) =>
          client.from('tenants').select('*').eq('subdomain', subdomain).single()
        );
        tenant = data;
      }
    }

    // Fallback default tenant metadata for demonstration/development shell
    if (!tenant) {
      tenant = {
        id: 'default-tenant-001',
        name: 'OmniPOS Store',
        slug: 'omnipos-store',
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
        currency: 'USD',
        taxRate: 8.5
      };
    }

    this.applyTenantBranding(tenant);

    tenantStore.setState({
      tenant,
      currency: tenant.currency || 'USD',
      taxRate: tenant.taxRate || 0,
      isLoading: false
    });

    eventBus.emit('TENANT_RESOLVED', tenant);
    return tenant;
  }

  /**
   * Inject dynamic CSS custom properties for tenant branding colors
   * @param {Object} tenant 
   */
  applyTenantBranding(tenant) {
    if (tenant.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
    }
    if (tenant.secondaryColor) {
      document.documentElement.style.setProperty('--color-secondary', tenant.secondaryColor);
    }
  }
}

export const tenantService = new TenantService();
