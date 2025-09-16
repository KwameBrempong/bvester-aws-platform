// 🚀 BVESTER - NOTIFICATION API ROUTES
// Comprehensive notification management system

const express = require('express');
const router = express.Router();
const { requireUserType, requireAdmin } = require('../../middleware/authMiddleware');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 📨 SEND NOTIFICATION
 * Send notification to user(s) with multiple channels
 */
router.post('/send', requireAdmin, async (req, res) => {
  try {
    const {
      recipients, // Array of user IDs or 'all' for broadcast
      type,
      title,
      message,
      data = {},
      channels = { push: true, email: false, sms: false },
      priority = 'normal', // 'low', 'normal', 'high', 'urgent'
      scheduledFor = null,
      expiresAt = null
    } = req.body;

    // Validate required fields
    if (!recipients || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipients, type, title, message'
      });
    }

    let recipientIds = [];

    if (recipients === 'all') {
      // Get all active users
      const usersQuery = await FirebaseAdmin.adminFirestore
        .collection('users')
        .where('status', '!=', 'deactivated')
        .get();
      
      recipientIds = usersQuery.docs.map(doc => doc.id);
    } else if (Array.isArray(recipients)) {
      recipientIds = recipients;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Recipients must be an array of user IDs or "all"'
      });
    }

    // Create notification records
    const batch = FirebaseAdmin.adminFirestore.batch();
    const notificationPromises = [];

    for (const userId of recipientIds) {
      const notificationId = FirebaseAdmin.adminFirestore
        .collection('notifications')
        .doc().id;

      const notificationData = {
        userId: userId,
        type: type,
        title: title,
        message: message,
        data: data,
        channels: channels,
        priority: priority,
        status: scheduledFor ? 'scheduled' : 'sent',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
        read: false,
        readAt: null,
        sentBy: req.user.uid
      };

      const notificationRef = FirebaseAdmin.adminFirestore
        .collection('notifications')
        .doc(notificationId);

      batch.set(notificationRef, notificationData);

      // Add to processing queue if not scheduled
      if (!scheduledFor) {
        notificationPromises.push(processNotification(notificationId, notificationData));
      }
    }

    await batch.commit();

    // Process immediate notifications
    const processResults = await Promise.allSettled(notificationPromises);
    const successCount = processResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = processResults.filter(r => r.status === 'rejected').length;

    // Log notification send
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: req.user.uid,
        action: 'notification_sent',
        resource: { type: 'notification', id: 'bulk' },
        details: {
          recipientCount: recipientIds.length,
          type: type,
          channels: channels,
          successCount: successCount,
          failureCount: failureCount
        },
        timestamp: new Date()
      });

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      results: {
        totalRecipients: recipientIds.length,
        successful: successCount,
        failed: failureCount,
        scheduled: scheduledFor ? recipientIds.length : 0
      }
    });

  } catch (error) {
    logger.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications'
    });
  }
});

/**
 * 📋 GET USER NOTIFICATIONS
 * Get notifications for the current user with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      page = 1,
      limit = 20,
      type,
      read = 'all', // 'read', 'unread', 'all'
      priority,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore
      .collection('notifications')
      .where('userId', '==', userId);

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }

    if (read === 'read') {
      query = query.where('read', '==', true);
    } else if (read === 'unread') {
      query = query.where('read', '==', false);
    }

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    // Apply sorting and pagination
    query = query.orderBy(sortBy, sortOrder);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const notifications = [];

    snapshot.forEach(doc => {
      const notificationData = doc.data();
      notifications.push({
        id: doc.id,
        ...notificationData,
        createdAt: notificationData.createdAt?.toDate(),
        readAt: notificationData.readAt?.toDate(),
        scheduledFor: notificationData.scheduledFor?.toDate(),
        expiresAt: notificationData.expiresAt?.toDate()
      });
    });

    // Get unread count
    const unreadQuery = await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    res.json({
      success: true,
      notifications: notifications,
      unreadCount: unreadQuery.size,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
        hasMore: notifications.length === parseInt(limit)
      },
      filters: { type, read, priority, startDate, endDate }
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * ✅ MARK NOTIFICATIONS AS READ
 * Mark single or multiple notifications as read
 */
router.put('/read', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { notificationIds, markAll = false } = req.body;

    if (markAll) {
      // Mark all unread notifications as read
      const unreadQuery = await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = FirebaseAdmin.adminFirestore.batch();
      const readAt = new Date();

      unreadQuery.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: readAt
        });
      });

      await batch.commit();

      res.json({
        success: true,
        message: `Marked ${unreadQuery.size} notifications as read`,
        markedCount: unreadQuery.size
      });

    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const batch = FirebaseAdmin.adminFirestore.batch();
      const readAt = new Date();
      let markedCount = 0;

      for (const notificationId of notificationIds) {
        const notificationRef = FirebaseAdmin.adminFirestore
          .collection('notifications')
          .doc(notificationId);

        // Verify ownership
        const notificationDoc = await notificationRef.get();
        if (notificationDoc.exists && notificationDoc.data().userId === userId) {
          batch.update(notificationRef, {
            read: true,
            readAt: readAt
          });
          markedCount++;
        }
      }

      await batch.commit();

      res.json({
        success: true,
        message: `Marked ${markedCount} notifications as read`,
        markedCount: markedCount
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Either notificationIds array or markAll=true is required'
      });
    }

  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

/**
 * 🗑️ DELETE NOTIFICATIONS
 * Delete notifications (soft delete by default)
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { notificationIds, deleteAll = false, permanent = false } = req.body;

    if (deleteAll) {
      // Delete all notifications for user
      const userNotificationsQuery = await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .where('userId', '==', userId)
        .get();

      const batch = FirebaseAdmin.adminFirestore.batch();
      let deletedCount = 0;

      userNotificationsQuery.forEach(doc => {
        if (permanent) {
          batch.delete(doc.ref);
        } else {
          batch.update(doc.ref, {
            deleted: true,
            deletedAt: new Date()
          });
        }
        deletedCount++;
      });

      await batch.commit();

      res.json({
        success: true,
        message: `${permanent ? 'Permanently deleted' : 'Deleted'} ${deletedCount} notifications`,
        deletedCount: deletedCount
      });

    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications
      const batch = FirebaseAdmin.adminFirestore.batch();
      let deletedCount = 0;

      for (const notificationId of notificationIds) {
        const notificationRef = FirebaseAdmin.adminFirestore
          .collection('notifications')
          .doc(notificationId);

        // Verify ownership
        const notificationDoc = await notificationRef.get();
        if (notificationDoc.exists && notificationDoc.data().userId === userId) {
          if (permanent) {
            batch.delete(notificationRef);
          } else {
            batch.update(notificationRef, {
              deleted: true,
              deletedAt: new Date()
            });
          }
          deletedCount++;
        }
      }

      await batch.commit();

      res.json({
        success: true,
        message: `${permanent ? 'Permanently deleted' : 'Deleted'} ${deletedCount} notifications`,
        deletedCount: deletedCount
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Either notificationIds array or deleteAll=true is required'
      });
    }

  } catch (error) {
    logger.error('Error deleting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notifications'
    });
  }
});

/**
 * 🔔 GET NOTIFICATION PREFERENCES
 * Get user's notification preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const preferences = userData.preferences?.notifications || {
      email: true,
      push: true,
      sms: false,
      investment: true,
      business: true,
      marketing: false,
      security: true,
      system: true
    };

    res.json({
      success: true,
      preferences: preferences
    });

  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

/**
 * ⚙️ UPDATE NOTIFICATION PREFERENCES
 * Update user's notification preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
    }

    // Validate preferences structure
    const validPreferences = {
      channels: {
        email: preferences.channels?.email ?? true,
        push: preferences.channels?.push ?? true,
        sms: preferences.channels?.sms ?? false
      },
      types: {
        investment: preferences.types?.investment ?? true,
        business: preferences.types?.business ?? true,
        matching: preferences.types?.matching ?? true,
        marketing: preferences.types?.marketing ?? false,
        security: preferences.types?.security ?? true,
        system: preferences.types?.system ?? true
      },
      frequency: {
        immediate: preferences.frequency?.immediate ?? true,
        daily: preferences.frequency?.daily ?? false,
        weekly: preferences.frequency?.weekly ?? false
      },
      quietHours: {
        enabled: preferences.quietHours?.enabled ?? false,
        startTime: preferences.quietHours?.startTime ?? '22:00',
        endTime: preferences.quietHours?.endTime ?? '08:00',
        timezone: preferences.quietHours?.timezone ?? 'UTC'
      }
    };

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        'preferences.notifications': validPreferences,
        'metadata.updatedAt': new Date()
      });

    // Log preference update
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'notification_preferences_updated',
        resource: { type: 'user_preferences', id: userId },
        timestamp: new Date()
      });

    res.json({
      success: true,
      preferences: validPreferences,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

/**
 * 📊 GET NOTIFICATION ANALYTICS
 * Analytics for notification performance (admin only)
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d', type, channel } = req.query;

    // Calculate date range
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = FirebaseAdmin.adminFirestore
      .collection('notifications')
      .where('createdAt', '>=', startDate);

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();

    const analytics = {
      summary: {
        totalSent: 0,
        totalRead: 0,
        readRate: 0,
        avgTimeToRead: 0
      },
      breakdown: {
        byType: {},
        byChannel: {},
        byPriority: {},
        byStatus: {}
      },
      trends: {
        daily: {},
        hourly: {}
      },
      performance: {
        topPerformingTypes: [],
        channelEffectiveness: {}
      }
    };

    let totalReadTime = 0;
    let readNotifications = 0;

    snapshot.forEach(doc => {
      const notification = doc.data();
      analytics.summary.totalSent++;

      // Type breakdown
      const notType = notification.type || 'unknown';
      analytics.breakdown.byType[notType] = (analytics.breakdown.byType[notType] || 0) + 1;

      // Priority breakdown
      const priority = notification.priority || 'normal';
      analytics.breakdown.byPriority[priority] = (analytics.breakdown.byPriority[priority] || 0) + 1;

      // Status breakdown
      const status = notification.status || 'sent';
      analytics.breakdown.byStatus[status] = (analytics.breakdown.byStatus[status] || 0) + 1;

      // Channel breakdown
      const channels = notification.channels || {};
      Object.keys(channels).forEach(channel => {
        if (channels[channel]) {
          analytics.breakdown.byChannel[channel] = (analytics.breakdown.byChannel[channel] || 0) + 1;
        }
      });

      // Read analytics
      if (notification.read) {
        analytics.summary.totalRead++;
        readNotifications++;

        if (notification.readAt && notification.createdAt) {
          const readTime = notification.readAt.toDate() - notification.createdAt.toDate();
          totalReadTime += readTime;
        }
      }

      // Daily trends
      const dayKey = notification.createdAt.toDate().toISOString().substring(0, 10);
      if (!analytics.trends.daily[dayKey]) {
        analytics.trends.daily[dayKey] = { sent: 0, read: 0 };
      }
      analytics.trends.daily[dayKey].sent++;
      if (notification.read) {
        analytics.trends.daily[dayKey].read++;
      }

      // Hourly trends
      const hourKey = notification.createdAt.toDate().getHours();
      if (!analytics.trends.hourly[hourKey]) {
        analytics.trends.hourly[hourKey] = { sent: 0, read: 0 };
      }
      analytics.trends.hourly[hourKey].sent++;
      if (notification.read) {
        analytics.trends.hourly[hourKey].read++;
      }
    });

    // Calculate rates and averages
    analytics.summary.readRate = analytics.summary.totalSent > 0 
      ? (analytics.summary.totalRead / analytics.summary.totalSent) * 100 
      : 0;

    analytics.summary.avgTimeToRead = readNotifications > 0 
      ? totalReadTime / readNotifications / 1000 / 60 // Convert to minutes
      : 0;

    // Calculate channel effectiveness
    Object.keys(analytics.breakdown.byChannel).forEach(channel => {
      const sent = analytics.breakdown.byChannel[channel];
      // This would require more complex tracking to get accurate read rates per channel
      analytics.performance.channelEffectiveness[channel] = {
        sent: sent,
        estimatedReadRate: analytics.summary.readRate // Simplified
      };
    });

    // Top performing types
    analytics.performance.topPerformingTypes = Object.entries(analytics.breakdown.byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      analytics: analytics,
      timeRange: timeRange,
      filters: { type, channel },
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Error fetching notification analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification analytics'
    });
  }
});

/**
 * 📨 SEND TEST NOTIFICATION
 * Send test notification for debugging
 */
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const { userId, channels = { push: true } } = req.body;

    const testNotification = {
      userId: userId || req.user.uid,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working.',
      data: { test: true },
      channels: channels,
      priority: 'normal',
      status: 'sent',
      createdAt: new Date(),
      read: false,
      sentBy: req.user.uid
    };

    const notificationRef = await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add(testNotification);

    // Process the test notification
    await processNotification(notificationRef.id, testNotification);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      notificationId: notificationRef.id
    });

  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

/**
 * Helper function to process notification delivery
 */
async function processNotification(notificationId, notificationData) {
  try {
    const { userId, channels, title, message, data } = notificationData;

    // Get user's notification preferences
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

    const userData = userDoc.data();
    const userPreferences = userData?.preferences?.notifications || {};

    // Process each channel
    const deliveryResults = {};

    if (channels.push && userPreferences.push !== false) {
      deliveryResults.push = await sendPushNotification(userId, title, message, data);
    }

    if (channels.email && userPreferences.email !== false) {
      deliveryResults.email = await sendEmailNotification(userId, userData.email, title, message, data);
    }

    if (channels.sms && userPreferences.sms === true && userData.profile?.phoneNumber) {
      deliveryResults.sms = await sendSMSNotification(userData.profile.phoneNumber, title, message);
    }

    // Update notification with delivery results
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .doc(notificationId)
      .update({
        deliveryResults: deliveryResults,
        processedAt: new Date()
      });

    return { success: true, deliveryResults };

  } catch (error) {
    logger.error('Error processing notification:', error);
    
    // Update notification with error
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .doc(notificationId)
      .update({
        error: error.message,
        processedAt: new Date(),
        status: 'failed'
      });

    throw error;
  }
}

/**
 * Helper function to send push notification
 */
async function sendPushNotification(userId, title, message, data) {
  try {
    // This would integrate with Firebase Cloud Messaging (FCM)
    // For now, return success simulation
    logger.info(`Push notification sent to user ${userId}: ${title}`);
    return { success: true, provider: 'fcm', sentAt: new Date() };
  } catch (error) {
    logger.error('Push notification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to send email notification
 */
async function sendEmailNotification(userId, email, title, message, data) {
  try {
    // This would integrate with email service (SendGrid, SES, etc.)
    // For now, return success simulation
    logger.info(`Email notification sent to ${email}: ${title}`);
    return { success: true, provider: 'email', sentAt: new Date() };
  } catch (error) {
    logger.error('Email notification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to send SMS notification
 */
async function sendSMSNotification(phoneNumber, title, message) {
  try {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, return success simulation
    logger.info(`SMS notification sent to ${phoneNumber}: ${title}`);
    return { success: true, provider: 'sms', sentAt: new Date() };
  } catch (error) {
    logger.error('SMS notification failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;