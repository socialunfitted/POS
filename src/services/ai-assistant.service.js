import { aiAssistantStore } from '../store/ai-assistant.store.js';
import { eventBus } from '../core/event-bus.js';

/**
 * AI Business Assistant & Predictive Engine Service
 * Processes natural language queries, sales/inventory predictions, business health analysis, and executive summaries.
 */
export class AIAssistantService {
  /**
   * Process Natural Language User Query
   */
  async sendMessage(userQuery) {
    if (!userQuery || !userQuery.trim()) return;

    const query = userQuery.trim();
    const currentMessages = aiAssistantStore.getState().chatMessages;

    // 1. Add User Message to Chat Stream
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    aiAssistantStore.setState({
      chatMessages: [...currentMessages, userMsg],
      isProcessing: true
    });

    // Simulated AI response latency
    setTimeout(() => {
      const aiResponseText = this.generateAIResponse(query);
      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMsgs = aiAssistantStore.getState().chatMessages;
      aiAssistantStore.setState({
        chatMessages: [...updatedMsgs, aiMsg],
        isProcessing: false
      });
    }, 600);
  }

  /**
   * AI Response Intent Matcher & Engine
   */
  generateAIResponse(query) {
    const q = query.toLowerCase();
    const state = aiAssistantStore.getState();

    if (q.includes('predict') || q.includes('forecast') || q.includes('sales')) {
      return `🔮 **Sales Forecast Analysis:**\n\nBased on historical sales velocity and current demand trends, project sales for the next 30 days is **$${state.salesPrediction.forecastNext30Days.toLocaleString()}** (+${state.salesPrediction.growthPercent}% growth).\n\nTop growth driver: **${state.salesPrediction.topPredictedCategory}** (Confidence: ${state.salesPrediction.confidenceScore}%).`;
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('run out')) {
      return `⚠️ **Inventory Stockout Risk Alert:**\n\nAI predictive model detected **${state.inventoryPrediction.stockoutRiskCount} products** at risk of running out of stock within the next 7 days:\n\n1. **Arabica Coffee Beans 250g**: 4 units remaining (Est. stockout in 4 days). Suggested reorder: **25 units**.\n2. **Organic Whole Milk 1L**: 24 units remaining (Est. stockout in 6 days). Suggested reorder: **50 units**.`;
    }

    if (q.includes('profit') || q.includes('margin') || q.includes('increase')) {
      return `💡 **Profit Margin Optimization Insights:**\n\n- ${state.profitAnalysis.recommendation}\n- Potential Margin Boost: **${state.profitAnalysis.marginBoostOpportunity}**.\n- Recommendation: Bundle "Whole Milk" with "Wheat Bread" for a 5% discount to increase average order value by +12%.`;
    }

    if (q.includes('health') || q.includes('score')) {
      return `📊 **Business Health Score Card:**\n\nYour overall business health score is **92 / 100 (EXCELLENT)**.\n\n- Revenue Growth: **${state.healthMetrics.revenueGrowth}**\n- Inventory Turnover: **${state.healthMetrics.inventoryTurnover}**\n- Net Margin: **${state.healthMetrics.netProfitMargin}**\n- Cash Liquidity: **${state.healthMetrics.cashLiquidity}**`;
    }

    if (q.includes('summary') || q.includes('today') || q.includes('report')) {
      return `📅 **Today Executive Summary:**\n\n${state.summaries.daily}`;
    }

    if (q.includes('churn') || q.includes('customer')) {
      return `👥 **Customer Churn Insights:**\n\n- Identified **${state.customerInsights.churnRiskCount} customers** who haven't visited in 45+ days (Churn Risk: HIGH).\n- VIP Active Customers: **${state.customerInsights.vipCustomersCount}**\n- Repeat Purchase Rate: **${state.customerInsights.repeatPurchaseRate}**.\n\nSuggested action: Send a 10% discount WhatsApp offer to at-risk customers.`;
    }

    return `🤖 **AI Response:**\n\nI analyzed your query regarding "${query}". Based on your POS store telemetry:\n\n- Gross Monthly Revenue: **$18,450.00**\n- Active SKUs: **1,240**\n- Customer Retention Rate: **68.4%**\n\nIs there a specific metric or product line you would like me to deep-dive into?`;
  }
}

export const aiAssistantService = new AIAssistantService();
