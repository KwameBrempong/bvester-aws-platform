// 🚀 BVESTER - ANALYTICS API ROUTES
// Comprehensive platform analytics and insights

const express = require('express');
const router = express.Router();
const { requireUserType, requireSubscription, requireAdmin } = require('../../middleware/authMiddleware');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 📊 GET PLATFORM OVERVIEW
 * High-level platform statistics
 */
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

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
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total counts
    const [usersSnapshot, businessesSnapshot, investmentsSnapshot] = await Promise.all([
      FirebaseAdmin.adminFirestore.collection('users').get(),
      FirebaseAdmin.adminFirestore.collection('businesses').get(),
      FirebaseAdmin.adminFirestore.collection('investments').get()
    ]);

    // Get new registrations in time range
    const newUsersQuery = await FirebaseAdmin.adminFirestore
      .collection('users')
      .where('metadata.createdAt', '>=', startDate)
      .get();

    const newBusinessesQuery = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .where('metadata.createdAt', '>=', startDate)
      .get();

    const newInvestmentsQuery = await FirebaseAdmin.adminFirestore
      .collection('investments')
      .where('createdAt', '>=', startDate)
      .get();

    // Calculate investment totals
    let totalInvestmentAmount = 0;
    let newInvestmentAmount = 0;
    
    investmentsSnapshot.forEach(doc => {
      const investment = doc.data();
      if (investment.transaction?.status === 'completed') {
        totalInvestmentAmount += investment.transaction.amount || 0;
      }
    });

    newInvestmentsQuery.forEach(doc => {
      const investment = doc.data();
      if (investment.transaction?.status === 'completed') {
        newInvestmentAmount += investment.transaction.amount || 0;
      }
    });

    // Get user type breakdown
    const userTypes = { investor: 0, business: 0, admin: 0 };
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const userType = user.userType || 'investor';
      userTypes[userType] = (userTypes[userType] || 0) + 1;
    });

    // Get geographic distribution
    const countries = {};
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const country = user.profile?.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
    });

    const overview = {
      totals: {
        users: usersSnapshot.size,
        businesses: businessesSnapshot.size,
        investments: investmentsSnapshot.size,
        totalInvestmentAmount: totalInvestmentAmount
      },
      newInPeriod: {
        users: newUsersQuery.size,
        businesses: newBusinessesQuery.size,
        investments: newInvestmentsQuery.size,
        investmentAmount: newInvestmentAmount
      },
      userTypes: userTypes,
      topCountries: Object.entries(countries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([country, count]) => ({ country, count })),
      timeRange: timeRange,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      overview: overview
    });

  } catch (error) {
    logger.error('Error fetching platform overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform overview'
    });
  }
});

/**
 * 💰 GET INVESTMENT ANALYTICS
 * Detailed investment analytics
 */
router.get('/investments', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d', currency = 'all' } = req.query;

    // Get all investments
    let investmentsQuery = FirebaseAdmin.adminFirestore.collection('investments');
    
    if (currency !== 'all') {
      investmentsQuery = investmentsQuery.where('transaction.currency', '==', currency);
    }

    const investmentsSnapshot = await investmentsQuery.get();
    
    const analytics = {
      summary: {
        totalInvestments: 0,
        totalAmount: 0,
        averageInvestment: 0,
        successfulInvestments: 0,
        pendingInvestments: 0,
        cancelledInvestments: 0
      },
      breakdown: {
        byType: {},
        byCurrency: {},
        byStatus: {},
        byCountry: {},
        bySector: {}
      },
      trends: {
        monthly: {},
        weekly: {}
      }
    };

    const businessCache = new Map();
    const investorCache = new Map();

    for (const doc of investmentsSnapshot.docs) {
      const investment = doc.data();
      const amount = investment.transaction?.amount || 0;
      const currency = investment.transaction?.currency || 'USD';
      const status = investment.status || 'unknown';
      const type = investment.transaction?.investmentType || 'unknown';

      analytics.summary.totalInvestments++;
      
      if (status === 'active' || status === 'completed') {
        analytics.summary.totalAmount += amount;
        analytics.summary.successfulInvestments++;
      } else if (status === 'pending') {
        analytics.summary.pendingInvestments++;
      } else if (status === 'cancelled') {
        analytics.summary.cancelledInvestments++;
      }

      // Investment type breakdown
      analytics.breakdown.byType[type] = (analytics.breakdown.byType[type] || 0) + 1;

      // Currency breakdown
      analytics.breakdown.byCurrency[currency] = (analytics.breakdown.byCurrency[currency] || 0) + amount;

      // Status breakdown
      analytics.breakdown.byStatus[status] = (analytics.breakdown.byStatus[status] || 0) + 1;

      // Get business details for sector and country analysis
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
        const country = businessData.location?.country || 'Unknown';
        const sector = businessData.industry?.primarySector || 'Unknown';

        analytics.breakdown.byCountry[country] = (analytics.breakdown.byCountry[country] || 0) + amount;
        analytics.breakdown.bySector[sector] = (analytics.breakdown.bySector[sector] || 0) + amount;
      }

      // Monthly trends
      const monthKey = investment.createdAt?.toDate().toISOString().substring(0, 7) || 'unknown';
      if (!analytics.trends.monthly[monthKey]) {
        analytics.trends.monthly[monthKey] = { count: 0, amount: 0 };
      }
      analytics.trends.monthly[monthKey].count++;
      analytics.trends.monthly[monthKey].amount += amount;
    }

    // Calculate average investment
    analytics.summary.averageInvestment = analytics.summary.successfulInvestments > 0 
      ? analytics.summary.totalAmount / analytics.summary.successfulInvestments 
      : 0;

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange,
      currency: currency
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
 * 🏢 GET BUSINESS ANALYTICS
 * Business performance analytics
 */
router.get('/businesses', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const businessesSnapshot = await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .get();

    const analytics = {
      summary: {
        totalBusinesses: 0,
        publishedBusinesses: 0,
        activeBusinesses: 0,
        verifiedBusinesses: 0,
        averageFinancialHealth: 0,
        averageESGScore: 0
      },
      breakdown: {
        bySector: {},
        byCountry: {},
        byFundingStage: {},
        byHealthScore: {
          'excellent': 0,
          'good': 0,
          'average': 0,
          'poor': 0
        },
        byESGScore: {
          'high': 0,
          'medium': 0,
          'low': 0
        }
      },
      topPerformers: {
        byFinancialHealth: [],
        byESGScore: [],
        byFunding: []
      }
    };

    let totalHealthScore = 0;
    let totalESGScore = 0;
    let scoredBusinesses = 0;
    const businessPerformance = [];

    businessesSnapshot.forEach(doc => {
      const business = doc.data();
      analytics.summary.totalBusinesses++;

      if (business.status?.isPublished) {
        analytics.summary.publishedBusinesses++;
      }

      if (business.status?.isActive) {
        analytics.summary.activeBusinesses++;
      }

      if (business.status?.isVerified) {
        analytics.summary.verifiedBusinesses++;
      }

      // Sector breakdown
      const sector = business.industry?.primarySector || 'Unknown';
      analytics.breakdown.bySector[sector] = (analytics.breakdown.bySector[sector] || 0) + 1;

      // Country breakdown
      const country = business.location?.country || 'Unknown';
      analytics.breakdown.byCountry[country] = (analytics.breakdown.byCountry[country] || 0) + 1;

      // Funding stage breakdown
      const stage = business.financials?.fundingStage || 'Unknown';
      analytics.breakdown.byFundingStage[stage] = (analytics.breakdown.byFundingStage[stage] || 0) + 1;

      // Health score analysis
      const healthScore = business.scores?.financialHealth || 0;
      if (healthScore > 0) {
        totalHealthScore += healthScore;
        scoredBusinesses++;

        if (healthScore >= 80) {
          analytics.breakdown.byHealthScore.excellent++;
        } else if (healthScore >= 60) {
          analytics.breakdown.byHealthScore.good++;
        } else if (healthScore >= 40) {
          analytics.breakdown.byHealthScore.average++;
        } else {
          analytics.breakdown.byHealthScore.poor++;
        }
      }

      // ESG score analysis
      const esgScore = business.scores?.esgScore || 0;
      if (esgScore > 0) {
        totalESGScore += esgScore;

        if (esgScore >= 70) {
          analytics.breakdown.byESGScore.high++;
        } else if (esgScore >= 40) {
          analytics.breakdown.byESGScore.medium++;
        } else {
          analytics.breakdown.byESGScore.low++;
        }
      }

      // Collect for top performers
      businessPerformance.push({
        id: doc.id,
        name: business.basicInfo?.businessName,
        healthScore: healthScore,
        esgScore: esgScore,
        totalFunding: business.analytics?.totalFundingRaised || 0,
        sector: sector,
        country: country
      });
    });

    // Calculate averages
    analytics.summary.averageFinancialHealth = scoredBusinesses > 0 ? totalHealthScore / scoredBusinesses : 0;
    analytics.summary.averageESGScore = scoredBusinesses > 0 ? totalESGScore / scoredBusinesses : 0;

    // Top performers
    analytics.topPerformers.byFinancialHealth = businessPerformance
      .filter(b => b.healthScore > 0)
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 10);

    analytics.topPerformers.byESGScore = businessPerformance
      .filter(b => b.esgScore > 0)
      .sort((a, b) => b.esgScore - a.esgScore)
      .slice(0, 10);

    analytics.topPerformers.byFunding = businessPerformance
      .filter(b => b.totalFunding > 0)
      .sort((a, b) => b.totalFunding - a.totalFunding)
      .slice(0, 10);

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange
    });

  } catch (error) {
    logger.error('Error fetching business analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business analytics'
    });
  }
});

/**
 * 👥 GET USER ANALYTICS
 * User engagement and behavior analytics
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const usersSnapshot = await FirebaseAdmin.adminFirestore
      .collection('users')
      .get();

    const analytics = {
      summary: {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        subscribedUsers: 0
      },
      breakdown: {
        byUserType: {},
        byCountry: {},
        bySubscription: {},
        byVerificationStatus: {
          verified: 0,
          pending: 0,
          unverified: 0
        }
      },
      engagement: {
        averageSessionsPerUser: 0,
        averageTimeOnPlatform: 0,
        topActivities: {}
      }
    };

    usersSnapshot.forEach(doc => {
      const user = doc.data();
      analytics.summary.totalUsers++;

      // User type breakdown
      const userType = user.userType || 'investor';
      analytics.breakdown.byUserType[userType] = (analytics.breakdown.byUserType[userType] || 0) + 1;

      // Country breakdown
      const country = user.profile?.country || 'Unknown';
      analytics.breakdown.byCountry[country] = (analytics.breakdown.byCountry[country] || 0) + 1;

      // Subscription breakdown
      const subscription = user.subscription?.plan || 'basic';
      analytics.breakdown.bySubscription[subscription] = (analytics.breakdown.bySubscription[subscription] || 0) + 1;

      // Activity status
      if (user.status === 'active' || !user.status) {
        analytics.summary.activeUsers++;
      }

      // Verification status
      const kycStatus = user.verification?.kycStatus;
      if (kycStatus === 'verified') {
        analytics.summary.verifiedUsers++;
        analytics.breakdown.byVerificationStatus.verified++;
      } else if (kycStatus === 'pending') {
        analytics.breakdown.byVerificationStatus.pending++;
      } else {
        analytics.breakdown.byVerificationStatus.unverified++;
      }

      // Subscription status
      if (user.subscription?.status === 'active' && user.subscription?.plan !== 'basic') {
        analytics.summary.subscribedUsers++;
      }
    });

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange
    });

  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

/**
 * 💳 GET REVENUE ANALYTICS
 * Platform revenue and financial analytics
 */
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d', currency = 'all' } = req.query;

    // Get payment data
    let paymentsQuery = FirebaseAdmin.adminFirestore.collection('payments');
    
    if (currency !== 'all') {
      paymentsQuery = paymentsQuery.where('currency', '==', currency);
    }

    const paymentsSnapshot = await paymentsQuery.get();

    const analytics = {
      summary: {
        totalRevenue: 0,
        subscriptionRevenue: 0,
        transactionRevenue: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        averageTransactionValue: 0
      },
      breakdown: {
        byType: {},
        byCurrency: {},
        byProvider: {},
        monthly: {}
      },
      subscriptions: {
        active: 0,
        churned: 0,
        mrr: 0, // Monthly Recurring Revenue
        arpu: 0 // Average Revenue Per User
      }
    };

    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      const amount = payment.amount || 0;
      const currency = payment.currency || 'USD';
      const type = payment.type || 'unknown';
      const provider = payment.provider || 'unknown';
      const status = payment.status || 'unknown';

      analytics.summary.totalTransactions++;

      if (status === 'completed') {
        analytics.summary.totalRevenue += amount;
        analytics.summary.successfulTransactions++;

        if (type === 'subscription') {
          analytics.summary.subscriptionRevenue += amount;
        } else {
          analytics.summary.transactionRevenue += amount;
        }

        // Type breakdown
        analytics.breakdown.byType[type] = (analytics.breakdown.byType[type] || 0) + amount;

        // Currency breakdown
        analytics.breakdown.byCurrency[currency] = (analytics.breakdown.byCurrency[currency] || 0) + amount;

        // Provider breakdown
        analytics.breakdown.byProvider[provider] = (analytics.breakdown.byProvider[provider] || 0) + amount;

        // Monthly breakdown
        const monthKey = payment.createdAt?.toDate().toISOString().substring(0, 7) || 'unknown';
        analytics.breakdown.monthly[monthKey] = (analytics.breakdown.monthly[monthKey] || 0) + amount;
      }
    });

    // Calculate averages
    analytics.summary.averageTransactionValue = analytics.summary.successfulTransactions > 0 
      ? analytics.summary.totalRevenue / analytics.summary.successfulTransactions 
      : 0;

    // Get subscription analytics
    const usersSnapshot = await FirebaseAdmin.adminFirestore
      .collection('users')
      .where('subscription.status', '==', 'active')
      .get();

    let totalSubscriptionValue = 0;
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const plan = user.subscription?.plan;
      
      // Calculate subscription value (this would use your pricing)
      const planValues = { basic: 0, professional: 47, enterprise: 127 };
      totalSubscriptionValue += planValues[plan] || 0;
    });

    analytics.subscriptions.active = usersSnapshot.size;
    analytics.subscriptions.mrr = totalSubscriptionValue;
    analytics.subscriptions.arpu = usersSnapshot.size > 0 ? totalSubscriptionValue / usersSnapshot.size : 0;

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange,
      currency: currency
    });

  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

/**
 * 🌍 GET GEOGRAPHIC ANALYTICS
 * Geographic distribution and performance
 */
router.get('/geographic', requireAdmin, async (req, res) => {
  try {
    const [usersSnapshot, businessesSnapshot, investmentsSnapshot] = await Promise.all([
      FirebaseAdmin.adminFirestore.collection('users').get(),
      FirebaseAdmin.adminFirestore.collection('businesses').get(),
      FirebaseAdmin.adminFirestore.collection('investments').get()
    ]);

    const analytics = {
      users: {},
      businesses: {},
      investments: {},
      performance: {}
    };

    // User distribution
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const country = user.profile?.country || 'Unknown';
      
      if (!analytics.users[country]) {
        analytics.users[country] = { total: 0, investors: 0, businesses: 0 };
      }
      
      analytics.users[country].total++;
      
      if (user.userType === 'investor') {
        analytics.users[country].investors++;
      } else if (user.userType === 'business') {
        analytics.users[country].businesses++;
      }
    });

    // Business distribution
    businessesSnapshot.forEach(doc => {
      const business = doc.data();
      const country = business.location?.country || 'Unknown';
      
      if (!analytics.businesses[country]) {
        analytics.businesses[country] = { 
          total: 0, 
          published: 0, 
          totalFunding: 0,
          averageHealthScore: 0,
          healthScoreSum: 0,
          scoredBusinesses: 0
        };
      }
      
      analytics.businesses[country].total++;
      
      if (business.status?.isPublished) {
        analytics.businesses[country].published++;
      }
      
      const funding = business.analytics?.totalFundingRaised || 0;
      analytics.businesses[country].totalFunding += funding;
      
      const healthScore = business.scores?.financialHealth || 0;
      if (healthScore > 0) {
        analytics.businesses[country].healthScoreSum += healthScore;
        analytics.businesses[country].scoredBusinesses++;
      }
    });

    // Calculate average health scores
    Object.keys(analytics.businesses).forEach(country => {
      const data = analytics.businesses[country];
      data.averageHealthScore = data.scoredBusinesses > 0 
        ? data.healthScoreSum / data.scoredBusinesses 
        : 0;
    });

    // Investment distribution
    const businessCountryMap = new Map();
    businessesSnapshot.forEach(doc => {
      const business = doc.data();
      businessCountryMap.set(doc.id, business.location?.country || 'Unknown');
    });

    investmentsSnapshot.forEach(doc => {
      const investment = doc.data();
      const businessCountry = businessCountryMap.get(investment.businessId) || 'Unknown';
      
      if (!analytics.investments[businessCountry]) {
        analytics.investments[businessCountry] = { 
          total: 0, 
          amount: 0, 
          successful: 0,
          successfulAmount: 0
        };
      }
      
      analytics.investments[businessCountry].total++;
      
      const amount = investment.transaction?.amount || 0;
      analytics.investments[businessCountry].amount += amount;
      
      if (investment.status === 'active' || investment.status === 'completed') {
        analytics.investments[businessCountry].successful++;
        analytics.investments[businessCountry].successfulAmount += amount;
      }
    });

    // Performance metrics by country
    Object.keys(analytics.users).forEach(country => {
      const users = analytics.users[country] || { total: 0 };
      const businesses = analytics.businesses[country] || { total: 0, totalFunding: 0 };
      const investments = analytics.investments[country] || { total: 0, amount: 0 };
      
      analytics.performance[country] = {
        userToBusinessRatio: businesses.total > 0 ? users.total / businesses.total : 0,
        investmentPerBusiness: businesses.total > 0 ? investments.amount / businesses.total : 0,
        averageInvestmentSize: investments.total > 0 ? investments.amount / investments.total : 0,
        investmentSuccessRate: investments.total > 0 ? (investments.successful / investments.total) * 100 : 0
      };
    });

    res.json({
      success: true,
      analytics: analytics,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching geographic analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch geographic analytics'
    });
  }
});

/**
 * 📈 GET CUSTOM ANALYTICS REPORT
 * Generate custom analytics report
 */
router.post('/report', requireAdmin, async (req, res) => {
  try {
    const {
      metrics = ['users', 'businesses', 'investments'],
      timeRange = '30d',
      filters = {},
      groupBy = 'country'
    } = req.body;

    const report = {
      config: { metrics, timeRange, filters, groupBy },
      data: {},
      summary: {},
      generatedAt: new Date()
    };

    // This would implement custom report generation based on requested metrics
    // For now, return a placeholder structure
    
    report.summary = {
      message: 'Custom analytics report generation is available. Specify metrics, timeRange, filters, and groupBy parameters.',
      availableMetrics: ['users', 'businesses', 'investments', 'revenue', 'geographic'],
      availableTimeRanges: ['7d', '30d', '90d', '1y', 'all'],
      availableGroupBy: ['country', 'sector', 'userType', 'month', 'week']
    };

    res.json({
      success: true,
      report: report
    });

  } catch (error) {
    logger.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report'
    });
  }
});

module.exports = router;