// Firebase Functions - KYC Routes
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();
const storage = admin.storage();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * 📋 GET KYC STATUS
 * Get user's KYC verification status
 */
router.get('/status', authenticateToken, async (req, res) => {
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
    const verification = userData.verification || {};

    res.json({
      success: true,
      kyc: {
        status: verification.kycStatus || 'pending',
        level: verification.kycLevel || 'basic',
        documents: verification.kycDocuments || [],
        submittedAt: verification.kycSubmittedAt || null,
        verifiedAt: verification.kycVerifiedAt || null,
        rejectionReason: verification.kycRejectionReason || null,
        nextSteps: getKYCNextSteps(verification.kycStatus, verification.kycDocuments || [])
      }
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve KYC status'
    });
  }
});

/**
 * 📤 SUBMIT KYC DOCUMENTS
 * Submit KYC documents for verification
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      personalInfo,
      documents,
      businessInfo, // Optional for business users
      declarationAccepted
    } = req.body;

    if (!personalInfo || !documents || !declarationAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Personal information, documents, and declaration acceptance are required'
      });
    }

    // Validate required documents
    const requiredDocs = ['identity', 'address'];
    const providedDocs = Object.keys(documents);
    const missingDocs = requiredDocs.filter(doc => !providedDocs.includes(doc));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required documents: ${missingDocs.join(', ')}`
      });
    }

    // Get current user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Prepare KYC submission data
    const kycData = {
      personalInfo: {
        fullName: personalInfo.fullName,
        dateOfBirth: new Date(personalInfo.dateOfBirth),
        nationality: personalInfo.nationality,
        address: {
          street: personalInfo.address.street,
          city: personalInfo.address.city,
          state: personalInfo.address.state,
          country: personalInfo.address.country,
          postalCode: personalInfo.address.postalCode
        },
        phoneNumber: personalInfo.phoneNumber,
        occupation: personalInfo.occupation,
        sourceOfFunds: personalInfo.sourceOfFunds
      },
      documents: {},
      businessInfo: businessInfo || null,
      submission: {
        submittedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        declarationAccepted: declarationAccepted
      },
      verification: {
        status: 'pending_review',
        level: 'basic',
        reviewStartedAt: null,
        reviewedAt: null,
        reviewedBy: null,
        automated: false,
        riskScore: null
      }
    };

    // Process and validate document URLs
    for (const [docType, docData] of Object.entries(documents)) {
      if (!docData.url || !docData.fileName || !docData.fileType) {
        return res.status(400).json({
          success: false,
          error: `Invalid document data for ${docType}`
        });
      }

      kycData.documents[docType] = {
        url: docData.url,
        fileName: docData.fileName,
        fileType: docData.fileType,
        fileSize: docData.fileSize,
        uploadedAt: new Date(),
        verified: false
      };
    }

    // Update user record
    await db.collection('users').doc(userId).update({
      'verification.kycStatus': 'pending_review',
      'verification.kycLevel': 'basic',
      'verification.kycSubmittedAt': new Date(),
      'verification.kycDocuments': Object.keys(documents),
      'metadata.updatedAt': new Date()
    });

    // Save KYC submission
    const kycRef = await db.collection('kycSubmissions').add({
      userId: userId,
      userType: userData.userType,
      ...kycData
    });

    // Create notification for user
    await db.collection('notifications').add({
      userId: userId,
      type: 'kyc',
      title: 'KYC Documents Submitted',
      message: 'Your KYC documents have been submitted successfully and are under review. We will notify you once the review is complete.',
      data: { kycSubmissionId: kycRef.id },
      channels: { email: true, push: true },
      priority: 'normal',
      createdAt: new Date(),
      read: false
    });

    // Log KYC submission
    await db.collection('activityLogs').add({
      userId: userId,
      action: 'kyc_submitted',
      resource: { type: 'kyc', id: kycRef.id },
      details: { 
        documentTypes: Object.keys(documents),
        level: 'basic'
      },
      timestamp: new Date()
    });

    // Start automated verification process
    try {
      await initiateAutomatedVerification(kycRef.id, kycData);
    } catch (verificationError) {
      console.error('Automated verification error:', verificationError);
      // Continue even if automated verification fails
    }

    res.json({
      success: true,
      message: 'KYC documents submitted successfully',
      submission: {
        id: kycRef.id,
        status: 'pending_review',
        submittedAt: new Date(),
        estimatedReviewTime: '1-3 business days'
      }
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit KYC documents'
    });
  }
});

/**
 * 📁 UPLOAD KYC DOCUMENT
 * Upload a single KYC document
 */
router.post('/upload-document', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      documentType, 
      fileName, 
      fileType, 
      fileSize, 
      base64Data 
    } = req.body;

    if (!documentType || !fileName || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Document type, file name, and file data are required'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed'
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB'
      });
    }

    // Generate secure file path
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const secureFileName = `${userId}_${documentType}_${timestamp}.${extension}`;
    const filePath = `kyc-documents/${userId}/${secureFileName}`;

    try {
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Upload to Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: fileType,
          metadata: {
            userId: userId,
            documentType: documentType,
            originalFileName: fileName,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file accessible (with signed URL for security)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log document upload
      await db.collection('documentUploads').add({
        userId: userId,
        documentType: documentType,
        fileName: secureFileName,
        originalFileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        filePath: filePath,
        url: url,
        uploadedAt: new Date(),
        status: 'uploaded'
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          type: documentType,
          fileName: secureFileName,
          url: url,
          uploadedAt: new Date()
        }
      });

    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document'
      });
    }

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
});

/**
 * 📋 GET KYC SUBMISSION
 * Get detailed KYC submission information
 */
router.get('/submission/:submissionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { submissionId } = req.params;

    const submissionDoc = await db.collection('kycSubmissions').doc(submissionId).get();

    if (!submissionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'KYC submission not found'
      });
    }

    const submission = submissionDoc.data();

    // Verify ownership
    if (submission.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      submission: {
        id: submissionDoc.id,
        ...submission
      }
    });

  } catch (error) {
    console.error('Get KYC submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve KYC submission'
    });
  }
});

/**
 * 🔄 RESUBMIT KYC
 * Resubmit KYC after rejection
 */
router.post('/resubmit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Check current KYC status
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData.verification?.kycStatus !== 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Can only resubmit rejected KYC applications'
      });
    }

    // Reset KYC status to allow resubmission
    await db.collection('users').doc(userId).update({
      'verification.kycStatus': 'pending',
      'verification.kycRejectionReason': null,
      'metadata.updatedAt': new Date()
    });

    res.json({
      success: true,
      message: 'KYC status reset. You can now submit new documents.',
      status: 'pending'
    });

  } catch (error) {
    console.error('KYC resubmit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset KYC status'
    });
  }
});

// Helper function to get next steps based on KYC status
function getKYCNextSteps(status, documents) {
  switch (status) {
    case 'pending':
      return [
        'Complete your personal information',
        'Upload a valid government-issued ID',
        'Upload proof of address (utility bill, bank statement)',
        'Take a clear selfie for identity verification'
      ];
    
    case 'pending_review':
      return [
        'Your documents are under review',
        'We will notify you within 1-3 business days',
        'Ensure your phone and email are accessible'
      ];
    
    case 'verified':
      return [
        'Your identity has been verified',
        'You can now make investments up to your tier limit',
        'Consider upgrading to a higher verification tier for increased limits'
      ];
    
    case 'rejected':
      return [
        'Please review the rejection reason',
        'Prepare better quality documents',
        'Resubmit your KYC application'
      ];
    
    default:
      return ['Complete your KYC verification to start investing'];
  }
}

// Helper function to initiate automated verification
async function initiateAutomatedVerification(submissionId, kycData) {
  try {
    // This would integrate with a KYC verification service like Jumio, Onfido, etc.
    // For now, we'll simulate automated checks
    
    const verificationResults = {
      documentQuality: 'high',
      faceMatch: 'high_confidence',
      documentAuthenticity: 'authentic',
      riskScore: 'low',
      automatedDecision: 'approve' // or 'review', 'reject'
    };

    // Update submission with automated results
    await db.collection('kycSubmissions').doc(submissionId).update({
      'verification.automated': true,
      'verification.automatedResults': verificationResults,
      'verification.riskScore': verificationResults.riskScore,
      'verification.reviewStartedAt': new Date()
    });

    // If automated approval, update user status
    if (verificationResults.automatedDecision === 'approve') {
      await db.collection('users').doc(kycData.userId).update({
        'verification.kycStatus': 'verified',
        'verification.kycVerifiedAt': new Date(),
        'verification.kycLevel': 'standard'
      });

      // Send approval notification
      await db.collection('notifications').add({
        userId: kycData.userId,
        type: 'kyc',
        title: 'KYC Verification Approved',
        message: 'Congratulations! Your identity has been verified. You can now start investing on Bvester.',
        channels: { email: true, push: true },
        priority: 'high',
        createdAt: new Date(),
        read: false
      });
    }

  } catch (error) {
    console.error('Automated verification error:', error);
    throw error;
  }
}

module.exports = router;