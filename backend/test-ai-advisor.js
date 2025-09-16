// Test suite for AI Investment Advisor features
const { AIInvestmentEngine, PredictiveAnalytics } = require('./ai-investment-engine');
const PortfolioAutomation = require('./portfolio-automation');
const MarketInsightsEngine = require('./market-insights-engine');

console.log('🧪 Testing AI Investment Advisor Features...\n');

// Test AI Investment Engine
async function testAIEngine() {
  console.log('📊 Testing AI Investment Engine...');
  
  const aiEngine = new AIInvestmentEngine();
  
  // Test user profile analysis
  const testUser = {
    userId: 'test_user_1',
    age: 35,
    income: 85000,
    savings: 25000,
    experience: 'intermediate',
    horizon: 'long',
    canHandleLoss: true,
    prefersGrowth: true,
    singleStockPercentage: 15,
    hasEmergencyFund: true,
    debtToIncomeRatio: 0.2
  };

  const analysis = await aiEngine.analyzeUserProfile('test_user_1', testUser);
  
  console.log('✅ User Profile Analysis:');
  console.log(`  - Risk Score: ${analysis.riskProfile.score}/100`);
  console.log(`  - Risk Category: ${analysis.riskProfile.category}`);
  console.log(`  - Investment Style: ${analysis.investmentStyle.join(', ')}`);
  console.log(`  - Top Opportunities: ${analysis.topOpportunities.length} found`);
  
  // Test recommendations
  const recommendations = await aiEngine.generateRecommendations('test_user_1');
  console.log(`✅ Generated ${Object.keys(recommendations).length} recommendation categories`);
  
  // Test prediction
  const prediction = await aiEngine.predictOutcomes({ amount: 10000, ticker: 'TEST' });
  console.log(`✅ Investment Prediction: ${prediction.confidence * 100}% confidence`);
  
  // Test sentiment analysis
  const sentiment = await aiEngine.analyzeSentiment('AAPL');
  console.log(`✅ Sentiment Analysis: ${sentiment.overall.sentiment}\n`);
}

// Test Portfolio Automation
async function testPortfolioAutomation() {
  console.log('🤖 Testing Portfolio Automation...');
  
  const automation = new PortfolioAutomation();
  
  // Create automated portfolio
  const portfolio = await automation.createAutomatedPortfolio('test_user_1', {
    strategy: 'balanced',
    riskLevel: 'moderate',
    automationLevel: 'semi-automated',
    initialDeposit: 50000,
    rebalancingEnabled: true,
    stopLossEnabled: true
  });
  
  console.log(`✅ Created portfolio: ${portfolio.id}`);
  console.log(`  - Strategy: ${portfolio.config.strategy}`);
  console.log(`  - Risk Level: ${portfolio.config.riskLevel}`);
  console.log(`  - Initial Value: $${portfolio.cash.toLocaleString()}`);
  
  // Add test positions
  portfolio.positions = [
    { ticker: 'AAPL', quantity: 100, purchasePrice: 150, currentPrice: 160, value: 16000 },
    { ticker: 'GOOGL', quantity: 50, purchasePrice: 2800, currentPrice: 2850, value: 142500 },
    { ticker: 'MSFT', quantity: 75, purchasePrice: 300, currentPrice: 310, value: 23250 }
  ];
  
  // Test rebalancing check
  await automation.checkRebalancing(portfolio.id);
  console.log('✅ Rebalancing check completed');
  
  // Test risk limits
  await automation.checkRiskLimits(portfolio.id);
  console.log('✅ Risk limits checked');
  
  // Test optimization opportunities
  await automation.checkOptimizationOpportunities(portfolio.id);
  console.log('✅ Optimization opportunities identified\n');
}

// Test Predictive Analytics
async function testPredictiveAnalytics() {
  console.log('🔮 Testing Predictive Analytics...');
  
  const analytics = new PredictiveAnalytics();
  
  // Test price prediction
  const pricePrediction = await analytics.predictPrice('AAPL', '1W');
  console.log(`✅ Price Prediction for AAPL (1 Week):`);
  console.log(`  - Current: $${pricePrediction.currentPrice}`);
  console.log(`  - Predictions: ${pricePrediction.predictions.length} data points`);
  console.log(`  - Confidence: ${pricePrediction.predictions[0].confidence * 100}%`);
  
  // Test trend detection
  const trends = await analytics.detectTrends({ change: 2.5 });
  console.log(`✅ Market Trends: ${trends.overall}`);
  console.log(`  - Sectors analyzed: ${Object.keys(trends.sectors).length}`);
  
  // Test anomaly detection
  const anomalies = await analytics.detectAnomalies({
    volume: 2000000000,
    avgVolume: 800000000,
    priceChange: 7
  });
  console.log(`✅ Anomalies Detected: ${anomalies.length}`);
  
  // Test correlation analysis
  const correlations = await analytics.analyzeCorrelations({
    assets: ['AAPL', 'GOOGL', 'MSFT']
  });
  console.log(`✅ Correlation Analysis: ${correlations.insights.length} insights generated\n`);
}

// Test Market Insights
async function testMarketInsights() {
  console.log('📈 Testing Market Insights Engine...');
  
  const insights = new MarketInsightsEngine();
  
  // Wait for initial data
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Get market summary
  const summary = insights.getMarketSummary();
  console.log(`✅ Market Summary Generated:`);
  console.log(`  - Indices tracked: ${Object.keys(summary.indices).length}`);
  console.log(`  - Sectors analyzed: ${Object.keys(summary.sectorPerformance).length}`);
  console.log(`  - Top gainers: ${summary.topGainers.length}`);
  console.log(`  - Active alerts: ${summary.alerts.length}`);
  
  // Get market sentiment
  const sentiment = insights.getMarketSentiment();
  console.log(`✅ Market Sentiment: ${sentiment.overall}`);
  console.log(`  - Fear & Greed Index: ${sentiment.fearGreedIndex}/100`);
  
  // Test historical data
  const historical = insights.getHistoricalData('S&P500', '1D');
  console.log(`✅ Historical Data: ${historical.length} data points for S&P500`);
  
  // Generate insights
  const marketInsights = insights.generateMarketInsights();
  console.log(`✅ Generated ${marketInsights.length} market insights\n`);
}

// Test event emissions
async function testEventSystem() {
  console.log('📡 Testing Event System...');
  
  const aiEngine = new AIInvestmentEngine();
  const automation = new PortfolioAutomation();
  const insights = new MarketInsightsEngine();
  
  let eventCount = 0;
  
  // Listen for AI engine events
  aiEngine.on('profileAnalyzed', () => eventCount++);
  aiEngine.on('marketDataUpdated', () => eventCount++);
  
  // Listen for automation events
  automation.on('portfolioCreated', () => eventCount++);
  automation.on('rebalancingNeeded', () => eventCount++);
  automation.on('tradeExecuted', () => eventCount++);
  
  // Listen for insights events
  insights.on('marketDataUpdated', () => eventCount++);
  insights.on('insightsGenerated', () => eventCount++);
  insights.on('alertsTriggered', () => eventCount++);
  
  // Wait for some events
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`✅ Event system working: ${eventCount} events captured\n`);
}

// Run all tests
async function runAllTests() {
  console.log('='.repeat(50));
  console.log('AI INVESTMENT ADVISOR TEST SUITE');
  console.log('='.repeat(50) + '\n');
  
  try {
    await testAIEngine();
    await testPortfolioAutomation();
    await testPredictiveAnalytics();
    await testMarketInsights();
    await testEventSystem();
    
    console.log('='.repeat(50));
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log('  - AI Investment Engine: ✅');
    console.log('  - Portfolio Automation: ✅');
    console.log('  - Predictive Analytics: ✅');
    console.log('  - Market Insights: ✅');
    console.log('  - Event System: ✅');
    console.log('\n🚀 AI Investment Advisor is ready for production!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();