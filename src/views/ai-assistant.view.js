import { aiAssistantStore } from '../store/ai-assistant.store.js';
import { aiAssistantService } from '../services/ai-assistant.service.js';
import { CardComponent } from '../components/base/card.component.js';
import { BadgeComponent } from '../components/base/badge.component.js';
import { ButtonComponent } from '../components/base/button.component.js';
import { InputComponent } from '../components/base/input.component.js';

export async function AIAssistantView() {
  const container = document.createElement('div');
  container.className = 'ai-assistant-view flex flex-col gap-6';

  let activeSummaryTab = 'daily'; // daily | weekly | monthly
  let inputQuery = '';

  // 1. Business Health & AI Predictive Insights Cards Grid
  const renderHealthAndInsights = () => {
    const { businessHealthScore, businessHealthStatus, salesPrediction, inventoryPrediction, profitAnalysis } = aiAssistantStore.getState();
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-4';

    grid.innerHTML = `
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Business Health Score</div>
        <div class="font-bold text-3xl text-success">${businessHealthScore} / 100</div>
        <div class="text-xs text-success mt-1 font-bold">STATUS: ${businessHealthStatus}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">30-Day Sales Prediction</div>
        <div class="font-bold text-2xl text-primary">$${salesPrediction.forecastNext30Days.toLocaleString()}</div>
        <div class="text-xs text-success mt-1">+${salesPrediction.growthPercent}% Forecasted Growth</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Inventory Stockout Risk</div>
        <div class="font-bold text-2xl text-warning">${inventoryPrediction.stockoutRiskCount} Items at Risk</div>
        <div class="text-xs text-warning mt-1">Stockout in 4-6 Days</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted mb-1">Margin Boost Potential</div>
        <div class="font-bold text-2xl text-info">${profitAnalysis.marginBoostOpportunity}</div>
        <div class="text-xs text-secondary mt-1">Cross-sell Optimization</div>
      </div>
    `;

    return grid;
  };

  container.appendChild(renderHealthAndInsights());

  // 2. Executive Summaries Widget Card
  const renderExecutiveSummaries = () => {
    const { summaries } = aiAssistantStore.getState();
    const card = new CardComponent({
      title: '📅 AI Executive Briefings & Summaries',
      subtitle: 'Automated AI-synthesized business summaries',
      content: `
        <div class="flex gap-2 mb-3">
          <button id="sum-daily-btn" class="btn btn-sm btn-primary">Daily Summary</button>
          <button id="sum-weekly-btn" class="btn btn-sm btn-secondary">Weekly Brief</button>
          <button id="sum-monthly-btn" class="btn btn-sm btn-secondary">Monthly Audit</button>
        </div>
        <div id="summary-content" class="p-3 bg-tertiary rounded text-xs leading-relaxed text-secondary font-mono">
          ${summaries.daily}
        </div>
      `
    }).render();

    const dailyBtn = card.querySelector('#sum-daily-btn');
    const weeklyBtn = card.querySelector('#sum-weekly-btn');
    const monthlyBtn = card.querySelector('#sum-monthly-btn');
    const contentEl = card.querySelector('#summary-content');

    const updateTabBtns = (tab) => {
      dailyBtn.className = `btn btn-sm ${tab === 'daily' ? 'btn-primary' : 'btn-secondary'}`;
      weeklyBtn.className = `btn btn-sm ${tab === 'weekly' ? 'btn-primary' : 'btn-secondary'}`;
      monthlyBtn.className = `btn btn-sm ${tab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`;
      contentEl.textContent = summaries[tab];
    };

    dailyBtn.addEventListener('click', () => updateTabBtns('daily'));
    weeklyBtn.addEventListener('click', () => updateTabBtns('weekly'));
    monthlyBtn.addEventListener('click', () => updateTabBtns('monthly'));

    return card;
  };

  container.appendChild(renderExecutiveSummaries());

  // 3. Interactive AI Chatbot Interface Card
  const chatCard = new CardComponent({
    title: '🤖 OmniPOS Conversational AI Assistant',
    subtitle: 'Ask questions in natural language about sales, stock, customers, or margins',
    content: `
      <!-- Quick Prompt Suggestion Chips -->
      <div class="flex items-center gap-2 flex-wrap mb-4" id="quick-chips-wrapper"></div>

      <!-- Chat Messages Stream -->
      <div id="chat-stream" class="flex flex-col gap-3 p-4 bg-tertiary rounded overflow-y-auto mb-4" style="height: 320px;"></div>

      <!-- Input Bar -->
      <div class="flex gap-2 items-center" id="chat-input-row"></div>
    `
  }).render();

  // Render Quick Prompt Chips
  const renderQuickChips = () => {
    const { quickPrompts } = aiAssistantStore.getState();
    const wrapper = chatCard.querySelector('#quick-chips-wrapper');
    wrapper.innerHTML = '';

    quickPrompts.forEach((prompt) => {
      const chip = document.createElement('button');
      chip.className = 'btn btn-secondary btn-sm';
      chip.textContent = prompt;
      chip.addEventListener('click', () => {
        aiAssistantService.sendMessage(prompt);
      });
      wrapper.appendChild(chip);
    });
  };

  // Render Chat Messages Stream
  const renderChatStream = () => {
    const { chatMessages, isProcessing } = aiAssistantStore.getState();
    const stream = chatCard.querySelector('#chat-stream');
    stream.innerHTML = '';

    chatMessages.forEach((msg) => {
      const bubble = document.createElement('div');
      const isUser = msg.sender === 'user';
      bubble.className = `flex flex-col max-w-lg ${isUser ? 'self-end items-end' : 'self-start items-start'}`;

      const textBubble = document.createElement('div');
      textBubble.className = `p-3 rounded-lg text-xs leading-relaxed ${isUser ? 'bg-primary text-white' : 'bg-secondary border text-primary'}`;
      textBubble.innerHTML = msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      const timeEl = document.createElement('span');
      timeEl.className = 'text-muted text-xs mt-1';
      timeEl.textContent = `${isUser ? 'You' : 'OmniPOS AI'} • ${msg.timestamp}`;

      bubble.appendChild(textBubble);
      bubble.appendChild(timeEl);
      stream.appendChild(bubble);
    });

    if (isProcessing) {
      const loader = document.createElement('div');
      loader.className = 'text-xs text-muted font-mono animate-pulse';
      loader.textContent = '🤖 AI Assistant is analyzing store telemetry...';
      stream.appendChild(loader);
    }

    stream.scrollTop = stream.scrollHeight;
  };

  // Render Chat Input Bar
  const renderInputBar = () => {
    const inputRow = chatCard.querySelector('#chat-input-row');
    inputRow.innerHTML = '';

    const input = new InputComponent({
      placeholder: '💬 Ask AI a business question (e.g. Predict sales for next month)...',
      value: inputQuery,
      onChange: (v) => { inputQuery = v; }
    }).render();
    input.style.flex = '1';

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && inputQuery) {
        aiAssistantService.sendMessage(inputQuery);
        inputQuery = '';
        input.querySelector('input').value = '';
      }
    });

    const sendBtn = new ButtonComponent({
      text: 'Send Query 🚀',
      variant: 'primary',
      onClick: () => {
        if (inputQuery) {
          aiAssistantService.sendMessage(inputQuery);
          inputQuery = '';
          input.querySelector('input').value = '';
        }
      }
    }).render();

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
  };

  renderQuickChips();
  renderChatStream();
  renderInputBar();

  // Subscribe to store updates
  aiAssistantStore.subscribe(() => {
    renderChatStream();
  });

  container.appendChild(chatCard);
  return container;
}
