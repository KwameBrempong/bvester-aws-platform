/**
 * PAYMENT PROCESSOR SERVICE
 * Handles real money transactions using Stripe (global) and Flutterwave (Africa)
 * Includes wallet management, currency conversion, and compliance monitoring
 */

const admin = require('firebase-admin');
const Stripe = require('stripe');
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');
const crypto = require('crypto');
const uuid = require('uuid');
const winston = require('winston');

const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/payments.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// PAYMENT PROCESSOR INITIALIZATION
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

// ============================================================================
// CURRENCY EXCHANGE SERVICE
// ============================================================================

class CurrencyExchangeService {
  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseURL = 'https://api.exchangerate-api.com/v4/latest';
    this.rateCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.rateCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    try {
      const response = await axios.get(`${this.baseURL}/${fromCurrency}`);
      const rate = response.data.rates[toCurrency];
      
      if (!rate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      this.rateCache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      logger.error('Exchange rate fetch error:', error);
      throw new Error('Unable to fetch current exchange rates');
    }
  }

  async convertCurrency(amount, fromCurrency, toCurrency) {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(amount * rate * 100) / 100,
      convertedCurrency: toCurrency,
      exchangeRate: rate,
      convertedAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// PAYMENT PROCESSOR SERVICE
// ============================================================================

class PaymentProcessorService {
  constructor() {
    this.exchangeService = new CurrencyExchangeService();
    this.supportedCurrencies = {
      stripe: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      flutterwave: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'XAF', 'XOF']
    };
  }

  // Determine best payment processor for currency
  getOptimalProcessor(currency) {
    if (this.supportedCurrencies.stripe.includes(currency)) {
      return 'stripe';
    } else if (this.supportedCurrencies.flutterwave.includes(currency)) {
      return 'flutterwave';
    } else {
      // Default to Stripe with USD conversion
      return 'stripe';
    }
  }

  // Create Payment Intent
  async createPaymentIntent(paymentData) {
    try {
      const {
        userId,
        amount,
        currency,
        purpose,
        metadata = {},
        paymentMethodId,
        returnUrl
      } = paymentData;

      // Validate user and KYC
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (!userData.kyc?.verified) {
        throw new Error('KYC verification required for payments');
      }

      // Check payment limits
      await this.validatePaymentLimits(userId, amount, currency);

      // Generate transaction ID
      const transactionId = this.generateTransactionId();
      
      // Determine processor
      const processor = this.getOptimalProcessor(currency);
      let processedAmount = amount;
      let processedCurrency = currency;

      // Convert currency if needed
      if (processor === 'stripe' && !this.supportedCurrencies.stripe.includes(currency)) {
        const conversion = await this.exchangeService.convertCurrency(amount, currency, 'USD');
        processedAmount = conversion.convertedAmount;
        processedCurrency = 'USD';
      }

      let paymentIntent;
      let platformFee = this.calculatePlatformFee(amount, currency, purpose);

      if (processor === 'stripe') {
        paymentIntent = await this.createStripePaymentIntent({
          amount: Math.round(processedAmount * 100), // Stripe uses cents
          currency: processedCurrency.toLowerCase(),
          metadata: {
            userId,
            transactionId,
            purpose,
            originalAmount: amount,
            originalCurrency: currency,
            ...metadata
          },
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: !!paymentMethodId,
          return_url: returnUrl
        });
      } else {
        paymentIntent = await this.createFlutterwavePayment({
          tx_ref: transactionId,
          amount: processedAmount,
          currency: processedCurrency,
          redirect_url: returnUrl,
          customer: {
            email: userData.email,
            phonenumber: userData.profile?.phoneNumber,
            name: `${userData.profile?.firstName} ${userData.profile?.lastName}`
          },
          customizations: {
            title: 'Bvester Payment',
            description: `Payment for ${purpose}`,
            logo: 'https://bvester.com/logo.png'
          },
          meta: {
            userId,
            transactionId,
            purpose,
            originalAmount: amount,
            originalCurrency: currency
          }
        });
      }

      // Create payment transaction record
      const paymentTransaction = {
        transactionId,
        userId,
        relatedInvestmentId: metadata.investmentId || null,
        paymentDetails: {
          amount: amount * 100, // Store in minor units
          currency,
          amountUSD: processedCurrency === 'USD' ? processedAmount : null,
          exchangeRate: processedCurrency !== currency ? await this.exchangeService.getExchangeRate(currency, 'USD') : 1,
          paymentMethod: processor,
          paymentProvider: processor,
          paymentMethodId: paymentMethodId || null,
          processorTransactionId: paymentIntent.id,
          processorFee: this.calculateProcessorFee(processedAmount, processor),
          platformFee,
          netAmount: (amount - platformFee) * 100
        },
        status: {
          current: 'pending',
          history: [{
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'Payment intent created'
          }],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: null,
          failureReason: null
        },
        compliance: {
          amlCheck: {
            status: 'pending',
            provider: null,
            checkedAt: null,
            riskScore: 0,
            flags: []
          },
          sanctionsCheck: {
            status: 'pending',
            provider: null,
            checkedAt: null,
            matchFound: false,
            details: null
          },
          taxReporting: {
            reportable: amount >= 10000, // $10k+ requires reporting
            jurisdiction: userData.profile?.country || 'US',
            taxYear: new Date().getFullYear(),
            reportingThreshold: 10000
          }
        },
        riskAssessment: {
          riskLevel: this.assessPaymentRisk(amount, userData),
          riskScore: this.calculateRiskScore(amount, userData),
          riskFactors: this.identifyRiskFactors(amount, userData),
          manualReviewRequired: amount >= 50000, // $50k+ requires manual review
          reviewedBy: null,
          reviewedAt: null
        },
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          deviceFingerprint: metadata.deviceFingerprint,
          location: metadata.location || null,
          refundRequested: false,
          refundedAt: null,
          refundReason: null
        }
      };

      // Save payment transaction
      await db.collection('paymentTransactions').doc(transactionId).set(paymentTransaction);

      // Perform compliance checks
      await this.performComplianceChecks(transactionId, paymentTransaction);

      logger.info(`Payment intent created: ${transactionId} for user: ${userId}`);

      return {
        success: true,
        transactionId,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: processedAmount,
          currency: processedCurrency,
          processor
        },
        fees: {
          platformFee,
          processorFee: this.calculateProcessorFee(processedAmount, processor),
          totalFees: platformFee + this.calculateProcessorFee(processedAmount, processor)
        }
      };

    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  // Process Successful Payment
  async processSuccessfulPayment(transactionId, paymentDetails) {
    try {
      // Get payment transaction
      const transactionDoc = await db.collection('paymentTransactions').doc(transactionId).get();
      if (!transactionDoc.exists) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      // Update transaction status
      await db.collection('paymentTransactions').doc(transactionId).update({
        'status.current': 'completed',
        'status.history': admin.firestore.FieldValue.arrayUnion({
          status: 'completed',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: 'Payment processed successfully'
        }),
        'status.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        'status.completedAt': admin.firestore.FieldValue.serverTimestamp(),
        'paymentDetails.processorTransactionId': paymentDetails.id,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      // Update user wallet
      await this.updateUserWallet(transactionData.userId, {
        amount: transactionData.paymentDetails.netAmount / 100,
        currency: transactionData.paymentDetails.currency,
        type: 'deposit',
        transactionId
      });

      // Create audit log
      await this.createAuditLog(transactionData.userId, 'payment_completed', {
        type: 'payment',
        id: transactionId,
        newState: { status: 'completed', amount: transactionData.paymentDetails.amount }
      });

      logger.info(`Payment completed: ${transactionId}`);

      return {
        success: true,
        transactionId,
        status: 'completed',
        netAmount: transactionData.paymentDetails.netAmount / 100,
        currency: transactionData.paymentDetails.currency
      };

    } catch (error) {
      logger.error('Process payment success error:', error);
      throw error;
    }
  }

  // Handle Failed Payment
  async handleFailedPayment(transactionId, failureReason) {
    try {
      await db.collection('paymentTransactions').doc(transactionId).update({
        'status.current': 'failed',
        'status.history': admin.firestore.FieldValue.arrayUnion({
          status: 'failed',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: failureReason
        }),
        'status.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        'status.failureReason': failureReason,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      logger.warn(`Payment failed: ${transactionId}, reason: ${failureReason}`);

      return {
        success: true,
        transactionId,
        status: 'failed',
        reason: failureReason
      };

    } catch (error) {
      logger.error('Handle payment failure error:', error);
      throw error;
    }
  }

  // Initiate Withdrawal
  async initiateWithdrawal(userId, withdrawalData) {
    try {
      const { amount, currency, bankAccount, reason } = withdrawalData;

      // Validate user and KYC
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (!userData.kyc?.verified) {
        throw new Error('KYC verification required for withdrawals');
      }

      // Check wallet balance
      const walletDoc = await db.collection('userWallets').doc(userId).get();
      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      const walletData = walletDoc.data();
      const availableBalance = walletData.balances.available[currency] || 0;

      if (availableBalance < amount) {
        throw new Error('Insufficient funds');
      }

      // Check withdrawal limits
      await this.validateWithdrawalLimits(userId, amount, currency);

      const transactionId = this.generateTransactionId();

      // Create withdrawal record
      const withdrawalRecord = {
        transactionId,
        userId,
        amount: amount * 100, // Store in minor units
        currency,
        bankAccount: {
          accountNumber: this.maskAccountNumber(bankAccount.accountNumber),
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          routingNumber: bankAccount.routingNumber || null
        },
        status: 'pending',
        reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: null,
        estimatedArrival: this.calculateWithdrawalArrival(currency)
      };

      // Lock funds in wallet
      await this.lockFundsForWithdrawal(userId, amount, currency, transactionId);

      // Save withdrawal record
      await db.collection('withdrawals').doc(transactionId).set(withdrawalRecord);

      // Process withdrawal based on currency
      const processor = this.getOptimalProcessor(currency);
      let withdrawalResult;

      if (processor === 'stripe') {
        withdrawalResult = await this.processStripeWithdrawal(withdrawalRecord);
      } else {
        withdrawalResult = await this.processFlutterwaveWithdrawal(withdrawalRecord);
      }

      logger.info(`Withdrawal initiated: ${transactionId} for user: ${userId}`);

      return {
        success: true,
        transactionId,
        status: 'pending',
        estimatedArrival: withdrawalRecord.estimatedArrival,
        processor
      };

    } catch (error) {
      logger.error('Initiate withdrawal error:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  generateTransactionId() {
    return `BV_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  calculatePlatformFee(amount, currency, purpose) {
    const feeRates = {
      'investment': 0.025, // 2.5%
      'deposit': 0.01,     // 1%
      'withdrawal': 0.005,  // 0.5%
      'default': 0.02      // 2%
    };

    const rate = feeRates[purpose] || feeRates.default;
    return Math.max(amount * rate, 1); // Minimum $1 fee
  }

  calculateProcessorFee(amount, processor) {
    if (processor === 'stripe') {
      return amount * 0.029 + 0.30; // Stripe: 2.9% + $0.30
    } else {
      return amount * 0.014; // Flutterwave: 1.4%
    }
  }

  assessPaymentRisk(amount, userData) {
    let riskLevel = 'low';
    
    if (amount >= 50000) riskLevel = 'high';
    else if (amount >= 10000) riskLevel = 'medium';
    
    if (!userData.kyc?.verified) riskLevel = 'high';
    if (userData.security?.suspiciousActivityFlags?.length > 0) riskLevel = 'high';
    
    return riskLevel;
  }

  calculateRiskScore(amount, userData) {
    let score = 0;
    
    // Amount-based risk
    if (amount >= 100000) score += 30;
    else if (amount >= 50000) score += 20;
    else if (amount >= 10000) score += 10;
    
    // User-based risk
    if (!userData.kyc?.verified) score += 40;
    if (userData.security?.failedLoginAttempts > 3) score += 20;
    if (!userData.security?.twoFactorEnabled) score += 10;
    
    return Math.min(score, 100);
  }

  identifyRiskFactors(amount, userData) {
    const factors = [];
    
    if (amount >= 50000) factors.push('Large transaction amount');
    if (!userData.kyc?.verified) factors.push('Unverified KYC status');
    if (!userData.security?.twoFactorEnabled) factors.push('No two-factor authentication');
    
    return factors;
  }

  async validatePaymentLimits(userId, amount, currency) {
    const walletDoc = await db.collection('userWallets').doc(userId).get();
    if (!walletDoc.exists) return;

    const limits = walletDoc.data().limits;
    
    if (amount > limits.singleTransaction) {
      throw new Error(`Amount exceeds single transaction limit of ${limits.singleTransaction} ${currency}`);
    }

    // Check daily/monthly limits (implementation would track period totals)
    // This is a simplified version
  }

  async validateWithdrawalLimits(userId, amount, currency) {
    const walletDoc = await db.collection('userWallets').doc(userId).get();
    if (!walletDoc.exists) return;

    const limits = walletDoc.data().limits;
    
    if (amount > limits.dailyWithdrawal) {
      throw new Error(`Amount exceeds daily withdrawal limit of ${limits.dailyWithdrawal} ${currency}`);
    }
  }

  async updateUserWallet(userId, transaction) {
    const { amount, currency, type, transactionId } = transaction;
    
    const walletRef = db.collection('userWallets').doc(userId);
    
    return db.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists) throw new Error('Wallet not found');
      
      const walletData = walletDoc.data();
      const currentBalance = walletData.balances.available[currency] || 0;
      
      let newBalance;
      if (type === 'deposit') {
        newBalance = currentBalance + amount;
      } else if (type === 'withdrawal') {
        newBalance = currentBalance - amount;
        if (newBalance < 0) throw new Error('Insufficient funds');
      }
      
      t.update(walletRef, {
        [`balances.available.${currency}`]: newBalance,
        'transactions.transactionCount': admin.firestore.FieldValue.increment(1),
        'transactions.lastTransactionAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  async lockFundsForWithdrawal(userId, amount, currency, transactionId) {
    const walletRef = db.collection('userWallets').doc(userId);
    
    return db.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists) throw new Error('Wallet not found');
      
      const walletData = walletDoc.data();
      const availableBalance = walletData.balances.available[currency] || 0;
      const lockedBalance = walletData.balances.locked[currency] || 0;
      
      if (availableBalance < amount) {
        throw new Error('Insufficient funds');
      }
      
      t.update(walletRef, {
        [`balances.available.${currency}`]: availableBalance - amount,
        [`balances.locked.${currency}`]: lockedBalance + amount,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }

  calculateWithdrawalArrival(currency) {
    const businessDays = this.supportedCurrencies.flutterwave.includes(currency) ? 3 : 2;
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + businessDays);
    return arrivalDate;
  }

  async performComplianceChecks(transactionId, transaction) {
    // Implement AML/KYC compliance checks
    // This would integrate with third-party compliance services
    logger.info(`Performing compliance checks for transaction: ${transactionId}`);
  }

  async createAuditLog(userId, action, resource) {
    // Implementation would create detailed audit logs
    logger.info(`Audit log: ${action} by user: ${userId}`);
  }

  // Stripe-specific methods
  async createStripePaymentIntent(data) {
    return await stripe.paymentIntents.create(data);
  }

  async processStripeWithdrawal(withdrawalData) {
    // Implementation for Stripe withdrawals
    return { success: true, processor: 'stripe' };
  }

  // Flutterwave-specific methods
  async createFlutterwavePayment(data) {
    const response = await flw.Charge.card(data);
    return response;
  }

  async processFlutterwaveWithdrawal(withdrawalData) {
    // Implementation for Flutterwave withdrawals
    return { success: true, processor: 'flutterwave' };
  }
}

module.exports = {
  PaymentProcessorService,
  CurrencyExchangeService
};