/**
 * BVESTER PLATFORM - PUSH NOTIFICATION SERVICE
 * Week 4: Firebase Cloud Messaging Integration
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class PushNotificationService {
  constructor() {
    // Push notification configuration
    this.fcmConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'bvester-platform',
      apiKey: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789012'
    };
    
    // Push notification templates
    this.pushTemplates = {
      welcome: {
        title: 'Welcome to Bvester! 🚀',
        body: 'Start exploring African investment opportunities today.',
        icon: '/icons/welcome.png',
        badge: '/icons/badge.png',
        category: 'onboarding',
        priority: 'normal',
        sound: 'default'
      },
      verification: {
        title: 'Verify Your Account 🔐',
        body: 'Complete your verification to access all features.',
        icon: '/icons/verification.png',
        badge: '/icons/badge.png',
        category: 'authentication',
        priority: 'high',
        sound: 'default'
      },
      investment_alert: {
        title: 'New Investment Opportunity! 💰',
        body: '{{businessName}} is seeking {{currency}} {{amount}} investment.',
        icon: '/icons/investment.png',
        badge: '/icons/badge.png',
        category: 'investment',
        priority: 'normal',
        sound: 'investment_alert.wav'
      },
      payment_confirmation: {
        title: 'Payment Successful ✅',
        body: 'Your {{currency}} {{amount}} investment in {{businessName}} is confirmed.',
        icon: '/icons/payment.png',
        badge: '/icons/badge.png',
        category: 'payment',
        priority: 'high',
        sound: 'payment_success.wav'
      },
      kyc_update: {
        title: 'Verification Update 📋',
        body: 'Your identity verification status has been updated.',
        icon: '/icons/kyc.png',
        badge: '/icons/badge.png',
        category: 'verification',
        priority: 'high',
        sound: 'default'
      },
      funding_milestone: {
        title: 'Funding Milestone! 🎉',
        body: '{{businessName}} reached {{percentage}}% funding goal.',
        icon: '/icons/milestone.png',
        badge: '/icons/badge.png',
        category: 'milestone',
        priority: 'normal',
        sound: 'celebration.wav'
      },
      security_alert: {
        title: 'Security Alert ⚠️',
        body: '{{alertType}} detected on your account. Please review.',
        icon: '/icons/security.png',
        badge: '/icons/badge.png',
        category: 'security',
        priority: 'high',
        sound: 'security_alert.wav'
      },
      message_received: {
        title: 'New Message 💬',
        body: 'You have a new message from {{senderName}}.',
        icon: '/icons/message.png',
        badge: '/icons/badge.png',
        category: 'communication',
        priority: 'normal',
        sound: 'message.wav'
      }
    };
    
    // Device platform configurations
    this.platformConfigs = {
      android: {
        priority: 'high',
        ttl: 3600, // 1 hour
        collapseKey: 'bvester_notifications',
        restrictedPackageName: 'com.bvester.app',
        notification: {
          sound: 'default',
          channelId: 'bvester_default',
          color: '#667eea',
          tag: 'bvester',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      ios: {
        headers: {
          'apns-priority': '10',
          'apns-expiration': '0',
          'apns-topic': 'com.bvester.app'
        },
        payload: {
          aps: {
            alert: {},
            badge: 1,
            sound: 'default',
            category: 'GENERAL',
            'mutable-content': 1
          }
        }
      },
      web: {
        headers: {
          TTL: '3600',
          Urgency: 'normal'
        },
        notification: {
          requireInteraction: false,
          silent: false
        },
        fcmOptions: {
          link: 'https://app.bvester.com'
        }
      }
    };
    
    // Notification categories and channels
    this.notificationChannels = {
      onboarding: {
        name: 'Onboarding',
        description: 'Welcome messages and getting started notifications',
        importance: 'DEFAULT'
      },
      authentication: {
        name: 'Authentication',
        description: 'Login, verification, and security notifications',
        importance: 'HIGH'
      },
      investment: {
        name: 'Investments',
        description: 'Investment opportunities and updates',
        importance: 'DEFAULT'
      },
      payment: {
        name: 'Payments',
        description: 'Payment confirmations and billing notifications',
        importance: 'HIGH'
      },
      verification: {
        name: 'Verification',
        description: 'KYC and document verification updates',
        importance: 'HIGH'
      },
      milestone: {
        name: 'Milestones',
        description: 'Funding milestones and achievements',
        importance: 'DEFAULT'
      },
      security: {
        name: 'Security',
        description: 'Security alerts and account protection',
        importance: 'HIGH'
      },
      communication: {
        name: 'Messages',
        description: 'Direct messages and communication',
        importance: 'DEFAULT'
      }
    };
  }
  
  // ============================================================================
  // CORE PUSH NOTIFICATION FUNCTIONS
  // ============================================================================
  
  /**
   * Send push notification to user
   */
  async sendPushNotification(userId, templateKey, templateData = {}, options = {}) {
    try {
      console.log(`📱 Sending ${templateKey} push notification to user ${userId}`);
      
      const template = this.pushTemplates[templateKey];
      if (!template) {
        throw new Error(`Push template ${templateKey} not found`);
      }
      
      // Get user's device tokens
      const deviceTokens = await this.getUserDeviceTokens(userId);
      if (deviceTokens.length === 0) {
        return { success: true, skipped: true, reason: 'No device tokens' };
      }
      
      // Generate notification content
      const notificationContent = this.generateNotificationContent(template, templateData);
      
      // Prepare FCM message
      const fcmMessage = this.prepareFCMMessage(notificationContent, templateData, options);
      
      // Send to all user devices
      const results = await this.sendToDevices(deviceTokens, fcmMessage);
      
      // Log push notification
      await this.logPushNotification({
        userId: userId,
        templateKey: templateKey,
        deviceCount: deviceTokens.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        messageIds: results.messageIds,
        timestamp: new Date()
      });
      
      // Clean up invalid tokens
      if (results.invalidTokens.length > 0) {
        await this.removeInvalidDeviceTokens(userId, results.invalidTokens);
      }
      
      return {
        success: true,
        messageIds: results.messageIds,
        devicesReached: results.successCount,
        devicesFailed: results.failureCount,
        totalDevices: deviceTokens.length
      };
      
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send push notification to multiple users
   */
  async sendBulkPushNotifications(userIds, templateKey, templateData = {}, options = {}) {
    try {
      console.log(`📢 Sending bulk ${templateKey} push notifications to ${userIds.length} users`);
      
      const results = [];
      const batchSize = options.batchSize || 100;
      
      // Process users in batches
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          const personalizedData = { ...templateData, ...(options.personalization?.[userId] || {}) };
          const result = await this.sendPushNotification(userId, templateKey, personalizedData, options);
          return { userId, ...result };
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }));
        
        // Add delay between batches
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      // Log bulk push notification
      await this.logBulkPushNotification({
        templateKey: templateKey,
        userCount: userIds.length,
        successCount: successful,
        failedCount: failed,
        status: 'completed',
        timestamp: new Date()
      });
      
      return {
        success: true,
        results: results,
        stats: { successful, failed, total: userIds.length }
      };
      
    } catch (error) {
      console.error('Error sending bulk push notifications:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send topic-based push notification
   */
  async sendTopicNotification(topic, templateKey, templateData = {}, options = {}) {
    try {
      console.log(`📡 Sending ${templateKey} notification to topic: ${topic}`);
      
      const template = this.pushTemplates[templateKey];
      if (!template) {
        throw new Error(`Push template ${templateKey} not found`);
      }
      
      // Generate notification content
      const notificationContent = this.generateNotificationContent(template, templateData);
      
      // Prepare FCM message for topic
      const fcmMessage = this.prepareFCMMessage(notificationContent, templateData, options);
      fcmMessage.topic = topic;
      
      // Send via Firebase Cloud Messaging
      const result = await this.sendFCMMessage(fcmMessage);
      
      // Log topic notification
      await this.logTopicNotification({
        topic: topic,
        templateKey: templateKey,
        messageId: result.messageId,
        timestamp: new Date()
      });
      
      return {
        success: true,
        messageId: result.messageId,
        topic: topic
      };
      
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // FCM MESSAGE HANDLING
  // ============================================================================
  
  /**
   * Send FCM message to multiple devices
   */
  async sendToDevices(deviceTokens, message) {
    try {
      const validTokens = deviceTokens.filter(token => token && token.length > 0);
      
      if (validTokens.length === 0) {
        return { successCount: 0, failureCount: 0, messageIds: [], invalidTokens: [] };
      }
      
      // Simulate FCM multicast (replace with actual FCM implementation)
      const results = await this.simulateFCMMulticast({
        ...message,
        tokens: validTokens
      });
      
      const successCount = results.responses.filter(r => r.success).length;
      const failureCount = results.responses.filter(r => !r.success).length;
      const messageIds = results.responses.filter(r => r.success).map(r => r.messageId);
      const invalidTokens = [];
      
      // Identify invalid tokens
      results.responses.forEach((response, index) => {
        if (!response.success && this.isInvalidToken(response.error)) {
          invalidTokens.push(validTokens[index]);
        }
      });
      
      return {
        successCount,
        failureCount,
        messageIds,
        invalidTokens
      };
      
    } catch (error) {
      console.error('Error sending to devices:', error);
      throw error;
    }
  }
  
  /**
   * Send single FCM message
   */
  async sendFCMMessage(message) {
    try {
      // Simulate FCM send (replace with actual FCM implementation)
      const result = await this.simulateFCMSend(message);
      return result;
      
    } catch (error) {
      console.error('Error sending FCM message:', error);
      throw error;
    }
  }
  
  /**
   * Simulate FCM multicast sending
   */
  async simulateFCMMulticast(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const responses = message.tokens.map(token => {
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          success: true,
          messageId: `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        // Simulate various error types
        const errors = ['invalid-registration-token', 'not-registered', 'message-rate-exceeded'];
        return {
          success: false,
          error: errors[Math.floor(Math.random() * errors.length)]
        };
      }
    });
    
    return {
      successCount: responses.filter(r => r.success).length,
      failureCount: responses.filter(r => !r.success).length,
      responses: responses
    };
  }
  
  /**
   * Simulate FCM single message sending
   */
  async simulateFCMSend(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate 98% success rate for topics
    const success = Math.random() > 0.02;
    
    if (success) {
      return {
        messageId: `fcm_topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      throw new Error('Topic message failed');
    }
  }
  
  // ============================================================================
  // DEVICE TOKEN MANAGEMENT
  // ============================================================================
  
  /**
   * Register device token for user
   */
  async registerDeviceToken(userId, token, deviceInfo = {}) {
    try {
      console.log(`📱 Registering device token for user ${userId}`);
      
      // Get current user tokens
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        throw new Error('User not found');
      }
      
      const currentTokens = userResult.user.deviceTokens || [];
      
      // Add new token if not already present
      if (!currentTokens.includes(token)) {
        const updatedTokens = [...currentTokens, token];
        
        await FirebaseService.updateUserProfile(userId, {
          deviceTokens: updatedTokens,
          'metadata.lastTokenUpdate': new Date()
        });
        
        // Store device info
        if (Object.keys(deviceInfo).length > 0) {
          await this.storeDeviceInfo(userId, token, deviceInfo);
        }
        
        console.log(`✅ Device token registered for user ${userId}`);
      }
      
      return { success: true, tokenCount: currentTokens.length + 1 };
      
    } catch (error) {
      console.error('Error registering device token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Unregister device token for user
   */
  async unregisterDeviceToken(userId, token) {
    try {
      console.log(`📱 Unregistering device token for user ${userId}`);
      
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        throw new Error('User not found');
      }
      
      const currentTokens = userResult.user.deviceTokens || [];
      const updatedTokens = currentTokens.filter(t => t !== token);
      
      if (updatedTokens.length !== currentTokens.length) {
        await FirebaseService.updateUserProfile(userId, {
          deviceTokens: updatedTokens,
          'metadata.lastTokenUpdate': new Date()
        });
        
        // Remove device info
        await this.removeDeviceInfo(userId, token);
        
        console.log(`✅ Device token unregistered for user ${userId}`);
      }
      
      return { success: true, tokenCount: updatedTokens.length };
      
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user device tokens
   */
  async getUserDeviceTokens(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return [];
      }
      
      return userResult.user.deviceTokens || [];
      
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      return [];
    }
  }
  
  /**
   * Remove invalid device tokens
   */
  async removeInvalidDeviceTokens(userId, invalidTokens) {
    try {
      if (invalidTokens.length === 0) return;
      
      console.log(`🧹 Removing ${invalidTokens.length} invalid tokens for user ${userId}`);
      
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) return;
      
      const currentTokens = userResult.user.deviceTokens || [];
      const validTokens = currentTokens.filter(token => !invalidTokens.includes(token));
      
      await FirebaseService.updateUserProfile(userId, {
        deviceTokens: validTokens,
        'metadata.lastTokenCleanup': new Date()
      });
      
      // Remove device info for invalid tokens
      for (const token of invalidTokens) {
        await this.removeDeviceInfo(userId, token);
      }
      
    } catch (error) {
      console.error('Error removing invalid device tokens:', error);
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate notification content from template
   */
  generateNotificationContent(template, data) {
    let title = template.title;
    let body = template.body;
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), data[key]);
      body = body.replace(new RegExp(placeholder, 'g'), data[key]);
    });
    
    return {
      title: title,
      body: body,
      icon: template.icon,
      badge: template.badge,
      sound: template.sound,
      category: template.category,
      priority: template.priority
    };
  }
  
  /**
   * Prepare FCM message structure
   */
  prepareFCMMessage(notificationContent, data, options) {
    const message = {
      notification: {
        title: notificationContent.title,
        body: notificationContent.body,
        image: data.imageUrl || null
      },
      data: {
        category: notificationContent.category,
        priority: notificationContent.priority,
        clickAction: options.clickAction || 'OPEN_APP',
        ...data
      },
      android: {
        priority: notificationContent.priority === 'high' ? 'high' : 'normal',
        notification: {
          ...this.platformConfigs.android.notification,
          sound: notificationContent.sound,
          icon: notificationContent.icon,
          channelId: `bvester_${notificationContent.category}`
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationContent.title,
              body: notificationContent.body
            },
            badge: 1,
            sound: notificationContent.sound,
            category: notificationContent.category.toUpperCase()
          }
        }
      },
      webpush: {
        notification: {
          title: notificationContent.title,
          body: notificationContent.body,
          icon: notificationContent.icon,
          badge: notificationContent.badge,
          requireInteraction: notificationContent.priority === 'high'
        },
        fcmOptions: {
          link: options.link || 'https://app.bvester.com'
        }
      }
    };
    
    return message;
  }
  
  /**
   * Check if error indicates invalid token
   */
  isInvalidToken(error) {
    const invalidTokenErrors = [
      'invalid-registration-token',
      'not-registered',
      'invalid-argument'
    ];
    
    return invalidTokenErrors.includes(error);
  }
  
  /**
   * Store device information
   */
  async storeDeviceInfo(userId, token, deviceInfo) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('deviceTokens')
        .doc(token)
        .set({
          userId: userId,
          token: token,
          deviceInfo: deviceInfo,
          registeredAt: new Date(),
          lastUsed: new Date()
        });
    } catch (error) {
      console.error('Error storing device info:', error);
    }
  }
  
  /**
   * Remove device information
   */
  async removeDeviceInfo(userId, token) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('deviceTokens')
        .doc(token)
        .delete();
    } catch (error) {
      console.error('Error removing device info:', error);
    }
  }
  
  /**
   * Log push notification activity
   */
  async logPushNotification(logData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('pushNotificationLogs')
        .add(logData);
    } catch (error) {
      console.error('Error logging push notification:', error);
    }
  }
  
  /**
   * Log bulk push notification activity
   */
  async logBulkPushNotification(logData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('bulkPushLogs')
        .add(logData);
    } catch (error) {
      console.error('Error logging bulk push notification:', error);
    }
  }
  
  /**
   * Log topic notification activity
   */
  async logTopicNotification(logData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('topicNotificationLogs')
        .add(logData);
    } catch (error) {
      console.error('Error logging topic notification:', error);
    }
  }
  
  /**
   * Get push notification analytics
   */
  async getPushAnalytics(timeRange = '30d') {
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
      
      const logsQuery = FirebaseAdmin.adminFirestore
        .collection('pushNotificationLogs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await logsQuery.get();
      
      const analytics = {
        totalNotifications: 0,
        totalDevicesReached: 0,
        totalDevicesFailed: 0,
        deliveryRate: 0,
        templateBreakdown: {},
        averageDevicesPerUser: 0
      };
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalNotifications++;
        analytics.totalDevicesReached += log.successCount || 0;
        analytics.totalDevicesFailed += log.failureCount || 0;
        
        // Template breakdown
        analytics.templateBreakdown[log.templateKey] = 
          (analytics.templateBreakdown[log.templateKey] || 0) + 1;
      });
      
      const totalDevices = analytics.totalDevicesReached + analytics.totalDevicesFailed;
      analytics.deliveryRate = totalDevices > 0 ? 
        (analytics.totalDevicesReached / totalDevices) * 100 : 0;
      
      analytics.averageDevicesPerUser = analytics.totalNotifications > 0 ?
        totalDevices / analytics.totalNotifications : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting push analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PushNotificationService();