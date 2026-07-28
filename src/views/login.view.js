import { InputComponent } from '../components/base/input.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { CardComponent } from '../components/base/card.component.js';
import { authService } from '../services/auth.service.js';
import { tenantService } from '../services/tenant.service.js';
import { eventBus } from '../core/event-bus.js';

export async function LoginView() {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-center min-h-screen p-4';

  const card = new CardComponent({
    title: 'OmniPOS SaaS Billing Login',
    subtitle: 'Enter your credentials to access your store portal',
    content: `
      <form id="login-form">
        <div id="email-input-container"></div>
        <div id="password-input-container"></div>
        <div id="login-btn-container" class="mt-4"></div>
      </form>
    `
  }).render();

  card.style.maxWidth = '420px';
  card.style.width = '100%';

  let emailValue = 'demo@omnipos.saas';
  let passwordValue = 'password123';

  const emailInput = new InputComponent({
    label: 'Business Email',
    type: 'email',
    value: emailValue,
    onChange: (val) => { emailValue = val; }
  }).render();

  const passwordInput = new InputComponent({
    label: 'Password',
    type: 'password',
    value: passwordValue,
    onChange: (val) => { passwordValue = val; }
  }).render();

  const submitBtn = new ButtonComponent({
    text: 'Sign In to Store',
    variant: 'primary',
    onClick: async (e) => {
      e.preventDefault();
      const res = await authService.signInWithPassword(emailValue, passwordValue);
      if (res.success) {
        await tenantService.resolveTenant();
        window.location.hash = '#/dashboard';
      } else {
        // Fallback for demonstration offline shell
        authService.handleSessionUpdate({
          user: { id: 'demo-user-1', email: emailValue, user_metadata: { full_name: 'Demo Store Manager' } }
        });
        await tenantService.resolveTenant();
        window.location.hash = '#/dashboard';
        eventBus.emit('NOTIFICATION_TRIGGERED', {
          type: 'info',
          title: 'Demo Session Active',
          message: 'Logged in as Demo Store Manager.'
        });
      }
    }
  }).render();

  card.querySelector('#email-input-container').appendChild(emailInput);
  card.querySelector('#password-input-container').appendChild(passwordInput);
  card.querySelector('#login-btn-container').appendChild(submitBtn);

  container.appendChild(card);
  return container;
}
