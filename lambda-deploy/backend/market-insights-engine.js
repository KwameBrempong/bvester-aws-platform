// Real-time Market Insights Engine for Bvester
// Provides live market data, news analysis, and actionable insights

const EventEmitter = require('events');

class MarketInsightsEngine extends EventEmitter {
  constructor() {
    super();
    this.marketData = new Map();
    this.newsFeeds = new Map();
    this.insights = new Map();
    this.alerts = [];
    this.trendAnalysis = new Map();
    this.initialize();
  }

  initialize() {
    console.log('📊 Market Insights Engine initializing...');
    this.setupDataStreams();
    this.startRealTimeAnalysis();
    this.initializeAlertSystem();
  }

  // Setup data streams
  setupDataStreams() {
    // Market indices
    this.marketIndices = ['S&P500', 'NASDAQ', 'DOW', 'RUSSELL2000', 'VIX'];
    
    // Sectors to track
    this.sectors = [
      'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer',
      'Industrial', 'Materials', 'RealEstate', 'Utilities', 'Communications'
    ];

    // Asset classes
    this.assetClasses = ['Stocks', 'Bonds', 'Commodities', 'Crypto', 'Forex', 'REITs'];

    // Initialize with sample data
    this.initializeMarketData();
  }

  // Initialize market data
  initializeMarketData() {
    // Initialize indices
    this.marketIndices.forEach(index => {
      this.marketData.set(index, {
        current: this.getRandomPrice(index),
        open: this.getRandomPrice(index),
        high: this.getRandomPrice(index) * 1.02,
        low: this.getRandomPrice(index) * 0.98,
        change: 0,
        changePercent: 0,
        volume: Math.floor(Math.random() * 1000000000),
        timestamp: new Date(),
        trend: 'neutral',
        momentum: 0,
        volatility: Math.random() * 0.3
      });
    });

    // Initialize sectors
    this.sectors.forEach(sector => {
      this.marketData.set(sector, {
        performance: (Math.random() - 0.5) * 10,
        momentum: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 500000000),
        topMovers: this.generateTopMovers(sector),
        sentiment: this.getRandomSentiment(),
        news: []
      });
    });
  }

  // Get random price based on index
  getRandomPrice(index) {
    const basePrices = {
      'S&P500': 4500,
      'NASDAQ': 14000,
      'DOW': 35000,
      'RUSSELL2000': 2000,
      'VIX': 20
    };
    
    return basePrices[index] || 1000 + Math.random() * 1000;
  }

  // Generate top movers for a sector
  generateTopMovers(sector) {
    const tickers = {
      'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'],
      'Healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO'],
      'Finance': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
      'Consumer': ['AMZN', 'TSLA', 'WMT', 'HD', 'MCD']
    };

    const sectorTickers = tickers[sector] || ['STOCK1', 'STOCK2', 'STOCK3'];
    
    return sectorTickers.map(ticker => ({
      ticker,
      change: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 50000000),
      price: 100 + Math.random() * 400
    }));
  }

  // Get random sentiment
  getRandomSentiment() {
    const sentiments = ['Very Bullish', 'Bullish', 'Neutral', 'Bearish', 'Very Bearish'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  // Start real-time analysis
  startRealTimeAnalysis() {
    // Update market data every second
    setInterval(() => {
      this.updateMarketData();
      this.analyzeMarketConditions();
      this.detectPatterns();
    }, 1000);

    // Generate insights every 30 seconds
    setInterval(() => {
      this.generateMarketInsights();
    }, 30000);

    // Check for alerts every 10 seconds
    setInterval(() => {
      this.checkAlertConditions();
    }, 10000);

    // Update news feed every minute
    setInterval(() => {
      this.updateNewsFeeds();
    }, 60000);
  }

  // Update market data with simulated real-time changes
  updateMarketData() {
    // Update indices
    this.marketIndices.forEach(index => {
      const data = this.marketData.get(index);
      const changePercent = (Math.random() - 0.5) * 0.5; // ±0.25% change
      
      data.current = data.current * (1 + changePercent / 100);
      data.change = data.current - data.open;
      data.changePercent = (data.change / data.open) * 100;
      data.high = Math.max(data.high, data.current);
      data.low = Math.min(data.low, data.current);
      data.volume += Math.floor(Math.random() * 1000000);
      data.timestamp = new Date();
      data.momentum = this.calculateMomentum(data);
      data.trend = this.determineTrend(data);
      
      this.marketData.set(index, data);
    });

    // Update sectors
    this.sectors.forEach(sector => {
      const data = this.marketData.get(sector);
      
      data.performance += (Math.random() - 0.5) * 0.2;
      data.momentum = this.calculateSectorMomentum(data);
      data.volume += Math.floor(Math.random() * 5000000);
      
      // Update top movers
      data.topMovers.forEach(mover => {
        mover.change += (Math.random() - 0.5) * 0.5;
        mover.price *= (1 + mover.change / 1000);
        mover.volume += Math.floor(Math.random() * 500000);
      });
      
      this.marketData.set(sector, data);
    });

    this.emit('marketDataUpdated', this.marketData);
  }

  // Calculate momentum
  calculateMomentum(data) {
    const shortTermChange = data.changePercent;
    const volumeRatio = data.volume / 1000000000;
    return shortTermChange * volumeRatio;
  }

  // Calculate sector momentum
  calculateSectorMomentum(data) {
    const avgMoverChange = data.topMovers.reduce((sum, m) => sum + m.change, 0) / data.topMovers.length;
    return avgMoverChange * (data.volume / 500000000);
  }

  // Determine trend
  determineTrend(data) {
    if (data.changePercent > 1) return 'strongly_bullish';
    if (data.changePercent > 0.3) return 'bullish';
    if (data.changePercent < -1) return 'strongly_bearish';
    if (data.changePercent < -0.3) return 'bearish';
    return 'neutral';
  }

  // Analyze market conditions
  analyzeMarketConditions() {
    const conditions = {
      overall: '',
      volatility: '',
      momentum: '',
      breadth: '',
      volume: '',
      timestamp: new Date()
    };

    // Overall market condition
    const avgChange = Array.from(this.marketData.values())
      .filter(d => d.changePercent !== undefined)
      .reduce((sum, d) => sum + d.changePercent, 0) / this.marketIndices.length;

    if (avgChange > 1) conditions.overall = 'Risk-On';
    else if (avgChange < -1) conditions.overall = 'Risk-Off';
    else conditions.overall = 'Mixed';

    // Volatility assessment
    const vix = this.marketData.get('VIX');
    if (vix) {
      if (vix.current > 30) conditions.volatility = 'High';
      else if (vix.current > 20) conditions.volatility = 'Elevated';
      else conditions.volatility = 'Low';
    }

    // Market momentum
    const totalMomentum = Array.from(this.marketData.values())
      .filter(d => d.momentum !== undefined)
      .reduce((sum, d) => sum + d.momentum, 0);

    if (totalMomentum > 5) conditions.momentum = 'Strong Positive';
    else if (totalMomentum < -5) conditions.momentum = 'Strong Negative';
    else conditions.momentum = 'Neutral';

    // Market breadth
    const advancing = Array.from(this.marketData.values())
      .filter(d => d.changePercent > 0).length;
    const declining = Array.from(this.marketData.values())
      .filter(d => d.changePercent < 0).length;

    conditions.breadth = `${advancing}/${declining} Advancing/Declining`;

    // Volume analysis
    const totalVolume = Array.from(this.marketData.values())
      .filter(d => d.volume !== undefined)
      .reduce((sum, d) => sum + d.volume, 0);

    if (totalVolume > 10000000000) conditions.volume = 'Heavy';
    else if (totalVolume > 5000000000) conditions.volume = 'Above Average';
    else conditions.volume = 'Light';

    this.marketConditions = conditions;
    this.emit('marketConditionsAnalyzed', conditions);
  }

  // Detect market patterns
  detectPatterns() {
    const patterns = [];

    // Check for breakouts
    this.marketIndices.forEach(index => {
      const data = this.marketData.get(index);
      
      if (data.current > data.high * 0.99) {
        patterns.push({
          type: 'breakout',
          index,
          level: data.high,
          strength: 'strong',
          action: 'BUY_SIGNAL'
        });
      }
      
      if (data.current < data.low * 1.01) {
        patterns.push({
          type: 'breakdown',
          index,
          level: data.low,
          strength: 'strong',
          action: 'SELL_SIGNAL'
        });
      }
    });

    // Check for sector rotation
    const sectorPerformance = this.sectors.map(sector => ({
      sector,
      performance: this.marketData.get(sector).performance
    })).sort((a, b) => b.performance - a.performance);

    if (sectorPerformance[0].performance > 5 && sectorPerformance[sectorPerformance.length - 1].performance < -5) {
      patterns.push({
        type: 'sector_rotation',
        from: sectorPerformance[sectorPerformance.length - 1].sector,
        to: sectorPerformance[0].sector,
        strength: 'significant'
      });
    }

    // Check for divergences
    const sp500 = this.marketData.get('S&P500');
    const vix = this.marketData.get('VIX');
    
    if (sp500 && vix) {
      if (sp500.changePercent > 1 && vix.changePercent > 10) {
        patterns.push({
          type: 'divergence',
          description: 'Market rising with increasing volatility',
          implication: 'Potential reversal ahead'
        });
      }
    }

    if (patterns.length > 0) {
      this.emit('patternsDetected', patterns);
    }
  }

  // Generate market insights
  generateMarketInsights() {
    const insights = [];
    const timestamp = new Date();

    // Trend insights
    const bullishSectors = this.sectors.filter(s => 
      this.marketData.get(s).performance > 2
    );
    
    if (bullishSectors.length > 0) {
      insights.push({
        type: 'sector_opportunity',
        title: 'Strong Sector Performance',
        description: `${bullishSectors.join(', ')} showing strong momentum`,
        action: 'Consider increasing exposure',
        confidence: 0.75,
        timestamp
      });
    }

    // Volatility insights
    const vix = this.marketData.get('VIX');
    if (vix && vix.current < 15) {
      insights.push({
        type: 'volatility',
        title: 'Low Volatility Environment',
        description: 'Market complacency detected, consider hedging strategies',
        action: 'Buy protective puts or volatility ETFs',
        confidence: 0.8,
        timestamp
      });
    }

    // Volume insights
    const unusualVolume = Array.from(this.marketData.values())
      .filter(d => d.volume && d.volume > 1000000000);
    
    if (unusualVolume.length > 0) {
      insights.push({
        type: 'volume_surge',
        title: 'Unusual Trading Activity',
        description: 'Heavy volume detected across markets',
        action: 'Monitor for institutional moves',
        confidence: 0.7,
        timestamp
      });
    }

    // Momentum insights
    const strongMomentum = this.sectors.filter(s => 
      Math.abs(this.marketData.get(s).momentum) > 3
    );
    
    strongMomentum.forEach(sector => {
      const data = this.marketData.get(sector);
      insights.push({
        type: 'momentum',
        title: `${sector} Momentum Alert`,
        description: `${sector} showing ${data.momentum > 0 ? 'positive' : 'negative'} momentum`,
        action: data.momentum > 0 ? 'Follow the trend' : 'Consider taking profits',
        confidence: 0.65,
        timestamp
      });
    });

    // Correlation insights
    const correlations = this.calculateCorrelations();
    if (correlations.unusual.length > 0) {
      insights.push({
        type: 'correlation',
        title: 'Unusual Market Correlations',
        description: correlations.unusual.join(', '),
        action: 'Review portfolio diversification',
        confidence: 0.6,
        timestamp
      });
    }

    // Store and emit insights
    insights.forEach(insight => {
      this.insights.set(`${insight.type}_${Date.now()}`, insight);
    });

    this.emit('insightsGenerated', insights);
    return insights;
  }

  // Calculate correlations
  calculateCorrelations() {
    const correlations = {
      normal: [],
      unusual: []
    };

    // Check stock-bond correlation
    const sp500 = this.marketData.get('S&P500');
    const bonds = { changePercent: -sp500.changePercent * 0.3 }; // Simulated bond data
    
    if (sp500.changePercent > 0 && bonds.changePercent > 0) {
      correlations.unusual.push('Stocks and bonds moving together (unusual)');
    }

    // Check sector correlations
    const techPerf = this.marketData.get('Technology').performance;
    const financePerf = this.marketData.get('Finance').performance;
    
    if (Math.sign(techPerf) !== Math.sign(financePerf)) {
      correlations.normal.push('Tech and Finance showing normal divergence');
    }

    return correlations;
  }

  // Initialize alert system
  initializeAlertSystem() {
    this.alertRules = [
      {
        id: 'market_crash',
        condition: (data) => data.get('S&P500').changePercent < -3,
        priority: 'high',
        message: 'Market crash alert: S&P 500 down more than 3%'
      },
      {
        id: 'volatility_spike',
        condition: (data) => data.get('VIX').changePercent > 20,
        priority: 'high',
        message: 'Volatility spike: VIX up more than 20%'
      },
      {
        id: 'sector_breakdown',
        condition: (data) => {
          const weakSectors = this.sectors.filter(s => 
            data.get(s).performance < -5
          );
          return weakSectors.length >= 3;
        },
        priority: 'medium',
        message: 'Multiple sectors breaking down'
      },
      {
        id: 'momentum_shift',
        condition: (data) => {
          const momentumSum = Array.from(data.values())
            .reduce((sum, d) => sum + (d.momentum || 0), 0);
          return Math.abs(momentumSum) > 10;
        },
        priority: 'low',
        message: 'Significant momentum shift detected'
      }
    ];
  }

  // Check alert conditions
  checkAlertConditions() {
    const triggeredAlerts = [];

    this.alertRules.forEach(rule => {
      try {
        if (rule.condition(this.marketData)) {
          const alert = {
            id: rule.id,
            message: rule.message,
            priority: rule.priority,
            timestamp: new Date(),
            data: this.getAlertData(rule.id)
          };
          
          triggeredAlerts.push(alert);
          this.alerts.push(alert);
        }
      } catch (error) {
        console.error(`Error checking alert ${rule.id}:`, error);
      }
    });

    if (triggeredAlerts.length > 0) {
      this.emit('alertsTriggered', triggeredAlerts);
    }
  }

  // Get alert-specific data
  getAlertData(alertId) {
    switch(alertId) {
      case 'market_crash':
        return {
          sp500: this.marketData.get('S&P500'),
          nasdaq: this.marketData.get('NASDAQ')
        };
      case 'volatility_spike':
        return {
          vix: this.marketData.get('VIX')
        };
      default:
        return {};
    }
  }

  // Update news feeds
  updateNewsFeeds() {
    const newsItems = [
      {
        id: `news_${Date.now()}`,
        headline: this.generateNewsHeadline(),
        summary: 'Market analysis and expert commentary on recent developments',
        source: ['Bloomberg', 'Reuters', 'CNBC', 'WSJ'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        sentiment: this.getRandomSentiment(),
        impact: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        sectors: this.getRandomSectors(2)
      }
    ];

    newsItems.forEach(news => {
      this.newsFeeds.set(news.id, news);
      
      // Add to relevant sector news
      news.sectors.forEach(sector => {
        const sectorData = this.marketData.get(sector);
        if (sectorData) {
          sectorData.news.push(news);
          // Keep only last 5 news items
          if (sectorData.news.length > 5) {
            sectorData.news.shift();
          }
        }
      });
    });

    this.emit('newsUpdated', newsItems);
  }

  // Generate realistic news headline
  generateNewsHeadline() {
    const templates = [
      'Fed Signals Potential Rate Changes Amid Economic Data',
      'Tech Giants Report Strong Earnings, Market Responds',
      'Oil Prices Surge on Supply Concerns',
      'Inflation Data Comes in Line with Expectations',
      'Global Markets React to Geopolitical Tensions',
      'Banking Sector Shows Resilience Despite Challenges',
      'Renewable Energy Stocks Gain on Policy Support',
      'Retail Sales Data Exceeds Forecasts',
      'Manufacturing Index Points to Economic Expansion',
      'Currency Markets Volatile Ahead of Central Bank Meeting'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Get random sectors
  getRandomSectors(count) {
    const shuffled = [...this.sectors].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Get market summary
  getMarketSummary() {
    const summary = {
      timestamp: new Date(),
      indices: {},
      topGainers: [],
      topLosers: [],
      mostActive: [],
      sectorPerformance: {},
      marketConditions: this.marketConditions,
      alerts: this.alerts.slice(-5), // Last 5 alerts
      insights: Array.from(this.insights.values()).slice(-10) // Last 10 insights
    };

    // Indices summary
    this.marketIndices.forEach(index => {
      const data = this.marketData.get(index);
      summary.indices[index] = {
        current: data.current,
        change: data.change,
        changePercent: data.changePercent,
        trend: data.trend
      };
    });

    // Sector performance
    this.sectors.forEach(sector => {
      const data = this.marketData.get(sector);
      summary.sectorPerformance[sector] = {
        performance: data.performance,
        momentum: data.momentum,
        sentiment: data.sentiment
      };
    });

    // Top movers across all sectors
    const allMovers = [];
    this.sectors.forEach(sector => {
      const data = this.marketData.get(sector);
      allMovers.push(...data.topMovers);
    });

    // Sort for top gainers and losers
    const sortedMovers = allMovers.sort((a, b) => b.change - a.change);
    summary.topGainers = sortedMovers.slice(0, 5);
    summary.topLosers = sortedMovers.slice(-5).reverse();
    
    // Most active by volume
    summary.mostActive = allMovers
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    return summary;
  }

  // Subscribe to specific market data
  subscribe(type, symbols, callback) {
    const subscription = {
      id: `sub_${Date.now()}`,
      type,
      symbols,
      callback
    };

    // Set up real-time updates for this subscription
    const interval = setInterval(() => {
      const data = {};
      symbols.forEach(symbol => {
        if (this.marketData.has(symbol)) {
          data[symbol] = this.marketData.get(symbol);
        }
      });
      callback(data);
    }, 1000);

    subscription.interval = interval;
    return subscription;
  }

  // Unsubscribe from market data
  unsubscribe(subscription) {
    if (subscription && subscription.interval) {
      clearInterval(subscription.interval);
    }
  }

  // Get historical data (simulated)
  getHistoricalData(symbol, period = '1D') {
    const periods = {
      '1D': 390, // Minutes in trading day
      '1W': 5 * 390,
      '1M': 22 * 390,
      '3M': 66 * 390,
      '1Y': 252 * 390
    };

    const dataPoints = periods[period] || 390;
    const historical = [];
    const currentData = this.marketData.get(symbol);
    
    if (!currentData) return [];

    let price = currentData.current;
    const volatility = currentData.volatility || 0.02;

    for (let i = dataPoints; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility;
      price *= (1 + change);
      
      historical.push({
        timestamp: new Date(Date.now() - i * 60000), // 1 minute intervals
        open: price * (1 + (Math.random() - 0.5) * volatility / 10),
        high: price * (1 + Math.random() * volatility / 10),
        low: price * (1 - Math.random() * volatility / 10),
        close: price,
        volume: Math.floor(Math.random() * 1000000)
      });
    }

    return historical;
  }

  // Get market sentiment analysis
  getMarketSentiment() {
    const sentiment = {
      overall: '',
      fearGreedIndex: 0,
      components: {},
      signals: [],
      timestamp: new Date()
    };

    // Calculate Fear & Greed Index (0-100)
    const vix = this.marketData.get('VIX');
    const sp500 = this.marketData.get('S&P500');
    
    let fearGreedScore = 50; // Neutral start
    
    // VIX component (inverted)
    if (vix) {
      if (vix.current < 15) fearGreedScore += 20; // Low VIX = Greed
      else if (vix.current > 30) fearGreedScore -= 20; // High VIX = Fear
    }

    // Market momentum component
    if (sp500) {
      if (sp500.changePercent > 1) fearGreedScore += 15;
      else if (sp500.changePercent < -1) fearGreedScore -= 15;
    }

    // Breadth component
    const advancing = this.sectors.filter(s => 
      this.marketData.get(s).performance > 0
    ).length;
    
    fearGreedScore += (advancing - 5) * 5; // 5 is neutral (half of 10 sectors)

    // Volume component
    const avgVolume = Array.from(this.marketData.values())
      .reduce((sum, d) => sum + (d.volume || 0), 0) / this.marketData.size;
    
    if (avgVolume > 500000000) fearGreedScore += 10; // High volume = confidence

    // Normalize to 0-100
    fearGreedScore = Math.max(0, Math.min(100, fearGreedScore));
    sentiment.fearGreedIndex = fearGreedScore;

    // Determine overall sentiment
    if (fearGreedScore >= 80) sentiment.overall = 'Extreme Greed';
    else if (fearGreedScore >= 60) sentiment.overall = 'Greed';
    else if (fearGreedScore >= 40) sentiment.overall = 'Neutral';
    else if (fearGreedScore >= 20) sentiment.overall = 'Fear';
    else sentiment.overall = 'Extreme Fear';

    // Components breakdown
    sentiment.components = {
      volatility: vix ? (vix.current < 20 ? 'Low' : 'High') : 'Unknown',
      momentum: sp500 ? (sp500.changePercent > 0 ? 'Positive' : 'Negative') : 'Unknown',
      breadth: `${advancing}/10 sectors advancing`,
      volume: avgVolume > 500000000 ? 'Above Average' : 'Below Average'
    };

    // Generate signals based on sentiment
    if (fearGreedScore >= 80) {
      sentiment.signals.push({
        type: 'contrarian',
        message: 'Extreme greed detected - Consider taking profits',
        strength: 'strong'
      });
    } else if (fearGreedScore <= 20) {
      sentiment.signals.push({
        type: 'contrarian',
        message: 'Extreme fear detected - Potential buying opportunity',
        strength: 'strong'
      });
    }

    return sentiment;
  }
}

module.exports = MarketInsightsEngine;