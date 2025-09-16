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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Generic CRUD operations for Firestore
class FirebaseService {
  // Create a new document
  async create(collectionName, data) {
    try {
      console.log(`Creating document in ${collectionName}:`, data);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Document created with ID: ${docRef.id}`);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Get a document by ID
  async getById(collectionName, docId) {
    try {
      console.log(`Fetching document ${docId} from ${collectionName}`);
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log(`Document ${docId} not found in ${collectionName}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching document ${docId}:`, error);
      throw error;
    }
  }

  // Get all documents from a collection
  async getAll(collectionName, constraints = []) {
    try {
      console.log(`Fetching all documents from ${collectionName}`);
      let q = collection(db, collectionName);
      
      // Apply query constraints if provided
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Found ${documents.length} documents in ${collectionName}`);
      return documents;
    } catch (error) {
      console.error(`Error fetching documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  async update(collectionName, docId, data) {
    try {
      console.log(`Updating document ${docId} in ${collectionName}:`, data);
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log(`Document ${docId} updated successfully`);
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Error updating document ${docId}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(collectionName, docId) {
    try {
      console.log(`Deleting document ${docId} from ${collectionName}`);
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      console.log(`Document ${docId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error);
      throw error;
    }
  }

  // Get documents with real-time updates
  subscribeToCollection(collectionName, callback, constraints = []) {
    try {
      console.log(`Setting up real-time listener for ${collectionName}`);
      let q = collection(db, collectionName);
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Real-time update: ${documents.length} documents in ${collectionName}`);
        callback(documents);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener for ${collectionName}:`, error);
      throw error;
    }
  }

  // Get user-specific documents
  async getUserDocuments(collectionName, userId, constraints = []) {
    try {
      console.log(`Fetching documents for user ${userId} from ${collectionName}`);
      const userConstraints = [where('userId', '==', userId), ...constraints];
      return await this.getAll(collectionName, userConstraints);
    } catch (error) {
      console.error(`Error fetching user documents:`, error);
      throw error;
    }
  }

  // Query helper methods
  createWhereConstraint(field, operator, value) {
    return where(field, operator, value);
  }

  createOrderByConstraint(field, direction = 'asc') {
    return orderBy(field, direction);
  }

  createLimitConstraint(limitCount) {
    return limit(limitCount);
  }
}

// Specific service classes for different data types

// User profile service
export class UserService extends FirebaseService {
  constructor() {
    super();
    this.collection = 'users';
  }

  async createUserProfile(userId, userData) {
    try {
      const userProfile = {
        ...userData,
        userId,
        role: userData.role || 'SME_OWNER',
        country: userData.country || 'Nigeria',
        currency: userData.currency || 'USD',
        businessCurrency: userData.businessCurrency || userData.currency || 'USD',
        preferredViewCurrency: userData.preferredViewCurrency || userData.currency || 'USD',
        onboardingCompleted: false
      };
      
      // Use the userId as document ID for easy lookup
      const docRef = doc(db, this.collection, userId);
      await updateDoc(docRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('User profile created:', userId);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    return await this.getById(this.collection, userId);
  }

  async updateUserProfile(userId, updates) {
    return await this.update(this.collection, userId, updates);
  }
}

// Financial transactions service
export class TransactionService extends FirebaseService {
  constructor() {
    super();
    this.collection = 'transactions';
  }

  async addTransaction(userId, transactionData) {
    const transaction = {
      ...transactionData,
      userId,
      type: transactionData.type || 'income', // income, expense, transfer
      category: transactionData.category || 'general',
      currency: transactionData.currency || 'USD',
      // Add currency conversion fields for multi-currency support
      usdEquivalent: transactionData.usdEquivalent || transactionData.amount,
      exchangeRate: transactionData.exchangeRate || 1.0,
      originalCurrency: transactionData.currency || 'USD'
    };
    
    return await this.create(this.collection, transaction);
  }

  async getUserTransactions(userId, filters = {}) {
    const constraints = [where('userId', '==', userId)];
    
    // Add date range filter
    if (filters.startDate && filters.endDate) {
      constraints.push(where('date', '>=', filters.startDate));
      constraints.push(where('date', '<=', filters.endDate));
    }
    
    // Add type filter
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    // Order by date (newest first)
    constraints.push(orderBy('date', 'desc'));
    
    return await this.getAll(this.collection, constraints);
  }

  subscribeToUserTransactions(userId, callback) {
    const constraints = [
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(50) // Limit to recent 50 transactions
    ];
    
    return this.subscribeToCollection(this.collection, callback, constraints);
  }
}

// Business service for SME data
export class BusinessService extends FirebaseService {
  constructor() {
    super();
    this.collection = 'businesses';
  }

  async createBusiness(userId, businessData) {
    const business = {
      ...businessData,
      ownerId: userId,
      status: 'active',
      readinessScore: 0,
      verified: false,
      listedForInvestment: false,
      // Add currency information for business
      currency: businessData.currency || 'USD',
      operatingCurrency: businessData.operatingCurrency || businessData.currency || 'USD',
      acceptedCurrencies: businessData.acceptedCurrencies || ['USD']
    };
    
    return await this.create(this.collection, business);
  }

  async getUserBusiness(userId) {
    const businesses = await this.getUserDocuments(this.collection, userId);
    return businesses.length > 0 ? businesses[0] : null;
  }

  async updateBusinessScore(businessId, score, metrics) {
    return await this.update(this.collection, businessId, {
      readinessScore: score,
      metrics,
      lastAnalysis: serverTimestamp()
    });
  }

  async getInvestmentOpportunities(filters = {}) {
    const constraints = [
      where('listedForInvestment', '==', true),
      where('status', '==', 'active')
    ];
    
    // Add filters
    if (filters.minScore) {
      constraints.push(where('readinessScore', '>=', filters.minScore));
    }
    
    if (filters.location) {
      constraints.push(where('location', '==', filters.location));
    }
    
    if (filters.industry) {
      constraints.push(where('industry', '==', filters.industry));
    }
    
    // Order by readiness score (highest first)
    constraints.push(orderBy('readinessScore', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    return await this.getAll(this.collection, constraints);
  }
}

// Investment service
export class InvestmentService extends FirebaseService {
  constructor() {
    super();
    this.collection = 'investments';
  }

  async createInvestment(investorId, businessId, investmentData) {
    const investment = {
      ...investmentData,
      investorId,
      businessId,
      status: 'pending', // pending, approved, active, completed, cancelled
      type: investmentData.type || 'equity', // equity, loan, revenue-share
      mockMode: true // Flag for MVP - no real money
    };
    
    return await this.create(this.collection, investment);
  }

  async getInvestorPortfolio(investorId) {
    return await this.getUserDocuments(this.collection, investorId, [
      orderBy('createdAt', 'desc')
    ]);
  }

  async getBusinessInvestments(businessId) {
    const constraints = [
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    ];
    
    return await this.getAll(this.collection, constraints);
  }
}

// Notification service
export class NotificationService extends FirebaseService {
  constructor() {
    super();
    this.collection = 'notifications';
  }

  async createNotification(userId, notificationData) {
    const notification = {
      ...notificationData,
      userId,
      read: false,
      type: notificationData.type || 'info' // info, warning, success, investment, alert
    };
    
    return await this.create(this.collection, notification);
  }

  async getUserNotifications(userId, unreadOnly = false) {
    const constraints = [where('userId', '==', userId)];
    
    if (unreadOnly) {
      constraints.push(where('read', '==', false));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(20)); // Limit to recent 20 notifications
    
    return await this.getAll(this.collection, constraints);
  }

  async markAsRead(notificationId) {
    return await this.update(this.collection, notificationId, { read: true });
  }
}

// Export service instances
export const userService = new UserService();
export const transactionService = new TransactionService();
export const businessService = new BusinessService();
export const investmentService = new InvestmentService();
export const notificationService = new NotificationService();

export default FirebaseService;