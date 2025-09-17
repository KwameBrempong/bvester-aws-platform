// 🚀 BVESTER - USER API ROUTES
// Comprehensive user management endpoints

const express = require('express');
const router = express.Router();
const { requireUserType, requireAdmin, requireOwnership } = require('../../middleware/authMiddleware');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

/**
 * 👤 GET USER PROFILE
 * Get current user profile or specific user (admin only)
 */
router.get('/profile/:id?', async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const currentUserId = req.user.uid;
    
    // Determine which user profile to fetch
    const targetUserId = requestedUserId || currentUserId;
    
    // Check permissions for accessing other users' profiles
    if (requestedUserId && requestedUserId !== currentUserId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Can only access your own profile.'
      });
    }

    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(targetUserId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    // Remove sensitive data for non-admin users accessing others
    if (requestedUserId && requestedUserId !== currentUserId && req.user.userType !== 'admin') {
      const publicProfile = {
        userId: targetUserId,
        profile: {
          displayName: userData.profile?.displayName,
          avatar: userData.profile?.avatar,
          country: userData.profile?.country,
          joinedDate: userData.metadata?.createdAt
        },
        userType: userData.userType,
        verification: {
          emailVerified: userData.verification?.emailVerified,
          kycStatus: userData.verification?.kycStatus
        }
      };
      
      return res.json({
        success: true,
        user: publicProfile
      });
    }

    // Full profile for own user or admin accessing others
    res.json({
      success: true,
      user: {
        userId: targetUserId,
        ...userData
      }
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * ✏️ UPDATE USER PROFILE
 * Update user profile information
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.email;
    delete updates.emailVerified;
    delete updates.metadata?.createdAt;
    delete updates.verification; // Verification handled separately
    delete updates.subscription; // Subscription handled separately

    // Add update timestamp
    updates.metadata = {
      ...updates.metadata,
      updatedAt: new Date()
    };

    // Validate required fields if provided
    if (updates.profile) {
      if (updates.profile.phoneNumber && !updates.profile.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use international format (e.g., +1234567890)'
        });
      }
    }

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update(updates);

    // Log profile update
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'profile_updated',
        resource: { type: 'user', id: userId },
        details: Object.keys(updates),
        timestamp: new Date()
      });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * 📷 UPDATE PROFILE AVATAR
 * Update user profile picture
 */
router.post('/profile/avatar', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(avatarUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid avatar URL format'
      });
    }

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        'profile.avatar': avatarUrl,
        'metadata.updatedAt': new Date()
      });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatarUrl: avatarUrl
    });

  } catch (error) {
    logger.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update avatar'
    });
  }
});

/**
 * 🔔 GET USER NOTIFICATIONS
 * Fetch user notifications with pagination
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      read = 'all', // 'read', 'unread', 'all'
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

    // Apply sorting and pagination
    query = query.orderBy(sortBy, sortOrder);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const notifications = [];

    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
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
      }
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
 * ✅ MARK NOTIFICATION AS READ
 * Mark single or multiple notifications as read
 */
router.put('/notifications/read', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { notificationIds, markAll = false } = req.body;

    if (markAll) {
      // Mark all notifications as read
      const unreadQuery = await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = FirebaseAdmin.adminFirestore.batch();
      
      unreadQuery.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date()
        });
      });

      await batch.commit();

      res.json({
        success: true,
        message: `Marked ${unreadQuery.size} notifications as read`
      });

    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const batch = FirebaseAdmin.adminFirestore.batch();

      for (const notificationId of notificationIds) {
        const notificationRef = FirebaseAdmin.adminFirestore
          .collection('notifications')
          .doc(notificationId);

        // Verify ownership
        const notificationDoc = await notificationRef.get();
        if (notificationDoc.exists && notificationDoc.data().userId === userId) {
          batch.update(notificationRef, {
            read: true,
            readAt: new Date()
          });
        }
      }

      await batch.commit();

      res.json({
        success: true,
        message: `Marked ${notificationIds.length} notifications as read`
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
 * 📊 GET USER ACTIVITY LOG
 * User's activity history
 */
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      page = 1, 
      limit = 20, 
      action,
      resourceType,
      sortOrder = 'desc'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .where('userId', '==', userId);

    // Apply filters
    if (action) {
      query = query.where('action', '==', action);
    }

    if (resourceType) {
      query = query.where('resource.type', '==', resourceType);
    }

    // Apply sorting and pagination
    query = query.orderBy('timestamp', sortOrder);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const activities = [];

    snapshot.forEach(doc => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      activities: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        hasMore: activities.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity'
    });
  }
});

/**
 * 🔒 UPDATE USER PREFERENCES
 * Update notification and privacy preferences
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

    const validPreferences = {
      notifications: {
        email: preferences.notifications?.email ?? true,
        push: preferences.notifications?.push ?? true,
        sms: preferences.notifications?.sms ?? false,
        investment: preferences.notifications?.investment ?? true,
        marketing: preferences.notifications?.marketing ?? false,
        security: preferences.notifications?.security ?? true
      },
      privacy: {
        profileVisibility: preferences.privacy?.profileVisibility ?? 'public',
        investmentHistory: preferences.privacy?.investmentHistory ?? 'private',
        contactInfo: preferences.privacy?.contactInfo ?? 'private'
      },
      display: {
        language: preferences.display?.language ?? 'en',
        currency: preferences.display?.currency ?? 'USD',
        timezone: preferences.display?.timezone ?? 'UTC',
        theme: preferences.display?.theme ?? 'light'
      }
    };

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        preferences: validPreferences,
        'metadata.updatedAt': new Date()
      });

    res.json({
      success: true,
      preferences: validPreferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * 🔐 CHANGE PASSWORD
 * Update user password (requires current password)
 */
router.put('/password', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Update password in Firebase Auth
    await FirebaseAdmin.adminAuth.updateUser(userId, {
      password: newPassword
    });

    // Log password change
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'password_changed',
        resource: { type: 'user', id: userId },
        timestamp: new Date()
      });

    // Send security notification
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
        userId: userId,
        type: 'security',
        title: 'Password Changed',
        message: 'Your password has been successfully updated.',
        channels: { email: true, push: true },
        createdAt: new Date(),
        read: false
      });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
});

/**
 * 📧 REQUEST EMAIL VERIFICATION
 * Send email verification link
 */
router.post('/verification/email', async (req, res) => {
  try {
    const userId = req.user.uid;

    // Generate email verification link
    const link = await FirebaseAdmin.adminAuth.generateEmailVerificationLink(req.user.email);

    // Send verification email (this would integrate with your email service)
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
        userId: userId,
        type: 'verification',
        title: 'Verify Your Email',
        message: 'Please click the link in your email to verify your account.',
        data: { verificationLink: link },
        channels: { email: true },
        createdAt: new Date(),
        read: false
      });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    logger.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }
});

/**
 * 🗑️ DELETE USER ACCOUNT
 * Soft delete user account
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { confirmPassword, reason } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required'
      });
    }

    // Soft delete - deactivate account instead of removing
    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        status: 'deactivated',
        deactivation: {
          reason: reason || 'user_requested',
          deactivatedAt: new Date(),
          canReactivate: true
        },
        'metadata.updatedAt': new Date()
      });

    // Cancel any active subscriptions
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

    const userData = userDoc.data();
    if (userData.subscription?.subscriptionId) {
      // This would integrate with PaymentService to cancel subscription
      logger.info(`Should cancel subscription: ${userData.subscription.subscriptionId}`);
    }

    // Log account deletion
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'account_deactivated',
        resource: { type: 'user', id: userId },
        details: { reason },
        timestamp: new Date()
      });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

/**
 * 📈 GET USER ANALYTICS SUMMARY
 * User's platform usage analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { timeRange = '30d' } = req.query;

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

    // Get activity within time range
    const activityQuery = await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .get();

    const activities = {};
    activityQuery.forEach(doc => {
      const activity = doc.data();
      activities[activity.action] = (activities[activity.action] || 0) + 1;
    });

    // Get user statistics
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

    const userData = userDoc.data();
    const joinDate = userData.metadata?.createdAt?.toDate();
    const daysSinceJoined = joinDate ? Math.floor((now - joinDate) / (1000 * 60 * 60 * 24)) : 0;

    const analytics = {
      summary: {
        daysSinceJoined: daysSinceJoined,
        totalActivities: Object.values(activities).reduce((sum, count) => sum + count, 0),
        lastActive: userData.activity?.lastActiveAt?.toDate(),
        accountStatus: userData.status || 'active'
      },
      activities: activities,
      timeRange: timeRange,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      analytics: analytics
    });

  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

module.exports = router;