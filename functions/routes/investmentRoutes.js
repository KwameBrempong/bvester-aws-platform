// Firebase Functions - Investment Routes
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * 📊 GET INVESTMENT OPPORTUNITIES
 * Retrieve available investment opportunities
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      sector, 
      country, 
      minAmount, 
      maxAmount, 
      status = 'active' 
    } = req.query;

    let query = db.collection('investments').where('status', '==', status);

    // Apply filters
    if (sector) {
      query = query.where('business.sector', '==', sector);
    }
    if (country) {
      query = query.where('business.country', '==', country);
    }
    if (minAmount) {
      query = query.where('fundingDetails.targetAmount', '>=', parseInt(minAmount));
    }
    if (maxAmount) {
      query = query.where('fundingDetails.targetAmount', '<=', parseInt(maxAmount));
    }

    query = query.orderBy('createdAt', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));

    const snapshot = await query.get();
    const opportunities = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      opportunities.push({
        id: doc.id,
        ...data,
        // Calculate funding progress
        fundingProgress: data.fundingDetails.raisedAmount / data.fundingDetails.targetAmount * 100,
        // Calculate time remaining
        timeRemaining: data.fundingDetails.deadline ? 
          Math.max(0, new Date(data.fundingDetails.deadline.toDate()) - new Date()) : null
      });
    });

    res.json({
      success: true,
      opportunities,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve investment opportunities'
    });
  }
});

/**
 * 📈 CREATE INVESTMENT
 * Create a new investment record
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      opportunityId,
      amount,
      currency = 'USD',
      paymentMethod,
      investmentType = 'equity'
    } = req.body;

    if (!opportunityId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid opportunity ID and amount are required'
      });
    }

    const userId = req.user.uid;

    // Get opportunity details
    const opportunityDoc = await db.collection('investments').doc(opportunityId).get();
    if (!opportunityDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment opportunity not found'
      });
    }

    const opportunity = opportunityDoc.data();

    // Validate investment amount
    const minInvestment = opportunity.fundingDetails?.minInvestment || 100;
    const maxInvestment = opportunity.fundingDetails?.maxInvestment || 1000000;

    if (amount < minInvestment) {
      return res.status(400).json({
        success: false,
        error: `Minimum investment amount is ${currency} ${minInvestment}`
      });
    }

    if (amount > maxInvestment) {
      return res.status(400).json({
        success: false,
        error: `Maximum investment amount is ${currency} ${maxInvestment}`
      });
    }

    // Check if opportunity is still open
    if (opportunity.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Investment opportunity is no longer active'
      });
    }

    // Check funding deadline
    if (opportunity.fundingDetails?.deadline && 
        new Date() > opportunity.fundingDetails.deadline.toDate()) {
      return res.status(400).json({
        success: false,
        error: 'Investment opportunity has expired'
      });
    }

    // Create investment record
    const investmentData = {
      investorId: userId,
      opportunityId: opportunityId,
      businessId: opportunity.businessId,
      amount: amount,
      currency: currency,
      investmentType: investmentType,
      status: 'pending_payment',
      paymentMethod: paymentMethod,
      terms: {
        equityPercentage: opportunity.fundingDetails?.equityOffered || 0,
        expectedReturn: opportunity.fundingDetails?.expectedReturn || 0,
        investmentHorizon: opportunity.fundingDetails?.investmentHorizon || 'medium'
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentAttempts: 0
      }
    };

    // Save investment
    const investmentRef = await db.collection('userInvestments').add(investmentData);

    // Update user portfolio
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentTotal = userData.investorProfile?.portfolio?.totalInvested || 0;

    await db.collection('users').doc(userId).update({
      'investorProfile.portfolio.totalInvested': currentTotal + amount,
      'investorProfile.portfolio.activeInvestments': 
        (userData.investorProfile?.portfolio?.activeInvestments || 0) + 1,
      'metadata.updatedAt': new Date()
    });

    // Log investment creation
    await db.collection('activityLogs').add({
      userId: userId,
      action: 'investment_created',
      resource: { type: 'investment', id: investmentRef.id },
      details: { 
        opportunityId: opportunityId,
        amount: amount,
        currency: currency 
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      investment: {
        id: investmentRef.id,
        ...investmentData
      }
    });

  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create investment'
    });
  }
});

/**
 * 📊 GET USER INVESTMENTS
 * Retrieve investments for the authenticated user
 */
router.get('/my-investments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = db.collection('userInvestments').where('investorId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('metadata.createdAt', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));

    const snapshot = await query.get();
    const investments = [];

    for (const doc of snapshot.docs) {
      const investment = { id: doc.id, ...doc.data() };
      
      // Get opportunity details
      const opportunityDoc = await db.collection('investments').doc(investment.opportunityId).get();
      if (opportunityDoc.exists) {
        investment.opportunity = opportunityDoc.data();
      }

      investments.push(investment);
    }

    res.json({
      success: true,
      investments,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Get user investments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve investments'
    });
  }
});

/**
 * 📋 GET INVESTMENT DETAILS
 * Get detailed information about a specific investment
 */
router.get('/:investmentId', authenticateToken, async (req, res) => {
  try {
    const { investmentId } = req.params;
    const userId = req.user.uid;

    const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();

    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investment = investmentDoc.data();

    // Verify ownership
    if (investment.investorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get opportunity details
    const opportunityDoc = await db.collection('investments').doc(investment.opportunityId).get();
    if (opportunityDoc.exists) {
      investment.opportunity = opportunityDoc.data();
    }

    // Get business details
    if (investment.businessId) {
      const businessDoc = await db.collection('businesses').doc(investment.businessId).get();
      if (businessDoc.exists) {
        investment.business = businessDoc.data();
      }
    }

    res.json({
      success: true,
      investment: {
        id: investmentDoc.id,
        ...investment
      }
    });

  } catch (error) {
    console.error('Get investment details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve investment details'
    });
  }
});

/**
 * 📈 GET PORTFOLIO SUMMARY
 * Get user's investment portfolio summary
 */
router.get('/portfolio/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user investments
    const investmentsSnapshot = await db.collection('userInvestments')
      .where('investorId', '==', userId)
      .get();

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalReturn = 0;
    let activeInvestments = 0;
    const investmentsByStatus = {};
    const investmentsBySector = {};
    const investmentsByCountry = {};

    const investments = [];
    for (const doc of investmentsSnapshot.docs) {
      const investment = { id: doc.id, ...doc.data() };
      investments.push(investment);

      totalInvested += investment.amount || 0;
      
      if (investment.status === 'active') {
        activeInvestments++;
        totalCurrentValue += investment.currentValue || investment.amount;
      }

      // Group by status
      investmentsByStatus[investment.status] = 
        (investmentsByStatus[investment.status] || 0) + 1;

      // Get opportunity for sector/country data
      try {
        const opportunityDoc = await db.collection('investments').doc(investment.opportunityId).get();
        if (opportunityDoc.exists) {
          const opportunity = opportunityDoc.data();
          const sector = opportunity.business?.sector || 'Other';
          const country = opportunity.business?.country || 'Unknown';

          investmentsBySector[sector] = (investmentsBySector[sector] || 0) + investment.amount;
          investmentsByCountry[country] = (investmentsByCountry[country] || 0) + investment.amount;
        }
      } catch (err) {
        console.log('Error fetching opportunity for investment:', investment.id);
      }
    }

    totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const portfolioSummary = {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      returnPercentage,
      activeInvestments,
      totalInvestments: investments.length,
      investmentsByStatus,
      investmentsBySector,
      investmentsByCountry,
      performance: {
        bestPerforming: null, // Calculate if needed
        worstPerforming: null // Calculate if needed
      }
    };

    res.json({
      success: true,
      portfolio: portfolioSummary
    });

  } catch (error) {
    console.error('Get portfolio summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve portfolio summary'
    });
  }
});

module.exports = router;