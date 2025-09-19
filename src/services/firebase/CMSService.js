/**
 * 🚀 BVESTER CMS SERVICE
 * Comprehensive Content Management System for Business Tools & Growth Resources
 * Designed for easy use by non-technical users
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
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { userService } from './FirebaseService';

// Content types supported by CMS
export const CONTENT_TYPES = {
  BUSINESS_TOOL: 'business_tool',
  GROWTH_RESOURCE: 'growth_resource',
  TUTORIAL: 'tutorial',
  TEMPLATE: 'template',
  GUIDE: 'guide',
  VIDEO: 'video',
  DOCUMENT: 'document',
  IMAGE: 'image',
  // Investment Platform Content Types
  INVESTMENT_OPPORTUNITY: 'investment_opportunity',
  MARKET_ANALYSIS: 'market_analysis',
  INVESTOR_UPDATE: 'investor_update',
  SME_PROFILE: 'sme_profile',
  SUCCESS_STORY: 'success_story',
  EDUCATIONAL_CONTENT: 'educational_content',
  PRESS_RELEASE: 'press_release',
  WEBINAR: 'webinar',
  PODCAST: 'podcast',
  NEWSLETTER: 'newsletter'
};

// Content categories
export const CONTENT_CATEGORIES = {
  // Business Tools Categories
  FINANCIAL_MANAGEMENT: 'financial_management',
  MARKETING: 'marketing',
  OPERATIONS: 'operations',
  HR_MANAGEMENT: 'hr_management',
  LEGAL_COMPLIANCE: 'legal_compliance',
  TECHNOLOGY: 'technology',
  
  // Growth Resources Categories
  FUNDRAISING: 'fundraising',
  SCALING_STRATEGIES: 'scaling_strategies',
  MARKET_EXPANSION: 'market_expansion',
  INVESTMENT_READINESS: 'investment_readiness',
  BUSINESS_PLANNING: 'business_planning',
  MENTORSHIP: 'mentorship',
  
  // Investment Platform Categories
  EQUITY_INVESTMENTS: 'equity_investments',
  DEBT_INVESTMENTS: 'debt_investments',
  HYBRID_INVESTMENTS: 'hybrid_investments',
  SECTOR_ANALYSIS: 'sector_analysis',
  AFRICAN_MARKETS: 'african_markets',
  FINTECH: 'fintech',
  AGRICULTURE: 'agriculture',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  RENEWABLE_ENERGY: 'renewable_energy',
  E_COMMERCE: 'e_commerce',
  DUE_DILIGENCE: 'due_diligence',
  ESG_INVESTING: 'esg_investing',
  IMPACT_INVESTING: 'impact_investing'
};

// Content status
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  FEATURED: 'featured'
};

class CMSService {
  constructor() {
    this.contentCollection = 'cms_content';
    this.categoriesCollection = 'cms_categories';
    this.tagsCollection = 'cms_tags';
    this.analyticsCollection = 'cms_analytics';
  }

  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================

  /**
   * Create new content item
   */
  async createContent(contentData, creatorId) {
    try {
      console.log('Creating new content:', contentData.title);
      
      const content = {
        ...contentData,
        creatorId,
        status: contentData.status || CONTENT_STATUS.DRAFT,
        type: contentData.type || CONTENT_TYPES.BUSINESS_TOOL,
        category: contentData.category || CONTENT_CATEGORIES.FINANCIAL_MANAGEMENT,
        tags: contentData.tags || [],
        views: 0,
        likes: 0,
        downloads: 0,
        rating: 0,
        ratingCount: 0,
        featured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.contentCollection), content);
      
      // Update category analytics
      await this.updateCategoryStats(content.category, 'add');
      
      // Log analytics
      await this.logContentActivity('create', docRef.id, creatorId);
      
      console.log('Content created successfully:', docRef.id);
      return { id: docRef.id, ...content };
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  /**
   * Update existing content
   */
  async updateContent(contentId, updates, editorId) {
    try {
      console.log('Updating content:', contentId);
      
      const contentRef = doc(db, this.contentCollection, contentId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastEditedBy: editorId
      };

      await updateDoc(contentRef, updateData);
      
      // Log analytics
      await this.logContentActivity('update', contentId, editorId);
      
      console.log('Content updated successfully');
      return { id: contentId, ...updates };
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId, deleterId) {
    try {
      console.log('Deleting content:', contentId);
      
      // Get content data first
      const contentDoc = await getDoc(doc(db, this.contentCollection, contentId));
      if (!contentDoc.exists()) {
        throw new Error('Content not found');
      }
      
      const contentData = contentDoc.data();
      
      // Delete associated files
      if (contentData.fileUrls && contentData.fileUrls.length > 0) {
        for (const fileUrl of contentData.fileUrls) {
          await this.deleteFile(fileUrl);
        }
      }
      
      // Delete content document
      await deleteDoc(doc(db, this.contentCollection, contentId));
      
      // Update category analytics
      await this.updateCategoryStats(contentData.category, 'remove');
      
      // Log analytics
      await this.logContentActivity('delete', contentId, deleterId);
      
      console.log('Content deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  /**
   * Get content by ID
   */
  async getContent(contentId) {
    try {
      const docRef = doc(db, this.contentCollection, contentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Increment view count
        await this.incrementViews(contentId);
        
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log('Content not found:', contentId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  /**
   * Get all content with filters
   */
  async getAllContent(filters = {}) {
    try {
      console.log('Fetching content with filters:', filters);
      
      let q = collection(db, this.contentCollection);
      const constraints = [];
      
      // Apply filters
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      } else {
        // Default: only published content for regular users
        constraints.push(where('status', '==', CONTENT_STATUS.PUBLISHED));
      }
      
      if (filters.featured) {
        constraints.push(where('featured', '==', true));
      }
      
      if (filters.creatorId) {
        constraints.push(where('creatorId', '==', filters.creatorId));
      }
      
      // Sorting
      if (filters.sortBy) {
        const direction = filters.sortOrder || 'desc';
        constraints.push(orderBy(filters.sortBy, direction));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }
      
      // Limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const content = [];
      
      querySnapshot.forEach((doc) => {
        content.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Found ${content.length} content items`);
      return content;
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  /**
   * Search content
   */
  async searchContent(searchQuery, filters = {}) {
    try {
      console.log('Searching content:', searchQuery);
      
      // Get all content first (Firestore doesn't support full-text search natively)
      const allContent = await this.getAllContent(filters);
      
      // Filter by search query
      const searchResults = allContent.filter(content => {
        const searchText = searchQuery.toLowerCase();
        return (
          content.title?.toLowerCase().includes(searchText) ||
          content.description?.toLowerCase().includes(searchText) ||
          content.tags?.some(tag => tag.toLowerCase().includes(searchText)) ||
          content.category?.toLowerCase().includes(searchText)
        );
      });
      
      console.log(`Found ${searchResults.length} search results`);
      return searchResults;
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(type = null) {
    const filters = {
      featured: true,
      status: CONTENT_STATUS.PUBLISHED,
      sortBy: 'views',
      sortOrder: 'desc',
      limit: 10
    };
    
    if (type) {
      filters.type = type;
    }
    
    return await this.getAllContent(filters);
  }

  /**
   * Get popular content
   */
  async getPopularContent(type = null, timeframe = 'all') {
    const filters = {
      status: CONTENT_STATUS.PUBLISHED,
      sortBy: 'views',
      sortOrder: 'desc',
      limit: 20
    };
    
    if (type) {
      filters.type = type;
    }
    
    return await this.getAllContent(filters);
  }

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(file, folder = 'cms-content', fileName = null) {
    try {
      console.log('Uploading file:', fileName || file.name);
      
      const timestamp = Date.now();
      const finalFileName = fileName || `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${finalFileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('File uploaded successfully:', downloadURL);
      
      return {
        url: downloadURL,
        fileName: finalFileName,
        fullPath: snapshot.ref.fullPath,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, folder = 'cms-content') {
    try {
      console.log(`Uploading ${files.length} files`);
      
      const uploadPromises = Array.from(files).map(file => 
        this.uploadFile(file, folder)
      );
      
      const results = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully');
      return results;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(fileUrl) {
    try {
      console.log('Deleting file:', fileUrl);
      
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      
      console.log('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
      if (error.code !== 'storage/object-not-found') {
        throw error;
      }
      return false;
    }
  }

  // ============================================================================
  // CATEGORY & TAG MANAGEMENT
  // ============================================================================

  /**
   * Create new category
   */
  async createCategory(categoryData) {
    try {
      const category = {
        ...categoryData,
        contentCount: 0,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.categoriesCollection), category);
      return { id: docRef.id, ...category };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.categoriesCollection), orderBy('name'))
      );
      
      const categories = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Update category statistics
   */
  async updateCategoryStats(categoryId, action) {
    try {
      const categoryRef = doc(db, this.categoriesCollection, categoryId);
      const increment = action === 'add' ? 1 : -1;
      
      await updateDoc(categoryRef, {
        contentCount: increment > 0 ? arrayUnion(1) : arrayRemove(1)
      });
    } catch (error) {
      console.error('Error updating category stats:', error);
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 20) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.tagsCollection), 
          orderBy('usageCount', 'desc'),
          limit(limit)
        )
      );
      
      const tags = [];
      querySnapshot.forEach((doc) => {
        tags.push({ id: doc.id, ...doc.data() });
      });
      
      return tags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS & ENGAGEMENT
  // ============================================================================

  /**
   * Increment content views
   */
  async incrementViews(contentId) {
    try {
      const contentRef = doc(db, this.contentCollection, contentId);
      await updateDoc(contentRef, {
        views: arrayUnion(Date.now()) // Add timestamp for analytics
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  /**
   * Like/Unlike content
   */
  async toggleLike(contentId, userId) {
    try {
      const contentRef = doc(db, this.contentCollection, contentId);
      const contentDoc = await getDoc(contentRef);
      
      if (contentDoc.exists()) {
        const data = contentDoc.data();
        const likedUsers = data.likedBy || [];
        
        if (likedUsers.includes(userId)) {
          // Unlike
          await updateDoc(contentRef, {
            likes: Math.max(0, (data.likes || 0) - 1),
            likedBy: arrayRemove(userId)
          });
          return false; // Not liked
        } else {
          // Like
          await updateDoc(contentRef, {
            likes: (data.likes || 0) + 1,
            likedBy: arrayUnion(userId)
          });
          return true; // Liked
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Rate content
   */
  async rateContent(contentId, userId, rating) {
    try {
      const contentRef = doc(db, this.contentCollection, contentId);
      const contentDoc = await getDoc(contentRef);
      
      if (contentDoc.exists()) {
        const data = contentDoc.data();
        const ratings = data.ratings || {};
        const previousRating = ratings[userId];
        
        // Update ratings
        ratings[userId] = rating;
        
        // Calculate new average
        const totalRatings = Object.values(ratings);
        const newAverage = totalRatings.reduce((sum, r) => sum + r, 0) / totalRatings.length;
        
        await updateDoc(contentRef, {
          rating: newAverage,
          ratingCount: totalRatings.length,
          ratings: ratings
        });
        
        return newAverage;
      }
    } catch (error) {
      console.error('Error rating content:', error);
      throw error;
    }
  }

  /**
   * Track content download
   */
  async trackDownload(contentId, userId) {
    try {
      const contentRef = doc(db, this.contentCollection, contentId);
      await updateDoc(contentRef, {
        downloads: arrayUnion({ userId, timestamp: Date.now() })
      });
      
      await this.logContentActivity('download', contentId, userId);
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }

  /**
   * Log content activity
   */
  async logContentActivity(action, contentId, userId) {
    try {
      const activity = {
        action,
        contentId,
        userId,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, this.analyticsCollection), activity);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(contentId, timeframe = 'all') {
    try {
      const constraints = [where('contentId', '==', contentId)];
      
      if (timeframe !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          constraints.push(where('timestamp', '>=', startDate));
        }
      }
      
      const querySnapshot = await getDocs(
        query(collection(db, this.analyticsCollection), ...constraints)
      );
      
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      // Aggregate analytics
      const analytics = {
        totalViews: activities.filter(a => a.action === 'view').length,
        totalDownloads: activities.filter(a => a.action === 'download').length,
        uniqueUsers: [...new Set(activities.map(a => a.userId))].length,
        activityByDay: {},
        activityByAction: {}
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting content analytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  /**
   * Subscribe to content updates
   */
  subscribeToContent(filters, callback) {
    try {
      console.log('Setting up real-time content listener');
      
      let q = collection(db, this.contentCollection);
      const constraints = [];
      
      // Apply filters (same logic as getAllContent)
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const content = [];
        querySnapshot.forEach((doc) => {
          content.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Real-time update: ${content.length} content items`);
        callback(content);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up content listener:', error);
      throw error;
    }
  }

  /**
   * Subscribe to specific content item
   */
  subscribeToContentItem(contentId, callback) {
    try {
      const docRef = doc(db, this.contentCollection, contentId);
      
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up content item listener:', error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN HELPERS
  // ============================================================================

  /**
   * Get CMS dashboard stats
   */
  async getDashboardStats() {
    try {
      const [contentSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, this.contentCollection)),
        getDocs(collection(db, this.categoriesCollection))
      ]);
      
      const allContent = [];
      contentSnapshot.forEach((doc) => {
        allContent.push(doc.data());
      });
      
      const stats = {
        totalContent: allContent.length,
        publishedContent: allContent.filter(c => c.status === CONTENT_STATUS.PUBLISHED).length,
        draftContent: allContent.filter(c => c.status === CONTENT_STATUS.DRAFT).length,
        featuredContent: allContent.filter(c => c.featured).length,
        totalCategories: categoriesSnapshot.size,
        totalViews: allContent.reduce((sum, c) => sum + (c.views || 0), 0),
        totalLikes: allContent.reduce((sum, c) => sum + (c.likes || 0), 0),
        totalDownloads: allContent.reduce((sum, c) => sum + (c.downloads || 0), 0),
        contentByType: {},
        contentByCategory: {}
      };
      
      // Group by type and category
      allContent.forEach(content => {
        stats.contentByType[content.type] = (stats.contentByType[content.type] || 0) + 1;
        stats.contentByCategory[content.category] = (stats.contentByCategory[content.category] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Bulk update content status
   */
  async bulkUpdateStatus(contentIds, newStatus) {
    try {
      console.log(`Bulk updating ${contentIds.length} items to ${newStatus}`);
      
      const updatePromises = contentIds.map(id => 
        updateDoc(doc(db, this.contentCollection, id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        })
      );
      
      await Promise.all(updatePromises);
      console.log('Bulk update completed');
      return true;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  // ============================================================================
  // INVESTMENT PLATFORM SPECIFIC METHODS
  // ============================================================================

  /**
   * Create investment opportunity content
   */
  async createInvestmentOpportunity(opportunityData, creatorId) {
    try {
      const opportunity = {
        ...opportunityData,
        type: CONTENT_TYPES.INVESTMENT_OPPORTUNITY,
        category: opportunityData.category || CONTENT_CATEGORIES.EQUITY_INVESTMENTS,
        status: CONTENT_STATUS.DRAFT,
        // Investment-specific fields
        fundingGoal: opportunityData.fundingGoal || 0,
        fundingRaised: 0,
        investorCount: 0,
        minimumInvestment: opportunityData.minimumInvestment || 1000,
        expectedROI: opportunityData.expectedROI || '',
        investmentTerm: opportunityData.investmentTerm || '',
        riskLevel: opportunityData.riskLevel || 'medium',
        sector: opportunityData.sector || CONTENT_CATEGORIES.FINTECH,
        country: opportunityData.country || '',
        isActive: false
      };

      return await this.createContent(opportunity, creatorId);
    } catch (error) {
      console.error('Error creating investment opportunity:', error);
      throw error;
    }
  }

  /**
   * Get active investment opportunities
   */
  async getActiveInvestmentOpportunities(sector = null, country = null) {
    try {
      let q = query(
        collection(db, this.contentCollection),
        where('type', '==', CONTENT_TYPES.INVESTMENT_OPPORTUNITY),
        where('status', '==', CONTENT_STATUS.PUBLISHED),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      if (sector) {
        q = query(q, where('sector', '==', sector));
      }

      if (country) {
        q = query(q, where('country', '==', country));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting investment opportunities:', error);
      throw error;
    }
  }

  /**
   * Create SME profile content
   */
  async createSMEProfile(smeData, creatorId) {
    try {
      const smeProfile = {
        ...smeData,
        type: CONTENT_TYPES.SME_PROFILE,
        category: smeData.sector || CONTENT_CATEGORIES.FINTECH,
        status: CONTENT_STATUS.DRAFT,
        // SME-specific fields
        companyName: smeData.companyName || '',
        foundingYear: smeData.foundingYear || new Date().getFullYear(),
        employeeCount: smeData.employeeCount || '',
        revenue: smeData.revenue || '',
        growthRate: smeData.growthRate || '',
        fundingStage: smeData.fundingStage || 'seed',
        businessModel: smeData.businessModel || '',
        targetMarket: smeData.targetMarket || '',
        isVerified: false
      };

      return await this.createContent(smeProfile, creatorId);
    } catch (error) {
      console.error('Error creating SME profile:', error);
      throw error;
    }
  }

  /**
   * Get market analysis content for specific sectors
   */
  async getMarketAnalysis(sector = null, country = null) {
    try {
      let q = query(
        collection(db, this.contentCollection),
        where('type', '==', CONTENT_TYPES.MARKET_ANALYSIS),
        where('status', '==', CONTENT_STATUS.PUBLISHED),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (sector) {
        q = query(q, where('sector', '==', sector));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting market analysis:', error);
      throw error;
    }
  }

  /**
   * Create investor update/newsletter
   */
  async createInvestorUpdate(updateData, creatorId) {
    try {
      const update = {
        ...updateData,
        type: CONTENT_TYPES.INVESTOR_UPDATE,
        category: CONTENT_CATEGORIES.INVESTMENT_READINESS,
        status: CONTENT_STATUS.DRAFT,
        // Update-specific fields
        updateType: updateData.updateType || 'general', // general, portfolio, market
        recipientList: updateData.recipientList || 'all', // all, investors, smes
        scheduledDate: updateData.scheduledDate || null,
        isSent: false
      };

      return await this.createContent(update, creatorId);
    } catch (error) {
      console.error('Error creating investor update:', error);
      throw error;
    }
  }

  /**
   * Get investment-focused dashboard stats
   */
  async getInvestmentStats() {
    try {
      const allContent = await this.getAllContent();
      
      const stats = {
        totalOpportunities: allContent.filter(c => c.type === CONTENT_TYPES.INVESTMENT_OPPORTUNITY).length,
        activeOpportunities: allContent.filter(c => 
          c.type === CONTENT_TYPES.INVESTMENT_OPPORTUNITY && 
          c.status === CONTENT_STATUS.PUBLISHED && 
          c.isActive
        ).length,
        totalSMEProfiles: allContent.filter(c => c.type === CONTENT_TYPES.SME_PROFILE).length,
        verifiedSMEs: allContent.filter(c => 
          c.type === CONTENT_TYPES.SME_PROFILE && 
          c.isVerified
        ).length,
        totalMarketAnalyses: allContent.filter(c => c.type === CONTENT_TYPES.MARKET_ANALYSIS).length,
        totalInvestorUpdates: allContent.filter(c => c.type === CONTENT_TYPES.INVESTOR_UPDATE).length,
        sectorsWithOpportunities: [...new Set(
          allContent
            .filter(c => c.type === CONTENT_TYPES.INVESTMENT_OPPORTUNITY)
            .map(c => c.sector)
            .filter(Boolean)
        )].length,
        countriesWithOpportunities: [...new Set(
          allContent
            .filter(c => c.type === CONTENT_TYPES.INVESTMENT_OPPORTUNITY)
            .map(c => c.country)
            .filter(Boolean)
        )].length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting investment stats:', error);
      throw error;
    }
  }
}

// Export service instance
export const cmsService = new CMSService();
export default CMSService;