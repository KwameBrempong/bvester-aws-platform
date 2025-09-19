/**
 * 🚀 BVESTER USER DATA SERVICE
 * Comprehensive service for managing real user data across all features
 * No more placeholders - everything is live and connected to user accounts
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { userService, transactionService, businessService } from './FirebaseService';

class UserDataService {
  constructor() {
    this.userProfileCollection = 'userProfiles';
    this.userPreferencesCollection = 'userPreferences';
    this.userActivityCollection = 'userActivity';
    this.userGoalsCollection = 'userGoals';
    this.userNotificationCollection = 'userNotifications';
    this.userDocumentsCollection = 'userDocuments';
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get comprehensive user profile with all related data
   */
  async getCompleteUserProfile(userId) {
    try {
      console.log('Loading complete user profile for:', userId);
      
      // Get all user-related data in parallel
      const [
        basicProfile,
        preferences,
        recentActivity,
        businessData,
        transactions,
        goals,
        notifications
      ] = await Promise.all([
        userService.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getUserActivity(userId, { limit: 10 }),
        businessService.getUserBusiness(userId),
        transactionService.getUserTransactions(userId, { limit: 20 }),
        this.getUserGoals(userId),
        this.getUserNotifications(userId, { unreadOnly: false, limit: 5 })
      ]);

      // Calculate user statistics
      const stats = await this.calculateUserStats(userId, transactions, businessData);

      const completeProfile = {
        ...basicProfile,
        preferences: preferences || this.getDefaultPreferences(),
        recentActivity: recentActivity || [],
        business: businessData,
        recentTransactions: transactions || [],
        goals: goals || [],
        notifications: notifications || [],
        stats,
        lastUpdated: new Date().toISOString(),
        dataCompleteness: this.calculateDataCompleteness(basicProfile, businessData, transactions)
      };

      console.log('Complete user profile loaded with data completeness:', completeProfile.dataCompleteness);
      return completeProfile;
    } catch (error) {
      console.error('Error loading complete user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile with automatic data validation
   */
  async updateUserProfile(userId, updates) {
    try {
      console.log('Updating user profile:', userId);
      
      // Validate required fields
      const validatedUpdates = this.validateProfileUpdates(updates);
      
      // Update profile
      await userService.updateUserProfile(userId, validatedUpdates);
      
      // Log activity
      await this.logUserActivity(userId, {
        action: 'profile_updated',
        details: Object.keys(validatedUpdates),
        timestamp: serverTimestamp()
      });

      console.log('User profile updated successfully');
      return validatedUpdates;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Calculate user statistics from real data
   */
  async calculateUserStats(userId, transactions = null, business = null) {
    try {
      // Get transactions if not provided
      if (!transactions) {
        transactions = await transactionService.getUserTransactions(userId);
      }

      // Get business data if not provided
      if (!business) {
        business = await businessService.getUserBusiness(userId);
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Filter transactions by time periods
      const recentTransactions = transactions.filter(t => {
        const transactionDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
        return transactionDate >= thirtyDaysAgo;
      });

      const quarterTransactions = transactions.filter(t => {
        const transactionDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
        return transactionDate >= ninetyDaysAgo;
      });

      // Calculate financial metrics
      const monthlyIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthlyExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const quarterlyIncome = quarterTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const quarterlyExpenses = quarterTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate activity metrics
      const transactionFrequency = transactions.length > 0 ? 
        transactions.length / Math.max(1, this.getDaysBetween(transactions[transactions.length - 1].date, now)) : 0;

      const stats = {
        // Financial Health
        monthlyNetIncome: monthlyIncome - monthlyExpenses,
        quarterlyNetIncome: quarterlyIncome - quarterlyExpenses,
        monthlyIncome,
        monthlyExpenses,
        quarterlyIncome,
        quarterlyExpenses,
        
        // Business Metrics
        totalTransactions: transactions.length,
        transactionFrequency,
        averageTransactionValue: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length : 0,
        
        // Business Health Score (0-100)
        businessHealthScore: this.calculateBusinessHealthScore({
          transactions,
          business,
          monthlyIncome,
          monthlyExpenses,
          transactionFrequency
        }),
        
        // Investment Readiness Score (0-100)
        investmentReadinessScore: this.calculateInvestmentReadiness({
          transactions,
          business,
          monthlyIncome,
          quarterlyIncome,
          transactionFrequency
        }),

        // Growth indicators
        incomeGrowth: this.calculateGrowthRate(monthlyIncome, quarterlyIncome / 3),
        expenseGrowth: this.calculateGrowthRate(monthlyExpenses, quarterlyExpenses / 3),
        
        // Activity indicators
        lastActivityDate: transactions.length > 0 ? transactions[0].date : null,
        activeStreak: this.calculateActiveStreak(transactions),
        
        // Data quality
        dataQualityScore: this.calculateDataQualityScore(transactions, business),
        
        // Timestamp
        calculatedAt: serverTimestamp()
      };

      console.log('User statistics calculated:', {
        businessHealthScore: stats.businessHealthScore,
        investmentReadinessScore: stats.investmentReadinessScore,
        monthlyNetIncome: stats.monthlyNetIncome
      });

      return stats;
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return this.getDefaultStats();
    }
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    try {
      const docRef = doc(db, this.userPreferencesCollection, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Create default preferences
        const defaultPrefs = this.getDefaultPreferences();
        await this.updateUserPreferences(userId, defaultPrefs);
        return defaultPrefs;
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const docRef = doc(db, this.userPreferencesCollection, userId);
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
      
      await this.logUserActivity(userId, {
        action: 'preferences_updated',
        timestamp: serverTimestamp()
      });
      
      return preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get default user preferences with comprehensive currency support
   */
  getDefaultPreferences() {
    return {
      currency: 'USD',
      businessCurrency: 'USD', // Default currency for business operations
      preferredViewCurrency: 'USD', // Currency for viewing dashboard and portfolio
      language: 'en',
      timezone: 'Africa/Lagos',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketingEmails: false,
        investmentUpdates: true,
        transactionAlerts: true,
        weeklyReports: true
      },
      privacy: {
        profileVisibility: 'public',
        showBusinessMetrics: false,
        allowInvestorContact: true,
        shareAnalytics: true
      },
      dashboard: {
        defaultView: 'overview',
        showTips: true,
        autoRefresh: true,
        chartType: 'line'
      },
      trading: {
        riskTolerance: 'moderate',
        investmentPreferences: ['technology', 'agriculture', 'retail'],
        maxInvestmentAmount: 10000,
        autoInvest: false
      },
      createdAt: serverTimestamp()
    };
  }

  // ============================================================================
  // USER ACTIVITY TRACKING
  // ============================================================================

  /**
   * Log user activity
   */
  async logUserActivity(userId, activityData) {
    try {
      await addDoc(collection(db, this.userActivityCollection), {
        userId,
        ...activityData,
        timestamp: activityData.timestamp || serverTimestamp(),
        sessionId: this.generateSessionId(),
        platform: 'mobile',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw error for activity logging failures
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId, options = {}) {
    try {
      const constraints = [
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      ];
      
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      if (options.action) {
        constraints.unshift(where('action', '==', options.action));
      }

      const q = query(collection(db, this.userActivityCollection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  // ============================================================================
  // USER GOALS & TARGETS
  // ============================================================================

  /**
   * Get user financial goals
   */
  async getUserGoals(userId) {
    try {
      const q = query(
        collection(db, this.userGoalsCollection),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'paused']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const goals = [];
      
      querySnapshot.forEach((doc) => {
        goals.push({ id: doc.id, ...doc.data() });
      });
      
      return goals;
    } catch (error) {
      console.error('Error getting user goals:', error);
      return [];
    }
  }

  /**
   * Create user goal
   */
  async createUserGoal(userId, goalData) {
    try {
      const goal = {
        userId,
        ...goalData,
        status: 'active',
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.userGoalsCollection), goal);
      
      await this.logUserActivity(userId, {
        action: 'goal_created',
        goalId: docRef.id,
        goalType: goalData.type
      });
      
      return { id: docRef.id, ...goal };
    } catch (error) {
      console.error('Error creating user goal:', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(userId, goalId, progress) {
    try {
      const docRef = doc(db, this.userGoalsCollection, goalId);
      await updateDoc(docRef, {
        progress,
        updatedAt: serverTimestamp(),
        ...(progress >= 100 && { status: 'completed', completedAt: serverTimestamp() })
      });
      
      await this.logUserActivity(userId, {
        action: 'goal_progress_updated',
        goalId,
        progress
      });
      
      return true;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER NOTIFICATIONS
  // ============================================================================

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const constraints = [where('userId', '==', userId)];
      
      if (options.unreadOnly) {
        constraints.push(where('read', '==', false));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(collection(db, this.userNotificationCollection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Create user notification
   */
  async createUserNotification(userId, notificationData) {
    try {
      const notification = {
        userId,
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.userNotificationCollection), notification);
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate data completeness percentage
   */
  calculateDataCompleteness(profile, business, transactions) {
    let score = 0;
    let maxScore = 100;
    
    // Profile completeness (40 points)
    if (profile?.firstName) score += 5;
    if (profile?.lastName) score += 5;
    if (profile?.email) score += 5;
    if (profile?.phone) score += 5;
    if (profile?.country) score += 5;
    if (profile?.city) score += 5;
    if (profile?.dateOfBirth) score += 5;
    if (profile?.profilePicture) score += 5;
    
    // Business completeness (35 points)
    if (business?.name) score += 5;
    if (business?.industry) score += 5;
    if (business?.description) score += 5;
    if (business?.location) score += 5;
    if (business?.establishedYear) score += 5;
    if (business?.employees && business.employees > 0) score += 5;
    if (business?.website) score += 5;
    
    // Transaction history (25 points)
    if (transactions && transactions.length > 0) score += 5;
    if (transactions && transactions.length >= 10) score += 5;
    if (transactions && transactions.length >= 25) score += 5;
    if (transactions && transactions.length >= 50) score += 5;
    if (this.hasRecentActivity(transactions, 30)) score += 5; // Active in last 30 days
    
    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  /**
   * Calculate business health score
   */
  calculateBusinessHealthScore({
    transactions,
    business,
    monthlyIncome,
    monthlyExpenses,
    transactionFrequency
  }) {
    let score = 0;
    
    // Financial stability (40 points)
    if (monthlyIncome > monthlyExpenses) score += 20;
    if (monthlyIncome > 0) score += 10;
    if (monthlyExpenses > 0) score += 10; // Shows business activity
    
    // Transaction consistency (30 points)
    if (transactionFrequency >= 1) score += 15; // At least 1 transaction per day on average
    if (transactions.length >= 20) score += 10;
    if (this.hasRecentActivity(transactions, 7)) score += 5; // Active in last week
    
    // Business data completeness (20 points)
    if (business?.name) score += 5;
    if (business?.industry) score += 5;
    if (business?.description) score += 5;
    if (business?.employees && business.employees > 0) score += 5;
    
    // Growth indicators (10 points)
    if (this.showsGrowthTrend(transactions)) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculate investment readiness score
   */
  calculateInvestmentReadiness({
    transactions,
    business,
    monthlyIncome,
    quarterlyIncome,
    transactionFrequency
  }) {
    let score = 0;
    
    // Financial track record (50 points)
    if (transactions.length >= 50) score += 15;
    if (this.hasConsistentRevenue(transactions)) score += 15;
    if (monthlyIncome >= 1000) score += 10; // Minimum viable income
    if (quarterlyIncome >= 5000) score += 10; // Quarterly consistency
    
    // Business maturity (30 points)
    if (business?.establishedYear && (new Date().getFullYear() - business.establishedYear) >= 1) score += 10;
    if (business?.employees && business.employees >= 2) score += 10;
    if (business?.website) score += 5;
    if (business?.verified) score += 5;
    
    // Documentation & compliance (20 points)
    if (business?.documents && business.documents.length > 0) score += 10;
    if (this.hasProperFinancialRecords(transactions)) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculate growth rate between two periods
   */
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate active streak in days
   */
  calculateActiveStreak(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    
    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const transaction of sortedTransactions) {
      const transactionDate = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate - transactionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 1) {
        if (daysDiff === streak) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate data quality score
   */
  calculateDataQualityScore(transactions, business) {
    let score = 0;
    
    if (transactions && transactions.length > 0) {
      // Check for complete transaction data
      const completeTransactions = transactions.filter(t => 
        t.amount && t.description && t.category && t.date
      ).length;
      
      score += (completeTransactions / transactions.length) * 50;
      
      // Check for categorization
      const categorizedTransactions = transactions.filter(t => 
        t.category && t.category !== 'other'
      ).length;
      
      score += (categorizedTransactions / transactions.length) * 25;
    }
    
    // Business data quality
    if (business) {
      let businessScore = 0;
      const fields = ['name', 'industry', 'description', 'location'];
      fields.forEach(field => {
        if (business[field]) businessScore += 25 / fields.length;
      });
      score += businessScore;
    }
    
    return Math.min(100, score);
  }

  /**
   * Check if user has recent activity
   */
  hasRecentActivity(transactions, days) {
    if (!transactions || transactions.length === 0) return false;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return transactions.some(t => {
      const transactionDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
      return transactionDate >= cutoffDate;
    });
  }

  /**
   * Check if business shows growth trend
   */
  showsGrowthTrend(transactions) {
    if (!transactions || transactions.length < 6) return false;
    
    // Simple growth check: compare first half vs second half of recent transactions
    const sortedTransactions = transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });
    
    if (sortedTransactions.length < 6) return false;
    
    const midpoint = Math.floor(sortedTransactions.length / 2);
    const firstHalfIncome = sortedTransactions.slice(0, midpoint).reduce((sum, t) => sum + (t.amount || 0), 0);
    const secondHalfIncome = sortedTransactions.slice(midpoint).reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return secondHalfIncome > firstHalfIncome;
  }

  /**
   * Check for consistent revenue
   */
  hasConsistentRevenue(transactions) {
    if (!transactions || transactions.length < 12) return false;
    
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    if (incomeTransactions.length < 6) return false;
    
    // Group by month and check consistency
    const monthlyIncome = {};
    incomeTransactions.forEach(t => {
      const date = t.date.toDate ? t.date.toDate() : new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + (t.amount || 0);
    });
    
    const monthlyValues = Object.values(monthlyIncome);
    const nonZeroMonths = monthlyValues.filter(v => v > 0).length;
    
    return nonZeroMonths >= Math.min(3, monthlyValues.length * 0.7);
  }

  /**
   * Check for proper financial records
   */
  hasProperFinancialRecords(transactions) {
    if (!transactions || transactions.length < 20) return false;
    
    const categorizedCount = transactions.filter(t => t.category && t.category !== 'other').length;
    const withDescriptionCount = transactions.filter(t => t.description && t.description.trim().length > 3).length;
    
    return (categorizedCount / transactions.length) >= 0.8 && (withDescriptionCount / transactions.length) >= 0.9;
  }

  /**
   * Get days between two dates
   */
  getDaysBetween(startDate, endDate) {
    const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate profile updates
   */
  validateProfileUpdates(updates) {
    const validated = { ...updates };
    
    // Validate email format
    if (validated.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validated.email)) {
      delete validated.email;
    }
    
    // Validate phone format
    if (validated.phone && !/^\+?[\d\s-()]+$/.test(validated.phone)) {
      delete validated.phone;
    }
    
    // Validate date of birth
    if (validated.dateOfBirth) {
      const dob = new Date(validated.dateOfBirth);
      const today = new Date();
      if (dob > today || dob < new Date('1900-01-01')) {
        delete validated.dateOfBirth;
      }
    }
    
    return validated;
  }

  // ============================================================================
  // CURRENCY MANAGEMENT
  // ============================================================================

  /**
   * Update user currency settings
   */
  async updateUserCurrency(userId, currencyData) {
    try {
      const { businessCurrency, preferredViewCurrency } = currencyData;
      
      // Validate currency codes
      if (businessCurrency && !this.isValidCurrencyCode(businessCurrency)) {
        throw new Error(`Invalid business currency code: ${businessCurrency}`);
      }
      
      if (preferredViewCurrency && !this.isValidCurrencyCode(preferredViewCurrency)) {
        throw new Error(`Invalid view currency code: ${preferredViewCurrency}`);
      }

      // Update user preferences
      const preferences = await this.getUserPreferences(userId);
      const updatedPreferences = {
        ...preferences,
        ...(businessCurrency && { businessCurrency, currency: businessCurrency }),
        ...(preferredViewCurrency && { preferredViewCurrency })
      };

      await this.updateUserPreferences(userId, updatedPreferences);

      // Update user profile
      const profileUpdates = {};
      if (businessCurrency) profileUpdates.businessCurrency = businessCurrency;
      if (preferredViewCurrency) profileUpdates.preferredViewCurrency = preferredViewCurrency;
      
      if (Object.keys(profileUpdates).length > 0) {
        await userService.updateUserProfile(userId, profileUpdates);
      }

      // Log currency change activity
      await this.logUserActivity(userId, {
        action: 'currency_updated',
        details: { businessCurrency, preferredViewCurrency },
        timestamp: serverTimestamp()
      });

      console.log('User currency settings updated:', { userId, businessCurrency, preferredViewCurrency });
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating user currency:', error);
      throw error;
    }
  }

  /**
   * Get user currency settings
   */
  async getUserCurrency(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const profile = await userService.getUserProfile(userId);

      return {
        businessCurrency: preferences.businessCurrency || profile?.businessCurrency || 'USD',
        preferredViewCurrency: preferences.preferredViewCurrency || profile?.preferredViewCurrency || 'USD',
        currency: preferences.currency || 'USD' // Legacy field
      };
    } catch (error) {
      console.error('Error getting user currency:', error);
      return {
        businessCurrency: 'USD',
        preferredViewCurrency: 'USD',
        currency: 'USD'
      };
    }
  }

  /**
   * Validate currency code
   */
  isValidCurrencyCode(currencyCode) {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD',
      'TND', 'DZD', 'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK',
      'BWP', 'SZL', 'LSL', 'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
    ];
    return validCurrencies.includes(currencyCode?.toUpperCase());
  }

  /**
   * Get supported currencies for user's country
   */
  getSupportedCurrencies(country = 'US') {
    const currencyMap = {
      'NG': ['NGN', 'USD'],
      'GH': ['GHS', 'USD'],
      'KE': ['KES', 'USD'],
      'ZA': ['ZAR', 'USD'],
      'EG': ['EGP', 'USD'],
      'MA': ['MAD', 'USD'],
      'TN': ['TND', 'USD'],
      'DZ': ['DZD', 'USD'],
      'UG': ['UGX', 'USD'],
      'TZ': ['TZS', 'USD'],
      'RW': ['RWF', 'USD'],
      'ZM': ['ZMW', 'USD'],
      'MW': ['MWK', 'USD'],
      'BW': ['BWP', 'USD'],
      'SZ': ['SZL', 'USD'],
      'LS': ['LSL', 'USD'],
      'NA': ['NAD', 'USD'],
      'US': ['USD'],
      'GB': ['GBP', 'USD', 'EUR'],
      'AU': ['AUD', 'USD'],
      'CA': ['CAD', 'USD'],
      'default': ['USD', 'EUR', 'GBP']
    };

    return currencyMap[country] || currencyMap['default'];
  }

  /**
   * Get default user statistics - PRODUCTION READY with zero values
   */
  getDefaultStats() {
    return {
      // Financial Health - All start at zero for production
      monthlyNetIncome: 0,
      quarterlyNetIncome: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      quarterlyIncome: 0,
      quarterlyExpenses: 0,
      
      // Investment Portfolio (for investors) - All start at zero
      totalInvestments: 0,
      totalInvested: 0,
      totalReturns: 0,
      portfolioValue: 0,
      portfolioGrowth: 0,
      activeInvestments: 0,
      
      // Business Metrics - All start at zero
      totalTransactions: 0,
      transactionFrequency: 0,
      averageTransactionValue: 0,
      
      // Health Scores - Start at zero, improve with activity
      businessHealthScore: 0,
      investmentReadinessScore: 0,
      dataQualityScore: 0,
      
      // Growth indicators - Start at zero
      incomeGrowth: 0,
      expenseGrowth: 0,
      
      // Activity indicators - Start at zero
      lastActivityDate: null,
      activeStreak: 0,
      
      // Production metadata
      isProductionAccount: true,
      dataResetAt: serverTimestamp(),
      calculatedAt: serverTimestamp()
    };
  }

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(userId, callback) {
    try {
      const docRef = doc(db, this.userProfileCollection, userId);
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up user profile listener:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(userId, callback) {
    try {
      const q = query(
        collection(db, this.userNotificationCollection),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() });
        });
        callback(notifications);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      throw error;
    }
  }
}

// Export service instance
export const userDataService = new UserDataService();
export default UserDataService;