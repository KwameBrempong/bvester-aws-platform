// Investment Matching Service for BizInvest Hub
// Handles business listings, investor profiles, and investment matching

import { 
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
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export class InvestmentService {
  // Business Listings Management
  static async createBusinessListing(userId, businessData) {
    try {
      console.log('Creating business listing for user:', userId);
      
      const listing = {
        ...businessData,
        ownerId: userId,
        status: 'pending', // pending, approved, rejected
        visibility: 'private', // private, public, featured
        views: 0,
        interestedInvestors: [],
        investmentOffers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Investment readiness data
        readinessScore: businessData.readinessScore || 0,
        lastAnalysisUpdate: serverTimestamp(),
        
        // Verification status
        verified: false,
        verificationDocuments: [],
        verificationDate: null,
        
        // Engagement metrics
        profileViews: 0,
        inquiries: 0,
        bookmarks: 0
      };
      
      const docRef = await addDoc(collection(db, 'businessListings'), listing);
      console.log('Business listing created with ID:', docRef.id);
      
      return { id: docRef.id, ...listing };
    } catch (error) {
      console.error('Error creating business listing:', error);
      throw error;
    }
  }

  static async updateBusinessListing(listingId, updates) {
    try {
      const listingRef = doc(db, 'businessListings', listingId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(listingRef, updateData);
      console.log('Business listing updated:', listingId);
      
      return { id: listingId, ...updateData };
    } catch (error) {
      console.error('Error updating business listing:', error);
      throw error;
    }
  }

  static async getBusinessListing(listingId) {
    try {
      const listingRef = doc(db, 'businessListings', listingId);
      const listingSnap = await getDoc(listingRef);
      
      if (listingSnap.exists()) {
        const listing = { id: listingSnap.id, ...listingSnap.data() };
        
        // Increment view count
        await this.incrementListingViews(listingId);
        
        return listing;
      } else {
        throw new Error('Business listing not found');
      }
    } catch (error) {
      console.error('Error getting business listing:', error);
      throw error;
    }
  }

  static async getUserBusinessListings(userId) {
    try {
      const q = query(
        collection(db, 'businessListings'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings = [];
      
      querySnapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() });
      });
      
      return listings;
    } catch (error) {
      console.error('Error getting user business listings:', error);
      throw error;
    }
  }

  // Investor Search and Filtering
  static async searchBusinesses(filters = {}) {
    try {
      console.log('Searching businesses with filters:', filters);
      
      let q = collection(db, 'businessListings');
      const constraints = [where('visibility', 'in', ['public', 'featured'])];
      
      // Apply filters
      if (filters.minReadinessScore) {
        constraints.push(where('readinessScore', '>=', filters.minReadinessScore));
      }
      
      if (filters.industry) {
        constraints.push(where('industry', '==', filters.industry));
      }
      
      if (filters.country) {
        constraints.push(where('country', '==', filters.country));
      }
      
      if (filters.minInvestment) {
        constraints.push(where('seekingAmount', '>=', filters.minInvestment));
      }
      
      if (filters.maxInvestment) {
        constraints.push(where('seekingAmount', '<=', filters.maxInvestment));
      }
      
      if (filters.investmentType) {
        constraints.push(where('investmentTypes', 'array-contains', filters.investmentType));
      }
      
      // Add ordering
      if (filters.sortBy === 'readinessScore') {
        constraints.push(orderBy('readinessScore', 'desc'));
      } else if (filters.sortBy === 'newest') {
        constraints.push(orderBy('createdAt', 'desc'));
      } else if (filters.sortBy === 'popular') {
        constraints.push(orderBy('views', 'desc'));
      } else {
        constraints.push(orderBy('updatedAt', 'desc'));
      }
      
      // Limit results
      const resultLimit = filters.limit || 20;
      constraints.push(limit(resultLimit));
      
      q = query(q, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const businesses = [];
      querySnapshot.forEach((doc) => {
        businesses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Found ${businesses.length} businesses matching filters`);
      return businesses;
    } catch (error) {
      console.error('Error searching businesses:', error);
      throw error;
    }
  }

  // Investment Interest and Pledges
  static async expressInterest(investorId, listingId, message = '') {
    try {
      console.log('Expressing interest:', { investorId, listingId });
      
      const interest = {
        investorId,
        listingId,
        message,
        status: 'pending', // pending, accepted, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to interests collection
      const interestRef = await addDoc(collection(db, 'investmentInterests'), interest);
      
      // Update business listing
      const listingRef = doc(db, 'businessListings', listingId);
      await updateDoc(listingRef, {
        interestedInvestors: arrayUnion(investorId),
        inquiries: increment(1),
        updatedAt: serverTimestamp()
      });
      
      return { id: interestRef.id, ...interest };
    } catch (error) {
      console.error('Error expressing interest:', error);
      throw error;
    }
  }

  static async createInvestmentPledge(pledgeData) {
    try {
      console.log('Creating investment pledge:', pledgeData);
      
      const pledge = {
        ...pledgeData,
        status: 'pending', // pending, accepted, rejected, completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Mock investment data (no real money)
        mockInvestment: true,
        realFundsDisclaimer: 'This is a mock investment for demonstration purposes only. No real funds are involved.',
        
        // Terms and conditions
        terms: {
          amount: pledgeData.amount,
          investmentType: pledgeData.investmentType, // equity, loan, revenue_sharing
          expectedReturn: pledgeData.expectedReturn,
          timeframe: pledgeData.timeframe,
          conditions: pledgeData.conditions || []
        }
      };
      
      const pledgeRef = await addDoc(collection(db, 'investmentPledges'), pledge);
      
      // Update business listing
      const listingRef = doc(db, 'businessListings', pledgeData.listingId);
      await updateDoc(listingRef, {
        investmentOffers: arrayUnion(pledgeRef.id),
        updatedAt: serverTimestamp()
      });
      
      return { id: pledgeRef.id, ...pledge };
    } catch (error) {
      console.error('Error creating investment pledge:', error);
      throw error;
    }
  }

  // Get business by ID
  static async getBusinessById(businessId) {
    try {
      const docRef = doc(db, 'businessListings', businessId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Business not found');
      }
    } catch (error) {
      console.error('Error getting business:', error);
      throw error;
    }
  }

  // Get investor history
  static async getInvestorHistory(investorId) {
    try {
      const q = query(
        collection(db, 'investmentPledges'),
        where('investorId', '==', investorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const investments = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        investments.push({
          id: doc.id,
          ...data,
          // Add mock current value and progress for demo
          currentValue: data.amount * (1 + Math.random() * 0.3 - 0.1), // ±10% variation
          progress: Math.random() * 0.8 + 0.2 // 20-100% progress
        });
      });
      
      return investments;
    } catch (error) {
      console.error('Error getting investor history:', error);
      throw error;
    }
  }

  // Get investor interests
  static async getInvestorInterests(investorId) {
    try {
      const q = query(
        collection(db, 'investmentPledges'),
        where('investorId', '==', investorId),
        where('type', '==', 'interest_expression')
      );
      
      const querySnapshot = await getDocs(q);
      const interests = [];
      
      querySnapshot.forEach((doc) => {
        interests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return interests;
    } catch (error) {
      console.error('Error getting investor interests:', error);
      throw error;
    }
  }

  // Get investor profile
  static async getInvestorProfile(investorId) {
    try {
      const q = query(
        collection(db, 'investorProfiles'),
        where('userId', '==', investorId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting investor profile:', error);
      throw error;
    }
  }

  // Update investor profile
  static async updateInvestorProfile(investorId, profileData) {
    try {
      const q = query(
        collection(db, 'investorProfiles'),
        where('userId', '==', investorId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...profileData,
          updatedAt: serverTimestamp()
        });
        return true;
      } else {
        // Create new profile if doesn't exist
        return await this.createInvestorProfile(investorId, profileData);
      }
    } catch (error) {
      console.error('Error updating investor profile:', error);
      throw error;
    }
  }

  // Get investor statistics
  static async getInvestorStats(investorId) {
    try {
      const investments = await this.getInvestorHistory(investorId);
      
      let totalInvestments = investments.length;
      let totalPortfolioValue = 0;
      let successfulExits = 0;
      let totalReturns = 0;
      
      investments.forEach(investment => {
        totalPortfolioValue += investment.amount || 0;
        if (investment.status === 'completed' || investment.status === 'exited') {
          successfulExits += 1;
        }
        if (investment.currentValue && investment.amount) {
          totalReturns += (investment.currentValue - investment.amount);
        }
      });
      
      const averageROI = totalPortfolioValue > 0 
        ? ((totalReturns / totalPortfolioValue) * 100)
        : 0;
      
      return {
        totalInvestments,
        totalPortfolioValue,
        successfulExits,
        averageROI: Math.round(averageROI * 100) / 100
      };
    } catch (error) {
      console.error('Error getting investor stats:', error);
      return {
        totalInvestments: 0,
        totalPortfolioValue: 0,
        successfulExits: 0,
        averageROI: 0
      };
    }
  }

  // Investor Profile Management
  static async createInvestorProfile(userId, profileData) {
    try {
      console.log('Creating investor profile for user:', userId);
      
      const profile = {
        ...profileData,
        userId,
        profileType: 'investor',
        verified: false,
        investmentHistory: [],
        portfolioValue: 0, // Mock value
        totalInvestments: 0,
        successfulExits: 0,
        
        // Investment preferences
        preferences: {
          industries: profileData.industries || [],
          countries: profileData.countries || [],
          minInvestment: profileData.minInvestment || 1000,
          maxInvestment: profileData.maxInvestment || 100000,
          investmentTypes: profileData.investmentTypes || ['equity'],
          riskTolerance: profileData.riskTolerance || 'medium'
        },
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'investorProfiles'), profile);
      console.log('Investor profile created with ID:', docRef.id);
      
      return { id: docRef.id, ...profile };
    } catch (error) {
      console.error('Error creating investor profile:', error);
      throw error;
    }
  }

  static async getInvestorProfile(userId) {
    try {
      const q = query(
        collection(db, 'investorProfiles'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting investor profile:', error);
      throw error;
    }
  }

  // Matching Algorithm
  static async getMatchedBusinesses(investorId, investorProfile) {
    try {
      console.log('Finding matched businesses for investor:', investorId);
      
      const preferences = investorProfile.preferences || {};
      const filters = {
        minReadinessScore: 60, // Only show investment-ready businesses
        limit: 50
      };
      
      // Add investor preferences to filters
      if (preferences.countries && preferences.countries.length > 0) {
        filters.country = preferences.countries[0]; // Firestore limitation - single value
      }
      
      if (preferences.minInvestment) {
        filters.minInvestment = preferences.minInvestment;
      }
      
      if (preferences.maxInvestment) {
        filters.maxInvestment = preferences.maxInvestment;
      }
      
      if (preferences.investmentTypes && preferences.investmentTypes.length > 0) {
        filters.investmentType = preferences.investmentTypes[0];
      }
      
      const businesses = await this.searchBusinesses(filters);
      
      // Score and rank matches
      const scoredMatches = businesses.map(business => {
        let matchScore = business.readinessScore || 0;
        
        // Industry match bonus
        if (preferences.industries && preferences.industries.includes(business.industry)) {
          matchScore += 10;
        }
        
        // Country match bonus
        if (preferences.countries && preferences.countries.includes(business.country)) {
          matchScore += 5;
        }
        
        // Investment amount compatibility
        const seekingAmount = business.seekingAmount || 0;
        if (seekingAmount >= preferences.minInvestment && seekingAmount <= preferences.maxInvestment) {
          matchScore += 5;
        }
        
        // Recent activity bonus
        const daysSinceUpdate = (Date.now() - business.updatedAt?.toDate?.()?.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          matchScore += 3;
        }
        
        return {
          ...business,
          matchScore: Math.min(100, matchScore),
          matchReasons: this.generateMatchReasons(business, preferences)
        };
      });
      
      // Sort by match score
      scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      return scoredMatches.slice(0, 20); // Return top 20 matches
    } catch (error) {
      console.error('Error getting matched businesses:', error);
      throw error;
    }
  }

  static generateMatchReasons(business, preferences) {
    const reasons = [];
    
    if (business.readinessScore >= 80) {
      reasons.push('High investment readiness score');
    }
    
    if (preferences.industries && preferences.industries.includes(business.industry)) {
      reasons.push('Matches your industry preference');
    }
    
    if (preferences.countries && preferences.countries.includes(business.country)) {
      reasons.push('Located in your preferred region');
    }
    
    if (business.verified) {
      reasons.push('Verified business profile');
    }
    
    if (business.views > 100) {
      reasons.push('High investor interest');
    }
    
    return reasons;
  }

  // Utility Methods
  static async incrementListingViews(listingId) {
    try {
      const listingRef = doc(db, 'businessListings', listingId);
      await updateDoc(listingRef, {
        views: increment(1),
        profileViews: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing listing views:', error);
    }
  }

  static async bookmarkBusiness(userId, listingId) {
    try {
      const bookmark = {
        userId,
        listingId,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'bookmarks'), bookmark);
      
      // Update listing bookmark count
      const listingRef = doc(db, 'businessListings', listingId);
      await updateDoc(listingRef, {
        bookmarks: increment(1)
      });
      
      return bookmark;
    } catch (error) {
      console.error('Error bookmarking business:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToInvestmentOffers(listingId, callback) {
    try {
      const q = query(
        collection(db, 'investmentPledges'),
        where('listingId', '==', listingId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const offers = [];
        querySnapshot.forEach((doc) => {
          offers.push({ id: doc.id, ...doc.data() });
        });
        callback(offers);
      });
    } catch (error) {
      console.error('Error subscribing to investment offers:', error);
      throw error;
    }
  }

  static subscribeToBusinessMatches(investorId, callback) {
    try {
      // This is a simplified version - in production, you'd want more sophisticated real-time matching
      const q = query(
        collection(db, 'businessListings'),
        where('visibility', '==', 'public'),
        where('readinessScore', '>=', 60),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const businesses = [];
        querySnapshot.forEach((doc) => {
          businesses.push({ id: doc.id, ...doc.data() });
        });
        callback(businesses);
      });
    } catch (error) {
      console.error('Error subscribing to business matches:', error);
      throw error;
    }
  }
}

// Helper function for Firestore increment
function increment(value) {
  // This would normally use FieldValue.increment(value) from Firestore
  // For now, we'll simulate it
  return value;
}

export default InvestmentService;