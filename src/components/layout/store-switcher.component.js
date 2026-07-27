import { authStore } from '../../store/auth.store.js';
import { authService } from '../../services/auth.service.js';

/**
 * Multi-Store Switcher Component
 * Enables switching store accounts seamlessly for multi-store owners and staff members.
 */
export class StoreSwitcherComponent {
  render() {
    const { availableTenants, activeTenantId } = authStore.getState();

    const wrapper = document.createElement('div');
    wrapper.className = 'store-switcher flex items-center gap-2';

    if (!availableTenants || availableTenants.length <= 1) {
      const singleStore = availableTenants?.[0]?.name || 'Store Portal';
      wrapper.innerHTML = `<span class="font-semibold text-sm text-primary">🏪 ${singleStore}</span>`;
      return wrapper;
    }

    const select = document.createElement('select');
    select.className = 'select-field text-xs py-1 px-2 font-semibold';
    select.style.maxWidth = '200px';

    availableTenants.forEach((tenant) => {
      const option = document.createElement('option');
      option.value = tenant.id;
      option.textContent = `🏪 ${tenant.name} (${tenant.role.toUpperCase()})`;
      if (tenant.id === activeTenantId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', async (e) => {
      await authService.switchActiveTenant(e.target.value);
    });

    wrapper.appendChild(select);
    return wrapper;
  }
}
