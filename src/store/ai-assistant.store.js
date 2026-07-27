import { Store } from '../core/store.js';

export const aiAssistantStore = new Store({
  businessHealthScore: 92, // 0 - 100
  businessHealthStatus: 'EXCELLENT',
  healthMetrics: {
    revenueGrowth: '+14.2%',
    inventoryTurnover: '6.4x',
    netProfitMargin: '57.9%',
    cashLiquidity: 'HEALTHY'
  },
  salesPrediction: {
    forecastNext30Days: 21500.00,
    growthPercent: 16.5,
    topPredictedCategory: 'Dairy & Grocery',
    confidenceScore: 94
  },
  inventoryPrediction: {
    stockoutRiskCount: 2,
    atRiskItems: [
      { name: 'Arabica Coffee Beans 250g', daysUntilOut: 4, currentStock: 4, suggestedReorder: 25 },
      { name: 'Organic Whole Milk 1L', daysUntilOut: 6, currentStock: 24, suggestedReorder: 50 }
    ]
  },
  profitAnalysis: {
    marginBoostOpportunity: '+3.8%',
    recommendation: 'Increase margin on Beverages category by 4% to capture $720 additional monthly profit.'
  },
  expenseAnalysis: {
    anomalyCount: 1,
    anomalyDetails: 'Utilities expense spiked by 18% compared to last month average.'
  },
  customerInsights: {
    churnRiskCount: 12,
    vipCustomersCount: 45,
    repeatPurchaseRate: '68.4%'
  },
  productRecommendations: [
    { bundle: 'Whole Milk + Wheat Bread', discount: '5% Bundle Discount', expectedLift: '+12% AOV' },
    { bundle: 'Coffee Beans + Whole Milk', discount: 'Cross-Sell Prompt', expectedLift: '+18% Cross-Sell' }
  ],
  summaries: {
    daily: 'Executive Summary for Today: Gross sales reached $1,845.50 (+14.2% vs yesterday) across 38 orders. Top category: Dairy (40%). Active registers: 2. Low stock alert for Arabica Coffee Beans (4 left).',
    weekly: 'Weekly Performance Briefing: Total weekly revenue stands at $12,450.00 with a net profit margin of 58.2%. Customer footfall increased by 9.4%. Total loyalty points issued: 1,240 pts.',
    monthly: 'Monthly Executive Briefing: July 2026 performance reached $18,450.00 in POS sales revenue, exceeding target by 12.5%. Operating expenses remained controlled at $2,670.49. Net operating profit: $10,699.51.'
  },
  chatMessages: [
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello! I am your OmniPOS AI Business Assistant. I monitor your sales velocity, inventory levels, margins, and customer behavior in real-time. How can I assist your business today?',
      timestamp: 'Just now'
    }
  ],
  quickPrompts: [
    '🔮 Predict next month sales',
    '⚠️ Which items will run out of stock?',
    '💡 How to increase profit margin?',
    '👥 Show customer churn risks',
    '📅 Give me today\'s summary'
  ],
  isProcessing: false
});
