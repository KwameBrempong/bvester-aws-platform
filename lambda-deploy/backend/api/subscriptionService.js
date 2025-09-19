/**
 * BVESTER PLATFORM - SUBSCRIPTION MANAGEMENT SERVICE
 * Comprehensive subscription and billing management
 * Generated: January 28, 2025
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const FirebaseService = require('./firebaseService');
const PaymentService = require('./paymentService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class SubscriptionService {
  constructor() {
    // Subscription plans configuration
    this.plans = {
      basic: {
        name: 'Basic',
        price: 0, // Free
        currency: 'USD',
        interval: 'month',
        features: [
          'Basic business profile',
          'View investment opportunities',
          'Basic financial tracking',
          'Standard support'
        ],
        limits: {
          businessProfiles: 1,
          monthlyInvestments: 3,
          storageGB: 1,
          supportLevel: 'basic'
        }
      },
      professional: {
        name: 'Professional',
        price: 47,
        currency: 'USD',
        interval: 'month',
        features: [
          'Everything in Basic',
          'AI-powered matchmaking',
          'Advanced portfolio management',
          'ESG impact scoring',
          'Priority support',
          'Analytics dashboard'
        ],
        limits: {
          businessProfiles: 5,
          monthlyInvestments: 25,
          storageGB: 50,
          supportLevel: 'priority'
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 127,
        currency: 'USD',
        interval: 'month',
        features: [
          'Everything in Professional',
          'VR tours and live demos',
          'White-label solutions',
          'Custom integrations',
          'Dedicated account manager',
          'API access',
          'Advanced reporting'
        ],
        limits: {
          businessProfiles: -1, // Unlimited
          monthlyInvestments: -1, // Unlimited
          storageGB: 500,
          supportLevel: 'dedicated'
        }
      }
    };
  }
  
  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================
  
  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const user = userResult.user;
      const subscription = user.subscription || {};
      
      // Get plan details
      const planDetails = this.plans[subscription.plan] || this.plans.basic;
      
      // Check if subscription is active
      const isActive = this.isSubscriptionActive(subscription);
      
      // Get usage statistics
      const usage = await this.getUsageStatistics(userId);
      
      return {
        success: true,
        subscription: {
          ...subscription,
          planDetails,
          isActive,
          usage: usage.success ? usage.stats : null
        }
      };
      
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(userId, newPlan, paymentMethodId = null) {
    try {
      // Validate plan
      if (!this.plans[newPlan]) {
        return { success: false, error: 'Invalid subscription plan' };
      }
      
      const currentSub = await this.getCurrentSubscription(userId);
      if (!currentSub.success) {
        return currentSub;
      }
      
      const currentPlan = currentSub.subscription.plan || 'basic';
      
      // If upgrading to a paid plan
      if (newPlan !== 'basic' && this.plans[newPlan].price > 0) {
        if (!paymentMethodId) {
          return { success: false, error: 'Payment method required for paid plans' };
        }
        
        return await this.createPaidSubscription(userId, newPlan, paymentMethodId);
      }
      
      // If downgrading to basic (free)
      if (newPlan === 'basic') {
        return await this.downgradeToBasic(userId, currentSub.subscription);
      }
      
      // If changing between paid plans
      if (currentSub.subscription.subscriptionId) {
        return await PaymentService.updateSubscription(
          userId, 
          currentSub.subscription.subscriptionId, 
          newPlan
        );
      }
      
      return { success: false, error: 'Unable to process subscription change' };
      
    } catch (error) {
      console.error('Error changing subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create paid subscription
   */
  async createPaidSubscription(userId, plan, paymentMethodId) {
    try {
      const result = await PaymentService.createSubscription(userId, plan, paymentMethodId);
      
      if (result.success) {
        // Update user's plan immediately
        await FirebaseService.updateUserProfile(userId, {
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.upgradeDate': new Date(),
          'metadata.updatedAt': new Date()
        });
        
        // Log subscription change
        await FirebaseService.logActivity(
          userId,
          'subscription_upgraded',
          'subscription',
          result.subscriptionId,
          { plan, price: this.plans[plan].price }
        );
        
        // Send confirmation notification
        await FirebaseService.createNotification({
          userId: userId,
          type: 'subscription',
          title: 'Subscription Upgraded!',
          message: `You now have access to ${this.plans[plan].name} features.`,
          channels: { email: true, push: true }
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Error creating paid subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Downgrade to basic plan
   */
  async downgradeToBasic(userId, currentSubscription) {
    try {
      // Cancel current subscription if exists
      if (currentSubscription.subscriptionId) {
        await PaymentService.cancelSubscription(userId, currentSubscription.subscriptionId);
      }
      
      // Update to basic plan
      await FirebaseService.updateUserProfile(userId, {
        'subscription.plan': 'basic',
        'subscription.status': 'active',
        'subscription.downgradeDate': new Date(),
        'subscription.subscriptionId': null,
        'metadata.updatedAt': new Date()
      });
      
      // Log downgrade
      await FirebaseService.logActivity(
        userId,
        'subscription_downgraded',
        'subscription',
        null,
        { newPlan: 'basic', previousPlan: currentSubscription.plan }
      );
      
      // Send notification
      await FirebaseService.createNotification({
        userId: userId,
        type: 'subscription',
        title: 'Plan Changed',
        message: 'Your subscription has been changed to the Basic plan.',
        channels: { email: true, push: true }
      });
      
      return { success: true, plan: 'basic' };
      
    } catch (error) {
      console.error('Error downgrading to basic:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, reason = '') {
    try {
      const currentSub = await this.getCurrentSubscription(userId);
      if (!currentSub.success) {
        return currentSub;
      }
      
      const subscription = currentSub.subscription;
      
      if (subscription.subscriptionId) {
        const result = await PaymentService.cancelSubscription(userId, subscription.subscriptionId);
        if (!result.success) {
          return result;
        }
      }
      
      // Update subscription status
      await FirebaseService.updateUserProfile(userId, {
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': new Date(),
        'subscription.cancellationReason': reason,
        'metadata.updatedAt': new Date()
      });
      
      // Log cancellation
      await FirebaseService.logActivity(
        userId,
        'subscription_cancelled',
        'subscription',
        subscription.subscriptionId,
        { reason, plan: subscription.plan }
      );
      
      // Send cancellation survey (optional)
      await this.sendCancellationSurvey(userId, reason);
      
      return { success: true, message: 'Subscription cancelled successfully' };
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // USAGE TRACKING & LIMITS
  // ============================================================================
  
  /**
   * Get usage statistics for user
   */
  async getUsageStatistics(userId) {
    try {
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // Get usage data from Firestore
      const stats = {
        businessProfiles: 0,
        monthlyInvestments: 0,
        storageUsedGB: 0,
        apiCalls: 0,
        supportTickets: 0
      };
      
      // Count business profiles
      const businessQuery = FirebaseService.query(
        FirebaseService.collection('businesses'),
        FirebaseService.where('ownerId', '==', userId)
      );
      const businessSnapshot = await FirebaseService.getDocs(businessQuery);
      stats.businessProfiles = businessSnapshot.size;
      
      // Count monthly investments
      const investmentQuery = FirebaseService.query(
        FirebaseService.collection('investments'),
        FirebaseService.where('investorId', '==', userId),
        FirebaseService.where('metadata.createdAt', '>=', monthStart)
      );
      const investmentSnapshot = await FirebaseService.getDocs(investmentQuery);
      stats.monthlyInvestments = investmentSnapshot.size;
      
      // Get storage usage (placeholder - would be calculated from actual file sizes)
      stats.storageUsedGB = await this.calculateStorageUsage(userId);
      
      return { success: true, stats };
      
    } catch (error) {
      console.error('Error getting usage statistics:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if user can perform action based on plan limits
   */
  async checkUsageLimit(userId, action) {
    try {
      const currentSub = await this.getCurrentSubscription(userId);
      if (!currentSub.success) {
        return { allowed: false, error: 'Unable to verify subscription' };
      }
      
      const plan = currentSub.subscription.planDetails;
      const usage = currentSub.subscription.usage;
      
      if (!plan || !usage) {
        return { allowed: false, error: 'Plan or usage data not available' };
      }
      
      switch (action) {
        case 'create_business_profile':
          if (plan.limits.businessProfiles === -1) return { allowed: true };
          return {
            allowed: usage.businessProfiles < plan.limits.businessProfiles,
            limit: plan.limits.businessProfiles,
            current: usage.businessProfiles
          };
          
        case 'make_investment':
          if (plan.limits.monthlyInvestments === -1) return { allowed: true };
          return {
            allowed: usage.monthlyInvestments < plan.limits.monthlyInvestments,
            limit: plan.limits.monthlyInvestments,
            current: usage.monthlyInvestments
          };
          
        case 'upload_file':
          return {
            allowed: usage.storageUsedGB < plan.limits.storageGB,
            limit: plan.limits.storageGB,
            current: usage.storageUsedGB
          };
          
        default:
          return { allowed: true };
      }
      
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: false, error: error.message };
    }
  }
  
  /**
   * Calculate storage usage for user
   */
  async calculateStorageUsage(userId) {
    try {
      // This would integrate with your file storage system
      // For now, return a placeholder value
      return 0.5; // GB
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }
  
  // ============================================================================
  // BILLING & INVOICING
  // ============================================================================
  
  /**
   * Get billing history
   */
  async getBillingHistory(userId, limit = 20) {
    try {
      // Get payment history from PaymentService
      const paymentHistory = await PaymentService.getPaymentHistory(userId, limit);
      
      if (!paymentHistory.success) {
        return paymentHistory;
      }
      
      // Also get Stripe invoices if user has subscription
      const currentSub = await this.getCurrentSubscription(userId);
      let stripeInvoices = [];
      
      if (currentSub.success && currentSub.subscription.subscriptionId) {
        try {
          const invoices = await stripe.invoices.list({
            subscription: currentSub.subscription.subscriptionId,
            limit: limit
          });
          
          stripeInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: invoice.status,
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            invoiceUrl: invoice.hosted_invoice_url,
            type: 'subscription',
            provider: 'stripe'
          }));
        } catch (stripeError) {
          console.error('Error fetching Stripe invoices:', stripeError);
        }
      }
      
      // Combine and sort by date
      const allBilling = [...paymentHistory.payments, ...stripeInvoices]
        .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt))
        .slice(0, limit);
      
      return { success: true, billing: allBilling };
      
    } catch (error) {
      console.error('Error getting billing history:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate invoice for custom charges
   */
  async generateCustomInvoice(userId, items, dueDate = null) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return userResult;
      }
      
      const user = userResult.user;
      
      // Create Stripe customer if not exists
      const customer = await PaymentService.getOrCreateStripeCustomer(user);
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // Create invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: dueDate ? Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 30,
        description: 'Bvester Platform Custom Charges'
      });
      
      // Add invoice items
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          amount: Math.round(item.amount * 100), // Convert to cents
          currency: item.currency || 'USD',
          description: item.description
        });
      }
      
      // Finalize and send invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.sendInvoice(finalizedInvoice.id);
      
      // Log invoice creation
      await FirebaseService.logActivity(
        userId,
        'custom_invoice_created',
        'invoice',
        invoice.id,
        { totalAmount, itemCount: items.length }
      );
      
      return {
        success: true,
        invoice: {
          id: finalizedInvoice.id,
          amount: totalAmount,
          currency: items[0].currency || 'USD',
          status: finalizedInvoice.status,
          dueDate: new Date(finalizedInvoice.due_date * 1000),
          invoiceUrl: finalizedInvoice.hosted_invoice_url
        }
      };
      
    } catch (error) {
      console.error('Error generating custom invoice:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Check if subscription is active
   */
  isSubscriptionActive(subscription) {
    if (!subscription || subscription.status === 'cancelled') {
      return false;
    }
    
    if (subscription.plan === 'basic') {
      return true; // Basic is always active
    }
    
    if (subscription.endDate) {
      return new Date() < new Date(subscription.endDate);
    }
    
    return subscription.status === 'active';
  }
  
  /**
   * Get plan comparison data
   */
  getPlanComparison() {
    return {
      success: true,
      plans: this.plans
    };
  }
  
  /**
   * Send cancellation survey
   */
  async sendCancellationSurvey(userId, reason) {
    try {
      await FirebaseService.createNotification({
        userId: userId,
        type: 'survey',
        title: 'Help Us Improve',
        message: 'We\'d love to hear why you cancelled your subscription. Your feedback helps us improve.',
        data: {
          surveyType: 'cancellation',
          reason: reason
        },
        channels: { email: true }
      });
    } catch (error) {
      console.error('Error sending cancellation survey:', error);
    }
  }
  
  /**
   * Check for subscription renewals
   */
  async checkSubscriptionRenewals() {
    try {
      // This would be called by a scheduled job
      // Check for subscriptions ending soon and send reminders
      
      const endingSoon = new Date();
      endingSoon.setDate(endingSoon.getDate() + 7); // 7 days from now
      
      // Query subscriptions ending soon
      // Implementation would depend on your database structure
      
      console.log('Checking subscription renewals...');
      
    } catch (error) {
      console.error('Error checking subscription renewals:', error);
    }
  }
  
  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      const analytics = {
        totalSubscribers: 0,
        planDistribution: {
          basic: 0,
          professional: 0,
          enterprise: 0
        },
        monthlyRecurringRevenue: 0,
        churnRate: 0,
        averageRevenuePerUser: 0
      };
      
      // Calculate analytics from user data
      // This would involve complex queries across your user base
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SubscriptionService();