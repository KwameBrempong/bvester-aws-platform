// Automated Portfolio Management System for Bvester
// Handles portfolio rebalancing, risk management, and automated trading

const EventEmitter = require('events');

class PortfolioAutomation extends EventEmitter {
  constructor() {
    super();
    this.portfolios = new Map();
    this.automationRules = new Map();
    this.executionQueue = [];
    this.riskLimits = new Map();
    this.performanceTracking = new Map();
    this.initialize();
  }

  initialize() {
    console.log('🤖 Portfolio Automation System initializing...');
    this.setupDefaultRules();
    this.startAutomationEngine();
  }

  // Setup default automation rules
  setupDefaultRules() {
    this.automationRules.set('rebalancing', {
      enabled: true,
      frequency: 'monthly',
      threshold: 5, // 5% deviation triggers rebalancing
      method: 'threshold',
      constraints: {
        minTradeSize: 100,
        maxTradeSize: 10000,
        maxDailyTrades: 10
      }
    });

    this.automationRules.set('stopLoss', {
      enabled: true,
      threshold: -10, // -10% triggers stop loss
      trailingStop: true,
      trailingPercent: 5
    });

    this.automationRules.set('profitTaking', {
      enabled: true,
      targets: [
        { gain: 20, sellPercent: 25 },
        { gain: 50, sellPercent: 50 },
        { gain: 100, sellPercent: 75 }
      ]
    });

    this.automationRules.set('dollarCostAveraging', {
      enabled: true,
      frequency: 'weekly',
      amount: 500,
      assets: ['index_funds', 'blue_chips']
    });

    this.automationRules.set('taxOptimization', {
      enabled: true,
      harvestLosses: true,
      deferGains: true,
      washSaleAvoidance: true
    });
  }

  // Create automated portfolio
  async createAutomatedPortfolio(userId, config) {
    const portfolio = {
      id: `portfolio_${Date.now()}`,
      userId,
      created: new Date(),
      status: 'active',
      config: {
        strategy: config.strategy || 'balanced',
        riskLevel: config.riskLevel || 'moderate',
        automationLevel: config.automationLevel || 'semi-automated',
        targetAllocation: config.targetAllocation || this.getDefaultAllocation(config.riskLevel),
        rebalancingEnabled: config.rebalancingEnabled !== false,
        stopLossEnabled: config.stopLossEnabled !== false,
        notificationPreferences: config.notifications || 'all'
      },
      positions: [],
      cash: config.initialDeposit || 0,
      performance: {
        totalValue: config.initialDeposit || 0,
        totalReturn: 0,
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        yearlyChange: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      },
      history: [],
      nextRebalancing: this.calculateNextRebalancing()
    };

    this.portfolios.set(portfolio.id, portfolio);
    
    // Initialize risk limits
    this.setRiskLimits(portfolio.id, config.riskLevel);
    
    // Start tracking performance
    this.startPerformanceTracking(portfolio.id);
    
    this.emit('portfolioCreated', { portfolioId: portfolio.id, userId });
    
    return portfolio;
  }

  // Get default allocation based on risk level
  getDefaultAllocation(riskLevel) {
    const allocations = {
      conservative: {
        stocks: 30,
        bonds: 60,
        alternatives: 5,
        cash: 5
      },
      moderate: {
        stocks: 50,
        bonds: 35,
        alternatives: 10,
        cash: 5
      },
      aggressive: {
        stocks: 75,
        bonds: 15,
        alternatives: 8,
        cash: 2
      },
      veryAggressive: {
        stocks: 85,
        bonds: 5,
        alternatives: 9,
        cash: 1
      }
    };

    return allocations[riskLevel] || allocations.moderate;
  }

  // Calculate next rebalancing date
  calculateNextRebalancing(frequency = 'monthly') {
    const next = new Date();
    
    switch(frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    
    return next;
  }

  // Set risk limits for portfolio
  setRiskLimits(portfolioId, riskLevel) {
    const limits = {
      conservative: {
        maxPositionSize: 0.1, // 10% max per position
        maxSectorExposure: 0.25, // 25% max per sector
        maxLeverage: 1,
        maxVolatility: 0.1,
        minCash: 0.05
      },
      moderate: {
        maxPositionSize: 0.15,
        maxSectorExposure: 0.35,
        maxLeverage: 1.5,
        maxVolatility: 0.15,
        minCash: 0.03
      },
      aggressive: {
        maxPositionSize: 0.25,
        maxSectorExposure: 0.5,
        maxLeverage: 2,
        maxVolatility: 0.25,
        minCash: 0.01
      }
    };

    this.riskLimits.set(portfolioId, limits[riskLevel] || limits.moderate);
  }

  // Start automation engine
  startAutomationEngine() {
    // Check portfolios every minute
    setInterval(() => {
      this.checkAllPortfolios();
    }, 60000);

    // Execute queued trades every 30 seconds
    setInterval(() => {
      this.executeQueuedTrades();
    }, 30000);

    // Update performance metrics every 5 minutes
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 300000);
  }

  // Check all portfolios for automation triggers
  async checkAllPortfolios() {
    for (const [portfolioId, portfolio] of this.portfolios) {
      if (portfolio.status !== 'active') continue;

      // Check rebalancing
      if (portfolio.config.rebalancingEnabled) {
        await this.checkRebalancing(portfolioId);
      }

      // Check stop losses
      if (portfolio.config.stopLossEnabled) {
        await this.checkStopLosses(portfolioId);
      }

      // Check profit taking
      await this.checkProfitTargets(portfolioId);

      // Check risk limits
      await this.checkRiskLimits(portfolioId);

      // Check for optimization opportunities
      await this.checkOptimizationOpportunities(portfolioId);
    }
  }

  // Check if rebalancing is needed
  async checkRebalancing(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const currentAllocation = this.calculateCurrentAllocation(portfolio);
    const targetAllocation = portfolio.config.targetAllocation;
    const threshold = this.automationRules.get('rebalancing').threshold;

    let needsRebalancing = false;
    const rebalancingTrades = [];

    for (const asset in targetAllocation) {
      const current = currentAllocation[asset] || 0;
      const target = targetAllocation[asset];
      const deviation = Math.abs(current - target);

      if (deviation > threshold) {
        needsRebalancing = true;
        const tradeAmount = (target - current) * portfolio.performance.totalValue / 100;
        
        rebalancingTrades.push({
          asset,
          action: current > target ? 'SELL' : 'BUY',
          amount: Math.abs(tradeAmount),
          reason: 'rebalancing',
          currentPercent: current,
          targetPercent: target
        });
      }
    }

    if (needsRebalancing) {
      this.emit('rebalancingNeeded', {
        portfolioId,
        trades: rebalancingTrades,
        currentAllocation,
        targetAllocation
      });

      // Queue trades if fully automated
      if (portfolio.config.automationLevel === 'fully-automated') {
        rebalancingTrades.forEach(trade => {
          this.queueTrade(portfolioId, trade);
        });
      } else {
        // Notify user for approval
        this.requestUserApproval(portfolioId, rebalancingTrades);
      }
    }
  }

  // Calculate current allocation
  calculateCurrentAllocation(portfolio) {
    const allocation = {};
    const totalValue = portfolio.performance.totalValue;

    portfolio.positions?.forEach(position => {
      const assetClass = this.getAssetClass(position.ticker);
      allocation[assetClass] = (allocation[assetClass] || 0) + 
        (position.value / totalValue * 100);
    });

    allocation.cash = (portfolio.cash / totalValue * 100) || 0;

    return allocation;
  }

  // Get asset class for a ticker
  getAssetClass(ticker) {
    // Simplified classification
    const classifications = {
      'AAPL': 'stocks',
      'GOOGL': 'stocks',
      'MSFT': 'stocks',
      'BND': 'bonds',
      'AGG': 'bonds',
      'GLD': 'alternatives',
      'BTC': 'alternatives',
      'REITs': 'alternatives'
    };

    return classifications[ticker] || 'stocks';
  }

  // Check stop losses
  async checkStopLosses(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const stopLossRule = this.automationRules.get('stopLoss');
    
    portfolio.positions?.forEach(position => {
      const loss = ((position.currentPrice - position.purchasePrice) / position.purchasePrice) * 100;
      
      if (loss <= stopLossRule.threshold) {
        this.queueTrade(portfolioId, {
          ticker: position.ticker,
          action: 'SELL',
          quantity: position.quantity,
          reason: 'stop_loss',
          loss: loss
        });

        this.emit('stopLossTriggered', {
          portfolioId,
          position: position.ticker,
          loss: loss
        });
      }

      // Check trailing stop
      if (stopLossRule.trailingStop && position.highPrice) {
        const trailingLoss = ((position.currentPrice - position.highPrice) / position.highPrice) * 100;
        
        if (trailingLoss <= -stopLossRule.trailingPercent) {
          this.queueTrade(portfolioId, {
            ticker: position.ticker,
            action: 'SELL',
            quantity: position.quantity * 0.5, // Sell half
            reason: 'trailing_stop',
            loss: trailingLoss
          });
        }
      }
    });
  }

  // Check profit targets
  async checkProfitTargets(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const profitRule = this.automationRules.get('profitTaking');
    if (!profitRule.enabled) return;

    portfolio.positions?.forEach(position => {
      const gain = ((position.currentPrice - position.purchasePrice) / position.purchasePrice) * 100;
      
      profitRule.targets.forEach(target => {
        if (gain >= target.gain && !position.profitTaken?.[target.gain]) {
          const sellQuantity = position.quantity * (target.sellPercent / 100);
          
          this.queueTrade(portfolioId, {
            ticker: position.ticker,
            action: 'SELL',
            quantity: sellQuantity,
            reason: 'profit_taking',
            gain: gain,
            target: target.gain
          });

          // Mark profit as taken
          if (!position.profitTaken) position.profitTaken = {};
          position.profitTaken[target.gain] = true;

          this.emit('profitTargetReached', {
            portfolioId,
            position: position.ticker,
            gain: gain,
            soldPercent: target.sellPercent
          });
        }
      });
    });
  }

  // Check risk limits
  async checkRiskLimits(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    const limits = this.riskLimits.get(portfolioId);
    
    if (!portfolio || !limits) return;

    const violations = [];

    // Check position concentration
    portfolio.positions?.forEach(position => {
      const positionPercent = position.value / portfolio.performance.totalValue;
      
      if (positionPercent > limits.maxPositionSize) {
        violations.push({
          type: 'position_concentration',
          ticker: position.ticker,
          current: positionPercent,
          limit: limits.maxPositionSize,
          action: 'reduce_position'
        });
      }
    });

    // Check sector concentration
    const sectorExposure = this.calculateSectorExposure(portfolio);
    for (const [sector, exposure] of Object.entries(sectorExposure)) {
      if (exposure > limits.maxSectorExposure) {
        violations.push({
          type: 'sector_concentration',
          sector,
          current: exposure,
          limit: limits.maxSectorExposure,
          action: 'diversify'
        });
      }
    }

    // Check minimum cash
    const cashPercent = portfolio.cash / portfolio.performance.totalValue;
    if (cashPercent < limits.minCash) {
      violations.push({
        type: 'insufficient_cash',
        current: cashPercent,
        limit: limits.minCash,
        action: 'increase_cash'
      });
    }

    if (violations.length > 0) {
      this.emit('riskLimitViolation', {
        portfolioId,
        violations
      });

      // Auto-correct if fully automated
      if (portfolio.config.automationLevel === 'fully-automated') {
        this.autoCorrectRiskViolations(portfolioId, violations);
      }
    }
  }

  // Calculate sector exposure
  calculateSectorExposure(portfolio) {
    const sectors = {};
    const totalValue = portfolio.performance.totalValue;

    portfolio.positions?.forEach(position => {
      const sector = this.getPositionSector(position.ticker);
      sectors[sector] = (sectors[sector] || 0) + (position.value / totalValue);
    });

    return sectors;
  }

  // Get sector for a position
  getPositionSector(ticker) {
    // Simplified sector mapping
    const sectorMap = {
      'AAPL': 'Technology',
      'GOOGL': 'Technology',
      'MSFT': 'Technology',
      'JPM': 'Finance',
      'BAC': 'Finance',
      'JNJ': 'Healthcare',
      'PFE': 'Healthcare',
      'XOM': 'Energy',
      'CVX': 'Energy'
    };

    return sectorMap[ticker] || 'Other';
  }

  // Auto-correct risk violations
  async autoCorrectRiskViolations(portfolioId, violations) {
    violations.forEach(violation => {
      switch(violation.type) {
        case 'position_concentration':
          // Reduce position to limit
          const reduceAmount = (violation.current - violation.limit) * 
            this.portfolios.get(portfolioId).performance.totalValue;
          
          this.queueTrade(portfolioId, {
            ticker: violation.ticker,
            action: 'SELL',
            amount: reduceAmount,
            reason: 'risk_reduction'
          });
          break;

        case 'sector_concentration':
          // Flag for manual review - complex rebalancing needed
          this.requestUserApproval(portfolioId, [{
            action: 'REBALANCE_SECTOR',
            sector: violation.sector,
            recommendation: 'Reduce sector exposure through diversification'
          }]);
          break;

        case 'insufficient_cash':
          // Sell some positions to raise cash
          const cashNeeded = (violation.limit - violation.current) * 
            this.portfolios.get(portfolioId).performance.totalValue;
          
          this.raiseCash(portfolioId, cashNeeded);
          break;
      }
    });
  }

  // Check optimization opportunities
  async checkOptimizationOpportunities(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const opportunities = [];

    // Tax loss harvesting
    if (this.automationRules.get('taxOptimization').enabled) {
      const taxLossOpportunities = this.findTaxLossHarvestingOpportunities(portfolio);
      opportunities.push(...taxLossOpportunities);
    }

    // Dollar cost averaging
    const dcaRule = this.automationRules.get('dollarCostAveraging');
    if (dcaRule.enabled && this.shouldExecuteDCA(portfolio)) {
      opportunities.push({
        type: 'dollar_cost_averaging',
        amount: dcaRule.amount,
        assets: dcaRule.assets
      });
    }

    // Dividend reinvestment
    if (portfolio.pendingDividends > 0) {
      opportunities.push({
        type: 'dividend_reinvestment',
        amount: portfolio.pendingDividends
      });
    }

    if (opportunities.length > 0) {
      this.emit('optimizationOpportunities', {
        portfolioId,
        opportunities
      });

      // Execute if automated
      if (portfolio.config.automationLevel === 'fully-automated') {
        opportunities.forEach(opp => this.executeOptimization(portfolioId, opp));
      }
    }
  }

  // Find tax loss harvesting opportunities
  findTaxLossHarvestingOpportunities(portfolio) {
    const opportunities = [];
    const taxRule = this.automationRules.get('taxOptimization');

    portfolio.positions?.forEach(position => {
      const loss = position.currentPrice < position.purchasePrice ? 
        (position.purchasePrice - position.currentPrice) * position.quantity : 0;

      if (loss > 100 && taxRule.harvestLosses) { // Minimum $100 loss
        opportunities.push({
          type: 'tax_loss_harvesting',
          ticker: position.ticker,
          loss: loss,
          action: 'SELL_AND_REPLACE',
          replacement: this.findSimilarAsset(position.ticker)
        });
      }
    });

    return opportunities;
  }

  // Find similar asset for tax loss harvesting
  findSimilarAsset(ticker) {
    const similarAssets = {
      'SPY': 'VOO', // S&P 500 alternatives
      'VOO': 'SPY',
      'QQQ': 'VGT', // Tech sector alternatives
      'VGT': 'QQQ'
    };

    return similarAssets[ticker] || null;
  }

  // Should execute dollar cost averaging
  shouldExecuteDCA(portfolio) {
    const lastDCA = portfolio.lastDCA || new Date(0);
    const dcaFrequency = this.automationRules.get('dollarCostAveraging').frequency;
    const daysSinceLastDCA = (Date.now() - lastDCA) / (1000 * 60 * 60 * 24);

    switch(dcaFrequency) {
      case 'daily': return daysSinceLastDCA >= 1;
      case 'weekly': return daysSinceLastDCA >= 7;
      case 'monthly': return daysSinceLastDCA >= 30;
      default: return false;
    }
  }

  // Queue trade for execution
  queueTrade(portfolioId, trade) {
    this.executionQueue.push({
      portfolioId,
      trade,
      queued: new Date(),
      status: 'pending',
      priority: this.calculateTradePriority(trade)
    });

    // Sort queue by priority
    this.executionQueue.sort((a, b) => b.priority - a.priority);
  }

  // Calculate trade priority
  calculateTradePriority(trade) {
    const priorities = {
      'stop_loss': 100,
      'trailing_stop': 90,
      'risk_reduction': 80,
      'profit_taking': 70,
      'rebalancing': 60,
      'tax_loss_harvesting': 50,
      'dollar_cost_averaging': 40,
      'dividend_reinvestment': 30
    };

    return priorities[trade.reason] || 0;
  }

  // Execute queued trades
  async executeQueuedTrades() {
    const maxTradesPerCycle = 5;
    let tradesExecuted = 0;

    while (this.executionQueue.length > 0 && tradesExecuted < maxTradesPerCycle) {
      const queuedTrade = this.executionQueue.shift();
      
      if (queuedTrade.status === 'pending') {
        try {
          await this.executeTrade(queuedTrade);
          queuedTrade.status = 'executed';
          tradesExecuted++;
        } catch (error) {
          console.error('Trade execution failed:', error);
          queuedTrade.status = 'failed';
          queuedTrade.error = error.message;
        }
      }
    }
  }

  // Execute single trade
  async executeTrade(queuedTrade) {
    const { portfolioId, trade } = queuedTrade;
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Simulate trade execution
    const executionPrice = await this.getExecutionPrice(trade.ticker || trade.asset);
    const executionTime = new Date();

    const execution = {
      ...trade,
      executionPrice,
      executionTime,
      totalValue: trade.quantity ? trade.quantity * executionPrice : trade.amount,
      fees: this.calculateTradeFees(trade)
    };

    // Update portfolio
    if (trade.action === 'BUY') {
      this.addPosition(portfolio, execution);
    } else if (trade.action === 'SELL') {
      this.removePosition(portfolio, execution);
    }

    // Record in history
    portfolio.history.push(execution);

    // Update performance
    this.updatePortfolioPerformance(portfolioId);

    this.emit('tradeExecuted', {
      portfolioId,
      execution
    });

    return execution;
  }

  // Get execution price (simulated)
  async getExecutionPrice(ticker) {
    // In real implementation, this would fetch real market prices
    return 100 + Math.random() * 10;
  }

  // Calculate trade fees
  calculateTradeFees(trade) {
    const feeRate = 0.001; // 0.1% fee
    return (trade.amount || trade.quantity * 100) * feeRate;
  }

  // Add position to portfolio
  addPosition(portfolio, execution) {
    const existingPosition = portfolio.positions.find(p => p.ticker === execution.ticker);
    
    if (existingPosition) {
      // Average in
      const totalQuantity = existingPosition.quantity + execution.quantity;
      const totalCost = existingPosition.quantity * existingPosition.purchasePrice + 
                       execution.quantity * execution.executionPrice;
      
      existingPosition.quantity = totalQuantity;
      existingPosition.purchasePrice = totalCost / totalQuantity;
      existingPosition.lastUpdate = execution.executionTime;
    } else {
      // New position
      portfolio.positions.push({
        ticker: execution.ticker || execution.asset,
        quantity: execution.quantity || execution.amount / execution.executionPrice,
        purchasePrice: execution.executionPrice,
        currentPrice: execution.executionPrice,
        purchaseDate: execution.executionTime,
        lastUpdate: execution.executionTime,
        value: execution.totalValue
      });
    }

    // Update cash
    portfolio.cash -= execution.totalValue + execution.fees;
  }

  // Remove position from portfolio
  removePosition(portfolio, execution) {
    const positionIndex = portfolio.positions.findIndex(p => p.ticker === execution.ticker);
    
    if (positionIndex !== -1) {
      const position = portfolio.positions[positionIndex];
      
      if (execution.quantity >= position.quantity) {
        // Remove entire position
        portfolio.positions.splice(positionIndex, 1);
      } else {
        // Partial sale
        position.quantity -= execution.quantity;
        position.value = position.quantity * position.currentPrice;
      }

      // Update cash
      portfolio.cash += execution.totalValue - execution.fees;
    }
  }

  // Start performance tracking
  startPerformanceTracking(portfolioId) {
    // Update every hour
    setInterval(() => {
      this.updatePortfolioPerformance(portfolioId);
    }, 3600000);
  }

  // Update portfolio performance
  updatePortfolioPerformance(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    // Calculate total value
    let totalValue = portfolio.cash;
    portfolio.positions?.forEach(position => {
      position.currentPrice = this.getCurrentPrice(position.ticker);
      position.value = position.quantity * position.currentPrice;
      totalValue += position.value;
    });

    const previousValue = portfolio.performance.totalValue || totalValue;
    
    // Update performance metrics
    portfolio.performance = {
      totalValue,
      totalReturn: ((totalValue - portfolio.initialDeposit) / portfolio.initialDeposit) * 100,
      dailyChange: ((totalValue - previousValue) / previousValue) * 100,
      weeklyChange: this.calculatePeriodReturn(portfolio, 7),
      monthlyChange: this.calculatePeriodReturn(portfolio, 30),
      yearlyChange: this.calculatePeriodReturn(portfolio, 365),
      sharpeRatio: this.calculateSharpeRatio(portfolio),
      maxDrawdown: this.calculateMaxDrawdown(portfolio)
    };

    // Store performance snapshot
    if (!this.performanceTracking.has(portfolioId)) {
      this.performanceTracking.set(portfolioId, []);
    }
    
    this.performanceTracking.get(portfolioId).push({
      timestamp: new Date(),
      value: totalValue,
      return: portfolio.performance.totalReturn
    });
  }

  // Get current price (simulated)
  getCurrentPrice(ticker) {
    // In real implementation, this would fetch real market prices
    return 100 + Math.random() * 20 - 10;
  }

  // Calculate period return
  calculatePeriodReturn(portfolio, days) {
    const history = this.performanceTracking.get(portfolio.id) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const oldSnapshot = history.find(h => h.timestamp >= cutoffDate);
    if (!oldSnapshot) return 0;
    
    return ((portfolio.performance.totalValue - oldSnapshot.value) / oldSnapshot.value) * 100;
  }

  // Calculate Sharpe ratio
  calculateSharpeRatio(portfolio) {
    const riskFreeRate = 0.02; // 2% risk-free rate
    const returns = this.performanceTracking.get(portfolio.id)?.map(h => h.return) || [];
    
    if (returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
  }

  // Calculate maximum drawdown
  calculateMaxDrawdown(portfolio) {
    const history = this.performanceTracking.get(portfolio.id) || [];
    if (history.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = history[0].value;
    
    history.forEach(snapshot => {
      if (snapshot.value > peak) {
        peak = snapshot.value;
      }
      const drawdown = ((peak - snapshot.value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  }

  // Request user approval for trades
  requestUserApproval(portfolioId, trades) {
    this.emit('approvalRequired', {
      portfolioId,
      trades,
      timestamp: new Date()
    });
  }

  // Raise cash by selling positions
  raiseCash(portfolioId, amount) {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    // Sort positions by gain (sell winners first for tax efficiency)
    const sortedPositions = [...portfolio.positions].sort((a, b) => {
      const gainA = (a.currentPrice - a.purchasePrice) / a.purchasePrice;
      const gainB = (b.currentPrice - b.purchasePrice) / b.purchasePrice;
      return gainB - gainA;
    });

    let cashRaised = 0;
    const sellOrders = [];

    for (const position of sortedPositions) {
      if (cashRaised >= amount) break;

      const positionValue = position.value;
      const sellAmount = Math.min(positionValue, amount - cashRaised);
      const sellQuantity = (sellAmount / position.currentPrice);

      sellOrders.push({
        ticker: position.ticker,
        action: 'SELL',
        quantity: sellQuantity,
        reason: 'raise_cash',
        expectedProceeds: sellAmount
      });

      cashRaised += sellAmount;
    }

    sellOrders.forEach(order => this.queueTrade(portfolioId, order));
  }

  // Execute optimization
  executeOptimization(portfolioId, opportunity) {
    switch(opportunity.type) {
      case 'dollar_cost_averaging':
        opportunity.assets.forEach(asset => {
          this.queueTrade(portfolioId, {
            asset,
            action: 'BUY',
            amount: opportunity.amount / opportunity.assets.length,
            reason: 'dollar_cost_averaging'
          });
        });
        break;

      case 'dividend_reinvestment':
        this.queueTrade(portfolioId, {
          action: 'REINVEST_DIVIDENDS',
          amount: opportunity.amount,
          reason: 'dividend_reinvestment'
        });
        break;

      case 'tax_loss_harvesting':
        // Sell losing position
        this.queueTrade(portfolioId, {
          ticker: opportunity.ticker,
          action: 'SELL',
          reason: 'tax_loss_harvesting'
        });

        // Buy replacement if available
        if (opportunity.replacement) {
          this.queueTrade(portfolioId, {
            ticker: opportunity.replacement,
            action: 'BUY',
            amount: opportunity.loss,
            reason: 'tax_loss_replacement'
          });
        }
        break;
    }
  }

  // Update performance metrics (batch update)
  updatePerformanceMetrics() {
    for (const [portfolioId] of this.portfolios) {
      this.updatePortfolioPerformance(portfolioId);
    }
  }
}

module.exports = PortfolioAutomation;