/**
 * 🗄️ AWS DYNAMODB SERVICE
 * Database operations using AWS DynamoDB
 * Replaces all Firebase Firestore functionality
 */

import { BackendAPIService } from '../BackendAPIService';
import { API_ENDPOINTS } from '../../config/api';

class DynamoDBService {
  constructor() {
    this.api = new BackendAPIService();

    // Table names for different data types
    this.tables = {
      users: 'bvester-users',
      businesses: 'bvester-businesses',
      transactions: 'bvester-transactions',
      assessments: 'bvester-business-health-assessments',
      chatMessages: 'bvester-chat-messages',
      investments: 'bvester-investments',
      notifications: 'bvester-notifications'
    };
  }

  /**
   * Generic create operation
   */
  async create(tableName, data) {
    try {
      const response = await this.api.makeRequest(API_ENDPOINTS.DYNAMODB.CREATE(tableName), {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          data: {
            ...data,
            id: data.id || this.generateId(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic read operation
   */
  async get(tableName, id) {
    try {
      const response = await this.api.makeRequest(API_ENDPOINTS.DYNAMODB.GET(tableName, id), {
        method: 'GET'
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Error getting record from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic query operation
   */
  async query(tableName, conditions = {}) {
    try {
      const queryParams = new URLSearchParams(conditions).toString();
      const endpoint = queryParams ?
        `${API_ENDPOINTS.DYNAMODB.QUERY(tableName)}?${queryParams}` :
        API_ENDPOINTS.DYNAMODB.QUERY(tableName);

      const response = await this.api.makeRequest(endpoint, {
        method: 'GET'
      });

      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Error querying ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic update operation
   */
  async update(tableName, id, updates) {
    try {
      const response = await this.api.makeRequest(API_ENDPOINTS.DYNAMODB.UPDATE(tableName, id), {
        method: 'PUT',
        body: JSON.stringify({
          action: 'update',
          data: {
            ...updates,
            updatedAt: new Date().toISOString()
          }
        })
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic delete operation
   */
  async delete(tableName, id) {
    try {
      const response = await this.api.makeRequest(`/api/dynamodb/${tableName}/${id}`, {
        method: 'DELETE'
      });

      return response.success;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Transaction-specific operations
   */
  async createTransaction(userId, transactionData) {
    return this.create(this.tables.transactions, {
      ...transactionData,
      userId
    });
  }

  async getUserTransactions(userId, options = {}) {
    const conditions = {
      userId,
      limit: options.limit || 50,
      ...options
    };

    return this.query(this.tables.transactions, conditions);
  }

  /**
   * Chat message operations
   */
  async saveChatMessage(messageData) {
    return this.create(this.tables.chatMessages, messageData);
  }

  async getChatHistory(userId, limit = 50) {
    return this.query(this.tables.chatMessages, {
      userId,
      limit,
      sortBy: 'createdAt',
      order: 'asc'
    });
  }

  /**
   * Business health assessment operations
   */
  async saveAssessment(userId, assessmentData) {
    return this.create(this.tables.assessments, {
      ...assessmentData,
      userId
    });
  }

  async getLatestAssessment(userId) {
    const assessments = await this.query(this.tables.assessments, {
      userId,
      limit: 1,
      sortBy: 'completedAt',
      order: 'desc'
    });

    return assessments.length > 0 ? assessments[0] : null;
  }

  /**
   * User profile operations
   */
  async getUserProfile(userId) {
    return this.get(this.tables.users, userId);
  }

  async updateUserProfile(userId, profileData) {
    return this.update(this.tables.users, userId, profileData);
  }

  async createUserProfile(userId, profileData) {
    return this.create(this.tables.users, {
      id: userId,
      ...profileData
    });
  }

  /**
   * Business operations
   */
  async getUserBusiness(userId) {
    const businesses = await this.query(this.tables.businesses, {
      ownerId: userId,
      limit: 1
    });

    return businesses.length > 0 ? businesses[0] : null;
  }

  async createBusiness(businessData) {
    return this.create(this.tables.businesses, businessData);
  }

  async updateBusiness(businessId, updates) {
    return this.update(this.tables.businesses, businessId, updates);
  }

  /**
   * Notification operations
   */
  async getUserNotifications(userId, options = {}) {
    const conditions = {
      userId,
      limit: options.limit || 20,
      ...options
    };

    if (options.unreadOnly) {
      conditions.read = false;
    }

    return this.query(this.tables.notifications, conditions);
  }

  async markNotificationRead(notificationId) {
    return this.update(this.tables.notifications, notificationId, {
      read: true,
      readAt: new Date().toISOString()
    });
  }

  /**
   * Query by user ID (common pattern)
   */
  async queryByUserId(tableName, userId, options = {}) {
    try {
      const conditions = {
        userId,
        ...options
      };

      return await this.query(tableName, conditions);
    } catch (error) {
      console.error(`Error querying ${tableName} by userId:`, error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Batch operations for efficiency
   */
  async batchWrite(operations) {
    try {
      const response = await this.api.makeRequest('/api/dynamodb/batch', {
        method: 'POST',
        body: JSON.stringify({
          operations
        })
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error in batch write operation:', error);
      throw error;
    }
  }

  /**
   * Real-time subscriptions (using WebSocket or polling)
   */
  subscribeToUserTransactions(userId, callback) {
    // For MVP, implement polling. In production, use WebSocket
    const pollInterval = setInterval(async () => {
      try {
        const transactions = await this.getUserTransactions(userId, { limit: 10 });
        callback(transactions);
      } catch (error) {
        console.error('Error polling transactions:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(pollInterval);
  }

  subscribeToUserNotifications(userId, callback) {
    // Similar polling implementation for notifications
    const pollInterval = setInterval(async () => {
      try {
        const notifications = await this.getUserNotifications(userId, {
          unreadOnly: true,
          limit: 5
        });
        callback(notifications);
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 60000); // Poll every minute

    return () => clearInterval(pollInterval);
  }

  /**
   * Analytics and aggregation operations
   */
  async getUserStats(userId) {
    try {
      const response = await this.api.makeRequest(API_ENDPOINTS.DYNAMODB.ANALYTICS(userId), {
        method: 'GET'
      });

      return response.success ? response.data : {
        totalTransactions: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNetIncome: 0,
        investmentReadinessScore: 0,
        businessHealthScore: 0,
        activeStreak: 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalTransactions: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNetIncome: 0,
        investmentReadinessScore: 0,
        businessHealthScore: 0,
        activeStreak: 0
      };
    }
  }

  /**
   * Search operations
   */
  async searchBusinesses(query, filters = {}) {
    try {
      const response = await this.api.makeRequest(API_ENDPOINTS.DYNAMODB.SEARCH('bvester-businesses'), {
        method: 'POST',
        body: JSON.stringify({
          query,
          filters
        })
      });

      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error searching businesses:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dynamoDBService = new DynamoDBService();

export { dynamoDBService, DynamoDBService };