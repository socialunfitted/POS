import { notificationsStore } from '../store/notifications.store.js';
import { notificationsService } from '../services/notifications.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';
import { ModalComponent } from '../components/base/modal.component.js';

export async function NotificationsView() {
  const container = document.createElement('div');
  container.className = 'notifications-view flex flex-col gap-6';

  let activeTypeFilter = 'all'; // all | low_stock | subscription | payment | customer | system

  // 1. Channel Dispatch Status Bar
  const renderChannelStatusCard = () => {
    const { channelsConfig } = notificationsStore.getState();
    const card = new CardComponent({
      title: '📡 Multi-Channel Dispatch Gateways',
      subtitle: 'Real-time routing status across In-App, Email, SMS & WhatsApp APIs',
      content: `
        <div class="grid grid-cols-4 gap-3 mt-2 text-xs">
          <div class="p-3 bg-tertiary rounded flex justify-between items-center">
            <span>🔔 ${channelsConfig.inApp.name}</span>
            <span class="badge badge-success">${channelsConfig.inApp.status}</span>
          </div>
          <div class="p-3 bg-tertiary rounded flex justify-between items-center">
            <span>✉️ ${channelsConfig.email.name}</span>
            <span class="badge badge-success">${channelsConfig.email.status}</span>
          </div>
          <div class="p-3 bg-tertiary rounded flex justify-between items-center">
            <span>📱 ${channelsConfig.sms.name}</span>
            <span class="badge badge-success">${channelsConfig.sms.status}</span>
          </div>
          <div class="p-3 bg-tertiary rounded flex justify-between items-center">
            <span>💬 ${channelsConfig.whatsapp.name}</span>
            <span class="badge badge-primary">${channelsConfig.whatsapp.status}</span>
          </div>
        </div>
      `
    }).render();

    return card;
  };

  container.appendChild(renderChannelStatusCard());

  // 2. Control & Filter Card
  const filterCard = new CardComponent({
    title: '🔔 Notification Center & Alert Stream',
    subtitle: 'Review and manage real-time store alerts',
    content: `
      <div class="flex items-center justify-between flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2 flex-wrap" id="type-tabs-flex"></div>

        <div class="flex items-center gap-2">
          <button id="mark-all-read-btn" class="btn btn-secondary btn-sm">✔️ Mark All Read</button>
          <button id="broadcast-btn" class="btn btn-primary btn-sm">➕ Broadcast Alert</button>
        </div>
      </div>
    `
  }).render();

  const typeTabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'low_stock', label: '⚠️ Low Stock' },
    { id: 'subscription', label: '💳 Subscription' },
    { id: 'payment', label: '💵 Payment Due' },
    { id: 'customer', label: '👥 Customer CRM' },
    { id: 'system', label: '🛡️ System Alerts' }
  ];

  const typeTabsFlex = filterCard.querySelector('#type-tabs-flex');

  const renderTabs = () => {
    typeTabsFlex.innerHTML = '';
    typeTabs.forEach((tab) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${tab.id === activeTypeFilter ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeTypeFilter = tab.id;
        renderTabs();
        renderNotificationsFeed();
      });
      typeTabsFlex.appendChild(btn);
    });
  };

  filterCard.querySelector('#mark-all-read-btn').addEventListener('click', () => {
    notificationsService.markAllAsRead();
    renderNotificationsFeed();
  });

  filterCard.querySelector('#broadcast-btn').addEventListener('click', () => openBroadcastModal());

  renderTabs();
  container.appendChild(filterCard);

  // 3. Notifications Feed Stream Container
  const feedContainer = document.createElement('div');
  feedContainer.className = 'notifications-feed flex flex-col gap-3';
  container.appendChild(feedContainer);

  const renderNotificationsFeed = () => {
    feedContainer.innerHTML = '';
    const { notifications } = notificationsStore.getState();

    const filtered = notifications.filter((n) => activeTypeFilter === 'all' || n.type === activeTypeFilter);

    if (filtered.length === 0) {
      feedContainer.innerHTML = `<div class="card p-6 text-center text-xs text-muted">No notifications in this filter view.</div>`;
      return;
    }

    filtered.forEach((n) => {
      const card = document.createElement('div');
      card.className = `card p-4 flex justify-between items-center ${n.isRead ? 'bg-secondary' : 'bg-tertiary border-l-4 border-primary'}`;

      card.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="text-xl mt-1">${getIconForType(n.type)}</div>
          <div>
            <div class="flex items-center gap-2">
              <strong class="text-sm ${n.isRead ? 'text-secondary' : 'text-primary'}">${n.title}</strong>
              ${!n.isRead ? '<span class="badge badge-primary">NEW</span>' : ''}
            </div>
            <div class="text-xs text-secondary mt-1">${n.message}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-muted text-xs">${n.timestamp}</span>
              ${n.channels.map((c) => `<span class="badge badge-secondary">${c.toUpperCase()}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${n.actionRoute ? `<a href="${n.actionRoute}" class="btn btn-secondary btn-sm">${n.actionLabel}</a>` : ''}
          ${!n.isRead ? `<button class="btn btn-primary btn-sm read-btn" data-id="${n.id}">✔️ Read</button>` : ''}
          <button class="btn btn-danger btn-sm del-btn" data-id="${n.id}">🗑️</button>
        </div>
      `;

      const readBtn = card.querySelector('.read-btn');
      if (readBtn) {
        readBtn.addEventListener('click', (e) => {
          notificationsService.markAsRead(e.target.dataset.id);
          renderNotificationsFeed();
        });
      }

      const delBtn = card.querySelector('.del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          notificationsService.clearNotification(e.target.dataset.id);
          renderNotificationsFeed();
        });
      }

      feedContainer.appendChild(card);
    });
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'low_stock': return '⚠️';
      case 'subscription': return '💳';
      case 'payment': return '💵';
      case 'customer': return '👥';
      case 'system': return '🛡️';
      default: return '🔔';
    }
  };

  // Broadcast Alert Modal Builder
  const openBroadcastModal = () => {
    let title = '';
    let message = '';
    let type = 'system';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-3 text-xs';

    content.innerHTML = `
      <div id="bc-title-in"></div>
      <div id="bc-msg-in"></div>
      <div class="input-group">
        <label class="input-label">Alert Type</label>
        <select class="select-field" id="bc-type-select">
          <option value="system">System Security Alert</option>
          <option value="low_stock">Low Stock Warning</option>
          <option value="payment">Payment Due Notice</option>
          <option value="customer">Customer Offer</option>
        </select>
      </div>
      <div id="send-bc-btn" class="mt-3"></div>
    `;

    const modal = new ModalComponent({ title: '📢 Broadcast Multi-Channel Alert', content });
    modal.open();

    const titleInput = new InputComponent({ label: 'Alert Title', placeholder: 'e.g. Flash Sale Announcement', onChange: (v) => { title = v; } }).render();
    const msgInput = new InputComponent({ label: 'Message Body', placeholder: 'Enter alert message content...', onChange: (v) => { message = v; } }).render();

    const btn = new ButtonComponent({
      text: 'Dispatch Alert Across All Channels',
      variant: 'primary',
      onClick: () => {
        if (title && message) {
          const select = content.querySelector('#bc-type-select');
          type = select.value;
          notificationsService.sendNotification({
            title,
            message,
            type,
            channels: ['in_app', 'email', 'sms', 'whatsapp']
          });
          modal.close();
          renderNotificationsFeed();
        }
      }
    }).render();

    content.querySelector('#bc-title-in').appendChild(titleInput);
    content.querySelector('#bc-msg-in').appendChild(msgInput);
    content.querySelector('#send-bc-btn').appendChild(btn);
  };

  renderNotificationsFeed();
  return container;
}
