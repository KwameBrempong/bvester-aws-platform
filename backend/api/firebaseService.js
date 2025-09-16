/**
 * BVESTER PLATFORM - FIREBASE SERVICE
 * Core database operations for Firestore
 * Generated: January 28, 2025
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} = require('firebase/firestore');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class FirebaseService {
  
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================
  
  /**
   * Create a new user account
   */
  async createUser(userData) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        userId: user.uid,
        email: userData.email,
        userType: userData.userType,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: `${userData.firstName} ${userData.lastName}`,
          country: userData.country,
          city: userData.city,
          phoneNumber: userData.phoneNumber || '',
        },
        verification: {
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'pending'
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: serverTimestamp()
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
            marketing: false
          },
          currency: userData.currency || 'USD'
        },
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          referralCode: this.generateReferralCode()
        }
      };
      
      await addDoc(collection(db, 'users'), userProfile);
      
      return { success: true, user: userProfile };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, user: userDoc.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        'metadata.updatedAt': serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // BUSINESS MANAGEMENT
  // ============================================================================
  
  /**
   * Create business profile
   */
  async createBusinessProfile(businessData) {
    try {
      const business = {
        ...businessData,
        businessId: this.generateId(),
        scores: {
          investmentReadiness: 0,
          financialHealth: 0,
          esgScore: 0,
          riskLevel: 'medium',
          lastCalculated: serverTimestamp()
        },
        status: {
          isActive: true,
          isPublished: false,
          isVerified: false,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      };
      
      const docRef = await addDoc(collection(db, 'businesses'), business);
      return { success: true, businessId: docRef.id, business };
    } catch (error) {
      console.error('Error creating business profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get business profile
   */
  async getBusinessProfile(businessId) {
    try {
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (businessDoc.exists()) {
        return { success: true, business: businessDoc.data() };
      } else {
        return { success: false, error: 'Business not found' };
      }
    } catch (error) {
      console.error('Error getting business profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get published businesses (for investors)
   */
  async getPublishedBusinesses(filters = {}) {
    try {
      let businessQuery = collection(db, 'businesses');
      
      // Apply filters
      const constraints = [where('status.isPublished', '==', true)];
      
      if (filters.sector) {
        constraints.push(where('industry.primarySector', '==', filters.sector));
      }
      
      if (filters.country) {
        constraints.push(where('location.country', '==', filters.country));
      }
      
      if (filters.minRevenue) {
        constraints.push(where('financials.annualRevenue', '>=', filters.minRevenue));
      }
      
      // Add ordering and limit
      constraints.push(orderBy('status.lastUpdated', 'desc'));
      constraints.push(limit(filters.limit || 20));
      
      const q = query(businessQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const businesses = [];
      querySnapshot.forEach((doc) => {
        businesses.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, businesses };
    } catch (error) {
      console.error('Error getting published businesses:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // INVESTMENT OPPORTUNITIES
  // ============================================================================
  
  /**
   * Create investment opportunity
   */
  async createInvestmentOpportunity(opportunityData) {
    try {
      const opportunity = {
        ...opportunityData,
        opportunityId: this.generateId(),
        performance: {
          viewCount: 0,
          interestedInvestors: 0,
          committedInvestors: 0,
          averageInvestmentSize: 0,
          conversionRate: 0,
          socialShares: 0
        },
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      };
      
      const docRef = await addDoc(collection(db, 'opportunities'), opportunity);
      return { success: true, opportunityId: docRef.id, opportunity };
    } catch (error) {
      console.error('Error creating investment opportunity:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get active investment opportunities
   */
  async getActiveOpportunities(filters = {}) {
    try {
      let opportunityQuery = collection(db, 'opportunities');
      
      const constraints = [where('timeline.status', '==', 'active')];
      
      if (filters.businessId) {
        constraints.push(where('businessId', '==', filters.businessId));
      }
      
      if (filters.minAmount) {
        constraints.push(where('terms.minimumInvestment', '>=', filters.minAmount));
      }
      
      if (filters.maxAmount) {
        constraints.push(where('terms.maximumInvestment', '<=', filters.maxAmount));
      }
      
      constraints.push(orderBy('timeline.startDate', 'desc'));
      constraints.push(limit(filters.limit || 20));
      
      const q = query(opportunityQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const opportunities = [];
      querySnapshot.forEach((doc) => {
        opportunities.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, opportunities };
    } catch (error) {
      console.error('Error getting active opportunities:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // INVESTMENTS
  // ============================================================================
  
  /**
   * Create investment transaction
   */
  async createInvestment(investmentData) {
    try {
      const investment = {
        ...investmentData,
        investmentId: this.generateId(),
        returns: {
          expectedReturn: investmentData.expectedReturn || 0,
          actualReturn: 0,
          dividendsPaid: 0,
          currentValue: investmentData.transaction.amount,
          unrealizedGain: 0
        },
        metadata: {
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      };
      
      const docRef = await addDoc(collection(db, 'investments'), investment);
      
      // Update opportunity statistics
      await this.updateOpportunityStats(investmentData.opportunityId, {
        committedInvestors: increment(1),
        raisedAmount: increment(investmentData.transaction.amount)
      });
      
      return { success: true, investmentId: docRef.id, investment };
    } catch (error) {
      console.error('Error creating investment:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get investor's investments
   */
  async getInvestorInvestments(investorId) {
    try {
      const q = query(
        collection(db, 'investments'),
        where('investorId', '==', investorId),
        orderBy('metadata.createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const investments = [];
      querySnapshot.forEach((doc) => {
        investments.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, investments };
    } catch (error) {
      console.error('Error getting investor investments:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // FINANCIAL RECORDS
  // ============================================================================
  
  /**
   * Add financial record
   */
  async addFinancialRecord(recordData) {
    try {
      const record = {
        ...recordData,
        recordId: this.generateId(),
        verification: {
          isVerified: false,
          verifiedBy: null,
          verificationDate: null
        },
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'draft'
        }
      };
      
      const docRef = await addDoc(collection(db, 'financialRecords'), record);
      
      // Trigger financial health recalculation
      await this.triggerFinancialHealthCalculation(recordData.businessId);
      
      return { success: true, recordId: docRef.id, record };
    } catch (error) {
      console.error('Error adding financial record:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get business financial records
   */
  async getBusinessFinancials(businessId, period = 'all') {
    try {
      let q = query(
        collection(db, 'financialRecords'),
        where('businessId', '==', businessId),
        orderBy('period.startDate', 'desc')
      );
      
      if (period !== 'all') {
        q = query(q, where('period.type', '==', period));
      }
      
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, records };
    } catch (error) {
      console.error('Error getting business financials:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // MESSAGING
  // ============================================================================
  
  /**
   * Create message thread
   */
  async createMessageThread(threadData) {
    try {
      const thread = {
        ...threadData,
        threadId: this.generateId(),
        metadata: {
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          messageCount: 0
        }
      };
      
      const docRef = await addDoc(collection(db, 'messageThreads'), thread);
      return { success: true, threadId: docRef.id, thread };
    } catch (error) {
      console.error('Error creating message thread:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send message
   */
  async sendMessage(messageData) {
    try {
      const message = {
        ...messageData,
        messageId: this.generateId(),
        status: {
          sent: true,
          delivered: false,
          read: false
        },
        metadata: {
          sentAt: serverTimestamp(),
          isDeleted: false
        }
      };
      
      const docRef = await addDoc(collection(db, 'messages'), message);
      
      // Update thread metadata
      await updateDoc(doc(db, 'messageThreads', messageData.threadId), {
        'metadata.lastMessageAt': serverTimestamp(),
        'metadata.messageCount': increment(1)
      });
      
      return { success: true, messageId: docRef.id, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
  
  /**
   * Generate referral code
   */
  generateReferralCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  /**
   * Update opportunity statistics
   */
  async updateOpportunityStats(opportunityId, updates) {
    try {
      const opportunityRef = doc(db, 'opportunities', opportunityId);
      await updateDoc(opportunityRef, {
        'performance': updates,
        'metadata.updatedAt': serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating opportunity stats:', error);
    }
  }
  
  /**
   * Trigger financial health calculation
   */
  async triggerFinancialHealthCalculation(businessId) {
    try {
      // This would trigger a cloud function or background job
      // For now, we'll just log it
      console.log(`Financial health calculation triggered for business: ${businessId}`);
      
      // TODO: Implement actual calculation logic
      // This could be a Cloud Function or a scheduled job
    } catch (error) {
      console.error('Error triggering financial health calculation:', error);
    }
  }
  
  /**
   * Log user activity
   */
  async logActivity(userId, action, resourceType, resourceId, details = {}) {
    try {
      const activityLog = {
        logId: this.generateId(),
        userId,
        action,
        resource: {
          type: resourceType,
          id: resourceId
        },
        details,
        metadata: {
          timestamp: serverTimestamp(),
          ipAddress: details.ipAddress || 'unknown',
          userAgent: details.userAgent || 'unknown'
        }
      };
      
      await addDoc(collection(db, 'activityLogs'), activityLog);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
  
  /**
   * Create notification
   */
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        notificationId: this.generateId(),
        status: {
          sent: false,
          delivered: false,
          read: false
        },
        metadata: {
          createdAt: serverTimestamp()
        }
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FirebaseService();