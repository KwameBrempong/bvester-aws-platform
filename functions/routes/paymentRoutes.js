// Firebase Functions - Payment Routes
const express = require('express');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Flutterwave = require('flutterwave-node-v3');
const router = express.Router();

const db = admin.firestore();

// Initialize Flutterwave (conditional to avoid deployment errors)
let flw = null;
if (process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY) {
  flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
} else {
  console.warn('Flutterwave credentials not found. Flutterwave payments will be disabled.');
}

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

// Rate limiting for payments
const paymentRateLimit = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_PAYMENT_ATTEMPTS = 5;

const checkRateLimit = (req, res, next) => {
  const userId = req.user?.uid;
  const now = Date.now();
  
  if (!paymentRateLimit[userId]) {
    paymentRateLimit[userId] = { attempts: 0, windowStart: now };
  }
  
  const userLimit = paymentRateLimit[userId];
  
  // Reset window if expired
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    userLimit.attempts = 0;
    userLimit.windowStart = now;
  }
  
  if (userLimit.attempts >= MAX_PAYMENT_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many payment attempts. Please try again later.'
    });
  }
  
  userLimit.attempts++;
  next();
};

/**
 * 💳 CREATE STRIPE PAYMENT INTENT
 * Create a Stripe payment intent for investment
 */
router.post('/stripe/create-intent', authenticateToken, checkRateLimit, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'USD', 
      investmentId,
      automaticPaymentMethods = true 
    } = req.body;

    if (!amount || amount <= 0 || !investmentId) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount and investment ID are required'
      });
    }

    // Verify investment exists and belongs to user
    const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();
    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investment = investmentDoc.data();
    if (investment.investorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: automaticPaymentMethods
      },
      metadata: {
        investmentId: investmentId,
        userId: req.user.uid,
        platform: 'bvester'
      },
      description: `Investment in ${investment.opportunityId}`
    });

    // Log payment intent creation
    await db.collection('paymentLogs').add({
      userId: req.user.uid,
      investmentId: investmentId,
      paymentProcessor: 'stripe',
      action: 'intent_created',
      amount: amount,
      currency: currency,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      timestamp: new Date()
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * 🌍 CREATE FLUTTERWAVE PAYMENT
 * Initialize Flutterwave payment for African markets
 */
router.post('/flutterwave/initialize', authenticateToken, checkRateLimit, async (req, res) => {
  try {
    const {
      amount,
      currency = 'NGN',
      investmentId,
      customerEmail,
      customerPhone,
      customerName
    } = req.body;

    if (!amount || amount <= 0 || !investmentId || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount, investment ID, and customer email are required'
      });
    }

    // Verify investment
    const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();
    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investment = investmentDoc.data();
    if (investment.investorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Create unique transaction reference
    const txRef = `bvester_${investmentId}_${Date.now()}`;

    // Initialize Flutterwave payment
    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency,
      redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
      customer: {
        email: customerEmail,
        phonenumber: customerPhone,
        name: customerName
      },
      customizations: {
        title: "Bvester Investment",
        description: `Investment in ${investment.opportunityId}`,
        logo: "https://bizinvest-hub-prod.web.app/logo-icon.png"
      },
      meta: {
        investmentId: investmentId,
        userId: req.user.uid,
        platform: 'bvester'
      }
    };

    const response = await flw.StandardSubaccount.create(payload);

    if (response.status === 'success') {
      // Log payment initialization
      await db.collection('paymentLogs').add({
        userId: req.user.uid,
        investmentId: investmentId,
        paymentProcessor: 'flutterwave',
        action: 'payment_initialized',
        amount: amount,
        currency: currency,
        txRef: txRef,
        status: 'initialized',
        timestamp: new Date()
      });

      res.json({
        success: true,
        paymentLink: response.data.link,
        txRef: txRef
      });
    } else {
      throw new Error('Flutterwave initialization failed');
    }

  } catch (error) {
    console.error('Flutterwave payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment'
    });
  }
});

/**
 * ✅ VERIFY STRIPE PAYMENT
 * Verify Stripe payment completion
 */
router.post('/stripe/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (paymentIntent.status === 'succeeded') {
      // Update investment status
      const investmentId = paymentIntent.metadata.investmentId;
      await db.collection('userInvestments').doc(investmentId).update({
        status: 'active',
        paymentStatus: 'completed',
        paymentDetails: {
          processor: 'stripe',
          paymentIntentId: paymentIntentId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          completedAt: new Date()
        },
        'metadata.updatedAt': new Date()
      });

      // Update opportunity funding
      const investment = await db.collection('userInvestments').doc(investmentId).get();
      const investmentData = investment.data();
      
      await db.runTransaction(async (transaction) => {
        const opportunityRef = db.collection('investments').doc(investmentData.opportunityId);
        const opportunityDoc = await transaction.get(opportunityRef);
        
        if (opportunityDoc.exists) {
          const opportunity = opportunityDoc.data();
          const newRaisedAmount = (opportunity.fundingDetails.raisedAmount || 0) + investmentData.amount;
          
          transaction.update(opportunityRef, {
            'fundingDetails.raisedAmount': newRaisedAmount,
            'fundingDetails.investorCount': (opportunity.fundingDetails.investorCount || 0) + 1,
            'metadata.updatedAt': new Date()
          });
        }
      });

      // Log successful payment
      await db.collection('paymentLogs').add({
        userId: req.user.uid,
        investmentId: investmentId,
        paymentProcessor: 'stripe',
        action: 'payment_completed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        paymentIntentId: paymentIntentId,
        status: 'success',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        investment: {
          id: investmentId,
          status: 'active',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Stripe payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

/**
 * ✅ VERIFY FLUTTERWAVE PAYMENT
 * Verify Flutterwave payment completion
 */
router.post('/flutterwave/verify', authenticateToken, async (req, res) => {
  try {
    const { transactionId, txRef } = req.body;

    if (!transactionId || !txRef) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and reference are required'
      });
    }

    // Verify transaction with Flutterwave
    const response = await flw.Transaction.verify({ id: transactionId });

    if (response.status === 'success' && response.data.status === 'successful') {
      const transaction = response.data;
      
      // Extract investment ID from transaction reference
      const investmentId = transaction.tx_ref.split('_')[1];
      
      // Verify user owns the investment
      const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();
      if (!investmentDoc.exists || investmentDoc.data().investorId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Update investment status
      await db.collection('userInvestments').doc(investmentId).update({
        status: 'active',
        paymentStatus: 'completed',
        paymentDetails: {
          processor: 'flutterwave',
          transactionId: transactionId,
          txRef: txRef,
          amount: transaction.amount,
          currency: transaction.currency,
          completedAt: new Date()
        },
        'metadata.updatedAt': new Date()
      });

      // Update opportunity funding
      const investment = investmentDoc.data();
      
      await db.runTransaction(async (transaction) => {
        const opportunityRef = db.collection('investments').doc(investment.opportunityId);
        const opportunityDoc = await transaction.get(opportunityRef);
        
        if (opportunityDoc.exists) {
          const opportunity = opportunityDoc.data();
          const newRaisedAmount = (opportunity.fundingDetails.raisedAmount || 0) + investment.amount;
          
          transaction.update(opportunityRef, {
            'fundingDetails.raisedAmount': newRaisedAmount,
            'fundingDetails.investorCount': (opportunity.fundingDetails.investorCount || 0) + 1,
            'metadata.updatedAt': new Date()
          });
        }
      });

      // Log successful payment
      await db.collection('paymentLogs').add({
        userId: req.user.uid,
        investmentId: investmentId,
        paymentProcessor: 'flutterwave',
        action: 'payment_completed',
        amount: transaction.amount,
        currency: transaction.currency,
        transactionId: transactionId,
        txRef: txRef,
        status: 'success',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        investment: {
          id: investmentId,
          status: 'active',
          amount: transaction.amount,
          currency: transaction.currency
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        status: response.data.status
      });
    }

  } catch (error) {
    console.error('Flutterwave payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

/**
 * 📊 GET PAYMENT HISTORY
 * Retrieve user's payment history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 20, offset = 0 } = req.query;

    const snapshot = await db.collection('paymentLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const payments = [];
    snapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      payments,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: snapshot.size
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment history'
    });
  }
});

module.exports = router;