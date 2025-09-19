// Enhanced Financial Health Analysis Engine for African SMEs
// Advanced business metrics, predictive analytics, and investment readiness scoring

export class FinancialMetricsCalculator {
  constructor(transactions = [], userProfile = {}) {
    this.transactions = transactions;
    this.userProfile = userProfile;
    this.currency = userProfile.currency || 'USD';
    this.country = userProfile.country || 'Nigeria';
  }

  // Core Financial Metrics
  calculateCashFlow() {
    const monthlyData = this.groupTransactionsByMonth();
    const cashFlow = {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      monthlyTrends: [],
      averageMonthlyIncome: 0,
      averageMonthlyExpenses: 0,
      cashFlowVolatility: 0
    };

    Object.keys(monthlyData).forEach(month => {
      const monthData = monthlyData[month];
      const income = monthData.income || 0;
      const expenses = monthData.expenses || 0;
      const net = income - expenses;

      cashFlow.totalIncome += income;
      cashFlow.totalExpenses += expenses;
      cashFlow.monthlyTrends.push({
        month,
        income,
        expenses,
        netCashFlow: net,
        date: new Date(month)
      });
    });

    cashFlow.netCashFlow = cashFlow.totalIncome - cashFlow.totalExpenses;
    
    if (cashFlow.monthlyTrends.length > 0) {
      cashFlow.averageMonthlyIncome = cashFlow.totalIncome / cashFlow.monthlyTrends.length;
      cashFlow.averageMonthlyExpenses = cashFlow.totalExpenses / cashFlow.monthlyTrends.length;
      
      // Calculate volatility (standard deviation of monthly net cash flows)
      const monthlyNets = cashFlow.monthlyTrends.map(trend => trend.netCashFlow);
      const avgNet = monthlyNets.reduce((sum, net) => sum + net, 0) / monthlyNets.length;
      const variance = monthlyNets.reduce((sum, net) => sum + Math.pow(net - avgNet, 2), 0) / monthlyNets.length;
      cashFlow.cashFlowVolatility = Math.sqrt(variance);
    }

    return cashFlow;
  }

  calculateProfitabilityRatios() {
    const cashFlow = this.calculateCashFlow();
    const ratios = {
      grossProfitMargin: 0, // (Revenue - COGS) / Revenue
      netProfitMargin: 0,   // Net Income / Revenue
      operatingMargin: 0,   // Operating Income / Revenue
      returnOnInvestment: 0, // Net Income / Initial Investment
      revenueGrowthRate: 0,
      profitabilityTrend: 'stable' // improving, declining, stable
    };

    if (cashFlow.totalIncome > 0) {
      ratios.netProfitMargin = (cashFlow.netCashFlow / cashFlow.totalIncome) * 100;
      
      // Simplified gross profit (sales revenue minus direct costs like inventory)
      const directCosts = this.getDirectCosts();
      const grossProfit = cashFlow.totalIncome - directCosts;
      ratios.grossProfitMargin = (grossProfit / cashFlow.totalIncome) * 100;
      
      // Calculate growth rate if we have multiple months
      if (cashFlow.monthlyTrends.length >= 2) {
        const sortedTrends = cashFlow.monthlyTrends.sort((a, b) => a.date - b.date);
        const firstMonth = sortedTrends[0].income;
        const lastMonth = sortedTrends[sortedTrends.length - 1].income;
        
        if (firstMonth > 0) {
          ratios.revenueGrowthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
        }
        
        // Determine trend
        const recentTrends = sortedTrends.slice(-3).map(t => t.netCashFlow);
        const isImproving = recentTrends.every((value, i) => i === 0 || value >= recentTrends[i - 1]);
        const isDeclining = recentTrends.every((value, i) => i === 0 || value <= recentTrends[i - 1]);
        
        ratios.profitabilityTrend = isImproving ? 'improving' : isDeclining ? 'declining' : 'stable';
      }
    }

    return ratios;
  }

  calculateLiquidityMetrics() {
    const cashFlow = this.calculateCashFlow();
    const currentCash = this.getCurrentCashPosition();
    
    return {
      currentCashPosition: currentCash,
      monthsOfExpensesCovered: cashFlow.averageMonthlyExpenses > 0 ? 
        currentCash / cashFlow.averageMonthlyExpenses : 0,
      cashFlowRatio: cashFlow.averageMonthlyIncome / (cashFlow.averageMonthlyExpenses || 1),
      liquidityRisk: this.assessLiquidityRisk(currentCash, cashFlow),
      emergencyFundRatio: this.calculateEmergencyFundRatio(currentCash, cashFlow)
    };
  }

  // Africa-Specific Metrics
  calculateAfricanMarketMetrics() {
    const mobileMoneyRatio = this.getMobileMoneyDependency();
    const forexExposure = this.getForexExposure();
    const regionalRisk = this.getRegionalRiskFactors();
    
    return {
      mobileMoneyDependency: mobileMoneyRatio,
      forexExposureRisk: forexExposure,
      regionalRiskScore: regionalRisk,
      afcftaReadiness: this.calculateAfcftaReadiness(),
      informalEconomyRatio: this.getInformalEconomyRatio(),
      seasonalityIndex: this.calculateSeasonalityIndex()
    };
  }

  getMobileMoneyDependency() {
    const mobileMoneyTransactions = this.transactions.filter(t => 
      t.paymentMethod === 'mobile_money'
    );
    
    const totalTransactionValue = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    const mobileMoneyValue = mobileMoneyTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return totalTransactionValue > 0 ? (mobileMoneyValue / totalTransactionValue) * 100 : 0;
  }

  getForexExposure() {
    const currencies = new Set(this.transactions.map(t => t.currency));
    const baseCurrency = this.currency;
    
    const foreignCurrencyValue = this.transactions
      .filter(t => t.currency !== baseCurrency)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalValue = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      exposurePercentage: totalValue > 0 ? (foreignCurrencyValue / totalValue) * 100 : 0,
      currencyCount: currencies.size,
      riskLevel: this.assessForexRisk(foreignCurrencyValue, totalValue)
    };
  }

  // Investment Readiness Score (1-100)
  calculateInvestmentReadinessScore() {
    const cashFlow = this.calculateCashFlow();
    const profitability = this.calculateProfitabilityRatios();
    const liquidity = this.calculateLiquidityMetrics();
    const africanMetrics = this.calculateAfricanMarketMetrics();
    
    let score = 0;
    const weights = {
      profitability: 25,
      cashFlowStability: 20,
      growthTrend: 15,
      recordKeeping: 15,
      liquidity: 10,
      marketPosition: 10,
      riskFactors: 5
    };

    // Profitability Score (0-25)
    if (profitability.netProfitMargin > 20) score += 25;
    else if (profitability.netProfitMargin > 10) score += 20;
    else if (profitability.netProfitMargin > 5) score += 15;
    else if (profitability.netProfitMargin > 0) score += 10;
    else score += 0;

    // Cash Flow Stability (0-20)
    const volatilityRatio = cashFlow.averageMonthlyIncome > 0 ? 
      cashFlow.cashFlowVolatility / cashFlow.averageMonthlyIncome : 1;
    
    if (volatilityRatio < 0.1) score += 20;
    else if (volatilityRatio < 0.2) score += 15;
    else if (volatilityRatio < 0.3) score += 10;
    else score += 5;

    // Growth Trend (0-15)
    if (profitability.revenueGrowthRate > 20) score += 15;
    else if (profitability.revenueGrowthRate > 10) score += 12;
    else if (profitability.revenueGrowthRate > 0) score += 8;
    else score += 3;

    // Record Keeping Quality (0-15)
    const recordQuality = this.assessRecordKeepingQuality();
    score += Math.min(15, recordQuality);

    // Liquidity (0-10)
    if (liquidity.monthsOfExpensesCovered > 6) score += 10;
    else if (liquidity.monthsOfExpensesCovered > 3) score += 8;
    else if (liquidity.monthsOfExpensesCovered > 1) score += 5;
    else score += 2;

    // Market Position (0-10)
    const marketScore = this.assessMarketPosition(africanMetrics);
    score += Math.min(10, marketScore);

    // Risk Factors (0-5, deducted)
    const riskDeduction = this.calculateRiskDeduction(africanMetrics);
    score = Math.max(0, score - riskDeduction);

    return {
      overallScore: Math.min(100, Math.round(score)),
      breakdown: {
        profitability: Math.min(weights.profitability, (profitability.netProfitMargin / 20) * weights.profitability),
        cashFlowStability: Math.min(weights.cashFlowStability, (1 - volatilityRatio) * weights.cashFlowStability),
        growthTrend: Math.min(weights.growthTrend, (profitability.revenueGrowthRate / 20) * weights.growthTrend),
        recordKeeping: recordQuality,
        liquidity: Math.min(weights.liquidity, (liquidity.monthsOfExpensesCovered / 6) * weights.liquidity),
        marketPosition: marketScore,
        riskFactors: -riskDeduction
      },
      recommendations: this.generateRecommendations(score, {cashFlow, profitability, liquidity, africanMetrics})
    };
  }

  // Helper Methods
  groupTransactionsByMonth() {
    const monthlyData = {};
    
    this.transactions.forEach(transaction => {
      const date = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, transfers: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });
    
    return monthlyData;
  }

  getDirectCosts() {
    return this.transactions
      .filter(t => t.type === 'expense' && ['inventory', 'equipment', 'transport'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getCurrentCashPosition() {
    // Simplified: assume net cash flow represents current position
    // In real app, this would come from bank account integration
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalIncome - totalExpenses;
  }

  assessLiquidityRisk(cash, cashFlow) {
    if (cash < 0) return 'critical';
    if (cashFlow.averageMonthlyExpenses > 0) {
      const monthsCovered = cash / cashFlow.averageMonthlyExpenses;
      if (monthsCovered < 1) return 'high';
      if (monthsCovered < 3) return 'medium';
      if (monthsCovered < 6) return 'low';
    }
    return 'very-low';
  }

  calculateEmergencyFundRatio(cash, cashFlow) {
    const recommendedFund = cashFlow.averageMonthlyExpenses * 3; // 3 months recommended
    return recommendedFund > 0 ? (cash / recommendedFund) * 100 : 0;
  }

  getRegionalRiskFactors() {
    const countryRiskScores = {
      'Nigeria': 65, 'South Africa': 70, 'Kenya': 75, 'Ghana': 80,
      'Rwanda': 85, 'Botswana': 90, 'Egypt': 60, 'Morocco': 75
    };
    
    return countryRiskScores[this.country] || 70;
  }

  calculateAfcftaReadiness() {
    const forexExposure = this.getForexExposure();
    const hasCrossBorderTx = this.transactions.some(t => 
      t.description?.toLowerCase().includes('export') || 
      t.description?.toLowerCase().includes('import')
    );
    
    let readiness = 30; // Base score
    if (forexExposure.currencyCount > 1) readiness += 20;
    if (hasCrossBorderTx) readiness += 30;
    if (this.transactions.length > 50) readiness += 20; // Volume readiness
    
    return Math.min(100, readiness);
  }

  getInformalEconomyRatio() {
    const cashTransactions = this.transactions.filter(t => t.paymentMethod === 'cash');
    const totalTransactions = this.transactions.length;
    
    return totalTransactions > 0 ? (cashTransactions.length / totalTransactions) * 100 : 0;
  }

  calculateSeasonalityIndex() {
    const monthlyData = this.groupTransactionsByMonth();
    const monthlyIncomes = Object.values(monthlyData).map(m => m.income);
    
    if (monthlyIncomes.length < 3) return 0;
    
    const avgIncome = monthlyIncomes.reduce((sum, income) => sum + income, 0) / monthlyIncomes.length;
    const deviations = monthlyIncomes.map(income => Math.abs(income - avgIncome));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    return avgIncome > 0 ? (avgDeviation / avgIncome) * 100 : 0;
  }

  assessRecordKeepingQuality() {
    let quality = 0;
    
    // Transaction frequency (more transactions = better record keeping)
    if (this.transactions.length > 100) quality += 5;
    else if (this.transactions.length > 50) quality += 4;
    else if (this.transactions.length > 20) quality += 3;
    else quality += 1;
    
    // Description completeness
    const descriptiveTransactions = this.transactions.filter(t => 
      t.description && t.description.length > 10
    );
    const descriptionRatio = descriptiveTransactions.length / this.transactions.length;
    quality += descriptionRatio * 5;
    
    // Category usage
    const categorizedTransactions = this.transactions.filter(t => 
      t.category && t.category !== 'other'
    );
    const categorizationRatio = categorizedTransactions.length / this.transactions.length;
    quality += categorizationRatio * 5;
    
    return Math.min(15, Math.round(quality));
  }

  assessForexRisk(foreignValue, totalValue) {
    const exposureRatio = totalValue > 0 ? foreignValue / totalValue : 0;
    
    if (exposureRatio > 0.5) return 'high';
    if (exposureRatio > 0.3) return 'medium';
    if (exposureRatio > 0.1) return 'low';
    return 'minimal';
  }

  assessMarketPosition(africanMetrics) {
    let score = 5; // Base score
    
    // AfCFTA readiness bonus
    if (africanMetrics.afcftaReadiness > 70) score += 3;
    else if (africanMetrics.afcftaReadiness > 50) score += 2;
    
    // Mobile money adoption (positive for African markets)
    if (africanMetrics.mobileMoneyDependency > 30) score += 2;
    
    return score;
  }

  calculateRiskDeduction(africanMetrics) {
    let deduction = 0;
    
    // High forex exposure risk
    if (africanMetrics.forexExposureRisk.riskLevel === 'high') deduction += 3;
    else if (africanMetrics.forexExposureRisk.riskLevel === 'medium') deduction += 1;
    
    // High informal economy dependence
    if (africanMetrics.informalEconomyRatio > 70) deduction += 2;
    
    return deduction;
  }

  generateRecommendations(score, metrics) {
    const recommendations = [];
    
    if (score < 30) {
      recommendations.push({
        priority: 'critical',
        category: 'profitability',
        title: 'Improve Profit Margins',
        description: 'Focus on increasing revenue or reducing costs to achieve positive cash flow'
      });
    }
    
    if (metrics.liquidity.monthsOfExpensesCovered < 3) {
      recommendations.push({
        priority: 'high',
        category: 'liquidity',
        title: 'Build Emergency Fund',
        description: 'Aim to save 3-6 months of operating expenses for financial stability'
      });
    }
    
    if (metrics.profitability.revenueGrowthRate < 5) {
      recommendations.push({
        priority: 'medium',
        category: 'growth',
        title: 'Focus on Growth',
        description: 'Develop strategies to increase revenue by at least 10% annually'
      });
    }
    
    if (metrics.africanMetrics.afcftaReadiness < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'expansion',
        title: 'Prepare for AfCFTA Opportunities',
        description: 'Consider cross-border trade preparation for African Continental Free Trade Area'
      });
    }
    
    return recommendations;
  }

  // Advanced Financial Analytics
  calculateAdvancedMetrics() {
    const cashFlow = this.calculateCashFlow();
    const profitability = this.calculateProfitabilityRatios();
    
    return {
      workingCapital: this.calculateWorkingCapital(),
      businessEfficiency: this.calculateEfficiencyRatios(),
      scalabilityIndex: this.calculateScalabilityIndex(),
      burnRate: this.calculateBurnRate(cashFlow),
      runway: this.calculateRunway(cashFlow),
      customerMetrics: this.calculateCustomerMetrics(),
      digitalReadiness: this.calculateDigitalReadiness()
    };
  }

  calculateWorkingCapital() {
    // Simplified working capital calculation based on cash flow patterns
    const recentTransactions = this.getRecentTransactions(30); // Last 30 days
    const receivables = recentTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const payables = recentTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const inventory = recentTransactions
      .filter(t => t.category === 'inventory')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentCash = this.getCurrentCashPosition();
    
    return {
      workingCapital: currentCash + receivables - payables,
      currentRatio: payables > 0 ? (currentCash + receivables) / payables : 0,
      quickRatio: payables > 0 ? currentCash / payables : 0,
      inventoryTurnover: this.calculateInventoryTurnover(inventory),
      cashConversionCycle: this.calculateCashConversionCycle()
    };
  }

  calculateEfficiencyRatios() {
    const cashFlow = this.calculateCashFlow();
    const monthlyData = this.groupTransactionsByMonth();
    
    // Asset turnover (simplified as revenue per transaction volume)
    const assetTurnover = this.transactions.length > 0 ? 
      cashFlow.totalIncome / this.transactions.length : 0;
    
    // Expense efficiency ratios
    const operatingExpenses = this.getOperatingExpenses();
    const salesExpenses = this.getSalesAndMarketingExpenses();
    
    return {
      assetTurnover,
      operatingExpenseRatio: cashFlow.totalIncome > 0 ? 
        operatingExpenses / cashFlow.totalIncome : 0,
      salesEfficiencyRatio: cashFlow.totalIncome > 0 ? 
        salesExpenses / cashFlow.totalIncome : 0,
      revenuePerTransaction: this.transactions.length > 0 ? 
        cashFlow.totalIncome / this.transactions.filter(t => t.type === 'income').length : 0,
      costPerAcquisition: this.calculateCustomerAcquisitionCost(),
      timeToRevenue: this.calculateTimeToRevenue()
    };
  }

  calculateScalabilityIndex() {
    const cashFlow = this.calculateCashFlow();
    const profitability = this.calculateProfitabilityRatios();
    
    // Factors that indicate scalability
    const digitalPaymentRatio = this.getDigitalPaymentRatio();
    const automationIndex = this.getAutomationIndex();
    const marketExpansionPotential = this.getMarketExpansionPotential();
    const operationalLeverage = this.getOperationalLeverage();
    
    let scalabilityScore = 0;
    
    // Revenue growth consistency (0-25 points)
    if (profitability.revenueGrowthRate > 30) scalabilityScore += 25;
    else if (profitability.revenueGrowthRate > 20) scalabilityScore += 20;
    else if (profitability.revenueGrowthRate > 10) scalabilityScore += 15;
    else if (profitability.revenueGrowthRate > 0) scalabilityScore += 10;
    
    // Digital infrastructure (0-25 points)
    scalabilityScore += digitalPaymentRatio > 70 ? 25 : digitalPaymentRatio * 0.35;
    
    // Operational efficiency (0-25 points)
    scalabilityScore += Math.min(25, automationIndex);
    
    // Market expansion (0-25 points)
    scalabilityScore += Math.min(25, marketExpansionPotential);
    
    return {
      overallScore: Math.min(100, Math.round(scalabilityScore)),
      factors: {
        revenueGrowth: profitability.revenueGrowthRate,
        digitalInfrastructure: digitalPaymentRatio,
        operationalAutomation: automationIndex,
        marketExpansion: marketExpansionPotential,
        operationalLeverage
      },
      recommendations: this.getScalabilityRecommendations(scalabilityScore)
    };
  }

  calculateBurnRate(cashFlow) {
    if (cashFlow.netCashFlow >= 0) return 0;
    
    // Monthly burn rate (negative cash flow)
    const monthlyBurn = Math.abs(cashFlow.netCashFlow) / (cashFlow.monthlyTrends.length || 1);
    
    // Trend analysis - is burn rate increasing or decreasing?
    const recentTrends = cashFlow.monthlyTrends.slice(-3);
    const burnTrend = recentTrends.length > 1 ? 
      (recentTrends[recentTrends.length - 1].netCashFlow - recentTrends[0].netCashFlow) / recentTrends.length :
      0;
    
    return {
      monthlyBurnRate: monthlyBurn,
      annualBurnRate: monthlyBurn * 12,
      burnTrend: burnTrend > 0 ? 'improving' : burnTrend < 0 ? 'worsening' : 'stable',
      burnRateChange: burnTrend
    };
  }

  calculateRunway(cashFlow) {
    const currentCash = this.getCurrentCashPosition();
    const burnRate = this.calculateBurnRate(cashFlow);
    
    if (burnRate.monthlyBurnRate <= 0 || currentCash <= 0) return null;
    
    const monthsRemaining = currentCash / burnRate.monthlyBurnRate;
    
    return {
      monthsRemaining: Math.max(0, monthsRemaining),
      runoutDate: new Date(Date.now() + (monthsRemaining * 30 * 24 * 60 * 60 * 1000)),
      criticalLevel: monthsRemaining < 6,
      warningLevel: monthsRemaining < 12,
      recommendations: monthsRemaining < 6 ? 
        ['Urgent: Secure funding or reduce expenses', 'Focus on revenue generation', 'Consider emergency cost cuts'] :
        monthsRemaining < 12 ?
        ['Plan funding strategy', 'Optimize expenses', 'Accelerate revenue growth'] :
        ['Monitor cash flow closely', 'Maintain healthy reserves']
    };
  }

  calculateCustomerMetrics() {
    // Extract customer insights from transaction patterns
    const customerTransactions = this.transactions.filter(t => t.customerId || t.customerInfo);
    const uniqueCustomers = new Set(customerTransactions.map(t => t.customerId || t.customerInfo?.id));
    
    const totalRevenue = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avgRevenuePerCustomer = uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0;
    
    // Customer retention estimation (customers with multiple transactions)
    const customerFrequency = {};
    customerTransactions.forEach(t => {
      const customerId = t.customerId || t.customerInfo?.id;
      customerFrequency[customerId] = (customerFrequency[customerId] || 0) + 1;
    });
    
    const repeatCustomers = Object.values(customerFrequency).filter(freq => freq > 1).length;
    const retentionRate = uniqueCustomers.size > 0 ? repeatCustomers / uniqueCustomers.size : 0;
    
    return {
      totalCustomers: uniqueCustomers.size,
      averageRevenuePerCustomer: avgRevenuePerCustomer,
      customerRetentionRate: retentionRate * 100,
      repeatCustomerRate: retentionRate * 100,
      customerLifetimeValue: this.calculateCustomerLifetimeValue(avgRevenuePerCustomer, retentionRate),
      customerAcquisitionTrend: this.calculateCustomerAcquisitionTrend()
    };
  }

  calculateDigitalReadiness() {
    const digitalPaymentRatio = this.getDigitalPaymentRatio();
    const mobileMoneyUsage = this.getMobileMoneyDependency();
    const onlinePresence = this.assessOnlinePresence();
    const dataQuality = this.assessDataQuality();
    
    let digitalScore = 0;
    
    // Payment digitization (0-30 points)
    digitalScore += digitalPaymentRatio * 0.3;
    
    // Mobile money adoption (0-25 points) - important for African markets
    digitalScore += mobileMoneyUsage > 50 ? 25 : mobileMoneyUsage * 0.5;
    
    // Data management (0-25 points)
    digitalScore += dataQuality;
    
    // Online presence (0-20 points)
    digitalScore += onlinePresence;
    
    return {
      overallScore: Math.min(100, Math.round(digitalScore)),
      breakdown: {
        paymentDigitization: digitalPaymentRatio,
        mobileMoneyAdoption: mobileMoneyUsage,
        dataManagement: dataQuality,
        onlinePresence: onlinePresence
      },
      recommendations: this.getDigitalReadinessRecommendations(digitalScore)
    };
  }

  // Industry Benchmarking System
  getIndustryBenchmarks() {
    const industry = this.userProfile.industry || 'general';
    const country = this.userProfile.country || 'Nigeria';
    
    return {
      industry,
      country,
      benchmarks: this.getIndustrySpecificBenchmarks(industry, country),
      countryAverages: this.getCountryAverages(country),
      africanAverages: this.getAfricanMarketAverages(),
      comparison: this.compareToIndustry(industry, country)
    };
  }

  getIndustrySpecificBenchmarks(industry, country) {
    // African SME industry benchmarks
    const benchmarks = {
      'retail': {
        netProfitMargin: { excellent: 15, good: 10, average: 5, poor: 0 },
        grossProfitMargin: { excellent: 40, good: 30, average: 20, poor: 10 },
        inventoryTurnover: { excellent: 12, good: 8, average: 6, poor: 4 },
        customerRetention: { excellent: 80, good: 60, average: 40, poor: 20 }
      },
      'manufacturing': {
        netProfitMargin: { excellent: 12, good: 8, average: 4, poor: 0 },
        grossProfitMargin: { excellent: 35, good: 25, average: 15, poor: 8 },
        inventoryTurnover: { excellent: 8, good: 6, average: 4, poor: 2 },
        operatingExpenseRatio: { excellent: 0.2, good: 0.3, average: 0.4, poor: 0.5 }
      },
      'services': {
        netProfitMargin: { excellent: 20, good: 15, average: 10, poor: 5 },
        grossProfitMargin: { excellent: 70, good: 60, average: 50, poor: 40 },
        customerRetention: { excellent: 90, good: 75, average: 60, poor: 40 },
        revenuePerEmployee: { excellent: 100000, good: 75000, average: 50000, poor: 25000 }
      },
      'agriculture': {
        netProfitMargin: { excellent: 18, good: 12, average: 8, poor: 3 },
        seasonalityIndex: { excellent: 20, good: 30, average: 50, poor: 80 },
        weatherRiskFactor: { excellent: 10, good: 20, average: 30, poor: 50 },
        exportReadiness: { excellent: 80, good: 60, average: 40, poor: 20 }
      },
      'technology': {
        netProfitMargin: { excellent: 25, good: 18, average: 12, poor: 5 },
        scalabilityIndex: { excellent: 90, good: 75, average: 60, poor: 40 },
        digitalReadiness: { excellent: 95, good: 85, average: 70, poor: 50 },
        burnRate: { excellent: 0, good: 5000, average: 15000, poor: 30000 }
      },
      'general': {
        netProfitMargin: { excellent: 15, good: 10, average: 6, poor: 2 },
        grossProfitMargin: { excellent: 40, good: 30, average: 20, poor: 12 },
        revenueGrowthRate: { excellent: 25, good: 15, average: 8, poor: 0 },
        cashFlowStability: { excellent: 0.1, good: 0.2, average: 0.3, poor: 0.5 }
      }
    };
    
    return benchmarks[industry] || benchmarks['general'];
  }

  compareToIndustry(industry, country) {
    const benchmarks = this.getIndustrySpecificBenchmarks(industry);
    const currentMetrics = {
      netProfitMargin: this.calculateProfitabilityRatios().netProfitMargin,
      grossProfitMargin: this.calculateProfitabilityRatios().grossProfitMargin,
      revenueGrowthRate: this.calculateProfitabilityRatios().revenueGrowthRate
    };
    
    const comparison = {};
    
    Object.keys(benchmarks).forEach(metric => {
      if (currentMetrics[metric] !== undefined) {
        const value = currentMetrics[metric];
        const benchmark = benchmarks[metric];
        
        let performance = 'poor';
        if (value >= benchmark.excellent) performance = 'excellent';
        else if (value >= benchmark.good) performance = 'good';
        else if (value >= benchmark.average) performance = 'average';
        
        comparison[metric] = {
          value,
          performance,
          benchmark: benchmark,
          percentile: this.calculatePercentile(value, benchmark)
        };
      }
    });
    
    return comparison;
  }

  // Predictive Analytics
  predictCashFlow(months = 6) {
    const cashFlow = this.calculateCashFlow();
    const trends = this.analyzeTrends();
    
    const predictions = [];
    let currentCash = this.getCurrentCashPosition();
    
    for (let i = 1; i <= months; i++) {
      const predictedIncome = this.predictMonthlyIncome(i, trends);
      const predictedExpenses = this.predictMonthlyExpenses(i, trends);
      const netFlow = predictedIncome - predictedExpenses;
      
      currentCash += netFlow;
      
      predictions.push({
        month: i,
        date: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)),
        predictedIncome,
        predictedExpenses,
        netCashFlow: netFlow,
        cumulativeCash: currentCash,
        confidence: this.calculatePredictionConfidence(i, trends)
      });
    }
    
    return {
      predictions,
      trends,
      riskFactors: this.identifyRiskFactors(predictions),
      opportunities: this.identifyOpportunities(predictions),
      recommendations: this.generatePredictiveRecommendations(predictions)
    };
  }

  // Risk Assessment Engine
  calculateComprehensiveRisk() {
    const cashFlow = this.calculateCashFlow();
    const profitability = this.calculateProfitabilityRatios();
    const liquidity = this.calculateLiquidityMetrics();
    const africanMetrics = this.calculateAfricanMarketMetrics();
    const advanced = this.calculateAdvancedMetrics();
    
    const riskFactors = {
      liquidityRisk: this.assessLiquidityRisk(liquidity.currentCashPosition, cashFlow),
      profitabilityRisk: this.assessProfitabilityRisk(profitability),
      operationalRisk: this.assessOperationalRisk(advanced),
      marketRisk: this.assessMarketRisk(africanMetrics),
      regulatoryRisk: this.assessRegulatoryRisk(),
      concentrationRisk: this.assessConcentrationRisk(),
      technologyRisk: this.assessTechnologyRisk(advanced.digitalReadiness)
    };
    
    const overallRisk = this.calculateOverallRiskScore(riskFactors);
    
    return {
      overallRiskScore: overallRisk,
      riskLevel: this.getRiskLevel(overallRisk),
      riskFactors,
      mitigation: this.generateRiskMitigationPlan(riskFactors),
      monitoring: this.generateRiskMonitoringPlan(riskFactors)
    };
  }
  // Helper methods for advanced analytics
  getRecentTransactions(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.transactions.filter(t => {
      const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return transactionDate >= cutoffDate;
    });
  }

  calculateInventoryTurnover(inventory) {
    const cogs = this.getDirectCosts();
    return inventory > 0 ? cogs / inventory : 0;
  }

  calculateCashConversionCycle() {
    // Simplified calculation for SMEs
    const paymentPeriod = this.getAveragePaymentPeriod();
    const collectionPeriod = this.getAverageCollectionPeriod();
    const inventoryPeriod = this.getAverageInventoryPeriod();
    
    return inventoryPeriod + collectionPeriod - paymentPeriod;
  }

  getOperatingExpenses() {
    return this.transactions
      .filter(t => t.type === 'expense' && ['rent', 'utilities', 'salaries', 'insurance'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getSalesAndMarketingExpenses() {
    return this.transactions
      .filter(t => t.type === 'expense' && ['marketing', 'advertising', 'sales'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calculateCustomerAcquisitionCost() {
    const marketingExpenses = this.getSalesAndMarketingExpenses();
    const newCustomers = this.getNewCustomerCount();
    
    return newCustomers > 0 ? marketingExpenses / newCustomers : 0;
  }

  calculateTimeToRevenue() {
    // Time between business start and first revenue
    const firstRevenue = this.transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    const businessStartDate = this.userProfile.businessStartDate || new Date();
    
    if (firstRevenue) {
      const revenueDate = firstRevenue.date?.toDate ? firstRevenue.date.toDate() : new Date(firstRevenue.date);
      return Math.max(0, (revenueDate - businessStartDate) / (1000 * 60 * 60 * 24)); // Days
    }
    
    return 0;
  }

  getDigitalPaymentRatio() {
    const digitalTransactions = this.transactions.filter(t => 
      ['card', 'bank_transfer', 'mobile_money', 'online'].includes(t.paymentMethod)
    );
    
    return this.transactions.length > 0 ? 
      (digitalTransactions.length / this.transactions.length) * 100 : 0;
  }

  getAutomationIndex() {
    // Estimate automation based on transaction patterns and categories
    const recurringTransactions = this.getRecurringTransactions();
    const totalTransactions = this.transactions.length;
    
    const automationScore = totalTransactions > 0 ? 
      (recurringTransactions.length / totalTransactions) * 100 : 0;
    
    return Math.min(25, automationScore);
  }

  getMarketExpansionPotential() {
    const forexExposure = this.getForexExposure();
    const afcftaReadiness = this.calculateAfcftaReadiness();
    const digitalReadiness = this.getDigitalPaymentRatio();
    
    return Math.min(25, (forexExposure.exposurePercentage + afcftaReadiness + digitalReadiness) / 3 * 0.25);
  }

  getOperationalLeverage() {
    const fixedCosts = this.getFixedCosts();
    const variableCosts = this.getVariableCosts();
    const totalCosts = fixedCosts + variableCosts;
    
    return totalCosts > 0 ? fixedCosts / totalCosts : 0;
  }

  assessOnlinePresence() {
    // Estimate based on digital transaction patterns
    const digitalRatio = this.getDigitalPaymentRatio();
    const onlineTransactions = this.transactions.filter(t => 
      t.description?.toLowerCase().includes('online') || 
      t.description?.toLowerCase().includes('website') ||
      t.paymentMethod === 'online'
    );
    
    const baseScore = digitalRatio > 50 ? 15 : digitalRatio * 0.3;
    const onlineBonus = onlineTransactions.length > 0 ? 5 : 0;
    
    return Math.min(20, baseScore + onlineBonus);
  }

  assessDataQuality() {
    return this.assessRecordKeepingQuality();
  }

  getScalabilityRecommendations(score) {
    const recommendations = [];
    
    if (score < 40) {
      recommendations.push('Focus on digital infrastructure development');
      recommendations.push('Automate key business processes');
    }
    
    if (score < 60) {
      recommendations.push('Improve operational efficiency');
      recommendations.push('Expand digital payment options');
    }
    
    if (score < 80) {
      recommendations.push('Prepare for market expansion');
      recommendations.push('Build cross-border capabilities');
    }
    
    return recommendations;
  }

  getDigitalReadinessRecommendations(score) {
    const recommendations = [];
    
    if (score < 50) {
      recommendations.push('Implement digital payment systems');
      recommendations.push('Improve data management practices');
    }
    
    if (score < 70) {
      recommendations.push('Increase mobile money adoption');
      recommendations.push('Develop online presence');
    }
    
    return recommendations;
  }

  calculateCustomerLifetimeValue(avgRevenue, retentionRate) {
    const monthlyRevenue = avgRevenue / 12;
    const customerLifespan = retentionRate > 0 ? 1 / (1 - retentionRate) : 1;
    
    return monthlyRevenue * customerLifespan * 12;
  }

  calculateCustomerAcquisitionTrend() {
    const monthlyData = this.groupTransactionsByMonth();
    const customerTrends = [];
    
    Object.keys(monthlyData).forEach(month => {
      const monthTransactions = this.transactions.filter(t => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === month;
      });
      
      const uniqueCustomers = new Set(
        monthTransactions
          .filter(t => t.customerId || t.customerInfo)
          .map(t => t.customerId || t.customerInfo?.id)
      ).size;
      
      customerTrends.push({ month, customers: uniqueCustomers });
    });
    
    return customerTrends;
  }

  getCountryAverages(country) {
    // African country economic indicators
    const countryData = {
      'Nigeria': { inflation: 15.7, gdpGrowth: 3.2, smeGrowthRate: 12 },
      'South Africa': { inflation: 7.1, gdpGrowth: 2.1, smeGrowthRate: 8 },
      'Kenya': { inflation: 9.2, gdpGrowth: 4.8, smeGrowthRate: 15 },
      'Ghana': { inflation: 31.7, gdpGrowth: 3.1, smeGrowthRate: 10 },
      'Rwanda': { inflation: 13.9, gdpGrowth: 8.2, smeGrowthRate: 18 }
    };
    
    return countryData[country] || countryData['Nigeria'];
  }

  getAfricanMarketAverages() {
    return {
      averageProfitMargin: 8.5,
      averageGrowthRate: 12.3,
      mobileMoneyAdoption: 45.2,
      informalEconomySize: 65.8,
      digitalReadiness: 42.1
    };
  }

  calculatePercentile(value, benchmark) {
    const values = Object.values(benchmark);
    const sortedValues = values.sort((a, b) => a - b);
    
    let percentile = 0;
    for (let i = 0; i < sortedValues.length; i++) {
      if (value >= sortedValues[i]) {
        percentile = ((i + 1) / sortedValues.length) * 100;
      }
    }
    
    return Math.round(percentile);
  }

  // Predictive Analytics Helper Methods
  analyzeTrends() {
    const monthlyData = this.groupTransactionsByMonth();
    const months = Object.keys(monthlyData).sort();
    
    if (months.length < 3) {
      return { income: 'insufficient_data', expenses: 'insufficient_data', confidence: 'low' };
    }
    
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expenses);
    
    return {
      income: this.calculateTrendDirection(incomeData),
      expenses: this.calculateTrendDirection(expenseData),
      seasonality: this.detectSeasonality(incomeData),
      volatility: this.calculateVolatility(incomeData),
      confidence: this.calculateTrendConfidence(incomeData, expenseData)
    };
  }

  predictMonthlyIncome(monthsAhead, trends) {
    const cashFlow = this.calculateCashFlow();
    const baseIncome = cashFlow.averageMonthlyIncome;
    
    if (trends.income === 'insufficient_data') return baseIncome;
    
    let prediction = baseIncome;
    
    // Apply trend
    if (trends.income === 'increasing') {
      prediction *= (1 + (0.05 * monthsAhead)); // 5% monthly growth
    } else if (trends.income === 'decreasing') {
      prediction *= (1 - (0.03 * monthsAhead)); // 3% monthly decline
    }
    
    // Apply seasonality
    if (trends.seasonality && trends.seasonality.strength > 0.3) {
      const seasonalFactor = this.getSeasonalFactor(monthsAhead, trends.seasonality);
      prediction *= seasonalFactor;
    }
    
    return Math.max(0, prediction);
  }

  predictMonthlyExpenses(monthsAhead, trends) {
    const cashFlow = this.calculateCashFlow();
    const baseExpenses = cashFlow.averageMonthlyExpenses;
    
    if (trends.expenses === 'insufficient_data') return baseExpenses;
    
    let prediction = baseExpenses;
    
    // Apply trend
    if (trends.expenses === 'increasing') {
      prediction *= (1 + (0.03 * monthsAhead)); // 3% monthly increase
    } else if (trends.expenses === 'decreasing') {
      prediction *= (1 - (0.02 * monthsAhead)); // 2% monthly decrease
    }
    
    return Math.max(0, prediction);
  }

  calculatePredictionConfidence(monthsAhead, trends) {
    let confidence = 80; // Base confidence
    
    // Reduce confidence for longer predictions
    confidence -= monthsAhead * 5;
    
    // Adjust based on data quality
    if (this.transactions.length < 50) confidence -= 20;
    if (trends.volatility > 0.5) confidence -= 15;
    if (trends.confidence === 'low') confidence -= 20;
    
    return Math.max(20, Math.min(95, confidence));
  }

  // Risk Assessment Helper Methods
  assessProfitabilityRisk(profitability) {
    let risk = 'low';
    
    if (profitability.netProfitMargin < 0) risk = 'critical';
    else if (profitability.netProfitMargin < 5) risk = 'high';
    else if (profitability.netProfitMargin < 10) risk = 'medium';
    
    return {
      level: risk,
      factors: [
        profitability.netProfitMargin < 5 ? 'Low profit margins' : null,
        profitability.revenueGrowthRate < 0 ? 'Declining revenue' : null,
        profitability.profitabilityTrend === 'declining' ? 'Worsening trend' : null
      ].filter(Boolean)
    };
  }

  assessOperationalRisk(advanced) {
    const factors = [];
    let riskLevel = 'low';
    
    if (advanced.burnRate && advanced.burnRate.monthlyBurnRate > 0) {
      factors.push('Negative cash flow');
      riskLevel = 'high';
    }
    
    if (advanced.digitalReadiness.overallScore < 50) {
      factors.push('Low digital readiness');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    if (advanced.scalabilityIndex.overallScore < 40) {
      factors.push('Limited scalability');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return { level: riskLevel, factors };
  }

  assessMarketRisk(africanMetrics) {
    const factors = [];
    let riskLevel = 'low';
    
    if (africanMetrics.forexExposureRisk.riskLevel === 'high') {
      factors.push('High forex exposure');
      riskLevel = 'high';
    }
    
    if (africanMetrics.seasonalityIndex > 50) {
      factors.push('High seasonality');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    if (africanMetrics.informalEconomyRatio > 70) {
      factors.push('High informal economy dependence');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return { level: riskLevel, factors };
  }

  assessRegulatoryRisk() {
    const country = this.userProfile.country || 'Nigeria';
    const industry = this.userProfile.industry || 'general';
    
    // Simplified regulatory risk based on country and industry
    const countryRisk = {
      'Nigeria': 'medium',
      'South Africa': 'medium',
      'Kenya': 'low',
      'Ghana': 'low',
      'Rwanda': 'low'
    };
    
    const industryRisk = {
      'financial': 'high',
      'healthcare': 'high',
      'technology': 'low',
      'retail': 'low',
      'general': 'medium'
    };
    
    return {
      level: countryRisk[country] || 'medium',
      factors: [`${country} regulatory environment`, `${industry} sector compliance`]
    };
  }

  assessConcentrationRisk() {
    // Customer concentration
    const customerMetrics = this.calculateCustomerMetrics();
    const factors = [];
    let riskLevel = 'low';
    
    if (customerMetrics.totalCustomers < 10) {
      factors.push('Limited customer base');
      riskLevel = 'high';
    }
    
    // Geographic concentration (simplified)
    const locations = new Set(this.transactions.map(t => t.location).filter(Boolean));
    if (locations.size < 3) {
      factors.push('Geographic concentration');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return { level: riskLevel, factors };
  }

  assessTechnologyRisk(digitalReadiness) {
    const factors = [];
    let riskLevel = 'low';
    
    if (digitalReadiness.overallScore < 30) {
      factors.push('Very low digital adoption');
      riskLevel = 'high';
    } else if (digitalReadiness.overallScore < 50) {
      factors.push('Limited digital infrastructure');
      riskLevel = 'medium';
    }
    
    if (digitalReadiness.breakdown.paymentDigitization < 30) {
      factors.push('Manual payment processes');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return { level: riskLevel, factors };
  }

  calculateOverallRiskScore(riskFactors) {
    const riskWeights = {
      liquidityRisk: 25,
      profitabilityRisk: 25,
      operationalRisk: 20,
      marketRisk: 15,
      regulatoryRisk: 10,
      concentrationRisk: 5,
      technologyRisk: 5
    };
    
    const riskValues = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(riskFactors).forEach(factor => {
      if (riskWeights[factor]) {
        const riskValue = riskValues[riskFactors[factor].level] || 1;
        totalScore += riskValue * riskWeights[factor];
        totalWeight += riskWeights[factor];
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 1;
  }

  getRiskLevel(score) {
    if (score >= 3.5) return 'critical';
    if (score >= 2.5) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
  }

  generateRiskMitigationPlan(riskFactors) {
    const plan = [];
    
    Object.keys(riskFactors).forEach(factor => {
      const risk = riskFactors[factor];
      if (risk.level === 'high' || risk.level === 'critical') {
        plan.push({
          riskType: factor,
          priority: risk.level,
          actions: this.getRiskMitigationActions(factor, risk)
        });
      }
    });
    
    return plan;
  }

  getRiskMitigationActions(riskType, risk) {
    const actionMap = {
      liquidityRisk: ['Build emergency fund', 'Improve collections', 'Secure credit line'],
      profitabilityRisk: ['Reduce costs', 'Increase prices', 'Improve efficiency'],
      operationalRisk: ['Digitize processes', 'Build redundancy', 'Staff training'],
      marketRisk: ['Diversify markets', 'Hedge currency', 'Monitor trends'],
      regulatoryRisk: ['Compliance audit', 'Legal consultation', 'Industry monitoring'],
      concentrationRisk: ['Customer diversification', 'Geographic expansion', 'Product diversification'],
      technologyRisk: ['Digital transformation', 'System upgrades', 'Cybersecurity']
    };
    
    return actionMap[riskType] || ['Monitor closely', 'Develop contingency plan'];
  }

  generateRiskMonitoringPlan(riskFactors) {
    return Object.keys(riskFactors).map(factor => ({
      riskType: factor,
      frequency: this.getMonitoringFrequency(riskFactors[factor].level),
      metrics: this.getRiskMonitoringMetrics(factor),
      triggers: this.getRiskTriggers(factor)
    }));
  }

  getMonitoringFrequency(riskLevel) {
    const frequency = {
      'critical': 'weekly',
      'high': 'bi-weekly',
      'medium': 'monthly',
      'low': 'quarterly'
    };
    
    return frequency[riskLevel] || 'monthly';
  }

  getRiskMonitoringMetrics(riskType) {
    const metrics = {
      liquidityRisk: ['Cash position', 'Payment delays', 'Collection rates'],
      profitabilityRisk: ['Profit margins', 'Revenue trends', 'Cost ratios'],
      operationalRisk: ['Process efficiency', 'Error rates', 'Automation level'],
      marketRisk: ['Market share', 'Competitive position', 'Economic indicators'],
      regulatoryRisk: ['Compliance status', 'Regulatory changes', 'Industry updates'],
      concentrationRisk: ['Customer concentration', 'Geographic spread', 'Product mix'],
      technologyRisk: ['System uptime', 'Security incidents', 'Digital adoption']
    };
    
    return metrics[riskType] || ['General performance indicators'];
  }

  getRiskTriggers(riskType) {
    const triggers = {
      liquidityRisk: ['Cash below 3 months expenses', 'Negative cash flow 2 consecutive months'],
      profitabilityRisk: ['Profit margin below 5%', 'Revenue decline >10%'],
      operationalRisk: ['Process downtime >24h', 'Error rate >5%'],
      marketRisk: ['Market share decline >15%', 'New major competitor'],
      regulatoryRisk: ['New regulation affecting business', 'Compliance violation'],
      concentrationRisk: ['Top customer >50% revenue', 'Single location >80% sales'],
      technologyRisk: ['System failure', 'Security breach', 'Digital score <30%']
    };
    
    return triggers[riskType] || ['Significant performance deviation'];
  }

  // Additional helper methods
  calculateTrendDirection(data) {
    if (data.length < 3) return 'insufficient_data';
    
    const recent = data.slice(-3);
    const earlier = data.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  detectSeasonality(data) {
    if (data.length < 12) return { strength: 0, pattern: 'none' };
    
    // Simple seasonality detection
    const monthlyAvgs = {};
    data.forEach((value, index) => {
      const month = index % 12;
      monthlyAvgs[month] = (monthlyAvgs[month] || []).concat(value);
    });
    
    const avgsByMonth = Object.keys(monthlyAvgs).map(month => 
      monthlyAvgs[month].reduce((sum, val) => sum + val, 0) / monthlyAvgs[month].length
    );
    
    const overallAvg = avgsByMonth.reduce((sum, val) => sum + val, 0) / avgsByMonth.length;
    const variations = avgsByMonth.map(avg => Math.abs(avg - overallAvg) / overallAvg);
    const avgVariation = variations.reduce((sum, val) => sum + val, 0) / variations.length;
    
    return {
      strength: avgVariation,
      pattern: avgVariation > 0.3 ? 'strong' : avgVariation > 0.15 ? 'moderate' : 'weak'
    };
  }

  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  calculateTrendConfidence(incomeData, expenseData) {
    const dataPoints = Math.min(incomeData.length, expenseData.length);
    
    if (dataPoints < 6) return 'low';
    if (dataPoints < 12) return 'medium';
    return 'high';
  }

  getSeasonalFactor(monthsAhead, seasonality) {
    // Simplified seasonal adjustment
    const month = (new Date().getMonth() + monthsAhead) % 12;
    const seasonalFactors = [0.9, 0.85, 1.1, 1.2, 1.15, 1.0, 0.95, 0.9, 1.05, 1.1, 1.2, 1.3]; // Example pattern
    
    return seasonalFactors[month] || 1.0;
  }

  identifyRiskFactors(predictions) {
    const risks = [];
    
    predictions.forEach((prediction, index) => {
      if (prediction.cumulativeCash < 0) {
        risks.push({
          type: 'cash_depletion',
          month: prediction.month,
          severity: 'high',
          description: 'Projected cash shortage'
        });
      }
      
      if (prediction.netCashFlow < -prediction.predictedIncome * 0.5) {
        risks.push({
          type: 'high_burn_rate',
          month: prediction.month,
          severity: 'medium',
          description: 'High negative cash flow'
        });
      }
    });
    
    return risks;
  }

  identifyOpportunities(predictions) {
    const opportunities = [];
    
    predictions.forEach((prediction, index) => {
      if (prediction.netCashFlow > prediction.predictedIncome * 0.2) {
        opportunities.push({
          type: 'surplus_cash',
          month: prediction.month,
          description: 'Opportunity for investment or expansion'
        });
      }
      
      if (index > 0 && prediction.predictedIncome > predictions[index - 1].predictedIncome * 1.1) {
        opportunities.push({
          type: 'revenue_growth',
          month: prediction.month,
          description: 'Strong revenue growth projected'
        });
      }
    });
    
    return opportunities;
  }

  generatePredictiveRecommendations(predictions) {
    const recommendations = [];
    
    const hasNegativeCash = predictions.some(p => p.cumulativeCash < 0);
    const hasGrowth = predictions.some((p, i) => i > 0 && p.predictedIncome > predictions[i-1].predictedIncome);
    
    if (hasNegativeCash) {
      recommendations.push({
        priority: 'high',
        title: 'Cash Flow Management',
        description: 'Projected cash shortages require immediate attention to funding or expense reduction'
      });
    }
    
    if (hasGrowth) {
      recommendations.push({
        priority: 'medium',
        title: 'Growth Preparation',
        description: 'Prepare for scaling operations to accommodate projected revenue growth'
      });
    }
    
    return recommendations;
  }

  getRecurringTransactions() {
    // Identify potentially recurring transactions by amount and description patterns
    const recurring = [];
    const transactionGroups = {};
    
    this.transactions.forEach(t => {
      const key = `${t.amount}_${t.category}_${t.type}`;
      if (!transactionGroups[key]) transactionGroups[key] = [];
      transactionGroups[key].push(t);
    });
    
    Object.values(transactionGroups).forEach(group => {
      if (group.length >= 3) { // Appears at least 3 times
        recurring.push(...group);
      }
    });
    
    return recurring;
  }

  getFixedCosts() {
    return this.transactions
      .filter(t => t.type === 'expense' && ['rent', 'insurance', 'subscriptions', 'salaries'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getVariableCosts() {
    return this.transactions
      .filter(t => t.type === 'expense' && ['inventory', 'materials', 'commissions'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNewCustomerCount() {
    // Estimate new customers from transaction patterns
    const customerTransactions = this.transactions.filter(t => t.customerId || t.customerInfo);
    const uniqueCustomers = new Set(customerTransactions.map(t => t.customerId || t.customerInfo?.id));
    
    return uniqueCustomers.size;
  }

  getAveragePaymentPeriod() {
    // Simplified: assume 30 days for SMEs
    return 30;
  }

  getAverageCollectionPeriod() {
    // Simplified: assume 45 days for SMEs
    return 45;
  }

  getAverageInventoryPeriod() {
    // Simplified: assume 60 days for SMEs
    return 60;
  }
}

// Utility functions for chart data preparation
export const prepareChartData = {
  cashFlowTrend: (cashFlowData) => {
    return cashFlowData.monthlyTrends.map(trend => ({
      month: trend.month,
      income: trend.income,
      expenses: trend.expenses,
      netCashFlow: trend.netCashFlow,
      date: trend.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));
  },
  
  categoryBreakdown: (transactions) => {
    const categoryTotals = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category: category.replace('_', ' ').toUpperCase(),
      amount,
      percentage: (amount / Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0)) * 100
    }));
  },
  
  profitabilityMetrics: (profitabilityData) => [
    { metric: 'Gross Profit Margin', value: profitabilityData.grossProfitMargin, target: 40 },
    { metric: 'Net Profit Margin', value: profitabilityData.netProfitMargin, target: 20 },
    { metric: 'Revenue Growth', value: profitabilityData.revenueGrowthRate, target: 15 }
  ]
};