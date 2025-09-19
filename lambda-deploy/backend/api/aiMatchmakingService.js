/**
 * BVESTER PLATFORM - AI MATCHMAKING SERVICE
 * Intelligent investor-business matching using machine learning algorithms
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class AIMatchmakingService {
  constructor() {
    // Matching algorithm weights and parameters
    this.matchingWeights = {
      industryAlignment: 0.25,       // 25% - Industry preference match
      riskTolerance: 0.20,          // 20% - Risk appetite compatibility
      investmentAmount: 0.15,        // 15% - Investment size compatibility
      geographicPreference: 0.10,   // 10% - Geographic preference
      investmentType: 0.10,         // 10% - Investment type preference
      businessStage: 0.10,          // 10% - Business development stage
      impactAlignment: 0.10         // 10% - ESG/Impact alignment
    };
    
    // Confidence thresholds
    this.confidenceThresholds = {
      excellent: 0.85,  // 85%+ match
      good: 0.70,       // 70-84% match
      fair: 0.55,       // 55-69% match
      poor: 0.40        // 40-54% match (below 40% not recommended)
    };
    
    // Industry categories and relationships
    this.industryCategories = {
      'agriculture': {
        related: ['food_processing', 'technology', 'sustainability'],
        keywords: ['farming', 'crops', 'livestock', 'irrigation', 'organic']
      },
      'technology': {
        related: ['fintech', 'healthcare', 'education', 'agriculture'],
        keywords: ['software', 'app', 'digital', 'ai', 'blockchain', 'mobile']
      },
      'healthcare': {
        related: ['technology', 'pharmaceuticals', 'education'],
        keywords: ['medical', 'health', 'clinic', 'pharmaceutical', 'telemedicine']
      },
      'fintech': {
        related: ['technology', 'banking', 'insurance'],
        keywords: ['payment', 'mobile money', 'blockchain', 'digital banking']
      },
      'education': {
        related: ['technology', 'healthcare', 'training'],
        keywords: ['learning', 'school', 'training', 'education', 'edtech']
      },
      'manufacturing': {
        related: ['technology', 'agriculture', 'export'],
        keywords: ['production', 'factory', 'processing', 'assembly']
      },
      'renewable_energy': {
        related: ['technology', 'sustainability', 'manufacturing'],
        keywords: ['solar', 'wind', 'clean energy', 'sustainable', 'green']
      },
      'logistics': {
        related: ['technology', 'e_commerce', 'manufacturing'],
        keywords: ['transport', 'delivery', 'supply chain', 'shipping']
      }
    };
    
    // Risk level mappings
    this.riskLevels = {
      'conservative': { min: 1, max: 3, description: 'Low risk tolerance' },
      'moderate': { min: 3, max: 6, description: 'Moderate risk tolerance' },
      'aggressive': { min: 6, max: 10, description: 'High risk tolerance' }
    };
    
    // Business stage mappings
    this.businessStages = {
      'idea': { risk: 9, potential: 10, keywords: ['concept', 'planning', 'startup'] },
      'mvp': { risk: 8, potential: 9, keywords: ['prototype', 'testing', 'development'] },
      'early_revenue': { risk: 6, potential: 8, keywords: ['first sales', 'customers', 'traction'] },
      'growth': { risk: 4, potential: 7, keywords: ['scaling', 'expansion', 'growth'] },
      'established': { risk: 2, potential: 5, keywords: ['profitable', 'stable', 'mature'] }
    };
  }
  
  // ============================================================================
  // CORE MATCHING ALGORITHM
  // ============================================================================
  
  /**
   * Find best matches for an investor
   */
  async findBusinessMatches(investorId, options = {}) {
    try {
      console.log(`🤖 Finding business matches for investor: ${investorId}`);
      
      // Get investor profile and preferences
      const investorProfile = await this.getInvestorProfile(investorId);
      if (!investorProfile) {
        return { success: false, error: 'Investor profile not found' };
      }
      
      // Get all available business opportunities
      const businesses = await this.getAvailableBusinesses(options.filters);
      
      if (businesses.length === 0) {
        return { 
          success: true, 
          matches: [], 
          message: 'No businesses available for matching' 
        };
      }
      
      // Calculate match scores for each business
      const matchResults = [];
      
      for (const business of businesses) {
        const matchScore = await this.calculateMatchScore(investorProfile, business);
        
        if (matchScore.overallScore >= (options.minScore || 0.40)) {
          matchResults.push({
            business: business,
            matchScore: matchScore,
            confidence: this.getConfidenceLevel(matchScore.overallScore),
            recommendationReason: this.generateRecommendationReason(matchScore)
          });
        }
      }
      
      // Sort by match score (highest first)
      matchResults.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);
      
      // Limit results
      const limit = options.limit || 20;
      const topMatches = matchResults.slice(0, limit);
      
      // Log matching activity
      await this.logMatchingActivity(investorId, {
        totalBusinesses: businesses.length,
        matchesFound: topMatches.length,
        topScore: topMatches.length > 0 ? topMatches[0].matchScore.overallScore : 0
      });
      
      return {
        success: true,
        matches: topMatches,
        stats: {
          totalBusinesses: businesses.length,
          matchesFound: topMatches.length,
          averageScore: this.calculateAverageScore(topMatches)
        }
      };
      
    } catch (error) {
      console.error('Error finding business matches:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Find best investors for a business
   */
  async findInvestorMatches(businessId, options = {}) {
    try {
      console.log(`🤖 Finding investor matches for business: ${businessId}`);
      
      // Get business profile
      const businessProfile = await this.getBusinessProfile(businessId);
      if (!businessProfile) {
        return { success: false, error: 'Business profile not found' };
      }
      
      // Get all active investors
      const investors = await this.getActiveInvestors(options.filters);
      
      if (investors.length === 0) {
        return { 
          success: true, 
          matches: [], 
          message: 'No investors available for matching' 
        };
      }
      
      // Calculate match scores for each investor
      const matchResults = [];
      
      for (const investor of investors) {
        const matchScore = await this.calculateMatchScore(investor, businessProfile);
        
        if (matchScore.overallScore >= (options.minScore || 0.40)) {
          matchResults.push({
            investor: investor,
            matchScore: matchScore,
            confidence: this.getConfidenceLevel(matchScore.overallScore),
            recommendationReason: this.generateRecommendationReason(matchScore)
          });
        }
      }
      
      // Sort by match score (highest first)
      matchResults.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);
      
      // Limit results
      const limit = options.limit || 20;
      const topMatches = matchResults.slice(0, limit);
      
      // Log matching activity
      await this.logMatchingActivity(businessId, {
        totalInvestors: investors.length,
        matchesFound: topMatches.length,
        topScore: topMatches.length > 0 ? topMatches[0].matchScore.overallScore : 0
      });
      
      return {
        success: true,
        matches: topMatches,
        stats: {
          totalInvestors: investors.length,
          matchesFound: topMatches.length,
          averageScore: this.calculateAverageScore(topMatches)
        }
      };
      
    } catch (error) {
      console.error('Error finding investor matches:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // MATCH SCORE CALCULATION
  // ============================================================================
  
  /**
   * Calculate comprehensive match score between investor and business
   */
  async calculateMatchScore(investorProfile, businessProfile) {
    try {
      const scores = {};
      
      // 1. Industry Alignment Score
      scores.industryAlignment = this.calculateIndustryAlignment(
        investorProfile.preferences?.industries || [],
        businessProfile.industry,
        businessProfile.description
      );
      
      // 2. Risk Tolerance Score
      scores.riskTolerance = this.calculateRiskCompatibility(
        investorProfile.preferences?.riskTolerance || 'moderate',
        businessProfile.riskLevel || 5,
        businessProfile.stage
      );
      
      // 3. Investment Amount Score
      scores.investmentAmount = this.calculateAmountCompatibility(
        investorProfile.preferences?.investmentRange || {},
        businessProfile.fundingNeeds || {}
      );
      
      // 4. Geographic Preference Score
      scores.geographicPreference = this.calculateGeographicCompatibility(
        investorProfile.preferences?.regions || [],
        businessProfile.location?.country,
        businessProfile.location?.region
      );
      
      // 5. Investment Type Score
      scores.investmentType = this.calculateInvestmentTypeCompatibility(
        investorProfile.preferences?.investmentTypes || [],
        businessProfile.investmentType || 'equity'
      );
      
      // 6. Business Stage Score
      scores.businessStage = this.calculateBusinessStageCompatibility(
        investorProfile.preferences?.businessStages || [],
        businessProfile.stage
      );
      
      // 7. Impact Alignment Score
      scores.impactAlignment = this.calculateImpactAlignment(
        investorProfile.preferences?.impactAreas || [],
        businessProfile.impactAreas || [],
        businessProfile.esgScore || 0
      );
      
      // Calculate weighted overall score
      let overallScore = 0;
      for (const [factor, weight] of Object.entries(this.matchingWeights)) {
        if (scores[factor] !== undefined) {
          overallScore += scores[factor] * weight;
        }
      }
      
      return {
        overallScore: Math.round(overallScore * 1000) / 1000, // Round to 3 decimals
        componentScores: scores,
        weights: this.matchingWeights
      };
      
    } catch (error) {
      console.error('Error calculating match score:', error);
      throw error;
    }
  }
  
  /**
   * Calculate industry alignment score
   */
  calculateIndustryAlignment(investorIndustries, businessIndustry, businessDescription) {
    if (!investorIndustries.length || !businessIndustry) return 0.5; // Neutral if no data
    
    let score = 0;
    
    // Direct industry match
    if (investorIndustries.includes(businessIndustry)) {
      score = 1.0;
    } else {
      // Check related industries
      const businessCategory = this.industryCategories[businessIndustry];
      if (businessCategory) {
        for (const investorIndustry of investorIndustries) {
          if (businessCategory.related.includes(investorIndustry)) {
            score = Math.max(score, 0.7);
          }
        }
      }
      
      // Keyword matching in business description
      if (businessDescription && score < 0.7) {
        const description = businessDescription.toLowerCase();
        for (const investorIndustry of investorIndustries) {
          const category = this.industryCategories[investorIndustry];
          if (category) {
            for (const keyword of category.keywords) {
              if (description.includes(keyword.toLowerCase())) {
                score = Math.max(score, 0.5);
              }
            }
          }
        }
      }
    }
    
    return score;
  }
  
  /**
   * Calculate risk tolerance compatibility
   */
  calculateRiskCompatibility(investorRiskTolerance, businessRiskLevel, businessStage) {
    const investorRisk = this.riskLevels[investorRiskTolerance];
    if (!investorRisk) return 0.5;
    
    let riskScore = businessRiskLevel;
    
    // Adjust risk based on business stage
    if (businessStage && this.businessStages[businessStage]) {
      riskScore = this.businessStages[businessStage].risk;
    }
    
    // Calculate compatibility
    if (riskScore >= investorRisk.min && riskScore <= investorRisk.max) {
      return 1.0; // Perfect match
    }
    
    // Calculate proximity score
    const midpoint = (investorRisk.min + investorRisk.max) / 2;
    const distance = Math.abs(riskScore - midpoint);
    const maxDistance = Math.max(midpoint - 1, 10 - midpoint);
    
    return Math.max(0, 1 - (distance / maxDistance));
  }
  
  /**
   * Calculate investment amount compatibility
   */
  calculateAmountCompatibility(investorRange, businessNeeds) {
    if (!investorRange.min || !investorRange.max || !businessNeeds.amount) {
      return 0.5; // Neutral if no data
    }
    
    const businessAmount = businessNeeds.amount;
    
    // Perfect match if business amount is within investor range
    if (businessAmount >= investorRange.min && businessAmount <= investorRange.max) {
      return 1.0;
    }
    
    // Partial match calculation
    if (businessAmount < investorRange.min) {
      const ratio = businessAmount / investorRange.min;
      return Math.max(0.3, ratio); // Minimum 30% for smaller amounts
    }
    
    if (businessAmount > investorRange.max) {
      const ratio = investorRange.max / businessAmount;
      return Math.max(0.2, ratio); // Minimum 20% for larger amounts
    }
    
    return 0.5;
  }
  
  /**
   * Calculate geographic compatibility
   */
  calculateGeographicCompatibility(investorRegions, businessCountry, businessRegion) {
    if (!investorRegions.length || !businessCountry) return 0.5;
    
    // Check country match
    if (investorRegions.includes(businessCountry)) {
      return 1.0;
    }
    
    // Check regional match
    if (businessRegion && investorRegions.includes(businessRegion)) {
      return 0.8;
    }
    
    // Check if investor prefers 'Africa' and business is in Africa
    const africanCountries = ['NG', 'KE', 'GH', 'ZA', 'EG', 'MA', 'TN', 'UG', 'TZ', 'ET'];
    if (investorRegions.includes('Africa') && africanCountries.includes(businessCountry)) {
      return 0.9;
    }
    
    return 0.3; // Low score for geographic mismatch
  }
  
  /**
   * Calculate investment type compatibility
   */
  calculateInvestmentTypeCompatibility(investorTypes, businessType) {
    if (!investorTypes.length || !businessType) return 0.5;
    
    if (investorTypes.includes(businessType)) {
      return 1.0;
    }
    
    // Check for compatible types
    const compatibilityMap = {
      'equity': ['convertible_note', 'revenue_share'],
      'debt': ['convertible_note', 'revenue_share'],
      'convertible_note': ['equity', 'debt'],
      'revenue_share': ['equity', 'debt']
    };
    
    const compatibleTypes = compatibilityMap[businessType] || [];
    for (const investorType of investorTypes) {
      if (compatibleTypes.includes(investorType)) {
        return 0.7;
      }
    }
    
    return 0.2;
  }
  
  /**
   * Calculate business stage compatibility
   */
  calculateBusinessStageCompatibility(investorStages, businessStage) {
    if (!investorStages.length || !businessStage) return 0.5;
    
    if (investorStages.includes(businessStage)) {
      return 1.0;
    }
    
    // Adjacent stage compatibility
    const stageOrder = ['idea', 'mvp', 'early_revenue', 'growth', 'established'];
    const businessIndex = stageOrder.indexOf(businessStage);
    
    if (businessIndex >= 0) {
      for (const investorStage of investorStages) {
        const investorIndex = stageOrder.indexOf(investorStage);
        if (investorIndex >= 0) {
          const distance = Math.abs(businessIndex - investorIndex);
          if (distance === 1) return 0.7; // Adjacent stages
          if (distance === 2) return 0.4; // Two stages apart
        }
      }
    }
    
    return 0.2;
  }
  
  /**
   * Calculate impact alignment score
   */
  calculateImpactAlignment(investorImpactAreas, businessImpactAreas, businessESGScore) {
    if (!investorImpactAreas.length && !businessImpactAreas.length) {
      return 0.5; // Neutral if neither party specifies impact preferences
    }
    
    let score = 0;
    
    // Impact area matching
    if (investorImpactAreas.length && businessImpactAreas.length) {
      const commonAreas = investorImpactAreas.filter(area => 
        businessImpactAreas.includes(area)
      );
      
      if (commonAreas.length > 0) {
        score = Math.min(1.0, commonAreas.length / investorImpactAreas.length);
      }
    }
    
    // ESG score consideration
    if (businessESGScore > 0) {
      const esgBonus = businessESGScore / 100; // Convert to 0-1 scale
      score = Math.max(score, esgBonus * 0.8); // ESG score can contribute up to 80%
    }
    
    return score;
  }
  
  // ============================================================================
  // DATA RETRIEVAL HELPERS
  // ============================================================================
  
  /**
   * Get investor profile with preferences
   */
  async getInvestorProfile(investorId) {
    try {
      const result = await FirebaseService.getUserProfile(investorId);
      if (!result.success) return null;
      
      return result.user;
    } catch (error) {
      console.error('Error getting investor profile:', error);
      return null;
    }
  }
  
  /**
   * Get business profile
   */
  async getBusinessProfile(businessId) {
    try {
      const result = await FirebaseService.getBusinessProfile(businessId);
      if (!result.success) return null;
      
      return result.business;
    } catch (error) {
      console.error('Error getting business profile:', error);
      return null;
    }
  }
  
  /**
   * Get available businesses for matching
   */
  async getAvailableBusinesses(filters = {}) {
    try {
      // Get businesses that are actively seeking funding
      let query = FirebaseAdmin.adminFirestore
        .collection('businesses')
        .where('status', '==', 'active')
        .where('fundingStatus', '==', 'seeking');
      
      // Apply filters
      if (filters.industry) {
        query = query.where('industry', '==', filters.industry);
      }
      
      if (filters.country) {
        query = query.where('location.country', '==', filters.country);
      }
      
      if (filters.minAmount) {
        query = query.where('fundingNeeds.amount', '>=', filters.minAmount);
      }
      
      const snapshot = await query.get();
      const businesses = [];
      
      snapshot.forEach(doc => {
        businesses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return businesses;
    } catch (error) {
      console.error('Error getting available businesses:', error);
      return [];
    }
  }
  
  /**
   * Get active investors
   */
  async getActiveInvestors(filters = {}) {
    try {
      let query = FirebaseAdmin.adminFirestore
        .collection('users')
        .where('userType', '==', 'investor')
        .where('status', '==', 'active');
      
      // Apply filters
      if (filters.verified) {
        query = query.where('verification.kycVerified', '==', true);
      }
      
      const snapshot = await query.get();
      const investors = [];
      
      snapshot.forEach(doc => {
        investors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return investors;
    } catch (error) {
      console.error('Error getting active investors:', error);
      return [];
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Get confidence level from score
   */
  getConfidenceLevel(score) {
    if (score >= this.confidenceThresholds.excellent) return 'excellent';
    if (score >= this.confidenceThresholds.good) return 'good';
    if (score >= this.confidenceThresholds.fair) return 'fair';
    return 'poor';
  }
  
  /**
   * Generate recommendation reason
   */
  generateRecommendationReason(matchScore) {
    const reasons = [];
    const scores = matchScore.componentScores;
    
    if (scores.industryAlignment >= 0.8) {
      reasons.push('Strong industry alignment');
    }
    
    if (scores.riskTolerance >= 0.8) {
      reasons.push('Compatible risk profile');
    }
    
    if (scores.investmentAmount >= 0.8) {
      reasons.push('Investment amount matches preferences');
    }
    
    if (scores.impactAlignment >= 0.7) {
      reasons.push('Aligned impact goals');
    }
    
    if (scores.geographicPreference >= 0.8) {
      reasons.push('Preferred geographic region');
    }
    
    if (reasons.length === 0) {
      reasons.push('Moderate compatibility across multiple factors');
    }
    
    return reasons.join(', ');
  }
  
  /**
   * Calculate average score
   */
  calculateAverageScore(matches) {
    if (matches.length === 0) return 0;
    
    const totalScore = matches.reduce((sum, match) => sum + match.matchScore.overallScore, 0);
    return Math.round((totalScore / matches.length) * 1000) / 1000;
  }
  
  /**
   * Log matching activity
   */
  async logMatchingActivity(userId, stats) {
    try {
      await FirebaseService.logActivity(
        userId,
        'ai_matching_performed',
        'algorithm',
        userId,
        stats
      );
    } catch (error) {
      console.error('Error logging matching activity:', error);
    }
  }
  
  /**
   * Get matching performance analytics
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
      
      const matchingQuery = FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .where('action', '==', 'ai_matching_performed')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await matchingQuery.get();
      
      const analytics = {
        totalMatchingQueries: 0,
        averageMatchesPerQuery: 0,
        averageTopScore: 0,
        totalBusinessesAnalyzed: 0,
        totalInvestorsAnalyzed: 0
      };
      
      let totalMatches = 0;
      let totalTopScores = 0;
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalMatchingQueries++;
        
        if (log.metadata) {
          totalMatches += log.metadata.matchesFound || 0;
          totalTopScores += log.metadata.topScore || 0;
          analytics.totalBusinessesAnalyzed += log.metadata.totalBusinesses || 0;
          analytics.totalInvestorsAnalyzed += log.metadata.totalInvestors || 0;
        }
      });
      
      if (analytics.totalMatchingQueries > 0) {
        analytics.averageMatchesPerQuery = Math.round(totalMatches / analytics.totalMatchingQueries);
        analytics.averageTopScore = Math.round((totalTopScores / analytics.totalMatchingQueries) * 1000) / 1000;
      }
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting matching analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AIMatchmakingService();