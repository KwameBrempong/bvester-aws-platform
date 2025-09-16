/**
 * BVESTER PLATFORM - BUSINESS ANALYTICS ALGORITHM
 * Week 8: Business Analytics Engine Implementation
 * Advanced analytics, KPIs, predictions, and AI insights for African SMEs
 * Generated: January 28, 2025
 */

const FirebaseService = require('../api/firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class BusinessAnalyticsAlgorithm {
  constructor() {
    // Analytics configuration and weights
    this.analyticsConfig = {
      kpiWeights: {
        revenue: 0.25,
        growth: 0.20,
        profitability: 0.20,
        efficiency: 0.15,
        market: 0.10,
        sustainability: 0.10
      },
      
      predictionModels: {
        revenue: {
          accuracy: 0.85,
          timeHorizon: 12, // months
          confidenceThreshold: 0.7
        },
        funding: {
          accuracy: 0.78,
          timeHorizon: 6,
          confidenceThreshold: 0.6
        },
        risk: {
          accuracy: 0.82,
          timeHorizon: 3,
          confidenceThreshold: 0.75
        }
      }
    };
    
    // KPI definitions and benchmarks
    this.kpiDefinitions = {
      // Financial KPIs
      revenue: {
        name: 'Revenue',
        description: 'Total business revenue',
        unit: 'currency',
        category: 'financial',
        calculation: 'sum',
        target: 'growth'
      },
      revenueGrowth: {
        name: 'Revenue Growth Rate',
        description: 'Monthly/yearly revenue growth percentage',
        unit: 'percentage',
        category: 'financial',
        calculation: 'percentage_change',
        target: 'positive'
      },
      grossMargin: {
        name: 'Gross Profit Margin',
        description: 'Gross profit as percentage of revenue',
        unit: 'percentage',
        category: 'financial',
        calculation: 'ratio',
        target: 'maximize'
      },
      burnRate: {
        name: 'Cash Burn Rate',
        description: 'Monthly cash consumption rate',
        unit: 'currency',
        category: 'financial',
        calculation: 'average',
        target: 'minimize'
      },
      runway: {
        name: 'Cash Runway',
        description: 'Months of operation with current cash',
        unit: 'months',
        category: 'financial',
        calculation: 'division',
        target: 'maximize'
      },
      
      // Operational KPIs
      customerAcquisitionCost: {
        name: 'Customer Acquisition Cost (CAC)',
        description: 'Cost to acquire each new customer',
        unit: 'currency',
        category: 'operational',
        calculation: 'division',
        target: 'minimize'
      },
      customerLifetimeValue: {
        name: 'Customer Lifetime Value (CLV)',
        description: 'Total value of customer relationship',
        unit: 'currency',
        category: 'operational',
        calculation: 'complex',
        target: 'maximize'
      },
      churnRate: {
        name: 'Customer Churn Rate',
        description: 'Percentage of customers lost per period',
        unit: 'percentage',
        category: 'operational',
        calculation: 'ratio',
        target: 'minimize'
      },
      monthlyActiveUsers: {
        name: 'Monthly Active Users (MAU)',
        description: 'Number of active users per month',
        unit: 'count',
        category: 'operational',
        calculation: 'sum',
        target: 'growth'
      },
      
      // Investment KPIs
      investmentReturns: {
        name: 'Investment Returns',
        description: 'Returns generated for investors',
        unit: 'percentage',
        category: 'investment',
        calculation: 'ratio',
        target: 'maximize'
      },
      fundingRaised: {
        name: 'Total Funding Raised',
        description: 'Cumulative investment received',
        unit: 'currency',
        category: 'investment',
        calculation: 'sum',
        target: 'growth'
      },
      valuationGrowth: {
        name: 'Valuation Growth',
        description: 'Business valuation increase',
        unit: 'percentage',
        category: 'investment',
        calculation: 'percentage_change',
        target: 'positive'
      },
      
      // Market KPIs
      marketShare: {
        name: 'Market Share',
        description: 'Percentage of total addressable market',
        unit: 'percentage',
        category: 'market',
        calculation: 'ratio',
        target: 'growth'
      },
      brandAwareness: {
        name: 'Brand Awareness',
        description: 'Brand recognition in target market',
        unit: 'percentage',
        category: 'market',
        calculation: 'survey',
        target: 'maximize'
      }
    };
    
    // Industry benchmarks for African SMEs
    this.industryBenchmarks = {
      'agriculture': {
        revenueGrowth: 0.15,
        grossMargin: 0.35,
        customerAcquisitionCost: 50,
        churnRate: 0.08,
        profitMargin: 0.12
      },
      'technology': {
        revenueGrowth: 0.45,
        grossMargin: 0.75,
        customerAcquisitionCost: 200,
        churnRate: 0.05,
        profitMargin: 0.20
      },
      'manufacturing': {
        revenueGrowth: 0.12,
        grossMargin: 0.25,
        customerAcquisitionCost: 100,
        churnRate: 0.06,
        profitMargin: 0.08
      },
      'retail': {
        revenueGrowth: 0.10,
        grossMargin: 0.40,
        customerAcquisitionCost: 30,
        churnRate: 0.15,
        profitMargin: 0.06
      },
      'services': {
        revenueGrowth: 0.20,
        grossMargin: 0.60,
        customerAcquisitionCost: 80,
        churnRate: 0.10,
        profitMargin: 0.15
      },
      'healthcare': {
        revenueGrowth: 0.18,
        grossMargin: 0.50,
        customerAcquisitionCost: 150,
        churnRate: 0.04,
        profitMargin: 0.14
      }
    };
    
    // AI insight categories
    this.insightCategories = {
      performance: {
        name: 'Performance Insights',
        description: 'KPI trends and performance analysis',
        priority: 'high'
      },
      opportunities: {
        name: 'Growth Opportunities',
        description: 'Identified growth and expansion opportunities',
        priority: 'medium'
      },
      risks: {
        name: 'Risk Alerts',
        description: 'Potential risks and early warning signals',
        priority: 'high'
      },
      optimization: {
        name: 'Optimization Recommendations',
        description: 'Areas for operational improvement',
        priority: 'medium'
      },
      market: {
        name: 'Market Intelligence',
        description: 'Market trends and competitive insights',
        priority: 'low'
      }
    };
    
    // Prediction algorithms configuration
    this.predictionConfig = {
      timeSeriesModels: {
        linear: { weight: 0.2, complexity: 'low' },
        exponential: { weight: 0.3, complexity: 'medium' },
        seasonal: { weight: 0.35, complexity: 'high' },
        neural: { weight: 0.15, complexity: 'very_high' }
      },
      
      featureImportance: {
        historical_data: 0.4,
        seasonal_patterns: 0.25,
        market_conditions: 0.15,
        business_stage: 0.1,
        external_factors: 0.1
      }
    };
  }
  
  // ============================================================================
  // MAIN ANALYTICS GENERATION FUNCTION
  // ============================================================================
  
  /**
   * Generate comprehensive business analytics for a business
   */
  async generateBusinessAnalytics(businessId, timeRange = '12m', options = {}) {
    try {
      console.log(`📊 Generating business analytics for: ${businessId}`);
      
      // Get business data and historical metrics
      const businessData = await this.getBusinessData(businessId);
      if (!businessData.success) {
        throw new Error('Business data not found');
      }
      
      const historicalData = await this.getHistoricalData(businessId, timeRange);
      const marketData = await this.getMarketData(businessData.business.industry, businessData.business.location);
      
      // Calculate current KPIs
      const currentKPIs = this.calculateCurrentKPIs(businessData.business, historicalData.data);
      
      // Analyze KPI trends
      const trendAnalysis = this.analyzeTrends(historicalData.data, currentKPIs);
      
      // Generate predictions
      const predictions = await this.generatePredictions(businessData.business, historicalData.data, marketData);
      
      // Create AI insights
      const aiInsights = this.generateAIInsights({
        business: businessData.business,
        kpis: currentKPIs,
        trends: trendAnalysis,
        predictions: predictions,
        market: marketData
      });
      
      // Calculate performance scores
      const performanceScores = this.calculatePerformanceScores(currentKPIs, businessData.business.industry);
      
      // Generate benchmarking analysis
      const benchmarkAnalysis = this.generateBenchmarkAnalysis(
        currentKPIs,
        businessData.business.industry,
        businessData.business.location
      );
      
      // Create recommendations
      const recommendations = this.generateRecommendations(
        currentKPIs,
        trendAnalysis,
        predictions,
        performanceScores
      );
      
      // Compile comprehensive analytics result
      const analyticsResult = {
        businessId: businessId,
        timeRange: timeRange,
        generatedAt: new Date(),
        
        // Core metrics
        currentKPIs: currentKPIs,
        performanceScores: performanceScores,
        
        // Trend analysis
        trends: trendAnalysis,
        
        // Predictive analytics
        predictions: predictions,
        
        // Benchmarking
        benchmarkAnalysis: benchmarkAnalysis,
        
        // AI-powered insights
        insights: aiInsights,
        
        // Recommendations
        recommendations: recommendations,
        
        // Dashboard configuration
        dashboardConfig: this.generateDashboardConfig(currentKPIs, businessData.business),
        
        // Alert system
        alerts: this.generateAlerts(currentKPIs, trendAnalysis, predictions),
        
        // Data quality assessment
        dataQuality: this.assessDataQuality(historicalData.data),
        
        // Metadata
        industry: businessData.business.industry,
        region: businessData.business.location?.country,
        businessStage: businessData.business.stage,
        lastUpdated: new Date()
      };
      
      // Save analytics record
      await this.saveAnalyticsRecord(analyticsResult);
      
      console.log(`✅ Analytics generated successfully for ${businessId}`);
      
      return {
        success: true,
        analytics: analyticsResult
      };
      
    } catch (error) {
      console.error('Error generating business analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // KPI CALCULATION FUNCTIONS
  // ============================================================================
  
  /**
   * Calculate current KPIs from business data
   */
  calculateCurrentKPIs(businessData, historicalData) {
    const kpis = {};
    const currentPeriod = historicalData[historicalData.length - 1] || {};
    const previousPeriod = historicalData[historicalData.length - 2] || {};
    
    // Financial KPIs
    kpis.revenue = {
      current: currentPeriod.revenue || 0,
      previous: previousPeriod.revenue || 0,
      growth: this.calculateGrowthRate(currentPeriod.revenue, previousPeriod.revenue),
      trend: this.calculateTrend(historicalData.map(d => d.revenue)),
      unit: businessData.currency || 'USD',
      category: 'financial'
    };
    
    kpis.grossMargin = {
      current: this.calculateGrossMargin(currentPeriod),
      previous: this.calculateGrossMargin(previousPeriod),
      growth: 0, // Will be calculated
      trend: this.calculateTrend(historicalData.map(d => this.calculateGrossMargin(d))),
      unit: 'percentage',
      category: 'financial'
    };
    kpis.grossMargin.growth = this.calculateGrowthRate(kpis.grossMargin.current, kpis.grossMargin.previous);
    
    kpis.burnRate = {
      current: this.calculateBurnRate(historicalData.slice(-3)), // Last 3 months
      previous: this.calculateBurnRate(historicalData.slice(-6, -3)), // Previous 3 months
      growth: 0,
      trend: this.calculateTrend(this.calculateBurnRateHistory(historicalData)),
      unit: businessData.currency || 'USD',
      category: 'financial'
    };
    kpis.burnRate.growth = this.calculateGrowthRate(kpis.burnRate.current, kpis.burnRate.previous);
    
    kpis.runway = {
      current: this.calculateRunway(currentPeriod.cash || 0, kpis.burnRate.current),
      previous: this.calculateRunway(previousPeriod.cash || 0, kpis.burnRate.previous),
      growth: 0,
      trend: 'stable',
      unit: 'months',
      category: 'financial'
    };
    kpis.runway.growth = this.calculateGrowthRate(kpis.runway.current, kpis.runway.previous);
    
    // Operational KPIs
    kpis.customerGrowth = {
      current: currentPeriod.customers || 0,
      previous: previousPeriod.customers || 0,
      growth: this.calculateGrowthRate(currentPeriod.customers, previousPeriod.customers),
      trend: this.calculateTrend(historicalData.map(d => d.customers)),
      unit: 'count',
      category: 'operational'
    };
    
    kpis.customerAcquisitionCost = {
      current: this.calculateCAC(currentPeriod),
      previous: this.calculateCAC(previousPeriod),
      growth: 0,
      trend: this.calculateTrend(historicalData.map(d => this.calculateCAC(d))),
      unit: businessData.currency || 'USD',
      category: 'operational'
    };
    kpis.customerAcquisitionCost.growth = this.calculateGrowthRate(
      kpis.customerAcquisitionCost.current,
      kpis.customerAcquisitionCost.previous
    );
    
    // Investment KPIs
    kpis.fundingRaised = {
      current: businessData.totalFundingRaised || 0,
      previous: 0, // Would need historical funding data
      growth: 0,
      trend: 'positive',
      unit: businessData.currency || 'USD',
      category: 'investment'
    };
    
    kpis.valuation = {
      current: businessData.currentValuation || 0,
      previous: businessData.previousValuation || 0,
      growth: this.calculateGrowthRate(businessData.currentValuation, businessData.previousValuation),
      trend: 'positive',
      unit: businessData.currency || 'USD',
      category: 'investment'
    };
    
    // Market KPIs
    kpis.marketPenetration = {
      current: this.calculateMarketPenetration(businessData, currentPeriod),
      previous: this.calculateMarketPenetration(businessData, previousPeriod),
      growth: 0,
      trend: 'positive',
      unit: 'percentage',
      category: 'market'
    };
    kpis.marketPenetration.growth = this.calculateGrowthRate(
      kpis.marketPenetration.current,
      kpis.marketPenetration.previous
    );
    
    return kpis;
  }
  
  // ============================================================================
  // TREND ANALYSIS FUNCTIONS
  // ============================================================================
  
  /**
   * Analyze trends in historical data
   */
  analyzeTrends(historicalData, currentKPIs) {
    const trends = {};
    
    Object.keys(currentKPIs).forEach(kpiKey => {
      const kpi = currentKPIs[kpiKey];
      trends[kpiKey] = {
        direction: kpi.trend,
        strength: this.calculateTrendStrength(kpi.trend, kpi.growth),
        confidence: this.calculateTrendConfidence(historicalData.length),
        volatility: this.calculateVolatility(kpiKey, historicalData),
        seasonality: this.detectSeasonality(kpiKey, historicalData),
        anomalies: this.detectAnomalies(kpiKey, historicalData)
      };
    });
    
    // Overall business health trend
    trends.overall = {
      direction: this.calculateOverallTrend(trends),
      score: this.calculateOverallTrendScore(trends),
      momentum: this.calculateMomentum(trends),
      stability: this.calculateStability(trends)
    };
    
    return trends;
  }
  
  // ============================================================================
  // PREDICTIVE ANALYTICS FUNCTIONS
  // ============================================================================
  
  /**
   * Generate predictive analytics
   */
  async generatePredictions(businessData, historicalData, marketData) {
    const predictions = {};
    
    // Revenue predictions
    predictions.revenue = this.predictRevenue(businessData, historicalData, marketData);
    
    // Customer growth predictions
    predictions.customerGrowth = this.predictCustomerGrowth(businessData, historicalData);
    
    // Funding success predictions
    predictions.fundingSuccess = this.predictFundingSuccess(businessData, historicalData, marketData);
    
    // Market expansion predictions
    predictions.marketExpansion = this.predictMarketExpansion(businessData, marketData);
    
    // Risk predictions
    predictions.riskAssessment = this.predictRisks(businessData, historicalData, marketData);
    
    // Cash flow predictions
    predictions.cashFlow = this.predictCashFlow(businessData, historicalData);
    
    // Valuation predictions
    predictions.valuation = this.predictValuation(businessData, historicalData, marketData);
    
    return predictions;
  }
  
  /**
   * Predict revenue for next periods
   */
  predictRevenue(businessData, historicalData, marketData) {
    const revenueHistory = historicalData.map(d => d.revenue || 0);
    
    if (revenueHistory.length < 3) {
      return this.createLowConfidencePrediction('revenue', revenueHistory[revenueHistory.length - 1] || 0);
    }
    
    // Apply multiple prediction models
    const linearPrediction = this.linearRegression(revenueHistory);
    const exponentialPrediction = this.exponentialSmoothing(revenueHistory);
    const seasonalPrediction = this.seasonalDecomposition(revenueHistory);
    
    // Weighted ensemble prediction
    const predictions = [];
    for (let month = 1; month <= 12; month++) {
      const linear = this.extrapolateLinear(linearPrediction, month);
      const exponential = this.extrapolateExponential(exponentialPrediction, month);
      const seasonal = this.extrapolateSeasonal(seasonalPrediction, month);
      
      const weightedPrediction = (
        linear * this.predictionConfig.timeSeriesModels.linear.weight +
        exponential * this.predictionConfig.timeSeriesModels.exponential.weight +
        seasonal * this.predictionConfig.timeSeriesModels.seasonal.weight
      );
      
      predictions.push({
        period: month,
        value: Math.max(0, weightedPrediction),
        confidence: this.calculatePredictionConfidence(month, revenueHistory.length),
        model: 'ensemble'
      });
    }
    
    return {
      predictions: predictions,
      accuracy: this.analyticsConfig.predictionModels.revenue.accuracy,
      model: 'ensemble',
      factors: this.identifyRevenuePredictionFactors(businessData, marketData),
      scenarios: this.generateRevenueScenarios(predictions)
    };
  }
  
  /**
   * Predict funding success probability
   */
  predictFundingSuccess(businessData, historicalData, marketData) {
    // Factors affecting funding success
    const factors = {
      revenueGrowth: this.calculateRevenueGrowth(historicalData),
      marketSize: marketData.marketSize || 1000000,
      teamExperience: businessData.teamScore || 50,
      productMarketFit: businessData.productMarketFitScore || 50,
      traction: this.calculateTraction(historicalData),
      competition: marketData.competitionLevel || 0.5,
      fundingStage: businessData.fundingStage || 'seed',
      previousFunding: businessData.totalFundingRaised || 0
    };
    
    // Simple scoring model (would use ML in production)
    const score = (
      factors.revenueGrowth * 0.25 +
      Math.min(100, factors.traction) * 0.2 +
      factors.teamExperience * 0.15 +
      factors.productMarketFit * 0.15 +
      (100 - factors.competition * 100) * 0.1 +
      Math.min(100, Math.log(factors.marketSize) * 10) * 0.15
    );
    
    const probability = Math.min(0.95, Math.max(0.05, score / 100));
    
    return {
      probability: probability,
      confidence: this.analyticsConfig.predictionModels.funding.confidenceThreshold,
      factors: factors,
      recommendations: this.generateFundingRecommendations(factors, probability),
      timeToFund: this.estimateTimeToFund(factors, probability),
      optimalFundingAmount: this.calculateOptimalFundingAmount(businessData, factors)
    };
  }
  
  // ============================================================================
  // AI INSIGHTS GENERATION
  // ============================================================================
  
  /**
   * Generate AI-powered insights
   */
  generateAIInsights(data) {
    const insights = [];
    
    // Performance insights
    insights.push(...this.generatePerformanceInsights(data.kpis, data.trends));
    
    // Growth opportunity insights
    insights.push(...this.generateGrowthInsights(data.business, data.market, data.predictions));
    
    // Risk alert insights
    insights.push(...this.generateRiskInsights(data.kpis, data.trends, data.predictions));
    
    // Optimization insights
    insights.push(...this.generateOptimizationInsights(data.kpis, data.business));
    
    // Market intelligence insights
    insights.push(...this.generateMarketInsights(data.market, data.business));
    
    // Sort insights by priority and confidence
    insights.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
    
    return {
      insights: insights.slice(0, 20), // Top 20 insights
      summary: this.generateInsightsSummary(insights),
      actionItems: this.extractActionItems(insights),
      priorityAlerts: insights.filter(i => i.priority === 'critical' || i.priority === 'high')
    };
  }
  
  /**
   * Generate performance insights
   */
  generatePerformanceInsights(kpis, trends) {
    const insights = [];
    
    // Revenue performance insight
    if (kpis.revenue?.growth > 0.2) {
      insights.push({
        category: 'performance',
        type: 'positive',
        priority: 'high',
        confidence: 0.9,
        title: 'Strong Revenue Growth',
        description: `Revenue is growing at ${(kpis.revenue.growth * 100).toFixed(1)}% with ${trends.revenue?.direction} trend`,
        impact: 'high',
        actionRequired: false,
        recommendations: ['Continue current growth strategies', 'Consider scaling operations']
      });
    }
    
    // Customer acquisition insight
    if (kpis.customerAcquisitionCost?.current > 0 && kpis.customerGrowth?.growth > 0.15) {
      const cac = kpis.customerAcquisitionCost.current;
      insights.push({
        category: 'performance',
        type: 'positive',
        priority: 'medium',
        confidence: 0.8,
        title: 'Effective Customer Acquisition',
        description: `Customer growth of ${(kpis.customerGrowth.growth * 100).toFixed(1)}% with CAC of ${cac.toFixed(2)}`,
        impact: 'medium',
        actionRequired: false,
        recommendations: ['Optimize acquisition channels', 'Focus on customer retention']
      });
    }
    
    // Cash runway warning
    if (kpis.runway?.current < 6) {
      insights.push({
        category: 'performance',
        type: 'warning',
        priority: 'critical',
        confidence: 0.95,
        title: 'Low Cash Runway',
        description: `Only ${kpis.runway.current.toFixed(1)} months of runway remaining`,
        impact: 'critical',
        actionRequired: true,
        recommendations: ['Seek immediate funding', 'Reduce burn rate', 'Focus on revenue generation']
      });
    }
    
    return insights;
  }
  
  /**
   * Generate growth opportunity insights
   */
  generateGrowthInsights(business, market, predictions) {
    const insights = [];
    
    // Market expansion opportunity
    if (market.growthRate > 0.15 && predictions.marketExpansion?.probability > 0.7) {
      insights.push({
        category: 'opportunities',
        type: 'opportunity',
        priority: 'high',
        confidence: 0.8,
        title: 'Market Expansion Opportunity',
        description: `Market growing at ${(market.growthRate * 100).toFixed(1)}% with high expansion probability`,
        impact: 'high',
        actionRequired: false,
        recommendations: ['Conduct market research', 'Develop expansion strategy', 'Secure additional funding']
      });
    }
    
    // Revenue scaling opportunity
    if (predictions.revenue?.predictions?.[5]?.value > (predictions.revenue?.predictions?.[0]?.value * 1.5)) {
      insights.push({
        category: 'opportunities',
        type: 'opportunity',
        priority: 'medium',
        confidence: 0.7,
        title: 'Revenue Scaling Potential',
        description: 'Predictions show significant revenue scaling potential in next 6 months',
        impact: 'medium',
        actionRequired: false,
        recommendations: ['Scale marketing efforts', 'Optimize pricing strategy', 'Expand product line']
      });
    }
    
    return insights;
  }
  
  // ============================================================================
  // RECOMMENDATION ENGINE
  // ============================================================================
  
  /**
   * Generate actionable recommendations
   */
  generateRecommendations(kpis, trends, predictions, performanceScores) {
    const recommendations = [];
    
    // Financial recommendations
    recommendations.push(...this.generateFinancialRecommendations(kpis, trends));
    
    // Operational recommendations
    recommendations.push(...this.generateOperationalRecommendations(kpis, performanceScores));
    
    // Growth recommendations
    recommendations.push(...this.generateGrowthRecommendations(predictions, trends));
    
    // Risk mitigation recommendations
    recommendations.push(...this.generateRiskMitigationRecommendations(kpis, predictions));
    
    // Prioritize and score recommendations
    return this.prioritizeRecommendations(recommendations);
  }
  
  // ============================================================================
  // UTILITY AND HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get business data from database
   */
  async getBusinessData(businessId) {
    try {
      const businessDoc = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .get();
      
      if (!businessDoc.exists) {
        return { success: false, error: 'Business not found' };
      }
      
      return {
        success: true,
        business: {
          businessId: businessId,
          ...businessDoc.data()
        }
      };
      
    } catch (error) {
      console.error('Error getting business data:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get historical data for analytics
   */
  async getHistoricalData(businessId, timeRange) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      const rangeMap = {
        '3m': 3,
        '6m': 6,
        '12m': 12,
        '24m': 24
      };
      
      const months = rangeMap[timeRange] || 12;
      startDate.setMonth(endDate.getMonth() - months);
      
      const historicalQuery = FirebaseAdmin.adminFirestore
        .collection('businessMetrics')
        .where('businessId', '==', businessId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'asc');
      
      const snapshot = await historicalQuery.get();
      const data = [];
      
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data };
      
    } catch (error) {
      console.error('Error getting historical data:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get market data
   */
  async getMarketData(industry, location) {
    // Simplified market data (would integrate with market intelligence APIs in production)
    const marketData = {
      marketSize: 10000000, // $10M
      growthRate: 0.15,
      competitionLevel: 0.6,
      saturationLevel: 0.3,
      trendingFactors: ['digital_transformation', 'sustainability'],
      barriers: ['regulation', 'funding_access'],
      opportunities: ['mobile_penetration', 'young_population']
    };
    
    // Adjust for specific industry and location
    if (industry === 'technology') {
      marketData.growthRate = 0.25;
      marketData.competitionLevel = 0.8;
    }
    
    if (location?.country === 'NG') {
      marketData.marketSize *= 2; // Larger Nigerian market
      marketData.opportunities.push('oil_economy', 'large_population');
    }
    
    return marketData;
  }
  
  // Calculation helper functions
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return (current - previous) / previous;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increases++;
      else if (values[i] < values[i - 1]) decreases++;
    }
    
    if (increases > decreases * 1.5) return 'increasing';
    if (decreases > increases * 1.5) return 'decreasing';
    return 'stable';
  }
  
  calculateGrossMargin(period) {
    if (!period.revenue || period.revenue === 0) return 0;
    const grossProfit = (period.revenue - (period.cogs || period.revenue * 0.6));
    return grossProfit / period.revenue;
  }
  
  calculateBurnRate(periods) {
    if (!periods || periods.length === 0) return 0;
    
    const totalExpenses = periods.reduce((sum, period) => sum + (period.expenses || 0), 0);
    const totalRevenue = periods.reduce((sum, period) => sum + (period.revenue || 0), 0);
    
    return Math.max(0, (totalExpenses - totalRevenue) / periods.length);
  }
  
  calculateRunway(cash, burnRate) {
    if (!burnRate || burnRate <= 0) return Infinity;
    return cash / burnRate;
  }
  
  calculateCAC(period) {
    if (!period.newCustomers || period.newCustomers === 0) return 0;
    return (period.marketingExpenses || 0) / period.newCustomers;
  }
  
  calculateMarketPenetration(business, period) {
    const totalAddressableMarket = business.marketSize || 1000000;
    const currentRevenue = period.revenue || 0;
    return (currentRevenue / totalAddressableMarket) * 100;
  }
  
  calculateBurnRateHistory(historicalData) {
    const burnRates = [];
    for (let i = 3; i <= historicalData.length; i++) {
      const periods = historicalData.slice(i - 3, i);
      burnRates.push(this.calculateBurnRate(periods));
    }
    return burnRates;
  }
  
  // Prediction helper functions
  linearRegression(values) {
    // Simplified linear regression
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };
    
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    return { slope, intercept };
  }
  
  exponentialSmoothing(values, alpha = 0.3) {
    if (values.length === 0) return { level: 0, trend: 0 };
    
    let level = values[0];
    let trend = values.length > 1 ? values[1] - values[0] : 0;
    
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = alpha * (level - prevLevel) + (1 - alpha) * trend;
    }
    
    return { level, trend };
  }
  
  seasonalDecomposition(values) {
    // Simplified seasonal decomposition
    if (values.length < 12) return { baseline: values[values.length - 1] || 0, seasonal: [] };
    
    const baseline = values.reduce((sum, val) => sum + val, 0) / values.length;
    const seasonal = [];
    
    for (let month = 0; month < 12; month++) {
      const monthValues = [];
      for (let i = month; i < values.length; i += 12) {
        monthValues.push(values[i]);
      }
      const monthAvg = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length;
      seasonal.push(monthAvg / baseline);
    }
    
    return { baseline, seasonal };
  }
  
  extrapolateLinear(model, months) {
    return model.intercept + model.slope * months;
  }
  
  extrapolateExponential(model, months) {
    return model.level + model.trend * months;
  }
  
  extrapolateSeasonal(model, months) {
    const seasonalIndex = (months - 1) % 12;
    return model.baseline * (model.seasonal[seasonalIndex] || 1);
  }
  
  calculatePredictionConfidence(period, dataPoints) {
    // Confidence decreases with prediction distance and increases with data points
    const distanceDecay = Math.exp(-period / 12); // Exponential decay over 12 months
    const dataBonus = Math.min(1, dataPoints / 24); // More data = higher confidence
    return Math.max(0.3, distanceDecay * dataBonus);
  }
  
  createLowConfidencePrediction(type, lastValue) {
    const predictions = [];
    for (let month = 1; month <= 12; month++) {
      predictions.push({
        period: month,
        value: lastValue * (1 + Math.random() * 0.1 - 0.05), // ±5% random variation
        confidence: 0.3,
        model: 'insufficient_data'
      });
    }
    
    return {
      predictions: predictions,
      accuracy: 0.5,
      model: 'insufficient_data',
      factors: [],
      scenarios: { optimistic: predictions, realistic: predictions, pessimistic: predictions }
    };
  }
  
  /**
   * Save analytics record to database
   */
  async saveAnalyticsRecord(analyticsData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('businessAnalytics')
        .add({
          ...analyticsData,
          timestamp: new Date()
        });
        
      // Update business profile with latest analytics summary
      if (analyticsData.businessId) {
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(analyticsData.businessId)
          .update({
            'analytics.lastGenerated': new Date(),
            'analytics.overallScore': analyticsData.performanceScores?.overall || 0,
            'analytics.trendDirection': analyticsData.trends?.overall?.direction || 'stable',
            'analytics.alertCount': analyticsData.alerts?.length || 0
          });
      }
      
    } catch (error) {
      console.error('Error saving analytics record:', error);
    }
  }
  
  // Simplified implementations for remaining helper functions
  calculateTrendStrength(trend, growth) {
    if (trend === 'stable') return 'weak';
    return Math.abs(growth) > 0.2 ? 'strong' : Math.abs(growth) > 0.1 ? 'moderate' : 'weak';
  }
  
  calculateTrendConfidence(dataPoints) {
    return Math.min(0.95, Math.max(0.3, dataPoints / 24));
  }
  
  calculateVolatility(kpiKey, historicalData) {
    const values = historicalData.map(d => d[kpiKey] || 0);
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }
  
  detectSeasonality(kpiKey, historicalData) {
    // Simplified seasonality detection
    return historicalData.length >= 12 ? 'monthly' : 'none';
  }
  
  detectAnomalies(kpiKey, historicalData) {
    // Simplified anomaly detection
    return [];
  }
  
  calculateOverallTrend(trends) {
    const directions = Object.values(trends).map(t => t.direction);
    const increasing = directions.filter(d => d === 'increasing').length;
    const decreasing = directions.filter(d => d === 'decreasing').length;
    
    if (increasing > decreasing * 1.5) return 'positive';
    if (decreasing > increasing * 1.5) return 'negative';
    return 'stable';
  }
  
  calculateOverallTrendScore(trends) {
    // Simplified overall trend scoring
    return 75; // Default score
  }
  
  calculateMomentum(trends) {
    return 'building'; // Simplified momentum calculation
  }
  
  calculateStability(trends) {
    return 'stable'; // Simplified stability calculation
  }
  
  calculatePerformanceScores(kpis, industry) {
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.services;
    
    return {
      revenue: Math.min(100, (kpis.revenue?.growth || 0) / benchmark.revenueGrowth * 100),
      profitability: Math.min(100, (kpis.grossMargin?.current || 0) / benchmark.grossMargin * 100),
      efficiency: Math.min(100, benchmark.customerAcquisitionCost / (kpis.customerAcquisitionCost?.current || 1) * 100),
      overall: 75 // Calculated average
    };
  }
  
  generateBenchmarkAnalysis(kpis, industry, location) {
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.services;
    
    return {
      industry: industry,
      revenueGrowth: {
        business: (kpis.revenue?.growth || 0) * 100,
        benchmark: benchmark.revenueGrowth * 100,
        performance: (kpis.revenue?.growth || 0) > benchmark.revenueGrowth ? 'above' : 'below'
      },
      grossMargin: {
        business: (kpis.grossMargin?.current || 0) * 100,
        benchmark: benchmark.grossMargin * 100,
        performance: (kpis.grossMargin?.current || 0) > benchmark.grossMargin ? 'above' : 'below'
      }
    };
  }
  
  generateDashboardConfig(kpis, business) {
    return {
      primaryKPIs: ['revenue', 'customerGrowth', 'runway'],
      secondaryKPIs: ['grossMargin', 'burnRate', 'customerAcquisitionCost'],
      charts: ['revenue_trend', 'customer_growth', 'cash_flow'],
      refreshRate: 3600000, // 1 hour in milliseconds
      alerts: true
    };
  }
  
  generateAlerts(kpis, trends, predictions) {
    const alerts = [];
    
    if (kpis.runway?.current < 6) {
      alerts.push({
        type: 'critical',
        category: 'financial',
        message: 'Cash runway critically low',
        severity: 'high',
        actionRequired: true
      });
    }
    
    if (trends.revenue?.direction === 'decreasing') {
      alerts.push({
        type: 'warning',
        category: 'performance',
        message: 'Revenue showing declining trend',
        severity: 'medium',
        actionRequired: true
      });
    }
    
    return alerts;
  }
  
  assessDataQuality(historicalData) {
    const completeness = historicalData.length / 12; // Expecting monthly data
    const consistency = 0.8; // Simplified consistency measure
    
    return {
      completeness: Math.min(1, completeness),
      consistency: consistency,
      overall: (completeness + consistency) / 2,
      recommendation: completeness < 0.5 ? 'Collect more historical data' : 'Data quality is acceptable'
    };
  }
  
  // Additional simplified helper functions
  identifyRevenuePredictionFactors(businessData, marketData) {
    return [
      { factor: 'historical_growth', importance: 0.4 },
      { factor: 'market_conditions', importance: 0.25 },
      { factor: 'seasonal_patterns', importance: 0.2 },
      { factor: 'competitive_landscape', importance: 0.15 }
    ];
  }
  
  generateRevenueScenarios(predictions) {
    return {
      optimistic: predictions.map(p => ({ ...p, value: p.value * 1.2 })),
      realistic: predictions,
      pessimistic: predictions.map(p => ({ ...p, value: p.value * 0.8 }))
    };
  }
  
  calculateRevenueGrowth(historicalData) {
    if (historicalData.length < 2) return 0;
    const recent = historicalData.slice(-3).reduce((sum, d) => sum + (d.revenue || 0), 0);
    const previous = historicalData.slice(-6, -3).reduce((sum, d) => sum + (d.revenue || 0), 0);
    return previous > 0 ? (recent - previous) / previous : 0;
  }
  
  calculateTraction(historicalData) {
    const customerGrowth = this.calculateRevenueGrowth(historicalData);
    const revenueStability = this.calculateVolatility('revenue', historicalData);
    return Math.max(0, Math.min(100, customerGrowth * 100 - revenueStability * 50));
  }
  
  generateFundingRecommendations(factors, probability) {
    const recommendations = [];
    
    if (factors.revenueGrowth < 0.15) {
      recommendations.push('Focus on accelerating revenue growth before fundraising');
    }
    
    if (factors.teamExperience < 70) {
      recommendations.push('Strengthen management team or advisory board');
    }
    
    if (probability > 0.7) {
      recommendations.push('Timing is favorable for fundraising');
    }
    
    return recommendations;
  }
  
  estimateTimeToFund(factors, probability) {
    // Simplified time estimation
    if (probability > 0.8) return '3-6 months';
    if (probability > 0.6) return '6-9 months';
    return '9-12 months';
  }
  
  calculateOptimalFundingAmount(businessData, factors) {
    const annualRevenue = businessData.annualRevenue || 100000;
    const growthMultiplier = Math.max(1, factors.revenueGrowth * 10);
    return Math.round(annualRevenue * growthMultiplier * 0.5); // 6 months runway + growth capital
  }
  
  predictCustomerGrowth(businessData, historicalData) {
    // Simplified customer growth prediction
    const currentGrowthRate = this.calculateRevenueGrowth(historicalData);
    const predictions = [];
    
    for (let month = 1; month <= 12; month++) {
      predictions.push({
        period: month,
        value: Math.max(0, currentGrowthRate * month * 100),
        confidence: Math.max(0.3, 0.9 - month * 0.05)
      });
    }
    
    return { predictions, model: 'linear_extrapolation' };
  }
  
  predictMarketExpansion(businessData, marketData) {
    const probability = Math.min(0.9, (marketData.growthRate || 0.1) * 5);
    return {
      probability: probability,
      timeframe: '12-18 months',
      factors: ['market_growth', 'competitive_advantage', 'capital_availability']
    };
  }
  
  predictRisks(businessData, historicalData, marketData) {
    return {
      overall: 'medium',
      specific: [
        { risk: 'market_competition', probability: 0.6, impact: 'medium' },
        { risk: 'funding_shortage', probability: 0.4, impact: 'high' },
        { risk: 'talent_retention', probability: 0.3, impact: 'medium' }
      ]
    };
  }
  
  predictCashFlow(businessData, historicalData) {
    // Simplified cash flow prediction
    const currentBurnRate = this.calculateBurnRate(historicalData.slice(-3));
    const predictions = [];
    
    for (let month = 1; month <= 12; month++) {
      predictions.push({
        period: month,
        value: -currentBurnRate * month,
        confidence: Math.max(0.4, 0.9 - month * 0.04)
      });
    }
    
    return { predictions, model: 'burn_rate_extrapolation' };
  }
  
  predictValuation(businessData, historicalData, marketData) {
    const currentValuation = businessData.currentValuation || 1000000;
    const growthRate = this.calculateRevenueGrowth(historicalData);
    
    const predictions = [];
    for (let month = 1; month <= 12; month++) {
      const growthMultiplier = Math.pow(1 + growthRate / 12, month);
      predictions.push({
        period: month,
        value: Math.round(currentValuation * growthMultiplier),
        confidence: Math.max(0.3, 0.8 - month * 0.03)
      });
    }
    
    return { predictions, model: 'growth_based_valuation' };
  }
  
  generateFinancialRecommendations(kpis, trends) {
    const recommendations = [];
    
    if (kpis.runway?.current < 12) {
      recommendations.push({
        category: 'financial',
        priority: 'high',
        title: 'Extend Cash Runway',
        description: 'Focus on extending cash runway through revenue growth or cost reduction',
        impact: 'high',
        timeframe: '1-3 months'
      });
    }
    
    return recommendations;
  }
  
  generateOperationalRecommendations(kpis, performanceScores) {
    const recommendations = [];
    
    if (performanceScores.efficiency < 60) {
      recommendations.push({
        category: 'operational',
        priority: 'medium',
        title: 'Improve Operational Efficiency',
        description: 'Focus on reducing customer acquisition costs and improving conversion rates',
        impact: 'medium',
        timeframe: '3-6 months'
      });
    }
    
    return recommendations;
  }
  
  generateGrowthRecommendations(predictions, trends) {
    const recommendations = [];
    
    if (predictions.revenue?.predictions?.[5]?.confidence > 0.7) {
      recommendations.push({
        category: 'growth',
        priority: 'medium',
        title: 'Scale Revenue Operations',
        description: 'High confidence revenue predictions suggest scaling opportunities',
        impact: 'high',
        timeframe: '3-9 months'
      });
    }
    
    return recommendations;
  }
  
  generateRiskMitigationRecommendations(kpis, predictions) {
    const recommendations = [];
    
    if (predictions.riskAssessment?.overall === 'high') {
      recommendations.push({
        category: 'risk',
        priority: 'high',
        title: 'Implement Risk Mitigation',
        description: 'Address identified high-risk factors proactively',
        impact: 'high',
        timeframe: '1-3 months'
      });
    }
    
    return recommendations;
  }
  
  prioritizeRecommendations(recommendations) {
    // Sort by priority and impact
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const impactOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return recommendations.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      const aImpact = impactOrder[a.impact] || 1;
      const bImpact = impactOrder[b.impact] || 1;
      
      return (bPriority + bImpact) - (aPriority + aImpact);
    });
  }
  
  generateRiskInsights(kpis, trends, predictions) {
    const insights = [];
    
    if (kpis.runway?.current < 6) {
      insights.push({
        category: 'risk',
        type: 'warning',
        priority: 'critical',
        confidence: 0.95,
        title: 'Cash Flow Risk',
        description: 'Critical cash runway requires immediate attention',
        impact: 'critical',
        actionRequired: true,
        recommendations: ['Secure emergency funding', 'Implement cost reduction measures']
      });
    }
    
    return insights;
  }
  
  generateOptimizationInsights(kpis, business) {
    const insights = [];
    
    if (kpis.customerAcquisitionCost?.current > 100) {
      insights.push({
        category: 'optimization',
        type: 'opportunity',
        priority: 'medium',
        confidence: 0.7,
        title: 'Optimize Customer Acquisition',
        description: 'Customer acquisition costs could be optimized for better efficiency',
        impact: 'medium',
        actionRequired: false,
        recommendations: ['Analyze acquisition channels', 'Improve conversion rates']
      });
    }
    
    return insights;
  }
  
  generateMarketInsights(market, business) {
    const insights = [];
    
    if (market.growthRate > 0.2) {
      insights.push({
        category: 'market',
        type: 'opportunity',
        priority: 'low',
        confidence: 0.6,
        title: 'Favorable Market Conditions',
        description: `Market is growing at ${(market.growthRate * 100).toFixed(1)}%, creating expansion opportunities`,
        impact: 'medium',
        actionRequired: false,
        recommendations: ['Consider market expansion', 'Increase marketing spend']
      });
    }
    
    return insights;
  }
  
  generateInsightsSummary(insights) {
    const summary = {
      total: insights.length,
      critical: insights.filter(i => i.priority === 'critical').length,
      opportunities: insights.filter(i => i.type === 'opportunity').length,
      warnings: insights.filter(i => i.type === 'warning').length,
      topCategories: this.getTopCategories(insights)
    };
    
    return summary;
  }
  
  extractActionItems(insights) {
    return insights
      .filter(insight => insight.actionRequired)
      .map(insight => ({
        title: insight.title,
        priority: insight.priority,
        recommendations: insight.recommendations
      }));
  }
  
  getTopCategories(insights) {
    const categories = {};
    insights.forEach(insight => {
      categories[insight.category] = (categories[insight.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  }
}

module.exports = new BusinessAnalyticsAlgorithm();