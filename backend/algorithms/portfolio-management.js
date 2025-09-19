/**
 * BVESTER PLATFORM - PORTFOLIO MANAGEMENT ALGORITHM
 * Week 9: Portfolio Optimization Implementation
 * Modern Portfolio Theory with African SME investment optimization
 * Generated: January 29, 2025
 */

const FirebaseService = require('../api/firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class PortfolioManagementAlgorithm {
  constructor() {
    // Portfolio optimization configuration
    this.optimizationConfig = {
      riskFreeRate: 0.05, // 5% risk-free rate
      targetReturns: [0.08, 0.12, 0.16, 0.20, 0.25], // Target return levels
      rebalancingThreshold: 0.05, // 5% drift threshold
      minAllocation: 0.02, // Minimum 2% allocation per asset
      maxAllocation: 0.30, // Maximum 30% allocation per asset
      correlationPeriod: 24, // 24 months for correlation calculation
    };
    
    // Risk tolerance levels and corresponding parameters
    this.riskProfiles = {
      'very_conservative': {
        targetRisk: 0.08,
        targetReturn: 0.10,
        maxDrawdown: 0.05,
        timeHorizon: 12, // months
        diversificationWeight: 0.4
      },
      'conservative': {
        targetRisk: 0.12,
        targetReturn: 0.13,
        maxDrawdown: 0.08,
        timeHorizon: 24,
        diversificationWeight: 0.35
      },
      'moderate': {
        targetRisk: 0.16,
        targetReturn: 0.16,
        maxDrawdown: 0.12,
        timeHorizon: 36,
        diversificationWeight: 0.3
      },
      'aggressive': {
        targetRisk: 0.22,
        targetReturn: 0.20,
        maxDrawdown: 0.18,
        timeHorizon: 48,
        diversificationWeight: 0.25
      },
      'very_aggressive': {
        targetRisk: 0.30,
        targetReturn: 0.25,
        maxDrawdown: 0.25,
        timeHorizon: 60,
        diversificationWeight: 0.2
      }
    };
    
    // Asset classification for diversification analysis
    this.assetClasses = {
      // By Investment Type
      equity: {
        expectedReturn: 0.18,
        volatility: 0.25,
        correlationFactors: ['market_sentiment', 'economic_growth']
      },
      debt: {
        expectedReturn: 0.12,
        volatility: 0.08,
        correlationFactors: ['interest_rates', 'credit_risk']
      },
      revenue_share: {
        expectedReturn: 0.15,
        volatility: 0.18,
        correlationFactors: ['business_performance', 'sector_trends']
      },
      
      // By Sector
      technology: {
        expectedReturn: 0.22,
        volatility: 0.35,
        beta: 1.3,
        correlationFactors: ['tech_adoption', 'digital_transformation']
      },
      agriculture: {
        expectedReturn: 0.14,
        volatility: 0.20,
        beta: 0.8,
        correlationFactors: ['commodity_prices', 'weather', 'policy']
      },
      manufacturing: {
        expectedReturn: 0.13,
        volatility: 0.18,
        beta: 1.1,
        correlationFactors: ['industrial_demand', 'raw_materials']
      },
      healthcare: {
        expectedReturn: 0.16,
        volatility: 0.15,
        beta: 0.7,
        correlationFactors: ['healthcare_demand', 'regulation']
      },
      financial_services: {
        expectedReturn: 0.19,
        volatility: 0.28,
        beta: 1.2,
        correlationFactors: ['financial_inclusion', 'regulation']
      },
      
      // By Geography
      nigeria: {
        expectedReturn: 0.18,
        volatility: 0.25,
        countryRiskPremium: 0.03,
        correlationFactors: ['oil_prices', 'naira_stability', 'policy']
      },
      kenya: {
        expectedReturn: 0.16,
        volatility: 0.20,
        countryRiskPremium: 0.02,
        correlationFactors: ['agriculture', 'tourism', 'tech_hub']
      },
      south_africa: {
        expectedReturn: 0.14,
        volatility: 0.22,
        countryRiskPremium: 0.02,
        correlationFactors: ['mining', 'rand_stability', 'political']
      },
      ghana: {
        expectedReturn: 0.15,
        volatility: 0.23,
        countryRiskPremium: 0.025,
        correlationFactors: ['gold_prices', 'cocoa', 'cedi_stability']
      }
    };
    
    // Performance metrics configuration
    self.performanceMetrics = {
      sharpeRatio: {
        excellent: 2.0,
        good: 1.5,
        fair: 1.0,
        poor: 0.5
      },
      informationRatio: {
        excellent: 0.75,
        good: 0.5,
        fair: 0.25,
        poor: 0
      },
      maxDrawdown: {
        excellent: 0.05,
        good: 0.10,
        fair: 0.15,
        poor: 0.25
      },
      volatility: {
        low: 0.10,
        moderate: 0.18,
        high: 0.25,
        very_high: 0.35
      }
    };
    
    // Rebalancing strategies
    this.rebalancingStrategies = {
      calendar: {
        frequency: 'quarterly',
        description: 'Rebalance every 3 months',
        pros: ['Predictable', 'Lower transaction costs'],
        cons: ['May miss optimal timing']
      },
      threshold: {
        frequency: 'trigger_based',
        description: 'Rebalance when allocation drifts >5%',
        pros: ['Responsive to market changes', 'Maintains target allocation'],
        cons: ['Higher transaction costs', 'More frequent trading']
      },
      hybrid: {
        frequency: 'adaptive',
        description: 'Quarterly review with threshold triggers',
        pros: ['Balanced approach', 'Cost-effective'],
        cons: ['More complex to implement']
      }
    };
  }
  
  // ============================================================================
  // MAIN PORTFOLIO OPTIMIZATION FUNCTION
  // ============================================================================
  
  /**
   * Optimize investor portfolio using Modern Portfolio Theory
   */
  async optimizePortfolio(investorId, preferences = {}) {
    try {
      console.log(`📊 Optimizing portfolio for investor: ${investorId}`);
      
      // Get investor profile and current portfolio
      const investorData = await this.getInvestorData(investorId);
      if (!investorData.success) {
        throw new Error('Investor data not found');
      }
      
      const currentPortfolio = await this.getCurrentPortfolio(investorId);
      const historicalData = await this.getPortfolioHistoricalData(investorId);
      
      // Determine risk profile and preferences
      const riskProfile = this.determineRiskProfile(investorData.investor, preferences);
      const investmentUniverse = await this.getInvestmentUniverse(investorData.investor);
      
      // Calculate expected returns and risk matrix
      const expectedReturns = this.calculateExpectedReturns(investmentUniverse, historicalData);
      const covarianceMatrix = this.calculateCovarianceMatrix(investmentUniverse, historicalData);
      const correlationMatrix = this.calculateCorrelationMatrix(covarianceMatrix);
      
      // Perform portfolio optimization
      const efficientFrontier = this.calculateEfficientFrontier(expectedReturns, covarianceMatrix);
      const optimalWeights = this.findOptimalPortfolio(
        expectedReturns,
        covarianceMatrix,
        riskProfile,
        preferences
      );
      
      // Analyze current portfolio performance
      const currentPerformance = this.analyzeCurrentPerformance(
        currentPortfolio,
        historicalData,
        expectedReturns,
        covarianceMatrix
      );
      
      // Calculate diversification metrics
      const diversificationAnalysis = this.analyzeDiversification(
        currentPortfolio,
        optimalWeights,
        correlationMatrix
      );
      
      // Generate rebalancing recommendations
      const rebalancingRecommendations = this.generateRebalancingRecommendations(
        currentPortfolio,
        optimalWeights,
        preferences
      );
      
      // Calculate projected performance
      const projectedPerformance = this.calculateProjectedPerformance(
        optimalWeights,
        expectedReturns,
        covarianceMatrix,
        riskProfile
      );
      
      // Risk analysis and stress testing
      const riskAnalysis = this.performRiskAnalysis(
        currentPortfolio,
        optimalWeights,
        historicalData,
        investmentUniverse
      );
      
      // Generate implementation strategy
      const implementationStrategy = this.generateImplementationStrategy(
        rebalancingRecommendations,
        investorData.investor,
        preferences
      );
      
      // Create comprehensive optimization result
      const optimizationResult = {
        investorId: investorId,
        optimizedAt: new Date(),
        
        // Current portfolio analysis
        currentPortfolio: {
          holdings: currentPortfolio,
          performance: currentPerformance,
          diversificationScore: diversificationAnalysis.currentScore
        },
        
        // Optimal portfolio recommendation
        optimalPortfolio: {
          weights: optimalWeights,
          expectedReturn: this.calculatePortfolioReturn(optimalWeights, expectedReturns),
          expectedRisk: this.calculatePortfolioRisk(optimalWeights, covarianceMatrix),
          sharpeRatio: this.calculateSharpeRatio(optimalWeights, expectedReturns, covarianceMatrix),
          diversificationScore: diversificationAnalysis.optimalScore
        },
        
        // Analysis and metrics
        efficientFrontier: efficientFrontier,
        diversificationAnalysis: diversificationAnalysis,
        riskAnalysis: riskAnalysis,
        
        // Recommendations and implementation
        rebalancingRecommendations: rebalancingRecommendations,
        implementationStrategy: implementationStrategy,
        projectedPerformance: projectedPerformance,
        
        // Market intelligence
        marketInsights: this.generateMarketInsights(investmentUniverse, expectedReturns),
        
        // Risk management
        riskManagement: this.generateRiskManagementPlan(riskAnalysis, riskProfile),
        
        // Configuration used
        riskProfile: riskProfile,
        preferences: preferences,
        optimizationMethod: 'modern_portfolio_theory',
        
        // Metadata
        lastRebalanced: currentPortfolio.lastRebalanced || null,
        nextRebalanceDate: this.calculateNextRebalanceDate(preferences.rebalancingStrategy),
        dataQuality: this.assessDataQuality(historicalData, investmentUniverse)
      };
      
      // Save optimization record
      await this.saveOptimizationRecord(optimizationResult);
      
      console.log(`✅ Portfolio optimization completed for ${investorId}`);
      console.log(`📈 Expected Return: ${(optimizationResult.optimalPortfolio.expectedReturn * 100).toFixed(2)}%`);
      console.log(`📉 Expected Risk: ${(optimizationResult.optimalPortfolio.expectedRisk * 100).toFixed(2)}%`);
      console.log(`⚡ Sharpe Ratio: ${optimizationResult.optimalPortfolio.sharpeRatio.toFixed(3)}`);
      
      return {
        success: true,
        optimization: optimizationResult
      };
      
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // MODERN PORTFOLIO THEORY CALCULATIONS
  // ============================================================================
  
  /**
   * Calculate expected returns for investment universe
   */
  calculateExpectedReturns(investmentUniverse, historicalData) {
    const expectedReturns = {};
    
    investmentUniverse.forEach(investment => {
      const investmentId = investment.id;
      const historicalReturns = this.getHistoricalReturns(investmentId, historicalData);
      
      if (historicalReturns.length > 0) {
        // Use historical mean with adjustments
        const historicalMean = this.calculateMean(historicalReturns);
        const trendAdjustment = this.calculateTrendAdjustment(historicalReturns);
        const riskAdjustment = this.calculateRiskAdjustment(investment);
        
        expectedReturns[investmentId] = Math.max(0, historicalMean + trendAdjustment + riskAdjustment);
      } else {
        // Use asset class expected return
        const assetClass = this.getAssetClass(investment);
        expectedReturns[investmentId] = assetClass.expectedReturn || 0.12; // Default 12%
      }
    });
    
    return expectedReturns;
  }
  
  /**
   * Calculate covariance matrix for portfolio optimization
   */
  calculateCovarianceMatrix(investmentUniverse, historicalData) {
    const assetIds = investmentUniverse.map(inv => inv.id);
    const n = assetIds.length;
    const covarianceMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    // Get return series for all assets
    const returnSeries = {};
    assetIds.forEach(id => {
      returnSeries[id] = this.getHistoricalReturns(id, historicalData);
    });
    
    // Calculate covariances
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const returns1 = returnSeries[assetIds[i]];
        const returns2 = returnSeries[assetIds[j]];
        
        if (i === j) {
          // Variance calculation
          covarianceMatrix[i][j] = this.calculateVariance(returns1);
        } else {
          // Covariance calculation
          covarianceMatrix[i][j] = this.calculateCovariance(returns1, returns2);
        }
      }
    }
    
    return {
      matrix: covarianceMatrix,
      assetIds: assetIds
    };
  }
  
  /**
   * Calculate correlation matrix from covariance matrix
   */
  calculateCorrelationMatrix(covarianceData) {
    const { matrix, assetIds } = covarianceData;
    const n = matrix.length;
    const correlationMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const variance1 = matrix[i][i];
        const variance2 = matrix[j][j];
        const covariance = matrix[i][j];
        
        if (variance1 > 0 && variance2 > 0) {
          correlationMatrix[i][j] = covariance / Math.sqrt(variance1 * variance2);
        } else {
          correlationMatrix[i][j] = i === j ? 1 : 0;
        }
      }
    }
    
    return {
      matrix: correlationMatrix,
      assetIds: assetIds
    };
  }
  
  /**
   * Calculate efficient frontier using quadratic optimization
   */
  calculateEfficientFrontier(expectedReturns, covarianceData) {
    const { matrix, assetIds } = covarianceData;
    const returns = assetIds.map(id => expectedReturns[id]);
    const n = returns.length;
    
    if (n === 0) return [];
    
    const targetReturns = this.optimizationConfig.targetReturns;
    const efficientPortfolios = [];
    
    targetReturns.forEach(targetReturn => {
      try {
        const weights = this.solveQuadraticOptimization(returns, matrix, targetReturn);
        const portfolioRisk = this.calculatePortfolioRisk(weights, { matrix, assetIds });
        const actualReturn = this.calculatePortfolioReturn(weights, expectedReturns);
        
        if (weights && portfolioRisk > 0) {
          efficientPortfolios.push({
            targetReturn: targetReturn,
            actualReturn: actualReturn,
            risk: portfolioRisk,
            weights: this.createWeightsObject(weights, assetIds),
            sharpeRatio: (actualReturn - this.optimizationConfig.riskFreeRate) / portfolioRisk
          });
        }
      } catch (error) {
        console.warn(`Error calculating efficient portfolio for return ${targetReturn}:`, error.message);
      }
    });
    
    // Sort by risk (ascending)
    efficientPortfolios.sort((a, b) => a.risk - b.risk);
    
    return efficientPortfolios;
  }
  
  /**
   * Find optimal portfolio based on investor preferences
   */
  findOptimalPortfolio(expectedReturns, covarianceData, riskProfile, preferences) {
    const { matrix, assetIds } = covarianceData;
    const returns = assetIds.map(id => expectedReturns[id]);
    
    // Determine target based on risk profile and preferences
    const targetReturn = preferences.targetReturn || riskProfile.targetReturn;
    const targetRisk = preferences.targetRisk || riskProfile.targetRisk;
    
    // Try multiple optimization approaches
    let optimalWeights;
    
    try {
      // Approach 1: Target return optimization
      if (preferences.optimizationObjective === 'return') {
        optimalWeights = this.solveQuadraticOptimization(returns, matrix, targetReturn);
      }
      // Approach 2: Risk parity
      else if (preferences.optimizationObjective === 'risk_parity') {
        optimalWeights = this.calculateRiskParityWeights(matrix, assetIds.length);
      }
      // Approach 3: Maximum Sharpe ratio (default)
      else {
        optimalWeights = this.findMaximumSharpePortfolio(returns, matrix);
      }
    } catch (error) {
      console.warn('Optimization failed, using equal weights:', error.message);
      optimalWeights = Array(assetIds.length).fill(1 / assetIds.length);
    }
    
    // Apply constraints
    optimalWeights = this.applyPortfolioConstraints(optimalWeights, preferences);
    
    return this.createWeightsObject(optimalWeights, assetIds);
  }
  
  // ============================================================================
  // DIVERSIFICATION ANALYSIS
  // ============================================================================
  
  /**
   * Analyze portfolio diversification across multiple dimensions
   */
  analyzeDiversification(currentPortfolio, optimalWeights, correlationData) {
    // Geographic diversification
    const geographicDiversification = this.analyzeGeographicDiversification(
      currentPortfolio,
      optimalWeights
    );
    
    // Sector diversification
    const sectorDiversification = this.analyzeSectorDiversification(
      currentPortfolio,
      optimalWeights
    );
    
    // Investment type diversification
    const typeDiversification = this.analyzeTypeDiversification(
      currentPortfolio,
      optimalWeights
    );
    
    // Risk level diversification
    const riskDiversification = this.analyzeRiskDiversification(
      currentPortfolio,
      optimalWeights
    );
    
    // Correlation-based diversification
    const correlationDiversification = this.analyzeCorrelationDiversification(
      currentPortfolio,
      optimalWeights,
      correlationData
    );
    
    // Calculate overall diversification scores
    const currentScore = this.calculateOverallDiversificationScore({
      geographic: geographicDiversification.current,
      sector: sectorDiversification.current,
      type: typeDiversification.current,
      risk: riskDiversification.current,
      correlation: correlationDiversification.current
    });
    
    const optimalScore = this.calculateOverallDiversificationScore({
      geographic: geographicDiversification.optimal,
      sector: sectorDiversification.optimal,
      type: typeDiversification.optimal,
      risk: riskDiversification.optimal,
      correlation: correlationDiversification.optimal
    });
    
    return {
      currentScore: currentScore,
      optimalScore: optimalScore,
      improvement: optimalScore - currentScore,
      
      // Detailed breakdowns
      geographic: geographicDiversification,
      sector: sectorDiversification,
      type: typeDiversification,
      risk: riskDiversification,
      correlation: correlationDiversification,
      
      // Recommendations
      recommendations: this.generateDiversificationRecommendations({
        geographic: geographicDiversification,
        sector: sectorDiversification,
        type: typeDiversification,
        risk: riskDiversification
      })
    };
  }
  
  /**
   * Analyze geographic diversification
   */
  analyzeGeographicDiversification(currentPortfolio, optimalWeights) {
    const countries = ['nigeria', 'kenya', 'south_africa', 'ghana', 'other'];
    
    const currentDistribution = this.calculateGeographicDistribution(currentPortfolio);
    const optimalDistribution = this.calculateGeographicDistribution(optimalWeights);
    
    const currentScore = this.calculateHerfindahlIndex(currentDistribution);
    const optimalScore = this.calculateHerfindahlIndex(optimalDistribution);
    
    return {
      current: {
        score: currentScore,
        distribution: currentDistribution,
        concentration: this.calculateConcentrationRisk(currentDistribution)
      },
      optimal: {
        score: optimalScore,
        distribution: optimalDistribution,
        concentration: this.calculateConcentrationRisk(optimalDistribution)
      },
      improvement: optimalScore - currentScore,
      recommendations: this.generateGeographicRecommendations(
        currentDistribution,
        optimalDistribution
      )
    };
  }
  
  /**
   * Analyze sector diversification
   */
  analyzeSectorDiversification(currentPortfolio, optimalWeights) {
    const sectors = ['technology', 'agriculture', 'manufacturing', 'healthcare', 
                    'financial_services', 'retail', 'energy', 'other'];
    
    const currentDistribution = this.calculateSectorDistribution(currentPortfolio);
    const optimalDistribution = this.calculateSectorDistribution(optimalWeights);
    
    const currentScore = this.calculateHerfindahlIndex(currentDistribution);
    const optimalScore = this.calculateHerfindahlIndex(optimalDistribution);
    
    return {
      current: {
        score: currentScore,
        distribution: currentDistribution,
        concentration: this.calculateConcentrationRisk(currentDistribution)
      },
      optimal: {
        score: optimalScore,
        distribution: optimalDistribution,
        concentration: this.calculateConcentrationRisk(optimalDistribution)
      },
      improvement: optimalScore - currentScore,
      cyclicalExposure: this.calculateCyclicalExposure(currentDistribution)
    };
  }
  
  // ============================================================================
  // PERFORMANCE ANALYSIS
  // ============================================================================
  
  /**
   * Analyze current portfolio performance
   */
  analyzeCurrentPerformance(currentPortfolio, historicalData, expectedReturns, covarianceData) {
    if (!currentPortfolio || Object.keys(currentPortfolio).length === 0) {
      return this.createEmptyPerformanceAnalysis();
    }
    
    // Calculate historical returns
    const portfolioReturns = this.calculatePortfolioHistoricalReturns(
      currentPortfolio,
      historicalData
    );
    
    // Performance metrics
    const totalReturn = this.calculateTotalReturn(portfolioReturns);
    const annualizedReturn = this.calculateAnnualizedReturn(portfolioReturns);
    const volatility = this.calculateVolatility(portfolioReturns);
    const sharpeRatio = this.calculateSharpeRatio(currentPortfolio, expectedReturns, covarianceData);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioReturns);
    const informationRatio = this.calculateInformationRatio(portfolioReturns);
    
    // Risk metrics
    const valueAtRisk = this.calculateValueAtRisk(portfolioReturns, 0.05); // 5% VaR
    const conditionalVaR = this.calculateConditionalVaR(portfolioReturns, 0.05);
    const beta = this.calculatePortfolioBeta(currentPortfolio);
    
    // Attribution analysis
    const performanceAttribution = this.calculatePerformanceAttribution(
      currentPortfolio,
      historicalData
    );
    
    return {
      // Return metrics
      totalReturn: totalReturn,
      annualizedReturn: annualizedReturn,
      
      // Risk metrics
      volatility: volatility,
      sharpeRatio: sharpeRatio,
      informationRatio: informationRatio,
      maxDrawdown: maxDrawdown,
      valueAtRisk: valueAtRisk,
      conditionalVaR: conditionalVaR,
      beta: beta,
      
      // Attribution
      attribution: performanceAttribution,
      
      // Benchmarking
      benchmarkComparison: this.calculateBenchmarkComparison(portfolioReturns),
      
      // Rating
      performanceRating: this.ratePerformance({
        annualizedReturn,
        volatility,
        sharpeRatio,
        maxDrawdown
      })
    };
  }
  
  // ============================================================================
  // REBALANCING RECOMMENDATIONS
  // ============================================================================
  
  /**
   * Generate rebalancing recommendations
   */
  generateRebalancingRecommendations(currentPortfolio, optimalWeights, preferences) {
    const recommendations = [];
    const transactionCosts = [];
    let totalTransactionCost = 0;
    
    Object.keys(optimalWeights).forEach(assetId => {
      const currentWeight = currentPortfolio[assetId]?.weight || 0;
      const targetWeight = optimalWeights[assetId];
      const difference = targetWeight - currentWeight;
      
      if (Math.abs(difference) > this.optimizationConfig.rebalancingThreshold) {
        const action = difference > 0 ? 'buy' : 'sell';
        const amount = Math.abs(difference);
        const transactionCost = this.calculateTransactionCost(assetId, amount, action);
        
        recommendations.push({
          assetId: assetId,
          action: action,
          currentWeight: currentWeight,
          targetWeight: targetWeight,
          difference: difference,
          amount: amount,
          priority: this.calculateRebalancingPriority(difference, assetId),
          transactionCost: transactionCost,
          reasoning: this.generateRebalancingReasoning(difference, assetId)
        });
        
        transactionCosts.push(transactionCost);
        totalTransactionCost += transactionCost;
      }
    });
    
    // Sort by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);
    
    return {
      recommendations: recommendations,
      totalTransactionCost: totalTransactionCost,
      netBenefit: this.calculateNetRebalancingBenefit(recommendations, totalTransactionCost),
      implementation: this.generateImplementationPlan(recommendations, preferences),
      alternatives: this.generateRebalancingAlternatives(recommendations)
    };
  }
  
  // ============================================================================
  // RISK ANALYSIS AND STRESS TESTING
  // ============================================================================
  
  /**
   * Perform comprehensive risk analysis
   */
  performRiskAnalysis(currentPortfolio, optimalWeights, historicalData, investmentUniverse) {
    // Stress testing scenarios
    const stressScenarios = this.defineStressScenarios();
    const stressTestResults = this.runStressTests(
      currentPortfolio,
      optimalWeights,
      stressScenarios,
      investmentUniverse
    );
    
    // Monte Carlo simulation
    const monteCarloResults = this.runMonteCarloSimulation(
      optimalWeights,
      investmentUniverse,
      1000 // Number of simulations
    );
    
    // Tail risk analysis
    const tailRiskAnalysis = this.analyzeTailRisk(currentPortfolio, historicalData);
    
    // Concentration risk
    const concentrationRisk = this.analyzeConcentrationRisk(currentPortfolio, optimalWeights);
    
    // Liquidity risk
    const liquidityRisk = this.analyzeLiquidityRisk(currentPortfolio, investmentUniverse);
    
    return {
      stressTest: stressTestResults,
      monteCarlo: monteCarloResults,
      tailRisk: tailRiskAnalysis,
      concentrationRisk: concentrationRisk,
      liquidityRisk: liquidityRisk,
      overallRiskScore: this.calculateOverallRiskScore({
        stressTest: stressTestResults,
        tailRisk: tailRiskAnalysis,
        concentration: concentrationRisk,
        liquidity: liquidityRisk
      }),
      riskMitigationRecommendations: this.generateRiskMitigationRecommendations({
        stressTest: stressTestResults,
        concentration: concentrationRisk,
        liquidity: liquidityRisk
      })
    };
  }
  
  // ============================================================================
  // UTILITY AND HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get investor data including preferences and constraints
   */
  async getInvestorData(investorId) {
    try {
      const userResult = await FirebaseService.getUserProfile(investorId);
      if (!userResult.success) {
        return { success: false, error: 'Investor not found' };
      }
      
      return {
        success: true,
        investor: {
          userId: investorId,
          ...userResult.user,
          preferences: userResult.user.investmentPreferences || {},
          constraints: userResult.user.investmentConstraints || {}
        }
      };
      
    } catch (error) {
      console.error('Error getting investor data:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get current portfolio holdings
   */
  async getCurrentPortfolio(investorId) {
    try {
      const portfolioQuery = FirebaseAdmin.adminFirestore
        .collection('portfolios')
        .where('investorId', '==', investorId)
        .where('status', '==', 'active')
        .orderBy('lastUpdated', 'desc')
        .limit(1);
      
      const snapshot = await portfolioQuery.get();
      
      if (snapshot.empty) {
        return {}; // Empty portfolio
      }
      
      const portfolioDoc = snapshot.docs[0];
      const portfolioData = portfolioDoc.data();
      
      // Convert to weights format
      const totalValue = portfolioData.totalValue || 1;
      const portfolio = {};
      
      if (portfolioData.holdings) {
        portfolioData.holdings.forEach(holding => {
          portfolio[holding.assetId] = {
            weight: holding.value / totalValue,
            value: holding.value,
            quantity: holding.quantity,
            lastUpdated: holding.lastUpdated
          };
        });
      }
      
      return portfolio;
      
    } catch (error) {
      console.error('Error getting current portfolio:', error);
      return {};
    }
  }
  
  /**
   * Get historical portfolio and market data
   */
  async getPortfolioHistoricalData(investorId, periods = 24) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - periods);
      
      const historicalQuery = FirebaseAdmin.adminFirestore
        .collection('portfolioHistory')
        .where('investorId', '==', investorId)
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
      
      return data;
      
    } catch (error) {
      console.error('Error getting historical data:', error);
      return [];
    }
  }
  
  /**
   * Get investment universe for optimization
   */
  async getInvestmentUniverse(investor) {
    try {
      // Build query based on investor preferences and constraints
      let query = FirebaseAdmin.adminFirestore
        .collection('investments')
        .where('status', '==', 'active')
        .where('availableToInvestors', '==', true);
      
      // Apply filters based on preferences
      if (investor.preferences.preferredSectors && investor.preferences.preferredSectors.length > 0) {
        query = query.where('sector', 'in', investor.preferences.preferredSectors);
      }
      
      if (investor.preferences.preferredRegions && investor.preferences.preferredRegions.length > 0) {
        query = query.where('region', 'in', investor.preferences.preferredRegions);
      }
      
      if (investor.preferences.minInvestmentAmount) {
        query = query.where('minInvestmentAmount', '<=', investor.preferences.maxInvestmentAmount || 1000000);
      }
      
      const snapshot = await query.limit(100).get(); // Limit to manageable universe
      const investments = [];
      
      snapshot.forEach(doc => {
        investments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return investments;
      
    } catch (error) {
      console.error('Error getting investment universe:', error);
      return [];
    }
  }
  
  // Mathematical helper functions
  calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  calculateVariance(values) {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }
  
  calculateCovariance(values1, values2) {
    if (values1.length !== values2.length || values1.length < 2) return 0;
    
    const mean1 = this.calculateMean(values1);
    const mean2 = this.calculateMean(values2);
    let covariance = 0;
    
    for (let i = 0; i < values1.length; i++) {
      covariance += (values1[i] - mean1) * (values2[i] - mean2);
    }
    
    return covariance / (values1.length - 1);
  }
  
  calculatePortfolioReturn(weights, expectedReturns) {
    let portfolioReturn = 0;
    Object.keys(weights).forEach(assetId => {
      portfolioReturn += weights[assetId] * (expectedReturns[assetId] || 0);
    });
    return portfolioReturn;
  }
  
  calculatePortfolioRisk(weights, covarianceData) {
    const { matrix, assetIds } = covarianceData;
    const weightsArray = assetIds.map(id => weights[id] || 0);
    
    let portfolioVariance = 0;
    for (let i = 0; i < weightsArray.length; i++) {
      for (let j = 0; j < weightsArray.length; j++) {
        portfolioVariance += weightsArray[i] * weightsArray[j] * (matrix[i][j] || 0);
      }
    }
    
    return Math.sqrt(Math.max(0, portfolioVariance));
  }
  
  // Simplified optimization functions (would use more sophisticated methods in production)
  solveQuadraticOptimization(returns, covarianceMatrix, targetReturn) {
    // Simplified optimization - in production would use proper quadratic programming
    const n = returns.length;
    if (n === 0) return [];
    
    // Equal weight as starting point
    let weights = Array(n).fill(1 / n);
    
    // Simple iterative adjustment toward target return
    for (let iter = 0; iter < 100; iter++) {
      const currentReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
      const returnDiff = targetReturn - currentReturn;
      
      if (Math.abs(returnDiff) < 0.001) break;
      
      // Adjust weights toward higher/lower return assets
      for (let i = 0; i < n; i++) {
        if (returnDiff > 0 && returns[i] > currentReturn) {
          weights[i] += 0.01;
        } else if (returnDiff < 0 && returns[i] < currentReturn) {
          weights[i] += 0.01;
        } else {
          weights[i] -= 0.01;
        }
        weights[i] = Math.max(this.optimizationConfig.minAllocation, 
                             Math.min(this.optimizationConfig.maxAllocation, weights[i]));
      }
      
      // Normalize weights
      const sum = weights.reduce((s, w) => s + w, 0);
      if (sum > 0) {
        weights = weights.map(w => w / sum);
      }
    }
    
    return weights;
  }
  
  findMaximumSharpePortfolio(returns, covarianceMatrix) {
    // Simplified maximum Sharpe ratio calculation
    const n = returns.length;
    if (n === 0) return [];
    
    // Start with equal weights
    let bestWeights = Array(n).fill(1 / n);
    let bestSharpe = -Infinity;
    
    // Simple grid search (would use proper optimization in production)
    for (let trial = 0; trial < 1000; trial++) {
      const weights = this.generateRandomWeights(n);
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
      const portfolioRisk = this.calculateRiskFromMatrix(weights, covarianceMatrix);
      
      if (portfolioRisk > 0) {
        const sharpeRatio = (portfolioReturn - this.optimizationConfig.riskFreeRate) / portfolioRisk;
        if (sharpeRatio > bestSharpe) {
          bestSharpe = sharpeRatio;
          bestWeights = [...weights];
        }
      }
    }
    
    return bestWeights;
  }
  
  calculateRiskFromMatrix(weights, matrix) {
    const n = weights.length;
    let variance = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * (matrix[i][j] || 0);
      }
    }
    
    return Math.sqrt(Math.max(0, variance));
  }
  
  generateRandomWeights(n) {
    const weights = Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((s, w) => s + w, 0);
    return weights.map(w => w / sum);
  }
  
  createWeightsObject(weightsArray, assetIds) {
    const weightsObject = {};
    assetIds.forEach((id, index) => {
      weightsObject[id] = weightsArray[index] || 0;
    });
    return weightsObject;
  }
  
  // Simplified implementations for remaining helper functions
  determineRiskProfile(investor, preferences) {
    const riskTolerance = preferences.riskTolerance || investor.preferences?.riskTolerance || 'moderate';
    return this.riskProfiles[riskTolerance] || this.riskProfiles.moderate;
  }
  
  getHistoricalReturns(investmentId, historicalData) {
    return historicalData
      .filter(d => d.investments && d.investments[investmentId])
      .map(d => d.investments[investmentId].return || 0);
  }
  
  calculateTrendAdjustment(returns) {
    if (returns.length < 3) return 0;
    const recent = returns.slice(-3);
    const older = returns.slice(-6, -3);
    const recentMean = this.calculateMean(recent);
    const olderMean = this.calculateMean(older);
    return (recentMean - olderMean) * 0.1; // 10% of trend
  }
  
  calculateRiskAdjustment(investment) {
    const riskScore = investment.riskScore || 50;
    return (riskScore - 50) * 0.001; // Small adjustment based on risk
  }
  
  getAssetClass(investment) {
    const sector = investment.sector || 'services';
    return this.assetClasses[sector] || this.assetClasses.equity;
  }
  
  applyPortfolioConstraints(weights, preferences) {
    const constraints = preferences.constraints || {};
    
    // Apply min/max allocation constraints
    for (let i = 0; i < weights.length; i++) {
      weights[i] = Math.max(
        constraints.minAllocation || this.optimizationConfig.minAllocation,
        Math.min(
          constraints.maxAllocation || this.optimizationConfig.maxAllocation,
          weights[i]
        )
      );
    }
    
    // Normalize to ensure weights sum to 1
    const sum = weights.reduce((s, w) => s + w, 0);
    if (sum > 0) {
      weights = weights.map(w => w / sum);
    }
    
    return weights;
  }
  
  calculateRiskParityWeights(matrix, n) {
    // Simplified risk parity - equal risk contribution
    const weights = Array(n).fill(1 / n);
    
    // In production, would use iterative algorithm to achieve equal risk contribution
    return weights;
  }
  
  // Additional helper functions with simplified implementations
  calculateGeographicDistribution(portfolio) {
    // Simplified - would map each investment to its country
    return { nigeria: 0.4, kenya: 0.3, south_africa: 0.2, ghana: 0.1 };
  }
  
  calculateSectorDistribution(portfolio) {
    // Simplified - would map each investment to its sector
    return { technology: 0.3, agriculture: 0.25, manufacturing: 0.2, healthcare: 0.15, other: 0.1 };
  }
  
  calculateHerfindahlIndex(distribution) {
    // Herfindahl-Hirschman Index for concentration
    const shares = Object.values(distribution);
    return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  }
  
  calculateConcentrationRisk(distribution) {
    const maxShare = Math.max(...Object.values(distribution));
    return maxShare > 0.4 ? 'high' : maxShare > 0.25 ? 'medium' : 'low';
  }
  
  calculateOverallDiversificationScore(scores) {
    const weights = { geographic: 0.25, sector: 0.3, type: 0.2, risk: 0.15, correlation: 0.1 };
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      if (scores[key] !== undefined) {
        totalScore += scores[key] * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
  
  /**
   * Save optimization record to database
   */
  async saveOptimizationRecord(optimizationData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('portfolioOptimizations')
        .add({
          ...optimizationData,
          timestamp: new Date()
        });
        
      // Update investor profile with latest optimization
      if (optimizationData.investorId) {
        await FirebaseAdmin.adminFirestore
          .collection('users')
          .doc(optimizationData.investorId)
          .update({
            'portfolio.lastOptimized': new Date(),
            'portfolio.expectedReturn': optimizationData.optimalPortfolio.expectedReturn,
            'portfolio.expectedRisk': optimizationData.optimalPortfolio.expectedRisk,
            'portfolio.sharpeRatio': optimizationData.optimalPortfolio.sharpeRatio,
            'portfolio.diversificationScore': optimizationData.optimalPortfolio.diversificationScore
          });
      }
      
    } catch (error) {
      console.error('Error saving optimization record:', error);
    }
  }
  
  // Simplified implementations for remaining functions
  createEmptyPerformanceAnalysis() {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      performanceRating: 'N/A'
    };
  }
  
  calculatePortfolioHistoricalReturns(portfolio, historicalData) {
    // Simplified calculation
    return historicalData.map(d => d.portfolioReturn || 0);
  }
  
  calculateTotalReturn(returns) {
    return returns.reduce((total, ret) => (1 + total) * (1 + ret) - 1, 0);
  }
  
  calculateAnnualizedReturn(returns) {
    if (returns.length === 0) return 0;
    const totalReturn = this.calculateTotalReturn(returns);
    const periods = returns.length / 12; // Assuming monthly returns
    return Math.pow(1 + totalReturn, 1 / periods) - 1;
  }
  
  calculateVolatility(returns) {
    return Math.sqrt(this.calculateVariance(returns));
  }
  
  calculateMaxDrawdown(returns) {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 1;
    
    returns.forEach(ret => {
      cumulative *= (1 + ret);
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });
    
    return maxDrawdown;
  }
  
  calculateInformationRatio(returns) {
    // Simplified - would compare against benchmark
    const excessReturns = returns.map(r => r - this.optimizationConfig.riskFreeRate / 12);
    const trackingError = this.calculateVolatility(excessReturns);
    return trackingError > 0 ? this.calculateMean(excessReturns) / trackingError : 0;
  }
  
  calculateValueAtRisk(returns, confidence) {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(confidence * sortedReturns.length);
    return sortedReturns[index] || 0;
  }
  
  calculateConditionalVaR(returns, confidence) {
    const var = this.calculateValueAtRisk(returns, confidence);
    const tailReturns = returns.filter(r => r <= var);
    return tailReturns.length > 0 ? this.calculateMean(tailReturns) : var;
  }
  
  calculatePortfolioBeta(portfolio) {
    // Simplified beta calculation
    return 1.0; // Market beta
  }
  
  calculatePerformanceAttribution(portfolio, historicalData) {
    return {
      assetSelection: 0.02,
      sectorAllocation: 0.01,
      countryAllocation: 0.005,
      currency: -0.001,
      timing: 0.003
    };
  }
  
  calculateBenchmarkComparison(returns) {
    const benchmarkReturn = 0.12; // 12% annual benchmark
    const portfolioReturn = this.calculateAnnualizedReturn(returns);
    
    return {
      benchmark: benchmarkReturn,
      portfolio: portfolioReturn,
      outperformance: portfolioReturn - benchmarkReturn,
      trackingError: this.calculateVolatility(returns)
    };
  }
  
  ratePerformance(metrics) {
    const { annualizedReturn, volatility, sharpeRatio, maxDrawdown } = metrics;
    
    let score = 0;
    
    // Return score (0-30 points)
    if (annualizedReturn > 0.2) score += 30;
    else if (annualizedReturn > 0.15) score += 25;
    else if (annualizedReturn > 0.1) score += 20;
    else if (annualizedReturn > 0.05) score += 15;
    else score += 10;
    
    // Sharpe ratio score (0-30 points)
    if (sharpeRatio > 2) score += 30;
    else if (sharpeRatio > 1.5) score += 25;
    else if (sharpeRatio > 1) score += 20;
    else if (sharpeRatio > 0.5) score += 15;
    else score += 10;
    
    // Drawdown score (0-40 points)
    if (maxDrawdown < 0.05) score += 40;
    else if (maxDrawdown < 0.1) score += 35;
    else if (maxDrawdown < 0.15) score += 30;
    else if (maxDrawdown < 0.2) score += 25;
    else score += 20;
    
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  }
  
  calculateTransactionCost(assetId, amount, action) {
    // Simplified transaction cost calculation
    const baseCost = 0.001; // 0.1% base cost
    const liquidityCost = amount > 0.1 ? 0.0005 : 0; // Additional cost for large trades
    return (baseCost + liquidityCost) * amount;
  }
  
  calculateRebalancingPriority(difference, assetId) {
    return Math.abs(difference) * 100; // Simple priority based on size of difference
  }
  
  generateRebalancingReasoning(difference, assetId) {
    if (difference > 0) {
      return `Increase allocation to optimize risk-return profile`;
    } else {
      return `Reduce allocation to improve diversification`;
    }
  }
  
  calculateNetRebalancingBenefit(recommendations, totalCost) {
    // Simplified benefit calculation
    const expectedBenefit = recommendations.length * 0.01; // 1% benefit per recommendation
    return expectedBenefit - totalCost;
  }
  
  generateImplementationPlan(recommendations, preferences) {
    return {
      strategy: preferences.rebalancingStrategy || 'threshold',
      timeline: '1-2 weeks',
      phases: recommendations.slice(0, 5), // Top 5 priority recommendations
      totalCost: recommendations.reduce((sum, rec) => sum + rec.transactionCost, 0)
    };
  }
  
  generateRebalancingAlternatives(recommendations) {
    return [
      {
        name: 'Gradual Rebalancing',
        description: 'Implement changes over 3-6 months',
        pros: ['Lower market impact', 'Reduced transaction costs'],
        cons: ['Slower optimization', 'Drift risk']
      },
      {
        name: 'Threshold-Based',
        description: 'Only rebalance when drift exceeds 5%',
        pros: ['Cost effective', 'Avoids overtrading'],
        cons: ['May miss optimal timing']
      }
    ];
  }
  
  defineStressScenarios() {
    return [
      {
        name: 'Market Crash',
        description: '30% market decline',
        shocks: { equity: -0.3, debt: -0.1, all: -0.2 }
      },
      {
        name: 'Currency Crisis',
        description: '50% currency devaluation',
        shocks: { foreign: -0.5, local: -0.1 }
      },
      {
        name: 'Interest Rate Shock',
        description: '5% interest rate increase',
        shocks: { debt: -0.15, equity: -0.05 }
      }
    ];
  }
  
  runStressTests(currentPortfolio, optimalWeights, scenarios, investmentUniverse) {
    const results = {};
    
    scenarios.forEach(scenario => {
      results[scenario.name] = {
        currentPortfolioLoss: 0.15, // Simplified calculation
        optimalPortfolioLoss: 0.12,
        improvement: 0.03,
        worstAssets: ['asset1', 'asset2'],
        bestAssets: ['asset3', 'asset4']
      };
    });
    
    return results;
  }
  
  runMonteCarloSimulation(weights, investmentUniverse, numSimulations) {
    const results = [];
    
    for (let i = 0; i < numSimulations; i++) {
      // Simplified simulation
      const simulatedReturn = (Math.random() - 0.5) * 0.4 + 0.12; // Random return around 12%
      results.push(simulatedReturn);
    }
    
    return {
      meanReturn: this.calculateMean(results),
      volatility: this.calculateVolatility(results),
      percentiles: {
        p5: this.calculatePercentile(results, 0.05),
        p25: this.calculatePercentile(results, 0.25),
        p50: this.calculatePercentile(results, 0.5),
        p75: this.calculatePercentile(results, 0.75),
        p95: this.calculatePercentile(results, 0.95)
      }
    };
  }
  
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(percentile * sorted.length);
    return sorted[index];
  }
  
  analyzeTailRisk(portfolio, historicalData) {
    return {
      var95: -0.08,
      cvar95: -0.12,
      expectedShortfall: -0.15,
      tailRatio: 1.2
    };
  }
  
  analyzeConcentrationRisk(currentPortfolio, optimalWeights) {
    return {
      currentHHI: 0.25,
      optimalHHI: 0.18,
      improvement: 0.07,
      maxPosition: 0.3,
      recommendation: 'Reduce largest positions'
    };
  }
  
  analyzeLiquidityRisk(portfolio, investmentUniverse) {
    return {
      liquidityScore: 75,
      illiquidAssetsPercentage: 0.15,
      averageLiquidityHorizon: 30, // days
      recommendation: 'Maintain adequate liquid reserves'
    };
  }
  
  calculateOverallRiskScore(riskComponents) {
    // Simplified risk scoring
    return {
      score: 65,
      level: 'Medium',
      components: riskComponents
    };
  }
  
  generateRiskMitigationRecommendations(riskAnalysis) {
    return [
      {
        risk: 'Concentration Risk',
        recommendation: 'Diversify across more assets',
        priority: 'High',
        timeframe: '1-3 months'
      },
      {
        risk: 'Liquidity Risk',
        recommendation: 'Maintain 10% in liquid assets',
        priority: 'Medium',
        timeframe: 'Ongoing'
      }
    ];
  }
  
  generateMarketInsights(investmentUniverse, expectedReturns) {
    return {
      topOpportunities: ['Technology sector showing strong growth'],
      marketTrends: ['Digital transformation accelerating'],
      riskFactors: ['Currency volatility', 'Regulatory changes'],
      recommendations: ['Consider increasing tech allocation']
    };
  }
  
  generateRiskManagementPlan(riskAnalysis, riskProfile) {
    return {
      stopLossLevels: { portfolio: -0.15, individual: -0.25 },
      rebalancingTriggers: { drift: 0.05, volatility: 0.3 },
      hedgingStrategy: 'Currency hedging for foreign investments',
      monitoringFrequency: 'Monthly',
      escalationProcedures: 'Contact advisor if losses exceed 10%'
    };
  }
  
  calculateNextRebalanceDate(strategy) {
    const now = new Date();
    const nextDate = new Date(now);
    
    switch (strategy) {
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(now.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(now.getMonth() + 3); // Default quarterly
    }
    
    return nextDate;
  }
  
  assessDataQuality(historicalData, investmentUniverse) {
    const dataPoints = historicalData.length;
    const universeSize = investmentUniverse.length;
    
    return {
      historicalDataQuality: dataPoints >= 24 ? 'Good' : dataPoints >= 12 ? 'Fair' : 'Poor',
      universeSize: universeSize,
      recommendation: dataPoints < 24 ? 'Collect more historical data for better optimization' : 'Data quality is adequate'
    };
  }
  
  // Additional simplified helper functions
  calculateProjectedPerformance(weights, expectedReturns, covarianceData, riskProfile) {
    const expectedReturn = this.calculatePortfolioReturn(weights, expectedReturns);
    const expectedRisk = this.calculatePortfolioRisk(weights, covarianceData);
    
    return {
      oneYear: {
        expectedReturn: expectedReturn,
        expectedRisk: expectedRisk,
        probabilityOfLoss: expectedRisk > expectedReturn ? 0.3 : 0.15
      },
      threeYear: {
        expectedReturn: expectedReturn * 3,
        expectedRisk: expectedRisk * Math.sqrt(3),
        probabilityOfLoss: 0.1
      },
      fiveYear: {
        expectedReturn: expectedReturn * 5,
        expectedRisk: expectedRisk * Math.sqrt(5),
        probabilityOfLoss: 0.05
      }
    };
  }
  
  generateDiversificationRecommendations(diversificationAnalysis) {
    const recommendations = [];
    
    if (diversificationAnalysis.geographic.current.score < 0.7) {
      recommendations.push({
        type: 'Geographic',
        recommendation: 'Increase geographic diversification across African markets',
        impact: 'Medium',
        priority: 'High'
      });
    }
    
    if (diversificationAnalysis.sector.current.score < 0.6) {
      recommendations.push({
        type: 'Sector',
        recommendation: 'Diversify across more industry sectors',
        impact: 'High',
        priority: 'High'
      });
    }
    
    return recommendations;
  }
  
  generateGeographicRecommendations(current, optimal) {
    const recommendations = [];
    
    Object.keys(optimal).forEach(country => {
      const currentWeight = current[country] || 0;
      const optimalWeight = optimal[country];
      const difference = optimalWeight - currentWeight;
      
      if (Math.abs(difference) > 0.05) {
        recommendations.push({
          country: country,
          action: difference > 0 ? 'increase' : 'decrease',
          amount: Math.abs(difference),
          reasoning: `Optimize geographic diversification`
        });
      }
    });
    
    return recommendations;
  }
  
  analyzeTypeDiversification(currentPortfolio, optimalWeights) {
    return {
      current: { score: 0.7, distribution: { equity: 0.6, debt: 0.3, revenue_share: 0.1 } },
      optimal: { score: 0.8, distribution: { equity: 0.5, debt: 0.3, revenue_share: 0.2 } },
      improvement: 0.1
    };
  }
  
  analyzeRiskDiversification(currentPortfolio, optimalWeights) {
    return {
      current: { score: 0.6, distribution: { low: 0.2, medium: 0.5, high: 0.3 } },
      optimal: { score: 0.75, distribution: { low: 0.3, medium: 0.4, high: 0.3 } },
      improvement: 0.15
    };
  }
  
  analyzeCorrelationDiversification(currentPortfolio, optimalWeights, correlationData) {
    return {
      current: { score: 0.65, averageCorrelation: 0.45 },
      optimal: { score: 0.8, averageCorrelation: 0.35 },
      improvement: 0.15
    };
  }
  
  calculateCyclicalExposure(distribution) {
    const cyclicalSectors = ['manufacturing', 'retail', 'energy'];
    let cyclicalExposure = 0;
    
    cyclicalSectors.forEach(sector => {
      cyclicalExposure += distribution[sector] || 0;
    });
    
    return {
      exposure: cyclicalExposure,
      level: cyclicalExposure > 0.5 ? 'High' : cyclicalExposure > 0.3 ? 'Medium' : 'Low'
    };
  }
}

module.exports = new PortfolioManagementAlgorithm();