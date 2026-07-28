import { CardComponent } from '../components/base/card.component.js';
import { ButtonComponent } from '../components/base/button.component.js';

export async function ForbiddenView() {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-center p-8';

  const card = new CardComponent({
    title: '403 - Access Restricted',
    subtitle: 'Your current subscription plan or feature flags do not allow access to this feature.',
    content: `
      <p class="text-sm text-secondary mb-4">Please contact your administrator or upgrade your subscription plan to unlock access.</p>
      <div id="upgrade-btn"></div>
    `
  }).render();

  const btn = new ButtonComponent({
    text: 'Return to Dashboard',
    variant: 'primary',
    onClick: () => { window.location.hash = '#/dashboard'; }
  }).render();

  card.querySelector('#upgrade-btn').appendChild(btn);
  container.appendChild(card);
  return container;
}
