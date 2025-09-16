/**
 * Document Management API Routes for Bvester Platform
 * RESTful endpoints for document upload, processing, versioning, and signatures
 * Week 11 Implementation - Document Management System
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const DocumentService = require('../services/documentService');
const DocuSignService = require('../services/docusignService');
const { authMiddleware, businessOwnerMiddleware, investorMiddleware } = require('../middleware/auth');
const { validateDocumentUpload, validateSignatureRequest } = require('../middleware/documentValidation');

// Initialize services
const documentService = new DocumentService();
const docusignService = new DocuSignService();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 5 // Maximum 5 files per upload
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    }
});

/**
 * @route   POST /api/documents/upload
 * @desc    Upload document to S3 with metadata
 * @access  Authenticated Users
 */
router.post('/upload', authMiddleware, upload.single('document'), validateDocumentUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const metadata = {
            businessId: req.body.businessId || req.user.businessId,
            uploadedBy: req.user.id,
            documentType: req.body.documentType,
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            confidentiality: req.body.confidentiality,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            isPublic: req.body.isPublic === 'true',
            allowedUsers: req.body.allowedUsers ? JSON.parse(req.body.allowedUsers) : [],
            allowedRoles: req.body.allowedRoles ? JSON.parse(req.body.allowedRoles) : []
        };

        const document = await documentService.uploadDocument(req.file, metadata);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                documentId: document.id,
                fileName: document.fileName,
                fileSize: document.fileSize,
                documentType: document.documentType,
                version: document.version,
                uploadedAt: document.uploadedAt,
                processing: document.processing
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/documents/bulk-upload
 * @desc    Upload multiple documents at once
 * @access  Authenticated Users
 */
router.post('/bulk-upload', authMiddleware, upload.array('documents', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files provided'
            });
        }

        const metadata = {
            businessId: req.body.businessId || req.user.businessId,
            uploadedBy: req.user.id,
            documentType: req.body.documentType || 'general',
            category: req.body.category || 'uncategorized',
            confidentiality: req.body.confidentiality || 'internal'
        };

        const uploadPromises = req.files.map(file => 
            documentService.uploadDocument(file, {
                ...metadata,
                title: req.body.title || file.originalname,
                description: req.body.description || `Bulk uploaded file: ${file.originalname}`
            })
        );

        const documents = await Promise.all(uploadPromises);

        res.status(201).json({
            success: true,
            message: `${documents.length} documents uploaded successfully`,
            data: {
                totalUploaded: documents.length,
                documents: documents.map(doc => ({
                    documentId: doc.id,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    uploadedAt: doc.uploadedAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to upload documents',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/documents/:documentId/version
 * @desc    Create new version of existing document
 * @access  Document Owner or Business Owner
 */
router.post('/:documentId/version', authMiddleware, upload.single('document'), async (req, res) => {
    try {
        const { documentId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided for new version'
            });
        }

        const versionMetadata = {
            uploadedBy: req.user.id,
            changes: req.body.changes || 'Document updated'
        };

        const result = await documentService.createDocumentVersion(documentId, req.file, versionMetadata);

        res.status(201).json({
            success: true,
            message: 'Document version created successfully',
            data: {
                documentId: result.document.id,
                version: result.document.version,
                previousVersion: result.document.version - 1,
                changes: versionMetadata.changes,
                fileSize: result.document.fileSize,
                updatedAt: result.document.lastModified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create document version',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/documents/generate
 * @desc    Generate document from template
 * @access  Business Owner
 */
router.post('/generate', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { templateId, templateData } = req.body;

        if (!templateId || !templateData) {
            return res.status(400).json({
                success: false,
                message: 'Template ID and template data are required'
            });
        }

        const metadata = {
            businessId: req.user.businessId,
            uploadedBy: req.user.id,
            documentType: 'generated',
            category: 'legal',
            confidentiality: 'confidential'
        };

        const document = await documentService.generateFromTemplate(templateId, templateData, metadata);

        res.status(201).json({
            success: true,
            message: 'Document generated successfully from template',
            data: {
                documentId: document.id,
                templateId: templateId,
                fileName: document.fileName,
                fileSize: document.fileSize,
                generatedAt: document.uploadedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate document from template',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/search
 * @desc    Search documents by content and metadata
 * @access  Authenticated Users
 */
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query, documentType, dateFrom, dateTo, limit } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const filters = {
            businessId: req.user.businessId,
            documentType,
            dateFrom,
            dateTo,
            limit: parseInt(limit) || 20
        };

        const searchResults = await documentService.searchDocuments(query, filters);

        res.json({
            success: true,
            message: 'Document search completed',
            data: {
                query: searchResults.query,
                totalResults: searchResults.totalResults,
                results: searchResults.results.map(result => ({
                    document: {
                        id: result.document.id,
                        fileName: result.document.fileName,
                        documentType: result.document.documentType,
                        title: result.document.metadata.title,
                        description: result.document.metadata.description,
                        uploadedAt: result.document.uploadedAt,
                        fileSize: result.document.fileSize
                    },
                    relevanceScore: result.relevanceScore,
                    matchedTerms: result.matchedTerms
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Document search failed',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/:documentId
 * @desc    Get document details and metadata
 * @access  Authenticated Users
 */
router.get('/:documentId', authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;
        const document = documentService.documents.get(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check access permissions
        if (document.businessId !== req.user.businessId && !document.access.isPublic) {
            if (!document.access.allowedUsers.includes(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this document'
                });
            }
        }

        res.json({
            success: true,
            message: 'Document details retrieved successfully',
            data: {
                id: document.id,
                fileName: document.fileName,
                fileSize: document.fileSize,
                fileType: document.fileType,
                version: document.version,
                status: document.status,
                documentType: document.documentType,
                metadata: document.metadata,
                uploadedAt: document.uploadedAt,
                lastModified: document.lastModified,
                processing: document.processing,
                access: {
                    downloadCount: document.access.downloadCount,
                    lastAccessed: document.access.lastAccessed
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get document details',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/:documentId/download
 * @desc    Generate secure download URL for document
 * @access  Authenticated Users
 */
router.get('/:documentId/download', authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;
        const { expiration } = req.query;

        const downloadInfo = await documentService.generateDownloadURL(
            documentId, 
            parseInt(expiration) || 60
        );

        res.json({
            success: true,
            message: 'Download URL generated successfully',
            data: downloadInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate download URL',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/:documentId/versions
 * @desc    Get all versions of a document
 * @access  Document Owner or Business Owner
 */
router.get('/:documentId/versions', authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;
        const versions = documentService.versions.get(documentId) || [];

        res.json({
            success: true,
            message: 'Document versions retrieved successfully',
            data: {
                documentId: documentId,
                totalVersions: versions.length,
                versions: versions.map(version => ({
                    version: version.version,
                    fileSize: version.fileSize,
                    uploadedBy: version.uploadedBy,
                    uploadedAt: version.uploadedAt,
                    changes: version.changes,
                    isActive: version.isActive
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get document versions',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/:documentId/audit
 * @desc    Get document audit trail
 * @access  Business Owner
 */
router.get('/:documentId/audit', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;
        const auditTrail = await documentService.getAuditTrail(documentId);

        res.json({
            success: true,
            message: 'Document audit trail retrieved successfully',
            data: {
                documentId: documentId,
                totalEvents: auditTrail.length,
                events: auditTrail.map(event => ({
                    id: event.id,
                    action: event.action,
                    userId: event.userId,
                    timestamp: event.timestamp,
                    details: event.details
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get document audit trail',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/documents/:documentId/signature-request
 * @desc    Create DocuSign signature request
 * @access  Business Owner
 */
router.post('/:documentId/signature-request', authMiddleware, businessOwnerMiddleware, validateSignatureRequest, async (req, res) => {
    try {
        const { documentId } = req.params;
        const { signers, subject, message, expirationDays, requireIdVerification } = req.body;

        const metadata = {
            subject,
            message,
            expirationDays,
            requireIdVerification,
            createdBy: req.user.id
        };

        const signatureRequest = await docusignService.createSignatureRequest(documentId, signers, metadata);

        res.status(201).json({
            success: true,
            message: 'Signature request created successfully',
            data: signatureRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create signature request',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/signature-requests/:requestId/status
 * @desc    Get signature request status
 * @access  Business Owner
 */
router.get('/signature-requests/:requestId/status', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = await docusignService.getSignatureStatus(requestId);

        res.json({
            success: true,
            message: 'Signature status retrieved successfully',
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get signature status',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/documents/signature-requests/:requestId/remind
 * @desc    Send reminder to signers
 * @access  Business Owner
 */
router.post('/signature-requests/:requestId/remind', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { signerEmail } = req.body;

        const result = await docusignService.sendReminder(requestId, signerEmail);

        res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/signature-requests/:requestId/signing-url
 * @desc    Get embedded signing URL
 * @access  Authorized Signers
 */
router.get('/signature-requests/:requestId/signing-url', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { returnUrl } = req.query;

        if (!returnUrl) {
            return res.status(400).json({
                success: false,
                message: 'Return URL is required'
            });
        }

        const signingInfo = await docusignService.getEmbeddedSigningURL(
            requestId, 
            req.user.email, 
            returnUrl
        );

        res.json({
            success: true,
            message: 'Signing URL generated successfully',
            data: signingInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get signing URL',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/documents/signature-requests/:requestId/download
 * @desc    Download signed document
 * @access  Business Owner
 */
router.get('/signature-requests/:requestId/download', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const signedDocInfo = await docusignService.downloadSignedDocument(requestId);

        res.json({
            success: true,
            message: 'Signed document retrieved successfully',
            data: {
                signedDocumentId: signedDocInfo.signedDocument.id,
                completedAt: signedDocInfo.completedAt,
                signers: signedDocInfo.signers.map(signer => ({
                    name: signer.name,
                    email: signer.email,
                    signedAt: signer.signedAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to download signed document',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/documents/signature-requests/:requestId
 * @desc    Void signature request
 * @access  Business Owner
 */
router.delete('/signature-requests/:requestId', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Void reason is required'
            });
        }

        const result = await docusignService.voidSignatureRequest(requestId, reason);

        res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to void signature request',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Delete document (soft delete)
 * @access  Document Owner or Business Owner
 */
router.delete('/:documentId', authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;
        const document = documentService.documents.get(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check permissions
        if (document.businessId !== req.user.businessId && document.uploadedBy !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Soft delete
        document.status = 'deleted';
        document.deletedAt = new Date();
        document.deletedBy = req.user.id;
        documentService.documents.set(documentId, document);

        // Log audit event
        await documentService.logAuditEvent(documentId, 'document_deleted', req.user.id, {
            reason: req.body.reason || 'User requested deletion'
        });

        res.json({
            success: true,
            message: 'Document deleted successfully',
            data: {
                documentId: documentId,
                deletedAt: document.deletedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
});

module.exports = router;