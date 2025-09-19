// Document Management & Due Diligence Service for BizInvest Hub
// Handles secure document sharing between businesses and investors

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
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export class DocumentService {
  // Document upload metadata (actual files would be stored in Firebase Storage)
  static async uploadDocument(userId, documentData) {
    try {
      console.log('Uploading document metadata:', documentData);
      
      const document = {
        ...documentData,
        uploaderId: userId,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'uploaded', // uploaded, verified, rejected
        downloadCount: 0,
        accessLog: [],
        
        // Security settings
        encrypted: true,
        accessLevel: documentData.accessLevel || 'private', // private, restricted, public
        allowedViewers: documentData.allowedViewers || [],
        
        // Mock file data (in production, this would come from Firebase Storage)
        mockFile: true,
        fileUrl: `https://mock-storage.bizinvest.com/documents/${Date.now()}_${documentData.fileName}`,
        securityNotice: 'This is a mock document system for demonstration purposes only.'
      };
      
      const docRef = await addDoc(collection(db, 'documents'), document);
      console.log('Document metadata uploaded with ID:', docRef.id);
      
      return { id: docRef.id, ...document };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Create document sharing request
  static async shareDocumentWithInvestor(documentId, investorId, businessOwnerId, permissions = {}) {
    try {
      console.log('Sharing document with investor:', { documentId, investorId });
      
      const shareRequest = {
        documentId,
        investorId,
        businessOwnerId,
        permissions: {
          canView: permissions.canView !== false,
          canDownload: permissions.canDownload === true,
          canComment: permissions.canComment === true,
          expiresAt: permissions.expiresAt || null,
          ...permissions
        },
        status: 'pending', // pending, approved, denied, expired
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        accessHistory: []
      };
      
      const shareRef = await addDoc(collection(db, 'documentShares'), shareRequest);
      
      // Update document with new allowed viewer
      const documentRef = doc(db, 'documents', documentId);
      await updateDoc(documentRef, {
        allowedViewers: arrayUnion(investorId),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to investor
      const { NotificationService } = await import('./NotificationService');
      await NotificationService.createNotification({
        userId: investorId,
        type: 'document_shared',
        title: '📄 Documents Available for Review',
        message: 'A business has shared due diligence documents with you for review',
        data: {
          documentId,
          businessOwnerId,
          shareId: shareRef.id,
          actionType: 'document_shared'
        },
        priority: 'medium',
        category: 'documents'
      });
      
      return { id: shareRef.id, ...shareRequest };
    } catch (error) {
      console.error('Error sharing document:', error);
      throw error;
    }
  }

  // Get documents accessible to user
  static async getUserDocuments(userId, options = {}) {
    try {
      let documents = [];
      
      // Get documents uploaded by user
      const uploadedQuery = query(
        collection(db, 'documents'),
        where('uploaderId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const uploadedSnapshot = await getDocs(uploadedQuery);
      uploadedSnapshot.forEach((doc) => {
        documents.push({ 
          id: doc.id, 
          ...doc.data(), 
          accessType: 'owner' 
        });
      });
      
      // Get documents shared with user
      const sharedQuery = query(
        collection(db, 'documentShares'),
        where('investorId', '==', userId),
        where('status', '==', 'approved')
      );
      
      const sharedSnapshot = await getDocs(sharedQuery);
      const sharedDocPromises = sharedSnapshot.docs.map(async (shareDoc) => {
        const shareData = shareDoc.data();
        const documentRef = doc(db, 'documents', shareData.documentId);
        const documentSnap = await getDoc(documentRef);
        
        if (documentSnap.exists()) {
          return { 
            id: documentSnap.id, 
            ...documentSnap.data(), 
            accessType: 'shared',
            sharePermissions: shareData.permissions,
            shareId: shareDoc.id
          };
        }
        return null;
      });
      
      const sharedDocuments = (await Promise.all(sharedDocPromises)).filter(Boolean);
      documents = [...documents, ...sharedDocuments];
      
      // Apply filters
      if (options.businessId) {
        documents = documents.filter(doc => doc.businessId === options.businessId);
      }
      
      if (options.category) {
        documents = documents.filter(doc => doc.category === options.category);
      }
      
      // Sort by upload date
      documents.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        return dateB - dateA;
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  // Get document details with access control
  static async getDocument(documentId, userId) {
    try {
      const documentRef = doc(db, 'documents', documentId);
      const documentSnap = await getDoc(documentRef);
      
      if (!documentSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const document = { id: documentSnap.id, ...documentSnap.data() };
      
      // Check access permissions
      const hasAccess = this.checkDocumentAccess(document, userId);
      if (!hasAccess) {
        throw new Error('Access denied to this document');
      }
      
      // Log access (for audit trail)
      await this.logDocumentAccess(documentId, userId, 'view');
      
      return document;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Check if user has access to document
  static checkDocumentAccess(document, userId) {
    // Owner always has access
    if (document.uploaderId === userId) {
      return true;
    }
    
    // Check if user is in allowed viewers
    if (document.allowedViewers && document.allowedViewers.includes(userId)) {
      return true;
    }
    
    // Public documents are accessible to everyone
    if (document.accessLevel === 'public') {
      return true;
    }
    
    return false;
  }

  // Log document access for audit trail
  static async logDocumentAccess(documentId, userId, action) {
    try {
      const accessLog = {
        documentId,
        userId,
        action, // view, download, comment
        timestamp: serverTimestamp(),
        ipAddress: 'mock-ip', // In production, get real IP
        userAgent: 'mock-agent' // In production, get real user agent
      };
      
      await addDoc(collection(db, 'documentAccessLogs'), accessLog);
      
      // Update document's access count
      const documentRef = doc(db, 'documents', documentId);
      if (action === 'view') {
        await updateDoc(documentRef, {
          downloadCount: arrayUnion(userId), // Track unique viewers
          lastAccessedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error logging document access:', error);
    }
  }

  // Create due diligence package
  static async createDueDiligencePackage(businessId, ownerId, packageData) {
    try {
      console.log('Creating due diligence package:', packageData);
      
      const ddPackage = {
        ...packageData,
        businessId,
        ownerId,
        packageType: 'due_diligence',
        status: 'draft', // draft, published, archived
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Standard due diligence categories
        categories: [
          'financial_statements',
          'business_plan',
          'legal_documents',
          'compliance_certificates',
          'operational_reports',
          'market_analysis',
          'team_information',
          'intellectual_property'
        ],
        
        // Access control
        accessRequests: [],
        approvedInvestors: [],
        viewerAnalytics: {
          totalViews: 0,
          uniqueViewers: 0,
          averageTimeSpent: 0
        }
      };
      
      const packageRef = await addDoc(collection(db, 'dueDiligencePackages'), ddPackage);
      console.log('Due diligence package created with ID:', packageRef.id);
      
      return { id: packageRef.id, ...ddPackage };
    } catch (error) {
      console.error('Error creating due diligence package:', error);
      throw error;
    }
  }

  // Request access to due diligence documents
  static async requestDocumentAccess(investorId, businessId, packageId, requestMessage = '') {
    try {
      console.log('Requesting document access:', { investorId, businessId, packageId });
      
      const accessRequest = {
        investorId,
        businessId,
        packageId,
        requestMessage,
        status: 'pending', // pending, approved, denied
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Investor verification info
        investorProfile: {}, // Would include verified investor details
        investmentCapacity: 0,
        investmentHistory: []
      };
      
      const requestRef = await addDoc(collection(db, 'documentAccessRequests'), accessRequest);
      
      // Notify business owner
      const { NotificationService } = await import('./NotificationService');
      await NotificationService.createNotification({
        userId: businessId, // Assuming businessId is the owner's ID
        type: 'document_access_request',
        title: '📋 Document Access Request',
        message: 'An investor has requested access to your due diligence documents',
        data: {
          investorId,
          requestId: requestRef.id,
          packageId,
          actionType: 'document_access_request'
        },
        priority: 'high',
        category: 'documents'
      });
      
      return { id: requestRef.id, ...accessRequest };
    } catch (error) {
      console.error('Error requesting document access:', error);
      throw error;
    }
  }

  // Approve/deny document access request
  static async processAccessRequest(requestId, businessOwnerId, decision, responseMessage = '') {
    try {
      console.log('Processing access request:', { requestId, decision });
      
      const requestRef = doc(db, 'documentAccessRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Access request not found');
      }
      
      const requestData = requestSnap.data();
      
      // Update request status
      await updateDoc(requestRef, {
        status: decision, // approved or denied
        processedAt: serverTimestamp(),
        processedBy: businessOwnerId,
        responseMessage,
        updatedAt: serverTimestamp()
      });
      
      if (decision === 'approved') {
        // Grant access to documents
        const packageRef = doc(db, 'dueDiligencePackages', requestData.packageId);
        await updateDoc(packageRef, {
          approvedInvestors: arrayUnion(requestData.investorId),
          updatedAt: serverTimestamp()
        });
        
        // Share individual documents
        await this.sharePackageDocuments(requestData.packageId, requestData.investorId);
      }
      
      // Notify investor of decision
      const { NotificationService } = await import('./NotificationService');
      await NotificationService.createNotification({
        userId: requestData.investorId,
        type: decision === 'approved' ? 'document_access_granted' : 'document_access_denied',
        title: decision === 'approved' ? '✅ Document Access Granted' : '❌ Document Access Denied',
        message: decision === 'approved' ? 
          'Your request for due diligence documents has been approved' :
          'Your request for due diligence documents has been denied',
        data: {
          requestId,
          businessId: requestData.businessId,
          packageId: requestData.packageId,
          responseMessage,
          actionType: `document_access_${decision}`
        },
        priority: 'high',
        category: 'documents'
      });
      
      return { requestId, decision, processedAt: new Date() };
    } catch (error) {
      console.error('Error processing access request:', error);
      throw error;
    }
  }

  // Share all documents in a package with approved investor
  static async sharePackageDocuments(packageId, investorId) {
    try {
      // Get all documents in the package
      const documentsQuery = query(
        collection(db, 'documents'),
        where('packageId', '==', packageId)
      );
      
      const documentsSnapshot = await getDocs(documentsQuery);
      const sharePromises = [];
      
      documentsSnapshot.forEach((doc) => {
        const documentData = doc.data();
        sharePromises.push(
          this.shareDocumentWithInvestor(
            doc.id, 
            investorId, 
            documentData.uploaderId,
            {
              canView: true,
              canDownload: false, // Restrict downloads for security
              canComment: true,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          )
        );
      });
      
      await Promise.all(sharePromises);
      console.log(`Shared ${sharePromises.length} documents with investor:`, investorId);
    } catch (error) {
      console.error('Error sharing package documents:', error);
      throw error;
    }
  }

  // Document verification (for compliance)
  static async verifyDocument(documentId, verifierId, verificationData) {
    try {
      const verification = {
        documentId,
        verifierId,
        verificationStatus: verificationData.status, // verified, rejected, pending_review
        verificationNotes: verificationData.notes || '',
        verificationDate: serverTimestamp(),
        complianceChecks: {
          authenticity: verificationData.authenticity || false,
          completeness: verificationData.completeness || false,
          currentness: verificationData.currentness || false,
          legality: verificationData.legality || false
        }
      };
      
      const verificationRef = await addDoc(collection(db, 'documentVerifications'), verification);
      
      // Update document status
      const documentRef = doc(db, 'documents', documentId);
      await updateDoc(documentRef, {
        verificationStatus: verification.verificationStatus,
        verifiedAt: serverTimestamp(),
        verifiedBy: verifierId,
        updatedAt: serverTimestamp()
      });
      
      return { id: verificationRef.id, ...verification };
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  // Document analytics
  static async getDocumentAnalytics(documentId, ownerId) {
    try {
      // Verify ownership
      const document = await this.getDocument(documentId, ownerId);
      if (document.uploaderId !== ownerId) {
        throw new Error('Access denied to document analytics');
      }
      
      // Get access logs
      const logsQuery = query(
        collection(db, 'documentAccessLogs'),
        where('documentId', '==', documentId),
        orderBy('timestamp', 'desc')
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const accessLogs = [];
      const analytics = {
        totalViews: 0,
        uniqueViewers: new Set(),
        downloadCount: 0,
        viewsByDay: {},
        topViewers: {},
        averageViewTime: 0
      };
      
      logsSnapshot.forEach((doc) => {
        const log = doc.data();
        accessLogs.push(log);
        
        analytics.totalViews++;
        analytics.uniqueViewers.add(log.userId);
        
        if (log.action === 'download') {
          analytics.downloadCount++;
        }
        
        // Count views by day
        const date = log.timestamp?.toDate ? log.timestamp.toDate().toDateString() : new Date().toDateString();
        analytics.viewsByDay[date] = (analytics.viewsByDay[date] || 0) + 1;
        
        // Count views by user
        analytics.topViewers[log.userId] = (analytics.topViewers[log.userId] || 0) + 1;
      });
      
      analytics.uniqueViewers = analytics.uniqueViewers.size;
      
      return {
        documentId,
        analytics,
        recentActivity: accessLogs.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting document analytics:', error);
      throw error;
    }
  }

  // Utility methods
  static getDocumentIcon(category) {
    const icons = {
      'financial_statements': '📊',
      'business_plan': '📋',
      'legal_documents': '⚖️',
      'compliance_certificates': '✅',
      'operational_reports': '🏭',
      'market_analysis': '📈',
      'team_information': '👥',
      'intellectual_property': '💡',
      'contracts': '📄',
      'presentations': '📽️',
      'other': '📁'
    };
    
    return icons[category] || '📄';
  }

  static getFileTypeColor(fileType) {
    const colors = {
      'pdf': '#dc3545',
      'doc': '#0066cc',
      'docx': '#0066cc',
      'xls': '#28a745',
      'xlsx': '#28a745',
      'ppt': '#fd7e14',
      'pptx': '#fd7e14',
      'jpg': '#6f42c1',
      'png': '#6f42c1',
      'other': '#6c757d'
    };
    
    return colors[fileType] || colors['other'];
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default DocumentService;