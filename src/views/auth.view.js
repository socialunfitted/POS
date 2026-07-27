import { authService } from '../services/auth.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { TabsComponent } from '../components/base/tabs.component.js';
import { ModalComponent } from '../components/base/modal.component.js';
import { SwitchComponent } from '../components/base/switch.component.js';
import { eventBus } from '../core/event-bus.js';

export async function AuthView(routePath = '#/login') {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center min-h-screen p-4 bg-primary-gradient';

  let activeTab = routePath === '#/signup' ? 'signup' : 'login'; // 'login' | 'pin' | 'signup'

  // Handle Reset Password route view
  if (routePath === '#/reset-password') {
    return renderResetPasswordCard();
  }

  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '460px';
  wrapper.style.width = '100%';

  const renderContent = () => {
    wrapper.innerHTML = '';

    const tabsNav = new TabsComponent({
      tabs: [
        { id: 'login', label: '🔐 Owner / Admin Login' },
        { id: 'pin', label: '📱 Staff Quick PIN' },
        { id: 'signup', label: '🏪 Register Store' }
      ],
      activeTab,
      onTabChange: (id) => {
        activeTab = id;
        renderContent();
      }
    }).render();

    wrapper.appendChild(tabsNav);

    if (activeTab === 'login') {
      wrapper.appendChild(renderEmailLoginForm());
    } else if (activeTab === 'pin') {
      wrapper.appendChild(renderStaffPinForm());
    } else if (activeTab === 'signup') {
      wrapper.appendChild(renderSignupForm());
    }
  };

  // 1. Email / Password Login Form
  const renderEmailLoginForm = () => {
    let email = 'owner@store.com';
    let password = 'password123';
    let rememberMe = true;

    const card = new CardComponent({
      title: 'Sign In to Store Portal',
      subtitle: 'Enter your owner or admin account credentials',
      content: `
        <form id="email-login-form">
          <div id="email-field"></div>
          <div id="password-field"></div>
          <div class="flex items-center justify-between my-3">
            <div id="remember-switch"></div>
            <a href="javascript:void(0)" id="forgot-link" class="text-xs text-primary font-semibold">Forgot Password?</a>
          </div>
          <div id="login-btn" class="mt-4"></div>
        </form>
      `
    }).render();

    const emailInput = new InputComponent({
      label: 'Business Email',
      type: 'email',
      value: email,
      onChange: (v) => { email = v; }
    }).render();

    const passInput = new InputComponent({
      label: 'Password',
      type: 'password',
      value: password,
      onChange: (v) => { password = v; }
    }).render();

    const rememberSwitch = new SwitchComponent({
      label: 'Remember Me',
      checked: rememberMe,
      onChange: (v) => { rememberMe = v; }
    }).render();

    const loginBtn = new ButtonComponent({
      text: 'Sign In',
      variant: 'primary',
      onClick: async (e) => {
        e.preventDefault();
        const res = await authService.signInWithPassword(email, password, rememberMe);
        if (res.success) {
          window.location.hash = '#/dashboard';
        }
      }
    }).render();

    card.querySelector('#email-field').appendChild(emailInput);
    card.querySelector('#password-field').appendChild(passInput);
    card.querySelector('#remember-switch').appendChild(rememberSwitch);
    card.querySelector('#login-btn').appendChild(loginBtn);

    card.querySelector('#forgot-link').addEventListener('click', () => openForgotPasswordModal());

    return card;
  };

  // 2. Staff Quick PIN Login Form
  const renderStaffPinForm = () => {
    let enteredPin = '';

    const card = new CardComponent({
      title: 'Staff Terminal Quick Login',
      subtitle: 'Select store and enter 4-digit PIN code',
      content: `
        <div class="flex flex-col items-center gap-4">
          <div class="w-full">
            <label class="input-label">Select Store Outlet</label>
            <select class="select-field" id="pin-store-select">
              <option value="default-tenant-001">OmniPOS Flagship Store</option>
              <option value="outlet-002">OmniPOS Express Branch</option>
            </select>
          </div>

          <div class="text-center">
            <div class="text-xs text-muted mb-2">PIN Display (Default Demo: 1234)</div>
            <div id="pin-display" class="font-mono text-3xl font-bold tracking-widest p-3 bg-tertiary rounded text-primary" style="min-width: 180px; letter-spacing: 0.5em;">••••</div>
          </div>

          <div class="grid grid-cols-3 gap-2 w-full max-w-xs" id="keypad-container">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, '✓ Login'].map((key) => `
              <button class="btn btn-secondary btn-lg font-bold pad-key" data-key="${key}">${key}</button>
            `).join('')}
          </div>
        </div>
      `
    }).render();

    const display = card.querySelector('#pin-display');
    const storeSelect = card.querySelector('#pin-store-select');

    card.querySelectorAll('.pad-key').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-key');
        if (key === 'Clear') {
          enteredPin = '';
        } else if (key === '✓ Login') {
          if (enteredPin.length >= 4) {
            const res = await authService.signInWithEmployeePin(storeSelect.value, enteredPin);
            if (res.success) {
              window.location.hash = '#/dashboard';
            }
          }
        } else if (enteredPin.length < 4) {
          enteredPin += key;
        }

        display.textContent = enteredPin ? '•'.repeat(enteredPin.length) : '••••';
      });
    });

    return card;
  };

  // 3. New Store Registration Form
  const renderSignupForm = () => {
    let fullName = 'Alex Store Owner';
    let email = 'newstore@omnipos.saas';
    let password = 'password123';
    let storeName = 'My Supermarket Store';
    let currency = 'USD';
    let taxRate = 8.5;

    const card = new CardComponent({
      title: 'Register New Store Account',
      subtitle: 'Create your owner portal and initialize multi-tenant workspace',
      content: `
        <form id="signup-form">
          <div id="owner-name-field"></div>
          <div id="email-signup-field"></div>
          <div id="password-signup-field"></div>
          <div id="store-name-field"></div>
          <div class="grid grid-cols-2 gap-2">
            <div id="currency-field"></div>
            <div id="tax-field"></div>
          </div>
          <div id="signup-btn" class="mt-4"></div>
        </form>
      `
    }).render();

    const nameInput = new InputComponent({ label: 'Full Name', value: fullName, onChange: (v) => { fullName = v; } }).render();
    const emailInput = new InputComponent({ label: 'Email', type: 'email', value: email, onChange: (v) => { email = v; } }).render();
    const passInput = new InputComponent({ label: 'Password', type: 'password', value: password, onChange: (v) => { password = v; } }).render();
    const storeInput = new InputComponent({ label: 'Store Name', value: storeName, onChange: (v) => { storeName = v; } }).render();
    const currencyInput = new InputComponent({ label: 'Currency Code', value: currency, onChange: (v) => { currency = v; } }).render();
    const taxInput = new InputComponent({ label: 'Default Tax Rate (%)', type: 'number', value: taxRate, onChange: (v) => { taxRate = parseFloat(v) || 0; } }).render();

    const signupBtn = new ButtonComponent({
      text: 'Create Store Account',
      variant: 'primary',
      onClick: async (e) => {
        e.preventDefault();
        const res = await authService.signUpStore({ fullName, email, password, storeName, currency, taxRate });
        if (res.success) {
          window.location.hash = '#/dashboard';
        }
      }
    }).render();

    card.querySelector('#owner-name-field').appendChild(nameInput);
    card.querySelector('#email-signup-field').appendChild(emailInput);
    card.querySelector('#password-signup-field').appendChild(passInput);
    card.querySelector('#store-name-field').appendChild(storeInput);
    card.querySelector('#currency-field').appendChild(currencyInput);
    card.querySelector('#tax-field').appendChild(taxInput);
    card.querySelector('#signup-btn').appendChild(signupBtn);

    return card;
  };

  // 4. Reset Password View Renderer
  const renderResetPasswordCard = () => {
    let newPassword = '';

    const card = new CardComponent({
      title: 'Set New Password',
      subtitle: 'Enter your updated security password below',
      content: `
        <div id="new-pass-field"></div>
        <div id="update-pass-btn" class="mt-4"></div>
      `
    }).render();

    card.style.maxWidth = '420px';
    card.style.width = '100%';

    const passInput = new InputComponent({
      label: 'New Password',
      type: 'password',
      placeholder: 'Enter new password',
      onChange: (v) => { newPassword = v; }
    }).render();

    const updateBtn = new ButtonComponent({
      text: 'Update Password',
      variant: 'primary',
      onClick: async () => {
        if (newPassword) {
          const res = await authService.updateUserPassword(newPassword);
          if (res.success) {
            window.location.hash = '#/login';
          }
        }
      }
    }).render();

    card.querySelector('#new-pass-field').appendChild(passInput);
    card.querySelector('#update-pass-btn').appendChild(updateBtn);
    container.appendChild(card);
    return container;
  };

  // Forgot Password Modal
  const openForgotPasswordModal = () => {
    let resetEmail = '';

    const modalContent = document.createElement('div');
    modalContent.className = 'flex flex-col gap-4';

    const input = new InputComponent({
      label: 'Account Email',
      type: 'email',
      placeholder: 'Enter your registered email',
      onChange: (v) => { resetEmail = v; }
    }).render();

    modalContent.appendChild(input);

    const modal = new ModalComponent({
      title: 'Reset Password',
      content: modalContent
    });

    const submitBtn = new ButtonComponent({
      text: 'Send Reset Link',
      variant: 'primary',
      onClick: async () => {
        if (resetEmail) {
          await authService.resetPasswordForEmail(resetEmail);
          modal.close();
        }
      }
    }).render();

    modalContent.appendChild(submitBtn);
    modal.open();
  };

  renderContent();
  container.appendChild(wrapper);
  return container;
}
