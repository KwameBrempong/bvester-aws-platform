/**
 * BVESTER PLATFORM - PAYMENT TRACKING SERVICE
 * Real-time payment status monitoring and management
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const axios = require('axios');

class PaymentTrackerService {
  constructor() {
    this.paymentStatuses = {
      pending: 'Payment initiated, awaiting completion',
      processing: 'Payment is being processed',
      completed: 'Payment completed successfully',
      failed: 'Payment failed',
      cancelled: 'Payment cancelled by user',
      refunded: 'Payment refunded',
      disputed: 'Payment disputed/chargeback',
      expired: 'Payment session expired'
    };
    
    this.providers = {
      stripe: 'Stripe',
      flutterwave: 'Flutterwave',
      paystack: 'Paystack',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Bank Transfer'
    };
  }
  
  // ============================================================================
  // PAYMENT TRACKING
  // ============================================================================
  
  /**
   * Create payment tracking record
   */
  async createPaymentTracker(paymentData) {
    try {
      const tracker = {
        trackerId: this.generateTrackerId(),
        userId: paymentData.userId,
        type: paymentData.type, // 'subscription', 'investment', 'fee'
        provider: paymentData.provider,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'pending',
        
        // Payment details
        txRef: paymentData.txRef,
        externalId: paymentData.externalId || null,
        paymentMethod: paymentData.paymentMethod,
        
        // Related entities
        businessId: paymentData.businessId || null,
        opportunityId: paymentData.opportunityId || null,
        subscriptionId: paymentData.subscriptionId || null,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: paymentData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        
        // Status history
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Payment initiated'
        }],
        
        // Retry information
        retryCount: 0,
        maxRetries: 3,
        
        // Metadata
        metadata: paymentData.metadata || {},
        
        // Fees
        fees: {
          platformFee: paymentData.platformFee || 0,
          processorFee: paymentData.processorFee || 0,
          totalFees: (paymentData.platformFee || 0) + (paymentData.processorFee || 0)
        }
      };
      
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .add(tracker);
      
      // Log payment tracking creation
      await FirebaseService.logActivity(
        paymentData.userId,
        'payment_tracking_created',
        'payment',
        tracker.trackerId,
        { amount: paymentData.amount, currency: paymentData.currency }
      );
      
      return {
        success: true,
        trackerId: tracker.trackerId,
        tracker: { id: docRef.id, ...tracker }
      };
      
    } catch (error) {
      console.error('Error creating payment tracker:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update payment status
   */
  async updatePaymentStatus(trackerId, newStatus, details = {}) {
    try {
      // Find tracker by trackerId
      const trackersQuery = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('trackerId', '==', trackerId);
      
      const snapshot = await trackersQuery.get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Payment tracker not found' };
      }
      
      const doc = snapshot.docs[0];
      const tracker = doc.data();
      
      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        statusHistory: [
          ...tracker.statusHistory,
          {
            status: newStatus,
            timestamp: new Date(),
            note: details.note || `Status changed to ${newStatus}`,
            details: details
          }
        ]
      };
      
      // Add status-specific fields
      switch (newStatus) {
        case 'completed':
          updateData.completedAt = new Date();
          updateData.externalId = details.externalId || tracker.externalId;
          updateData.transactionHash = details.transactionHash;
          break;
          
        case 'failed':
          updateData.failedAt = new Date();
          updateData.failureReason = details.reason || 'Payment failed';
          updateData.retryCount = tracker.retryCount + 1;
          break;
          
        case 'refunded':
          updateData.refundedAt = new Date();
          updateData.refundAmount = details.refundAmount || tracker.amount;
          updateData.refundReason = details.reason;
          break;
          
        case 'disputed':
          updateData.disputedAt = new Date();
          updateData.disputeReason = details.reason;
          updateData.disputeId = details.disputeId;
          break;
      }
      
      // Update in Firestore
      await doc.ref.update(updateData);
      
      // Process status-specific actions
      await this.processStatusChange(tracker, newStatus, details);
      
      // Send notifications
      await this.sendStatusNotification(tracker.userId, tracker, newStatus);
      
      return { success: true, status: newStatus };
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get payment status
   */
  async getPaymentStatus(trackerId) {
    try {
      const trackersQuery = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('trackerId', '==', trackerId);
      
      const snapshot = await trackersQuery.get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Payment tracker not found' };
      }
      
      const tracker = snapshot.docs[0].data();
      
      return {
        success: true,
        payment: {
          trackerId: tracker.trackerId,
          status: tracker.status,
          amount: tracker.amount,
          currency: tracker.currency,
          provider: tracker.provider,
          type: tracker.type,
          createdAt: tracker.createdAt,
          updatedAt: tracker.updatedAt,
          statusHistory: tracker.statusHistory,
          fees: tracker.fees
        }
      };
      
    } catch (error) {
      console.error('Error getting payment status:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId, filters = {}) {
    try {
      let query = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('userId', '==', userId);
      
      // Apply filters
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      
      if (filters.provider) {
        query = query.where('provider', '==', filters.provider);
      }
      
      if (filters.startDate) {
        query = query.where('createdAt', '>=', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.where('createdAt', '<=', filters.endDate);
      }
      
      // Order and limit
      query = query.orderBy('createdAt', 'desc');
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const snapshot = await query.get();
      const payments = [];
      
      snapshot.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, payments };
      
    } catch (error) {
      console.error('Error getting user payment history:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // PAYMENT MONITORING
  // ============================================================================
  
  /**
   * Monitor pending payments
   */
  async monitorPendingPayments() {
    try {
      console.log('🔍 Monitoring pending payments...');
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Get pending payments older than 1 hour
      const pendingQuery = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('status', '==', 'pending')
        .where('createdAt', '<', oneHourAgo);
      
      const snapshot = await pendingQuery.get();
      
      console.log(`Found ${snapshot.size} pending payments to check`);
      
      const checkPromises = [];
      snapshot.forEach(doc => {
        const payment = doc.data();
        checkPromises.push(this.checkPaymentStatusWithProvider(payment));
      });
      
      const results = await Promise.allSettled(checkPromises);
      
      let updated = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.updated) {
          updated++;
        }
      });
      
      console.log(`✅ Updated ${updated} payment statuses`);
      
      return { success: true, checked: snapshot.size, updated };
      
    } catch (error) {
      console.error('Error monitoring pending payments:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check payment status with provider
   */
  async checkPaymentStatusWithProvider(payment) {
    try {
      let providerStatus = null;
      
      switch (payment.provider) {
        case 'flutterwave':
          providerStatus = await this.checkFlutterwaveStatus(payment.externalId);
          break;
          
        case 'stripe':
          providerStatus = await this.checkStripeStatus(payment.externalId);
          break;
          
        case 'paystack':
          providerStatus = await this.checkPaystackStatus(payment.externalId);
          break;
          
        default:
          console.log(`Provider ${payment.provider} not supported for status check`);
          return { updated: false };
      }
      
      if (providerStatus && providerStatus.status !== payment.status) {
        await this.updatePaymentStatus(payment.trackerId, providerStatus.status, {
          note: 'Status updated from provider check',
          providerData: providerStatus.data
        });
        
        return { updated: true, newStatus: providerStatus.status };
      }
      
      return { updated: false };
      
    } catch (error) {
      console.error('Error checking payment status with provider:', error);
      return { updated: false, error: error.message };
    }
  }
  
  /**
   * Check Flutterwave payment status
   */
  async checkFlutterwaveStatus(transactionId) {
    try {
      const response = await axios.get(
        `${process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'}/transactions/${transactionId}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const data = response.data.data;
        let status = 'pending';
        
        switch (data.status) {
          case 'successful':
            status = 'completed';
            break;
          case 'failed':
            status = 'failed';
            break;
          case 'cancelled':
            status = 'cancelled';
            break;
        }
        
        return { status, data };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error checking Flutterwave status:', error);
      return null;
    }
  }
  
  /**
   * Check Stripe payment status
   */
  async checkStripeStatus(paymentIntentId) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      let status = 'pending';
      
      switch (paymentIntent.status) {
        case 'succeeded':
          status = 'completed';
          break;
        case 'canceled':
          status = 'cancelled';
          break;
        case 'requires_payment_method':
          status = 'failed';
          break;
      }
      
      return { status, data: paymentIntent };
      
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      return null;
    }
  }
  
  /**
   * Check Paystack payment status
   */
  async checkPaystackStatus(transactionId) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );
      
      if (response.data.status) {
        const data = response.data.data;
        let status = 'pending';
        
        switch (data.status) {
          case 'success':
            status = 'completed';
            break;
          case 'failed':
            status = 'failed';
            break;
          case 'abandoned':
            status = 'cancelled';
            break;
        }
        
        return { status, data };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error checking Paystack status:', error);
      return null;
    }
  }
  
  // ============================================================================
  // EXPIRED PAYMENTS CLEANUP
  // ============================================================================
  
  /**
   * Clean up expired payments
   */
  async cleanupExpiredPayments() {
    try {
      console.log('🧹 Cleaning up expired payments...');
      
      const now = new Date();
      
      // Get expired pending payments
      const expiredQuery = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now);
      
      const snapshot = await expiredQuery.get();
      
      console.log(`Found ${snapshot.size} expired payments`);
      
      const batch = FirebaseAdmin.adminFirestore.batch();
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: now,
          expiredAt: now,
          statusHistory: [
            ...doc.data().statusHistory,
            {
              status: 'expired',
              timestamp: now,
              note: 'Payment session expired'
            }
          ]
        });
      });
      
      await batch.commit();
      
      console.log(`✅ Marked ${snapshot.size} payments as expired`);
      
      return { success: true, expired: snapshot.size };
      
    } catch (error) {
      console.error('Error cleaning up expired payments:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // PAYMENT ANALYTICS
  // ============================================================================
  
  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(timeRange = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }
      
      const analyticsQuery = FirebaseAdmin.adminFirestore
        .collection('paymentTrackers')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate);
      
      const snapshot = await analyticsQuery.get();
      
      const analytics = {
        totalPayments: 0,
        totalVolume: 0,
        totalFees: 0,
        successRate: 0,
        
        statusBreakdown: {
          pending: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
          refunded: 0,
          disputed: 0
        },
        
        providerBreakdown: {
          stripe: { count: 0, volume: 0 },
          flutterwave: { count: 0, volume: 0 },
          paystack: { count: 0, volume: 0 }
        },
        
        typeBreakdown: {
          subscription: { count: 0, volume: 0 },
          investment: { count: 0, volume: 0 },
          fee: { count: 0, volume: 0 }
        }
      };
      
      snapshot.forEach(doc => {
        const payment = doc.data();
        analytics.totalPayments++;
        
        if (payment.status === 'completed') {
          analytics.totalVolume += payment.amount;
          analytics.totalFees += payment.fees?.totalFees || 0;
        }
        
        // Status breakdown
        analytics.statusBreakdown[payment.status] = 
          (analytics.statusBreakdown[payment.status] || 0) + 1;
        
        // Provider breakdown
        if (analytics.providerBreakdown[payment.provider]) {
          analytics.providerBreakdown[payment.provider].count++;
          if (payment.status === 'completed') {
            analytics.providerBreakdown[payment.provider].volume += payment.amount;
          }
        }
        
        // Type breakdown
        if (analytics.typeBreakdown[payment.type]) {
          analytics.typeBreakdown[payment.type].count++;
          if (payment.status === 'completed') {
            analytics.typeBreakdown[payment.type].volume += payment.amount;
          }
        }
      });
      
      // Calculate success rate
      const completedPayments = analytics.statusBreakdown.completed || 0;
      analytics.successRate = analytics.totalPayments > 0 ? 
        (completedPayments / analytics.totalPayments) * 100 : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate unique tracker ID
   */
  generateTrackerId() {
    return `BVESTER_TRK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Process status change actions
   */
  async processStatusChange(payment, newStatus, details) {
    try {
      switch (newStatus) {
        case 'completed':
          await this.processSuccessfulPayment(payment, details);
          break;
          
        case 'failed':
          await this.processFailedPayment(payment, details);
          break;
          
        case 'refunded':
          await this.processRefundedPayment(payment, details);
          break;
      }
    } catch (error) {
      console.error('Error processing status change:', error);
    }
  }
  
  /**
   * Process successful payment
   */
  async processSuccessfulPayment(payment, details) {
    try {
      // Create investment record if it's an investment payment
      if (payment.type === 'investment' && payment.opportunityId) {
        const investmentData = {
          opportunityId: payment.opportunityId,
          investorId: payment.userId,
          businessId: payment.businessId,
          transaction: {
            amount: payment.amount,
            currency: payment.currency,
            status: 'completed'
          },
          payment: {
            paymentMethod: payment.provider,
            paymentId: payment.externalId,
            paymentStatus: 'completed',
            trackerId: payment.trackerId,
            paidAt: new Date()
          }
        };
        
        await FirebaseService.createInvestment(investmentData);
      }
      
      // Update subscription if it's a subscription payment
      if (payment.type === 'subscription') {
        await FirebaseService.updateUserProfile(payment.userId, {
          'subscription.status': 'active',
          'subscription.lastPayment': new Date(),
          'metadata.updatedAt': new Date()
        });
      }
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }
  
  /**
   * Process failed payment
   */
  async processFailedPayment(payment, details) {
    try {
      // Handle subscription failures
      if (payment.type === 'subscription') {
        await FirebaseService.updateUserProfile(payment.userId, {
          'subscription.status': 'past_due',
          'subscription.lastPaymentFailed': new Date(),
          'metadata.updatedAt': new Date()
        });
      }
      
      // Retry logic if within retry limits
      if (payment.retryCount < payment.maxRetries) {
        // Schedule retry (would be handled by a job queue in production)
        console.log(`Scheduling retry for payment ${payment.trackerId}`);
      }
      
    } catch (error) {
      console.error('Error processing failed payment:', error);
    }
  }
  
  /**
   * Process refunded payment
   */
  async processRefundedPayment(payment, details) {
    try {
      // Reverse any actions taken for successful payment
      if (payment.type === 'investment' && payment.opportunityId) {
        // Update investment status to refunded
        // This would require additional logic to find and update the investment
      }
      
    } catch (error) {
      console.error('Error processing refunded payment:', error);
    }
  }
  
  /**
   * Send status notification to user
   */
  async sendStatusNotification(userId, payment, status) {
    try {
      let title = '';
      let message = '';
      
      switch (status) {
        case 'completed':
          title = 'Payment Successful!';
          message = `Your payment of ${payment.currency} ${payment.amount} has been completed successfully.`;
          break;
          
        case 'failed':
          title = 'Payment Failed';
          message = `Your payment of ${payment.currency} ${payment.amount} could not be processed. Please try again.`;
          break;
          
        case 'refunded':
          title = 'Payment Refunded';
          message = `Your payment of ${payment.currency} ${payment.amount} has been refunded.`;
          break;
          
        case 'disputed':
          title = 'Payment Disputed';
          message = `Your payment of ${payment.currency} ${payment.amount} is under dispute review.`;
          break;
          
        default:
          return; // Don't send notification for other statuses
      }
      
      await FirebaseService.createNotification({
        userId: userId,
        type: 'payment',
        title: title,
        message: message,
        data: {
          trackerId: payment.trackerId,
          amount: payment.amount,
          currency: payment.currency,
          status: status
        },
        channels: {
          push: true,
          email: status !== 'completed', // Don't email for successful payments
          sms: status === 'failed' // SMS for failed payments
        }
      });
      
    } catch (error) {
      console.error('Error sending status notification:', error);
    }
  }
}

module.exports = new PaymentTrackerService();