// 🚀 BVESTER - AI MATCHING API ROUTES
// Advanced AI-powered investor-business matching system

const express = require('express');
const router = express.Router();
const { requireUserType, requireSubscription, requireVerification } = require('../../middleware/authMiddleware');
const AIMatchmakingEngine = require('../../algorithms/ai-matchmaking');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 🎯 FIND INVESTOR MATCHES
 * Find matching investors for a business
 */
router.get('/investors/:businessId', 
  requireUserType(['business', 'admin']),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const businessId = req.params.businessId;
      const { 
        limit = 10, 
        minScore = 60, 
        includeContacted = false,
        sortBy = 'score' // 'score', 'activity', 'investment_amount'
      } = req.query;

      // Verify business ownership
      if (req.user.userType === 'business') {
        const businessDoc = await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(businessId)
          .get();

        if (!businessDoc.exists || businessDoc.data().ownerId !== req.user.uid) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only find matches for your own business.'
          });
        }
      }

      const matchResult = await AIMatchmakingEngine.findInvestorMatches(businessId, {
        limit: parseInt(limit),
        minScore: parseInt(minScore),
        includeContacted: includeContacted === 'true',
        sortBy: sortBy
      });

      if (matchResult.success) {
        // Log matching request
        await FirebaseAdmin.adminFirestore
          .collection('activityLogs')
          .add({
            userId: req.user.uid,
            action: 'investor_matching_requested',
            resource: { type: 'business', id: businessId },
            details: { 
              matchesFound: matchResult.matches.length,
              minScore: minScore
            },
            timestamp: new Date()
          });

        res.json({
          success: true,
          matches: matchResult.matches,
          totalFound: matchResult.totalFound,
          algorithm: {
            version: matchResult.algorithmVersion,
            factors: matchResult.matchingFactors
          },
          recommendations: generateMatchingRecommendations(matchResult.matches),
          generatedAt: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: matchResult.error
        });
      }

    } catch (error) {
      logger.error('Error finding investor matches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find investor matches'
      });
    }
  }
);

/**
 * 🏢 FIND BUSINESS MATCHES
 * Find matching businesses for an investor
 */
router.get('/businesses/:investorId?', 
  requireUserType(['investor', 'admin']),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const investorId = req.params.investorId || req.user.uid;
      const { 
        limit = 10, 
        minScore = 60,
        excludeInvested = true,
        sectors,
        countries,
        riskLevel,
        sortBy = 'score'
      } = req.query;

      // Verify investor access
      if (req.user.userType === 'investor' && investorId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only find matches for your own profile.'
        });
      }

      // Parse array parameters
      const sectorFilter = sectors ? sectors.split(',') : null;
      const countryFilter = countries ? countries.split(',') : null;

      const matchResult = await AIMatchmakingEngine.findBusinessMatches(investorId, {
        limit: parseInt(limit),
        minScore: parseInt(minScore),
        excludeInvested: excludeInvested === 'true',
        sectors: sectorFilter,
        countries: countryFilter,
        riskLevel: riskLevel,
        sortBy: sortBy
      });

      if (matchResult.success) {
        // Log matching request
        await FirebaseAdmin.adminFirestore
          .collection('activityLogs')
          .add({
            userId: req.user.uid,
            action: 'business_matching_requested',
            resource: { type: 'investor', id: investorId },
            details: { 
              matchesFound: matchResult.matches.length,
              minScore: minScore,
              filters: { sectors: sectorFilter, countries: countryFilter, riskLevel }
            },
            timestamp: new Date()
          });

        res.json({
          success: true,
          matches: matchResult.matches,
          totalFound: matchResult.totalFound,
          algorithm: {
            version: matchResult.algorithmVersion,
            factors: matchResult.matchingFactors
          },
          recommendations: generateBusinessMatchingRecommendations(matchResult.matches),
          generatedAt: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: matchResult.error
        });
      }

    } catch (error) {
      logger.error('Error finding business matches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find business matches'
      });
    }
  }
);

/**
 * 📊 GET MATCHING COMPATIBILITY
 * Get detailed compatibility analysis between investor and business
 */
router.get('/compatibility/:investorId/:businessId', 
  requireVerification,
  async (req, res) => {
    try {
      const { investorId, businessId } = req.params;
      const { detailed = false } = req.query;

      // Check access permissions
      const hasAccess = req.user.uid === investorId || 
                       req.user.userType === 'admin' ||
                       (req.user.userType === 'business' && await isBusinessOwner(req.user.uid, businessId));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const compatibilityResult = await AIMatchmakingEngine.calculateCompatibility(
        investorId, 
        businessId, 
        { detailed: detailed === 'true' }
      );

      if (compatibilityResult.success) {
        res.json({
          success: true,
          compatibility: compatibilityResult.compatibility,
          recommendations: compatibilityResult.recommendations,
          riskAssessment: compatibilityResult.riskAssessment,
          potentialConcerns: compatibilityResult.concerns,
          generatedAt: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: compatibilityResult.error
        });
      }

    } catch (error) {
      logger.error('Error calculating compatibility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate compatibility'
      });
    }
  }
);

/**
 * 🔍 ADVANCED MATCHING SEARCH
 * Advanced search with multiple criteria and AI suggestions
 */
router.post('/search', 
  requireVerification,
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const {
        userType, // 'investor' or 'business'
        criteria,
        weights = {},
        excludeIds = [],
        limit = 20,
        includeAISuggestions = true
      } = req.body;

      if (!userType || !criteria) {
        return res.status(400).json({
          success: false,
          error: 'userType and criteria are required'
        });
      }

      // Validate user can perform this search
      const canSearch = req.user.userType === userType || 
                       req.user.userType === 'admin';

      if (!canSearch) {
        return res.status(403).json({
          success: false,
          error: 'Access denied for this search type'
        });
      }

      let searchResult;

      if (userType === 'investor') {
        // Search for businesses matching investor criteria
        searchResult = await AIMatchmakingEngine.advancedBusinessSearch(req.user.uid, {
          criteria,
          weights,
          excludeIds,
          limit: parseInt(limit),
          includeAISuggestions
        });
      } else {
        // Search for investors matching business criteria
        searchResult = await AIMatchmakingEngine.advancedInvestorSearch(req.user.uid, {
          criteria,
          weights,
          excludeIds,
          limit: parseInt(limit),
          includeAISuggestions
        });
      }

      if (searchResult.success) {
        // Log advanced search
        await FirebaseAdmin.adminFirestore
          .collection('activityLogs')
          .add({
            userId: req.user.uid,
            action: 'advanced_matching_search',
            resource: { type: 'matching', id: req.user.uid },
            details: { 
              searchType: userType,
              resultsFound: searchResult.results.length,
              criteria: Object.keys(criteria)
            },
            timestamp: new Date()
          });

        res.json({
          success: true,
          results: searchResult.results,
          aiSuggestions: searchResult.aiSuggestions,
          searchMetadata: {
            totalFound: searchResult.totalFound,
            searchTime: searchResult.searchTime,
            criteriaUsed: criteria,
            weightsApplied: weights
          },
          generatedAt: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: searchResult.error
        });
      }

    } catch (error) {
      logger.error('Error performing advanced matching search:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform advanced matching search'
      });
    }
  }
);

/**
 * 📈 GET MATCHING ANALYTICS
 * Analytics on matching performance and success rates
 */
router.get('/analytics/:userId?', 
  async (req, res) => {
    try {
      const userId = req.params.userId || req.user.uid;
      const { timeRange = '30d' } = req.query;

      // Check access permissions
      if (userId !== req.user.uid && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get matching activities
      const activitiesQuery = await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .where('userId', '==', userId)
        .where('action', 'in', ['investor_matching_requested', 'business_matching_requested', 'advanced_matching_search'])
        .where('timestamp', '>=', startDate)
        .get();

      // Get user profile for context
      const userDoc = await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.data();
      const userType = userData?.userType;

      const analytics = {
        summary: {
          totalSearches: 0,
          averageMatches: 0,
          bestMatchScore: 0,
          successfulConnections: 0,
          responseRate: 0
        },
        trends: {
          searchFrequency: {},
          matchQuality: {},
          popularCriteria: {}
        },
        recommendations: []
      };

      let totalMatches = 0;
      let maxScore = 0;

      activitiesQuery.forEach(doc => {
        const activity = doc.data();
        analytics.summary.totalSearches++;
        
        const matchesFound = activity.details?.matchesFound || 0;
        totalMatches += matchesFound;
        
        const minScore = activity.details?.minScore || 0;
        if (minScore > maxScore) {
          maxScore = minScore;
        }

        // Track monthly trends
        const monthKey = activity.timestamp.toDate().toISOString().substring(0, 7);
        analytics.trends.searchFrequency[monthKey] = (analytics.trends.searchFrequency[monthKey] || 0) + 1;
      });

      analytics.summary.averageMatches = analytics.summary.totalSearches > 0 
        ? totalMatches / analytics.summary.totalSearches 
        : 0;
      analytics.summary.bestMatchScore = maxScore;

      // Get successful connections (investments made)
      if (userType === 'investor') {
        const investmentsQuery = await FirebaseAdmin.adminFirestore
          .collection('investments')
          .where('investorId', '==', userId)
          .where('createdAt', '>=', startDate)
          .get();

        analytics.summary.successfulConnections = investmentsQuery.size;
      }

      // Generate recommendations based on user activity
      analytics.recommendations = generateMatchingAnalyticsRecommendations(
        analytics.summary, 
        userType, 
        userData
      );

      res.json({
        success: true,
        analytics: analytics,
        userType: userType,
        timeRange: timeRange,
        generatedAt: new Date()
      });

    } catch (error) {
      logger.error('Error fetching matching analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch matching analytics'
      });
    }
  }
);

/**
 * 💡 GET MATCHING SUGGESTIONS
 * AI-powered suggestions to improve matching success
 */
router.get('/suggestions', 
  requireVerification,
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const userType = req.user.userType;

      // Get user profile
      const userDoc = await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }

      const userData = userDoc.data();

      // Generate personalized suggestions
      const suggestions = await generateMatchingSuggestions(userId, userType, userData);

      res.json({
        success: true,
        suggestions: suggestions,
        userType: userType,
        generatedAt: new Date()
      });

    } catch (error) {
      logger.error('Error generating matching suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate matching suggestions'
      });
    }
  }
);

/**
 * 🔄 REFRESH MATCHES
 * Refresh and update cached matches for better performance
 */
router.post('/refresh/:userId?', 
  async (req, res) => {
    try {
      const userId = req.params.userId || req.user.uid;
      const { forceRefresh = false } = req.body;

      // Check access permissions
      if (userId !== req.user.uid && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if refresh is needed (avoid too frequent refreshes)
      const lastRefreshKey = `last_refresh_${userId}`;
      const lastRefresh = await getLastRefreshTime(lastRefreshKey);
      const now = new Date();
      const timeSinceRefresh = now - lastRefresh;
      const minRefreshInterval = 5 * 60 * 1000; // 5 minutes

      if (!forceRefresh && timeSinceRefresh < minRefreshInterval) {
        return res.status(429).json({
          success: false,
          error: 'Refresh rate limited. Please wait before refreshing again.',
          nextRefreshAvailable: new Date(lastRefresh.getTime() + minRefreshInterval)
        });
      }

      // Perform refresh based on user type
      const userDoc = await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.data();
      const userType = userData?.userType;

      let refreshResult;

      if (userType === 'investor') {
        refreshResult = await AIMatchmakingEngine.refreshInvestorMatches(userId);
      } else if (userType === 'business') {
        refreshResult = await AIMatchmakingEngine.refreshBusinessMatches(userId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid user type for match refresh'
        });
      }

      // Update last refresh time
      await setLastRefreshTime(lastRefreshKey, now);

      // Log refresh activity
      await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .add({
          userId: userId,
          action: 'matches_refreshed',
          resource: { type: 'matching', id: userId },
          details: { 
            userType: userType,
            newMatches: refreshResult.newMatches,
            updatedMatches: refreshResult.updatedMatches
          },
          timestamp: new Date()
        });

      res.json({
        success: true,
        refreshResult: refreshResult,
        nextRefreshAvailable: new Date(now.getTime() + minRefreshInterval),
        message: 'Matches refreshed successfully'
      });

    } catch (error) {
      logger.error('Error refreshing matches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh matches'
      });
    }
  }
);

// Helper function to check business ownership
async function isBusinessOwner(userId, businessId) {
  try {
    const businessDoc = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .doc(businessId)
      .get();
    
    return businessDoc.exists && businessDoc.data().ownerId === userId;
  } catch (error) {
    return false;
  }
}

// Helper function to generate matching recommendations
function generateMatchingRecommendations(matches) {
  const recommendations = [];

  if (matches.length === 0) {
    recommendations.push({
      type: 'no_matches',
      title: 'No matches found',
      message: 'Consider adjusting your criteria or improving your business profile',
      actions: ['Lower minimum score', 'Update business information', 'Add more details to profile']
    });
  } else if (matches.length < 3) {
    recommendations.push({
      type: 'few_matches',
      title: 'Limited matches found',
      message: 'Expand your search criteria to find more potential investors',
      actions: ['Broaden geographic preferences', 'Consider different investor types', 'Lower score threshold']
    });
  } else {
    const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
    
    if (avgScore > 80) {
      recommendations.push({
        type: 'high_quality',
        title: 'Excellent matches found',
        message: 'You have high-quality investor matches. Consider reaching out soon.',
        actions: ['Send personalized outreach messages', 'Prepare detailed business presentation', 'Schedule investor meetings']
      });
    }
  }

  return recommendations;
}

// Helper function to generate business matching recommendations
function generateBusinessMatchingRecommendations(matches) {
  const recommendations = [];

  if (matches.length === 0) {
    recommendations.push({
      type: 'no_matches',
      title: 'No business matches found',
      message: 'Consider updating your investment preferences or criteria',
      actions: ['Broaden sector preferences', 'Adjust risk tolerance', 'Review geographic restrictions']
    });
  } else {
    const sectors = [...new Set(matches.map(m => m.business?.industry?.primarySector).filter(Boolean))];
    
    if (sectors.length === 1) {
      recommendations.push({
        type: 'diversification',
        title: 'Consider diversification',
        message: `All matches are in ${sectors[0]}. Consider diversifying across sectors.`,
        actions: ['Expand sector preferences', 'Look at other industries', 'Balance your portfolio']
      });
    }

    const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
    
    if (avgScore > 85) {
      recommendations.push({
        type: 'strong_matches',
        title: 'Strong investment opportunities found',
        message: 'These businesses align well with your preferences. Consider due diligence.',
        actions: ['Review detailed business profiles', 'Analyze financial health scores', 'Contact business owners']
      });
    }
  }

  return recommendations;
}

// Helper function to generate matching analytics recommendations
function generateMatchingAnalyticsRecommendations(summary, userType, userData) {
  const recommendations = [];

  if (summary.totalSearches === 0) {
    recommendations.push({
      type: 'get_started',
      title: 'Start using AI matching',
      message: 'Use our AI matching system to find compatible partners',
      priority: 'high'
    });
  } else if (summary.averageMatches < 5) {
    recommendations.push({
      type: 'improve_profile',
      title: 'Enhance your profile',
      message: 'A more complete profile leads to better matches',
      priority: 'medium'
    });
  }

  if (userType === 'investor' && summary.successfulConnections === 0) {
    recommendations.push({
      type: 'take_action',
      title: 'Convert matches to investments',
      message: 'You have good matches but haven\'t invested yet. Consider taking action.',
      priority: 'medium'
    });
  }

  return recommendations;
}

// Helper function to generate matching suggestions
async function generateMatchingSuggestions(userId, userType, userData) {
  const suggestions = [];

  // Profile completeness suggestions
  if (userType === 'investor') {
    const preferences = userData.investorProfile?.preferences;
    
    if (!preferences?.sectors?.preferred?.length) {
      suggestions.push({
        type: 'profile_improvement',
        category: 'preferences',
        title: 'Set sector preferences',
        description: 'Define your preferred investment sectors for better matches',
        impact: 'high',
        action: 'update_preferences'
      });
    }

    if (!preferences?.geographic?.preferredCountries?.length) {
      suggestions.push({
        type: 'profile_improvement',
        category: 'preferences',
        title: 'Set geographic preferences',
        description: 'Specify your preferred investment regions',
        impact: 'medium',
        action: 'update_preferences'
      });
    }
  }

  // Behavioral suggestions based on activity
  const recentActivities = await FirebaseAdmin.adminFirestore
    .collection('activityLogs')
    .where('userId', '==', userId)
    .where('action', 'in', ['investor_matching_requested', 'business_matching_requested'])
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  if (recentActivities.size === 0) {
    suggestions.push({
      type: 'behavioral',
      category: 'engagement',
      title: 'Try AI matching',
      description: 'Use our AI matching system to find compatible partners',
      impact: 'high',
      action: 'start_matching'
    });
  }

  return suggestions;
}

// Helper functions for refresh rate limiting
async function getLastRefreshTime(key) {
  // This would typically use Redis or similar caching system
  // For now, return a default time
  return new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
}

async function setLastRefreshTime(key, time) {
  // This would typically store in Redis or similar caching system
  // For now, just log the action
  logger.info(`Refresh time updated for ${key}: ${time}`);
}

module.exports = router;