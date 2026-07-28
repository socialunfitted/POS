import { CardComponent } from '../components/base/card.component.js';
import { ButtonComponent } from '../components/base/button.component.js';

export async function NotFoundView() {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-center p-8';

  const card = new CardComponent({
    title: '404 - Page Not Found',
    subtitle: 'The route you requested does not exist.',
    content: `<div id="back-btn" class="mt-4"></div>`
  }).render();

  const btn = new ButtonComponent({
    text: 'Go to Dashboard',
    variant: 'primary',
    onClick: () => { window.location.hash = '#/dashboard'; }
  }).render();

  card.querySelector('#back-btn').appendChild(btn);
  container.appendChild(card);
  return container;
}
