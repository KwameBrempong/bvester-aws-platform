/**
 * BVESTER PLATFORM - FINANCIAL HEALTH ANALYSIS SERVICE
 * Comprehensive financial assessment and credit scoring for African SMEs
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class FinancialHealthService {
  constructor() {
    // Financial health scoring weights
    this.scoreWeights = {
      profitability: 0.25,      // 25% - Profitability metrics
      liquidity: 0.20,          // 20% - Cash flow and liquidity
      efficiency: 0.15,         // 15% - Operational efficiency
      leverage: 0.15,           // 15% - Debt and leverage ratios
      growth: 0.15,             // 15% - Growth trends
      stability: 0.10           // 10% - Financial stability indicators
    };
    
    // Financial health score ranges
    this.healthRanges = {
      excellent: { min: 80, max: 100, label: 'Excellent', risk: 'Very Low', color: '#28a745' },
      good: { min: 70, max: 79, label: 'Good', risk: 'Low', color: '#17a2b8' },
      fair: { min: 60, max: 69, label: 'Fair', risk: 'Medium', color: '#ffc107' },
      poor: { min: 40, max: 59, label: 'Poor', risk: 'High', color: '#fd7e14' },
      critical: { min: 0, max: 39, label: 'Critical', risk: 'Very High', color: '#dc3545' }
    };
    
    // Industry benchmarks for key ratios
    this.industryBenchmarks = {
      'agriculture': {
        grossMargin: 0.35,
        currentRatio: 1.5,
        debtToEquity: 0.6,
        inventoryTurnover: 4.0,
        revenueGrowth: 0.15
      },
      'manufacturing': {
        grossMargin: 0.25,
        currentRatio: 1.8,
        debtToEquity: 0.8,
        inventoryTurnover: 6.0,
        revenueGrowth: 0.12
      },
      'technology': {
        grossMargin: 0.70,
        currentRatio: 2.5,
        debtToEquity: 0.3,
        inventoryTurnover: 12.0,
        revenueGrowth: 0.30
      },
      'healthcare': {
        grossMargin: 0.45,
        currentRatio: 2.0,
        debtToEquity: 0.5,
        inventoryTurnover: 8.0,
        revenueGrowth: 0.18
      },
      'retail': {
        grossMargin: 0.30,
        currentRatio: 1.6,
        debtToEquity: 0.7,
        inventoryTurnover: 10.0,
        revenueGrowth: 0.10
      },
      'services': {
        grossMargin: 0.55,
        currentRatio: 1.4,
        debtToEquity: 0.4,
        inventoryTurnover: 20.0,
        revenueGrowth: 0.20
      }
    };
    
    // Key financial ratios and their scoring criteria
    this.ratioScoring = {
      // Profitability ratios
      grossMargin: {
        excellent: 0.40,     // 40%+
        good: 0.25,          // 25-39%
        fair: 0.15,          // 15-24%
        poor: 0.05,          // 5-14%
        critical: 0.00       // <5%
      },
      netMargin: {
        excellent: 0.15,     // 15%+
        good: 0.08,          // 8-14%
        fair: 0.03,          // 3-7%
        poor: 0.00,          // 0-2%
        critical: -0.05      // <0%
      },
      roa: {                 // Return on Assets
        excellent: 0.12,     // 12%+
        good: 0.08,          // 8-11%
        fair: 0.04,          // 4-7%
        poor: 0.01,          // 1-3%
        critical: 0.00       // <1%
      },
      roe: {                 // Return on Equity
        excellent: 0.20,     // 20%+
        good: 0.15,          // 15-19%
        fair: 0.10,          // 10-14%
        poor: 0.05,          // 5-9%
        critical: 0.00       // <5%
      },
      
      // Liquidity ratios
      currentRatio: {
        excellent: 2.5,      // 2.5+
        good: 1.8,           // 1.8-2.4
        fair: 1.2,           // 1.2-1.7
        poor: 1.0,           // 1.0-1.1
        critical: 0.8        // <1.0
      },
      quickRatio: {
        excellent: 1.5,      // 1.5+
        good: 1.2,           // 1.2-1.4
        fair: 1.0,           // 1.0-1.1
        poor: 0.8,           // 0.8-0.9
        critical: 0.6        // <0.8
      },
      cashRatio: {
        excellent: 0.5,      // 50%+
        good: 0.3,           // 30-49%
        fair: 0.15,          // 15-29%
        poor: 0.05,          // 5-14%
        critical: 0.02       // <5%
      },
      
      // Efficiency ratios
      inventoryTurnover: {
        excellent: 12.0,     // 12+ times
        good: 8.0,           // 8-11 times
        fair: 6.0,           // 6-7 times
        poor: 4.0,           // 4-5 times
        critical: 2.0        // <4 times
      },
      receivablesTurnover: {
        excellent: 15.0,     // 15+ times
        good: 10.0,          // 10-14 times
        fair: 7.0,           // 7-9 times
        poor: 5.0,           // 5-6 times
        critical: 3.0        // <5 times
      },
      assetTurnover: {
        excellent: 2.0,      // 2.0+ times
        good: 1.5,           // 1.5-1.9 times
        fair: 1.0,           // 1.0-1.4 times
        poor: 0.7,           // 0.7-0.9 times
        critical: 0.5        // <0.7 times
      },
      
      // Leverage ratios
      debtToEquity: {
        excellent: 0.3,      // <30%
        good: 0.5,           // 30-50%
        fair: 0.8,           // 50-80%
        poor: 1.2,           // 80-120%
        critical: 2.0        // >120%
      },
      debtToAssets: {
        excellent: 0.2,      // <20%
        good: 0.35,          // 20-35%
        fair: 0.5,           // 35-50%
        poor: 0.7,           // 50-70%
        critical: 0.8        // >70%
      },
      interestCoverage: {
        excellent: 10.0,     // 10+ times
        good: 5.0,           // 5-9 times
        fair: 2.5,           // 2.5-4.9 times
        poor: 1.5,           // 1.5-2.4 times
        critical: 1.0        // <1.5 times
      }
    };
    
    // African market adjustments
    this.marketAdjustments = {
      'Nigeria': { inflation: 0.15, currency: 'NGN', riskPremium: 0.05 },
      'Kenya': { inflation: 0.08, currency: 'KES', riskPremium: 0.03 },
      'Ghana': { inflation: 0.12, currency: 'GHS', riskPremium: 0.04 },
      'South Africa': { inflation: 0.06, currency: 'ZAR', riskPremium: 0.02 },
      'Egypt': { inflation: 0.10, currency: 'EGP', riskPremium: 0.04 },
      'Morocco': { inflation: 0.05, currency: 'MAD', riskPremium: 0.03 }
    };
  }
  
  // ============================================================================
  // CORE FINANCIAL HEALTH ANALYSIS
  // ============================================================================
  
  /**
   * Conduct comprehensive financial health analysis
   */
  async analyzeFinancialHealth(businessId, financialData, options = {}) {
    try {
      console.log(`💰 Analyzing financial health for business: ${businessId}`);
      
      // Get business profile for context
      const businessResult = await FirebaseService.getBusinessProfile(businessId);
      if (!businessResult.success) {
        throw new Error('Business profile not found');
      }
      
      const business = businessResult.business;
      const industry = business.industry || 'services';
      const country = business.location?.country || 'Nigeria';
      
      // Calculate financial ratios
      const ratios = this.calculateFinancialRatios(financialData);
      
      // Score each category
      const categoryScores = {
        profitability: this.scoreProfitability(ratios, industry),
        liquidity: this.scoreLiquidity(ratios, industry),
        efficiency: this.scoreEfficiency(ratios, industry),
        leverage: this.scoreLeverage(ratios, industry),
        growth: this.scoreGrowth(financialData, industry),
        stability: this.scoreStability(financialData, country)
      };
      
      // Calculate overall financial health score
      const overallScore = this.calculateOverallScore(categoryScores);
      
      // Generate comprehensive assessment
      const assessment = await this.generateAssessment(
        overallScore, 
        categoryScores, 
        ratios, 
        industry, 
        country,
        financialData
      );
      
      // Calculate creditworthiness
      const creditAnalysis = this.analyzeCreditworthiness(overallScore, categoryScores, ratios);
      
      // Store analysis results
      const analysisRecord = {
        businessId: businessId,
        overallScore: overallScore,
        categoryScores: categoryScores,
        ratios: ratios,
        assessment: assessment,
        creditAnalysis: creditAnalysis,
        industry: industry,
        country: country,
        analysisDate: new Date(),
        dataVersion: '1.0',
        financialData: financialData
      };
      
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('financialAnalyses')
        .add(analysisRecord);
      
      // Update business profile
      await FirebaseService.updateBusinessProfile(businessId, {
        financialHealthScore: overallScore,
        financialAssessment: assessment,
        creditworthiness: creditAnalysis,
        lastFinancialAnalysis: new Date()
      });
      
      // Log analysis activity
      await FirebaseService.logActivity(
        businessId,
        'financial_analysis_completed',
        'algorithm',
        businessId,
        { overallScore, industry, country }
      );
      
      return {
        success: true,
        analysisId: docRef.id,
        overallScore: overallScore,
        categoryScores: categoryScores,
        assessment: assessment,
        creditAnalysis: creditAnalysis,
        ratios: ratios
      };
      
    } catch (error) {
      console.error('Error analyzing financial health:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // FINANCIAL RATIO CALCULATIONS
  // ============================================================================
  
  /**
   * Calculate comprehensive financial ratios
   */
  calculateFinancialRatios(data) {
    const current = data.currentPeriod || {};
    const previous = data.previousPeriod || {};
    
    const ratios = {
      // Profitability ratios
      grossMargin: this.safeRatio(current.grossProfit, current.revenue),
      netMargin: this.safeRatio(current.netIncome, current.revenue),
      operatingMargin: this.safeRatio(current.operatingIncome, current.revenue),
      roa: this.safeRatio(current.netIncome, current.totalAssets),
      roe: this.safeRatio(current.netIncome, current.shareholderEquity),
      roic: this.safeRatio(current.operatingIncome, (current.totalAssets - current.currentLiabilities)),
      
      // Liquidity ratios
      currentRatio: this.safeRatio(current.currentAssets, current.currentLiabilities),
      quickRatio: this.safeRatio((current.currentAssets - current.inventory), current.currentLiabilities),
      cashRatio: this.safeRatio(current.cashAndEquivalents, current.currentLiabilities),
      operatingCashRatio: this.safeRatio(current.operatingCashFlow, current.currentLiabilities),
      
      // Efficiency ratios
      inventoryTurnover: this.safeRatio(current.costOfGoodsSold, current.inventory),
      receivablesTurnover: this.safeRatio(current.revenue, current.accountsReceivable),
      payablesTurnover: this.safeRatio(current.costOfGoodsSold, current.accountsPayable),
      assetTurnover: this.safeRatio(current.revenue, current.totalAssets),
      workingCapitalTurnover: this.safeRatio(current.revenue, (current.currentAssets - current.currentLiabilities)),
      
      // Leverage ratios
      debtToEquity: this.safeRatio(current.totalDebt, current.shareholderEquity),
      debtToAssets: this.safeRatio(current.totalDebt, current.totalAssets),
      equityRatio: this.safeRatio(current.shareholderEquity, current.totalAssets),
      interestCoverage: this.safeRatio(current.operatingIncome, current.interestExpense),
      debtServiceCoverage: this.safeRatio(current.operatingCashFlow, current.debtService),
      
      // Growth ratios (period-over-period)
      revenueGrowth: this.calculateGrowthRate(current.revenue, previous.revenue),
      netIncomeGrowth: this.calculateGrowthRate(current.netIncome, previous.netIncome),
      assetGrowth: this.calculateGrowthRate(current.totalAssets, previous.totalAssets),
      equityGrowth: this.calculateGrowthRate(current.shareholderEquity, previous.shareholderEquity),
      
      // Additional metrics
      workingCapital: current.currentAssets - current.currentLiabilities,
      workingCapitalRatio: this.safeRatio((current.currentAssets - current.currentLiabilities), current.revenue),
      cashConversionCycle: this.calculateCashConversionCycle(current),
      burnRate: this.calculateBurnRate(current, previous)
    };
    
    return ratios;
  }
  
  /**
   * Safe ratio calculation (handles division by zero)
   */
  safeRatio(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return numerator / denominator;
  }
  
  /**
   * Calculate growth rate between periods
   */
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return (current - previous) / Math.abs(previous);
  }
  
  /**
   * Calculate cash conversion cycle
   */
  calculateCashConversionCycle(data) {
    const daysInPeriod = 365;
    const dso = this.safeRatio(data.accountsReceivable * daysInPeriod, data.revenue); // Days Sales Outstanding
    const dpo = this.safeRatio(data.accountsPayable * daysInPeriod, data.costOfGoodsSold); // Days Payable Outstanding
    const dio = this.safeRatio(data.inventory * daysInPeriod, data.costOfGoodsSold); // Days Inventory Outstanding
    
    return dso + dio - dpo;
  }
  
  /**
   * Calculate monthly burn rate
   */
  calculateBurnRate(current, previous) {
    if (!previous) return 0;
    
    const cashChange = current.cashAndEquivalents - (previous.cashAndEquivalents || current.cashAndEquivalents);
    const monthsPeriod = 12; // Assuming annual data
    
    return Math.abs(cashChange) / monthsPeriod;
  }
  
  // ============================================================================
  // CATEGORY SCORING
  // ============================================================================
  
  /**
   * Score profitability metrics
   */
  scoreProfitability(ratios, industry) {
    const weights = {
      grossMargin: 0.30,
      netMargin: 0.30,
      roa: 0.20,
      roe: 0.20
    };
    
    let score = 0;
    score += this.scoreRatio('grossMargin', ratios.grossMargin) * weights.grossMargin;
    score += this.scoreRatio('netMargin', ratios.netMargin) * weights.netMargin;
    score += this.scoreRatio('roa', ratios.roa) * weights.roa;
    score += this.scoreRatio('roe', ratios.roe) * weights.roe;
    
    // Industry adjustment
    const benchmark = this.industryBenchmarks[industry];
    if (benchmark && ratios.grossMargin > benchmark.grossMargin) {
      score += 5; // Bonus for exceeding industry benchmark
    }
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Score liquidity metrics
   */
  scoreLiquidity(ratios, industry) {
    const weights = {
      currentRatio: 0.40,
      quickRatio: 0.30,
      cashRatio: 0.20,
      operatingCashRatio: 0.10
    };
    
    let score = 0;
    score += this.scoreRatio('currentRatio', ratios.currentRatio) * weights.currentRatio;
    score += this.scoreRatio('quickRatio', ratios.quickRatio) * weights.quickRatio;
    score += this.scoreRatio('cashRatio', ratios.cashRatio) * weights.cashRatio;
    score += this.scoreRatio('operatingCashRatio', ratios.operatingCashRatio || 0) * weights.operatingCashRatio;
    
    // Penalty for negative working capital
    if (ratios.workingCapital < 0) {
      score -= 10;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  /**
   * Score efficiency metrics
   */
  scoreEfficiency(ratios, industry) {
    const weights = {
      inventoryTurnover: 0.30,
      receivablesTurnover: 0.25,
      assetTurnover: 0.25,
      cashConversionCycle: 0.20
    };
    
    let score = 0;
    score += this.scoreRatio('inventoryTurnover', ratios.inventoryTurnover) * weights.inventoryTurnover;
    score += this.scoreRatio('receivablesTurnover', ratios.receivablesTurnover) * weights.receivablesTurnover;
    score += this.scoreRatio('assetTurnover', ratios.assetTurnover) * weights.assetTurnover;
    
    // Cash conversion cycle (lower is better)
    const cccScore = ratios.cashConversionCycle <= 30 ? 100 : 
                     ratios.cashConversionCycle <= 60 ? 80 : 
                     ratios.cashConversionCycle <= 90 ? 60 : 40;
    score += cccScore * weights.cashConversionCycle;
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Score leverage metrics
   */
  scoreLeverage(ratios, industry) {
    const weights = {
      debtToEquity: 0.35,
      debtToAssets: 0.25,
      interestCoverage: 0.25,
      debtServiceCoverage: 0.15
    };
    
    let score = 0;
    
    // For leverage ratios, lower is generally better (reverse scoring)
    score += this.scoreRatioReverse('debtToEquity', ratios.debtToEquity) * weights.debtToEquity;
    score += this.scoreRatioReverse('debtToAssets', ratios.debtToAssets) * weights.debtToAssets;
    score += this.scoreRatio('interestCoverage', ratios.interestCoverage) * weights.interestCoverage;
    score += this.scoreRatio('debtServiceCoverage', ratios.debtServiceCoverage || 1) * weights.debtServiceCoverage;
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Score growth metrics
   */
  scoreGrowth(financialData, industry) {
    const current = financialData.currentPeriod || {};
    const ratios = this.calculateFinancialRatios(financialData);
    
    const weights = {
      revenueGrowth: 0.40,
      netIncomeGrowth: 0.30,
      assetGrowth: 0.15,
      equityGrowth: 0.15
    };
    
    let score = 0;
    
    // Score growth rates (positive growth gets higher scores)
    score += this.scoreGrowthRate(ratios.revenueGrowth) * weights.revenueGrowth;
    score += this.scoreGrowthRate(ratios.netIncomeGrowth) * weights.netIncomeGrowth;
    score += this.scoreGrowthRate(ratios.assetGrowth) * weights.assetGrowth;
    score += this.scoreGrowthRate(ratios.equityGrowth) * weights.equityGrowth;
    
    // Industry benchmark adjustment
    const benchmark = this.industryBenchmarks[industry];
    if (benchmark && ratios.revenueGrowth > benchmark.revenueGrowth) {
      score += 10; // Bonus for exceeding industry growth
    }
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Score stability metrics
   */
  scoreStability(financialData, country) {
    const current = financialData.currentPeriod || {};
    const marketData = this.marketAdjustments[country] || this.marketAdjustments['Nigeria'];
    
    let score = 70; // Base stability score
    
    // Cash position stability
    const cashRatio = current.cashAndEquivalents / (current.totalAssets || 1);
    if (cashRatio > 0.1) score += 15;
    else if (cashRatio > 0.05) score += 10;
    else score -= 10;
    
    // Revenue consistency (if historical data available)
    if (financialData.historicalRevenue) {
      const volatility = this.calculateRevenueVolatility(financialData.historicalRevenue);
      if (volatility < 0.2) score += 15; // Low volatility
      else if (volatility > 0.5) score -= 15; // High volatility
    }
    
    // Market risk adjustment
    score -= (marketData.riskPremium * 100); // Adjust for country risk
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  // ============================================================================
  // SCORING UTILITIES
  // ============================================================================
  
  /**
   * Score individual ratio against benchmarks
   */
  scoreRatio(ratioName, value) {
    const criteria = this.ratioScoring[ratioName];
    if (!criteria) return 50; // Default score if no criteria
    
    if (value >= criteria.excellent) return 100;
    if (value >= criteria.good) return 80;
    if (value >= criteria.fair) return 60;
    if (value >= criteria.poor) return 40;
    return 20;
  }
  
  /**
   * Score ratio with reverse logic (lower is better)
   */
  scoreRatioReverse(ratioName, value) {
    const criteria = this.ratioScoring[ratioName];
    if (!criteria) return 50;
    
    if (value <= criteria.excellent) return 100;
    if (value <= criteria.good) return 80;
    if (value <= criteria.fair) return 60;
    if (value <= criteria.poor) return 40;
    return 20;
  }
  
  /**
   * Score growth rate
   */
  scoreGrowthRate(growthRate) {
    if (growthRate >= 0.3) return 100;      // 30%+ growth
    if (growthRate >= 0.2) return 90;       // 20-29% growth
    if (growthRate >= 0.1) return 80;       // 10-19% growth
    if (growthRate >= 0.05) return 70;      // 5-9% growth
    if (growthRate >= 0) return 60;         // 0-4% growth
    if (growthRate >= -0.05) return 40;     // 0 to -5% decline
    if (growthRate >= -0.1) return 20;      // -5 to -10% decline
    return 10;                              // >10% decline
  }
  
  /**
   * Calculate overall weighted score
   */
  calculateOverallScore(categoryScores) {
    let totalScore = 0;
    
    for (const [category, weight] of Object.entries(this.scoreWeights)) {
      totalScore += (categoryScores[category] || 0) * weight;
    }
    
    return Math.round(totalScore);
  }
  
  /**
   * Calculate revenue volatility
   */
  calculateRevenueVolatility(historicalRevenue) {
    if (!historicalRevenue || historicalRevenue.length < 2) return 0;
    
    const growthRates = [];
    for (let i = 1; i < historicalRevenue.length; i++) {
      const growthRate = (historicalRevenue[i] - historicalRevenue[i-1]) / Math.abs(historicalRevenue[i-1]);
      growthRates.push(growthRate);
    }
    
    const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length;
    
    return Math.sqrt(variance);
  }
  
  // ============================================================================
  // ASSESSMENT GENERATION
  // ============================================================================
  
  /**
   * Generate comprehensive financial assessment
   */
  async generateAssessment(overallScore, categoryScores, ratios, industry, country, financialData) {
    const healthRange = this.getHealthRange(overallScore);
    
    const assessment = {
      overallRating: healthRange.label,
      riskLevel: healthRange.risk,
      score: overallScore,
      
      strengths: this.identifyStrengths(categoryScores, ratios),
      weaknesses: this.identifyWeaknesses(categoryScores, ratios),
      keyMetrics: this.extractKeyMetrics(ratios, industry),
      
      recommendations: this.generateRecommendations(categoryScores, ratios, industry),
      riskFactors: this.identifyRiskFactors(categoryScores, ratios, country),
      
      industryComparison: this.compareToIndustry(ratios, industry),
      trend: this.assessTrend(financialData),
      
      investmentReadiness: this.assessInvestmentReadiness(overallScore, categoryScores),
      fundingCapacity: this.estimateFundingCapacity(ratios, financialData.currentPeriod)
    };
    
    return assessment;
  }
  
  /**
   * Identify financial strengths
   */
  identifyStrengths(categoryScores, ratios) {
    const strengths = [];
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 80) {
        let description = '';
        switch (category) {
          case 'profitability':
            description = 'Strong profit margins and returns';
            break;
          case 'liquidity':
            description = 'Excellent cash position and liquidity';
            break;
          case 'efficiency':
            description = 'Efficient asset utilization and operations';
            break;
          case 'leverage':
            description = 'Conservative debt levels and strong coverage';
            break;
          case 'growth':
            description = 'Robust growth trajectory';
            break;
          case 'stability':
            description = 'Stable financial performance';
            break;
        }
        
        strengths.push({
          category,
          score,
          description
        });
      }
    });
    
    // Add specific ratio strengths
    if (ratios.currentRatio >= 2.0) {
      strengths.push({
        category: 'liquidity',
        metric: 'currentRatio',
        value: ratios.currentRatio,
        description: 'Strong current ratio indicates good short-term liquidity'
      });
    }
    
    if (ratios.netMargin >= 0.1) {
      strengths.push({
        category: 'profitability',
        metric: 'netMargin',
        value: ratios.netMargin,
        description: 'Healthy net profit margin demonstrates efficient operations'
      });
    }
    
    return strengths;
  }
  
  /**
   * Identify areas of concern
   */
  identifyWeaknesses(categoryScores, ratios) {
    const weaknesses = [];
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score < 60) {
        let description = '';
        let priority = score < 40 ? 'high' : 'medium';
        
        switch (category) {
          case 'profitability':
            description = 'Low profitability requires attention';
            break;
          case 'liquidity':
            description = 'Cash flow and liquidity concerns';
            break;
          case 'efficiency':
            description = 'Operational efficiency needs improvement';
            break;
          case 'leverage':
            description = 'High debt levels pose risks';
            break;
          case 'growth':
            description = 'Limited growth momentum';
            break;
          case 'stability':
            description = 'Financial volatility concerns';
            break;
        }
        
        weaknesses.push({
          category,
          score,
          description,
          priority
        });
      }
    });
    
    // Add specific ratio concerns
    if (ratios.currentRatio < 1.2) {
      weaknesses.push({
        category: 'liquidity',
        metric: 'currentRatio',
        value: ratios.currentRatio,
        description: 'Low current ratio may indicate liquidity stress',
        priority: 'high'
      });
    }
    
    if (ratios.debtToEquity > 1.0) {
      weaknesses.push({
        category: 'leverage',
        metric: 'debtToEquity',
        value: ratios.debtToEquity,
        description: 'High debt-to-equity ratio increases financial risk',
        priority: 'high'
      });
    }
    
    return weaknesses;
  }
  
  /**
   * Extract key financial metrics for summary
   */
  extractKeyMetrics(ratios, industry) {
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.services;
    
    return {
      grossMargin: {
        value: ratios.grossMargin,
        benchmark: benchmark.grossMargin,
        status: ratios.grossMargin >= benchmark.grossMargin ? 'above' : 'below'
      },
      currentRatio: {
        value: ratios.currentRatio,
        benchmark: benchmark.currentRatio,
        status: ratios.currentRatio >= benchmark.currentRatio ? 'above' : 'below'
      },
      debtToEquity: {
        value: ratios.debtToEquity,
        benchmark: benchmark.debtToEquity,
        status: ratios.debtToEquity <= benchmark.debtToEquity ? 'above' : 'below'
      },
      revenueGrowth: {
        value: ratios.revenueGrowth,
        benchmark: benchmark.revenueGrowth,
        status: ratios.revenueGrowth >= benchmark.revenueGrowth ? 'above' : 'below'
      }
    };
  }
  
  /**
   * Generate actionable recommendations
   */
  generateRecommendations(categoryScores, ratios, industry) {
    const recommendations = [];
    
    // Profitability recommendations
    if (categoryScores.profitability < 70) {
      recommendations.push({
        category: 'profitability',
        priority: categoryScores.profitability < 50 ? 'high' : 'medium',
        action: 'Focus on margin improvement through cost optimization and pricing strategy',
        impact: 'Increase net margins by 3-5 percentage points',
        timeframe: '6-12 months'
      });
    }
    
    // Liquidity recommendations
    if (categoryScores.liquidity < 70) {
      recommendations.push({
        category: 'liquidity',
        priority: 'high',
        action: 'Improve working capital management and establish credit facilities',
        impact: 'Strengthen cash position and operational flexibility',
        timeframe: '3-6 months'
      });
    }
    
    // Efficiency recommendations
    if (categoryScores.efficiency < 70) {
      recommendations.push({
        category: 'efficiency',
        priority: 'medium',
        action: 'Optimize inventory management and accelerate receivables collection',
        impact: 'Improve cash conversion cycle by 15-30 days',
        timeframe: '6-9 months'
      });
    }
    
    // Leverage recommendations
    if (categoryScores.leverage < 70) {
      recommendations.push({
        category: 'leverage',
        priority: 'high',
        action: 'Reduce debt levels and strengthen equity base',
        impact: 'Lower financial risk and improve debt ratios',
        timeframe: '12-18 months'
      });
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }
  
  /**
   * Identify key risk factors
   */
  identifyRiskFactors(categoryScores, ratios, country) {
    const risks = [];
    
    // Financial risks
    if (ratios.currentRatio < 1.2) {
      risks.push({
        type: 'liquidity',
        severity: 'high',
        description: 'Potential cash flow difficulties in the short term'
      });
    }
    
    if (ratios.debtToEquity > 1.5) {
      risks.push({
        type: 'leverage',
        severity: 'high',
        description: 'High debt burden may limit financial flexibility'
      });
    }
    
    if (ratios.netMargin < 0) {
      risks.push({
        type: 'profitability',
        severity: 'critical',
        description: 'Operating at a loss, sustainability concerns'
      });
    }
    
    // Market risks
    const marketData = this.marketAdjustments[country];
    if (marketData && marketData.inflation > 0.1) {
      risks.push({
        type: 'market',
        severity: 'medium',
        description: `High inflation environment (${(marketData.inflation * 100).toFixed(1)}%) may impact costs`
      });
    }
    
    return risks;
  }
  
  /**
   * Compare performance to industry benchmarks
   */
  compareToIndustry(ratios, industry) {
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.services;
    
    return {
      industry: industry,
      grossMargin: {
        company: ratios.grossMargin,
        industry: benchmark.grossMargin,
        variance: ((ratios.grossMargin - benchmark.grossMargin) / benchmark.grossMargin) * 100
      },
      currentRatio: {
        company: ratios.currentRatio,
        industry: benchmark.currentRatio,
        variance: ((ratios.currentRatio - benchmark.currentRatio) / benchmark.currentRatio) * 100
      },
      debtToEquity: {
        company: ratios.debtToEquity,
        industry: benchmark.debtToEquity,
        variance: ((ratios.debtToEquity - benchmark.debtToEquity) / benchmark.debtToEquity) * 100
      }
    };
  }
  
  /**
   * Assess financial trend
   */
  assessTrend(financialData) {
    const current = financialData.currentPeriod || {};
    const previous = financialData.previousPeriod || {};
    
    if (!previous.revenue) {
      return { direction: 'unknown', description: 'Insufficient data for trend analysis' };
    }
    
    const revenueChange = (current.revenue - previous.revenue) / previous.revenue;
    const profitChange = (current.netIncome - (previous.netIncome || 0)) / Math.abs(previous.netIncome || 1);
    
    if (revenueChange > 0.1 && profitChange > 0.1) {
      return { direction: 'positive', description: 'Strong growth in both revenue and profitability' };
    } else if (revenueChange > 0 && profitChange > 0) {
      return { direction: 'positive', description: 'Moderate growth in revenue and profitability' };
    } else if (revenueChange > 0) {
      return { direction: 'mixed', description: 'Revenue growth but profitability challenges' };
    } else {
      return { direction: 'negative', description: 'Declining financial performance' };
    }
  }
  
  /**
   * Assess investment readiness
   */
  assessInvestmentReadiness(overallScore, categoryScores) {
    if (overallScore >= 75 && categoryScores.liquidity >= 70 && categoryScores.growth >= 70) {
      return {
        level: 'high',
        description: 'Strong financial position, ready for investment',
        recommendations: ['Due diligence ready', 'Growth capital suitable', 'Equity investment viable']
      };
    } else if (overallScore >= 60 && categoryScores.liquidity >= 60) {
      return {
        level: 'moderate',
        description: 'Generally stable, some improvements needed',
        recommendations: ['Address weak areas first', 'Consider staged investment', 'Monitor progress closely']
      };
    } else {
      return {
        level: 'low',
        description: 'Significant financial improvements needed',
        recommendations: ['Focus on turnaround', 'Debt restructuring may be needed', 'High-risk investment']
      };
    }
  }
  
  /**
   * Estimate funding capacity
   */
  estimateFundingCapacity(ratios, currentPeriod) {
    const revenue = currentPeriod.revenue || 0;
    const cashFlow = currentPeriod.operatingCashFlow || currentPeriod.netIncome || 0;
    const assets = currentPeriod.totalAssets || 0;
    
    // Conservative funding estimates based on financial strength
    let debtCapacity = 0;
    let equityCapacity = 0;
    
    if (ratios.debtToEquity < 0.5 && ratios.currentRatio > 1.5) {
      debtCapacity = Math.min(revenue * 0.5, cashFlow * 5); // Conservative debt capacity
    } else if (ratios.debtToEquity < 1.0) {
      debtCapacity = Math.min(revenue * 0.3, cashFlow * 3);
    }
    
    if (ratios.roa > 0.05 && ratios.revenueGrowth > 0.1) {
      equityCapacity = revenue * 1.5; // Growth companies can raise more equity
    } else if (ratios.roa > 0) {
      equityCapacity = revenue * 0.8;
    }
    
    return {
      debtCapacity: Math.round(debtCapacity),
      equityCapacity: Math.round(equityCapacity),
      totalCapacity: Math.round(debtCapacity + equityCapacity),
      recommendations: {
        debt: debtCapacity > 0 ? 'Suitable for debt financing' : 'Focus on equity or revenue-based financing',
        equity: equityCapacity > 0 ? 'Ready for equity investment' : 'Improve profitability before equity raise'
      }
    };
  }
  
  // ============================================================================
  // CREDIT ANALYSIS
  // ============================================================================
  
  /**
   * Analyze creditworthiness
   */
  analyzeCreditworthiness(overallScore, categoryScores, ratios) {
    // Credit score based on financial health components
    const creditScore = Math.round(
      (categoryScores.liquidity * 0.3) +
      (categoryScores.profitability * 0.25) +
      (categoryScores.leverage * 0.25) +
      (categoryScores.stability * 0.20)
    );
    
    let creditRating = '';
    let defaultProbability = 0;
    
    if (creditScore >= 85) {
      creditRating = 'AAA';
      defaultProbability = 0.01;
    } else if (creditScore >= 75) {
      creditRating = 'AA';
      defaultProbability = 0.02;
    } else if (creditScore >= 65) {
      creditRating = 'A';
      defaultProbability = 0.05;
    } else if (creditScore >= 55) {
      creditRating = 'BBB';
      defaultProbability = 0.10;
    } else if (creditScore >= 45) {
      creditRating = 'BB';
      defaultProbability = 0.20;
    } else if (creditScore >= 35) {
      creditRating = 'B';
      defaultProbability = 0.35;
    } else {
      creditRating = 'C';
      defaultProbability = 0.50;
    }
    
    return {
      creditScore,
      creditRating,
      defaultProbability,
      riskLevel: this.getCreditRiskLevel(creditScore),
      interestRatePremium: this.calculateInterestPremium(creditScore),
      creditLimit: this.estimateCreditLimit(ratios, creditScore)
    };
  }
  
  /**
   * Get credit risk level
   */
  getCreditRiskLevel(creditScore) {
    if (creditScore >= 75) return 'Low Risk';
    if (creditScore >= 60) return 'Medium Risk';
    if (creditScore >= 45) return 'High Risk';
    return 'Very High Risk';
  }
  
  /**
   * Calculate interest rate premium
   */
  calculateInterestPremium(creditScore) {
    // Base rate + risk premium
    const baseRate = 0.05; // 5% base rate
    let riskPremium = 0;
    
    if (creditScore >= 75) riskPremium = 0.02;      // 2%
    else if (creditScore >= 60) riskPremium = 0.05; // 5%
    else if (creditScore >= 45) riskPremium = 0.10; // 10%
    else riskPremium = 0.15;                        // 15%
    
    return baseRate + riskPremium;
  }
  
  /**
   * Estimate credit limit
   */
  estimateCreditLimit(ratios, creditScore) {
    const cashFlow = ratios.operatingCashFlow || ratios.netIncome || 0;
    const multiplier = creditScore >= 75 ? 5 : 
                      creditScore >= 60 ? 3 : 
                      creditScore >= 45 ? 2 : 1;
    
    return Math.round(cashFlow * 12 * multiplier); // Annual cash flow * multiplier
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Get health range classification
   */
  getHealthRange(score) {
    for (const range of Object.values(this.healthRanges)) {
      if (score >= range.min && score <= range.max) {
        return range;
      }
    }
    return this.healthRanges.critical;
  }
  
  /**
   * Get financial analysis history
   */
  async getAnalysisHistory(businessId, limit = 10) {
    try {
      const historyQuery = FirebaseAdmin.adminFirestore
        .collection('financialAnalyses')
        .where('businessId', '==', businessId)
        .orderBy('analysisDate', 'desc')
        .limit(limit);
      
      const snapshot = await historyQuery.get();
      const history = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          overallScore: data.overallScore,
          categoryScores: data.categoryScores,
          analysisDate: data.analysisDate,
          assessment: data.assessment
        });
      });
      
      return { success: true, history };
      
    } catch (error) {
      console.error('Error getting analysis history:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get portfolio-wide financial analytics
   */
  async getPortfolioAnalytics(investorId) {
    try {
      // Get investor's portfolio businesses
      const portfolioQuery = FirebaseAdmin.adminFirestore
        .collection('investments')
        .where('investorId', '==', investorId);
      
      const portfolioSnapshot = await portfolioQuery.get();
      const businessIds = [];
      
      portfolioSnapshot.forEach(doc => {
        const investment = doc.data();
        if (investment.businessId) {
          businessIds.push(investment.businessId);
        }
      });
      
      if (businessIds.length === 0) {
        return {
          success: true,
          analytics: {
            totalInvestments: 0,
            averageHealthScore: 0,
            riskDistribution: {},
            topPerformers: [],
            concernedInvestments: []
          }
        };
      }
      
      // Get latest financial analyses for portfolio businesses
      const analysesQuery = FirebaseAdmin.adminFirestore
        .collection('financialAnalyses')
        .where('businessId', 'in', businessIds.slice(0, 10)); // Firestore limit
      
      const analysesSnapshot = await analysesQuery.get();
      const analyses = [];
      
      analysesSnapshot.forEach(doc => {
        analyses.push(doc.data());
      });
      
      // Calculate portfolio analytics
      const analytics = this.calculatePortfolioAnalytics(analyses);
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting portfolio analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calculate portfolio-wide analytics
   */
  calculatePortfolioAnalytics(analyses) {
    if (analyses.length === 0) {
      return {
        totalInvestments: 0,
        averageHealthScore: 0,
        riskDistribution: {},
        topPerformers: [],
        concernedInvestments: []
      };
    }
    
    const totalScore = analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0);
    const averageHealthScore = Math.round(totalScore / analyses.length);
    
    // Risk distribution
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    
    analyses.forEach(analysis => {
      const risk = this.getHealthRange(analysis.overallScore).risk;
      if (risk === 'Very Low' || risk === 'Low') riskDistribution.low++;
      else if (risk === 'Medium') riskDistribution.medium++;
      else if (risk === 'High') riskDistribution.high++;
      else riskDistribution.critical++;
    });
    
    // Top performers (score >= 75)
    const topPerformers = analyses
      .filter(analysis => analysis.overallScore >= 75)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map(analysis => ({
        businessId: analysis.businessId,
        score: analysis.overallScore,
        trend: analysis.assessment?.trend?.direction || 'unknown'
      }));
    
    // Concerned investments (score < 50)
    const concernedInvestments = analyses
      .filter(analysis => analysis.overallScore < 50)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5)
      .map(analysis => ({
        businessId: analysis.businessId,
        score: analysis.overallScore,
        primaryConcern: analysis.assessment?.weaknesses?.[0]?.category || 'unknown'
      }));
    
    return {
      totalInvestments: analyses.length,
      averageHealthScore,
      riskDistribution,
      topPerformers,
      concernedInvestments
    };
  }
}

module.exports = new FinancialHealthService();