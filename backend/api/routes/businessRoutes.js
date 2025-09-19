// 🚀 BVESTER - BUSINESS API ROUTES
// Comprehensive business management endpoints

const express = require('express');
const router = express.Router();
const { requireUserType, requireSubscription, requireOwnership } = require('../../middleware/authMiddleware');
const FinancialHealthAnalyzer = require('../../algorithms/financial-health');
const ESGScoringEngine = require('../../algorithms/esg-scoring');
const AIMatchmakingEngine = require('../../algorithms/ai-matchmaking');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 📋 GET ALL BUSINESSES
 * Public endpoint with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      country,
      sector,
      fundingStage,
      minInvestment,
      maxInvestment,
      esgMinScore,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

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

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const businesses = [];

    snapshot.forEach(doc => {
      const businessData = doc.data();
      
      // Filter by investment range if specified
      if (minInvestment || maxInvestment) {
        const minAmount = businessData.investment?.currentRound?.minimumInvestment || 0;
        const maxAmount = businessData.investment?.currentRound?.maximumInvestment || Infinity;
        
        if (minInvestment && minAmount < parseInt(minInvestment)) return;
        if (maxInvestment && maxAmount > parseInt(maxInvestment)) return;
      }

      // Filter by search term if specified
      if (search) {
        const searchTerm = search.toLowerCase();
        const businessName = businessData.basicInfo?.businessName?.toLowerCase() || '';
        const description = businessData.basicInfo?.description?.toLowerCase() || '';
        
        if (!businessName.includes(searchTerm) && !description.includes(searchTerm)) {
          return;
        }
      }

      businesses.push({
        id: doc.id,
        ...businessData
      });
    });

    res.json({
      success: true,
      businesses: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: businesses.length,
        hasMore: businesses.length === parseInt(limit)
      },
      filters: {
        country,
        sector,
        fundingStage,
        minInvestment,
        maxInvestment,
        esgMinScore,
        search
      }
    });

  } catch (error) {
    logger.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch businesses'
    });
  }
});

/**
 * 📄 GET SINGLE BUSINESS
 * Detailed business profile
 */
router.get('/:id', async (req, res) => {
  try {
    const businessId = req.params.id;
    
    const businessDoc = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .doc(businessId)
      .get();

    if (!businessDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    const businessData = businessDoc.data();

    // Check if business is published or if user is owner/admin
    if (!businessData.status?.isPublished) {
      if (!req.user || 
          (req.user.uid !== businessData.ownerId && req.user.userType !== 'admin')) {
        return res.status(403).json({
          success: false,
          error: 'Business profile is not publicly available'
        });
      }
    }

    // Increment view count if not owner
    if (req.user?.uid !== businessData.ownerId) {
      await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .update({
          'analytics.profileViews': (businessData.analytics?.profileViews || 0) + 1,
          'metadata.lastViewed': new Date()
        });
    }

    res.json({
      success: true,
      business: {
        id: businessId,
        ...businessData
      }
    });

  } catch (error) {
    logger.error('Error fetching business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business'
    });
  }
});

/**
 * ✏️ CREATE BUSINESS PROFILE
 * Requires business user type
 */
router.post('/', requireUserType(['business', 'admin']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const businessData = req.body;

    // Validate required fields
    const requiredFields = ['businessName', 'description', 'industry', 'location'];
    const missingFields = requiredFields.filter(field => !businessData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if user already has a business profile
    const existingBusinessQuery = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('ownerId', '==', userId)
      .limit(1)
      .get();

    if (!existingBusinessQuery.empty && req.user.userType !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'User already has a business profile'
      });
    }

    // Prepare business document
    const businessDoc = {
      ownerId: userId,
      basicInfo: {
        businessName: businessData.businessName,
        legalName: businessData.legalName || businessData.businessName,
        description: businessData.description,
        tagline: businessData.tagline || '',
        logo: businessData.logo || '',
        coverImage: businessData.coverImage || '',
        website: businessData.website || '',
        foundedYear: businessData.foundedYear || new Date().getFullYear(),
        employees: businessData.employees || 1,
        businessType: businessData.businessType || 'LLC'
      },
      location: {
        country: businessData.location.country,
        state: businessData.location.state || '',
        city: businessData.location.city || '',
        address: businessData.location.address || '',
        coordinates: businessData.location.coordinates || null,
        operatingRegions: businessData.location.operatingRegions || []
      },
      industry: {
        primarySector: businessData.industry.primarySector || businessData.industry,
        secondarySectors: businessData.industry.secondarySectors || [],
        businessModel: businessData.industry.businessModel || 'B2B',
        targetMarket: businessData.industry.targetMarket || '',
        competitiveAdvantage: businessData.industry.competitiveAdvantage || ''
      },
      financials: {
        annualRevenue: businessData.financials?.annualRevenue || 0,
        monthlyRevenue: businessData.financials?.monthlyRevenue || 0,
        profitMargin: businessData.financials?.profitMargin || 0,
        burnRate: businessData.financials?.burnRate || 0,
        runway: businessData.financials?.runway || 0,
        fundingStage: businessData.financials?.fundingStage || 'pre-seed',
        previousFunding: businessData.financials?.previousFunding || 0,
        currentValuation: businessData.financials?.currentValuation || 0,
        currency: businessData.financials?.currency || 'USD'
      },
      team: {
        founders: businessData.team?.founders || [],
        keyPersonnel: businessData.team?.keyPersonnel || [],
        advisors: businessData.team?.advisors || [],
        teamSize: businessData.team?.teamSize || businessData.employees || 1
      },
      scores: {
        investmentReadiness: 0,
        financialHealth: 0,
        esgScore: 0,
        riskLevel: 'medium',
        lastCalculated: null
      },
      status: {
        isActive: true,
        isPublished: false,
        isVerified: false,
        lastUpdated: new Date(),
        createdAt: new Date()
      },
      analytics: {
        profileViews: 0,
        investorInterest: 0,
        applicationsSent: 0,
        messagesReceived: 0
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      }
    };

    // Create business document
    const businessRef = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .add(businessDoc);

    // Update user profile to include business reference
    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        'businessProfile.businessId': businessRef.id,
        'businessProfile.businessName': businessData.businessName,
        'businessProfile.createdAt': new Date(),
        'metadata.updatedAt': new Date()
      });

    // Log business creation
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'business_created',
        resource: { type: 'business', id: businessRef.id },
        details: { businessName: businessData.businessName },
        timestamp: new Date()
      });

    res.status(201).json({
      success: true,
      businessId: businessRef.id,
      message: 'Business profile created successfully'
    });

  } catch (error) {
    logger.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business profile'
    });
  }
});

/**
 * 🔄 UPDATE BUSINESS PROFILE
 * Requires ownership or admin
 */
router.put('/:id', requireOwnership('business'), async (req, res) => {
  try {
    const businessId = req.params.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.ownerId;
    delete updates.status?.createdAt;
    delete updates.metadata?.createdAt;
    delete updates.scores; // Scores are calculated separately

    // Add update timestamp
    updates.metadata = {
      ...updates.metadata,
      updatedAt: new Date()
    };

    if (updates.status) {
      updates.status.lastUpdated = new Date();
    }

    await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .doc(businessId)
      .update(updates);

    res.json({
      success: true,
      message: 'Business profile updated successfully'
    });

  } catch (error) {
    logger.error('Error updating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business profile'
    });
  }
});

/**
 * 📊 CALCULATE FINANCIAL HEALTH
 * Premium feature requiring professional subscription
 */
router.post('/:id/financial-health', 
  requireOwnership('business'),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const businessId = req.params.id;
      
      // Get business data
      const businessDoc = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Business not found'
        });
      }

      const businessData = {
        businessId: businessId,
        ...businessDoc.data()
      };

      // Calculate financial health
      const result = await FinancialHealthAnalyzer.calculateFinancialHealth(businessData);

      if (result.success) {
        // Update business document with new score
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(businessId)
          .update({
            'scores.financialHealth': result.financialHealth.overallScore,
            'scores.riskLevel': result.financialHealth.riskCategory.category,
            'scores.lastCalculated': new Date(),
            'metadata.updatedAt': new Date()
          });

        res.json({
          success: true,
          financialHealth: result.financialHealth
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Error calculating financial health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate financial health'
      });
    }
  }
);

/**
 * 🌱 CALCULATE ESG SCORE
 * Premium feature requiring professional subscription
 */
router.post('/:id/esg-score',
  requireOwnership('business'),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const businessId = req.params.id;
      
      // Get business data
      const businessDoc = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Business not found'
        });
      }

      const businessData = {
        businessId: businessId,
        ...businessDoc.data()
      };

      // Calculate ESG score
      const result = await ESGScoringEngine.calculateESGScore(businessData);

      if (result.success) {
        // Update business document with new score
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(businessId)
          .update({
            'scores.esgScore': result.esgScore.overallScore,
            'scores.lastCalculated': new Date(),
            'metadata.updatedAt': new Date()
          });

        res.json({
          success: true,
          esgScore: result.esgScore
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Error calculating ESG score:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate ESG score'
      });
    }
  }
);

/**
 * 🎯 FIND MATCHING INVESTORS
 * Premium feature requiring professional subscription
 */
router.get('/:id/matching-investors',
  requireOwnership('business'),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const businessId = req.params.id;
      const { limit = 10, minScore = 50 } = req.query;

      const result = await AIMatchmakingEngine.findInvestorMatches(businessId, {
        limit: parseInt(limit),
        minScore: parseInt(minScore)
      });

      res.json(result);

    } catch (error) {
      logger.error('Error finding matching investors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find matching investors'
      });
    }
  }
);

/**
 * 📈 GET BUSINESS ANALYTICS
 * Owner or admin only
 */
router.get('/:id/analytics',
  requireOwnership('business'),
  async (req, res) => {
    try {
      const businessId = req.params.id;
      const { timeRange = '30d' } = req.query;

      // Get business analytics data
      const analytics = {
        profileViews: {
          total: 1234,
          thisMonth: 345,
          change: 12.5
        },
        investorInterest: {
          total: 67,
          thisMonth: 23,
          change: 8.3
        },
        applications: {
          total: 45,
          thisMonth: 12,
          change: -2.1
        },
        messages: {
          total: 89,
          thisMonth: 34,
          change: 15.7
        },
        topCountries: [
          { country: 'Nigeria', views: 456 },
          { country: 'Kenya', views: 234 },
          { country: 'South Africa', views: 123 }
        ],
        timeSeriesData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          profileViews: [120, 150, 180, 200, 160, 190],
          investorInterest: [12, 18, 24, 30, 25, 35]
        }
      };

      res.json({
        success: true,
        analytics: analytics,
        timeRange: timeRange,
        businessId: businessId
      });

    } catch (error) {
      logger.error('Error fetching business analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      });
    }
  }
);

/**
 * 🚀 PUBLISH BUSINESS PROFILE
 * Make business profile publicly visible
 */
router.post('/:id/publish',
  requireOwnership('business'),
  async (req, res) => {
    try {
      const businessId = req.params.id;

      // Get business data to validate completeness
      const businessDoc = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Business not found'
        });
      }

      const businessData = businessDoc.data();

      // Validate business profile completeness
      const requiredFields = [
        'basicInfo.businessName',
        'basicInfo.description',
        'location.country',
        'industry.primarySector'
      ];

      const missingFields = requiredFields.filter(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], businessData);
        return !value;
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Business profile is incomplete',
          missingFields: missingFields
        });
      }

      // Publish the business
      await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .update({
          'status.isPublished': true,
          'status.publishedAt': new Date(),
          'status.lastUpdated': new Date(),
          'metadata.updatedAt': new Date()
        });

      res.json({
        success: true,
        message: 'Business profile published successfully'
      });

    } catch (error) {
      logger.error('Error publishing business:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to publish business profile'
      });
    }
  }
);

/**
 * ❌ DELETE BUSINESS PROFILE
 * Soft delete (deactivate)
 */
router.delete('/:id',
  requireOwnership('business'),
  async (req, res) => {
    try {
      const businessId = req.params.id;

      // Soft delete - deactivate instead of removing
      await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .update({
          'status.isActive': false,
          'status.isPublished': false,
          'status.deactivatedAt': new Date(),
          'metadata.updatedAt': new Date()
        });

      res.json({
        success: true,
        message: 'Business profile deactivated successfully'
      });

    } catch (error) {
      logger.error('Error deleting business:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete business profile'
      });
    }
  }
);

module.exports = router;