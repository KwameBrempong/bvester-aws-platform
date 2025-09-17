/**
 * BVESTER PRODUCTION INVESTMENT ROUTES
 * Real money investment processing with compliance and portfolio management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { InvestmentService } = require('../investmentService');
const { PaymentProcessorService } = require('../paymentProcessor');
const { authenticateToken, requireUserType, requireVerification } = require('../../middleware/authMiddleware');
const admin = require('firebase-admin');
const winston = require('winston');

const router = express.Router();
const investmentService = new InvestmentService();
const paymentService = new PaymentProcessorService();
const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/investment-routes.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateOpportunityCreation = [
  body('investmentType').isIn(['equity', 'debt', 'revenue_share']).withMessage('Invalid investment type'),
  body('minimumAmount').isFloat({ min: 100 }).withMessage('Minimum amount must be at least $100'),
  body('maximumAmount').isFloat({ min: 1000 }).withMessage('Maximum amount must be at least $1000'),
  body('targetAmount').isFloat({ min: 1000 }).withMessage('Target amount must be at least $1000'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR']).withMessage('Unsupported currency'),
  body('endDate').isISO8601().withMessage('Invalid end date format'),
  body('riskLevel').isIn(['low', 'medium', 'high']).withMessage('Invalid risk level')
];

const validateInvestment = [
  body('opportunityId').isLength({ min: 1 }).withMessage('Opportunity ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Investment amount must be positive'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR']).withMessage('Unsupported currency'),
  body('paymentMethodId').optional().isString()
];

/**
 * 📋 GET ALL INVESTMENTS - OPTIMIZED
 * User's investment history with performance optimizations
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userType = req.user.userType;
    const {
      page = 1,
      limit = Math.min(parseInt(req.query.limit) || 20, 100), // Cap at 100
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Performance: Use composite indexes for better query performance
    let query = db.collection('investments');

    // Filter by user type
    if (userType === 'investor') {
      query = query.where('investorId', '==', userId);
    } else if (userType === 'business') {
      // Get business ID for the user
      const userDoc = await db
        .collection('users')
        .doc(userId)
        .get();
      
      const businessId = userDoc.data()?.businessProfile?.businessId;
      if (businessId) {
        query = query.where('businessId', '==', businessId);
      } else {
        return res.json({
          success: true,
          investments: [],
          pagination: { page: 1, limit: 20, total: 0, hasMore: false }
        });
      }
    } else if (userType === 'admin') {
      // Admin can see all investments
    }

    // Apply filters
    if (status) {
      query = query.where('transaction.status', '==', status);
    }

    if (type) {
      query = query.where('transaction.investmentType', '==', type);
    }

    // Performance: Apply sorting and pagination with proper indexing
    query = query.orderBy(sortBy, sortOrder);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));
    
    // Performance: Add query timeout for better error handling
    const queryTimeout = setTimeout(() => {
      logger.warn('Investment query taking too long', { userId, userType });
    }, 5000);

    const snapshot = await query.get();
    const investments = [];

    // Performance: Batch fetch related documents
    const businessIds = new Set();
    const investorIds = new Set();
    const investmentDocs = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      investmentDocs.push({ id: doc.id, ...data });
      businessIds.add(data.businessId);
      investorIds.add(data.investorId);
    });

    // Batch fetch businesses and users
    const [businessDocs, userDocs] = await Promise.all([
      Promise.all(Array.from(businessIds).map(id => 
        db.collection('businesses').doc(id).get()
      )),
      Promise.all(Array.from(investorIds).map(id => 
        db.collection('users').doc(id).get()
      ))
    ]);

    // Create lookup maps for O(1) access
    const businessMap = new Map();
    const userMap = new Map();
    
    businessDocs.forEach(doc => {
      if (doc.exists) {
        businessMap.set(doc.id, doc.data());
      }
    });
    
    userDocs.forEach(doc => {
      if (doc.exists) {
        userMap.set(doc.id, doc.data());
      }
    });

    // Build response with cached data
    investmentDocs.forEach(investment => {
      const business = businessMap.get(investment.businessId);
      const investor = userMap.get(investment.investorId);
      
      investments.push({
        ...investment,
        businessInfo: business ? {
          name: business.basicInfo?.businessName,
          logo: business.basicInfo?.logo,
          sector: business.industry?.primarySector
        } : null,
        investorInfo: investor ? {
          name: investor.profile?.displayName,
          email: investor.email
        } : null
      });
    });

    res.json({
      success: true,
      investments: investments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: investments.length,
        hasMore: investments.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investments'
    });
  }
});

/**
 * 📄 GET SINGLE INVESTMENT
 * Detailed investment information
 */
router.get('/:id', async (req, res) => {
  try {
    const investmentId = req.params.id;
    const userId = req.user.uid;
    const userType = req.user.userType;

    const investmentDoc = await db
      .collection('investments')
      .doc(investmentId)
      .get();

    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investmentData = investmentDoc.data();

    // Check access permissions
    if (userType !== 'admin' && 
        investmentData.investorId !== userId && 
        investmentData.businessId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get related business and investor details
    const [businessDoc, investorDoc] = await Promise.all([
      db
        .collection('businesses')
        .doc(investmentData.businessId)
        .get(),
      db
        .collection('users')
        .doc(investmentData.investorId)
        .get()
    ]);

    const enrichedInvestment = {
      id: investmentId,
      ...investmentData,
      businessDetails: businessDoc.exists ? businessDoc.data() : null,
      investorDetails: investorDoc.exists ? {
        name: investorDoc.data().profile?.displayName,
        email: investorDoc.data().email,
        userType: investorDoc.data().userType
      } : null
    };

    res.json({
      success: true,
      investment: enrichedInvestment
    });

  } catch (error) {
    logger.error('Error fetching investment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment'
    });
  }
});

/**
 * 💰 CREATE INVESTMENT
 * Process new investment transaction
 */
router.post('/', 
  requireUserType('investor'),
  requireVerification,
  async (req, res) => {
    try {
      const investorId = req.user.uid;
      const {
        businessId,
        opportunityId,
        amount,
        currency,
        investmentType,
        paymentMethodId,
        paymentProvider = 'auto' // auto, stripe, flutterwave
      } = req.body;

      // Validate required fields
      if (!businessId || !amount || !currency || !investmentType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: businessId, amount, currency, investmentType'
        });
      }

      // Validate investment amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Investment amount must be greater than 0'
        });
      }

      // Get business details
      const businessDoc = await db
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

      // Check if business is accepting investments
      if (!businessData.status?.isPublished || !businessData.status?.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Business is not currently accepting investments'
        });
      }

      // Get investor details
      const investorDoc = await db
        .collection('users')
        .doc(investorId)
        .get();

      const investorData = investorDoc.data();

      // Prepare payment data
      const paymentData = {
        type: 'investment',
        userId: investorId,
        businessId: businessId,
        opportunityId: opportunityId,
        amount: amount,
        currency: currency,
        investmentType: investmentType,
        paymentMethodId: paymentMethodId,
        userEmail: investorData.email,
        userName: investorData.profile?.displayName,
        userPhone: investorData.profile?.phoneNumber,
        userLocation: {
          country: investorData.profile?.country
        },
        businessName: businessData.basicInfo?.businessName
      };

      // Process payment
      const paymentResult = await paymentService.processPayment(paymentData);

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          error: paymentResult.error,
          errorCode: paymentResult.errorCode
        });
      }

      // Create investment record
      const investmentData = {
        investorId: investorId,
        businessId: businessId,
        opportunityId: opportunityId,
        transaction: {
          amount: amount,
          currency: currency,
          investmentType: investmentType,
          status: 'pending',
          investmentStage: businessData.financials?.fundingStage || 'unknown'
        },
        payment: {
          transactionId: paymentResult.transaction.transactionId,
          provider: paymentResult.transaction.provider,
          status: paymentResult.transaction.status,
          escrowId: paymentResult.transaction.escrowId,
          paymentMethodId: paymentMethodId
        },
        terms: {
          // Default terms - would be customized based on business setup
          liquidationPreference: 1.0,
          dividendRate: 0,
          votingRights: investmentType === 'equity',
          boardRights: false,
          antiDilution: 'none'
        },
        performance: {
          currentValue: amount,
          unrealizedGain: 0,
          realizedGain: 0,
          totalReturn: 0,
          irr: 0,
          multiple: 1.0
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const investmentRef = await db
        .collection('investments')
        .add(investmentData);

      // Log investment creation
      await db
        .collection('activityLogs')
        .add({
          userId: investorId,
          action: 'investment_created',
          resource: { type: 'investment', id: investmentRef.id },
          details: { 
            businessId, 
            amount, 
            currency, 
            investmentType,
            transactionId: paymentResult.transaction.transactionId
          },
          timestamp: new Date()
        });

      // Send confirmation email/notification
      await db
        .collection('notifications')
        .add({
          userId: investorId,
          type: 'investment',
          title: 'Investment Initiated',
          message: `Your investment of ${currency} ${amount} in ${businessData.basicInfo?.businessName} has been initiated.`,
          data: {
            investmentId: investmentRef.id,
            businessId: businessId,
            amount: amount,
            currency: currency
          },
          channels: { email: true, push: true },
          createdAt: new Date()
        });

      res.status(201).json({
        success: true,
        investmentId: investmentRef.id,
        transactionId: paymentResult.transaction.transactionId,
        clientSecret: paymentResult.transaction.clientSecret,
        paymentLink: paymentResult.transaction.paymentLink,
        status: 'pending',
        message: 'Investment created successfully'
      });

    } catch (error) {
      logger.error('Error creating investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create investment'
      });
    }
  }
);

/**
 * ✅ CONFIRM INVESTMENT
 * Confirm payment and activate investment
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const investmentId = req.params.id;
    const { transactionId, provider } = req.body;

    // Get investment record
    const investmentDoc = await db
      .collection('investments')
      .doc(investmentId)
      .get();

    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investmentData = investmentDoc.data();

    // Check if user has permission to confirm
    if (investmentData.investorId !== req.user.uid && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Verify payment with provider
    const paymentVerification = await paymentService.verifyPayment(transactionId, provider);

    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        details: paymentVerification.error
      });
    }

    // Update investment status
    await db
      .collection('investments')
      .doc(investmentId)
      .update({
        'transaction.status': 'completed',
        'payment.status': 'completed',
        'payment.confirmedAt': new Date(),
        'status': 'active',
        'updatedAt': new Date()
      });

    // Update business funding progress
    const businessDoc = await db
      .collection('businesses')
      .doc(investmentData.businessId)
      .get();

    if (businessDoc.exists) {
      const businessData = businessDoc.data();
      const currentRaised = businessData.investment?.currentRound?.raisedAmount || 0;
      const newRaisedAmount = currentRaised + investmentData.transaction.amount;

      await db
        .collection('businesses')
        .doc(investmentData.businessId)
        .update({
          'investment.currentRound.raisedAmount': newRaisedAmount,
          'analytics.totalFundingRaised': (businessData.analytics?.totalFundingRaised || 0) + investmentData.transaction.amount,
          'metadata.updatedAt': new Date()
        });
    }

    // Send success notifications
    await Promise.all([
      // Notify investor
      db.collection('notifications').add({
        userId: investmentData.investorId,
        type: 'investment',
        title: 'Investment Confirmed!',
        message: `Your investment has been confirmed and is now active.`,
        data: { investmentId: investmentId },
        channels: { email: true, push: true },
        createdAt: new Date()
      }),
      
      // Notify business owner
      db.collection('notifications').add({
        userId: investmentData.businessId,
        type: 'investment',
        title: 'New Investment Received!',
        message: `You have received a new investment of ${investmentData.transaction.currency} ${investmentData.transaction.amount}.`,
        data: { 
          investmentId: investmentId,
          amount: investmentData.transaction.amount,
          currency: investmentData.transaction.currency
        },
        channels: { email: true, push: true },
        createdAt: new Date()
      })
    ]);

    res.json({
      success: true,
      message: 'Investment confirmed successfully',
      investmentId: investmentId,
      status: 'active'
    });

  } catch (error) {
    logger.error('Error confirming investment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm investment'
    });
  }
});

/**
 * 📊 GET INVESTMENT ANALYTICS
 * Portfolio performance analytics
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    const investmentId = req.params.id;
    const { timeRange = '1y' } = req.query;

    // Get investment record
    const investmentDoc = await db
      .collection('investments')
      .doc(investmentId)
      .get();

    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investmentData = investmentDoc.data();

    // Check access permissions
    if (investmentData.investorId !== req.user.uid && 
        investmentData.businessId !== req.user.uid && 
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Generate analytics data
    const analytics = {
      overview: {
        initialInvestment: investmentData.transaction.amount,
        currentValue: investmentData.performance?.currentValue || investmentData.transaction.amount,
        totalReturn: investmentData.performance?.totalReturn || 0,
        returnPercentage: investmentData.performance?.totalReturn ? 
          ((investmentData.performance.currentValue - investmentData.transaction.amount) / investmentData.transaction.amount) * 100 : 0,
        irr: investmentData.performance?.irr || 0,
        multiple: investmentData.performance?.multiple || 1.0
      },
      timeline: {
        investmentDate: investmentData.createdAt,
        holdingPeriod: Math.floor((new Date() - investmentData.createdAt) / (1000 * 60 * 60 * 24)), // days
        lastUpdated: investmentData.updatedAt
      },
      dividends: investmentData.dividends || [],
      valuationHistory: investmentData.valuations || [],
      businessPerformance: {
        // This would be fetched from business analytics
        revenueGrowth: 12.5,
        profitabilityTrend: 'improving',
        esgScore: 75,
        riskLevel: 'medium'
      }
    };

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange,
      investmentId: investmentId
    });

  } catch (error) {
    logger.error('Error fetching investment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment analytics'
    });
  }
});

/**
 * 📋 GET PORTFOLIO SUMMARY
 * Investor's complete portfolio overview
 */
router.get('/portfolio/summary',
  requireUserType('investor'),
  async (req, res) => {
    try {
      const investorId = req.user.uid;

      // Get all investments for the investor
      const investmentsQuery = await db
        .collection('investments')
        .where('investorId', '==', investorId)
        .get();

      const investments = [];
      let totalInvested = 0;
      let totalCurrentValue = 0;
      let activeInvestments = 0;

      for (const doc of investmentsQuery.docs) {
        const investmentData = doc.data();
        investments.push({ id: doc.id, ...investmentData });
        
        totalInvested += investmentData.transaction.amount;
        totalCurrentValue += investmentData.performance?.currentValue || investmentData.transaction.amount;
        
        if (investmentData.status === 'active') {
          activeInvestments++;
        }
      }

      // Calculate portfolio metrics
      const totalReturn = totalCurrentValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

      // Analyze diversification
      const sectorBreakdown = {};
      const countryBreakdown = {};
      const stageBreakdown = {};

      for (const investment of investments) {
        // Get business details for categorization
        const businessDoc = await db
          .collection('businesses')
          .doc(investment.businessId)
          .get();

        if (businessDoc.exists) {
          const businessData = businessDoc.data();
          const sector = businessData.industry?.primarySector || 'Unknown';
          const country = businessData.location?.country || 'Unknown';
          const stage = businessData.financials?.fundingStage || 'Unknown';

          sectorBreakdown[sector] = (sectorBreakdown[sector] || 0) + investment.transaction.amount;
          countryBreakdown[country] = (countryBreakdown[country] || 0) + investment.transaction.amount;
          stageBreakdown[stage] = (stageBreakdown[stage] || 0) + investment.transaction.amount;
        }
      }

      const portfolioSummary = {
        overview: {
          totalInvested: totalInvested,
          currentValue: totalCurrentValue,
          totalReturn: totalReturn,
          returnPercentage: returnPercentage,
          activeInvestments: activeInvestments,
          totalInvestments: investments.length
        },
        diversification: {
          bySector: sectorBreakdown,
          byCountry: countryBreakdown,
          byStage: stageBreakdown
        },
        recentInvestments: investments
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        performance: {
          bestPerforming: investments
            .filter(inv => inv.performance?.totalReturn > 0)
            .sort((a, b) => (b.performance?.totalReturn || 0) - (a.performance?.totalReturn || 0))
            .slice(0, 3),
          needsAttention: investments
            .filter(inv => (inv.performance?.totalReturn || 0) < 0)
            .sort((a, b) => (a.performance?.totalReturn || 0) - (b.performance?.totalReturn || 0))
            .slice(0, 3)
        }
      };

      res.json({
        success: true,
        portfolio: portfolioSummary,
        generatedAt: new Date()
      });

    } catch (error) {
      logger.error('Error fetching portfolio summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio summary'
      });
    }
  }
);

/**
 * ❌ CANCEL INVESTMENT
 * Cancel pending investment
 */
router.delete('/:id',
  async (req, res) => {
    try {
      const investmentId = req.params.id;
      const userId = req.user.uid;

      // Get investment record
      const investmentDoc = await db
        .collection('investments')
        .doc(investmentId)
        .get();

      if (!investmentDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Investment not found'
        });
      }

      const investmentData = investmentDoc.data();

      // Check permissions
      if (investmentData.investorId !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Can only cancel pending investments
      if (investmentData.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Can only cancel pending investments'
        });
      }

      // Process refund if payment was made
      if (investmentData.payment?.transactionId) {
        const refundResult = await paymentService.processRefund(
          investmentData.payment.transactionId,
          investmentData.payment.provider,
          investmentData.transaction.amount,
          'requested_by_customer'
        );

        if (!refundResult.success) {
          logger.error('Refund failed:', refundResult.error);
          // Continue with cancellation even if refund fails - handle manually
        }
      }

      // Update investment status
      await db
        .collection('investments')
        .doc(investmentId)
        .update({
          status: 'cancelled',
          'transaction.status': 'cancelled',
          cancelledAt: new Date(),
          cancelReason: 'cancelled_by_investor',
          updatedAt: new Date()
        });

      res.json({
        success: true,
        message: 'Investment cancelled successfully'
      });

    } catch (error) {
      logger.error('Error cancelling investment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel investment'
      });
    }
  }
);

module.exports = router;