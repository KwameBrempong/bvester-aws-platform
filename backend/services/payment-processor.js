// Production Payment Processing System for Bvester
// Handles Stripe payments, escrow, refunds, and financial compliance

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EventEmitter = require('events');

class PaymentProcessor extends EventEmitter {
  constructor() {
    super();
    this.stripe = stripe;
    this.escrowAccounts = new Map();
    this.paymentMethods = new Map();
    this.transactionLog = [];
    this.initialize();
  }

  async initialize() {
    console.log('💳 Payment Processor initializing with Stripe...');
    
    // Verify Stripe connection
    try {
      const balance = await this.stripe.balance.retrieve();
      console.log('✅ Stripe connected successfully');
      console.log(`💰 Available balance: ${this.formatCurrency(balance.available[0].amount)}`);
    } catch (error) {
      console.error('❌ Stripe connection failed:', error.message);
      throw new Error('Payment system initialization failed');
    }

    // Setup webhook endpoints
    this.setupWebhooks();
  }

  // Create a new customer
  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        metadata: {
          userId: userData.id,
          accountType: userData.accountType,
          kycStatus: userData.kycStatus || 'pending'
        }
      });

      return {
        success: true,
        customerId: customer.id,
        customer
      };
    } catch (error) {
      console.error('Customer creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create connected account for businesses (Stripe Connect)
  async createConnectedAccount(businessData) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: businessData.country || 'US',
        email: businessData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: businessData.type || 'company',
        company: {
          name: businessData.companyName,
          tax_id: businessData.taxId
        },
        metadata: {
          businessId: businessData.id,
          platform: 'bvester'
        }
      });

      // Generate account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/reauth`,
        return_url: `${process.env.FRONTEND_URL}/onboarding-complete`,
        type: 'account_onboarding'
      });

      return {
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
        account
      };
    } catch (error) {
      console.error('Connected account creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process investment payment with escrow
  async processInvestment(investmentData) {
    try {
      const {
        investorId,
        businessId,
        amount,
        currency = 'USD',
        paymentMethodId,
        description
      } = investmentData;

      // Validate investment limits
      const validation = await this.validateInvestmentLimits(investorId, amount);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.message
        };
      }

      // Create payment intent with escrow hold
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: investorId,
        payment_method: paymentMethodId,
        description: description || `Investment in ${businessId}`,
        metadata: {
          investorId,
          businessId,
          type: 'investment',
          escrow: 'true'
        },
        capture_method: 'manual', // Hold funds in escrow
        confirm: true,
        application_fee_amount: Math.round(amount * 0.025 * 100), // 2.5% platform fee
        transfer_data: {
          destination: businessId // Connected account ID
        }
      });

      // Create escrow record
      this.createEscrowRecord({
        paymentIntentId: paymentIntent.id,
        investorId,
        businessId,
        amount,
        status: 'held',
        createdAt: new Date()
      });

      // Log transaction
      this.logTransaction({
        type: 'investment',
        paymentIntentId: paymentIntent.id,
        amount,
        status: paymentIntent.status,
        timestamp: new Date()
      });

      this.emit('investmentProcessed', {
        investorId,
        businessId,
        amount,
        paymentIntentId: paymentIntent.id
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        escrowStatus: 'held'
      };
    } catch (error) {
      console.error('Investment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Release escrow funds
  async releaseEscrow(escrowId, releaseData) {
    try {
      const escrow = this.escrowAccounts.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow account not found');
      }

      // Capture the payment
      const paymentIntent = await this.stripe.paymentIntents.capture(
        escrow.paymentIntentId
      );

      // Update escrow status
      escrow.status = 'released';
      escrow.releasedAt = new Date();
      escrow.releaseReason = releaseData.reason;

      // Create transfer to business
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(escrow.amount * 0.975 * 100), // After platform fee
        currency: 'usd',
        destination: escrow.businessId,
        metadata: {
          escrowId,
          investorId: escrow.investorId,
          releaseReason: releaseData.reason
        }
      });

      this.emit('escrowReleased', {
        escrowId,
        businessId: escrow.businessId,
        amount: escrow.amount,
        transferId: transfer.id
      });

      return {
        success: true,
        transferId: transfer.id,
        status: 'released'
      };
    } catch (error) {
      console.error('Escrow release error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const {
        paymentIntentId,
        amount,
        reason,
        metadata
      } = refundData;

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
        reason: reason || 'requested_by_customer',
        metadata: metadata || {}
      });

      // Update escrow if exists
      const escrow = Array.from(this.escrowAccounts.values())
        .find(e => e.paymentIntentId === paymentIntentId);
      
      if (escrow) {
        escrow.status = 'refunded';
        escrow.refundedAt = new Date();
      }

      this.logTransaction({
        type: 'refund',
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        timestamp: new Date()
      });

      this.emit('refundProcessed', {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription for premium features
  async createSubscription(subscriptionData) {
    try {
      const {
        customerId,
        priceId,
        paymentMethodId,
        trialDays = 0
      } = subscriptionData;

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          platform: 'bvester'
        }
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate investment limits
  async validateInvestmentLimits(investorId, amount) {
    // Check regulatory limits
    const annualLimit = 107000; // Reg CF limit for non-accredited
    const investmentLimit = await this.calculateInvestmentLimit(investorId);

    if (amount > investmentLimit) {
      return {
        valid: false,
        message: `Investment exceeds your annual limit of ${this.formatCurrency(investmentLimit)}`
      };
    }

    // Check minimum investment
    if (amount < 100) {
      return {
        valid: false,
        message: 'Minimum investment amount is $100'
      };
    }

    return {
      valid: true,
      remainingLimit: investmentLimit - amount
    };
  }

  // Calculate investment limit based on income/net worth
  async calculateInvestmentLimit(investorId) {
    // This would fetch from KYC data
    // Simplified for now
    const isAccredited = false; // Would check accreditation status
    
    if (isAccredited) {
      return Number.MAX_SAFE_INTEGER; // No limit for accredited
    }

    // Reg CF limits for non-accredited
    const annualIncome = 50000; // Would fetch from KYC
    const netWorth = 100000; // Would fetch from KYC

    const greater = Math.max(annualIncome, netWorth);
    
    if (greater < 107000) {
      return Math.max(2200, greater * 0.05); // 5% of greater
    } else {
      return greater * 0.10; // 10% of greater
    }
  }

  // Create escrow record
  createEscrowRecord(escrowData) {
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.escrowAccounts.set(escrowId, {
      id: escrowId,
      ...escrowData
    });
    return escrowId;
  }

  // Setup webhook handlers
  setupWebhooks() {
    // This would be called from the main server file
    // to handle Stripe webhooks
    console.log('Webhook endpoints configured');
  }

  // Handle webhook events
  async handleWebhook(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'account.updated':
        await this.handleAccountUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent) {
    this.emit('paymentSuccess', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      customerId: paymentIntent.customer
    });

    // Update database, send notifications, etc.
    console.log(`Payment successful: ${paymentIntent.id}`);
  }

  // Handle failed payment
  async handlePaymentFailure(paymentIntent) {
    this.emit('paymentFailure', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message
    });

    console.error(`Payment failed: ${paymentIntent.id}`);
  }

  // Handle account update
  async handleAccountUpdate(account) {
    console.log(`Account updated: ${account.id}`);
    // Update business verification status
  }

  // Handle subscription cancellation
  async handleSubscriptionCanceled(subscription) {
    this.emit('subscriptionCanceled', {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });
  }

  // Generate financial reports
  async generateFinancialReport(startDate, endDate) {
    try {
      // Fetch transactions from Stripe
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const transfers = await this.stripe.transfers.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const report = {
        period: {
          start: startDate,
          end: endDate
        },
        totalRevenue: charges.data.reduce((sum, charge) => sum + charge.amount, 0) / 100,
        totalTransfers: transfers.data.reduce((sum, transfer) => sum + transfer.amount, 0) / 100,
        transactionCount: charges.data.length,
        platformFees: charges.data.reduce((sum, charge) => 
          sum + (charge.application_fee_amount || 0), 0) / 100,
        transactions: charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount / 100,
          fee: charge.application_fee_amount / 100,
          status: charge.status,
          created: new Date(charge.created * 1000)
        }))
      };

      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  // Get payout schedule
  async getPayoutSchedule(accountId) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        interval: account.settings?.payouts?.schedule?.interval,
        delay: account.settings?.payouts?.schedule?.delay_days,
        nextPayout: account.settings?.payouts?.schedule?.weekly_anchor ||
                   account.settings?.payouts?.schedule?.monthly_anchor
      };
    } catch (error) {
      console.error('Payout schedule error:', error);
      return null;
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100);
  }

  // Log transaction
  logTransaction(transaction) {
    this.transactionLog.push({
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // In production, this would also save to database
    console.log(`Transaction logged: ${transaction.type} - ${transaction.amount}`);
  }

  // Get transaction history
  async getTransactionHistory(customerId, limit = 10) {
    try {
      const charges = await this.stripe.charges.list({
        customer: customerId,
        limit
      });

      return charges.data.map(charge => ({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency,
        status: charge.status,
        description: charge.description,
        created: new Date(charge.created * 1000)
      }));
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  }

  // Create checkout session for one-time payments
  async createCheckoutSession(sessionData) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: sessionData.items,
        mode: sessionData.mode || 'payment',
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        customer: sessionData.customerId,
        metadata: sessionData.metadata || {}
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Checkout session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentProcessor;