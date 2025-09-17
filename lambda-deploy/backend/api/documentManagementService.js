/**
 * BVESTER PLATFORM - ADVANCED DOCUMENT MANAGEMENT SERVICE
 * Secure document storage, sharing, and collaboration for investment processes
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const crypto = require('crypto');

class DocumentManagementService {
  constructor() {
    // Document types and categories
    this.documentTypes = {
      'business_plan': {
        category: 'business',
        maxSize: '50MB',
        allowedFormats: ['pdf', 'docx', 'pptx'],
        confidentialityLevel: 'high',
        requiredApproval: true,
        viewerPermissions: ['business_owner', 'potential_investor']
      },
      'financial_statements': {
        category: 'financial',
        maxSize: '25MB',
        allowedFormats: ['pdf', 'xlsx', 'csv'],
        confidentialityLevel: 'high',
        requiredApproval: true,
        viewerPermissions: ['business_owner', 'verified_investor', 'financial_analyst']
      },
      'legal_documents': {
        category: 'legal',
        maxSize: '20MB',
        allowedFormats: ['pdf'],
        confidentialityLevel: 'critical',
        requiredApproval: true,
        viewerPermissions: ['business_owner', 'legal_counsel', 'due_diligence_team']
      },
      'pitch_deck': {
        category: 'marketing',
        maxSize: '30MB',
        allowedFormats: ['pdf', 'pptx', 'key'],
        confidentialityLevel: 'medium',
        requiredApproval: false,
        viewerPermissions: ['business_owner', 'potential_investor', 'public']
      },
      'due_diligence_reports': {
        category: 'analysis',
        maxSize: '100MB',
        allowedFormats: ['pdf', 'docx', 'xlsx'],
        confidentialityLevel: 'high',
        requiredApproval: true,
        viewerPermissions: ['business_owner', 'investor', 'due_diligence_team']
      },
      'compliance_certificates': {
        category: 'compliance',
        maxSize: '15MB',
        allowedFormats: ['pdf', 'jpg', 'png'],
        confidentialityLevel: 'medium',
        requiredApproval: false,
        viewerPermissions: ['business_owner', 'investor', 'regulator']
      },
      'esg_reports': {
        category: 'sustainability',
        maxSize: '40MB',
        allowedFormats: ['pdf', 'docx', 'xlsx'],
        confidentialityLevel: 'medium',
        requiredApproval: false,
        viewerPermissions: ['business_owner', 'investor', 'esg_analyst', 'public']
      },
      'investment_agreements': {
        category: 'legal',
        maxSize: '10MB',
        allowedFormats: ['pdf'],
        confidentialityLevel: 'critical',
        requiredApproval: true,
        viewerPermissions: ['business_owner', 'investor', 'legal_counsel']
      }
    };
    
    // Security levels and access controls
    this.securityLevels = {
      'public': {
        encryption: false,
        watermark: false,
        downloadable: true,
        printable: true,
        viewTimeLimit: null
      },
      'medium': {
        encryption: true,
        watermark: true,
        downloadable: true,
        printable: true,
        viewTimeLimit: 7200 // 2 hours
      },
      'high': {
        encryption: true,
        watermark: true,
        downloadable: false,
        printable: false,
        viewTimeLimit: 3600 // 1 hour
      },
      'critical': {
        encryption: true,
        watermark: true,
        downloadable: false,
        printable: false,
        viewTimeLimit: 1800, // 30 minutes
        requiresApproval: true,
        auditTrail: true
      }
    };
    
    // Version control settings
    this.versionSettings = {
      maxVersions: 10,
      autoVersioning: true,
      versionNaming: 'v{major}.{minor}.{patch}',
      changeTrackingEnabled: true
    };
    
    // Collaboration features
    this.collaborationFeatures = {
      'commenting': {
        enabled: true,
        allowAnonymous: false,
        moderationRequired: true,
        notificationSettings: ['real_time', 'email_digest']
      },
      'annotation': {
        enabled: true,
        types: ['highlight', 'note', 'stamp', 'signature'],
        persistAcrossVersions: true
      },
      'review_workflow': {
        enabled: true,
        stages: ['draft', 'review', 'approved', 'published'],
        approvalRequired: true,
        parallelReview: true
      },
      'co_editing': {
        enabled: false, // For future implementation
        conflictResolution: 'last_writer_wins',
        realTimeSync: true
      }
    };
  }
  
  // ============================================================================
  // DOCUMENT UPLOAD AND STORAGE
  // ============================================================================
  
  /**
   * Upload document with security and validation
   */
  async uploadDocument(userId, documentData, fileMetadata) {
    try {
      console.log(`📄 Uploading document for user: ${userId}`);
      
      // Validate user permissions
      const permissionCheck = await this.validateUploadPermissions(userId, documentData.type);
      if (!permissionCheck.allowed) {
        return { success: false, error: permissionCheck.reason };
      }
      
      // Validate document type and format
      const validationResult = this.validateDocumentFormat(documentData.type, fileMetadata);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }
      
      // Security scanning
      const securityScan = await this.performSecurityScan(fileMetadata);
      if (!securityScan.safe) {
        return { success: false, error: 'Document failed security scan' };
      }
      
      // Generate document metadata
      const documentId = this.generateDocumentId();
      const securityLevel = this.documentTypes[documentData.type].confidentialityLevel;
      
      const document = {
        documentId: documentId,
        type: documentData.type,
        category: this.documentTypes[documentData.type].category,
        title: documentData.title,
        description: documentData.description || '',
        
        // File information
        fileName: fileMetadata.originalName,
        fileSize: fileMetadata.size,
        fileFormat: fileMetadata.format,
        mimeType: fileMetadata.mimeType,
        
        // Security and access
        securityLevel: securityLevel,
        encryptionEnabled: this.securityLevels[securityLevel].encryption,
        accessControlList: this.initializeACL(userId, documentData.type),
        
        // Business context
        businessId: documentData.businessId || null,
        opportunityId: documentData.opportunityId || null,
        investmentId: documentData.investmentId || null,
        projectId: documentData.projectId || null,
        
        // Version control
        version: {
          major: 1,
          minor: 0,
          patch: 0,
          versionString: 'v1.0.0',
          isLatest: true
        },
        
        // Document lifecycle
        status: 'uploaded',
        workflowStage: 'draft',
        approvalStatus: 'pending',
        
        // Metadata
        uploadedBy: userId,
        uploadedAt: new Date(),
        lastModified: new Date(),
        tags: documentData.tags || [],
        customFields: documentData.customFields || {},
        
        // Analytics
        analytics: {
          viewCount: 0,
          downloadCount: 0,
          shareCount: 0,
          lastViewed: null,
          viewersList: [],
          accessHistory: []
        },
        
        // Storage information
        storage: {
          provider: 'firebase_storage',
          bucket: process.env.FIREBASE_STORAGE_BUCKET,
          path: this.generateStoragePath(userId, documentId, documentData.type),
          encryptionKey: this.securityLevels[securityLevel].encryption ? 
            this.generateEncryptionKey() : null
        }
      };
      
      // Store document metadata
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('documents')
        .add(document);
      
      // If encryption is required, process file
      if (document.encryptionEnabled) {
        await this.encryptAndStoreFile(fileMetadata, document.storage);
      } else {
        await this.storeFile(fileMetadata, document.storage);
      }
      
      // Create initial access log entry
      await this.logDocumentAccess(documentId, userId, 'upload', {
        fileSize: fileMetadata.size,
        securityLevel: securityLevel
      });
      
      // Update user's document statistics
      await this.updateUserDocumentStats(userId, 'upload');
      
      // Send notifications if required
      if (documentData.notifyStakeholders) {
        await this.notifyDocumentStakeholders(documentId, 'uploaded', userId);
      }
      
      return {
        success: true,
        documentId: documentId,
        storageInfo: {
          size: fileMetadata.size,
          format: fileMetadata.format,
          encrypted: document.encryptionEnabled
        },
        accessUrl: this.generateSecureAccessUrl(documentId),
        workflowStatus: document.workflowStage
      };
      
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get document with access control
   */
  async getDocument(documentId, userId, options = {}) {
    try {
      // Fetch document metadata
      const documentQuery = FirebaseAdmin.adminFirestore
        .collection('documents')
        .where('documentId', '==', documentId);
      
      const snapshot = await documentQuery.get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Document not found' };
      }
      
      const document = snapshot.docs[0].data();
      
      // Check access permissions
      const accessCheck = await this.checkDocumentAccess(document, userId);
      if (!accessCheck.allowed) {
        return { success: false, error: 'Access denied to document' };
      }
      
      // Log access
      await this.logDocumentAccess(documentId, userId, 'view');
      
      // Update analytics
      await this.updateDocumentAnalytics(documentId, userId, 'view');
      
      // Apply security controls
      const securedDocument = await this.applySecurityControls(document, userId, options);
      
      // Get related documents if requested
      if (options.includeRelated) {
        securedDocument.relatedDocuments = await this.getRelatedDocuments(documentId, userId);
      }
      
      // Get version history if requested
      if (options.includeVersionHistory) {
        securedDocument.versionHistory = await this.getVersionHistory(documentId, userId);
      }
      
      // Get collaboration data if requested
      if (options.includeCollaboration) {
        securedDocument.collaboration = await this.getCollaborationData(documentId, userId);
      }
      
      return {
        success: true,
        document: securedDocument,
        accessPermissions: accessCheck.permissions,
        viewingConstraints: this.getViewingConstraints(document.securityLevel, userId)
      };
      
    } catch (error) {
      console.error('Error getting document:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Share document with stakeholders
   */
  async shareDocument(documentId, userId, shareData) {
    try {
      console.log(`🔗 Sharing document ${documentId} by user ${userId}`);
      
      // Verify document exists and user has sharing permissions
      const document = await this.getDocumentMetadata(documentId);
      if (!document) {
        return { success: false, error: 'Document not found' };
      }
      
      const sharePermissionCheck = await this.checkSharingPermissions(document, userId);
      if (!sharePermissionCheck.allowed) {
        return { success: false, error: 'No permission to share this document' };
      }
      
      // Validate recipients
      const recipientValidation = await this.validateShareRecipients(shareData.recipients);
      if (!recipientValidation.valid) {
        return { success: false, error: recipientValidation.error };
      }
      
      const shareId = this.generateShareId();
      const expirationDate = shareData.expiresIn ? 
        new Date(Date.now() + shareData.expiresIn * 1000) : null;
      
      const shareRecord = {
        shareId: shareId,
        documentId: documentId,
        sharedBy: userId,
        sharedAt: new Date(),
        
        // Share configuration
        shareType: shareData.shareType || 'view_only', // view_only, download, collaborate
        expiresAt: expirationDate,
        maxViews: shareData.maxViews || null,
        passwordProtected: shareData.password ? true : false,
        
        // Recipients and permissions
        recipients: shareData.recipients.map(recipient => ({
          userId: recipient.userId || null,
          email: recipient.email,
          name: recipient.name || '',
          permissions: recipient.permissions || ['view'],
          notified: false,
          accessedAt: null
        })),
        
        // Security settings
        ipRestrictions: shareData.ipRestrictions || [],
        deviceRestrictions: shareData.deviceRestrictions || [],
        watermarkEnabled: this.securityLevels[document.securityLevel].watermark,
        downloadAllowed: shareData.allowDownload && 
          this.securityLevels[document.securityLevel].downloadable,
        
        // Analytics
        analytics: {
          viewCount: 0,
          uniqueViewers: 0,
          lastAccessed: null,
          accessLog: []
        },
        
        // Status
        status: 'active',
        revokedAt: null,
        revokedBy: null
      };
      
      // Store share record
      const shareRef = await FirebaseAdmin.adminFirestore
        .collection('documentShares')
        .add(shareRecord);
      
      // Update document sharing count
      await this.updateDocumentAnalytics(documentId, userId, 'share');
      
      // Generate secure share links
      const shareLinks = shareData.recipients.map(recipient => ({
        recipient: recipient.email,
        shareUrl: this.generateSecureShareUrl(shareId, recipient.email),
        accessCode: shareData.requireAccessCode ? this.generateAccessCode() : null
      }));
      
      // Send share notifications
      await this.sendShareNotifications(shareRecord, shareLinks, document);
      
      // Log sharing activity
      await this.logDocumentAccess(documentId, userId, 'share', {
        shareId: shareId,
        recipientCount: shareData.recipients.length,
        shareType: shareData.shareType
      });
      
      return {
        success: true,
        shareId: shareId,
        shareLinks: shareLinks,
        expiresAt: expirationDate,
        recipientCount: shareData.recipients.length
      };
      
    } catch (error) {
      console.error('Error sharing document:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // DOCUMENT COLLABORATION
  // ============================================================================
  
  /**
   * Add comment to document
   */
  async addDocumentComment(documentId, userId, commentData) {
    try {
      // Verify document access and commenting permissions
      const accessCheck = await this.checkDocumentAccess({ documentId }, userId);
      if (!accessCheck.allowed || !accessCheck.permissions.includes('comment')) {
        return { success: false, error: 'No permission to comment on this document' };
      }
      
      const commentId = this.generateCommentId();
      
      const comment = {
        commentId: commentId,
        documentId: documentId,
        userId: userId,
        
        // Comment content
        content: commentData.content,
        commentType: commentData.type || 'general', // general, suggestion, approval, concern
        annotationData: commentData.annotation || null, // page, coordinates, selection
        
        // Threading
        parentCommentId: commentData.parentCommentId || null,
        threadLevel: commentData.parentCommentId ? 
          await this.getCommentThreadLevel(commentData.parentCommentId) + 1 : 0,
        
        // Status and workflow
        status: 'active',
        resolved: false,
        resolvedBy: null,
        resolvedAt: null,
        
        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        editHistory: [],
        
        // Reactions and engagement
        reactions: {
          likes: 0,
          dislikes: 0,
          helpful: 0,
          users: []
        },
        
        // Moderation
        flagged: false,
        moderationStatus: 'approved',
        moderationNotes: null
      };
      
      // Store comment
      const commentRef = await FirebaseAdmin.adminFirestore
        .collection('documentComments')
        .add(comment);
      
      // Update document comment count
      await this.updateDocumentCommentCount(documentId, 1);
      
      // Send notifications to document stakeholders
      await this.notifyDocumentComment(documentId, userId, comment);
      
      // Log comment activity
      await this.logDocumentAccess(documentId, userId, 'comment', {
        commentId: commentId,
        commentType: commentData.type
      });
      
      return {
        success: true,
        commentId: commentId,
        timestamp: comment.createdAt
      };
      
    } catch (error) {
      console.error('Error adding document comment:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Start document review workflow
   */
  async startDocumentReview(documentId, userId, reviewConfig) {
    try {
      console.log(`📋 Starting review workflow for document: ${documentId}`);
      
      // Verify document and permissions
      const document = await this.getDocumentMetadata(documentId);
      if (!document) {
        return { success: false, error: 'Document not found' };
      }
      
      const reviewPermissionCheck = await this.checkReviewPermissions(document, userId);
      if (!reviewPermissionCheck.allowed) {
        return { success: false, error: 'No permission to initiate review' };
      }
      
      const reviewId = this.generateReviewId();
      
      const reviewWorkflow = {
        reviewId: reviewId,
        documentId: documentId,
        initiatedBy: userId,
        initiatedAt: new Date(),
        
        // Review configuration
        reviewType: reviewConfig.type || 'approval', // approval, feedback, compliance
        priority: reviewConfig.priority || 'medium',
        dueDate: reviewConfig.dueDate ? new Date(reviewConfig.dueDate) : null,
        
        // Reviewers and assignments
        reviewers: reviewConfig.reviewers.map(reviewer => ({
          userId: reviewer.userId,
          role: reviewer.role || 'reviewer',
          assignedAt: new Date(),
          status: 'pending',
          response: null,
          comments: [],
          completedAt: null
        })),
        
        // Review stages and workflow
        stages: [
          {
            stageId: 'initial_review',
            name: 'Initial Review',
            status: 'active',
            assignedReviewers: reviewConfig.reviewers.slice(0, 2).map(r => r.userId),
            startedAt: new Date(),
            completedAt: null
          }
        ],
        
        // Review criteria and checklist
        criteria: reviewConfig.criteria || this.getDefaultReviewCriteria(document.type),
        checklist: reviewConfig.checklist || [],
        
        // Overall status
        status: 'in_progress',
        currentStage: 'initial_review',
        overallDecision: null,
        completedAt: null,
        
        // Settings
        settings: {
          parallelReview: reviewConfig.parallelReview !== false,
          anonymousReview: reviewConfig.anonymousReview || false,
          requireAllApprovals: reviewConfig.requireAllApprovals || false,
          autoApproveOnConsensus: reviewConfig.autoApproveOnConsensus || true
        },
        
        // Notifications and reminders
        notifications: {
          emailReminders: reviewConfig.emailReminders !== false,
          reminderFrequency: reviewConfig.reminderFrequency || 'daily',
          escalationEnabled: reviewConfig.escalationEnabled || true,
          escalationThreshold: reviewConfig.escalationThreshold || 3 // days
        }
      };
      
      // Store review workflow
      const reviewRef = await FirebaseAdmin.adminFirestore
        .collection('documentReviews')
        .add(reviewWorkflow);
      
      // Update document status
      await this.updateDocumentWorkflowStage(documentId, 'review');
      
      // Send review assignment notifications
      await this.notifyReviewAssignment(reviewWorkflow);
      
      // Schedule reminder tasks
      await this.scheduleReviewReminders(reviewId, reviewWorkflow);
      
      // Log review initiation
      await this.logDocumentAccess(documentId, userId, 'review_started', {
        reviewId: reviewId,
        reviewerCount: reviewConfig.reviewers.length,
        reviewType: reviewConfig.type
      });
      
      return {
        success: true,
        reviewId: reviewId,
        reviewers: reviewWorkflow.reviewers.length,
        dueDate: reviewWorkflow.dueDate,
        trackingUrl: this.generateReviewTrackingUrl(reviewId)
      };
      
    } catch (error) {
      console.error('Error starting document review:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // DOCUMENT VERSION CONTROL
  // ============================================================================
  
  /**
   * Create new document version
   */
  async createDocumentVersion(documentId, userId, versionData, fileMetadata) {
    try {
      console.log(`📝 Creating new version for document: ${documentId}`);
      
      // Get current document
      const currentDocument = await this.getDocumentMetadata(documentId);
      if (!currentDocument) {
        return { success: false, error: 'Document not found' };
      }
      
      // Check versioning permissions
      const versionPermissionCheck = await this.checkVersioningPermissions(currentDocument, userId);
      if (!versionPermissionCheck.allowed) {
        return { success: false, error: 'No permission to create new version' };
      }
      
      // Validate version data
      const validationResult = this.validateVersionData(versionData, currentDocument);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }
      
      // Calculate new version number
      const newVersion = this.calculateNextVersion(
        currentDocument.version,
        versionData.changeType || 'minor'
      );
      
      // Mark current version as not latest
      await this.updateDocumentVersion(documentId, { 'version.isLatest': false });
      
      const versionId = this.generateVersionId();
      
      // Create new version record
      const newVersionData = {
        ...currentDocument,
        versionId: versionId,
        version: {
          ...newVersion,
          isLatest: true,
          parentVersion: currentDocument.version.versionString,
          createdBy: userId,
          createdAt: new Date()
        },
        
        // Version-specific metadata
        changeLog: {
          changeType: versionData.changeType || 'minor',
          description: versionData.description || '',
          changedBy: userId,
          changedAt: new Date(),
          changeDetails: versionData.changeDetails || [],
          reviewRequired: versionData.reviewRequired || false
        },
        
        // Update file information if new file provided
        ...(fileMetadata && {
          fileName: fileMetadata.originalName,
          fileSize: fileMetadata.size,
          fileFormat: fileMetadata.format,
          lastModified: new Date(),
          storage: {
            ...currentDocument.storage,
            path: this.generateStoragePath(userId, documentId, currentDocument.type, newVersion.versionString)
          }
        }),
        
        // Reset version-specific analytics
        analytics: {
          ...currentDocument.analytics,
          viewCount: 0,
          downloadCount: 0,
          shareCount: 0,
          lastViewed: null,
          versionSpecificViews: 0
        },
        
        status: versionData.status || 'uploaded',
        workflowStage: versionData.workflowStage || 'draft'
      };
      
      // Store new version
      const versionRef = await FirebaseAdmin.adminFirestore
        .collection('documents')
        .add(newVersionData);
      
      // Store file if provided
      if (fileMetadata) {
        if (newVersionData.encryptionEnabled) {
          await this.encryptAndStoreFile(fileMetadata, newVersionData.storage);
        } else {
          await this.storeFile(fileMetadata, newVersionData.storage);
        }
      }
      
      // Create version comparison data
      const comparisonData = await this.generateVersionComparison(
        currentDocument,
        newVersionData
      );
      
      // Log version creation
      await this.logDocumentAccess(documentId, userId, 'version_created', {
        versionId: versionId,
        versionString: newVersion.versionString,
        changeType: versionData.changeType
      });
      
      // Notify stakeholders of new version
      if (versionData.notifyStakeholders) {
        await this.notifyDocumentVersion(documentId, userId, newVersionData);
      }
      
      return {
        success: true,
        versionId: versionId,
        versionString: newVersion.versionString,
        comparisonUrl: this.generateVersionComparisonUrl(documentId, versionId),
        changesSummary: comparisonData.summary
      };
      
    } catch (error) {
      console.error('Error creating document version:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // SECURITY AND ACCESS CONTROL
  // ============================================================================
  
  /**
   * Validate upload permissions
   */
  async validateUploadPermissions(userId, documentType) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { allowed: false, reason: 'User not found' };
      }
      
      const user = userResult.user;
      const documentConfig = this.documentTypes[documentType];
      
      if (!documentConfig) {
        return { allowed: false, reason: 'Invalid document type' };
      }
      
      // Check user type permissions
      if (documentConfig.viewerPermissions && 
          !documentConfig.viewerPermissions.includes(user.userType)) {
        return { allowed: false, reason: 'User type not permitted for this document type' };
      }
      
      // Check subscription limits
      const subscription = user.subscription || {};
      const plan = subscription.plan || 'basic';
      
      const uploadLimits = {
        basic: { documentsPerMonth: 10, maxFileSize: '10MB' },
        professional: { documentsPerMonth: 50, maxFileSize: '50MB' },
        enterprise: { documentsPerMonth: 200, maxFileSize: '100MB' }
      };
      
      const userLimits = uploadLimits[plan];
      if (userLimits) {
        // Check monthly upload limit
        const monthlyUploads = await this.getUserMonthlyUploads(userId);
        if (monthlyUploads >= userLimits.documentsPerMonth) {
          return { allowed: false, reason: `Monthly upload limit reached (${userLimits.documentsPerMonth})` };
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error validating upload permissions:', error);
      return { allowed: false, reason: 'Permission validation failed' };
    }
  }
  
  /**
   * Check document access permissions
   */
  async checkDocumentAccess(document, userId) {
    try {
      // Public documents are accessible to everyone
      if (document.securityLevel === 'public') {
        return { 
          allowed: true, 
          permissions: ['view', 'download', 'share'] 
        };
      }
      
      // Check if user is in access control list
      const acl = document.accessControlList || [];
      const userAccess = acl.find(entry => entry.userId === userId);
      
      if (!userAccess) {
        return { allowed: false, reason: 'User not in access control list' };
      }
      
      // Check if access has expired
      if (userAccess.expiresAt && new Date() > new Date(userAccess.expiresAt)) {
        return { allowed: false, reason: 'Access has expired' };
      }
      
      // Check if access is revoked
      if (userAccess.status === 'revoked') {
        return { allowed: false, reason: 'Access has been revoked' };
      }
      
      return { 
        allowed: true, 
        permissions: userAccess.permissions || ['view'],
        accessLevel: userAccess.accessLevel || 'viewer'
      };
      
    } catch (error) {
      console.error('Error checking document access:', error);
      return { allowed: false, reason: 'Access check failed' };
    }
  }
  
  /**
   * Perform security scan on uploaded file
   */
  async performSecurityScan(fileMetadata) {
    try {
      const security = {
        safe: true,
        threats: [],
        warnings: []
      };
      
      // Check file size limits
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (fileMetadata.size > maxSize) {
        security.safe = false;
        security.threats.push('File size exceeds maximum allowed limit');
      }
      
      // Check for dangerous file extensions
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'
      ];
      
      const extension = '.' + fileMetadata.format.toLowerCase();
      if (dangerousExtensions.includes(extension)) {
        security.safe = false;
        security.threats.push('Potentially dangerous file type');
      }
      
      // Check MIME type consistency
      const expectedMimeTypes = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };
      
      const expectedMime = expectedMimeTypes[fileMetadata.format.toLowerCase()];
      if (expectedMime && fileMetadata.mimeType !== expectedMime) {
        security.warnings.push('MIME type does not match file extension');
      }
      
      // Additional security checks would be implemented here
      // Including virus scanning, content analysis, etc.
      
      return security;
      
    } catch (error) {
      console.error('Error performing security scan:', error);
      return { safe: false, threats: ['Security scan failed'] };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate unique document ID
   */
  generateDocumentId() {
    return `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Generate unique share ID
   */
  generateShareId() {
    return `share_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate unique comment ID
   */
  generateCommentId() {
    return `comment_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate unique review ID
   */
  generateReviewId() {
    return `review_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate unique version ID
   */
  generateVersionId() {
    return `version_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate secure access URL
   */
  generateSecureAccessUrl(documentId) {
    const baseUrl = process.env.DOCUMENT_BASE_URL || 'https://docs.bvester.com';
    const accessToken = this.generateAccessToken(documentId);
    return `${baseUrl}/view/${documentId}?token=${accessToken}`;
  }
  
  /**
   * Generate secure share URL
   */
  generateSecureShareUrl(shareId, email) {
    const baseUrl = process.env.DOCUMENT_BASE_URL || 'https://docs.bvester.com';
    const shareToken = this.generateShareToken(shareId, email);
    return `${baseUrl}/shared/${shareId}?token=${shareToken}`;
  }
  
  /**
   * Generate access code
   */
  generateAccessCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  
  /**
   * Initialize access control list
   */
  initializeACL(uploaderId, documentType) {
    const documentConfig = this.documentTypes[documentType];
    
    return [
      {
        userId: uploaderId,
        accessLevel: 'owner',
        permissions: ['view', 'edit', 'delete', 'share', 'comment', 'approve'],
        grantedAt: new Date(),
        grantedBy: uploaderId,
        expiresAt: null,
        status: 'active'
      }
    ];
  }
  
  /**
   * Validate document format
   */
  validateDocumentFormat(documentType, fileMetadata) {
    const documentConfig = this.documentTypes[documentType];
    
    if (!documentConfig) {
      return { valid: false, error: 'Invalid document type' };
    }
    
    // Check file format
    if (!documentConfig.allowedFormats.includes(fileMetadata.format.toLowerCase())) {
      return { 
        valid: false, 
        error: `Format not allowed. Accepted formats: ${documentConfig.allowedFormats.join(', ')}` 
      };
    }
    
    // Check file size
    const maxSizeBytes = this.parseFileSize(documentConfig.maxSize);
    if (fileMetadata.size > maxSizeBytes) {
      return { 
        valid: false, 
        error: `File size exceeds limit of ${documentConfig.maxSize}` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Parse file size string to bytes
   */
  parseFileSize(sizeString) {
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
    const match = sizeString.match(/^(\d+)(B|KB|MB|GB)$/);
    
    if (!match) return 0;
    
    return parseInt(match[1]) * units[match[2]];
  }
  
  /**
   * Generate storage path
   */
  generateStoragePath(userId, documentId, documentType, version = null) {
    const basePath = `documents/${userId}/${documentType}/${documentId}`;
    return version ? `${basePath}/versions/${version}` : basePath;
  }
  
  /**
   * Generate encryption key
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Calculate next version number
   */
  calculateNextVersion(currentVersion, changeType) {
    const { major, minor, patch } = currentVersion;
    
    switch (changeType) {
      case 'major':
        return {
          major: major + 1,
          minor: 0,
          patch: 0,
          versionString: `v${major + 1}.0.0`
        };
      case 'minor':
        return {
          major: major,
          minor: minor + 1,
          patch: 0,
          versionString: `v${major}.${minor + 1}.0`
        };
      case 'patch':
        return {
          major: major,
          minor: minor,
          patch: patch + 1,
          versionString: `v${major}.${minor}.${patch + 1}`
        };
      default:
        return currentVersion;
    }
  }
  
  /**
   * Get document management analytics
   */
  async getDocumentAnalytics(businessId = null, timeRange = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }
      
      let documentsQuery = FirebaseAdmin.adminFirestore
        .collection('documents')
        .where('uploadedAt', '>=', startDate)
        .where('uploadedAt', '<=', endDate);
      
      if (businessId) {
        documentsQuery = documentsQuery.where('businessId', '==', businessId);
      }
      
      const snapshot = await documentsQuery.get();
      
      const analytics = {
        totalDocuments: 0,
        totalStorage: 0,
        documentTypes: {},
        securityLevels: {},
        shareActivity: 0,
        reviewActivity: 0,
        collaborationMetrics: {
          totalComments: 0,
          activeReviews: 0,
          averageReviewTime: 0
        }
      };
      
      snapshot.forEach(doc => {
        const document = doc.data();
        analytics.totalDocuments++;
        analytics.totalStorage += document.fileSize || 0;
        
        // Track document types
        analytics.documentTypes[document.type] = 
          (analytics.documentTypes[document.type] || 0) + 1;
        
        // Track security levels
        analytics.securityLevels[document.securityLevel] = 
          (analytics.securityLevels[document.securityLevel] || 0) + 1;
        
        // Track sharing activity
        analytics.shareActivity += document.analytics?.shareCount || 0;
      });
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting document analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DocumentManagementService();