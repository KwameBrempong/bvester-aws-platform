/**
 * BVESTER PRODUCTION PAYMENT ROUTES
 * Real money transaction processing with Stripe/Flutterwave integration
 * Enhanced security, compliance, and audit trail
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { PaymentProcessorService } = require('../paymentProcessor');
const { authenticateToken, requireUserType, requireVerification } = require('../../middleware/authMiddleware');
const admin = require('firebase-admin');
const winston = require('winston');
const crypto = require('crypto');

const router = express.Router();
const paymentService = new PaymentProcessorService();
const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/payment-routes.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// PAYMENT SECURITY - RATE LIMITING
// ============================================================================

// Strict rate limiting for payment operations
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 payment requests per windowMs
  message: {
    success: false,
    error: 'Too many payment attempts from this IP, please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many payment attempts from this IP, please try again later.',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

// Moderate rate limiting for wallet operations
const walletRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 wallet requests per windowMs
  message: {
    success: false,
    error: 'Too many wallet requests, please try again later.',
    code: 'WALLET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validatePaymentIntent = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR']).withMessage('Unsupported currency'),
  body('purpose').isIn(['investment', 'deposit', 'withdrawal']).withMessage('Invalid payment purpose'),
  body('paymentMethodId').optional().isString(),
  body('returnUrl').optional().isURL()
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum withdrawal amount is $10'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR']),
  body('bankAccount.accountNumber').isLength({ min: 8 }).withMessage('Invalid account number'),
  body('bankAccount.bankName').isLength({ min: 2 }).withMessage('Bank name required'),
  body('bankAccount.accountName').isLength({ min: 2 }).withMessage('Account name required'),
  body('reason').optional().isLength({ max: 500 })
];

/**
 * 💳 CREATE PAYMENT INTENT
 * Initialize payment for investments or subscriptions
 */
router.post('/intent', paymentRateLimit, requireVerification, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      type, // 'investment', 'subscription'
      amount,
      currency,
      paymentProvider = 'auto', // 'stripe', 'flutterwave', 'auto'
      businessId,
      opportunityId,
      subscriptionPlan,
      paymentMethodId
    } = req.body;

    // Validate required fields
    if (!type || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, amount, currency'
      });
    }

    // Get user profile for payment processing
    const userDoc = await db
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

    let paymentResult;

    if (type === 'investment') {
      // Validate investment-specific fields
      if (!businessId || !opportunityId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for investment: businessId, opportunityId'
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

      // Prepare investment payment data
      const paymentData = {
        type: 'investment',
        userId: userId,
        businessId: businessId,
        opportunityId: opportunityId,
        amount: amount,
        currency: currency,
        paymentMethodId: paymentMethodId,
        userEmail: userData.email,
        userName: userData.profile?.displayName,
        userPhone: userData.profile?.phoneNumber,
        userLocation: {
          country: userData.profile?.country
        },
        businessName: businessData.basicInfo?.businessName
      };

      paymentResult = await paymentService.processPayment(paymentData);

    } else if (type === 'subscription') {
      // Validate subscription-specific fields
      if (!subscriptionPlan || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for subscription: subscriptionPlan, paymentMethodId'
        });
      }

      paymentResult = await paymentService.createSubscription(userId, subscriptionPlan, paymentMethodId);
    }

    if (paymentResult.success) {
      res.json({
        success: true,
        payment: paymentResult,
        message: 'Payment intent created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error,
        errorCode: paymentResult.errorCode
      });
    }

  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * ✅ VERIFY PAYMENT
 * Verify payment completion
 */
router.post('/verify', paymentRateLimit, async (req, res) => {
  try {
    const { transactionId, provider, txRef } = req.body;

    if (!transactionId && !txRef) {
      return res.status(400).json({
        success: false,
        error: 'Either transactionId or txRef is required'
      });
    }

    let verificationResult;

    if (provider === 'flutterwave' && txRef) {
      verificationResult = await paymentService.verifyFlutterwavePayment(transactionId || txRef);
    } else if (provider === 'stripe' && transactionId) {
      verificationResult = await paymentService.verifyPayment(transactionId, provider);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment provider or missing required parameters'
      });
    }

    if (verificationResult.success) {
      res.json({
        success: true,
        verification: verificationResult,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: verificationResult.error
      });
    }

  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

/**
 * 📊 GET PAYMENT HISTORY
 * User's payment transaction history
 */
router.get('/history', walletRateLimit, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 20, type, status } = req.query;

    let query = db
      .collection('payments')
      .where('userId', '==', userId);

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply sorting and pagination
    query = query.orderBy('createdAt', 'desc');
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const payments = [];

    snapshot.forEach(doc => {
      const paymentData = doc.data();
      payments.push({
        id: doc.id,
        ...paymentData,
        // Remove sensitive data
        metadata: paymentData.metadata ? {
          ...paymentData.metadata,
          paymentMethodId: undefined
        } : undefined
      });
    });

    res.json({
      success: true,
      payments: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length,
        hasMore: payments.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

/**
 * 📄 GET PAYMENT DETAILS
 * Single payment transaction details
 */
router.get('/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.user.uid;

    const paymentDoc = await db
      .collection('payments')
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const paymentData = paymentDoc.data();

    // Check access permissions
    if (paymentData.userId !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      payment: {
        id: paymentId,
        ...paymentData,
        // Remove sensitive data for non-admin users
        metadata: req.user.userType === 'admin' ? paymentData.metadata : {
          ...paymentData.metadata,
          paymentMethodId: undefined
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
});

/**
 * 💰 PROCESS REFUND
 * Request payment refund
 */
router.post('/:id/refund', paymentRateLimit, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.user.uid;
    const { reason, amount } = req.body;

    // Get payment record
    const paymentDoc = await db
      .collection('payments')
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const paymentData = paymentDoc.data();

    // Check access permissions
    if (paymentData.userId !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if payment can be refunded
    if (paymentData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded'
      });
    }

    // Check if already refunded
    if (paymentData.refund?.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment has already been refunded'
      });
    }

    const refundAmount = amount || paymentData.amount;

    // Process refund
    const refundResult = await paymentService.processRefund(
      paymentData.transactionId || paymentData.txRef,
      paymentData.provider,
      refundAmount,
      reason || 'requested_by_user'
    );

    if (refundResult.success) {
      // Update payment record
      await db
        .collection('payments')
        .doc(paymentId)
        .update({
          'refund.status': 'processing',
          'refund.amount': refundAmount,
          'refund.reason': reason,
          'refund.requestedAt': new Date(),
          'refund.refundId': refundResult.refundId,
          'updatedAt': new Date()
        });

      // Log refund request
      await db
        .collection('activityLogs')
        .add({
          userId: userId,
          action: 'refund_requested',
          resource: { type: 'payment', id: paymentId },
          details: { amount: refundAmount, reason },
          timestamp: new Date()
        });

      res.json({
        success: true,
        refund: refundResult,
        message: 'Refund processed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: refundResult.error
      });
    }

  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

/**
 * 📈 GET PAYMENT ANALYTICS
 * User's payment analytics and insights
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { timeRange = '30d' } = req.query;

    // Calculate time range
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

    // Get payments within time range
    const paymentsQuery = await db
      .collection('payments')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startDate)
      .get();

    let totalAmount = 0;
    let totalTransactions = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let pendingTransactions = 0;
    const paymentMethods = {};
    const currencies = {};
    const monthlyData = {};

    paymentsQuery.forEach(doc => {
      const payment = doc.data();
      totalTransactions++;
      
      if (payment.status === 'completed') {
        totalAmount += payment.amount;
        successfulTransactions++;
      } else if (payment.status === 'failed') {
        failedTransactions++;
      } else if (payment.status === 'pending') {
        pendingTransactions++;
      }

      // Payment method breakdown
      const method = payment.provider || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;

      // Currency breakdown
      const currency = payment.currency || 'unknown';
      currencies[currency] = (currencies[currency] || 0) + payment.amount;

      // Monthly data
      const monthKey = payment.createdAt.toDate().toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      monthlyData[monthKey].amount += payment.amount;
      monthlyData[monthKey].count += 1;
    });

    const analytics = {
      summary: {
        totalAmount: totalAmount,
        totalTransactions: totalTransactions,
        successfulTransactions: successfulTransactions,
        failedTransactions: failedTransactions,
        pendingTransactions: pendingTransactions,
        successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
        averageTransactionAmount: successfulTransactions > 0 ? totalAmount / successfulTransactions : 0
      },
      breakdown: {
        byPaymentMethod: paymentMethods,
        byCurrency: currencies
      },
      trends: {
        monthly: monthlyData
      },
      timeRange: timeRange,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      analytics: analytics
    });

  } catch (error) {
    logger.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment analytics'
    });
  }
});

/**
 * 💳 GET SUPPORTED PAYMENT METHODS
 * Get available payment methods for user's location
 */
router.get('/methods/supported', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { country, currency } = req.query;

    // Get user profile for location if not provided
    let userCountry = country;
    let userCurrency = currency;

    if (!userCountry || !userCurrency) {
      const userDoc = await db
        .collection('users')
        .doc(userId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        userCountry = userCountry || userData.profile?.country;
        userCurrency = userCurrency || userData.profile?.preferredCurrency;
      }
    }

    // Get supported payment methods
    const supportedMethods = paymentService.getSupportedPaymentMethods(
      userCountry || 'US',
      userCurrency || 'USD'
    );

    res.json({
      success: true,
      paymentMethods: supportedMethods,
      country: userCountry,
      currency: userCurrency
    });

  } catch (error) {
    logger.error('Error fetching supported payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported payment methods'
    });
  }
});

/**
 * 🧮 CALCULATE PAYMENT FEES
 * Calculate fees for a payment
 */
router.post('/fees/calculate', async (req, res) => {
  try {
    const { amount, currency, provider = 'flutterwave' } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Amount and currency are required'
      });
    }

    const feeCalculation = paymentService.calculateFees(amount, currency, provider);

    res.json({
      success: true,
      fees: feeCalculation,
      provider: provider
    });

  } catch (error) {
    logger.error('Error calculating fees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fees'
    });
  }
});

module.exports = router;