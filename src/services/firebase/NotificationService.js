// Investment Notification & Matching Service for BizInvest Hub
// Handles investment alerts, matching notifications, and real-time updates

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export class NotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      console.log('Creating notification:', notificationData);
      
      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created with ID:', docRef.id);
      
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, options = {}) {
    try {
      const constraints = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];
      
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(collection(db, 'notifications'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const notificationRef = doc(db, 'notifications', docSnapshot.id);
        updatePromises.push(updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }));
      });
      
      await Promise.all(updatePromises);
      console.log(`Marked ${updatePromises.length} notifications as read for user:`, userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Investment-specific notification creators
  static async notifyInvestorInterest(businessOwnerId, investorId, businessName) {
    return this.createNotification({
      userId: businessOwnerId,
      type: 'investor_interest',
      title: '👥 New Investor Interest',
      message: `An investor has expressed interest in ${businessName}`,
      data: {
        investorId,
        businessName,
        actionType: 'investor_interest'
      },
      priority: 'high',
      category: 'investment'
    });
  }

  static async notifyInvestmentPledge(businessOwnerId, investorId, businessName, amount) {
    return this.createNotification({
      userId: businessOwnerId,
      type: 'investment_pledge',
      title: '💰 Investment Pledge Received',
      message: `You've received an investment pledge of $${amount.toLocaleString()} for ${businessName}`,
      data: {
        investorId,
        businessName,
        amount,
        actionType: 'investment_pledge'
      },
      priority: 'critical',
      category: 'investment'
    });
  }

  static async notifyPledgeAccepted(investorId, businessName, amount) {
    return this.createNotification({
      userId: investorId,
      type: 'pledge_accepted',
      title: '✅ Investment Pledge Accepted',
      message: `Your pledge of $${amount.toLocaleString()} for ${businessName} has been accepted!`,
      data: {
        businessName,
        amount,
        actionType: 'pledge_accepted'
      },
      priority: 'high',
      category: 'investment'
    });
  }

  static async notifyPledgeRejected(investorId, businessName, amount, reason = '') {
    return this.createNotification({
      userId: investorId,
      type: 'pledge_rejected',
      title: '❌ Investment Pledge Declined',
      message: `Your pledge of $${amount.toLocaleString()} for ${businessName} was declined${reason ? ': ' + reason : '.'}`,
      data: {
        businessName,
        amount,
        reason,
        actionType: 'pledge_rejected'
      },
      priority: 'medium',
      category: 'investment'
    });
  }

  static async notifyNewMatchingBusiness(investorId, businessName, readinessScore, matchScore) {
    return this.createNotification({
      userId: investorId,
      type: 'new_match',
      title: '🎯 New Investment Match',
      message: `${businessName} matches your investment criteria (${matchScore}% match, ${readinessScore}/100 readiness)`,
      data: {
        businessName,
        readinessScore,
        matchScore,
        actionType: 'new_match'
      },
      priority: 'medium',
      category: 'matching'
    });
  }

  static async notifyBusinessUpdated(investorId, businessName, updateType) {
    const updateMessages = {
      'readiness_improved': `${businessName}'s investment readiness score has improved`,
      'new_financial_data': `${businessName} has added new financial data`,
      'business_verified': `${businessName} has been verified and is now investment-ready`,
      'seeking_amount_changed': `${businessName} has updated their investment requirements`
    };

    return this.createNotification({
      userId: investorId,
      type: 'business_updated',
      title: '🔄 Business Update',
      message: updateMessages[updateType] || `${businessName} has updated their profile`,
      data: {
        businessName,
        updateType,
        actionType: 'business_updated'
      },
      priority: 'low',
      category: 'updates'
    });
  }

  static async notifyMarketAlert(userId, alertType, message, data = {}) {
    const alertTitles = {
      'new_opportunities': '🚀 New Investment Opportunities',
      'market_trend': '📈 Market Trend Alert',
      'sector_performance': '🏭 Sector Performance Update',
      'regulatory_update': '📋 Regulatory Update',
      'economic_insight': '💡 Economic Insight'
    };

    return this.createNotification({
      userId,
      type: 'market_alert',
      title: alertTitles[alertType] || '📊 Market Alert',
      message,
      data: {
        alertType,
        ...data,
        actionType: 'market_alert'
      },
      priority: 'low',
      category: 'market'
    });
  }

  // Matching algorithm notifications
  static async processInvestmentMatching(investorId, investorProfile) {
    try {
      console.log('Processing investment matching for investor:', investorId);
      
      // This would be called periodically or triggered by new business listings
      const { InvestmentService } = await import('./InvestmentService');
      const matchedBusinesses = await InvestmentService.getMatchedBusinesses(investorId, investorProfile);
      
      // Notify about top matches (score > 80)
      const topMatches = matchedBusinesses.filter(business => business.matchScore > 80);
      
      for (const business of topMatches) {
        await this.notifyNewMatchingBusiness(
          investorId,
          business.businessName,
          business.readinessScore,
          business.matchScore
        );
        
        // Limit to top 3 matches per run to avoid spam
        if (topMatches.indexOf(business) >= 2) break;
      }
      
      console.log(`Sent ${Math.min(topMatches.length, 3)} matching notifications`);
    } catch (error) {
      console.error('Error processing investment matching:', error);
    }
  }

  // Real-time notification subscriptions
  static subscribeToUserNotifications(userId, callback) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() });
        });
        callback(notifications);
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  // Notification analytics
  static async getNotificationStats(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const stats = {
        total: 0,
        unread: 0,
        byType: {},
        byCategory: {},
        recentCount: 0
      };
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      querySnapshot.forEach((doc) => {
        const notification = doc.data();
        stats.total++;
        
        if (!notification.read) {
          stats.unread++;
        }
        
        // Count by type
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Count by category
        stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
        
        // Count recent notifications
        const createdAt = notification.createdAt?.toDate ? notification.createdAt.toDate() : new Date(notification.createdAt);
        if (createdAt >= weekAgo) {
          stats.recentCount++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Bulk notification operations
  static async sendBulkNotifications(notifications) {
    try {
      console.log(`Sending ${notifications.length} bulk notifications...`);
      
      const promises = notifications.map(notification => 
        this.createNotification(notification)
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Bulk notifications sent: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Market intelligence notifications
  static async sendMarketInsightNotifications() {
    try {
      // This would be called by a scheduled function
      const insights = [
        {
          type: 'sector_growth',
          message: 'African tech startups received 25% more funding this quarter',
          data: { sector: 'Technology', growth: 25 }
        },
        {
          type: 'new_market',
          message: 'Rwanda opens new SME investment incentives program',
          data: { country: 'Rwanda', program: 'SME Investment Incentives' }
        },
        {
          type: 'trend_alert',
          message: 'Agtech investments in Kenya showing strong ROI (18% average)',
          data: { sector: 'Agriculture', country: 'Kenya', roi: 18 }
        }
      ];

      // Get all investors interested in relevant sectors/countries
      const { InvestmentService } = await import('./InvestmentService');
      // This would query investor preferences and send targeted notifications
      
      console.log('Market insight notifications would be sent to relevant investors');
    } catch (error) {
      console.error('Error sending market insight notifications:', error);
    }
  }

  // Utility methods
  static getNotificationIcon(type) {
    const icons = {
      'investor_interest': '👥',
      'investment_pledge': '💰',
      'pledge_accepted': '✅',
      'pledge_rejected': '❌',
      'new_match': '🎯',
      'business_updated': '🔄',
      'market_alert': '📊',
      'system': '⚙️',
      'welcome': '👋'
    };
    
    return icons[type] || '📢';
  }

  static getPriorityColor(priority) {
    const colors = {
      'critical': '#dc3545',
      'high': '#fd7e14',
      'medium': '#ffc107',
      'low': '#28a745'
    };
    
    return colors[priority] || '#6c757d';
  }

  static formatNotificationMessage(notification) {
    return {
      ...notification,
      icon: this.getNotificationIcon(notification.type),
      priorityColor: this.getPriorityColor(notification.priority),
      timeAgo: this.getTimeAgo(notification.createdAt)
    };
  }

  static getTimeAgo(timestamp) {
    const now = new Date();
    const createdAt = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return createdAt.toLocaleDateString();
  }
}

export default NotificationService;