// 🚀 BVESTER - INVESTOR API ROUTES
// Comprehensive investor management endpoints

const express = require('express');
const router = express.Router();
const { requireUserType, requireSubscription, requireVerification } = require('../../middleware/authMiddleware');
const AIMatchmakingEngine = require('../../algorithms/ai-matchmaking');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 👤 GET INVESTOR PROFILE
 * Get investor's complete profile and preferences
 */
router.get('/profile', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;

    const investorDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(investorId)
      .get();

    if (!investorDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investor profile not found'
      });
    }

    const investorData = investorDoc.data();

    // Get investment statistics
    const investmentsQuery = await FirebaseAdmin.adminFirestore
      .collection('investments')
      .where('investorId', '==', investorId)
      .get();

    let totalInvested = 0;
    let activeInvestments = 0;
    let totalReturns = 0;

    investmentsQuery.forEach(doc => {
      const investment = doc.data();
      if (investment.status === 'active' || investment.status === 'completed') {
        totalInvested += investment.transaction.amount;
        activeInvestments++;
        totalReturns += investment.performance?.totalReturn || 0;
      }
    });

    const investorProfile = {
      ...investorData,
      investmentStats: {
        totalInvested: totalInvested,
        activeInvestments: activeInvestments,
        totalReturns: totalReturns,
        averageInvestment: activeInvestments > 0 ? totalInvested / activeInvestments : 0,
        roi: totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0
      }
    };

    res.json({
      success: true,
      investor: investorProfile
    });

  } catch (error) {
    logger.error('Error fetching investor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investor profile'
    });
  }
});

/**
 * ✏️ UPDATE INVESTMENT PREFERENCES
 * Update investor's investment criteria and preferences
 */
router.put('/preferences', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
    }

    // Validate and structure preferences
    const validPreferences = {
      investment: {
        minInvestment: preferences.investment?.minInvestment || 100,
        maxInvestment: preferences.investment?.maxInvestment || 10000,
        preferredCurrency: preferences.investment?.preferredCurrency || 'USD',
        riskTolerance: preferences.investment?.riskTolerance || 'medium', // low, medium, high
        investmentHorizon: preferences.investment?.investmentHorizon || 'medium', // short, medium, long
        autoInvest: preferences.investment?.autoInvest || false
      },
      sectors: {
        preferred: preferences.sectors?.preferred || [],
        excluded: preferences.sectors?.excluded || []
      },
      geographic: {
        preferredCountries: preferences.geographic?.preferredCountries || [],
        excludedCountries: preferences.geographic?.excludedCountries || []
      },
      fundingStages: preferences.fundingStages || ['seed', 'series-a'],
      esg: {
        minimumScore: preferences.esg?.minimumScore || 50,
        priorities: preferences.esg?.priorities || ['environmental', 'social', 'governance']
      },
      businessCriteria: {
        minimumRevenue: preferences.businessCriteria?.minimumRevenue || 0,
        profitabilityRequired: preferences.businessCriteria?.profitabilityRequired || false,
        teamSizePreference: preferences.businessCriteria?.teamSizePreference || 'any'
      }
    };

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(investorId)
      .update({
        'investorProfile.preferences': validPreferences,
        'metadata.updatedAt': new Date()
      });

    // Log preference update
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: investorId,
        action: 'preferences_updated',
        resource: { type: 'investor_preferences', id: investorId },
        timestamp: new Date()
      });

    res.json({
      success: true,
      preferences: validPreferences,
      message: 'Investment preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error updating investor preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update investment preferences'
    });
  }
});

/**
 * 🎯 GET PERSONALIZED RECOMMENDATIONS
 * AI-powered business recommendations for investor
 */
router.get('/recommendations', 
  requireUserType('investor'),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const investorId = req.user.uid;
      const { limit = 10, minScore = 60 } = req.query;

      const recommendations = await AIMatchmakingEngine.findBusinessMatches(investorId, {
        limit: parseInt(limit),
        minScore: parseInt(minScore)
      });

      if (recommendations.success) {
        res.json({
          success: true,
          recommendations: recommendations.matches,
          totalFound: recommendations.totalFound,
          generatedAt: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: recommendations.error
        });
      }

    } catch (error) {
      logger.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personalized recommendations'
      });
    }
  }
);

/**
 * 💰 GET INVESTMENT OPPORTUNITIES
 * Browse available investment opportunities with filters
 */
router.get('/opportunities', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;
    const {
      page = 1,
      limit = 20,
      country,
      sector,
      fundingStage,
      minInvestment,
      maxInvestment,
      esgMinScore,
      riskLevel,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get investor preferences for personalization
    const investorDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(investorId)
      .get();

    const investorPreferences = investorDoc.exists 
      ? investorDoc.data().investorProfile?.preferences 
      : null;

    let query = FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('status.isPublished', '==', true)
      .where('status.isActive', '==', true);

    // Apply filters
    if (country) {
      query = query.where('location.country', '==', country);
    }
    
    if (sector) {
      query = query.where('industry.primarySector', '==', sector);
    }
    
    if (fundingStage) {
      query = query.where('financials.fundingStage', '==', fundingStage);
    }

    if (esgMinScore) {
      query = query.where('scores.esgScore', '>=', parseInt(esgMinScore));
    }

    if (riskLevel) {
      query = query.where('scores.riskLevel', '==', riskLevel);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const opportunities = [];

    for (const doc of snapshot.docs) {
      const businessData = doc.data();
      
      // Filter by investment range if specified
      if (minInvestment || maxInvestment) {
        const minAmount = businessData.investment?.currentRound?.minimumInvestment || 0;
        const maxAmount = businessData.investment?.currentRound?.maximumInvestment || Infinity;
        
        if (minInvestment && minAmount < parseInt(minInvestment)) continue;
        if (maxInvestment && maxAmount > parseInt(maxInvestment)) continue;
      }

      // Calculate compatibility score if investor has preferences
      let compatibilityScore = null;
      if (investorPreferences) {
        compatibilityScore = await calculateCompatibilityScore(businessData, investorPreferences);
      }

      // Check if investor has already invested
      const existingInvestmentQuery = await FirebaseAdmin.adminFirestore
        .collection('investments')
        .where('investorId', '==', investorId)
        .where('businessId', '==', doc.id)
        .limit(1)
        .get();

      opportunities.push({
        id: doc.id,
        ...businessData,
        compatibility: compatibilityScore,
        alreadyInvested: !existingInvestmentQuery.empty,
        investmentTerm: businessData.investment?.currentRound || {}
      });
    }

    res.json({
      success: true,
      opportunities: opportunities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: opportunities.length,
        hasMore: opportunities.length === parseInt(limit)
      },
      filters: {
        country, sector, fundingStage, minInvestment, maxInvestment, esgMinScore, riskLevel
      }
    });

  } catch (error) {
    logger.error('Error fetching investment opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment opportunities'
    });
  }
});

/**
 * 📊 GET PORTFOLIO PERFORMANCE
 * Comprehensive portfolio analytics and performance
 */
router.get('/portfolio/performance', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;
    const { timeRange = '1y' } = req.query;

    // Get all investments
    const investmentsQuery = await FirebaseAdmin.adminFirestore
      .collection('investments')
      .where('investorId', '==', investorId)
      .get();

    const portfolio = {
      summary: {
        totalInvestments: 0,
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        returnPercentage: 0,
        activeInvestments: 0,
        realizedGains: 0,
        unrealizedGains: 0
      },
      diversification: {
        bySector: {},
        byCountry: {},
        byStage: {},
        byRiskLevel: {}
      },
      performance: {
        bestPerforming: [],
        worstPerforming: [],
        recentActivity: []
      },
      trends: {
        monthlyReturns: {},
        valueOverTime: {}
      }
    };

    const investments = [];
    const businessCache = new Map();

    for (const doc of investmentsQuery.docs) {
      const investment = doc.data();
      investments.push({ id: doc.id, ...investment });

      portfolio.summary.totalInvestments++;
      portfolio.summary.totalInvested += investment.transaction.amount;
      
      const currentValue = investment.performance?.currentValue || investment.transaction.amount;
      portfolio.summary.currentValue += currentValue;
      
      const totalReturn = investment.performance?.totalReturn || 0;
      portfolio.summary.totalReturn += totalReturn;
      
      const realizedGain = investment.performance?.realizedGain || 0;
      const unrealizedGain = investment.performance?.unrealizedGain || 0;
      portfolio.summary.realizedGains += realizedGain;
      portfolio.summary.unrealizedGains += unrealizedGain;

      if (investment.status === 'active') {
        portfolio.summary.activeInvestments++;
      }

      // Get business details for diversification analysis
      if (!businessCache.has(investment.businessId)) {
        const businessDoc = await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(investment.businessId)
          .get();
        
        if (businessDoc.exists) {
          businessCache.set(investment.businessId, businessDoc.data());
        }
      }

      const businessData = businessCache.get(investment.businessId);
      if (businessData) {
        const sector = businessData.industry?.primarySector || 'Unknown';
        const country = businessData.location?.country || 'Unknown';
        const stage = businessData.financials?.fundingStage || 'Unknown';
        const riskLevel = businessData.scores?.riskLevel || 'medium';

        portfolio.diversification.bySector[sector] = 
          (portfolio.diversification.bySector[sector] || 0) + investment.transaction.amount;
        portfolio.diversification.byCountry[country] = 
          (portfolio.diversification.byCountry[country] || 0) + investment.transaction.amount;
        portfolio.diversification.byStage[stage] = 
          (portfolio.diversification.byStage[stage] || 0) + investment.transaction.amount;
        portfolio.diversification.byRiskLevel[riskLevel] = 
          (portfolio.diversification.byRiskLevel[riskLevel] || 0) + investment.transaction.amount;
      }
    }

    // Calculate return percentage
    portfolio.summary.returnPercentage = portfolio.summary.totalInvested > 0 
      ? (portfolio.summary.totalReturn / portfolio.summary.totalInvested) * 100 
      : 0;

    // Best and worst performing investments
    portfolio.performance.bestPerforming = investments
      .filter(inv => inv.performance?.totalReturn > 0)
      .sort((a, b) => (b.performance?.totalReturn || 0) - (a.performance?.totalReturn || 0))
      .slice(0, 5);

    portfolio.performance.worstPerforming = investments
      .filter(inv => (inv.performance?.totalReturn || 0) < 0)
      .sort((a, b) => (a.performance?.totalReturn || 0) - (b.performance?.totalReturn || 0))
      .slice(0, 5);

    // Recent activity
    portfolio.performance.recentActivity = investments
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);

    res.json({
      success: true,
      portfolio: portfolio,
      timeRange: timeRange,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching portfolio performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance'
    });
  }
});

/**
 * 🔍 SEARCH BUSINESSES
 * Advanced search for businesses with AI-powered suggestions
 */
router.get('/search', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;
    const { 
      q, // search query
      filters = {},
      suggestions = true,
      limit = 20 
    } = req.query;

    let results = [];

    if (q) {
      // Perform text search across business names and descriptions
      const businessesQuery = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .where('status.isPublished', '==', true)
        .where('status.isActive', '==', true)
        .get();

      const searchTerm = q.toLowerCase();
      
      businessesQuery.forEach(doc => {
        const business = doc.data();
        const businessName = business.basicInfo?.businessName?.toLowerCase() || '';
        const description = business.basicInfo?.description?.toLowerCase() || '';
        
        if (businessName.includes(searchTerm) || description.includes(searchTerm)) {
          results.push({
            id: doc.id,
            ...business,
            matchType: businessName.includes(searchTerm) ? 'name' : 'description'
          });
        }
      });

      // Sort by relevance (name matches first)
      results.sort((a, b) => {
        if (a.matchType === 'name' && b.matchType !== 'name') return -1;
        if (a.matchType !== 'name' && b.matchType === 'name') return 1;
        return 0;
      });
    }

    // Add AI suggestions if requested
    let aiSuggestions = [];
    if (suggestions && req.user.subscription?.plan !== 'basic') {
      try {
        const suggestionsResult = await AIMatchmakingEngine.findBusinessMatches(investorId, {
          limit: 5,
          minScore: 70
        });
        
        if (suggestionsResult.success) {
          aiSuggestions = suggestionsResult.matches;
        }
      } catch (error) {
        logger.warn('AI suggestions failed:', error);
      }
    }

    res.json({
      success: true,
      results: results.slice(0, parseInt(limit)),
      suggestions: aiSuggestions,
      searchQuery: q,
      totalFound: results.length
    });

  } catch (error) {
    logger.error('Error searching businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search businesses'
    });
  }
});

/**
 * 💫 GET TRENDING OPPORTUNITIES
 * Currently trending investment opportunities
 */
router.get('/trending', requireUserType('investor'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get businesses with recent high interest (views, applications, etc.)
    const trendingQuery = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('status.isPublished', '==', true)
      .where('status.isActive', '==', true)
      .orderBy('analytics.profileViews', 'desc')
      .limit(parseInt(limit))
      .get();

    const trending = [];

    trendingQuery.forEach(doc => {
      const business = doc.data();
      trending.push({
        id: doc.id,
        ...business,
        trendingScore: business.analytics?.profileViews || 0,
        recentGrowth: calculateRecentGrowth(business.analytics)
      });
    });

    res.json({
      success: true,
      trending: trending,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching trending opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending opportunities'
    });
  }
});

/**
 * 🔔 GET INVESTMENT ALERTS
 * Personalized investment alerts and notifications
 */
router.get('/alerts', requireUserType('investor'), async (req, res) => {
  try {
    const investorId = req.user.uid;

    // Get investor preferences
    const investorDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(investorId)
      .get();

    const preferences = investorDoc.exists 
      ? investorDoc.data().investorProfile?.preferences 
      : null;

    const alerts = [];

    if (preferences) {
      // Find new opportunities matching preferences
      let query = FirebaseAdmin.adminFirestore
        .collection('businesses')
        .where('status.isPublished', '==', true)
        .where('status.isActive', '==', true)
        .where('metadata.createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days

      const newOpportunities = await query.get();

      newOpportunities.forEach(doc => {
        const business = doc.data();
        
        // Check if matches preferences
        const matchesPreferences = checkBusinessMatchesPreferences(business, preferences);
        
        if (matchesPreferences.score > 70) {
          alerts.push({
            type: 'new_opportunity',
            title: 'New Matching Opportunity',
            message: `${business.basicInfo?.businessName} matches your investment criteria`,
            businessId: doc.id,
            business: {
              name: business.basicInfo?.businessName,
              sector: business.industry?.primarySector,
              country: business.location?.country
            },
            matchScore: matchesPreferences.score,
            createdAt: business.metadata?.createdAt,
            priority: matchesPreferences.score > 85 ? 'high' : 'medium'
          });
        }
      });
    }

    // Add performance alerts for existing investments
    const investmentsQuery = await FirebaseAdmin.adminFirestore
      .collection('investments')
      .where('investorId', '==', investorId)
      .where('status', '==', 'active')
      .get();

    investmentsQuery.forEach(doc => {
      const investment = doc.data();
      const performance = investment.performance || {};
      
      // Significant performance changes
      if (performance.totalReturn && Math.abs(performance.totalReturn) > investment.transaction.amount * 0.1) {
        alerts.push({
          type: 'performance_alert',
          title: performance.totalReturn > 0 ? 'Investment Gaining' : 'Investment Declining',
          message: `Your investment in ${investment.businessName} has ${performance.totalReturn > 0 ? 'gained' : 'lost'} ${Math.abs(performance.totalReturn).toFixed(2)}`,
          investmentId: doc.id,
          change: performance.totalReturn,
          changePercentage: (performance.totalReturn / investment.transaction.amount) * 100,
          priority: Math.abs(performance.totalReturn) > investment.transaction.amount * 0.2 ? 'high' : 'medium',
          createdAt: new Date()
        });
      }
    });

    // Sort alerts by priority and date
    alerts.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      alerts: alerts.slice(0, 20), // Limit to 20 most important alerts
      totalAlerts: alerts.length,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching investment alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment alerts'
    });
  }
});

// Helper function to calculate compatibility score
async function calculateCompatibilityScore(business, preferences) {
  let score = 0;
  let factors = 0;

  // Sector preference
  if (preferences.sectors?.preferred?.length > 0) {
    factors++;
    if (preferences.sectors.preferred.includes(business.industry?.primarySector)) {
      score += 25;
    }
  }

  // Country preference
  if (preferences.geographic?.preferredCountries?.length > 0) {
    factors++;
    if (preferences.geographic.preferredCountries.includes(business.location?.country)) {
      score += 20;
    }
  }

  // Investment range
  const minInvestment = business.investment?.currentRound?.minimumInvestment || 0;
  const maxInvestment = business.investment?.currentRound?.maximumInvestment || Infinity;
  
  if (minInvestment >= preferences.investment?.minInvestment && 
      maxInvestment <= preferences.investment?.maxInvestment) {
    score += 15;
  }
  factors++;

  // ESG score
  if (business.scores?.esgScore >= preferences.esg?.minimumScore) {
    score += 20;
  }
  factors++;

  // Risk tolerance
  const businessRisk = business.scores?.riskLevel || 'medium';
  const riskCompatibility = {
    'low': { 'low': 20, 'medium': 10, 'high': 0 },
    'medium': { 'low': 15, 'medium': 20, 'high': 15 },
    'high': { 'low': 5, 'medium': 15, 'high': 20 }
  };
  
  score += riskCompatibility[preferences.investment?.riskTolerance]?.[businessRisk] || 10;
  factors++;

  return factors > 0 ? Math.round(score / factors * 4) : 0; // Scale to 0-100
}

// Helper function to check if business matches preferences
function checkBusinessMatchesPreferences(business, preferences) {
  const score = calculateCompatibilityScore(business, preferences);
  return { score, matches: score > 50 };
}

// Helper function to calculate recent growth
function calculateRecentGrowth(analytics) {
  // This would calculate growth metrics based on analytics data
  return {
    viewGrowth: 12.5,
    interestGrowth: 8.3,
    period: '7d'
  };
}

module.exports = router;