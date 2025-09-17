/**
 * KYC ROUTES
 * RESTful endpoints for KYC verification process
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { KYCService, upload } = require('../kycService');
const { authenticateToken, requireUserType, requireVerification } = require('../../middleware/authMiddleware');
const admin = require('firebase-admin');
const winston = require('winston');

const router = express.Router();
const kycService = new KYCService();
const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/kyc-routes.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// KYC VALIDATION MIDDLEWARE
// ============================================================================

const validateKYCInitiation = [
  body('firstName').isLength({ min: 1 }).trim().escape(),
  body('lastName').isLength({ min: 1 }).trim().escape(),
  body('dateOfBirth').isISO8601().toDate(),
  body('nationality').isLength({ min: 2 }).trim(),
  body('phoneNumber').isMobilePhone(),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.country').isLength({ min: 2 }).trim(),
  body('expectedVolume').optional().isIn(['low', 'medium', 'high']),
  body('purpose').optional().isIn(['investment', 'business', 'both'])
];

const validateDocumentUpload = [
  body('documentType').isIn([
    'passport', 'national_id', 'drivers_license', 
    'utility_bill', 'bank_statement', 'selfie'
  ]),
  body('documentSide').optional().isIn(['front', 'back']),
  body('country').optional().isLength({ min: 2 }).trim()
];

// ============================================================================
// KYC ROUTES
// ============================================================================

// Initiate KYC Process
router.post('/initiate', validateKYCInitiation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.uid;
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      middleName: req.body.middleName,
      dateOfBirth: req.body.dateOfBirth,
      nationality: req.body.nationality,
      phoneNumber: req.body.phoneNumber,
      email: req.user.email,
      country: req.body.address?.country || req.body.nationality,
      address: req.body.address,
      expectedVolume: req.body.expectedVolume || 'low',
      purpose: req.body.purpose || 'investment'
    };

    const result = await kycService.initiateKYC(userId, userData);

    logger.info(`KYC initiated for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: result,
      message: 'KYC process initiated successfully'
    });

  } catch (error) {
    logger.error('KYC initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate KYC process',
      message: error.message
    });
  }
});

// Upload KYC Document
router.post('/upload-document', 
  upload.single('document'), 
  validateDocumentUpload, 
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a document to upload'
        });
      }

      const userId = req.user.uid;
      const documentType = req.body.documentType;
      const documentSide = req.body.documentSide || 'front';

      const result = await kycService.uploadDocument(
        userId, 
        req.file, 
        documentType, 
        documentSide
      );

      logger.info(`Document uploaded for user ${userId}: ${documentType}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Document uploaded successfully'
      });

    } catch (error) {
      logger.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        message: error.message
      });
    }
  }
);

// Submit KYC for Review
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user.uid;
    const result = await kycService.submitForReview(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`KYC submitted for review by user: ${userId}`);

    res.json({
      success: true,
      data: result,
      message: 'KYC submitted for review successfully'
    });

  } catch (error) {
    logger.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit KYC for review',
      message: error.message
    });
  }
});

// Get KYC Status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get KYC profile
    const kycDoc = await db.collection('kycProfiles').doc(userId).get();
    
    if (!kycDoc.exists) {
      return res.json({
        success: true,
        data: {
          status: 'not_started',
          message: 'KYC verification not yet initiated'
        }
      });
    }

    const kycData = kycDoc.data();
    
    // Get document statuses
    const documentStatuses = [];
    for (const docId of kycData.documents) {
      const docRef = await db.collection('kycDocuments')
        .where('documentId', '==', docId)
        .limit(1)
        .get();
      
      if (!docRef.empty) {
        const docData = docRef.docs[0].data();
        documentStatuses.push({
          documentId: docData.documentId,
          type: docData.documentInfo.type,
          category: docData.documentInfo.category,
          status: docData.verification.status,
          uploadedAt: docData.metadata.submittedAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        kycId: kycData.kycId,
        status: kycData.status.overall,
        verificationLevel: kycData.verificationLevel.current,
        canInvest: kycData.status.canInvest,
        canReceiveFunds: kycData.status.canReceiveFunds,
        canWithdraw: kycData.status.canWithdraw,
        restrictions: kycData.status.restrictions,
        documents: documentStatuses,
        investmentLimits: kycData.investorClassification.investmentLimits,
        lastUpdated: kycData.metadata.updatedAt,
        completedAt: kycData.metadata.completedAt,
        statusHistory: kycData.status.statusHistory.slice(-5) // Last 5 status changes
      }
    });

  } catch (error) {
    logger.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve KYC status',
      message: error.message
    });
  }
});

// Get Required Documents List
router.get('/required-documents', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const userType = userData.userType;
    const country = userData.profile?.country || 'US';

    // Define required documents based on user type and country
    const requiredDocuments = {
      identity: {
        required: true,
        options: [
          {
            type: 'passport',
            name: 'Passport',
            description: 'Valid government-issued passport',
            sides: ['front']
          },
          {
            type: 'national_id',
            name: 'National ID Card',
            description: 'Government-issued national identity card',
            sides: ['front', 'back']
          },
          {
            type: 'drivers_license',
            name: 'Driver\'s License',
            description: 'Valid driver\'s license',
            sides: ['front', 'back']
          }
        ]
      },
      address: {
        required: true,
        options: [
          {
            type: 'utility_bill',
            name: 'Utility Bill',
            description: 'Recent utility bill (electricity, water, gas) not older than 3 months',
            sides: ['front']
          },
          {
            type: 'bank_statement',
            name: 'Bank Statement',
            description: 'Bank statement not older than 3 months',
            sides: ['front']
          }
        ]
      },
      selfie: {
        required: true,
        options: [
          {
            type: 'selfie',
            name: 'Selfie Verification',
            description: 'Clear selfie photo holding your identity document',
            sides: ['front']
          }
        ]
      }
    };

    // Add additional requirements for business users
    if (userType === 'business') {
      requiredDocuments.business = {
        required: true,
        options: [
          {
            type: 'business_registration',
            name: 'Business Registration',
            description: 'Certificate of incorporation or business registration',
            sides: ['front']
          },
          {
            type: 'tax_certificate',
            name: 'Tax Certificate',
            description: 'Tax identification number certificate',
            sides: ['front']
          }
        ]
      };
    }

    res.json({
      success: true,
      data: {
        requiredDocuments,
        userType,
        country,
        estimatedReviewTime: '24-48 hours',
        supportedFormats: ['JPEG', 'PNG', 'PDF'],
        maxFileSize: '10MB',
        requirements: [
          'Documents must be clear and readable',
          'All four corners of the document must be visible',
          'Documents must be current and not expired',
          'Personal information must match your profile',
          'Photos should be taken in good lighting'
        ]
      }
    });

  } catch (error) {
    logger.error('Get required documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve required documents',
      message: error.message
    });
  }
});

// Resubmit KYC (for rejected applications)
router.post('/resubmit', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Check current KYC status
    const kycDoc = await db.collection('kycProfiles').doc(userId).get();
    
    if (!kycDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'KYC profile not found',
        message: 'Please initiate KYC verification first'
      });
    }

    const kycData = kycDoc.data();
    
    if (kycData.status.overall !== 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'KYC resubmission not allowed',
        message: 'You can only resubmit rejected KYC applications'
      });
    }

    // Reset status for resubmission
    await db.collection('kycProfiles').doc(userId).update({
      'status.overall': 'pending',
      'status.canInvest': false,
      'status.canReceiveFunds': false,
      'status.canWithdraw': false,
      'status.statusHistory': admin.firestore.FieldValue.arrayUnion({
        status: 'resubmitted',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'KYC resubmitted after rejection',
        changedBy: 'user'
      }),
      'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user record
    await db.collection('users').doc(userId).update({
      'kyc.status': 'pending',
      'kyc.verified': false
    });

    logger.info(`KYC resubmitted by user: ${userId}`);

    res.json({
      success: true,
      message: 'KYC application reset for resubmission',
      data: {
        status: 'pending',
        nextSteps: [
          'Upload new or corrected documents',
          'Ensure all documents meet requirements',
          'Submit for review again'
        ]
      }
    });

  } catch (error) {
    logger.error('KYC resubmission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resubmit KYC',
      message: error.message
    });
  }
});

// Get KYC Statistics (for admin/monitoring)
router.get('/statistics', async (req, res) => {
  try {
    // This endpoint would typically be admin-only
    // For now, we'll return basic stats
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    const kycCollection = db.collection('kycProfiles');
    
    // Get total counts
    const [totalSnapshot, recentSnapshot, verifiedSnapshot, rejectedSnapshot] = await Promise.all([
      kycCollection.get(),
      kycCollection.where('metadata.createdAt', '>=', thirtyDaysAgo).get(),
      kycCollection.where('status.overall', '==', 'verified').get(),
      kycCollection.where('status.overall', '==', 'rejected').get()
    ]);

    const statistics = {
      total: totalSnapshot.size,
      recent: recentSnapshot.size,
      verified: verifiedSnapshot.size,
      rejected: rejectedSnapshot.size,
      pending: totalSnapshot.size - verifiedSnapshot.size - rejectedSnapshot.size,
      verificationRate: totalSnapshot.size > 0 ? (verifiedSnapshot.size / totalSnapshot.size * 100).toFixed(1) : 0,
      periodStart: thirtyDaysAgo.toISOString(),
      periodEnd: today.toISOString()
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get KYC statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve KYC statistics',
      message: error.message
    });
  }
});

module.exports = router;