/**
 * BVESTER PLATFORM - AI MATCHMAKING ALGORITHM
 * Week 6: AI-Powered Investor-Business Matching Engine
 * Multi-factor compatibility scoring with machine learning optimization
 * Generated: January 28, 2025
 */

const FirebaseService = require('../api/firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class AIMatchmakingAlgorithm {
  constructor() {
    // Matching algorithm weights and configurations
    this.matchingWeights = {
      riskAlignment: 0.25,        // Risk tolerance vs business risk level
      sectorPreference: 0.20,     // Sector/industry alignment
      investmentSize: 0.18,       // Investment amount compatibility
      geographic: 0.12,           // Geographic preference alignment
      esgAlignment: 0.10,         // ESG values compatibility
      growthStage: 0.08,          // Business stage vs investor preference
      returnExpectation: 0.07     // Expected return alignment
    };
    
    // Risk tolerance mapping
    this.riskLevels = {
      'very_conservative': { min: 0, max: 20, label: 'Very Conservative' },
      'conservative': { min: 21, max: 40, label: 'Conservative' },
      'moderate': { min: 41, max: 60, label: 'Moderate' },
      'aggressive': { min: 61, max: 80, label: 'Aggressive' },
      'very_aggressive': { min: 81, max: 100, label: 'Very Aggressive' }
    };
    
    // Business growth stages
    this.growthStages = {
      'startup': { 
        description: 'Early stage, product development',
        riskLevel: 85,
        returnPotential: 300,
        timeHorizon: 7
      },
      'growth': {
        description: 'Scaling operations, market expansion',
        riskLevel: 65,
        returnPotential: 200,
        timeHorizon: 5
      },
      'expansion': {
        description: 'Market expansion, new products',
        riskLevel: 45,
        returnPotential: 150,
        timeHorizon: 4
      },
      'mature': {
        description: 'Established operations, stable revenue',
        riskLevel: 25,
        returnPotential: 100,
        timeHorizon: 3
      }
    };
    
    // Industry sector classifications
    this.sectorCategories = {
      'agriculture': {
        riskProfile: 'moderate',
        avgReturns: 0.12,
        volatility: 0.15,
        tags: ['farming', 'livestock', 'crops', 'agritech']
      },
      'technology': {
        riskProfile: 'aggressive',
        avgReturns: 0.25,
        volatility: 0.35,
        tags: ['software', 'ai', 'fintech', 'blockchain', 'mobile']
      },
      'healthcare': {
        riskProfile: 'moderate',
        avgReturns: 0.15,
        volatility: 0.18,
        tags: ['medical', 'pharmaceutical', 'healthtech', 'telemedicine']
      },
      'manufacturing': {
        riskProfile: 'conservative',
        avgReturns: 0.10,
        volatility: 0.12,
        tags: ['production', 'industrial', 'automotive', 'textiles']
      },
      'retail': {
        riskProfile: 'moderate',
        avgReturns: 0.08,
        volatility: 0.20,
        tags: ['e-commerce', 'fashion', 'consumer goods', 'marketplace']
      },
      'financial_services': {
        riskProfile: 'aggressive',
        avgReturns: 0.20,
        volatility: 0.25,
        tags: ['banking', 'insurance', 'payments', 'lending']
      },
      'energy': {
        riskProfile: 'conservative',
        avgReturns: 0.09,
        volatility: 0.22,
        tags: ['renewable', 'solar', 'oil', 'gas', 'power']
      },
      'education': {
        riskProfile: 'moderate',
        avgReturns: 0.11,
        volatility: 0.14,
        tags: ['edtech', 'training', 'online learning', 'vocational']
      }
    };
    
    // Regional investment preferences
    this.regionalPreferences = {
      'NG': { // Nigeria
        name: 'Nigeria',
        marketSize: 'large',
        growthPotential: 'high',
        riskFactor: 0.7,
        preferredSectors: ['technology', 'financial_services', 'agriculture']
      },
      'KE': { // Kenya
        name: 'Kenya',
        marketSize: 'medium',
        growthPotential: 'high',
        riskFactor: 0.6,
        preferredSectors: ['technology', 'agriculture', 'manufacturing']
      },
      'GH': { // Ghana
        name: 'Ghana',
        marketSize: 'medium',
        growthPotential: 'medium',
        riskFactor: 0.65,
        preferredSectors: ['agriculture', 'manufacturing', 'energy']
      },
      'ZA': { // South Africa
        name: 'South Africa',
        marketSize: 'large',
        growthPotential: 'medium',
        riskFactor: 0.5,
        preferredSectors: ['manufacturing', 'financial_services', 'energy']
      },
      'UG': { // Uganda
        name: 'Uganda',
        marketSize: 'small',
        growthPotential: 'high',
        riskFactor: 0.75,
        preferredSectors: ['agriculture', 'technology', 'healthcare']
      }
    };
    
    // ESG scoring criteria
    this.esgCriteria = {
      environmental: {
        carbonFootprint: 0.3,
        energyEfficiency: 0.25,
        wasteManagement: 0.25,
        renewableEnergy: 0.2
      },
      social: {
        employeeWelfare: 0.3,
        communityImpact: 0.25,
        diversityInclusion: 0.25,
        customerSatisfaction: 0.2
      },
      governance: {
        boardDiversity: 0.25,
        transparency: 0.3,
        ethics: 0.25,
        compliance: 0.2
      }
    };
    
    // Machine learning model configurations
    this.mlConfig = {
      featureWeights: {
        historicalPerformance: 0.3,
        userBehavior: 0.25,
        marketTrends: 0.2,
        similarInvestors: 0.15,
        feedbackLoop: 0.1
      },
      learningRate: 0.01,
      modelUpdateFrequency: 24, // hours
      minimumDataPoints: 10
    };
  }
  
  // ============================================================================
  // MAIN MATCHMAKING FUNCTIONS
  // ============================================================================
  
  /**
   * Find best investment matches for an investor
   */
  async findInvestmentMatches(investorId, options = {}) {
    try {
      console.log(`🎯 Finding investment matches for investor: ${investorId}`);
      
      // Get investor profile and preferences
      const investorResult = await this.getInvestorProfile(investorId);
      if (!investorResult.success) {
        throw new Error('Investor profile not found');
      }
      
      const investor = investorResult.investor;
      
      // Get available businesses for investment
      const businessesResult = await this.getAvailableBusinesses(options);
      if (!businessesResult.success) {
        throw new Error('Failed to retrieve businesses');
      }
      
      const businesses = businessesResult.businesses;
      
      // Calculate match scores for each business
      const matches = [];
      for (const business of businesses) {
        const matchScore = await this.calculateMatchScore(investor, business);
        
        if (matchScore.score >= (options.minScore || 50)) {
          matches.push({
            businessId: business.businessId,
            business: business,
            matchScore: matchScore,
            recommendationReason: this.generateRecommendationReason(matchScore),
            confidence: this.calculateConfidence(matchScore, investor, business)
          });
        }
      }
      
      // Sort by match score (descending)
      matches.sort((a, b) => b.matchScore.score - a.matchScore.score);
      
      // Apply ML optimization
      const optimizedMatches = await this.applyMLOptimization(matches, investor);
      
      // Limit results
      const limitedMatches = optimizedMatches.slice(0, options.limit || 20);
      
      // Log matching activity
      await this.logMatchingActivity({
        investorId: investorId,
        totalBusinesses: businesses.length,
        qualifiedMatches: matches.length,
        returnedMatches: limitedMatches.length,
        averageScore: matches.length > 0 ? 
          matches.reduce((sum, m) => sum + m.matchScore.score, 0) / matches.length : 0,
        timestamp: new Date()
      });
      
      console.log(`✅ Found ${limitedMatches.length} matches with average score: ${matches.length > 0 ? (matches.reduce((sum, m) => sum + m.matchScore.score, 0) / matches.length).toFixed(1) : 0}`);
      
      return {
        success: true,
        matches: limitedMatches,
        totalAvailable: businesses.length,
        matchingCriteria: this.getMatchingCriteria(investor),
        recommendations: this.generateInvestorRecommendations(investor, limitedMatches)
      };
      
    } catch (error) {
      console.error('Error finding investment matches:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Find potential investors for a business
   */
  async findInvestorMatches(businessId, options = {}) {
    try {
      console.log(`🏢 Finding investor matches for business: ${businessId}`);
      
      // Get business profile
      const businessResult = await this.getBusinessProfile(businessId);
      if (!businessResult.success) {
        throw new Error('Business profile not found');
      }
      
      const business = businessResult.business;
      
      // Get active investors
      const investorsResult = await this.getActiveInvestors(options);
      if (!investorsResult.success) {
        throw new Error('Failed to retrieve investors');
      }
      
      const investors = investorsResult.investors;
      
      // Calculate match scores for each investor
      const matches = [];
      for (const investor of investors) {
        const matchScore = await this.calculateMatchScore(investor, business);
        
        if (matchScore.score >= (options.minScore || 50)) {
          matches.push({
            investorId: investor.userId,
            investor: investor,
            matchScore: matchScore,
            investmentCapacity: this.calculateInvestmentCapacity(investor, business),
            interestLevel: this.predictInterestLevel(matchScore, investor)
          });
        }
      }
      
      // Sort by match score and investment capacity
      matches.sort((a, b) => {
        const scoreA = a.matchScore.score * 0.7 + a.investmentCapacity * 0.3;
        const scoreB = b.matchScore.score * 0.7 + b.investmentCapacity * 0.3;
        return scoreB - scoreA;
      });
      
      // Limit results
      const limitedMatches = matches.slice(0, options.limit || 15);
      
      console.log(`✅ Found ${limitedMatches.length} investor matches`);
      
      return {
        success: true,
        matches: limitedMatches,
        totalAvailable: investors.length,
        fundingPotential: this.calculateFundingPotential(limitedMatches, business),
        outreachStrategy: this.generateOutreachStrategy(limitedMatches, business)
      };
      
    } catch (error) {
      console.error('Error finding investor matches:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calculate comprehensive match score between investor and business
   */
  async calculateMatchScore(investor, business) {
    try {
      // Risk alignment score
      const riskScore = this.calculateRiskAlignmentScore(investor, business);
      
      // Sector preference score
      const sectorScore = this.calculateSectorScore(investor, business);
      
      // Investment size compatibility
      const sizeScore = this.calculateInvestmentSizeScore(investor, business);
      
      // Geographic alignment
      const geoScore = this.calculateGeographicScore(investor, business);
      
      // ESG alignment
      const esgScore = this.calculateESGScore(investor, business);
      
      // Growth stage alignment
      const growthScore = this.calculateGrowthStageScore(investor, business);
      
      // Return expectation alignment
      const returnScore = this.calculateReturnExpectationScore(investor, business);
      
      // Calculate weighted overall score
      const overallScore = (
        riskScore * this.matchingWeights.riskAlignment +
        sectorScore * this.matchingWeights.sectorPreference +
        sizeScore * this.matchingWeights.investmentSize +
        geoScore * this.matchingWeights.geographic +
        esgScore * this.matchingWeights.esgAlignment +
        growthScore * this.matchingWeights.growthStage +
        returnScore * this.matchingWeights.returnExpectation
      );
      
      return {
        score: Math.round(overallScore),
        components: {
          riskAlignment: Math.round(riskScore),
          sectorPreference: Math.round(sectorScore),
          investmentSize: Math.round(sizeScore),
          geographic: Math.round(geoScore),
          esgAlignment: Math.round(esgScore),
          growthStage: Math.round(growthScore),
          returnExpectation: Math.round(returnScore)
        },
        strengths: this.identifyMatchStrengths({
          riskAlignment: riskScore,
          sectorPreference: sectorScore,
          investmentSize: sizeScore,
          geographic: geoScore,
          esgAlignment: esgScore,
          growthStage: growthScore,
          returnExpectation: returnScore
        }),
        concerns: this.identifyMatchConcerns({
          riskAlignment: riskScore,
          sectorPreference: sectorScore,
          investmentSize: sizeScore,
          geographic: geoScore,
          esgAlignment: esgScore,
          growthStage: growthScore,
          returnExpectation: returnScore
        })
      };
      
    } catch (error) {
      console.error('Error calculating match score:', error);
      return { score: 0, components: {}, strengths: [], concerns: [] };
    }
  }
  
  // ============================================================================
  // COMPONENT SCORE CALCULATIONS
  // ============================================================================
  
  /**
   * Calculate risk alignment score
   */
  calculateRiskAlignmentScore(investor, business) {
    const investorRiskTolerance = investor.preferences?.riskTolerance || 50;
    const businessRiskLevel = business.riskAssessment?.overallRisk || 50;
    
    // Perfect alignment = 100, maximum misalignment = 0
    const riskDifference = Math.abs(investorRiskTolerance - businessRiskLevel);
    const maxDifference = 50; // Maximum possible difference
    
    const alignmentScore = Math.max(0, 100 - (riskDifference / maxDifference) * 100);
    
    // Bonus for exact risk profile match
    if (riskDifference <= 10) {
      return Math.min(100, alignmentScore + 10);
    }
    
    return alignmentScore;
  }
  
  /**
   * Calculate sector preference score
   */
  calculateSectorScore(investor, business) {
    const investorSectors = investor.preferences?.preferredSectors || [];
    const businessSector = business.industry || business.sector;
    
    if (investorSectors.length === 0) {
      return 60; // Neutral score if no preferences specified
    }
    
    // Direct sector match
    if (investorSectors.includes(businessSector)) {
      return 100;
    }
    
    // Check for related sectors
    const businessSectorInfo = this.sectorCategories[businessSector];
    if (businessSectorInfo) {
      for (const preferredSector of investorSectors) {
        const preferredSectorInfo = this.sectorCategories[preferredSector];
        if (preferredSectorInfo && 
            Math.abs(preferredSectorInfo.avgReturns - businessSectorInfo.avgReturns) < 0.05) {
          return 75; // Related sector bonus
        }
      }
    }
    
    // Check for sector diversification preference
    if (investor.preferences?.seekDiversification && 
        !investorSectors.includes(businessSector)) {
      return 65; // Diversification bonus
    }
    
    return 30; // Low score for non-preferred sectors
  }
  
  /**
   * Calculate investment size compatibility score
   */
  calculateInvestmentSizeScore(investor, business) {
    const investorMinAmount = investor.preferences?.minInvestmentAmount || 1000;
    const investorMaxAmount = investor.preferences?.maxInvestmentAmount || 1000000;
    const businessFundingNeeded = business.fundingGoal?.amount || 100000;
    const businessMinInvestment = business.minInvestmentAmount || 1000;
    
    // Check if investor's range overlaps with business needs
    const overlapMin = Math.max(investorMinAmount, businessMinInvestment);
    const overlapMax = Math.min(investorMaxAmount, businessFundingNeeded);
    
    if (overlapMax < overlapMin) {
      return 0; // No overlap
    }
    
    // Calculate overlap as percentage of investor's range
    const investorRange = investorMaxAmount - investorMinAmount;
    const overlapRange = overlapMax - overlapMin;
    const overlapPercentage = investorRange > 0 ? overlapRange / investorRange : 1;
    
    let score = Math.min(100, overlapPercentage * 100);
    
    // Bonus for optimal investment size (10-30% of funding goal)
    const optimalMin = businessFundingNeeded * 0.1;
    const optimalMax = businessFundingNeeded * 0.3;
    
    if (investorMaxAmount >= optimalMin && investorMinAmount <= optimalMax) {
      score = Math.min(100, score + 15);
    }
    
    return score;
  }
  
  /**
   * Calculate geographic alignment score
   */
  calculateGeographicScore(investor, business) {
    const investorRegions = investor.preferences?.preferredRegions || [];
    const businessCountry = business.location?.country;
    const businessRegion = business.location?.region;
    
    if (investorRegions.length === 0) {
      return 70; // Neutral score if no geographic preferences
    }
    
    // Direct country/region match
    if (investorRegions.includes(businessCountry) || 
        investorRegions.includes(businessRegion)) {
      return 100;
    }
    
    // Check for regional preferences (e.g., 'West Africa', 'East Africa')
    const regionalMatches = this.checkRegionalMatches(investorRegions, businessCountry);
    if (regionalMatches.length > 0) {
      return 85;
    }
    
    // Distance penalty for far locations
    if (investor.location && business.location) {
      const distance = this.calculateDistance(investor.location, business.location);
      const distanceScore = Math.max(20, 100 - distance / 100); // Penalty per 100km
      return distanceScore;
    }
    
    return 40; // Default score for unspecified regions
  }
  
  /**
   * Calculate ESG alignment score
   */
  calculateESGScore(investor, business) {
    const investorESGPrefs = investor.preferences?.esgPreferences || {};
    const businessESGScore = business.esgScore || {};
    
    if (Object.keys(investorESGPrefs).length === 0) {
      return 70; // Neutral score if no ESG preferences
    }
    
    let totalScore = 0;
    let weightSum = 0;
    
    // Environmental alignment
    if (investorESGPrefs.environmental && businessESGScore.environmental) {
      const envScore = this.calculateESGComponentAlignment(
        investorESGPrefs.environmental,
        businessESGScore.environmental
      );
      totalScore += envScore * 0.4;
      weightSum += 0.4;
    }
    
    // Social alignment
    if (investorESGPrefs.social && businessESGScore.social) {
      const socialScore = this.calculateESGComponentAlignment(
        investorESGPrefs.social,
        businessESGScore.social
      );
      totalScore += socialScore * 0.35;
      weightSum += 0.35;
    }
    
    // Governance alignment
    if (investorESGPrefs.governance && businessESGScore.governance) {
      const govScore = this.calculateESGComponentAlignment(
        investorESGPrefs.governance,
        businessESGScore.governance
      );
      totalScore += govScore * 0.25;
      weightSum += 0.25;
    }
    
    return weightSum > 0 ? totalScore / weightSum : 70;
  }
  
  /**
   * Calculate growth stage alignment score
   */
  calculateGrowthStageScore(investor, business) {
    const investorStagePrefs = investor.preferences?.preferredGrowthStages || [];
    const businessStage = business.growthStage || 'growth';
    
    if (investorStagePrefs.length === 0) {
      return 60; // Neutral score if no stage preferences
    }
    
    // Direct stage match
    if (investorStagePrefs.includes(businessStage)) {
      return 100;
    }
    
    // Adjacent stage compatibility
    const stageOrder = ['startup', 'growth', 'expansion', 'mature'];
    const businessIndex = stageOrder.indexOf(businessStage);
    
    for (const preferredStage of investorStagePrefs) {
      const preferredIndex = stageOrder.indexOf(preferredStage);
      if (Math.abs(businessIndex - preferredIndex) === 1) {
        return 75; // Adjacent stage bonus
      }
    }
    
    return 25; // Low score for non-preferred stages
  }
  
  /**
   * Calculate return expectation alignment score
   */
  calculateReturnExpectationScore(investor, business) {
    const investorExpectedReturn = investor.preferences?.expectedReturn || 0.15;
    const businessProjectedReturn = business.projectedReturns?.expectedReturn || 0.12;
    
    // Calculate difference between expectations
    const returnDifference = Math.abs(investorExpectedReturn - businessProjectedReturn);
    
    if (businessProjectedReturn >= investorExpectedReturn) {
      // Business meets or exceeds expectations
      const exceedance = businessProjectedReturn - investorExpectedReturn;
      return Math.min(100, 80 + exceedance * 200); // Bonus for exceeding expectations
    } else {
      // Business falls short of expectations
      const shortfall = investorExpectedReturn - businessProjectedReturn;
      return Math.max(0, 80 - shortfall * 300); // Penalty for falling short
    }
  }
  
  // ============================================================================
  // MACHINE LEARNING OPTIMIZATION
  // ============================================================================
  
  /**
   * Apply ML optimization to match results
   */
  async applyMLOptimization(matches, investor) {
    try {
      // Get historical investor behavior
      const behaviorData = await this.getInvestorBehaviorData(investor.userId);
      
      // Get market trends
      const marketTrends = await this.getMarketTrends();
      
      // Get similar investor patterns
      const similarInvestors = await this.findSimilarInvestors(investor);
      
      // Apply ML adjustments to each match
      const optimizedMatches = matches.map(match => {
        const mlAdjustment = this.calculateMLAdjustment(
          match,
          behaviorData,
          marketTrends,
          similarInvestors
        );
        
        return {
          ...match,
          matchScore: {
            ...match.matchScore,
            score: Math.max(0, Math.min(100, match.matchScore.score + mlAdjustment)),
            mlAdjustment: mlAdjustment
          }
        };
      });
      
      // Re-sort after ML optimization
      optimizedMatches.sort((a, b) => b.matchScore.score - a.matchScore.score);
      
      return optimizedMatches;
      
    } catch (error) {
      console.error('Error applying ML optimization:', error);
      return matches; // Return original matches if ML fails
    }
  }
  
  /**
   * Calculate ML-based adjustment to match score
   */
  calculateMLAdjustment(match, behaviorData, marketTrends, similarInvestors) {
    let adjustment = 0;
    
    // Historical performance adjustment
    if (behaviorData.previousInvestments) {
      const successRate = behaviorData.successRate || 0.5;
      const sectorPerformance = behaviorData.sectorPerformance || {};
      
      if (sectorPerformance[match.business.sector]) {
        adjustment += (sectorPerformance[match.business.sector] - 0.5) * 20;
      }
      
      adjustment += (successRate - 0.5) * 10;
    }
    
    // Market trends adjustment
    if (marketTrends.hotSectors?.includes(match.business.sector)) {
      adjustment += 5;
    }
    
    if (marketTrends.growingRegions?.includes(match.business.location?.country)) {
      adjustment += 3;
    }
    
    // Similar investor patterns
    if (similarInvestors.length > 0) {
      const similarityBonus = similarInvestors
        .filter(si => si.investments?.some(inv => inv.sector === match.business.sector))
        .length / similarInvestors.length * 8;
      
      adjustment += similarityBonus;
    }
    
    return Math.max(-15, Math.min(15, adjustment)); // Cap adjustment at ±15 points
  }
  
  // ============================================================================
  // UTILITY AND HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get investor profile with preferences
   */
  async getInvestorProfile(investorId) {
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
          preferences: userResult.user.investmentPreferences || {}
        }
      };
      
    } catch (error) {
      console.error('Error getting investor profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get business profile
   */
  async getBusinessProfile(businessId) {
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
      console.error('Error getting business profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get available businesses for investment
   */
  async getAvailableBusinesses(options = {}) {
    try {
      let query = FirebaseAdmin.adminFirestore
        .collection('businesses')
        .where('status', '==', 'active')
        .where('seekingInvestment', '==', true);
      
      // Apply filters
      if (options.sectors && options.sectors.length > 0) {
        query = query.where('sector', 'in', options.sectors);
      }
      
      if (options.countries && options.countries.length > 0) {
        query = query.where('location.country', 'in', options.countries);
      }
      
      if (options.minFunding) {
        query = query.where('fundingGoal.amount', '>=', options.minFunding);
      }
      
      if (options.maxFunding) {
        query = query.where('fundingGoal.amount', '<=', options.maxFunding);
      }
      
      // Limit results
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const businesses = [];
      
      snapshot.forEach(doc => {
        businesses.push({
          businessId: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, businesses };
      
    } catch (error) {
      console.error('Error getting available businesses:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get active investors
   */
  async getActiveInvestors(options = {}) {
    try {
      let query = FirebaseAdmin.adminFirestore
        .collection('users')
        .where('userType', '==', 'investor')
        .where('status', '==', 'active')
        .where('preferences.activelyInvesting', '==', true);
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const investors = [];
      
      snapshot.forEach(doc => {
        investors.push({
          userId: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, investors };
      
    } catch (error) {
      console.error('Error getting active investors:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate recommendation reason
   */
  generateRecommendationReason(matchScore) {
    const strengths = matchScore.strengths || [];
    const topStrengths = strengths.slice(0, 2);
    
    if (topStrengths.length === 0) {
      return 'This investment opportunity aligns with your general preferences.';
    }
    
    const reasonMap = {
      riskAlignment: 'matches your risk tolerance perfectly',
      sectorPreference: 'is in your preferred investment sector',
      investmentSize: 'fits your investment amount range',
      geographic: 'is located in your preferred region',
      esgAlignment: 'aligns with your ESG values',
      growthStage: 'is at your preferred business growth stage',
      returnExpectation: 'meets your expected return requirements'
    };
    
    const reasons = topStrengths.map(strength => reasonMap[strength] || strength);
    
    if (reasons.length === 1) {
      return `This opportunity ${reasons[0]}.`;
    } else {
      return `This opportunity ${reasons[0]} and ${reasons[1]}.`;
    }
  }
  
  /**
   * Identify match strengths
   */
  identifyMatchStrengths(components) {
    const strengths = [];
    const threshold = 75;
    
    Object.entries(components).forEach(([component, score]) => {
      if (score >= threshold) {
        strengths.push(component);
      }
    });
    
    return strengths.sort((a, b) => components[b] - components[a]);
  }
  
  /**
   * Identify match concerns
   */
  identifyMatchConcerns(components) {
    const concerns = [];
    const threshold = 50;
    
    Object.entries(components).forEach(([component, score]) => {
      if (score < threshold) {
        concerns.push({
          component: component,
          score: score,
          severity: score < 30 ? 'high' : 'medium'
        });
      }
    });
    
    return concerns.sort((a, b) => a.score - b.score);
  }
  
  /**
   * Calculate confidence in match
   */
  calculateConfidence(matchScore, investor, business) {
    let confidence = matchScore.score / 100;
    
    // Adjust based on data completeness
    const investorDataCompleteness = this.calculateDataCompleteness(investor);
    const businessDataCompleteness = this.calculateDataCompleteness(business);
    
    confidence *= (investorDataCompleteness + businessDataCompleteness) / 2;
    
    // Adjust based on match strength consistency
    const componentScores = Object.values(matchScore.components);
    const scoreVariance = this.calculateVariance(componentScores);
    const consistencyFactor = Math.max(0.7, 1 - scoreVariance / 1000);
    
    confidence *= consistencyFactor;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  /**
   * Calculate data completeness score
   */
  calculateDataCompleteness(profile) {
    const requiredFields = [
      'preferences', 'location', 'profile.completedAt',
      'verificationStatus', 'financialInfo'
    ];
    
    let completedFields = 0;
    requiredFields.forEach(field => {
      const fieldValue = this.getNestedField(profile, field);
      if (fieldValue !== undefined && fieldValue !== null) {
        completedFields++;
      }
    });
    
    return completedFields / requiredFields.length;
  }
  
  /**
   * Get nested field value
   */
  getNestedField(obj, field) {
    return field.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  /**
   * Calculate statistical variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Log matching activity
   */
  async logMatchingActivity(logData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('matchingLogs')
        .add({
          ...logData,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error logging matching activity:', error);
    }
  }
  
  /**
   * Get matching analytics
   */
  async getMatchingAnalytics(timeRange = '30d') {
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
      
      const logsQuery = FirebaseAdmin.adminFirestore
        .collection('matchingLogs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await logsQuery.get();
      
      const analytics = {
        totalMatches: 0,
        averageScore: 0,
        totalInvestors: new Set(),
        totalBusinesses: 0,
        matchSuccessRate: 0,
        sectorBreakdown: {},
        regionalBreakdown: {}
      };
      
      let totalScore = 0;
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalMatches++;
        analytics.totalInvestors.add(log.investorId);
        analytics.totalBusinesses += log.totalBusinesses || 0;
        totalScore += log.averageScore || 0;
      });
      
      analytics.averageScore = analytics.totalMatches > 0 ? 
        totalScore / analytics.totalMatches : 0;
      analytics.totalInvestors = analytics.totalInvestors.size;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting matching analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Additional helper methods for ML features (simplified implementations)
  async getInvestorBehaviorData(investorId) {
    // Simplified implementation - in production, this would analyze historical data
    return {
      previousInvestments: [],
      successRate: 0.6,
      sectorPerformance: {},
      avgInvestmentAmount: 50000,
      investmentFrequency: 2 // investments per year
    };
  }
  
  async getMarketTrends() {
    // Simplified implementation - in production, this would analyze market data
    return {
      hotSectors: ['technology', 'healthcare', 'fintech'],
      growingRegions: ['NG', 'KE', 'GH'],
      averageReturns: 0.12,
      riskFactors: ['inflation', 'currency_volatility']
    };
  }
  
  async findSimilarInvestors(investor) {
    // Simplified implementation - in production, this would use clustering algorithms
    return [];
  }
  
  calculateESGComponentAlignment(investorPrefs, businessScore) {
    // Simplified ESG alignment calculation
    return Math.min(100, businessScore * (1 + investorPrefs.importance * 0.2));
  }
  
  checkRegionalMatches(investorRegions, businessCountry) {
    // Simplified regional matching
    const westAfrica = ['NG', 'GH', 'SN', 'CI'];
    const eastAfrica = ['KE', 'UG', 'TZ', 'ET'];
    
    if (investorRegions.includes('West Africa') && westAfrica.includes(businessCountry)) {
      return ['West Africa'];
    }
    
    if (investorRegions.includes('East Africa') && eastAfrica.includes(businessCountry)) {
      return ['East Africa'];
    }
    
    return [];
  }
  
  calculateDistance(location1, location2) {
    // Simplified distance calculation (would use proper geo calculations in production)
    return 500; // Default distance in km
  }
  
  getMatchingCriteria(investor) {
    return {
      riskTolerance: investor.preferences?.riskTolerance,
      preferredSectors: investor.preferences?.preferredSectors || [],
      investmentRange: {
        min: investor.preferences?.minInvestmentAmount,
        max: investor.preferences?.maxInvestmentAmount
      },
      preferredRegions: investor.preferences?.preferredRegions || [],
      esgRequirements: investor.preferences?.esgPreferences || {}
    };
  }
  
  generateInvestorRecommendations(investor, matches) {
    const recommendations = [];
    
    if (matches.length > 0) {
      const avgScore = matches.reduce((sum, m) => sum + m.matchScore.score, 0) / matches.length;
      
      if (avgScore > 80) {
        recommendations.push('Excellent matches found! Consider diversifying across top 3-5 opportunities.');
      } else if (avgScore > 60) {
        recommendations.push('Good matches available. Review risk profiles carefully before investing.');
      } else {
        recommendations.push('Consider adjusting your preferences to find better matches.');
      }
    }
    
    return recommendations;
  }
  
  calculateInvestmentCapacity(investor, business) {
    const maxAmount = investor.preferences?.maxInvestmentAmount || 100000;
    const businessNeeds = business.fundingGoal?.amount || 100000;
    const currentCommitments = investor.currentInvestments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
    
    const availableCapacity = Math.max(0, maxAmount - currentCommitments);
    const capacityScore = Math.min(100, (availableCapacity / businessNeeds) * 100);
    
    return Math.round(capacityScore);
  }
  
  predictInterestLevel(matchScore, investor) {
    const baseInterest = matchScore.score / 100;
    const activityLevel = investor.profile?.activityLevel || 0.5;
    
    return Math.min(0.95, baseInterest * (1 + activityLevel * 0.3));
  }
  
  calculateFundingPotential(matches, business) {
    if (matches.length === 0) return 0;
    
    const totalCapacity = matches.reduce((sum, match) => {
      const capacity = match.investmentCapacity / 100;
      const maxAmount = match.investor.preferences?.maxInvestmentAmount || 50000;
      return sum + (capacity * maxAmount);
    }, 0);
    
    const fundingGoal = business.fundingGoal?.amount || 100000;
    return Math.min(100, (totalCapacity / fundingGoal) * 100);
  }
  
  generateOutreachStrategy(matches, business) {
    const strategy = {
      priority: 'medium',
      suggestedApproach: 'email',
      keyMessages: [],
      timing: 'immediate'
    };
    
    if (matches.length > 0) {
      const avgScore = matches.reduce((sum, m) => sum + m.matchScore.score, 0) / matches.length;
      
      if (avgScore > 80) {
        strategy.priority = 'high';
        strategy.suggestedApproach = 'personalized_outreach';
        strategy.timing = 'immediate';
      }
      
      strategy.keyMessages = [
        `${matches.length} qualified investors interested`,
        `${avgScore.toFixed(0)}% average compatibility score`,
        `Strong match in ${business.sector} sector`
      ];
    }
    
    return strategy;
  }
}

module.exports = new AIMatchmakingAlgorithm();