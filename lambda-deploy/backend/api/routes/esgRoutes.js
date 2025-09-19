// 🚀 BVESTER - ESG API ROUTES
// Environmental, Social, and Governance scoring and analytics

const express = require('express');
const router = express.Router();
const { requireUserType, requireSubscription, requireOwnership, requireAdmin } = require('../../middleware/authMiddleware');
const ESGScoringEngine = require('../../algorithms/esg-scoring');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 🌱 CALCULATE ESG SCORE
 * Calculate ESG score for a business
 */
router.post('/calculate/:businessId', 
  requireOwnership('business', 'businessId'),
  requireSubscription(['professional', 'enterprise']),
  async (req, res) => {
    try {
      const businessId = req.params.businessId;
      const { esgData } = req.body;

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
        ...businessDoc.data(),
        // Merge with provided ESG data if any
        ...(esgData && { esgAssessment: esgData })
      };

      // Calculate ESG score using the algorithm
      const result = await ESGScoringEngine.calculateESGScore(businessData);

      if (result.success) {
        // Update business document with new ESG score
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(businessId)
          .update({
            'scores.esgScore': result.esgScore.overallScore,
            'scores.esgBreakdown': result.esgScore.breakdown,
            'scores.esgLastCalculated': new Date(),
            'esgAssessment': result.esgScore.assessment,
            'metadata.updatedAt': new Date()
          });

        // Log ESG calculation
        await FirebaseAdmin.adminFirestore
          .collection('activityLogs')
          .add({
            userId: req.user.uid,
            action: 'esg_calculated',
            resource: { type: 'business', id: businessId },
            details: { score: result.esgScore.overallScore },
            timestamp: new Date()
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
 * 📊 GET ESG SCORE DETAILS
 * Get detailed ESG score breakdown for a business
 */
router.get('/score/:businessId', async (req, res) => {
  try {
    const businessId = req.params.businessId;

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

    // Check if ESG score exists
    if (!businessData.scores?.esgScore) {
      return res.status(404).json({
        success: false,
        error: 'ESG score not found for this business',
        suggestion: 'Calculate ESG score first using POST /esg/calculate/:businessId'
      });
    }

    // Check access permissions for detailed breakdown
    const canViewDetails = req.user && (
      req.user.uid === businessData.ownerId ||
      req.user.userType === 'admin' ||
      (req.user.userType === 'investor' && req.user.subscription?.plan !== 'basic')
    );

    const esgDetails = {
      businessId: businessId,
      businessName: businessData.basicInfo?.businessName,
      overallScore: businessData.scores.esgScore,
      lastCalculated: businessData.scores.esgLastCalculated,
      breakdown: canViewDetails ? businessData.scores.esgBreakdown : null,
      assessment: canViewDetails ? businessData.esgAssessment : null,
      industry: businessData.industry?.primarySector,
      country: businessData.location?.country
    };

    if (!canViewDetails) {
      esgDetails.message = 'Upgrade to Professional or Enterprise plan for detailed ESG breakdown';
    }

    res.json({
      success: true,
      esgDetails: esgDetails
    });

  } catch (error) {
    logger.error('Error fetching ESG score details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESG score details'
    });
  }
});

/**
 * 🏆 GET ESG LEADERBOARD
 * Top performing businesses by ESG score
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { 
      limit = 20, 
      country, 
      sector, 
      minScore = 0,
      category = 'overall' // 'overall', 'environmental', 'social', 'governance'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('status.isPublished', '==', true)
      .where('status.isActive', '==', true)
      .where('scores.esgScore', '>', minScore);

    // Apply filters
    if (country) {
      query = query.where('location.country', '==', country);
    }

    if (sector) {
      query = query.where('industry.primarySector', '==', sector);
    }

    // Order by ESG score
    query = query.orderBy('scores.esgScore', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();
    const leaderboard = [];

    snapshot.forEach((doc, index) => {
      const business = doc.data();
      const esgBreakdown = business.scores?.esgBreakdown || {};

      let displayScore = business.scores?.esgScore || 0;
      
      // Show category-specific score if requested
      if (category !== 'overall' && esgBreakdown[category]) {
        displayScore = esgBreakdown[category].score;
      }

      leaderboard.push({
        rank: index + 1,
        businessId: doc.id,
        businessName: business.basicInfo?.businessName,
        logo: business.basicInfo?.logo,
        sector: business.industry?.primarySector,
        country: business.location?.country,
        esgScore: displayScore,
        overallScore: business.scores?.esgScore,
        breakdown: req.user?.subscription?.plan !== 'basic' ? esgBreakdown : null,
        lastCalculated: business.scores?.esgLastCalculated,
        improvement: calculateESGImprovement(business.esgHistory)
      });
    });

    res.json({
      success: true,
      leaderboard: leaderboard,
      filters: { country, sector, minScore, category },
      totalFound: leaderboard.length,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching ESG leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESG leaderboard'
    });
  }
});

/**
 * 📈 GET ESG ANALYTICS
 * Platform-wide ESG analytics and insights
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Get all businesses with ESG scores
    const businessesQuery = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('scores.esgScore', '>', 0)
      .get();

    const analytics = {
      summary: {
        totalBusinessesScored: 0,
        averageESGScore: 0,
        averageEnvironmentalScore: 0,
        averageSocialScore: 0,
        averageGovernanceScore: 0,
        highPerformers: 0, // Score >= 80
        mediumPerformers: 0, // Score 50-79
        lowPerformers: 0 // Score < 50
      },
      distribution: {
        byScore: {
          'excellent': 0, // 80-100
          'good': 0, // 60-79
          'average': 0, // 40-59
          'poor': 0 // 0-39
        },
        bySector: {},
        byCountry: {}
      },
      trends: {
        improvementRate: 0,
        mostImprovedSectors: [],
        sdgAlignment: {}
      },
      topPerformers: {
        overall: [],
        environmental: [],
        social: [],
        governance: []
      }
    };

    let totalScore = 0;
    let totalEnvScore = 0;
    let totalSocialScore = 0;
    let totalGovScore = 0;
    const businessPerformance = [];

    businessesQuery.forEach(doc => {
      const business = doc.data();
      const esgScore = business.scores?.esgScore || 0;
      const breakdown = business.scores?.esgBreakdown || {};

      analytics.summary.totalBusinessesScored++;
      totalScore += esgScore;

      if (breakdown.environmental) totalEnvScore += breakdown.environmental.score;
      if (breakdown.social) totalSocialScore += breakdown.social.score;
      if (breakdown.governance) totalGovScore += breakdown.governance.score;

      // Score distribution
      if (esgScore >= 80) {
        analytics.summary.highPerformers++;
        analytics.distribution.byScore.excellent++;
      } else if (esgScore >= 60) {
        analytics.summary.mediumPerformers++;
        analytics.distribution.byScore.good++;
      } else if (esgScore >= 40) {
        analytics.distribution.byScore.average++;
      } else {
        analytics.summary.lowPerformers++;
        analytics.distribution.byScore.poor++;
      }

      // Sector distribution
      const sector = business.industry?.primarySector || 'Unknown';
      if (!analytics.distribution.bySector[sector]) {
        analytics.distribution.bySector[sector] = {
          count: 0,
          averageScore: 0,
          totalScore: 0
        };
      }
      analytics.distribution.bySector[sector].count++;
      analytics.distribution.bySector[sector].totalScore += esgScore;

      // Country distribution
      const country = business.location?.country || 'Unknown';
      if (!analytics.distribution.byCountry[country]) {
        analytics.distribution.byCountry[country] = {
          count: 0,
          averageScore: 0,
          totalScore: 0
        };
      }
      analytics.distribution.byCountry[country].count++;
      analytics.distribution.byCountry[country].totalScore += esgScore;

      // Collect for top performers
      businessPerformance.push({
        id: doc.id,
        name: business.basicInfo?.businessName,
        sector: sector,
        country: country,
        overallScore: esgScore,
        environmentalScore: breakdown.environmental?.score || 0,
        socialScore: breakdown.social?.score || 0,
        governanceScore: breakdown.governance?.score || 0
      });
    });

    // Calculate averages
    const count = analytics.summary.totalBusinessesScored;
    if (count > 0) {
      analytics.summary.averageESGScore = totalScore / count;
      analytics.summary.averageEnvironmentalScore = totalEnvScore / count;
      analytics.summary.averageSocialScore = totalSocialScore / count;
      analytics.summary.averageGovernanceScore = totalGovScore / count;
    }

    // Calculate sector averages
    Object.keys(analytics.distribution.bySector).forEach(sector => {
      const data = analytics.distribution.bySector[sector];
      data.averageScore = data.totalScore / data.count;
    });

    // Calculate country averages
    Object.keys(analytics.distribution.byCountry).forEach(country => {
      const data = analytics.distribution.byCountry[country];
      data.averageScore = data.totalScore / data.count;
    });

    // Top performers by category
    analytics.topPerformers.overall = businessPerformance
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);

    analytics.topPerformers.environmental = businessPerformance
      .filter(b => b.environmentalScore > 0)
      .sort((a, b) => b.environmentalScore - a.environmentalScore)
      .slice(0, 10);

    analytics.topPerformers.social = businessPerformance
      .filter(b => b.socialScore > 0)
      .sort((a, b) => b.socialScore - a.socialScore)
      .slice(0, 10);

    analytics.topPerformers.governance = businessPerformance
      .filter(b => b.governanceScore > 0)
      .sort((a, b) => b.governanceScore - a.governanceScore)
      .slice(0, 10);

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching ESG analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESG analytics'
    });
  }
});

/**
 * 🎯 GET SDG ALIGNMENT
 * UN Sustainable Development Goals alignment analysis
 */
router.get('/sdg-alignment/:businessId?', async (req, res) => {
  try {
    const businessId = req.params.businessId;
    
    if (businessId) {
      // Get SDG alignment for specific business
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
      const esgAssessment = businessData.esgAssessment || {};

      // Calculate SDG alignment from ESG assessment
      const sdgAlignment = calculateSDGAlignment(esgAssessment, businessData);

      res.json({
        success: true,
        businessId: businessId,
        businessName: businessData.basicInfo?.businessName,
        sdgAlignment: sdgAlignment,
        overallAlignment: calculateOverallSDGAlignment(sdgAlignment)
      });

    } else {
      // Get platform-wide SDG alignment statistics
      const businessesQuery = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .where('scores.esgScore', '>', 0)
        .get();

      const sdgStats = {};
      const sdgGoals = [
        'No Poverty', 'Zero Hunger', 'Good Health and Well-being', 'Quality Education',
        'Gender Equality', 'Clean Water and Sanitation', 'Affordable and Clean Energy',
        'Decent Work and Economic Growth', 'Industry, Innovation and Infrastructure',
        'Reduced Inequality', 'Sustainable Cities and Communities', 'Responsible Consumption',
        'Climate Action', 'Life Below Water', 'Life on Land', 'Peace and Justice',
        'Partnerships for the Goals'
      ];

      // Initialize SDG statistics
      sdgGoals.forEach((goal, index) => {
        sdgStats[index + 1] = {
          goal: goal,
          alignedBusinesses: 0,
          averageAlignment: 0,
          totalAlignment: 0,
          sectors: {}
        };
      });

      businessesQuery.forEach(doc => {
        const business = doc.data();
        const esgAssessment = business.esgAssessment || {};
        const sector = business.industry?.primarySector || 'Unknown';
        
        const alignment = calculateSDGAlignment(esgAssessment, business);
        
        Object.keys(alignment).forEach(sdgKey => {
          const sdgNumber = parseInt(sdgKey.replace('sdg', ''));
          const alignmentScore = alignment[sdgKey];
          
          if (alignmentScore > 50) {
            sdgStats[sdgNumber].alignedBusinesses++;
          }
          
          sdgStats[sdgNumber].totalAlignment += alignmentScore;
          
          if (!sdgStats[sdgNumber].sectors[sector]) {
            sdgStats[sdgNumber].sectors[sector] = {
              count: 0,
              totalAlignment: 0
            };
          }
          sdgStats[sdgNumber].sectors[sector].count++;
          sdgStats[sdgNumber].sectors[sector].totalAlignment += alignmentScore;
        });
      });

      // Calculate averages
      Object.keys(sdgStats).forEach(sdgKey => {
        const stat = sdgStats[sdgKey];
        stat.averageAlignment = businessesQuery.size > 0 ? stat.totalAlignment / businessesQuery.size : 0;
        
        Object.keys(stat.sectors).forEach(sector => {
          const sectorData = stat.sectors[sector];
          sectorData.averageAlignment = sectorData.totalAlignment / sectorData.count;
        });
      });

      res.json({
        success: true,
        platformSDGAlignment: sdgStats,
        totalBusinesses: businessesQuery.size,
        generatedAt: new Date()
      });
    }

  } catch (error) {
    logger.error('Error fetching SDG alignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SDG alignment'
    });
  }
});

/**
 * 📋 GET ESG ASSESSMENT TEMPLATE
 * Get ESG assessment questionnaire template
 */
router.get('/assessment-template', async (req, res) => {
  try {
    const { sector, country } = req.query;

    // Base ESG assessment template
    const template = {
      environmental: {
        title: 'Environmental Impact',
        description: 'Assessment of environmental practices and impact',
        questions: [
          {
            id: 'env_1',
            question: 'Does your business have an environmental policy?',
            type: 'boolean',
            weight: 10,
            category: 'policy'
          },
          {
            id: 'env_2',
            question: 'What percentage of your energy comes from renewable sources?',
            type: 'percentage',
            weight: 15,
            category: 'energy'
          },
          {
            id: 'env_3',
            question: 'Do you measure and report your carbon footprint?',
            type: 'boolean',
            weight: 12,
            category: 'emissions'
          },
          {
            id: 'env_4',
            question: 'What waste reduction initiatives do you have in place?',
            type: 'multiple_choice',
            options: ['None', 'Basic recycling', 'Comprehensive waste management', 'Zero waste policy'],
            weight: 13,
            category: 'waste'
          }
        ]
      },
      social: {
        title: 'Social Responsibility',
        description: 'Assessment of social impact and responsibility',
        questions: [
          {
            id: 'soc_1',
            question: 'What is the gender diversity in leadership positions?',
            type: 'percentage',
            weight: 15,
            category: 'diversity'
          },
          {
            id: 'soc_2',
            question: 'Do you provide employee training and development programs?',
            type: 'boolean',
            weight: 12,
            category: 'employee_development'
          },
          {
            id: 'soc_3',
            question: 'Do you have policies for employee health and safety?',
            type: 'boolean',
            weight: 14,
            category: 'health_safety'
          },
          {
            id: 'soc_4',
            question: 'How do you contribute to local community development?',
            type: 'multiple_choice',
            options: ['No contribution', 'Occasional donations', 'Regular community programs', 'Comprehensive CSR strategy'],
            weight: 11,
            category: 'community'
          }
        ]
      },
      governance: {
        title: 'Corporate Governance',
        description: 'Assessment of governance practices and transparency',
        questions: [
          {
            id: 'gov_1',
            question: 'Do you have an independent board of directors?',
            type: 'boolean',
            weight: 16,
            category: 'board_independence'
          },
          {
            id: 'gov_2',
            question: 'Do you publish annual transparency reports?',
            type: 'boolean',
            weight: 12,
            category: 'transparency'
          },
          {
            id: 'gov_3',
            question: 'Do you have anti-corruption policies and procedures?',
            type: 'boolean',
            weight: 15,
            category: 'ethics'
          },
          {
            id: 'gov_4',
            question: 'How often do you conduct compliance audits?',
            type: 'multiple_choice',
            options: ['Never', 'When required', 'Annually', 'Quarterly or more'],
            weight: 13,
            category: 'compliance'
          }
        ]
      }
    };

    // Customize template based on sector and country if needed
    if (sector) {
      template.sectorSpecific = getSectorSpecificQuestions(sector);
    }

    if (country) {
      template.countrySpecific = getCountrySpecificQuestions(country);
    }

    res.json({
      success: true,
      template: template,
      instructions: {
        scoring: 'Each question contributes to the overall ESG score based on its weight',
        completion: 'Complete all sections for accurate scoring',
        validation: 'Some answers may require supporting documentation'
      },
      customizations: {
        sector: sector || null,
        country: country || null
      }
    });

  } catch (error) {
    logger.error('Error fetching ESG assessment template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESG assessment template'
    });
  }
});

/**
 * 🔄 SUBMIT ESG ASSESSMENT
 * Submit completed ESG assessment for scoring
 */
router.post('/assessment/:businessId', 
  requireOwnership('business', 'businessId'),
  async (req, res) => {
    try {
      const businessId = req.params.businessId;
      const { assessment, documentation } = req.body;

      if (!assessment) {
        return res.status(400).json({
          success: false,
          error: 'ESG assessment data is required'
        });
      }

      // Validate assessment structure
      const requiredSections = ['environmental', 'social', 'governance'];
      const missingSections = requiredSections.filter(section => !assessment[section]);
      
      if (missingSections.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required sections: ${missingSections.join(', ')}`
        });
      }

      // Store the assessment
      await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .update({
          esgAssessment: assessment,
          esgDocumentation: documentation || {},
          'metadata.updatedAt': new Date()
        });

      // Trigger ESG score calculation
      const businessDoc = await FirebaseAdmin.adminFirestore
        .collection('businesses')
        .doc(businessId)
        .get();

      const businessData = {
        businessId: businessId,
        ...businessDoc.data()
      };

      const scoreResult = await ESGScoringEngine.calculateESGScore(businessData);

      if (scoreResult.success) {
        await FirebaseAdmin.adminFirestore
          .collection('businesses')
          .doc(businessId)
          .update({
            'scores.esgScore': scoreResult.esgScore.overallScore,
            'scores.esgBreakdown': scoreResult.esgScore.breakdown,
            'scores.esgLastCalculated': new Date()
          });
      }

      // Log assessment submission
      await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .add({
          userId: req.user.uid,
          action: 'esg_assessment_submitted',
          resource: { type: 'business', id: businessId },
          details: { 
            score: scoreResult.success ? scoreResult.esgScore.overallScore : null 
          },
          timestamp: new Date()
        });

      res.json({
        success: true,
        message: 'ESG assessment submitted successfully',
        esgScore: scoreResult.success ? scoreResult.esgScore : null,
        nextSteps: [
          'Review your ESG score and recommendations',
          'Consider implementing suggested improvements',
          'Schedule regular reassessments to track progress'
        ]
      });

    } catch (error) {
      logger.error('Error submitting ESG assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit ESG assessment'
      });
    }
  }
);

// Helper function to calculate ESG improvement
function calculateESGImprovement(esgHistory) {
  if (!esgHistory || esgHistory.length < 2) {
    return { trend: 'no_data', change: 0 };
  }

  const latest = esgHistory[esgHistory.length - 1];
  const previous = esgHistory[esgHistory.length - 2];
  const change = latest.score - previous.score;

  return {
    trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
    change: Math.round(change * 10) / 10,
    period: `${previous.date} to ${latest.date}`
  };
}

// Helper function to calculate SDG alignment
function calculateSDGAlignment(esgAssessment, businessData) {
  // This would implement SDG alignment calculation based on ESG assessment
  // For now, return example alignment scores
  return {
    sdg1: 65, sdg2: 45, sdg3: 78, sdg4: 56, sdg5: 72,
    sdg6: 43, sdg7: 89, sdg8: 82, sdg9: 67, sdg10: 54,
    sdg11: 71, sdg12: 58, sdg13: 76, sdg14: 32, sdg15: 48,
    sdg16: 69, sdg17: 61
  };
}

// Helper function to calculate overall SDG alignment
function calculateOverallSDGAlignment(sdgAlignment) {
  const scores = Object.values(sdgAlignment);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

// Helper function to get sector-specific questions
function getSectorSpecificQuestions(sector) {
  const sectorQuestions = {
    'technology': [
      {
        id: 'tech_1',
        question: 'Do you have data privacy and security policies?',
        type: 'boolean',
        weight: 15
      }
    ],
    'agriculture': [
      {
        id: 'agri_1',
        question: 'Do you use sustainable farming practices?',
        type: 'boolean',
        weight: 20
      }
    ]
  };

  return sectorQuestions[sector.toLowerCase()] || [];
}

// Helper function to get country-specific questions
function getCountrySpecificQuestions(country) {
  // This would return country-specific ESG considerations
  return [];
}

module.exports = router;