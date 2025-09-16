/**
 * 🧹 BVESTER PRODUCTION CLEANUP UTILITY
 * Resets all existing user data to zero values for production launch
 * 
 * CRITICAL: This script will permanently delete/reset ALL user data
 * Only run this when transitioning from development to production
 */

const admin = require('firebase-admin');

class ProductionCleanup {
  constructor() {
    this.db = admin.firestore();
    this.batch = this.db.batch();
    this.collections = {
      // Core user data
      users: 'users',
      userProfiles: 'userProfiles', 
      userPreferences: 'userPreferences',
      
      // Business data
      businesses: 'businesses',
      businessRecords: 'business_records',
      
      // Financial data
      transactions: 'transactions',
      investments: 'investments',
      investmentPledges: 'investment_pledges',
      investmentOpportunities: 'investment_opportunities',
      investmentAnalytics: 'investment_analytics',
      investmentPerformance: 'investment_performance',
      
      // User activity
      userActivity: 'userActivity',
      userGoals: 'userGoals',
      userNotifications: 'userNotifications',
      userDocuments: 'userDocuments',
      userSessions: 'user_sessions',
      
      // Communication
      messageThreads: 'message_threads',
      
      // System data
      securityLogs: 'security_logs',
      auditTrails: 'audit_trails',
      
      // CMS and content (keep published content)
      cmsContent: 'cms_content',
      contentInteractions: 'content_interactions'
    };
  }

  /**
   * MAIN CLEANUP FUNCTION - Executes all cleanup operations
   */
  async executeProductionCleanup() {
    console.log('🚨 STARTING PRODUCTION CLEANUP - THIS WILL RESET ALL USER DATA');
    
    try {
      // Step 1: Reset all user financial data
      await this.resetUserFinancialData();
      
      // Step 2: Reset business data
      await this.resetBusinessData();
      
      // Step 3: Clean user activity and notifications
      await this.cleanUserActivityData();
      
      // Step 4: Reset investment data
      await this.resetInvestmentData();
      
      // Step 5: Update user profiles with zero defaults
      await this.updateUserProfilesToZeroDefaults();
      
      // Step 6: Clean system logs (keep structure, remove sensitive data)
      await this.cleanSystemLogs();
      
      // Step 7: Reset CMS interactions but keep published content
      await this.resetCMSInteractions();
      
      console.log('✅ PRODUCTION CLEANUP COMPLETED SUCCESSFULLY');
      return { success: true, message: 'All user data reset to production defaults' };
      
    } catch (error) {
      console.error('❌ PRODUCTION CLEANUP FAILED:', error);
      throw error;
    }
  }

  /**
   * Reset all user financial data to zero values
   */
  async resetUserFinancialData() {
    console.log('🔄 Resetting user financial data...');
    
    // Delete all transactions
    await this.deleteCollectionDocuments(this.collections.transactions);
    
    // Delete all investment pledges
    await this.deleteCollectionDocuments(this.collections.investmentPledges);
    
    // Delete all investment analytics
    await this.deleteCollectionDocuments(this.collections.investmentAnalytics);
    
    // Delete all investment performance data
    await this.deleteCollectionDocuments(this.collections.investmentPerformance);
    
    // Reset user financial stats
    const users = await this.getAllDocuments(this.collections.users);
    
    for (const user of users) {
      const zeroStats = this.getZeroUserStats();
      await this.db.collection(this.collections.users).doc(user.id).update({
        ...zeroStats,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('✅ User financial data reset complete');
  }

  /**
   * Reset all business data
   */
  async resetBusinessData() {
    console.log('🔄 Resetting business data...');
    
    // Get all businesses
    const businesses = await this.getAllDocuments(this.collections.businesses);
    
    for (const business of businesses) {
      const zeroBusinessData = this.getZeroBusinessDefaults();
      await this.db.collection(this.collections.businesses).doc(business.id).update({
        ...zeroBusinessData,
        // Keep essential business info
        name: business.name || 'Business Name',
        ownerId: business.ownerId,
        industry: business.industry || 'general',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Delete all business records
    await this.deleteCollectionDocuments(this.collections.businessRecords);
    
    console.log('✅ Business data reset complete');
  }

  /**
   * Clean user activity and notification data
   */
  async cleanUserActivityData() {
    console.log('🔄 Cleaning user activity data...');
    
    // Delete all user activity logs
    await this.deleteCollectionDocuments(this.collections.userActivity);
    
    // Delete all user notifications
    await this.deleteCollectionDocuments(this.collections.userNotifications);
    
    // Delete all user goals
    await this.deleteCollectionDocuments(this.collections.userGoals);
    
    // Delete all user documents
    await this.deleteCollectionDocuments(this.collections.userDocuments);
    
    // Delete all user sessions
    await this.deleteCollectionDocuments(this.collections.userSessions);
    
    console.log('✅ User activity data cleaned');
  }

  /**
   * Reset all investment data
   */
  async resetInvestmentData() {
    console.log('🔄 Resetting investment data...');
    
    // Delete all actual investments
    await this.deleteCollectionDocuments(this.collections.investments);
    
    // Reset investment opportunities to zero funding
    const opportunities = await this.getAllDocuments(this.collections.investmentOpportunities);
    
    for (const opportunity of opportunities) {
      await this.db.collection(this.collections.investmentOpportunities).doc(opportunity.id).update({
        currentAmount: 0,
        investorCount: 0,
        percentageFunded: 0,
        status: 'published',
        lastInvestmentDate: null,
        investments: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Delete all message threads
    await this.deleteCollectionDocuments(this.collections.messageThreads);
    
    console.log('✅ Investment data reset complete');
  }

  /**
   * Update user profiles with zero defaults
   */
  async updateUserProfilesToZeroDefaults() {
    console.log('🔄 Updating user profiles to zero defaults...');
    
    const users = await this.getAllDocuments(this.collections.users);
    
    for (const user of users) {
      const zeroProfile = {
        // Keep essential user info
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country || 'Nigeria',
        currency: user.currency || 'NGN',
        businessName: user.businessName,
        
        // Reset all metrics to zero
        totalInvestments: 0,
        totalInvested: 0,
        totalReturns: 0,
        portfolioValue: 0,
        portfolioGrowth: 0,
        activeInvestments: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNetIncome: 0,
        quarterlyIncome: 0,
        quarterlyExpenses: 0,
        quarterlyNetIncome: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        transactionFrequency: 0,
        businessHealthScore: 0,
        investmentReadinessScore: 0,
        dataQualityScore: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        activeStreak: 0,
        lastActivityDate: null,
        
        // Reset account status
        isVerified: false,
        kycStatus: 'not_started',
        accountStatus: 'active',
        onboardingCompleted: true,
        
        // Reset preferences to defaults
        preferences: this.getDefaultUserPreferences(),
        
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await this.db.collection(this.collections.users).doc(user.id).update(zeroProfile);
    }
    
    console.log('✅ User profiles updated to zero defaults');
  }

  /**
   * Clean system logs while preserving structure
   */
  async cleanSystemLogs() {
    console.log('🔄 Cleaning system logs...');
    
    // Delete old security logs
    await this.deleteCollectionDocuments(this.collections.securityLogs);
    
    // Delete old audit trails
    await this.deleteCollectionDocuments(this.collections.auditTrails);
    
    console.log('✅ System logs cleaned');
  }

  /**
   * Reset CMS interactions but keep published content
   */
  async resetCMSInteractions() {
    console.log('🔄 Resetting CMS interactions...');
    
    // Delete all content interactions (likes, downloads, views)
    await this.deleteCollectionDocuments(this.collections.contentInteractions);
    
    // Reset view counts on CMS content but keep published content
    const cmsContent = await this.getAllDocuments(this.collections.cmsContent);
    
    for (const content of cmsContent) {
      if (content.status === 'published') {
        await this.db.collection(this.collections.cmsContent).doc(content.id).update({
          views: 0,
          likes: 0,
          downloads: 0,
          shares: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    console.log('✅ CMS interactions reset complete');
  }

  /**
   * Get zero user statistics defaults
   */
  getZeroUserStats() {
    return {
      // Financial metrics
      monthlyNetIncome: 0,
      quarterlyNetIncome: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      quarterlyIncome: 0,
      quarterlyExpenses: 0,
      
      // Portfolio metrics (for investors)
      totalInvestments: 0,
      totalInvested: 0,
      totalReturns: 0,
      portfolioValue: 0,
      portfolioGrowth: 0,
      activeInvestments: 0,
      
      // Transaction metrics
      totalTransactions: 0,
      transactionFrequency: 0,
      averageTransactionValue: 0,
      
      // Health scores
      businessHealthScore: 0,
      investmentReadinessScore: 0,
      dataQualityScore: 0,
      
      // Growth indicators
      incomeGrowth: 0,
      expenseGrowth: 0,
      
      // Activity indicators
      lastActivityDate: null,
      activeStreak: 0,
      
      // Timestamp
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
  }

  /**
   * Get zero business defaults
   */
  getZeroBusinessDefaults() {
    return {
      // Financial metrics
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      monthlyProfit: 0,
      quarterlyRevenue: 0,
      quarterlyExpenses: 0,
      quarterlyProfit: 0,
      totalRevenue: 0,
      
      // Funding metrics
      fundingReceived: 0,
      investorsCount: 0,
      currentValuation: 0,
      
      // Operational metrics
      employees: 0,
      customersCount: 0,
      productsSold: 0,
      
      // Health indicators
      healthScore: 0,
      growthRate: 0,
      profitMargin: 0,
      
      // Status
      status: 'active',
      isVerified: false,
      fundingStatus: 'not_seeking',
      
      // Documents and verification
      documentsUploaded: 0,
      verificationLevel: 'none'
    };
  }

  /**
   * Get default user preferences
   */
  getDefaultUserPreferences() {
    return {
      currency: 'NGN',
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
        shareAnalytics: false
      },
      dashboard: {
        defaultView: 'overview',
        showTips: true,
        autoRefresh: true,
        chartType: 'line'
      },
      trading: {
        riskTolerance: 'moderate',
        investmentPreferences: [],
        maxInvestmentAmount: 0,
        autoInvest: false
      }
    };
  }

  /**
   * Delete all documents in a collection
   */
  async deleteCollectionDocuments(collectionName) {
    console.log(`🗑️ Deleting all documents from ${collectionName}...`);
    
    const collectionRef = this.db.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    const batches = [];
    let batch = this.db.batch();
    let batchCount = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount === 500) {
        batches.push(batch);
        batch = this.db.batch();
        batchCount = 0;
      }
    });
    
    // Add the last batch if it has operations
    if (batchCount > 0) {
      batches.push(batch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
  }

  /**
   * Get all documents from a collection
   */
  async getAllDocuments(collectionName) {
    const snapshot = await this.db.collection(collectionName).get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  }

  /**
   * Create production-ready demo account for testing
   */
  async createProductionDemoAccount() {
    console.log('👤 Creating production demo account...');
    
    const demoAccountData = {
      email: 'demo@bvester.com',
      name: 'Demo User',
      role: 'SME_OWNER',
      businessName: 'Demo Business',
      country: 'Nigeria',
      currency: 'NGN',
      isDemo: true,
      
      // Zero stats
      ...this.getZeroUserStats(),
      
      // Default preferences
      preferences: this.getDefaultUserPreferences(),
      
      // Account setup
      onboardingCompleted: true,
      isVerified: false,
      accountStatus: 'active',
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await this.db.collection(this.collections.users).doc('demo-user-id').set(demoAccountData);
    
    console.log('✅ Production demo account created');
  }
}

module.exports = ProductionCleanup;