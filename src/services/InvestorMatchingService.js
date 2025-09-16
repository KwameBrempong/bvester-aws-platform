/**
 * AI-Powered Investor Matching Service
 * Advanced algorithm for matching investors with suitable investment opportunities
 */
class InvestorMatchingService {
  constructor() {
    this.initialized = false;
    this.matchingEngine = new MatchingEngine();
    this.scoringAlgorithm = new CompatibilityScoring();
    this.preferenceAnalyzer = new PreferenceAnalyzer();
    this.behaviorTracker = new BehaviorTracker();
  }

  /**
   * Initialize the investor matching service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await Promise.all([
        this.matchingEngine.initialize(),
        this.scoringAlgorithm.initialize(),
        this.preferenceAnalyzer.initialize(),
        this.behaviorTracker.initialize()
      ]);

      this.initialized = true;
      console.log('✅ Investor Matching Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Investor Matching Service:', error);
    }
  }

  /**
   * Find matching investors for a business
   */
  async findMatchingInvestors(businessData, options = {}) {
    try {
      const {
        maxResults = 20,
        minCompatibilityScore = 0.6,
        includeRecommendations = true,
        preferredInvestorTypes = [],
        geographicPreferences = []
      } = options;

      console.log('🎯 Finding matching investors for:', businessData.name);

      // Analyze business profile
      const businessProfile = await this.analyzeBusiness(businessData);

      // Get potential investors
      const potentialInvestors = await this.getPotentialInvestors({
        sector: businessData.sector,
        stage: businessData.stage,
        fundingAmount: businessData.fundingAmount,
        region: businessData.region
      });

      // Calculate compatibility scores
      const matches = await Promise.all(
        potentialInvestors.map(async investor => {
          const compatibility = await this.calculateCompatibility(
            businessProfile,
            investor
          );
          
          return {
            investor,
            compatibility,
            recommendationReason: await this.generateRecommendationReason(
              businessProfile,
              investor,
              compatibility
            )
          };
        })
      );

      // Filter and sort matches
      const qualifiedMatches = matches
        .filter(match => match.compatibility.overallScore >= minCompatibilityScore)
        .sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore)
        .slice(0, maxResults);

      // Generate insights
      const insights = await this.generateMatchingInsights(qualifiedMatches, businessProfile);

      const result = {
        businessId: businessData.id,
        totalMatches: qualifiedMatches.length,
        matches: qualifiedMatches.map(match => ({
          investor: {
            id: match.investor.id,
            name: match.investor.name,
            type: match.investor.type,
            investmentRange: match.investor.investmentRange,
            sectors: match.investor.preferredSectors,
            regions: match.investor.activeRegions,
            portfolio: match.investor.portfolioSummary
          },
          compatibilityScore: Math.round(match.compatibility.overallScore * 100),
          matchStrength: this.getMatchStrength(match.compatibility.overallScore),
          keyMatchFactors: match.compatibility.topFactors,
          recommendationReason: match.recommendationReason,
          estimatedInterestLevel: match.compatibility.interestLevel,
          nextSteps: await this.suggestNextSteps(match),
          contactPriority: this.calculateContactPriority(match.compatibility)
        })),
        insights,
        recommendations: includeRecommendations ? 
          await this.generateBusinessRecommendations(businessProfile, qualifiedMatches) : null,
        searchMetadata: {
          searchDate: new Date().toISOString(),
          criteria: options,
          algorithmVersion: '2.0'
        }
      };

      return {
        success: true,
        results: result
      };
    } catch (error) {
      console.error('❌ Failed to find matching investors:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find matching opportunities for an investor
   */
  async findMatchingOpportunities(investorData, options = {}) {
    try {
      const {
        maxResults = 15,
        minCompatibilityScore = 0.65,
        includeEarlyStage = true,
        preferredStages = [],
        excludeCompetitors = true
      } = options;

      console.log('🎯 Finding matching opportunities for:', investorData.name);

      // Analyze investor profile
      const investorProfile = await this.analyzeInvestor(investorData);

      // Get potential opportunities
      const opportunities = await this.getPotentialOpportunities({
        sectors: investorData.preferredSectors,
        stages: investorData.preferredStages,
        regions: investorData.activeRegions,
        investmentRange: investorData.typicalInvestmentSize
      });

      // Calculate compatibility scores
      const matches = await Promise.all(
        opportunities.map(async opportunity => {
          const compatibility = await this.calculateOpportunityCompatibility(
            investorProfile,
            opportunity
          );
          
          return {
            opportunity,
            compatibility,
            investmentRationale: await this.generateInvestmentRationale(
              investorProfile,
              opportunity,
              compatibility
            )
          };
        })
      );

      // Filter and rank opportunities
      const qualifiedMatches = matches
        .filter(match => match.compatibility.overallScore >= minCompatibilityScore)
        .sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore)
        .slice(0, maxResults);

      // Generate portfolio fit analysis
      const portfolioFit = await this.analyzePortfolioFit(investorProfile, qualifiedMatches);

      const result = {
        investorId: investorData.id,
        totalOpportunities: qualifiedMatches.length,
        opportunities: qualifiedMatches.map(match => ({
          business: {
            id: match.opportunity.id,
            name: match.opportunity.name,
            sector: match.opportunity.sector,
            stage: match.opportunity.stage,
            fundingAmount: match.opportunity.fundingAmount,
            valuation: match.opportunity.valuation,
            location: match.opportunity.location,
            businessModel: match.opportunity.businessModel
          },
          compatibilityScore: Math.round(match.compatibility.overallScore * 100),
          investmentGrade: this.getInvestmentGrade(match.compatibility.overallScore),
          keyMatchFactors: match.compatibility.topFactors,
          investmentRationale: match.investmentRationale,
          riskLevel: match.compatibility.riskAssessment,
          expectedROI: match.compatibility.expectedROI,
          portfolioFit: match.compatibility.portfolioFit,
          urgency: this.calculateUrgency(match.opportunity)
        })),
        portfolioAnalysis: portfolioFit,
        marketInsights: await this.generateMarketInsights(qualifiedMatches),
        recommendations: await this.generateInvestorRecommendations(investorProfile, qualifiedMatches),
        searchMetadata: {
          searchDate: new Date().toISOString(),
          criteria: options,
          algorithmVersion: '2.0'
        }
      };

      return {
        success: true,
        results: result
      };
    } catch (error) {
      console.error('❌ Failed to find matching opportunities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate AI-powered introduction
   */
  async generateIntroduction(investorId, businessId, context = {}) {
    try {
      const investor = await this.getInvestorProfile(investorId);
      const business = await this.getBusinessProfile(businessId);
      
      const compatibility = await this.calculateCompatibility(business, investor);
      
      const introduction = {
        subject: `Investment Opportunity: ${business.name} - ${business.sector}`,
        personalizedMessage: await this.generatePersonalizedMessage(
          investor, 
          business, 
          compatibility,
          context
        ),
        keyHighlights: await this.extractKeyHighlights(business, investor.preferences),
        suggestedMeetingTopics: await this.suggestMeetingTopics(business, investor),
        attachments: await this.suggestRelevantDocuments(business, investor),
        followUpSuggestions: await this.generateFollowUpSuggestions(compatibility),
        sentimentAnalysis: await this.analyzeSentiment(investor, business),
        timing: await this.suggestOptimalTiming(investor, business)
      };

      return {
        success: true,
        introduction
      };
    } catch (error) {
      console.error('❌ Failed to generate introduction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track and learn from interactions
   */
  async trackInteraction(interactionData) {
    try {
      const {
        investorId,
        businessId,
        interactionType, // 'view', 'contact', 'meeting', 'investment', 'pass'
        outcome,
        feedback,
        timestamp
      } = interactionData;

      // Record interaction
      await this.behaviorTracker.recordInteraction(interactionData);

      // Update matching algorithms based on feedback
      if (feedback && outcome) {
        await this.updateMatchingAlgorithm(investorId, businessId, feedback, outcome);
      }

      // Analyze patterns
      const patterns = await this.analyzeInteractionPatterns(investorId);

      // Update investor preferences
      if (patterns.significantChange) {
        await this.updateInvestorPreferences(investorId, patterns);
      }

      return {
        success: true,
        patternsDetected: patterns.significantChange,
        updatedPreferences: patterns.significantChange ? patterns.newPreferences : null
      };
    } catch (error) {
      console.error('❌ Failed to track interaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze matching performance
   */
  async analyzeMatchingPerformance(timeframe = '30_days') {
    try {
      const metrics = await this.getMatchingMetrics(timeframe);
      
      const analysis = {
        totalMatches: metrics.totalMatches,
        successfulIntroductions: metrics.successfulIntroductions,
        conversionRates: {
          viewToContact: metrics.viewToContact,
          contactToMeeting: metrics.contactToMeeting,
          meetingToInvestment: metrics.meetingToInvestment,
          overallConversion: metrics.overallConversion
        },
        averageCompatibilityScore: metrics.averageCompatibilityScore,
        topPerformingSectors: metrics.topSectors,
        investorSatisfaction: metrics.investorSatisfaction,
        businessSatisfaction: metrics.businessSatisfaction,
        algorithmAccuracy: metrics.algorithmAccuracy,
        improvementAreas: await this.identifyImprovementAreas(metrics),
        recommendations: await this.generateAlgorithmRecommendations(metrics)
      };

      return {
        success: true,
        analysis,
        timeframe
      };
    } catch (error) {
      console.error('❌ Failed to analyze matching performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper Methods

  async analyzeBusiness(businessData) {
    return {
      id: businessData.id,
      sector: businessData.sector,
      stage: businessData.stage,
      fundingAmount: businessData.fundingAmount,
      valuation: businessData.valuation,
      region: businessData.region,
      businessModel: businessData.businessModel,
      traction: await this.analyzeTraction(businessData),
      team: await this.analyzeTeam(businessData.team),
      market: await this.analyzeMarket(businessData.market),
      financials: await this.analyzeFinancials(businessData.financials),
      uniqueValueProps: businessData.uniqueValueProposition || [],
      riskFactors: await this.identifyRiskFactors(businessData),
      growthPotential: await this.assessGrowthPotential(businessData)
    };
  }

  async analyzeInvestor(investorData) {
    return {
      id: investorData.id,
      type: investorData.type, // 'angel', 'vc', 'corporate', 'family_office'
      investmentRange: investorData.typicalInvestmentSize,
      preferredSectors: investorData.preferredSectors || [],
      preferredStages: investorData.preferredStages || [],
      activeRegions: investorData.activeRegions || [],
      portfolioStrategy: investorData.portfolioStrategy,
      riskTolerance: investorData.riskTolerance,
      investmentCriteria: investorData.investmentCriteria || {},
      portfolio: await this.analyzePortfolio(investorData.portfolio),
      pastPerformance: await this.analyzePastPerformance(investorData),
      investmentVelocity: await this.calculateInvestmentVelocity(investorData),
      preferences: await this.extractPreferences(investorData)
    };
  }

  async calculateCompatibility(businessProfile, investor) {
    const factors = {
      sectorMatch: this.calculateSectorMatch(businessProfile.sector, investor.preferredSectors),
      stageMatch: this.calculateStageMatch(businessProfile.stage, investor.preferredStages),
      regionMatch: this.calculateRegionMatch(businessProfile.region, investor.activeRegions),
      sizeMatch: this.calculateSizeMatch(businessProfile.fundingAmount, investor.investmentRange),
      riskMatch: this.calculateRiskMatch(businessProfile.riskFactors, investor.riskTolerance),
      strategicFit: await this.calculateStrategicFit(businessProfile, investor),
      timelineMatch: this.calculateTimelineMatch(businessProfile, investor),
      portfolioFit: await this.calculatePortfolioFit(businessProfile, investor.portfolio)
    };

    const weights = {
      sectorMatch: 0.25,
      stageMatch: 0.20,
      regionMatch: 0.15,
      sizeMatch: 0.15,
      riskMatch: 0.10,
      strategicFit: 0.10,
      timelineMatch: 0.03,
      portfolioFit: 0.02
    };

    const overallScore = Object.entries(factors).reduce((sum, [factor, score]) => {
      return sum + (score * weights[factor]);
    }, 0);

    const topFactors = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([factor, score]) => ({
        factor: this.formatFactorName(factor),
        score: Math.round(score * 100),
        impact: score * weights[factor]
      }));

    return {
      overallScore,
      factors,
      topFactors,
      interestLevel: this.calculateInterestLevel(overallScore),
      riskAssessment: this.assessInvestmentRisk(factors),
      expectedROI: this.estimateROI(businessProfile, factors),
      portfolioFit: factors.portfolioFit
    };
  }

  calculateSectorMatch(businessSector, investorSectors) {
    if (!investorSectors || investorSectors.length === 0) return 0.5;
    
    const exactMatch = investorSectors.includes(businessSector);
    if (exactMatch) return 1.0;
    
    // Check for related sectors
    const relatedSectors = this.getRelatedSectors(businessSector);
    const hasRelatedMatch = investorSectors.some(sector => relatedSectors.includes(sector));
    
    return hasRelatedMatch ? 0.7 : 0.2;
  }

  calculateStageMatch(businessStage, investorStages) {
    if (!investorStages || investorStages.length === 0) return 0.5;
    return investorStages.includes(businessStage) ? 1.0 : 0.3;
  }

  calculateRegionMatch(businessRegion, investorRegions) {
    if (!investorRegions || investorRegions.length === 0) return 0.5;
    return investorRegions.includes(businessRegion) ? 1.0 : 0.4;
  }

  calculateSizeMatch(fundingAmount, investmentRange) {
    if (!investmentRange) return 0.5;
    
    const { min, max } = investmentRange;
    if (fundingAmount >= min && fundingAmount <= max) return 1.0;
    if (fundingAmount < min && fundingAmount >= min * 0.7) return 0.8;
    if (fundingAmount > max && fundingAmount <= max * 1.3) return 0.8;
    
    return 0.3;
  }

  getRelatedSectors(sector) {
    const sectorMap = {
      'technology': ['fintech', 'edtech', 'healthtech'],
      'fintech': ['technology', 'financial_services'],
      'healthcare': ['healthtech', 'biotech', 'pharmaceuticals'],
      'agriculture': ['agtech', 'food_tech'],
      'education': ['edtech', 'technology']
    };
    
    return sectorMap[sector] || [];
  }

  getMatchStrength(score) {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Weak';
  }

  getInvestmentGrade(score) {
    if (score >= 0.9) return 'A+';
    if (score >= 0.8) return 'A';
    if (score >= 0.7) return 'B+';
    if (score >= 0.6) return 'B';
    return 'C';
  }

  formatFactorName(factor) {
    const names = {
      sectorMatch: 'Sector Alignment',
      stageMatch: 'Stage Compatibility', 
      regionMatch: 'Geographic Fit',
      sizeMatch: 'Investment Size Match',
      riskMatch: 'Risk Tolerance',
      strategicFit: 'Strategic Value',
      timelineMatch: 'Timeline Alignment',
      portfolioFit: 'Portfolio Diversification'
    };
    return names[factor] || factor;
  }

  // Placeholder methods for full implementation
  async getPotentialInvestors(criteria) { return []; }
  async getPotentialOpportunities(criteria) { return []; }
  async getInvestorProfile(id) { return {}; }
  async getBusinessProfile(id) { return {}; }
  async analyzeTraction(data) { return {}; }
  async analyzeTeam(team) { return {}; }
  async analyzeMarket(market) { return {}; }
  async analyzeFinancials(financials) { return {}; }
  async identifyRiskFactors(data) { return []; }
  async assessGrowthPotential(data) { return 0.8; }
  async analyzePortfolio(portfolio) { return {}; }
  async analyzePastPerformance(data) { return {}; }
  async calculateInvestmentVelocity(data) { return 0.5; }
  async extractPreferences(data) { return {}; }
  async calculateStrategicFit(business, investor) { return 0.7; }
  calculateTimelineMatch(business, investor) { return 0.8; }
  async calculatePortfolioFit(business, portfolio) { return 0.6; }
  calculateInterestLevel(score) { return score > 0.8 ? 'High' : score > 0.6 ? 'Medium' : 'Low'; }
  assessInvestmentRisk(factors) { return 'Medium'; }
  estimateROI(business, factors) { return '20-25%'; }
  async generateRecommendationReason(business, investor, compatibility) { return 'Strong sector alignment'; }
  async suggestNextSteps(match) { return ['Schedule intro call', 'Send pitch deck']; }
  calculateContactPriority(compatibility) { return 'High'; }
  async generateMatchingInsights(matches, profile) { return {}; }
  async generateBusinessRecommendations(profile, matches) { return []; }
  calculateUrgency(opportunity) { return 'Medium'; }
}

/**
 * Matching Engine Core
 */
class MatchingEngine {
  async initialize() {
    console.log('🎯 Matching engine initialized');
  }
}

/**
 * Compatibility Scoring Algorithm
 */
class CompatibilityScoring {
  async initialize() {
    console.log('📊 Compatibility scoring initialized');
  }
}

/**
 * Preference Analyzer
 */
class PreferenceAnalyzer {
  async initialize() {
    console.log('🎯 Preference analyzer initialized');
  }
}

/**
 * Behavior Tracker
 */
class BehaviorTracker {
  async initialize() {
    console.log('👁️ Behavior tracker initialized');
  }

  async recordInteraction(data) {
    console.log('📝 Recording interaction:', data.interactionType);
  }
}

// Export singleton instance
const investorMatchingService = new InvestorMatchingService();
export default investorMatchingService;