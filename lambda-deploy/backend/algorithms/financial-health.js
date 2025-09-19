/**
 * BVESTER PLATFORM - FINANCIAL HEALTH ALGORITHM
 * Week 5: Financial Analysis Engine Implementation
 * Calculates comprehensive financial health scores for African SMEs
 * Generated: January 28, 2025
 */

const FirebaseService = require('../api/firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class FinancialHealthAlgorithm {
  constructor() {
    // Financial health scoring weights and configurations
    this.scoringWeights = {
      liquidity: 0.25,      // Cash flow and working capital
      profitability: 0.30,  // Revenue and profit margins
      growth: 0.20,         // Growth trends and trajectory
      stability: 0.15,      // Financial stability and consistency
      efficiency: 0.10      // Operational efficiency metrics
    };
    
    // Industry benchmarks for African SMEs
    this.industryBenchmarks = {
      'agriculture': {
        profitMargin: 0.15,
        currentRatio: 1.2,
        debtToEquity: 0.8,
        assetTurnover: 1.1,
        growthRate: 0.08
      },
      'manufacturing': {
        profitMargin: 0.12,
        currentRatio: 1.5,
        debtToEquity: 1.0,
        assetTurnover: 0.9,
        growthRate: 0.10
      },
      'technology': {
        profitMargin: 0.20,
        currentRatio: 2.0,
        debtToEquity: 0.5,
        assetTurnover: 1.3,
        growthRate: 0.25
      },
      'retail': {
        profitMargin: 0.08,
        currentRatio: 1.3,
        debtToEquity: 0.9,
        assetTurnover: 2.1,
        growthRate: 0.06
      },
      'services': {
        profitMargin: 0.18,
        currentRatio: 1.8,
        debtToEquity: 0.6,
        assetTurnover: 1.5,
        growthRate: 0.12
      },
      'healthcare': {
        profitMargin: 0.16,
        currentRatio: 1.6,
        debtToEquity: 0.7,
        assetTurnover: 1.0,
        growthRate: 0.09
      },
      'energy': {
        profitMargin: 0.14,
        currentRatio: 1.4,
        debtToEquity: 1.2,
        assetTurnover: 0.8,
        growthRate: 0.07
      },
      'default': {
        profitMargin: 0.15,
        currentRatio: 1.5,
        debtToEquity: 0.8,
        assetTurnover: 1.2,
        growthRate: 0.10
      }
    };
    
    // Regional economic factors for African markets
    this.regionalFactors = {
      'NG': { // Nigeria
        inflationRate: 0.18,
        gdpGrowth: 0.03,
        currencyStability: 0.7,
        businessEnvironment: 0.6,
        accessToFinance: 0.5
      },
      'KE': { // Kenya
        inflationRate: 0.09,
        gdpGrowth: 0.05,
        currencyStability: 0.8,
        businessEnvironment: 0.7,
        accessToFinance: 0.6
      },
      'GH': { // Ghana
        inflationRate: 0.31,
        gdpGrowth: 0.04,
        currencyStability: 0.6,
        businessEnvironment: 0.6,
        accessToFinance: 0.5
      },
      'ZA': { // South Africa
        inflationRate: 0.05,
        gdpGrowth: 0.02,
        currencyStability: 0.8,
        businessEnvironment: 0.8,
        accessToFinance: 0.7
      },
      'UG': { // Uganda
        inflationRate: 0.07,
        gdpGrowth: 0.06,
        currencyStability: 0.7,
        businessEnvironment: 0.6,
        accessToFinance: 0.4
      },
      'default': {
        inflationRate: 0.10,
        gdpGrowth: 0.04,
        currencyStability: 0.7,
        businessEnvironment: 0.6,
        accessToFinance: 0.5
      }
    };
    
    // Risk assessment categories
    this.riskCategories = {
      'very_low': { min: 85, max: 100, label: 'Very Low Risk', color: '#28a745' },
      'low': { min: 70, max: 84, label: 'Low Risk', color: '#6bcf7f' },
      'moderate': { min: 55, max: 69, label: 'Moderate Risk', color: '#ffc107' },
      'high': { min: 40, max: 54, label: 'High Risk', color: '#fd7e14' },
      'very_high': { min: 0, max: 39, label: 'Very High Risk', color: '#dc3545' }
    };
    
    // Financial health score thresholds
    this.healthThresholds = {
      excellent: 85,
      good: 70,
      fair: 55,
      poor: 40,
      critical: 25
    };
  }
  
  // ============================================================================
  // MAIN FINANCIAL HEALTH CALCULATION
  // ============================================================================
  
  /**
   * Calculate comprehensive financial health score
   */
  async calculateFinancialHealth(businessData) {
    try {
      console.log(`💰 Calculating financial health for business: ${businessData.businessId || 'Unknown'}`);
      
      // Validate input data
      const validation = this.validateFinancialData(businessData);
      if (!validation.valid) {
        throw new Error(`Invalid financial data: ${validation.errors.join(', ')}`);
      }
      
      // Get industry and regional context
      const industry = businessData.industry || 'default';
      const country = businessData.location?.country || 'default';
      const industryBenchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.default;
      const regionalFactor = this.regionalFactors[country] || this.regionalFactors.default;
      
      // Calculate individual component scores
      const liquidityScore = this.calculateLiquidityScore(businessData, industryBenchmark);
      const profitabilityScore = this.calculateProfitabilityScore(businessData, industryBenchmark);
      const growthScore = this.calculateGrowthScore(businessData, industryBenchmark);
      const stabilityScore = this.calculateStabilityScore(businessData, regionalFactor);
      const efficiencyScore = this.calculateEfficiencyScore(businessData, industryBenchmark);
      
      // Calculate weighted overall score
      const overallScore = (
        liquidityScore * this.scoringWeights.liquidity +
        profitabilityScore * this.scoringWeights.profitability +
        growthScore * this.scoringWeights.growth +
        stabilityScore * this.scoringWeights.stability +
        efficiencyScore * this.scoringWeights.efficiency
      );
      
      // Apply regional adjustment
      const adjustedScore = this.applyRegionalAdjustment(overallScore, regionalFactor);
      
      // Determine risk category and health status
      const riskCategory = this.determineRiskCategory(adjustedScore);
      const healthStatus = this.determineHealthStatus(adjustedScore);
      const investmentReadiness = this.calculateInvestmentReadiness(adjustedScore, businessData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        { liquidityScore, profitabilityScore, growthScore, stabilityScore, efficiencyScore },
        businessData,
        industryBenchmark
      );
      
      // Generate financial projections
      const projections = this.generateFinancialProjections(businessData, adjustedScore);
      
      // Create comprehensive result
      const result = {
        businessId: businessData.businessId,
        overallScore: Math.round(adjustedScore),
        healthStatus: healthStatus,
        riskCategory: riskCategory,
        investmentReadiness: investmentReadiness,
        
        // Component scores
        componentScores: {
          liquidity: Math.round(liquidityScore),
          profitability: Math.round(profitabilityScore),
          growth: Math.round(growthScore),
          stability: Math.round(stabilityScore),
          efficiency: Math.round(efficiencyScore)
        },
        
        // Financial ratios
        financialRatios: this.calculateFinancialRatios(businessData),
        
        // Benchmarking
        industryComparison: this.generateIndustryComparison(businessData, industryBenchmark),
        
        // Recommendations and insights
        recommendations: recommendations,
        
        // Financial projections
        projections: projections,
        
        // Metadata
        calculatedAt: new Date(),
        dataSource: businessData.dataSource || 'manual',
        industryBenchmark: industry,
        regionalContext: country
      };
      
      // Save financial health record
      await this.saveFinancialHealthRecord(result);
      
      console.log(`✅ Financial health calculated: ${adjustedScore.toFixed(1)}/100 (${healthStatus})`);
      
      return {
        success: true,
        financialHealth: result
      };
      
    } catch (error) {
      console.error('Error calculating financial health:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // COMPONENT SCORE CALCULATIONS
  // ============================================================================
  
  /**
   * Calculate liquidity score (cash flow and working capital)
   */
  calculateLiquidityScore(businessData, benchmark) {
    const financials = businessData.financials;
    
    // Current Ratio = Current Assets / Current Liabilities
    const currentRatio = financials.currentAssets / Math.max(financials.currentLiabilities, 1);
    const currentRatioScore = this.scoreAgainstBenchmark(currentRatio, benchmark.currentRatio, 'higher_better');
    
    // Quick Ratio = (Current Assets - Inventory) / Current Liabilities
    const quickRatio = (financials.currentAssets - (financials.inventory || 0)) / Math.max(financials.currentLiabilities, 1);
    const quickRatioScore = this.scoreAgainstBenchmark(quickRatio, benchmark.currentRatio * 0.8, 'higher_better');
    
    // Cash Flow Score
    const operatingCashFlow = financials.operatingCashFlow || (financials.revenue - financials.expenses);
    const cashFlowRatio = operatingCashFlow / Math.max(financials.revenue, 1);
    const cashFlowScore = Math.min(100, Math.max(0, cashFlowRatio * 500)); // 20% cash flow = 100 score
    
    // Working Capital Score
    const workingCapital = financials.currentAssets - financials.currentLiabilities;
    const workingCapitalRatio = workingCapital / Math.max(financials.revenue, 1);
    const workingCapitalScore = Math.min(100, Math.max(0, (workingCapitalRatio + 0.1) * 500));
    
    // Weighted liquidity score
    return (
      currentRatioScore * 0.3 +
      quickRatioScore * 0.2 +
      cashFlowScore * 0.3 +
      workingCapitalScore * 0.2
    );
  }
  
  /**
   * Calculate profitability score
   */
  calculateProfitabilityScore(businessData, benchmark) {
    const financials = businessData.financials;
    
    // Gross Profit Margin
    const grossProfitMargin = (financials.grossProfit || (financials.revenue - financials.cogs)) / Math.max(financials.revenue, 1);
    const grossMarginScore = this.scoreAgainstBenchmark(grossProfitMargin, benchmark.profitMargin * 1.5, 'higher_better');
    
    // Net Profit Margin
    const netProfit = financials.netProfit || (financials.revenue - financials.expenses);
    const netProfitMargin = netProfit / Math.max(financials.revenue, 1);
    const netMarginScore = this.scoreAgainstBenchmark(netProfitMargin, benchmark.profitMargin, 'higher_better');
    
    // Return on Assets (ROA)
    const roa = netProfit / Math.max(financials.totalAssets, 1);
    const roaScore = this.scoreAgainstBenchmark(roa, benchmark.profitMargin * 0.8, 'higher_better');
    
    // Return on Equity (ROE)
    const equity = financials.totalAssets - financials.totalLiabilities;
    const roe = netProfit / Math.max(equity, 1);
    const roeScore = this.scoreAgainstBenchmark(roe, benchmark.profitMargin * 1.2, 'higher_better');
    
    // EBITDA Margin
    const ebitda = netProfit + (financials.interest || 0) + (financials.taxes || 0) + (financials.depreciation || 0);
    const ebitdaMargin = ebitda / Math.max(financials.revenue, 1);
    const ebitdaScore = this.scoreAgainstBenchmark(ebitdaMargin, benchmark.profitMargin * 1.3, 'higher_better');
    
    // Weighted profitability score
    return (
      grossMarginScore * 0.2 +
      netMarginScore * 0.3 +
      roaScore * 0.2 +
      roeScore * 0.2 +
      ebitdaScore * 0.1
    );
  }
  
  /**
   * Calculate growth score
   */
  calculateGrowthScore(businessData, benchmark) {
    const historicalData = businessData.historicalFinancials || [];
    
    if (historicalData.length < 2) {
      // Use provided growth metrics if historical data is limited
      const revenueGrowth = businessData.growthMetrics?.revenueGrowth || 0;
      const customerGrowth = businessData.growthMetrics?.customerGrowth || 0;
      const marketExpansion = businessData.growthMetrics?.marketExpansion || 0;
      
      const revenueGrowthScore = this.scoreAgainstBenchmark(revenueGrowth, benchmark.growthRate, 'higher_better');
      const customerGrowthScore = this.scoreAgainstBenchmark(customerGrowth, benchmark.growthRate * 1.2, 'higher_better');
      const expansionScore = Math.min(100, marketExpansion * 20); // Market expansion bonus
      
      return (revenueGrowthScore * 0.5 + customerGrowthScore * 0.3 + expansionScore * 0.2);
    }
    
    // Calculate growth rates from historical data
    const revenueGrowthRates = this.calculateGrowthRates(historicalData.map(d => d.revenue));
    const profitGrowthRates = this.calculateGrowthRates(historicalData.map(d => d.netProfit || 0));
    const assetGrowthRates = this.calculateGrowthRates(historicalData.map(d => d.totalAssets));
    
    // Average growth rates
    const avgRevenueGrowth = this.calculateAverage(revenueGrowthRates);
    const avgProfitGrowth = this.calculateAverage(profitGrowthRates);
    const avgAssetGrowth = this.calculateAverage(assetGrowthRates);
    
    // Growth consistency (lower volatility is better)
    const revenueVolatility = this.calculateVolatility(revenueGrowthRates);
    const consistencyScore = Math.max(0, 100 - revenueVolatility * 200);
    
    // Score individual growth components
    const revenueGrowthScore = this.scoreAgainstBenchmark(avgRevenueGrowth, benchmark.growthRate, 'higher_better');
    const profitGrowthScore = this.scoreAgainstBenchmark(avgProfitGrowth, benchmark.growthRate * 1.1, 'higher_better');
    const assetGrowthScore = this.scoreAgainstBenchmark(avgAssetGrowth, benchmark.growthRate * 0.8, 'higher_better');
    
    // Weighted growth score
    return (
      revenueGrowthScore * 0.4 +
      profitGrowthScore * 0.3 +
      assetGrowthScore * 0.2 +
      consistencyScore * 0.1
    );
  }
  
  /**
   * Calculate stability score
   */
  calculateStabilityScore(businessData, regionalFactor) {
    const financials = businessData.financials;
    
    // Debt to Equity Ratio
    const equity = financials.totalAssets - financials.totalLiabilities;
    const debtToEquity = financials.totalLiabilities / Math.max(equity, 1);
    const debtScore = this.scoreAgainstBenchmark(debtToEquity, 1.0, 'lower_better');
    
    // Interest Coverage Ratio
    const ebit = (financials.netProfit || 0) + (financials.interest || 0) + (financials.taxes || 0);
    const interestCoverage = ebit / Math.max(financials.interest || 1, 1);
    const coverageScore = Math.min(100, Math.max(0, (interestCoverage - 1) * 20));
    
    // Revenue Stability (if historical data available)
    const historicalData = businessData.historicalFinancials || [];
    let stabilityScore = 70; // Default stability score
    
    if (historicalData.length >= 3) {
      const revenues = historicalData.map(d => d.revenue);
      const revenueVolatility = this.calculateVolatility(revenues);
      stabilityScore = Math.max(0, 100 - revenueVolatility * 100);
    }
    
    // Cash Position Score
    const cashRatio = (financials.cash || 0) / Math.max(financials.revenue, 1);
    const cashScore = Math.min(100, cashRatio * 500); // 20% cash to revenue = 100 score
    
    // Regional stability adjustment
    const businessEnvironmentBonus = regionalFactor.businessEnvironment * 10;
    const currencyStabilityBonus = regionalFactor.currencyStability * 10;
    
    // Weighted stability score
    const baseScore = (
      debtScore * 0.3 +
      coverageScore * 0.25 +
      stabilityScore * 0.25 +
      cashScore * 0.2
    );
    
    return Math.min(100, baseScore + businessEnvironmentBonus + currencyStabilityBonus);
  }
  
  /**
   * Calculate efficiency score
   */
  calculateEfficiencyScore(businessData, benchmark) {
    const financials = businessData.financials;
    
    // Asset Turnover Ratio
    const assetTurnover = financials.revenue / Math.max(financials.totalAssets, 1);
    const assetTurnoverScore = this.scoreAgainstBenchmark(assetTurnover, benchmark.assetTurnover, 'higher_better');
    
    // Inventory Turnover (if applicable)
    let inventoryTurnoverScore = 70; // Default for service businesses
    if (financials.inventory && financials.inventory > 0) {
      const inventoryTurnover = (financials.cogs || financials.revenue * 0.7) / financials.inventory;
      inventoryTurnoverScore = Math.min(100, Math.max(0, (inventoryTurnover - 2) * 15));
    }
    
    // Receivables Turnover
    const receivables = financials.accountsReceivable || financials.revenue * 0.1; // Estimate if not provided
    const receivablesTurnover = financials.revenue / Math.max(receivables, 1);
    const receivablesScore = Math.min(100, Math.max(0, (receivablesTurnover - 4) * 10));
    
    // Operating Expense Ratio
    const operatingExpenses = financials.operatingExpenses || (financials.expenses - (financials.interest || 0) - (financials.taxes || 0));
    const opexRatio = operatingExpenses / Math.max(financials.revenue, 1);
    const opexScore = Math.max(0, 100 - opexRatio * 150); // Lower expenses = higher score
    
    // Employee Productivity (if data available)
    let productivityScore = 70; // Default
    if (businessData.employees && businessData.employees > 0) {
      const revenuePerEmployee = financials.revenue / businessData.employees;
      productivityScore = Math.min(100, Math.max(0, revenuePerEmployee / 1000)); // $1000 per employee = 1 point
    }
    
    // Weighted efficiency score
    return (
      assetTurnoverScore * 0.3 +
      inventoryTurnoverScore * 0.2 +
      receivablesScore * 0.2 +
      opexScore * 0.2 +
      productivityScore * 0.1
    );
  }
  
  // ============================================================================
  // HELPER FUNCTIONS AND UTILITIES
  // ============================================================================
  
  /**
   * Score metric against benchmark
   */
  scoreAgainstBenchmark(value, benchmark, direction = 'higher_better') {
    if (direction === 'higher_better') {
      const ratio = value / Math.max(benchmark, 0.01);
      return Math.min(100, Math.max(0, ratio * 80 + 20));
    } else {
      const ratio = benchmark / Math.max(value, 0.01);
      return Math.min(100, Math.max(0, ratio * 80 + 20));
    }
  }
  
  /**
   * Calculate growth rates from array of values
   */
  calculateGrowthRates(values) {
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      const growthRate = (values[i] - values[i - 1]) / Math.max(values[i - 1], 1);
      growthRates.push(growthRate);
    }
    return growthRates;
  }
  
  /**
   * Calculate average of array
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Calculate volatility (standard deviation)
   */
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateAverage(squaredDiffs);
    return Math.sqrt(variance);
  }
  
  /**
   * Apply regional economic adjustment
   */
  applyRegionalAdjustment(score, regionalFactor) {
    // Adjust for regional economic conditions
    const inflationAdjustment = Math.max(-10, Math.min(5, (0.1 - regionalFactor.inflationRate) * 50));
    const gdpAdjustment = Math.max(-5, Math.min(10, (regionalFactor.gdpGrowth - 0.03) * 100));
    const financeAccessAdjustment = (regionalFactor.accessToFinance - 0.5) * 10;
    
    const totalAdjustment = inflationAdjustment + gdpAdjustment + financeAccessAdjustment;
    
    return Math.min(100, Math.max(0, score + totalAdjustment));
  }
  
  /**
   * Determine risk category from score
   */
  determineRiskCategory(score) {
    for (const [category, range] of Object.entries(this.riskCategories)) {
      if (score >= range.min && score <= range.max) {
        return {
          category: category,
          label: range.label,
          color: range.color,
          score: score
        };
      }
    }
    return this.riskCategories.very_high;
  }
  
  /**
   * Determine health status from score
   */
  determineHealthStatus(score) {
    if (score >= this.healthThresholds.excellent) return 'Excellent';
    if (score >= this.healthThresholds.good) return 'Good';
    if (score >= this.healthThresholds.fair) return 'Fair';
    if (score >= this.healthThresholds.poor) return 'Poor';
    return 'Critical';
  }
  
  /**
   * Calculate investment readiness score
   */
  calculateInvestmentReadiness(healthScore, businessData) {
    let readinessScore = healthScore * 0.7; // Base score from financial health
    
    // Add bonuses for investment-ready factors
    if (businessData.hasAuditedFinancials) readinessScore += 5;
    if (businessData.hasBusinessPlan) readinessScore += 3;
    if (businessData.hasLegalCompliance) readinessScore += 4;
    if (businessData.hasIntellectualProperty) readinessScore += 3;
    if (businessData.hasManagementTeam) readinessScore += 5;
    if (businessData.hasMarketTraction) readinessScore += 5;
    if (businessData.hasClearUseOfFunds) readinessScore += 5;
    
    return {
      score: Math.min(100, Math.round(readinessScore)),
      level: readinessScore >= 80 ? 'High' : readinessScore >= 60 ? 'Medium' : 'Low',
      factors: this.getReadinessFactors(businessData)
    };
  }
  
  /**
   * Generate improvement recommendations
   */
  generateRecommendations(componentScores, businessData, benchmark) {
    const recommendations = [];
    
    // Liquidity recommendations
    if (componentScores.liquidityScore < 60) {
      recommendations.push({
        category: 'Liquidity',
        priority: 'High',
        recommendation: 'Improve cash flow management by reducing payment terms to customers and negotiating longer payment terms with suppliers.',
        impact: 'Will improve working capital and reduce liquidity risk'
      });
    }
    
    // Profitability recommendations
    if (componentScores.profitabilityScore < 60) {
      recommendations.push({
        category: 'Profitability',
        priority: 'High',
        recommendation: 'Focus on margin improvement through cost optimization and premium pricing strategies.',
        impact: 'Will increase net profit margins and overall financial performance'
      });
    }
    
    // Growth recommendations
    if (componentScores.growthScore < 60) {
      recommendations.push({
        category: 'Growth',
        priority: 'Medium',
        recommendation: 'Develop strategic initiatives for market expansion and product diversification.',
        impact: 'Will accelerate revenue growth and market positioning'
      });
    }
    
    // Stability recommendations
    if (componentScores.stabilityScore < 60) {
      recommendations.push({
        category: 'Stability',
        priority: 'High',
        recommendation: 'Reduce debt burden and build cash reserves to improve financial stability.',
        impact: 'Will reduce financial risk and improve investor confidence'
      });
    }
    
    // Efficiency recommendations
    if (componentScores.efficiencyScore < 60) {
      recommendations.push({
        category: 'Efficiency',
        priority: 'Medium',
        recommendation: 'Implement operational improvements to increase asset utilization and productivity.',
        impact: 'Will improve return on assets and operational performance'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate financial projections
   */
  generateFinancialProjections(businessData, healthScore) {
    const currentRevenue = businessData.financials.revenue;
    const currentProfit = businessData.financials.netProfit || 0;
    
    // Project growth based on health score and industry factors
    const projectedGrowthRate = Math.max(0.02, Math.min(0.25, (healthScore / 100) * 0.15 + 0.05));
    
    const projections = [];
    for (let year = 1; year <= 3; year++) {
      const projectedRevenue = currentRevenue * Math.pow(1 + projectedGrowthRate, year);
      const projectedProfit = projectedRevenue * Math.max(0.05, (currentProfit / currentRevenue) * (1 + year * 0.01));
      
      projections.push({
        year: year,
        revenue: Math.round(projectedRevenue),
        profit: Math.round(projectedProfit),
        growthRate: projectedGrowthRate,
        confidence: Math.max(0.6, Math.min(0.95, healthScore / 100))
      });
    }
    
    return projections;
  }
  
  /**
   * Calculate financial ratios
   */
  calculateFinancialRatios(businessData) {
    const f = businessData.financials;
    const equity = f.totalAssets - f.totalLiabilities;
    
    return {
      // Liquidity Ratios
      currentRatio: f.currentAssets / Math.max(f.currentLiabilities, 1),
      quickRatio: (f.currentAssets - (f.inventory || 0)) / Math.max(f.currentLiabilities, 1),
      cashRatio: (f.cash || 0) / Math.max(f.currentLiabilities, 1),
      
      // Profitability Ratios
      grossMargin: ((f.grossProfit || (f.revenue - f.cogs)) / Math.max(f.revenue, 1)) * 100,
      netMargin: ((f.netProfit || 0) / Math.max(f.revenue, 1)) * 100,
      roa: ((f.netProfit || 0) / Math.max(f.totalAssets, 1)) * 100,
      roe: ((f.netProfit || 0) / Math.max(equity, 1)) * 100,
      
      // Efficiency Ratios
      assetTurnover: f.revenue / Math.max(f.totalAssets, 1),
      receivablesTurnover: f.revenue / Math.max(f.accountsReceivable || f.revenue * 0.1, 1),
      
      // Leverage Ratios
      debtToEquity: f.totalLiabilities / Math.max(equity, 1),
      debtToAssets: f.totalLiabilities / Math.max(f.totalAssets, 1),
      equityRatio: equity / Math.max(f.totalAssets, 1)
    };
  }
  
  /**
   * Generate industry comparison
   */
  generateIndustryComparison(businessData, benchmark) {
    const ratios = this.calculateFinancialRatios(businessData);
    
    return {
      profitMargin: {
        business: ratios.netMargin,
        industry: benchmark.profitMargin * 100,
        performance: ratios.netMargin > benchmark.profitMargin * 100 ? 'Above' : 'Below'
      },
      currentRatio: {
        business: ratios.currentRatio,
        industry: benchmark.currentRatio,
        performance: ratios.currentRatio > benchmark.currentRatio ? 'Above' : 'Below'
      },
      assetTurnover: {
        business: ratios.assetTurnover,
        industry: benchmark.assetTurnover,
        performance: ratios.assetTurnover > benchmark.assetTurnover ? 'Above' : 'Below'
      },
      debtToEquity: {
        business: ratios.debtToEquity,
        industry: benchmark.debtToEquity,
        performance: ratios.debtToEquity < benchmark.debtToEquity ? 'Better' : 'Worse'
      }
    };
  }
  
  /**
   * Get investment readiness factors
   */
  getReadinessFactors(businessData) {
    return {
      auditedFinancials: businessData.hasAuditedFinancials || false,
      businessPlan: businessData.hasBusinessPlan || false,
      legalCompliance: businessData.hasLegalCompliance || false,
      intellectualProperty: businessData.hasIntellectualProperty || false,
      managementTeam: businessData.hasManagementTeam || false,
      marketTraction: businessData.hasMarketTraction || false,
      useOfFunds: businessData.hasClearUseOfFunds || false
    };
  }
  
  /**
   * Validate financial data input
   */
  validateFinancialData(businessData) {
    const errors = [];
    
    if (!businessData.financials) {
      errors.push('Financial data is required');
      return { valid: false, errors };
    }
    
    const f = businessData.financials;
    
    // Required fields
    if (!f.revenue || f.revenue <= 0) errors.push('Revenue must be positive');
    if (!f.totalAssets || f.totalAssets <= 0) errors.push('Total assets must be positive');
    if (f.totalLiabilities < 0) errors.push('Total liabilities cannot be negative');
    if (!f.currentAssets || f.currentAssets < 0) errors.push('Current assets must be non-negative');
    if (!f.currentLiabilities || f.currentLiabilities < 0) errors.push('Current liabilities must be non-negative');
    
    // Logical consistency checks
    if (f.currentAssets > f.totalAssets) errors.push('Current assets cannot exceed total assets');
    if (f.currentLiabilities > f.totalLiabilities) errors.push('Current liabilities cannot exceed total liabilities');
    if (f.grossProfit && f.grossProfit > f.revenue) errors.push('Gross profit cannot exceed revenue');
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Save financial health record
   */
  async saveFinancialHealthRecord(healthData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('financialHealthRecords')
        .add({
          ...healthData,
          timestamp: new Date()
        });
        
      // Update business profile with latest health score
      if (healthData.businessId) {
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(healthData.businessId)
          .update({
            'financialHealth.score': healthData.overallScore,
            'financialHealth.status': healthData.healthStatus,
            'financialHealth.lastCalculated': new Date(),
            'financialHealth.riskCategory': healthData.riskCategory.category,
            'financialHealth.investmentReadiness': healthData.investmentReadiness.level
          });
      }
      
    } catch (error) {
      console.error('Error saving financial health record:', error);
    }
  }
  
  /**
   * Get financial health analytics
   */
  async getFinancialHealthAnalytics(timeRange = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }
      
      const recordsQuery = FirebaseAdmin.adminFirestore
        .collection('financialHealthRecords')
        .where('calculatedAt', '>=', startDate)
        .where('calculatedAt', '<=', endDate);
      
      const snapshot = await recordsQuery.get();
      
      const analytics = {
        totalCalculations: 0,
        averageScore: 0,
        healthDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          critical: 0
        },
        riskDistribution: {},
        industryBreakdown: {},
        regionalBreakdown: {}
      };
      
      let totalScore = 0;
      
      snapshot.forEach(doc => {
        const record = doc.data();
        analytics.totalCalculations++;
        totalScore += record.overallScore;
        
        // Health distribution
        const healthStatus = record.healthStatus.toLowerCase();
        if (analytics.healthDistribution[healthStatus] !== undefined) {
          analytics.healthDistribution[healthStatus]++;
        }
        
        // Risk distribution
        const riskCategory = record.riskCategory.category;
        analytics.riskDistribution[riskCategory] = (analytics.riskDistribution[riskCategory] || 0) + 1;
        
        // Industry breakdown
        const industry = record.industryBenchmark;
        analytics.industryBreakdown[industry] = (analytics.industryBreakdown[industry] || 0) + 1;
        
        // Regional breakdown
        const region = record.regionalContext;
        analytics.regionalBreakdown[region] = (analytics.regionalBreakdown[region] || 0) + 1;
      });
      
      analytics.averageScore = analytics.totalCalculations > 0 ? 
        Math.round(totalScore / analytics.totalCalculations) : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting financial health analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FinancialHealthAlgorithm();