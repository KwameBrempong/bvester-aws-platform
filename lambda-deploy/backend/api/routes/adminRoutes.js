// 🚀 BVESTER - ADMIN API ROUTES
// Comprehensive administrative management endpoints

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/authMiddleware');
const { FirebaseAdmin } = require('../../config/firebase-admin');
const logger = require('../../utils/logger');

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * 👥 USER MANAGEMENT
 */

/**
 * 📋 GET ALL USERS
 * Get all users with filtering and pagination
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userType,
      status,
      country,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore.collection('users');

    // Apply filters
    if (userType) {
      query = query.where('userType', '==', userType);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (country) {
      query = query.where('profile.country', '==', country);
    }

    // Apply sorting
    query = query.orderBy(`${sortBy === 'createdAt' ? 'metadata.createdAt' : sortBy}`, sortOrder);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      
      // Apply search filter if specified
      if (search) {
        const searchTerm = search.toLowerCase();
        const displayName = userData.profile?.displayName?.toLowerCase() || '';
        const email = userData.email?.toLowerCase() || '';
        
        if (!displayName.includes(searchTerm) && !email.includes(searchTerm)) {
          return;
        }
      }

      users.push({
        id: doc.id,
        ...userData,
        // Remove sensitive data
        password: undefined,
        twoFactorSecret: undefined
      });
    });

    res.json({
      success: true,
      users: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length,
        hasMore: users.length === parseInt(limit)
      },
      filters: { userType, status, country, search }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * 🔒 SUSPEND/UNSUSPEND USER
 * Suspend or unsuspend user account
 */
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // 'suspend', 'unsuspend', 'deactivate'

    if (!action || !['suspend', 'unsuspend', 'deactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Valid action is required: suspend, unsuspend, or deactivate'
      });
    }

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

    const updates = {
      status: action === 'unsuspend' ? 'active' : action === 'suspend' ? 'suspended' : 'deactivated',
      'metadata.updatedAt': new Date()
    };

    if (action === 'suspend') {
      updates.suspension = {
        reason: reason || 'Administrative action',
        suspendedAt: new Date(),
        suspendedBy: req.user.uid
      };
    } else if (action === 'deactivate') {
      updates.deactivation = {
        reason: reason || 'Administrative action',
        deactivatedAt: new Date(),
        deactivatedBy: req.user.uid
      };
    } else if (action === 'unsuspend') {
      updates.suspension = null;
    }

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update(updates);

    // Disable/enable Firebase Auth account
    if (action === 'suspend' || action === 'deactivate') {
      await FirebaseAdmin.adminAuth.updateUser(userId, { disabled: true });
    } else if (action === 'unsuspend') {
      await FirebaseAdmin.adminAuth.updateUser(userId, { disabled: false });
    }

    // Log admin action
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: req.user.uid,
        action: `user_${action}`,
        resource: { type: 'user', id: userId },
        details: { reason, targetUser: userId },
        timestamp: new Date()
      });

    // Send notification to user
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
        userId: userId,
        type: 'account',
        title: `Account ${action === 'unsuspend' ? 'Reactivated' : action === 'suspend' ? 'Suspended' : 'Deactivated'}`,
        message: `Your account has been ${action === 'unsuspend' ? 'reactivated' : action}d. ${reason ? `Reason: ${reason}` : ''}`,
        channels: { email: true, push: true },
        createdAt: new Date(),
        read: false
      });

    res.json({
      success: true,
      message: `User ${action}d successfully`,
      userId: userId,
      newStatus: updates.status
    });

  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

/**
 * 🏢 BUSINESS MANAGEMENT
 */

/**
 * 📋 GET ALL BUSINESSES
 * Get all businesses with admin-level details
 */
router.get('/businesses', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      country,
      sector,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore.collection('businesses');

    // Apply filters
    if (status) {
      query = query.where(`status.${status}`, '==', true);
    }

    if (country) {
      query = query.where('location.country', '==', country);
    }

    if (sector) {
      query = query.where('industry.primarySector', '==', sector);
    }

    if (verified !== undefined) {
      query = query.where('status.isVerified', '==', verified === 'true');
    }

    // Apply sorting
    const sortField = sortBy === 'createdAt' ? 'metadata.createdAt' : sortBy;
    query = query.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const businesses = [];

    for (const doc of snapshot.docs) {
      const businessData = doc.data();
      
      // Apply search filter if specified
      if (search) {
        const searchTerm = search.toLowerCase();
        const businessName = businessData.basicInfo?.businessName?.toLowerCase() || '';
        const description = businessData.basicInfo?.description?.toLowerCase() || '';
        
        if (!businessName.includes(searchTerm) && !description.includes(searchTerm)) {
          continue;
        }
      }

      // Get owner information
      const ownerDoc = await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(businessData.ownerId)
        .get();

      const ownerInfo = ownerDoc.exists ? {
        id: ownerDoc.id,
        email: ownerDoc.data().email,
        displayName: ownerDoc.data().profile?.displayName
      } : null;

      businesses.push({
        id: doc.id,
        ...businessData,
        ownerInfo: ownerInfo
      });
    }

    res.json({
      success: true,
      businesses: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: businesses.length,
        hasMore: businesses.length === parseInt(limit)
      },
      filters: { status, country, sector, verified, search }
    });

  } catch (error) {
    logger.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch businesses'
    });
  }
});

/**
 * ✅ VERIFY/UNVERIFY BUSINESS
 * Verify or unverify business profile
 */
router.put('/businesses/:businessId/verify', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { action, reason } = req.body; // 'verify' or 'unverify'

    if (!action || !['verify', 'unverify'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Valid action is required: verify or unverify'
      });
    }

    const businessDoc = await FirebaseAdmin.adminFirestore
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
    const isVerified = action === 'verify';

    const updates = {
      'status.isVerified': isVerified,
      'status.verificationDate': isVerified ? new Date() : null,
      'status.verifiedBy': isVerified ? req.user.uid : null,
      'metadata.updatedAt': new Date()
    };

    if (!isVerified && reason) {
      updates['status.unverificationReason'] = reason;
    }

    await FirebaseAdmin.adminFirestore
      .collection('businesses')
      .doc(businessId)
      .update(updates);

    // Log admin action
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: req.user.uid,
        action: `business_${action}`,
        resource: { type: 'business', id: businessId },
        details: { reason, businessName: businessData.basicInfo?.businessName },
        timestamp: new Date()
      });

    // Send notification to business owner
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
        userId: businessData.ownerId,
        type: 'business',
        title: `Business ${isVerified ? 'Verified' : 'Unverified'}`,
        message: `Your business "${businessData.basicInfo?.businessName}" has been ${isVerified ? 'verified' : 'unverified'}. ${reason ? `Reason: ${reason}` : ''}`,
        channels: { email: true, push: true },
        createdAt: new Date(),
        read: false
      });

    res.json({
      success: true,
      message: `Business ${action}d successfully`,
      businessId: businessId,
      isVerified: isVerified
    });

  } catch (error) {
    logger.error('Error updating business verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business verification'
    });
  }
});

/**
 * 💰 INVESTMENT MANAGEMENT
 */

/**
 * 📋 GET ALL INVESTMENTS
 * Get all investments with admin-level details
 */
router.get('/investments', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      currency,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = FirebaseAdmin.adminFirestore.collection('investments');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('transaction.investmentType', '==', type);
    }

    if (currency) {
      query = query.where('transaction.currency', '==', currency);
    }

    if (minAmount) {
      query = query.where('transaction.amount', '>=', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.where('transaction.amount', '<=', parseFloat(maxAmount));
    }

    // Apply sorting and pagination
    query = query.orderBy(sortBy === 'createdAt' ? 'createdAt' : `transaction.${sortBy}`, sortOrder);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const investments = [];

    for (const doc of snapshot.docs) {
      const investmentData = doc.data();
      
      // Get investor and business details
      const [investorDoc, businessDoc] = await Promise.all([
        FirebaseAdmin.adminFirestore.collection('users').doc(investmentData.investorId).get(),
        FirebaseAdmin.adminFirestore.collection('businesses').doc(investmentData.businessId).get()
      ]);

      const investorInfo = investorDoc.exists ? {
        id: investorDoc.id,
        email: investorDoc.data().email,
        displayName: investorDoc.data().profile?.displayName
      } : null;

      const businessInfo = businessDoc.exists ? {
        id: businessDoc.id,
        name: businessDoc.data().basicInfo?.businessName,
        sector: businessDoc.data().industry?.primarySector
      } : null;

      investments.push({
        id: doc.id,
        ...investmentData,
        investorInfo: investorInfo,
        businessInfo: businessInfo
      });
    }

    res.json({
      success: true,
      investments: investments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: investments.length,
        hasMore: investments.length === parseInt(limit)
      },
      filters: { status, type, currency, minAmount, maxAmount }
    });

  } catch (error) {
    logger.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investments'
    });
  }
});

/**
 * 🔄 UPDATE INVESTMENT STATUS
 * Manually update investment status (for issue resolution)
 */
router.put('/investments/:investmentId/status', async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const investmentDoc = await FirebaseAdmin.adminFirestore
      .collection('investments')
      .doc(investmentId)
      .get();

    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investmentData = investmentDoc.data();

    await FirebaseAdmin.adminFirestore
      .collection('investments')
      .doc(investmentId)
      .update({
        status: status,
        'transaction.status': status,
        adminUpdate: {
          updatedBy: req.user.uid,
          updatedAt: new Date(),
          reason: reason || 'Administrative update',
          previousStatus: investmentData.status
        },
        updatedAt: new Date()
      });

    // Log admin action
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: req.user.uid,
        action: 'investment_status_updated',
        resource: { type: 'investment', id: investmentId },
        details: { 
          newStatus: status, 
          previousStatus: investmentData.status,
          reason: reason
        },
        timestamp: new Date()
      });

    // Send notifications to involved parties
    const notifications = [
      {
        userId: investmentData.investorId,
        type: 'investment',
        title: 'Investment Status Updated',
        message: `Your investment status has been updated to "${status}". ${reason ? `Reason: ${reason}` : ''}`,
        channels: { email: true, push: true },
        createdAt: new Date(),
        read: false
      },
      {
        userId: investmentData.businessOwnerId || investmentData.businessId,
        type: 'investment',
        title: 'Investment Status Updated',
        message: `An investment in your business has been updated to "${status}". ${reason ? `Reason: ${reason}` : ''}`,
        channels: { email: true, push: true },
        createdAt: new Date(),
        read: false
      }
    ];

    const batch = FirebaseAdmin.adminFirestore.batch();
    notifications.forEach(notification => {
      const notificationRef = FirebaseAdmin.adminFirestore.collection('notifications').doc();
      batch.set(notificationRef, notification);
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'Investment status updated successfully',
      investmentId: investmentId,
      newStatus: status
    });

  } catch (error) {
    logger.error('Error updating investment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update investment status'
    });
  }
});

/**
 * 📊 PLATFORM ANALYTICS SUMMARY
 * High-level platform analytics
 */
router.get('/analytics/summary', async (req, res) => {
  try {
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

    // Get counts in parallel
    const [
      totalUsersSnapshot,
      totalBusinessesSnapshot,
      totalInvestmentsSnapshot,
      newUsersSnapshot,
      newBusinessesSnapshot,
      newInvestmentsSnapshot,
      paymentsSnapshot
    ] = await Promise.all([
      FirebaseAdmin.adminFirestore.collection('users').get(),
      FirebaseAdmin.adminFirestore.collection('businesses').get(),
      FirebaseAdmin.adminFirestore.collection('investments').get(),
      FirebaseAdmin.adminFirestore.collection('users').where('metadata.createdAt', '>=', startDate).get(),
      FirebaseAdmin.adminFirestore.collection('businesses').where('metadata.createdAt', '>=', startDate).get(),
      FirebaseAdmin.adminFirestore.collection('investments').where('createdAt', '>=', startDate).get(),
      FirebaseAdmin.adminFirestore.collection('payments').where('status', '==', 'completed').get()
    ]);

    // Calculate metrics
    let totalRevenue = 0;
    let newRevenue = 0;

    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      totalRevenue += payment.amount || 0;
      
      if (payment.createdAt && payment.createdAt.toDate() >= startDate) {
        newRevenue += payment.amount || 0;
      }
    });

    let totalInvestmentAmount = 0;
    let newInvestmentAmount = 0;

    totalInvestmentsSnapshot.forEach(doc => {
      const investment = doc.data();
      if (investment.transaction?.status === 'completed') {
        totalInvestmentAmount += investment.transaction.amount || 0;
      }
    });

    newInvestmentsSnapshot.forEach(doc => {
      const investment = doc.data();
      if (investment.transaction?.status === 'completed') {
        newInvestmentAmount += investment.transaction.amount || 0;
      }
    });

    // User type breakdown
    const userTypes = { investor: 0, business: 0, admin: 0 };
    totalUsersSnapshot.forEach(doc => {
      const user = doc.data();
      const userType = user.userType || 'investor';
      userTypes[userType] = (userTypes[userType] || 0) + 1;
    });

    // Business status breakdown
    const businessStatuses = { active: 0, published: 0, verified: 0 };
    totalBusinessesSnapshot.forEach(doc => {
      const business = doc.data();
      if (business.status?.isActive) businessStatuses.active++;
      if (business.status?.isPublished) businessStatuses.published++;
      if (business.status?.isVerified) businessStatuses.verified++;
    });

    const summary = {
      overview: {
        totalUsers: totalUsersSnapshot.size,
        totalBusinesses: totalBusinessesSnapshot.size,
        totalInvestments: totalInvestmentsSnapshot.size,
        totalRevenue: totalRevenue,
        totalInvestmentAmount: totalInvestmentAmount
      },
      growth: {
        newUsers: newUsersSnapshot.size,
        newBusinesses: newBusinessesSnapshot.size,
        newInvestments: newInvestmentsSnapshot.size,
        newRevenue: newRevenue,
        newInvestmentAmount: newInvestmentAmount
      },
      breakdown: {
        userTypes: userTypes,
        businessStatuses: businessStatuses
      },
      timeRange: timeRange,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      summary: summary
    });

  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary'
    });
  }
});

/**
 * 🔍 SEARCH ACROSS PLATFORM
 * Global search across users, businesses, and investments
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query; // type: 'all', 'users', 'businesses', 'investments'

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchTerm = q.toLowerCase();
    const results = {
      users: [],
      businesses: [],
      investments: [],
      totalFound: 0
    };

    // Search users
    if (type === 'all' || type === 'users') {
      const usersSnapshot = await FirebaseAdmin.adminFirestore.collection('users').get();
      
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        const displayName = user.profile?.displayName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        
        if (displayName.includes(searchTerm) || email.includes(searchTerm)) {
          results.users.push({
            id: doc.id,
            type: 'user',
            displayName: user.profile?.displayName,
            email: user.email,
            userType: user.userType,
            status: user.status,
            createdAt: user.metadata?.createdAt
          });
        }
      });
    }

    // Search businesses
    if (type === 'all' || type === 'businesses') {
      const businessesSnapshot = await FirebaseAdmin.adminFirestore.collection('businesses').get();
      
      businessesSnapshot.forEach(doc => {
        const business = doc.data();
        const businessName = business.basicInfo?.businessName?.toLowerCase() || '';
        const description = business.basicInfo?.description?.toLowerCase() || '';
        
        if (businessName.includes(searchTerm) || description.includes(searchTerm)) {
          results.businesses.push({
            id: doc.id,
            type: 'business',
            businessName: business.basicInfo?.businessName,
            sector: business.industry?.primarySector,
            country: business.location?.country,
            status: business.status,
            createdAt: business.metadata?.createdAt
          });
        }
      });
    }

    // Search investments
    if (type === 'all' || type === 'investments') {
      const investmentsSnapshot = await FirebaseAdmin.adminFirestore.collection('investments').get();
      
      for (const doc of investmentsSnapshot.docs) {
        const investment = doc.data();
        
        // Get related business and investor info
        const [businessDoc, investorDoc] = await Promise.all([
          FirebaseAdmin.adminFirestore.collection('businesses').doc(investment.businessId).get(),
          FirebaseAdmin.adminFirestore.collection('users').doc(investment.investorId).get()
        ]);

        const businessName = businessDoc.exists ? businessDoc.data().basicInfo?.businessName?.toLowerCase() : '';
        const investorName = investorDoc.exists ? investorDoc.data().profile?.displayName?.toLowerCase() : '';
        
        if (businessName.includes(searchTerm) || investorName.includes(searchTerm)) {
          results.investments.push({
            id: doc.id,
            type: 'investment',
            amount: investment.transaction?.amount,
            currency: investment.transaction?.currency,
            businessName: businessDoc.exists ? businessDoc.data().basicInfo?.businessName : null,
            investorName: investorDoc.exists ? investorDoc.data().profile?.displayName : null,
            status: investment.status,
            createdAt: investment.createdAt
          });
        }
      }
    }

    results.totalFound = results.users.length + results.businesses.length + results.investments.length;

    // Apply global limit
    const globalLimit = parseInt(limit);
    if (results.totalFound > globalLimit) {
      const perCategory = Math.ceil(globalLimit / 3);
      results.users = results.users.slice(0, perCategory);
      results.businesses = results.businesses.slice(0, perCategory);
      results.investments = results.investments.slice(0, perCategory);
    }

    res.json({
      success: true,
      results: results,
      searchQuery: q,
      searchType: type
    });

  } catch (error) {
    logger.error('Error performing admin search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

/**
 * 📨 SEND SYSTEM ANNOUNCEMENT
 * Send platform-wide announcement
 */
router.post('/announcements', async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'announcement',
      priority = 'normal',
      targetAudience = 'all', // 'all', 'investors', 'businesses'
      channels = { push: true, email: false },
      scheduledFor = null
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    // Determine recipients based on target audience
    let recipientQuery = FirebaseAdmin.adminFirestore.collection('users');
    
    if (targetAudience === 'investors') {
      recipientQuery = recipientQuery.where('userType', '==', 'investor');
    } else if (targetAudience === 'businesses') {
      recipientQuery = recipientQuery.where('userType', '==', 'business');
    }

    const recipientsSnapshot = await recipientQuery.get();
    const recipientIds = recipientsSnapshot.docs.map(doc => doc.id);

    // Create announcement record
    const announcementData = {
      title: title,
      message: message,
      type: type,
      priority: priority,
      targetAudience: targetAudience,
      channels: channels,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy: req.user.uid,
      createdAt: new Date(),
      recipientCount: recipientIds.length,
      status: scheduledFor ? 'scheduled' : 'sent'
    };

    const announcementRef = await FirebaseAdmin.adminFirestore
      .collection('announcements')
      .add(announcementData);

    // Send notifications to all recipients
    const batch = FirebaseAdmin.adminFirestore.batch();
    const notificationPromises = [];

    for (const userId of recipientIds) {
      const notificationData = {
        userId: userId,
        type: type,
        title: title,
        message: message,
        data: { announcementId: announcementRef.id },
        channels: channels,
        priority: priority,
        status: scheduledFor ? 'scheduled' : 'sent',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdAt: new Date(),
        read: false,
        sentBy: req.user.uid
      };

      const notificationRef = FirebaseAdmin.adminFirestore.collection('notifications').doc();
      batch.set(notificationRef, notificationData);

      // Add to processing queue if not scheduled
      if (!scheduledFor) {
        notificationPromises.push(processAnnouncementNotification(notificationRef.id, notificationData));
      }
    }

    await batch.commit();

    // Process immediate notifications
    if (!scheduledFor) {
      await Promise.allSettled(notificationPromises);
    }

    res.json({
      success: true,
      message: 'Announcement sent successfully',
      announcementId: announcementRef.id,
      recipientCount: recipientIds.length,
      scheduled: !!scheduledFor
    });

  } catch (error) {
    logger.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send announcement'
    });
  }
});

/**
 * 🛠️ SYSTEM MAINTENANCE MODE
 * Enable/disable maintenance mode
 */
router.put('/maintenance', async (req, res) => {
  try {
    const { enabled, message, estimatedDuration } = req.body;

    const maintenanceConfig = {
      enabled: enabled === true,
      message: message || 'System is under maintenance. Please check back later.',
      estimatedDuration: estimatedDuration || null,
      enabledBy: req.user.uid,
      enabledAt: enabled ? new Date() : null,
      disabledAt: !enabled ? new Date() : null
    };

    // Store maintenance configuration
    await FirebaseAdmin.adminFirestore
      .collection('systemConfig')
      .doc('maintenance')
      .set(maintenanceConfig);

    // Log maintenance action
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: req.user.uid,
        action: enabled ? 'maintenance_enabled' : 'maintenance_disabled',
        resource: { type: 'system', id: 'maintenance' },
        details: { message, estimatedDuration },
        timestamp: new Date()
      });

    res.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      config: maintenanceConfig
    });

  } catch (error) {
    logger.error('Error updating maintenance mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update maintenance mode'
    });
  }
});

/**
 * 📚 LEARNING RESOURCES MANAGEMENT
 */

/**
 * 📋 GET ALL LEARNING RESOURCES (ADMIN)
 * Get all learning resources with admin controls
 */
router.get('/learning-resources', async (req, res) => {
  try {
    const { category, targetAudience, type, published, limit = 50 } = req.query;
    
    let query = FirebaseAdmin.adminFirestore.collection('learningResources');
    
    // Apply filters
    if (category) {
      query = query.where('category', '==', category.toLowerCase());
    }
    if (targetAudience) {
      query = query.where('targetAudience', '==', targetAudience);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (published !== undefined) {
      query = query.where('published', '==', published === 'true');
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const resources = [];
    
    snapshot.forEach(doc => {
      resources.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      resources: resources,
      count: resources.length
    });

  } catch (error) {
    logger.error('Error fetching learning resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning resources'
    });
  }
});

/**
 * ➕ CREATE LEARNING RESOURCE
 * Create new learning resource
 */
router.post('/learning-resources', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type, // 'document', 'video', 'course', 'article'
      targetAudience, // 'investor', 'business', 'both'
      tags,
      difficulty, // 'beginner', 'intermediate', 'advanced'
      estimatedTime,
      content,
      fileUrl,
      fileName
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !type || !targetAudience) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, category, type, targetAudience'
      });
    }

    // Create resource document
    const resourceData = {
      title: title.trim(),
      description: description.trim(),
      category: category.toLowerCase(),
      type,
      targetAudience,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim().toLowerCase())) : [],
      difficulty: difficulty || 'beginner',
      estimatedTime: estimatedTime || null,
      content: content || '',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      createdBy: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      published: true,
      viewCount: 0,
      likes: 0
    };

    const docRef = await FirebaseAdmin.adminFirestore.collection('learningResources').add(resourceData);

    res.status(201).json({
      success: true,
      message: 'Learning resource created successfully',
      resource: {
        id: docRef.id,
        ...resourceData
      }
    });

  } catch (error) {
    logger.error('Error creating learning resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create learning resource'
    });
  }
});

/**
 * ✏️ UPDATE LEARNING RESOURCE
 * Update existing learning resource
 */
router.put('/learning-resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      type,
      targetAudience,
      tags,
      difficulty,
      estimatedTime,
      content,
      published,
      fileUrl,
      fileName
    } = req.body;

    const resourceRef = FirebaseAdmin.adminFirestore.collection('learningResources').doc(id);
    const resourceDoc = await resourceRef.get();

    if (!resourceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Learning resource not found'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    // Update fields if provided
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category.toLowerCase();
    if (type) updateData.type = type;
    if (targetAudience) updateData.targetAudience = targetAudience;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim().toLowerCase());
    if (difficulty) updateData.difficulty = difficulty;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
    if (content !== undefined) updateData.content = content;
    if (published !== undefined) updateData.published = published === true || published === 'true';
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;

    await resourceRef.update(updateData);

    // Get updated document
    const updatedDoc = await resourceRef.get();

    res.json({
      success: true,
      message: 'Learning resource updated successfully',
      resource: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });

  } catch (error) {
    logger.error('Error updating learning resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update learning resource'
    });
  }
});

/**
 * 🗑️ DELETE LEARNING RESOURCE
 * Delete learning resource
 */
router.delete('/learning-resources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resourceRef = FirebaseAdmin.adminFirestore.collection('learningResources').doc(id);
    const resourceDoc = await resourceRef.get();

    if (!resourceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Learning resource not found'
      });
    }

    await resourceRef.delete();

    // Log admin action
    await FirebaseAdmin.adminFirestore.collection('activityLogs').add({
      userId: req.user.uid,
      action: 'learning_resource_deleted',
      resource: { type: 'learningResource', id: id },
      details: { title: resourceDoc.data().title },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Learning resource deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting learning resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete learning resource'
    });
  }
});

// Helper function to process announcement notifications
async function processAnnouncementNotification(notificationId, notificationData) {
  // This would integrate with the notification processing system
  // For now, just log the action
  logger.info(`Processing announcement notification: ${notificationId}`);
  return { success: true };
}

module.exports = router;