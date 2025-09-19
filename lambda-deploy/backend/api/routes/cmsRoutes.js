/**
 * BVESTER CMS API ROUTES
 * Content Management System API endpoints for investment platform content
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');
const admin = require('firebase-admin');
const winston = require('winston');

const router = express.Router();
const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/cms-routes.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateContent = [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title required (1-200 chars)'),
  body('description').isLength({ min: 1, max: 500 }).withMessage('Description required (1-500 chars)'),
  body('type').isIn([
    'business_tool', 'growth_resource', 'tutorial', 'template', 'guide', 
    'video', 'document', 'image', 'investment_opportunity', 'market_analysis',
    'investor_update', 'sme_profile', 'success_story', 'educational_content',
    'press_release', 'webinar', 'podcast', 'newsletter'
  ]).withMessage('Invalid content type'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
];

const validateInvestmentOpportunity = [
  body('companyName').isLength({ min: 1 }).withMessage('Company name required'),
  body('sector').isLength({ min: 1 }).withMessage('Sector required'),
  body('country').isLength({ min: 1 }).withMessage('Country required'),
  body('fundingGoal').isFloat({ min: 1000 }).withMessage('Funding goal must be at least $1,000'),
  body('minimumInvestment').isFloat({ min: 100 }).withMessage('Minimum investment must be at least $100'),
  body('riskLevel').isIn(['low', 'medium', 'high']).withMessage('Invalid risk level')
];

const validateSMEProfile = [
  body('companyName').isLength({ min: 1 }).withMessage('Company name required'),
  body('sector').isLength({ min: 1 }).withMessage('Sector required'),
  body('foundingYear').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid founding year')
];

// ============================================================================
// CONTENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all content with filtering and pagination
 */
router.get('/content', authenticateToken, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      category, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db.collection('cms_content');

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const content = [];

    snapshot.forEach(doc => {
      content.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    // Get total count for pagination
    const totalQuery = db.collection('cms_content');
    // Apply same filters for count
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    logger.info(`Content retrieved: ${content.length} items`, {
      userId: req.user.uid,
      filters: { type, status, category },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error retrieving content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content',
      error: error.message
    });
  }
});

/**
 * Get single content item by ID
 */
router.get('/content/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('cms_content').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const content = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };

    // Increment view count
    await doc.ref.update({
      views: admin.firestore.FieldValue.increment(1)
    });

    logger.info(`Content viewed: ${content.title}`, {
      contentId: id,
      userId: req.user.uid
    });

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    logger.error('Error retrieving content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content',
      error: error.message
    });
  }
});

/**
 * Create new content (Admin only)
 */
router.post('/content', authenticateToken, requireRole('admin'), validateContent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const contentData = {
      ...req.body,
      creatorId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      views: 0,
      likes: 0,
      downloads: 0
    };

    const docRef = await db.collection('cms_content').add(contentData);

    logger.info(`Content created: ${contentData.title}`, {
      contentId: docRef.id,
      creatorId: req.user.uid,
      type: contentData.type
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: {
        id: docRef.id,
        ...contentData
      }
    });

  } catch (error) {
    logger.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
    });
  }
});

/**
 * Update content (Admin only)
 */
router.put('/content/:id', authenticateToken, requireRole('admin'), validateContent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('cms_content').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await docRef.update(updateData);

    logger.info(`Content updated: ${updateData.title || 'N/A'}`, {
      contentId: id,
      updatedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'Content updated successfully'
    });

  } catch (error) {
    logger.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content',
      error: error.message
    });
  }
});

/**
 * Delete content (Admin only)
 */
router.delete('/content/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('cms_content').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await docRef.delete();

    logger.info(`Content deleted`, {
      contentId: id,
      deletedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
});

// ============================================================================
// INVESTMENT OPPORTUNITY ENDPOINTS
// ============================================================================

/**
 * Get active investment opportunities
 */
router.get('/opportunities', authenticateToken, async (req, res) => {
  try {
    const { sector, country, riskLevel } = req.query;

    let query = db.collection('cms_content')
      .where('type', '==', 'investment_opportunity')
      .where('status', '==', 'published')
      .where('isActive', '==', true);

    if (sector) {
      query = query.where('sector', '==', sector);
    }
    if (country) {
      query = query.where('country', '==', country);
    }
    if (riskLevel) {
      query = query.where('riskLevel', '==', riskLevel);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const opportunities = [];

    snapshot.forEach(doc => {
      opportunities.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    logger.info(`Investment opportunities retrieved: ${opportunities.length} items`, {
      userId: req.user.uid,
      filters: { sector, country, riskLevel }
    });

    res.json({
      success: true,
      data: opportunities
    });

  } catch (error) {
    logger.error('Error retrieving investment opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve investment opportunities',
      error: error.message
    });
  }
});

/**
 * Create investment opportunity (Admin only)
 */
router.post('/opportunities', 
  authenticateToken, 
  requireRole('admin'), 
  validateContent,
  validateInvestmentOpportunity,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const opportunityData = {
        ...req.body,
        type: 'investment_opportunity',
        creatorId: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        fundingRaised: 0,
        investorCount: 0,
        views: 0,
        isActive: req.body.isActive || false
      };

      const docRef = await db.collection('cms_content').add(opportunityData);

      logger.info(`Investment opportunity created: ${opportunityData.title}`, {
        opportunityId: docRef.id,
        companyName: opportunityData.companyName,
        creatorId: req.user.uid
      });

      res.status(201).json({
        success: true,
        message: 'Investment opportunity created successfully',
        data: {
          id: docRef.id,
          ...opportunityData
        }
      });

    } catch (error) {
      logger.error('Error creating investment opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create investment opportunity',
        error: error.message
      });
    }
  }
);

// ============================================================================
// SME PROFILE ENDPOINTS
// ============================================================================

/**
 * Get SME profiles
 */
router.get('/sme-profiles', authenticateToken, async (req, res) => {
  try {
    const { sector, country, verified } = req.query;

    let query = db.collection('cms_content')
      .where('type', '==', 'sme_profile')
      .where('status', '==', 'published');

    if (sector) {
      query = query.where('sector', '==', sector);
    }
    if (country) {
      query = query.where('country', '==', country);
    }
    if (verified === 'true') {
      query = query.where('isVerified', '==', true);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const profiles = [];

    snapshot.forEach(doc => {
      profiles.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    logger.info(`SME profiles retrieved: ${profiles.length} items`, {
      userId: req.user.uid,
      filters: { sector, country, verified }
    });

    res.json({
      success: true,
      data: profiles
    });

  } catch (error) {
    logger.error('Error retrieving SME profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SME profiles',
      error: error.message
    });
  }
});

/**
 * Create SME profile (Admin or SME owner)
 */
router.post('/sme-profiles',
  authenticateToken,
  validateContent,
  validateSMEProfile,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const smeData = {
        ...req.body,
        type: 'sme_profile',
        creatorId: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        views: 0,
        isVerified: false // Must be verified by admin
      };

      const docRef = await db.collection('cms_content').add(smeData);

      logger.info(`SME profile created: ${smeData.companyName}`, {
        profileId: docRef.id,
        creatorId: req.user.uid
      });

      res.status(201).json({
        success: true,
        message: 'SME profile created successfully',
        data: {
          id: docRef.id,
          ...smeData
        }
      });

    } catch (error) {
      logger.error('Error creating SME profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create SME profile',
        error: error.message
      });
    }
  }
);

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get CMS analytics (Admin only)
 */
router.get('/analytics', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const contentSnapshot = await db.collection('cms_content').get();
    const contents = [];
    
    contentSnapshot.forEach(doc => {
      contents.push({ id: doc.id, ...doc.data() });
    });

    const analytics = {
      totalContent: contents.length,
      contentByType: {},
      contentByStatus: {},
      contentByCategory: {},
      totalViews: contents.reduce((sum, c) => sum + (c.views || 0), 0),
      totalLikes: contents.reduce((sum, c) => sum + (c.likes || 0), 0),
      totalDownloads: contents.reduce((sum, c) => sum + (c.downloads || 0), 0),
      // Investment-specific analytics
      totalOpportunities: contents.filter(c => c.type === 'investment_opportunity').length,
      activeOpportunities: contents.filter(c => 
        c.type === 'investment_opportunity' && 
        c.status === 'published' && 
        c.isActive
      ).length,
      totalSMEProfiles: contents.filter(c => c.type === 'sme_profile').length,
      verifiedSMEs: contents.filter(c => 
        c.type === 'sme_profile' && 
        c.isVerified
      ).length
    };

    // Group by type, status, category
    contents.forEach(content => {
      analytics.contentByType[content.type] = (analytics.contentByType[content.type] || 0) + 1;
      analytics.contentByStatus[content.status] = (analytics.contentByStatus[content.status] || 0) + 1;
      if (content.category) {
        analytics.contentByCategory[content.category] = (analytics.contentByCategory[content.category] || 0) + 1;
      }
    });

    logger.info(`Analytics retrieved`, {
      userId: req.user.uid,
      totalContent: analytics.totalContent
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error retrieving analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

/**
 * Update content engagement (like, download)
 */
router.post('/content/:id/engagement', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like', 'unlike', 'download'

    if (!['like', 'unlike', 'download'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be like, unlike, or download'
      });
    }

    const docRef = db.collection('cms_content').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    let updateData = {};
    
    switch (action) {
      case 'like':
        updateData.likes = admin.firestore.FieldValue.increment(1);
        break;
      case 'unlike':
        updateData.likes = admin.firestore.FieldValue.increment(-1);
        break;
      case 'download':
        updateData.downloads = admin.firestore.FieldValue.increment(1);
        break;
    }

    await docRef.update(updateData);

    logger.info(`Content engagement: ${action}`, {
      contentId: id,
      userId: req.user.uid,
      action
    });

    res.json({
      success: true,
      message: `Content ${action} recorded successfully`
    });

  } catch (error) {
    logger.error('Error recording engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record engagement',
      error: error.message
    });
  }
});

module.exports = router;