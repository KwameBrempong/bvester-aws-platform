/**
 * Document Management Service for Bvester Platform
 * Handles file storage, document processing, versioning, and digital signatures
 * Week 11 Implementation - Document Management System
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');

class DocumentService {
    constructor() {
        // AWS S3 Configuration
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });

        this.bucketName = process.env.AWS_S3_BUCKET || 'bvester-documents';
        this.documents = new Map();
        this.versions = new Map();
        this.auditTrail = new Map();
        this.allowedFileTypes = [
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'
        ];
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
    }

    /**
     * Upload document to AWS S3 with metadata
     */
    async uploadDocument(file, metadata = {}) {
        try {
            const documentId = uuidv4();
            const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
            
            // Validate file type
            if (!this.allowedFileTypes.includes(fileExtension)) {
                throw new Error(`File type .${fileExtension} is not allowed`);
            }

            // Validate file size
            if (file.size > this.maxFileSize) {
                throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
            }

            // Generate secure file path
            const fileKey = this.generateSecureFileKey(documentId, fileExtension, metadata.businessId);
            
            // Prepare S3 upload parameters
            const uploadParams = {
                Bucket: this.bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: {
                    'document-id': documentId,
                    'business-id': metadata.businessId || '',
                    'uploaded-by': metadata.uploadedBy || '',
                    'document-type': metadata.documentType || 'general',
                    'version': '1',
                    'created-at': new Date().toISOString()
                },
                ServerSideEncryption: 'AES256',
                StorageClass: 'STANDARD_IA' // Cost-optimized for infrequent access
            };

            // Upload to S3
            const uploadResult = await this.s3.upload(uploadParams).promise();

            // Create document record
            const document = {
                id: documentId,
                businessId: metadata.businessId,
                fileName: file.originalname,
                fileSize: file.size,
                fileType: fileExtension,
                mimeType: file.mimetype,
                s3Key: fileKey,
                s3Url: uploadResult.Location,
                version: 1,
                status: 'active',
                documentType: metadata.documentType || 'general',
                tags: metadata.tags || [],
                uploadedBy: metadata.uploadedBy,
                uploadedAt: new Date(),
                lastModified: new Date(),
                checksum: this.calculateChecksum(file.buffer),
                metadata: {
                    title: metadata.title || file.originalname,
                    description: metadata.description || '',
                    category: metadata.category || 'uncategorized',
                    confidentiality: metadata.confidentiality || 'internal',
                    retention: metadata.retention || 7 // years
                },
                processing: {
                    ocrCompleted: false,
                    thumbnailGenerated: false,
                    virusScanCompleted: false,
                    indexingCompleted: false
                },
                access: {
                    isPublic: metadata.isPublic || false,
                    allowedUsers: metadata.allowedUsers || [],
                    allowedRoles: metadata.allowedRoles || [],
                    downloadCount: 0,
                    lastAccessed: null
                }
            };

            this.documents.set(documentId, document);

            // Create initial version record
            const versionRecord = {
                documentId,
                version: 1,
                s3Key: fileKey,
                s3Url: uploadResult.Location,
                fileSize: file.size,
                checksum: document.checksum,
                uploadedBy: metadata.uploadedBy,
                uploadedAt: new Date(),
                changes: 'Initial upload',
                isActive: true
            };

            if (!this.versions.has(documentId)) {
                this.versions.set(documentId, []);
            }
            this.versions.get(documentId).push(versionRecord);

            // Log audit trail
            await this.logAuditEvent(documentId, 'document_uploaded', metadata.uploadedBy, {
                fileName: file.originalname,
                fileSize: file.size,
                documentType: metadata.documentType
            });

            // Trigger background processing
            this.processDocumentAsync(documentId);

            return document;
        } catch (error) {
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    /**
     * Generate secure file key for S3 storage
     */
    generateSecureFileKey(documentId, fileExtension, businessId) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const randomString = crypto.randomBytes(8).toString('hex');
        
        return `documents/${year}/${month}/${businessId || 'general'}/${documentId}_${randomString}.${fileExtension}`;
    }

    /**
     * Calculate file checksum for integrity verification
     */
    calculateChecksum(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Create new document version
     */
    async createDocumentVersion(documentId, file, versionMetadata = {}) {
        try {
            const document = this.documents.get(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            const newVersion = document.version + 1;
            const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
            const fileKey = this.generateSecureFileKey(documentId, fileExtension, document.businessId);

            // Upload new version to S3
            const uploadParams = {
                Bucket: this.bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: {
                    'document-id': documentId,
                    'business-id': document.businessId,
                    'version': newVersion.toString(),
                    'created-at': new Date().toISOString()
                },
                ServerSideEncryption: 'AES256',
                StorageClass: 'STANDARD_IA'
            };

            const uploadResult = await this.s3.upload(uploadParams).promise();

            // Update document record
            document.version = newVersion;
            document.s3Key = fileKey;
            document.s3Url = uploadResult.Location;
            document.fileSize = file.size;
            document.lastModified = new Date();
            document.checksum = this.calculateChecksum(file.buffer);

            // Create version record
            const versionRecord = {
                documentId,
                version: newVersion,
                s3Key: fileKey,
                s3Url: uploadResult.Location,
                fileSize: file.size,
                checksum: document.checksum,
                uploadedBy: versionMetadata.uploadedBy,
                uploadedAt: new Date(),
                changes: versionMetadata.changes || 'Document updated',
                isActive: true
            };

            // Mark previous versions as inactive
            const versions = this.versions.get(documentId);
            versions.forEach(v => v.isActive = false);
            versions.push(versionRecord);

            this.documents.set(documentId, document);

            // Log audit trail
            await this.logAuditEvent(documentId, 'version_created', versionMetadata.uploadedBy, {
                version: newVersion,
                changes: versionMetadata.changes,
                fileSize: file.size
            });

            return { document, versionRecord };
        } catch (error) {
            throw new Error(`Failed to create document version: ${error.message}`);
        }
    }

    /**
     * Generate document from template
     */
    async generateFromTemplate(templateId, templateData, metadata = {}) {
        try {
            const templates = {
                'investment-agreement': {
                    name: 'Investment Agreement',
                    content: this.getInvestmentAgreementTemplate(),
                    fields: ['businessName', 'investorName', 'investmentAmount', 'equityPercentage', 'date']
                },
                'loan-agreement': {
                    name: 'Loan Agreement',
                    content: this.getLoanAgreementTemplate(),
                    fields: ['businessName', 'lenderName', 'loanAmount', 'interestRate', 'termMonths', 'date']
                },
                'revenue-share': {
                    name: 'Revenue Sharing Agreement',
                    content: this.getRevenueShareTemplate(),
                    fields: ['businessName', 'partnerName', 'sharePercentage', 'duration', 'date']
                },
                'kyc-form': {
                    name: 'KYC Verification Form',
                    content: this.getKYCFormTemplate(),
                    fields: ['fullName', 'businessName', 'address', 'phone', 'email', 'idNumber']
                },
                'business-plan': {
                    name: 'Business Plan Template',
                    content: this.getBusinessPlanTemplate(),
                    fields: ['businessName', 'industry', 'location', 'fundingNeeded', 'description']
                }
            };

            const template = templates[templateId];
            if (!template) {
                throw new Error('Template not found');
            }

            // Validate required fields
            const missingFields = template.fields.filter(field => !templateData[field]);
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Replace template placeholders
            let documentContent = template.content;
            template.fields.forEach(field => {
                const placeholder = new RegExp(`{{${field}}}`, 'g');
                documentContent = documentContent.replace(placeholder, templateData[field] || '');
            });

            // Generate PDF from HTML content
            const pdfBuffer = await this.generatePDFFromHTML(documentContent);

            // Create file object for upload
            const file = {
                originalname: `${template.name}_${Date.now()}.pdf`,
                buffer: pdfBuffer,
                size: pdfBuffer.length,
                mimetype: 'application/pdf'
            };

            // Upload generated document
            const document = await this.uploadDocument(file, {
                ...metadata,
                documentType: 'generated',
                templateId: templateId,
                title: `${template.name} - ${templateData.businessName || 'Generated'}`
            });

            return document;
        } catch (error) {
            throw new Error(`Failed to generate document from template: ${error.message}`);
        }
    }

    /**
     * Process document with OCR and text extraction
     */
    async processDocumentOCR(documentId) {
        try {
            const document = this.documents.get(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Skip OCR for non-image/pdf files
            if (!['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(document.fileType)) {
                return { success: false, reason: 'File type not suitable for OCR' };
            }

            // Download file from S3 for processing
            const s3Object = await this.s3.getObject({
                Bucket: this.bucketName,
                Key: document.s3Key
            }).promise();

            // Simulate OCR processing (in production, use AWS Textract)
            const extractedText = await this.performOCR(s3Object.Body, document.fileType);

            // Store extracted text
            document.extractedText = extractedText;
            document.processing.ocrCompleted = true;
            document.processing.ocrCompletedAt = new Date();

            // Create searchable index
            document.searchableContent = this.createSearchableIndex(extractedText, document.metadata.title);

            this.documents.set(documentId, document);

            // Log audit trail
            await this.logAuditEvent(documentId, 'ocr_completed', 'system', {
                extractedTextLength: extractedText.length,
                confidence: 0.95 // Simulated confidence score
            });

            return {
                success: true,
                extractedText: extractedText,
                confidence: 0.95
            };
        } catch (error) {
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }

    /**
     * Simulate OCR processing (replace with AWS Textract in production)
     */
    async performOCR(fileBuffer, fileType) {
        // Simulated OCR extraction based on file type
        if (fileType === 'pdf') {
            return "This is simulated extracted text from a PDF document. In production, this would use AWS Textract to extract actual text content from the PDF file.";
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
            return "This is simulated extracted text from an image document. OCR would identify and extract text content from the image using computer vision.";
        }
        return "";
    }

    /**
     * Create searchable index from document content
     */
    createSearchableIndex(content, title) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        const titleWords = title.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);

        return [...new Set([...words, ...titleWords])];
    }

    /**
     * Search documents by content and metadata
     */
    async searchDocuments(query, filters = {}) {
        try {
            const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
            const results = [];

            for (const [documentId, document] of this.documents.entries()) {
                // Apply filters
                if (filters.businessId && document.businessId !== filters.businessId) continue;
                if (filters.documentType && document.documentType !== filters.documentType) continue;
                if (filters.dateFrom && document.uploadedAt < new Date(filters.dateFrom)) continue;
                if (filters.dateTo && document.uploadedAt > new Date(filters.dateTo)) continue;

                let relevanceScore = 0;

                // Search in title and description
                const titleMatch = searchTerms.some(term => 
                    document.metadata.title.toLowerCase().includes(term)
                );
                if (titleMatch) relevanceScore += 10;

                const descriptionMatch = searchTerms.some(term => 
                    document.metadata.description.toLowerCase().includes(term)
                );
                if (descriptionMatch) relevanceScore += 5;

                // Search in extracted text
                if (document.extractedText) {
                    const textMatches = searchTerms.filter(term => 
                        document.extractedText.toLowerCase().includes(term)
                    ).length;
                    relevanceScore += textMatches * 2;
                }

                // Search in searchable index
                if (document.searchableContent) {
                    const indexMatches = searchTerms.filter(term => 
                        document.searchableContent.includes(term)
                    ).length;
                    relevanceScore += indexMatches;
                }

                if (relevanceScore > 0) {
                    results.push({
                        document,
                        relevanceScore,
                        matchedTerms: searchTerms.filter(term => 
                            document.metadata.title.toLowerCase().includes(term) ||
                            document.metadata.description.toLowerCase().includes(term) ||
                            (document.extractedText && document.extractedText.toLowerCase().includes(term))
                        )
                    });
                }
            }

            // Sort by relevance score
            results.sort((a, b) => b.relevanceScore - a.relevanceScore);

            return {
                query,
                totalResults: results.length,
                results: results.slice(0, filters.limit || 50)
            };
        } catch (error) {
            throw new Error(`Document search failed: ${error.message}`);
        }
    }

    /**
     * Generate download URL with expiration
     */
    async generateDownloadURL(documentId, expirationMinutes = 60) {
        try {
            const document = this.documents.get(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Generate pre-signed URL for secure download
            const downloadURL = await this.s3.getSignedUrlPromise('getObject', {
                Bucket: this.bucketName,
                Key: document.s3Key,
                Expires: expirationMinutes * 60,
                ResponseContentDisposition: `attachment; filename="${document.fileName}"`
            });

            // Update access tracking
            document.access.downloadCount++;
            document.access.lastAccessed = new Date();
            this.documents.set(documentId, document);

            return {
                downloadURL,
                expiresAt: new Date(Date.now() + (expirationMinutes * 60 * 1000)),
                fileName: document.fileName,
                fileSize: document.fileSize
            };
        } catch (error) {
            throw new Error(`Failed to generate download URL: ${error.message}`);
        }
    }

    /**
     * Log audit trail event
     */
    async logAuditEvent(documentId, action, userId, details = {}) {
        const auditRecord = {
            id: uuidv4(),
            documentId,
            action,
            userId,
            timestamp: new Date(),
            details,
            ipAddress: details.ipAddress || null,
            userAgent: details.userAgent || null
        };

        if (!this.auditTrail.has(documentId)) {
            this.auditTrail.set(documentId, []);
        }
        this.auditTrail.get(documentId).push(auditRecord);

        return auditRecord;
    }

    /**
     * Get document audit trail
     */
    async getAuditTrail(documentId) {
        return this.auditTrail.get(documentId) || [];
    }

    /**
     * Background document processing
     */
    async processDocumentAsync(documentId) {
        try {
            // Process OCR
            await this.processDocumentOCR(documentId);
            
            // Generate thumbnail (for images/PDFs)
            await this.generateThumbnail(documentId);
            
            // Perform virus scan (simulated)
            await this.performVirusScan(documentId);
            
            // Update search index
            await this.updateSearchIndex(documentId);

        } catch (error) {
            console.error(`Background processing failed for document ${documentId}:`, error);
        }
    }

    /**
     * Generate thumbnail for document
     */
    async generateThumbnail(documentId) {
        const document = this.documents.get(documentId);
        if (!document) return;

        // Simulate thumbnail generation
        document.processing.thumbnailGenerated = true;
        document.processing.thumbnailGeneratedAt = new Date();
        document.thumbnailUrl = `https://cdn.bvester.com/thumbnails/${documentId}.jpg`;
        
        this.documents.set(documentId, document);
    }

    /**
     * Perform virus scan on document
     */
    async performVirusScan(documentId) {
        const document = this.documents.get(documentId);
        if (!document) return;

        // Simulate virus scan
        document.processing.virusScanCompleted = true;
        document.processing.virusScanCompletedAt = new Date();
        document.processing.virusScanResult = 'clean';
        
        this.documents.set(documentId, document);
    }

    /**
     * Update search index
     */
    async updateSearchIndex(documentId) {
        const document = this.documents.get(documentId);
        if (!document) return;

        document.processing.indexingCompleted = true;
        document.processing.indexingCompletedAt = new Date();
        
        this.documents.set(documentId, document);
    }

    // Document Templates
    getInvestmentAgreementTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Investment Agreement</title></head>
        <body>
            <h1>INVESTMENT AGREEMENT</h1>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Business:</strong> {{businessName}}</p>
            <p><strong>Investor:</strong> {{investorName}}</p>
            <p><strong>Investment Amount:</strong> ${{investmentAmount}}</p>
            <p><strong>Equity Percentage:</strong> {{equityPercentage}}%</p>
            <p>This agreement outlines the terms and conditions of the investment...</p>
        </body>
        </html>
        `;
    }

    getLoanAgreementTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Loan Agreement</title></head>
        <body>
            <h1>LOAN AGREEMENT</h1>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Business:</strong> {{businessName}}</p>
            <p><strong>Lender:</strong> {{lenderName}}</p>
            <p><strong>Loan Amount:</strong> ${{loanAmount}}</p>
            <p><strong>Interest Rate:</strong> {{interestRate}}%</p>
            <p><strong>Term:</strong> {{termMonths}} months</p>
            <p>This loan agreement establishes the terms...</p>
        </body>
        </html>
        `;
    }

    getRevenueShareTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Revenue Sharing Agreement</title></head>
        <body>
            <h1>REVENUE SHARING AGREEMENT</h1>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Business:</strong> {{businessName}}</p>
            <p><strong>Partner:</strong> {{partnerName}}</p>
            <p><strong>Share Percentage:</strong> {{sharePercentage}}%</p>
            <p><strong>Duration:</strong> {{duration}}</p>
            <p>This revenue sharing agreement defines...</p>
        </body>
        </html>
        `;
    }

    getKYCFormTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>KYC Verification Form</title></head>
        <body>
            <h1>KNOW YOUR CUSTOMER (KYC) FORM</h1>
            <p><strong>Full Name:</strong> {{fullName}}</p>
            <p><strong>Business Name:</strong> {{businessName}}</p>
            <p><strong>Address:</strong> {{address}}</p>
            <p><strong>Phone:</strong> {{phone}}</p>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>ID Number:</strong> {{idNumber}}</p>
            <p>This form is used for identity verification...</p>
        </body>
        </html>
        `;
    }

    getBusinessPlanTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Business Plan</title></head>
        <body>
            <h1>BUSINESS PLAN</h1>
            <h2>{{businessName}}</h2>
            <p><strong>Industry:</strong> {{industry}}</p>
            <p><strong>Location:</strong> {{location}}</p>
            <p><strong>Funding Needed:</strong> ${{fundingNeeded}}</p>
            <h3>Business Description</h3>
            <p>{{description}}</p>
            <h3>Executive Summary</h3>
            <p>This business plan outlines...</p>
        </body>
        </html>
        `;
    }

    /**
     * Generate PDF from HTML content (simulated)
     */
    async generatePDFFromHTML(htmlContent) {
        // In production, use a library like puppeteer or wkhtmltopdf
        // For now, return a simple buffer representing PDF content
        return Buffer.from(`%PDF-1.4\nSimulated PDF content from HTML\n${htmlContent}\n%%EOF`, 'utf8');
    }
}

module.exports = DocumentService;