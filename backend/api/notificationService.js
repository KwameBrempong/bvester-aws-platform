/**
 * BVESTER PLATFORM - NOTIFICATION SERVICE
 * Multi-channel notification management system
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const EmailService = require('./emailService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

class NotificationService {
  constructor() {
    this.messaging = getMessaging();
    
    // Notification types and their default settings
    this.notificationTypes = {
      // Authentication & Security
      welcome: {
        title: 'Welcome to Bvester!',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'onboarding'
      },
      email_verification: {
        title: 'Please verify your email',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'authentication'
      },
      password_changed: {
        title: 'Password changed successfully',
        channels: { push: true, email: true, sms: true },
        priority: 'high',
        category: 'security'
      },
      
      // Investment Related
      investment_opportunity: {
        title: 'New investment opportunity',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'investment'
      },
      investment_matched: {
        title: 'Perfect investment match found!',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'matching'
      },
      investment_completed: {
        title: 'Investment completed successfully',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'investment'
      },
      
      // Business Related
      business_approved: {
        title: 'Business profile approved',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'business'
      },
      funding_milestone: {
        title: 'Funding milestone reached',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'business'
      },
      
      // Payment & Billing
      payment_successful: {
        title: 'Payment completed successfully',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'payment'
      },
      payment_failed: {
        title: 'Payment failed',
        channels: { push: true, email: true, sms: true },
        priority: 'high',
        category: 'payment'
      },
      subscription_renewed: {
        title: 'Subscription renewed',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'billing'
      },
      
      // KYC & Verification
      kyc_approved: {
        title: 'Identity verification approved',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'verification'
      },
      kyc_rejected: {
        title: 'Identity verification requires attention',
        channels: { push: true, email: true, sms: false },
        priority: 'high',
        category: 'verification'
      },
      
      // Messages & Communication
      new_message: {
        title: 'New message received',
        channels: { push: true, email: false, sms: false },
        priority: 'normal',
        category: 'communication'
      },
      
      // System & Updates
      system_maintenance: {
        title: 'Scheduled maintenance notification',
        channels: { push: true, email: true, sms: false },
        priority: 'normal',
        category: 'system'
      },
      feature_update: {
        title: 'New features available',
        channels: { push: true, email: false, sms: false },
        priority: 'low',
        category: 'updates'
      }
    };
  }
  
  // ============================================================================
  // CORE NOTIFICATION SENDING
  // ============================================================================
  
  /**
   * Send notification across multiple channels
   */
  async sendNotification(userId, type, data = {}, options = {}) {
    try {
      const notificationConfig = this.notificationTypes[type];
      if (!notificationConfig) {
        throw new Error(`Notification type '${type}' not found`);
      }
      
      // Get user preferences
      const userPreferences = await this.getUserNotificationPreferences(userId);
      
      // Determine which channels to use
      const channels = this.determineChannels(notificationConfig.channels, userPreferences.preferences, options.channels);
      
      // Create notification record
      const notification = await this.createNotificationRecord(userId, type, data, channels);
      
      const results = {};
      
      // Send push notification
      if (channels.push) {
        results.push = await this.sendPushNotification(userId, type, data, notification.id);
      }
      
      // Send email notification
      if (channels.email) {
        results.email = await this.sendEmailNotification(userId, type, data);
      }
      
      // Send SMS notification
      if (channels.sms) {
        results.sms = await this.sendSMSNotification(userId, type, data);
      }
      
      // Update notification with delivery results
      await this.updateNotificationDelivery(notification.id, results);
      
      return {
        success: true,
        notificationId: notification.id,
        channels: Object.keys(results),
        results
      };
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send bulk notifications
   */
  async sendBulkNotification(userIds, type, data = {}, options = {}) {
    try {
      const results = [];
      const batchSize = 100;
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          const result = await this.sendNotification(userId, type, data, options);
          return { userId, ...result };
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }));
        
        // Add delay between batches
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      return {
        success: true,
        results,
        stats: { successful, failed, total: userIds.length }
      };
      
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // CHANNEL-SPECIFIC IMPLEMENTATIONS
  // ============================================================================
  
  /**
   * Send push notification
   */
  async sendPushNotification(userId, type, data, notificationId) {
    try {
      // Get user's FCM tokens
      const tokens = await this.getUserPushTokens(userId);
      
      if (tokens.length === 0) {
        return { success: false, error: 'No push tokens found for user' };
      }
      
      const notificationConfig = this.notificationTypes[type];
      
      const message = {
        notification: {
          title: data.title || notificationConfig.title,
          body: data.message || data.body || 'You have a new notification',
          imageUrl: data.imageUrl
        },
        data: {
          type: type,
          notificationId: notificationId,
          category: notificationConfig.category,
          ...data
        },
        android: {
          priority: notificationConfig.priority === 'high' ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: notificationConfig.category,
            priority: notificationConfig.priority === 'high' ? 'high' : 'normal'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              priority: notificationConfig.priority === 'high' ? 10 : 5
            }
          }
        },
        tokens: tokens
      };
      
      const response = await this.messaging.sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        // Remove invalid tokens
        await this.removeInvalidPushTokens(userId, failedTokens);
      }
      
      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        messageId: response.responses[0]?.messageId
      };
      
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send email notification
   */
  async sendEmailNotification(userId, type, data) {
    try {
      // Get user email
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const userEmail = userResult.user.email;
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }
      
      // Map notification type to email template
      const emailTemplateMap = {
        welcome: 'welcome',
        email_verification: 'verification',
        password_changed: 'password_reset',
        investment_opportunity: 'investment_notification',
        payment_successful: 'payment_confirmation',
        payment_failed: 'payment_confirmation',
        kyc_approved: 'kyc_update',
        kyc_rejected: 'kyc_update',
        business_approved: 'business_approved'
      };
      
      const emailTemplate = emailTemplateMap[type];
      if (!emailTemplate) {
        console.log(`No email template mapped for notification type: ${type}`);
        return { success: true, skipped: true };
      }
      
      // Send email using EmailService
      const emailResult = await EmailService.sendEmail(userEmail, emailTemplate, {
        firstName: userResult.user.profile?.firstName,
        ...data
      });
      
      return emailResult;
      
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send SMS notification
   */
  async sendSMSNotification(userId, type, data) {
    try {
      // Get user phone number
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const phoneNumber = userResult.user.profile?.phoneNumber;
      if (!phoneNumber) {
        return { success: false, error: 'User phone number not found' };
      }
      
      // Map notification type to SMS template
      const smsTemplateMap = {
        welcome: null, // No SMS for welcome
        email_verification: 'verification',
        password_changed: 'security_alert',
        investment_opportunity: 'investment_alert',
        payment_successful: 'payment_confirmation',
        payment_failed: 'payment_confirmation',
        kyc_approved: 'kyc_update',
        kyc_rejected: 'kyc_update'
      };
      
      const smsTemplate = smsTemplateMap[type];
      if (!smsTemplate) {
        console.log(`No SMS template mapped for notification type: ${type}`);
        return { success: true, skipped: true };
      }
      
      // Use our SMS service
      const SMSService = require('./smsService');
      const smsResult = await SMSService.sendSMS(phoneNumber, smsTemplate, data);
      
      return smsResult;
      
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================
  
  /**
   * Create notification record in database
   */
  async createNotificationRecord(userId, type, data, channels) {
    try {
      const notificationConfig = this.notificationTypes[type];
      
      const notification = {
        userId: userId,
        type: type,
        category: notificationConfig.category,
        priority: notificationConfig.priority,
        title: data.title || notificationConfig.title,
        message: data.message || data.body || '',
        data: data,
        channels: channels,
        status: 'pending',
        createdAt: new Date(),
        readAt: null,
        deliveredAt: null,
        delivery: {}
      };
      
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .add(notification);
      
      return { id: docRef.id, ...notification };
      
    } catch (error) {
      console.error('Error creating notification record:', error);
      throw error;
    }
  }
  
  /**
   * Update notification delivery status
   */
  async updateNotificationDelivery(notificationId, deliveryResults) {
    try {
      const updateData = {
        delivery: deliveryResults,
        status: 'sent',
        deliveredAt: new Date()
      };
      
      // Check if any delivery failed
      const hasFailures = Object.values(deliveryResults).some(result => !result.success);
      if (hasFailures) {
        updateData.status = 'partially_failed';
      }
      
      await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .doc(notificationId)
        .update(updateData);
        
    } catch (error) {
      console.error('Error updating notification delivery:', error);
    }
  }
  
  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .doc(notificationId)
        .get();
      
      if (!notification.exists) {
        return { success: false, error: 'Notification not found' };
      }
      
      const notificationData = notification.data();
      if (notificationData.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      await notification.ref.update({
        readAt: new Date(),
        status: 'read'
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      let query = FirebaseAdmin.adminFirestore
        .collection('notifications')
        .where('userId', '==', userId);
      
      // Apply filters
      if (options.unreadOnly) {
        query = query.where('readAt', '==', null);
      }
      
      if (options.category) {
        query = query.where('category', '==', options.category);
      }
      
      if (options.startDate) {
        query = query.where('createdAt', '>=', options.startDate);
      }
      
      // Order and limit
      query = query.orderBy('createdAt', 'desc');
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const notifications = [];
      
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, notifications };
      
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(timeRange = '30d') {
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
      }
      
      const notificationsQuery = FirebaseAdmin.adminFirestore
        .collection('notifications')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate);
      
      const snapshot = await notificationsQuery.get();
      
      const analytics = {
        totalNotifications: 0,
        deliveredNotifications: 0,
        readNotifications: 0,
        deliveryRate: 0,
        readRate: 0,
        
        typeBreakdown: {},
        categoryBreakdown: {},
        channelBreakdown: {
          push: 0,
          email: 0,
          sms: 0
        }
      };
      
      snapshot.forEach(doc => {
        const notification = doc.data();
        analytics.totalNotifications++;
        
        if (notification.status === 'sent' || notification.status === 'read') {
          analytics.deliveredNotifications++;
        }
        
        if (notification.readAt) {
          analytics.readNotifications++;
        }
        
        // Type breakdown
        analytics.typeBreakdown[notification.type] = 
          (analytics.typeBreakdown[notification.type] || 0) + 1;
        
        // Category breakdown
        analytics.categoryBreakdown[notification.category] = 
          (analytics.categoryBreakdown[notification.category] || 0) + 1;
        
        // Channel breakdown
        if (notification.channels) {
          Object.keys(notification.channels).forEach(channel => {
            if (notification.channels[channel]) {
              analytics.channelBreakdown[channel]++;
            }
          });
        }
      });
      
      analytics.deliveryRate = analytics.totalNotifications > 0 ? 
        (analytics.deliveredNotifications / analytics.totalNotifications) * 100 : 0;
      
      analytics.readRate = analytics.deliveredNotifications > 0 ? 
        (analytics.readNotifications / analytics.deliveredNotifications) * 100 : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting notification analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Determine which channels to use
   */
  determineChannels(defaultChannels, userPreferences, overrideChannels) {
    const channels = { ...defaultChannels };
    
    // Apply user preferences
    if (userPreferences) {
      Object.keys(channels).forEach(channel => {
        if (userPreferences[channel] === false) {
          channels[channel] = false;
        }
      });
    }
    
    // Apply override channels
    if (overrideChannels) {
      Object.assign(channels, overrideChannels);
    }
    
    return channels;
  }
  
  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { preferences: {} };
      }
      
      return {
        preferences: userResult.user.preferences?.notifications || {}
      };
      
    } catch (error) {
      console.error('Error getting user notification preferences:', error);
      return { preferences: {} };
    }
  }
  
  /**
   * Get user's push tokens
   */
  async getUserPushTokens(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return [];
      }
      
      const tokens = userResult.user.pushTokens || [];
      return Array.isArray(tokens) ? tokens : [];
      
    } catch (error) {
      console.error('Error getting user push tokens:', error);
      return [];
    }
  }
  
  /**
   * Remove invalid push tokens
   */
  async removeInvalidPushTokens(userId, invalidTokens) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) return;
      
      const currentTokens = userResult.user.pushTokens || [];
      const validTokens = currentTokens.filter(token => !invalidTokens.includes(token));
      
      await FirebaseService.updateUserProfile(userId, {
        pushTokens: validTokens
      });
      
    } catch (error) {
      console.error('Error removing invalid push tokens:', error);
    }
  }
  
  /**
   * Generate SMS message
   */
  generateSMSMessage(type, data) {
    const messages = {
      password_changed: 'Your Bvester password was changed. If this wasn\'t you, contact support immediately.',
      payment_failed: `Payment failed: ${data.amount} ${data.currency}. Please update your payment method.`,
      kyc_approved: 'Your identity verification was approved! Welcome to Bvester.',
      kyc_rejected: 'Your identity verification needs attention. Check your email for details.'
    };
    
    return messages[type] || `You have a new notification from Bvester. Check the app for details.`;
  }
  
  /**
   * Send SMS (Twilio integration placeholder)
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Twilio integration would go here
      console.log(`SMS to ${phoneNumber}: ${message}`);
      
      // Placeholder implementation
      return { 
        success: true, 
        messageId: `sms_${Date.now()}`,
        provider: 'twilio'
      };
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      await FirebaseService.updateUserProfile(userId, {
        'preferences.notifications': preferences,
        'metadata.updatedAt': new Date()
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();