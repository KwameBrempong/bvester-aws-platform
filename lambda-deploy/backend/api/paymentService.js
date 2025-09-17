/**
 * BVESTER PLATFORM - PAYMENT SERVICE
 * Comprehensive payment processing for African markets
 * Generated: January 28, 2025
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class PaymentService {
  constructor() {
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    this.flutterwaveBaseUrl = 'https://api.flutterwave.com/v3';
    
    // Payment method configurations
    this.paymentMethods = {
      stripe: {
        name: 'Stripe',
        supportedCountries: ['US', 'UK', 'CA', 'AU', 'EU'],
        supportedCurrencies: ['USD', 'GBP', 'EUR', 'CAD', 'AUD'],
        fees: { percentage: 2.9, fixed: 30 } // 2.9% + $0.30
      },
      flutterwave: {
        name: 'Flutterwave',
        supportedCountries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'ZA', 'RW'],
        supportedCurrencies: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF'],
        fees: { percentage: 1.4, fixed: 0 } // 1.4% for African markets
      },
      paystack: {
        name: 'Paystack',
        supportedCountries: ['NG', 'GH', 'ZA'],
        supportedCurrencies: ['NGN', 'GHS', 'ZAR'],
        fees: { percentage: 1.5, fixed: 0 } // 1.5% for Nigeria
      }
    };
  }
  
  // ============================================================================
  // SUBSCRIPTION MANAGEMENT (STRIPE)
  // ============================================================================
  
  /**
   * Create subscription for user
   */
  async createSubscription(userId, plan, paymentMethodId) {
    try {
      // Get user profile to get email and info
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const user = userResult.user;
      
      // Create or get Stripe customer
      let customer = await this.getOrCreateStripeCustomer(user);
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      
      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      // Get price ID for plan
      const priceId = this.getStripePriceId(plan);
      if (!priceId) {
        return { success: false, error: 'Invalid subscription plan' };
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user subscription in Firestore
      await FirebaseService.updateUserProfile(userId, {
        'subscription.plan': plan,
        'subscription.status': subscription.status,
        'subscription.subscriptionId': subscription.id,
        'subscription.startDate': new Date(subscription.current_period_start * 1000),
        'subscription.endDate': new Date(subscription.current_period_end * 1000),
        'subscription.paymentMethod': 'stripe',
        'metadata.updatedAt': new Date()
      });
      
      // Log subscription creation
      await FirebaseService.logActivity(
        userId,
        'subscription_created',
        'subscription',
        subscription.id,
        { plan, amount: this.getSubscriptionPrice(plan) }
      );
      
      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, subscriptionId) {
    try {
      // Cancel subscription in Stripe
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Update user subscription status
      await FirebaseService.updateUserProfile(userId, {
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': new Date(),
        'metadata.updatedAt': new Date()
      });
      
      // Log cancellation
      await FirebaseService.logActivity(
        userId,
        'subscription_cancelled',
        'subscription',
        subscriptionId
      );
      
      // Send cancellation notification
      await FirebaseService.createNotification({
        userId: userId,
        type: 'subscription',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled and will end at the current period.',
        channels: { email: true, push: true }
      });
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAt: new Date(subscription.cancel_at * 1000)
        }
      };
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update subscription plan
   */
  async updateSubscription(userId, subscriptionId, newPlan) {
    try {
      const newPriceId = this.getStripePriceId(newPlan);
      if (!newPriceId) {
        return { success: false, error: 'Invalid subscription plan' };
      }
      
      // Get current subscription
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update subscription
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
      
      // Update user profile
      await FirebaseService.updateUserProfile(userId, {
        'subscription.plan': newPlan,
        'subscription.updatedAt': new Date(),
        'metadata.updatedAt': new Date()
      });
      
      // Log subscription update
      await FirebaseService.logActivity(
        userId,
        'subscription_updated',
        'subscription',
        subscriptionId,
        { oldPlan: currentSubscription.items.data[0].price.nickname, newPlan }
      );
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          plan: newPlan,
          status: subscription.status
        }
      };
      
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // AFRICAN PAYMENTS (FLUTTERWAVE)
  // ============================================================================
  
  /**
   * Process investment payment via Flutterwave
   */
  async processInvestmentPayment(investmentData) {
    try {
      const {
        userId,
        businessId,
        opportunityId,
        amount,
        currency,
        email,
        phoneNumber,
        fullName,
        paymentMethod = 'card' // card, bank_transfer, mobile_money
      } = investmentData;
      
      // Generate transaction reference
      const txRef = `BVESTER_INV_${Date.now()}_${userId.substr(-6)}`;
      
      // Prepare payment payload
      const payload = {
        tx_ref: txRef,
        amount: amount,
        currency: currency,
        redirect_url: `${process.env.APP_BASE_URL}/payment/callback`,
        customer: {
          email: email,
          phonenumber: phoneNumber,
          name: fullName
        },
        customizations: {
          title: 'Bvester Investment',
          description: `Investment in opportunity ${opportunityId}`,
          logo: `${process.env.APP_BASE_URL}/assets/logo.png`
        },
        meta: {
          userId: userId,
          businessId: businessId,
          opportunityId: opportunityId,
          type: 'investment'
        }
      };
      
      // Add payment method specific configurations
      if (paymentMethod === 'mobile_money') {
        payload.payment_options = 'mobilemoney';
      } else if (paymentMethod === 'bank_transfer') {
        payload.payment_options = 'banktransfer';
      } else {
        payload.payment_options = 'card';
      }
      
      // Make request to Flutterwave
      const response = await axios.post(
        `${this.flutterwaveBaseUrl}/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Store payment record
        await this.storePaymentRecord({
          txRef: txRef,
          userId: userId,
          amount: amount,
          currency: currency,
          provider: 'flutterwave',
          type: 'investment',
          status: 'pending',
          metadata: {
            businessId,
            opportunityId,
            paymentMethod
          }
        });
        
        // Log payment initiation
        await FirebaseService.logActivity(
          userId,
          'payment_initiated',
          'payment',
          txRef,
          { amount, currency, provider: 'flutterwave' }
        );
        
        return {
          success: true,
          paymentUrl: response.data.data.link,
          txRef: txRef,
          status: 'pending'
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment initialization failed'
        };
      }
      
    } catch (error) {
      console.error('Error processing Flutterwave payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  /**
   * Verify Flutterwave payment
   */
  async verifyFlutterwavePayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.flutterwaveBaseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const paymentData = response.data.data;
        
        // Update payment record
        await this.updatePaymentRecord(paymentData.tx_ref, {
          status: paymentData.status,
          transactionId: paymentData.id,
          paidAt: new Date(paymentData.created_at),
          verifiedAt: new Date()
        });
        
        // Process successful payment
        if (paymentData.status === 'successful') {
          await this.processSuccessfulPayment(paymentData);
        }
        
        return {
          success: true,
          status: paymentData.status,
          amount: paymentData.amount,
          currency: paymentData.currency,
          txRef: paymentData.tx_ref
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment verification failed'
        };
      }
      
    } catch (error) {
      console.error('Error verifying Flutterwave payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  // ============================================================================
  // MOBILE MONEY INTEGRATION
  // ============================================================================
  
  /**
   * Process mobile money payment
   */
  async processMobileMoneyPayment(paymentData) {
    try {
      const {
        userId,
        amount,
        currency,
        phoneNumber,
        provider, // mtn, airtel, mpesa
        country
      } = paymentData;
      
      const txRef = `BVESTER_MM_${Date.now()}_${userId.substr(-6)}`;
      
      let payload = {
        tx_ref: txRef,
        amount: amount,
        currency: currency,
        phone_number: phoneNumber,
        email: paymentData.email,
        redirect_url: `${process.env.APP_BASE_URL}/payment/callback`,
        meta: {
          userId: userId,
          type: 'mobile_money'
        }
      };
      
      // Provider-specific configurations
      switch (provider.toLowerCase()) {
        case 'mtn':
          payload.payment_options = 'mobilemoneymtn';
          break;
        case 'airtel':
          payload.payment_options = 'mobilemoneyairtel';
          break;
        case 'mpesa':
          payload.payment_options = 'mpesa';
          break;
        default:
          payload.payment_options = 'mobilemoney';
      }
      
      const response = await axios.post(
        `${this.flutterwaveBaseUrl}/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Store payment record
        await this.storePaymentRecord({
          txRef: txRef,
          userId: userId,
          amount: amount,
          currency: currency,
          provider: 'flutterwave',
          paymentMethod: 'mobile_money',
          status: 'pending',
          metadata: { mobileProvider: provider, phoneNumber }
        });
        
        return {
          success: true,
          txRef: txRef,
          status: 'pending',
          message: 'Please complete payment on your mobile device'
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Mobile money payment failed'
        };
      }
      
    } catch (error) {
      console.error('Error processing mobile money payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  // ============================================================================
  // PAYMENT UTILITIES
  // ============================================================================
  
  /**
   * Get or create Stripe customer
   */
  async getOrCreateStripeCustomer(user) {
    try {
      // Check if customer already exists
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        return customers.data[0];
      }
      
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.profile.displayName,
        phone: user.profile.phoneNumber,
        metadata: {
          userId: user.userId,
          userType: user.userType,
          country: user.profile.country
        }
      });
      
      return customer;
    } catch (error) {
      console.error('Error getting/creating Stripe customer:', error);
      throw error;
    }
  }
  
  /**
   * Get Stripe price ID for subscription plan
   */
  getStripePriceId(plan) {
    const priceIds = {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
    };
    
    return priceIds[plan.toLowerCase()];
  }
  
  /**
   * Get subscription price
   */
  getSubscriptionPrice(plan) {
    const prices = {
      basic: 0, // Free
      professional: 47,
      enterprise: 127
    };
    
    return prices[plan.toLowerCase()] || 0;
  }
  
  /**
   * Store payment record in Firestore
   */
  async storePaymentRecord(paymentData) {
    try {
      const record = {
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await FirebaseService.addDoc(
        FirebaseService.collection('payments'),
        record
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error storing payment record:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update payment record
   */
  async updatePaymentRecord(txRef, updates) {
    try {
      // Find payment record by txRef
      const paymentsQuery = FirebaseService.query(
        FirebaseService.collection('payments'),
        FirebaseService.where('txRef', '==', txRef)
      );
      
      const snapshot = await FirebaseService.getDocs(paymentsQuery);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await FirebaseService.updateDoc(doc.ref, {
          ...updates,
          updatedAt: new Date()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating payment record:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentData) {
    try {
      const { meta, amount, currency, tx_ref } = paymentData;
      
      if (meta.type === 'investment') {
        // Create investment record
        const investmentData = {
          opportunityId: meta.opportunityId,
          investorId: meta.userId,
          businessId: meta.businessId,
          transaction: {
            amount: amount,
            currency: currency,
            status: 'completed'
          },
          payment: {
            paymentMethod: 'flutterwave',
            paymentId: paymentData.id,
            paymentStatus: 'completed',
            paidAt: new Date(paymentData.created_at)
          }
        };
        
        await FirebaseService.createInvestment(investmentData);
        
        // Send success notification
        await FirebaseService.createNotification({
          userId: meta.userId,
          type: 'investment',
          title: 'Investment Successful!',
          message: `Your investment of ${currency} ${amount} has been processed successfully.`,
          channels: { email: true, push: true, sms: true }
        });
      }
      
      // Log successful payment
      await FirebaseService.logActivity(
        meta.userId,
        'payment_successful',
        'payment',
        tx_ref,
        { amount, currency, type: meta.type }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calculate payment fees
   */
  calculateFees(amount, currency, provider = 'flutterwave') {
    const method = this.paymentMethods[provider];
    if (!method) return { fees: 0, total: amount };
    
    const percentageFee = (amount * method.fees.percentage) / 100;
    const totalFees = percentageFee + method.fees.fixed;
    
    return {
      fees: Math.round(totalFees * 100) / 100,
      percentageFee: Math.round(percentageFee * 100) / 100,
      fixedFee: method.fees.fixed,
      total: Math.round((amount + totalFees) * 100) / 100
    };
  }
  
  /**
   * Get supported payment methods for country
   */
  getSupportedPaymentMethods(country, currency) {
    const supported = [];
    
    Object.keys(this.paymentMethods).forEach(provider => {
      const method = this.paymentMethods[provider];
      if (method.supportedCountries.includes(country) ||
          method.supportedCurrencies.includes(currency)) {
        supported.push({
          provider: provider,
          name: method.name,
          fees: method.fees
        });
      }
    });
    
    return supported;
  }
  
  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId, limit = 20) {
    try {
      const paymentsQuery = FirebaseService.query(
        FirebaseService.collection('payments'),
        FirebaseService.where('userId', '==', userId),
        FirebaseService.orderBy('createdAt', 'desc'),
        FirebaseService.limit(limit)
      );
      
      const snapshot = await FirebaseService.getDocs(paymentsQuery);
      const payments = [];
      
      snapshot.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, payments };
    } catch (error) {
      console.error('Error getting payment history:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PaymentService();