/**
 * KYC VERIFICATION SERVICE
 * Handles document verification, identity checks, and compliance
 * Integrates with third-party providers (Onfido, Jumio)
 */

const admin = require('firebase-admin');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const uuid = require('uuid');
const axios = require('axios');
const winston = require('winston');

const db = admin.firestore();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/kyc.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only image and PDF files
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const encryptSensitiveData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('kyc-data', 'utf8'));
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decryptSensitiveData = (encryptedData) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('kyc-data', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

// ============================================================================
// THIRD-PARTY INTEGRATIONS
// ============================================================================

class OnfidoIntegration {
  constructor() {
    this.apiKey = process.env.ONFIDO_API_KEY;
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.onfido.com/v3'
      : 'https://api.onfido.com/v3';
  }

  async createApplicant(userData) {
    try {
      const response = await axios.post(`${this.baseURL}/applicants`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        country: userData.country
      }, {
        headers: {
          'Authorization': `Token token=${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Onfido create applicant error:', error.response?.data || error.message);
      throw new Error('Failed to create applicant with verification provider');
    }
  }

  async uploadDocument(applicantId, file, documentType) {
    try {
      const formData = new FormData();
      formData.append('applicant_id', applicantId);
      formData.append('type', documentType);
      formData.append('file', file.buffer, file.originalname);

      const response = await axios.post(`${this.baseURL}/documents`, formData, {
        headers: {
          'Authorization': `Token token=${this.apiKey}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Onfido upload document error:', error.response?.data || error.message);
      throw new Error('Failed to upload document to verification provider');
    }
  }

  async createCheck(applicantId, checkType = 'express') {
    try {
      const response = await axios.post(`${this.baseURL}/checks`, {
        applicant_id: applicantId,
        report_names: ['document', 'facial_similarity_photo', 'identity_enhanced'],
        tags: ['bvester-kyc'],
        applicant_provides_data: true
      }, {
        headers: {
          'Authorization': `Token token=${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Onfido create check error:', error.response?.data || error.message);
      throw new Error('Failed to initiate verification check');
    }
  }

  async getCheckResults(checkId) {
    try {
      const response = await axios.get(`${this.baseURL}/checks/${checkId}`, {
        headers: {
          'Authorization': `Token token=${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Onfido get check results error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve verification results');
    }
  }
}

// ============================================================================
// KYC SERVICE CLASS
// ============================================================================

class KYCService {
  constructor() {
    this.onfido = new OnfidoIntegration();
  }

  // Start KYC Process
  async initiateKYC(userId, userData) {
    try {
      // Create KYC profile
      const kycProfile = {
        kycId: uuid.v4(),
        userId,
        personalInfo: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName || null,
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
          nationality: userData.nationality || userData.country,
          phoneNumber: userData.phoneNumber,
          email: userData.email,
          address: userData.address || null
        },
        verificationLevel: {
          current: 'pending',
          basicVerified: false,
          enhancedVerified: false,
          premiumVerified: false,
          lastUpgraded: null
        },
        documents: [],
        riskProfile: {
          riskLevel: 'pending',
          pepStatus: false,
          sanctionsMatch: false,
          adverseMediaHits: 0,
          lastScreened: null,
          nextScreeningDue: null
        },
        investorClassification: {
          isAccredited: false,
          accreditationType: null,
          accreditationEvidence: null,
          accreditedUntil: null,
          investmentLimits: {
            annual: 10000, // Default limits for non-accredited
            perInvestment: 2000,
            totalPortfolio: 25000
          }
        },
        compliance: {
          cddCompleted: false,
          eddRequired: false,
          sourceOfFunds: null,
          sourceOfWealth: null,
          expectedTransactionVolume: userData.expectedVolume || 'low',
          businessRelationshipPurpose: userData.purpose || 'investment'
        },
        status: {
          overall: 'initiated',
          canInvest: false,
          canReceiveFunds: false,
          canWithdraw: false,
          restrictions: [],
          statusHistory: [{
            status: 'initiated',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'KYC process started',
            changedBy: 'system'
          }],
          lastReviewed: null,
          nextReviewDue: null
        },
        thirdPartyData: {
          onfidoApplicantId: null,
          onfidoCheckId: null
        },
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: null,
          assignedReviewer: null,
          internalNotes: null
        }
      };

      // Create Onfido applicant
      if (process.env.ONFIDO_API_KEY) {
        try {
          const onfidoApplicant = await this.onfido.createApplicant(userData);
          kycProfile.thirdPartyData.onfidoApplicantId = onfidoApplicant.id;
        } catch (error) {
          logger.warn('Failed to create Onfido applicant, continuing with manual verification:', error.message);
        }
      }

      // Save KYC profile
      await db.collection('kycProfiles').doc(userId).set(kycProfile);

      // Update user record
      await db.collection('users').doc(userId).update({
        'kyc.kycId': kycProfile.kycId,
        'kyc.status': 'initiated',
        'kyc.submittedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`KYC initiated for user: ${userId}`);

      return {
        success: true,
        kycId: kycProfile.kycId,
        status: 'initiated',
        onfidoApplicantId: kycProfile.thirdPartyData.onfidoApplicantId,
        nextSteps: [
          'Upload identity document (passport, national ID, or driver\'s license)',
          'Upload proof of address (utility bill or bank statement)',
          'Take a selfie for facial verification',
          'Complete additional information if required'
        ]
      };

    } catch (error) {
      logger.error('KYC initiation error:', error);
      throw new Error('Failed to initiate KYC process');
    }
  }

  // Upload KYC Documents
  async uploadDocument(userId, file, documentType, documentSide = 'front') {
    try {
      // Get KYC profile
      const kycDoc = await db.collection('kycProfiles').doc(userId).get();
      if (!kycDoc.exists) {
        throw new Error('KYC profile not found. Please initiate KYC first.');
      }

      const kycData = kycDoc.data();

      // Process and optimize image
      let processedBuffer = file.buffer;
      if (file.mimetype.startsWith('image/')) {
        processedBuffer = await sharp(file.buffer)
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      // Generate secure filename
      const fileExtension = file.originalname.split('.').pop();
      const secureFilename = `${userId}_${documentType}_${documentSide}_${Date.now()}.${fileExtension}`;

      // Upload to Firebase Storage (or your preferred storage)
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(`kyc-documents/${secureFilename}`);
      
      await fileRef.save(processedBuffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            userId,
            documentType,
            documentSide,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      const downloadURL = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2025' // Long expiry for KYC documents
      });

      // Create document record
      const documentRecord = {
        documentId: uuid.v4(),
        userId,
        documentInfo: {
          type: documentType,
          category: this.getDocumentCategory(documentType),
          country: kycData.personalInfo.nationality,
          documentNumber: null, // Will be extracted by OCR
          expiryDate: null,
          issueDate: null
        },
        files: {
          frontImage: documentSide === 'front' ? downloadURL[0] : null,
          backImage: documentSide === 'back' ? downloadURL[0] : null,
          selfieImage: documentType === 'selfie' ? downloadURL[0] : null,
          originalFileName: file.originalname,
          fileSize: processedBuffer.length,
          mimeType: file.mimetype,
          secureFilename
        },
        verification: {
          status: 'pending',
          provider: 'onfido',
          providerDocumentId: null,
          checks: {
            documentAuthenticity: { status: 'pending', score: 0, details: {} },
            faceMatch: { status: 'pending', score: 0, details: {} },
            dataExtraction: { extractedData: {}, confidence: 0 }
          },
          overallScore: 0,
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null
        },
        compliance: {
          sanctionsCheck: false,
          pepCheck: false,
          adverseMediaCheck: false,
          watchlistCheck: false
        },
        metadata: {
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          processedAt: null,
          expiresAt: null,
          ipAddress: null,
          userAgent: null
        }
      };

      // Save document record
      await db.collection('kycDocuments').add(documentRecord);

      // Upload to Onfido if available
      if (kycData.thirdPartyData.onfidoApplicantId && process.env.ONFIDO_API_KEY) {
        try {
          const onfidoDocument = await this.onfido.uploadDocument(
            kycData.thirdPartyData.onfidoApplicantId,
            { buffer: processedBuffer, originalname: file.originalname },
            this.mapDocumentTypeToOnfido(documentType)
          );
          
          documentRecord.verification.providerDocumentId = onfidoDocument.id;
          
          // Update document with Onfido ID
          const docQuery = await db.collection('kycDocuments')
            .where('documentId', '==', documentRecord.documentId)
            .limit(1)
            .get();
          
          if (!docQuery.empty) {
            await docQuery.docs[0].ref.update({
              'verification.providerDocumentId': onfidoDocument.id
            });
          }
        } catch (error) {
          logger.warn('Failed to upload to Onfido:', error.message);
        }
      }

      // Update KYC profile with document reference
      await db.collection('kycProfiles').doc(userId).update({
        documents: admin.firestore.FieldValue.arrayUnion(documentRecord.documentId),
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`Document uploaded for user ${userId}: ${documentType}`);

      return {
        success: true,
        documentId: documentRecord.documentId,
        status: 'uploaded',
        message: 'Document uploaded successfully and sent for verification'
      };

    } catch (error) {
      logger.error('Document upload error:', error);
      throw new Error('Failed to upload document');
    }
  }

  // Submit KYC for Review
  async submitForReview(userId) {
    try {
      const kycDoc = await db.collection('kycProfiles').doc(userId).get();
      if (!kycDoc.exists) {
        throw new Error('KYC profile not found');
      }

      const kycData = kycDoc.data();

      // Validate required documents
      const requiredDocuments = ['identity', 'address'];
      const uploadedCategories = [];

      for (const docId of kycData.documents) {
        const docRef = await db.collection('kycDocuments').doc(docId).get();
        if (docRef.exists) {
          const docData = docRef.data();
          uploadedCategories.push(docData.documentInfo.category);
        }
      }

      const missingDocuments = requiredDocuments.filter(req => !uploadedCategories.includes(req));
      
      if (missingDocuments.length > 0) {
        return {
          success: false,
          error: 'Missing required documents',
          missingDocuments,
          message: 'Please upload all required documents before submitting for review'
        };
      }

      // Create Onfido check if available
      if (kycData.thirdPartyData.onfidoApplicantId && process.env.ONFIDO_API_KEY) {
        try {
          const onfidoCheck = await this.onfido.createCheck(kycData.thirdPartyData.onfidoApplicantId);
          
          await db.collection('kycProfiles').doc(userId).update({
            'thirdPartyData.onfidoCheckId': onfidoCheck.id,
            'status.overall': 'under_review',
            'status.statusHistory': admin.firestore.FieldValue.arrayUnion({
              status: 'under_review',
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              reason: 'Submitted for automated verification',
              changedBy: 'system'
            }),
            'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
          });

          // Schedule check result retrieval (in production, use webhooks)
          setTimeout(() => this.checkOnfidoResults(userId, onfidoCheck.id), 30000);

        } catch (error) {
          logger.warn('Failed to create Onfido check:', error.message);
          // Fall back to manual review
          await this.submitForManualReview(userId);
        }
      } else {
        // Submit for manual review
        await this.submitForManualReview(userId);
      }

      // Update user record
      await db.collection('users').doc(userId).update({
        'kyc.status': 'under_review',
        'kyc.submittedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        status: 'under_review',
        message: 'KYC submitted for review. You will be notified of the result within 24-48 hours.',
        estimatedReviewTime: '24-48 hours'
      };

    } catch (error) {
      logger.error('KYC submission error:', error);
      throw new Error('Failed to submit KYC for review');
    }
  }

  // Helper Methods
  getDocumentCategory(documentType) {
    const categoryMap = {
      'passport': 'identity',
      'national_id': 'identity',
      'drivers_license': 'identity',
      'utility_bill': 'address',
      'bank_statement': 'address',
      'selfie': 'identity'
    };
    return categoryMap[documentType] || 'other';
  }

  mapDocumentTypeToOnfido(documentType) {
    const onfidoMap = {
      'passport': 'passport',
      'national_id': 'national_identity_card',
      'drivers_license': 'driving_licence',
      'utility_bill': 'utility_bill',
      'bank_statement': 'bank_building_society_statement'
    };
    return onfidoMap[documentType] || 'unknown';
  }

  async submitForManualReview(userId) {
    await db.collection('kycProfiles').doc(userId).update({
      'status.overall': 'manual_review',
      'status.statusHistory': admin.firestore.FieldValue.arrayUnion({
        status: 'manual_review',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'Submitted for manual review',
        changedBy: 'system'
      }),
      'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      'metadata.assignedReviewer': 'pending'
    });
  }

  async checkOnfidoResults(userId, checkId) {
    try {
      const results = await this.onfido.getCheckResults(checkId);
      
      if (results.status === 'complete') {
        await this.processVerificationResults(userId, results);
      } else if (results.status === 'in_progress') {
        // Check again later
        setTimeout(() => this.checkOnfidoResults(userId, checkId), 60000);
      }
    } catch (error) {
      logger.error('Failed to check Onfido results:', error);
    }
  }

  async processVerificationResults(userId, results) {
    try {
      const overallResult = results.result;
      const isVerified = overallResult === 'clear';
      const verificationLevel = isVerified ? 'basic' : 'rejected';

      // Update KYC profile
      const updateData = {
        'verificationLevel.current': verificationLevel,
        'verificationLevel.basicVerified': isVerified,
        'status.overall': isVerified ? 'verified' : 'rejected',
        'status.canInvest': isVerified,
        'status.canReceiveFunds': isVerified,
        'status.canWithdraw': isVerified,
        'status.statusHistory': admin.firestore.FieldValue.arrayUnion({
          status: isVerified ? 'verified' : 'rejected',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: isVerified ? 'Automated verification passed' : 'Verification failed',
          changedBy: 'onfido'
        }),
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.completedAt': isVerified ? admin.firestore.FieldValue.serverTimestamp() : null
      };

      await db.collection('kycProfiles').doc(userId).update(updateData);

      // Update user record
      await db.collection('users').doc(userId).update({
        'kyc.verified': isVerified,
        'kyc.level': verificationLevel,
        'kyc.verifiedAt': isVerified ? admin.firestore.FieldValue.serverTimestamp() : null,
        'kyc.status': isVerified ? 'verified' : 'rejected'
      });

      logger.info(`KYC verification completed for user ${userId}: ${isVerified ? 'APPROVED' : 'REJECTED'}`);

      // TODO: Send notification to user
      
    } catch (error) {
      logger.error('Failed to process verification results:', error);
    }
  }
}

module.exports = {
  KYCService,
  upload,
  encryptSensitiveData,
  decryptSensitiveData
};