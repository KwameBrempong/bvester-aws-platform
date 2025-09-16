/**
 * DocuSign Integration Service for Bvester Platform
 * Handles electronic signatures, document workflows, and signature tracking
 * Week 11 Implementation - Document Management System
 */

const docusign = require('docusign-esign');
const { v4: uuidv4 } = require('uuid');
const DocumentService = require('./documentService');

class DocuSignService {
    constructor() {
        this.documentService = new DocumentService();
        
        // DocuSign Configuration
        this.basePath = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
        this.integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
        this.userId = process.env.DOCUSIGN_USER_ID;
        this.accountId = process.env.DOCUSIGN_ACCOUNT_ID;
        this.privateKey = process.env.DOCUSIGN_PRIVATE_KEY;
        
        // Initialize DocuSign API client
        this.apiClient = new docusign.ApiClient();
        this.apiClient.setBasePath(this.basePath);
        
        // Storage for envelope tracking
        this.envelopes = new Map();
        this.signatureRequests = new Map();
    }

    /**
     * Initialize DocuSign authentication
     */
    async initializeAuthentication() {
        try {
            // JWT authentication for DocuSign
            const jwtLifeSec = 10 * 60; // 10 minutes
            const scopes = ['signature', 'impersonation'];

            this.apiClient.setOAuthBasePath(this.basePath.replace('/restapi', ''));
            
            const results = await this.apiClient.requestJWTUserToken(
                this.integrationKey,
                this.userId,
                scopes,
                Buffer.from(this.privateKey),
                jwtLifeSec
            );

            this.accessToken = results.body.access_token;
            this.apiClient.addDefaultHeader('Authorization', 'Bearer ' + this.accessToken);

            // Get user account info
            const userInfo = await this.apiClient.getUserInfo(this.accessToken);
            this.accountId = userInfo.accounts[0].accountId;

            return { success: true, message: 'DocuSign authentication successful' };
        } catch (error) {
            throw new Error(`DocuSign authentication failed: ${error.message}`);
        }
    }

    /**
     * Create signature request for investment documents
     */
    async createSignatureRequest(documentId, signers, metadata = {}) {
        try {
            await this.initializeAuthentication();

            const requestId = uuidv4();
            const document = this.documentService.documents.get(documentId);
            
            if (!document) {
                throw new Error('Document not found');
            }

            // Download document from S3 for DocuSign
            const documentBuffer = await this.documentService.s3.getObject({
                Bucket: this.documentService.bucketName,
                Key: document.s3Key
            }).promise();

            // Create envelope definition
            const envelopeDefinition = {
                emailSubject: metadata.subject || `Signature Request - ${document.metadata.title}`,
                emailBlurb: metadata.message || 'Please review and sign the attached document.',
                status: 'sent',
                documents: [{
                    documentId: '1',
                    name: document.fileName,
                    fileExtension: document.fileType,
                    documentBase64: documentBuffer.Body.toString('base64')
                }],
                recipients: {
                    signers: this.prepareSigners(signers)
                },
                customFields: {
                    textCustomFields: [
                        {
                            name: 'bvester_document_id',
                            value: documentId,
                            show: false
                        },
                        {
                            name: 'bvester_request_id',
                            value: requestId,
                            show: false
                        },
                        {
                            name: 'business_id',
                            value: document.businessId,
                            show: false
                        }
                    ]
                }
            };

            // Add signature tabs for each signer
            envelopeDefinition.recipients.signers.forEach((signer, index) => {
                signer.tabs = {
                    signHereTabs: [{
                        anchorString: '{{signature_' + (index + 1) + '}}',
                        anchorUnits: 'pixels',
                        anchorYOffset: '0',
                        anchorXOffset: '0'
                    }],
                    dateSignedTabs: [{
                        anchorString: '{{date_' + (index + 1) + '}}',
                        anchorUnits: 'pixels',
                        anchorYOffset: '0',
                        anchorXOffset: '0'
                    }],
                    textTabs: this.generateTextTabs(signer, index + 1)
                };
            });

            // Send envelope via DocuSign API
            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            const results = await envelopesApi.createEnvelope(this.accountId, {
                envelopeDefinition: envelopeDefinition
            });

            // Store signature request
            const signatureRequest = {
                id: requestId,
                envelopeId: results.envelopeId,
                documentId: documentId,
                businessId: document.businessId,
                status: 'sent',
                subject: envelopeDefinition.emailSubject,
                message: envelopeDefinition.emailBlurb,
                signers: signers.map(signer => ({
                    ...signer,
                    status: 'sent',
                    signedAt: null,
                    ipAddress: null,
                    location: null
                })),
                createdAt: new Date(),
                sentAt: new Date(),
                completedAt: null,
                voidedAt: null,
                remindersSent: 0,
                expiresAt: new Date(Date.now() + (metadata.expirationDays || 30) * 24 * 60 * 60 * 1000),
                workflow: {
                    requireInPersonSigning: metadata.requireInPerson || false,
                    allowReassign: metadata.allowReassign || false,
                    requireIdVerification: metadata.requireIdVerification || false,
                    sendReminders: metadata.sendReminders || true
                },
                audit: {
                    events: [],
                    certificateUrl: null,
                    downloadUrl: null
                }
            };

            this.signatureRequests.set(requestId, signatureRequest);
            this.envelopes.set(results.envelopeId, requestId);

            // Log audit event
            await this.documentService.logAuditEvent(documentId, 'signature_request_created', metadata.createdBy, {
                requestId: requestId,
                envelopeId: results.envelopeId,
                signerCount: signers.length
            });

            return {
                requestId: requestId,
                envelopeId: results.envelopeId,
                status: 'sent',
                signers: signatureRequest.signers,
                expiresAt: signatureRequest.expiresAt
            };
        } catch (error) {
            throw new Error(`Failed to create signature request: ${error.message}`);
        }
    }

    /**
     * Prepare signers array for DocuSign envelope
     */
    prepareSigners(signers) {
        return signers.map((signer, index) => ({
            email: signer.email,
            name: signer.name,
            recipientId: (index + 1).toString(),
            routingOrder: signer.routingOrder || (index + 1).toString(),
            roleName: signer.role || 'Signer',
            clientUserId: signer.clientUserId || null, // For embedded signing
            requireIdLookup: signer.requireIdVerification || false,
            accessCode: signer.accessCode || null,
            note: signer.note || '',
            phoneAuthentication: signer.phoneAuth ? {
                recipMayProvideNumber: true,
                senderProvidedNumbers: [signer.phoneAuth.number],
                recordVoicePrint: false
            } : null
        }));
    }

    /**
     * Generate text tabs for signature fields
     */
    generateTextTabs(signer, signerIndex) {
        const textTabs = [];

        // Add common text fields
        if (signer.title) {
            textTabs.push({
                anchorString: '{{title_' + signerIndex + '}}',
                value: signer.title,
                locked: true
            });
        }

        if (signer.company) {
            textTabs.push({
                anchorString: '{{company_' + signerIndex + '}}',
                value: signer.company,
                locked: true
            });
        }

        // Investment-specific fields
        if (signer.investmentAmount) {
            textTabs.push({
                anchorString: '{{investment_amount}}',
                value: signer.investmentAmount.toString(),
                locked: true
            });
        }

        if (signer.equityPercentage) {
            textTabs.push({
                anchorString: '{{equity_percentage}}',
                value: signer.equityPercentage.toString(),
                locked: true
            });
        }

        return textTabs;
    }

    /**
     * Check signature request status
     */
    async getSignatureStatus(requestId) {
        try {
            const signatureRequest = this.signatureRequests.get(requestId);
            if (!signatureRequest) {
                throw new Error('Signature request not found');
            }

            await this.initializeAuthentication();

            // Get envelope status from DocuSign
            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            const envelope = await envelopesApi.getEnvelope(this.accountId, signatureRequest.envelopeId);

            // Get recipients status
            const recipients = await envelopesApi.listRecipients(this.accountId, signatureRequest.envelopeId);

            // Update local status
            signatureRequest.status = envelope.status;
            if (envelope.status === 'completed') {
                signatureRequest.completedAt = new Date(envelope.completedDateTime);
            }

            // Update signer statuses
            recipients.signers.forEach(docuSignSigner => {
                const localSigner = signatureRequest.signers.find(s => s.email === docuSignSigner.email);
                if (localSigner) {
                    localSigner.status = docuSignSigner.status;
                    if (docuSignSigner.signedDateTime) {
                        localSigner.signedAt = new Date(docuSignSigner.signedDateTime);
                    }
                }
            });

            this.signatureRequests.set(requestId, signatureRequest);

            return {
                requestId: requestId,
                envelopeId: signatureRequest.envelopeId,
                status: signatureRequest.status,
                signers: signatureRequest.signers,
                completedAt: signatureRequest.completedAt,
                progress: this.calculateSigningProgress(signatureRequest.signers)
            };
        } catch (error) {
            throw new Error(`Failed to get signature status: ${error.message}`);
        }
    }

    /**
     * Calculate signing progress percentage
     */
    calculateSigningProgress(signers) {
        const totalSigners = signers.length;
        const completedSigners = signers.filter(s => s.status === 'completed').length;
        return Math.round((completedSigners / totalSigners) * 100);
    }

    /**
     * Send reminder to pending signers
     */
    async sendReminder(requestId, signerEmail = null) {
        try {
            const signatureRequest = this.signatureRequests.get(requestId);
            if (!signatureRequest) {
                throw new Error('Signature request not found');
            }

            await this.initializeAuthentication();

            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            
            // Send reminder to specific signer or all pending signers
            const reminderRequest = {
                reminderEnabled: 'true',
                reminderDelay: '1',
                reminderFrequency: '7'
            };

            if (signerEmail) {
                // Send to specific signer
                const signer = signatureRequest.signers.find(s => s.email === signerEmail);
                if (signer && signer.status !== 'completed') {
                    await envelopesApi.updateRecipientsStatus(
                        this.accountId,
                        signatureRequest.envelopeId,
                        {
                            signers: [{
                                email: signerEmail,
                                recipientId: signer.recipientId,
                                resendEnvelope: 'true'
                            }]
                        }
                    );
                }
            } else {
                // Send to all pending signers
                await envelopesApi.updateEnvelope(
                    this.accountId,
                    signatureRequest.envelopeId,
                    { envelope: reminderRequest }
                );
            }

            signatureRequest.remindersSent++;
            signatureRequest.lastReminderSent = new Date();
            this.signatureRequests.set(requestId, signatureRequest);

            return {
                success: true,
                message: 'Reminder sent successfully',
                sentTo: signerEmail || 'all pending signers'
            };
        } catch (error) {
            throw new Error(`Failed to send reminder: ${error.message}`);
        }
    }

    /**
     * Get signing URL for embedded signing
     */
    async getEmbeddedSigningURL(requestId, signerEmail, returnUrl) {
        try {
            const signatureRequest = this.signatureRequests.get(requestId);
            if (!signatureRequest) {
                throw new Error('Signature request not found');
            }

            const signer = signatureRequest.signers.find(s => s.email === signerEmail);
            if (!signer) {
                throw new Error('Signer not found');
            }

            await this.initializeAuthentication();

            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            
            const viewRequest = new docusign.RecipientViewRequest();
            viewRequest.returnUrl = returnUrl;
            viewRequest.authenticationMethod = 'none';
            viewRequest.email = signer.email;
            viewRequest.userName = signer.name;
            viewRequest.clientUserId = signer.clientUserId || signer.email;

            const results = await envelopesApi.createRecipientView(
                this.accountId,
                signatureRequest.envelopeId,
                { recipientViewRequest: viewRequest }
            );

            return {
                signingUrl: results.url,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                signerEmail: signerEmail,
                requestId: requestId
            };
        } catch (error) {
            throw new Error(`Failed to get embedded signing URL: ${error.message}`);
        }
    }

    /**
     * Download signed document
     */
    async downloadSignedDocument(requestId) {
        try {
            const signatureRequest = this.signatureRequests.get(requestId);
            if (!signatureRequest) {
                throw new Error('Signature request not found');
            }

            if (signatureRequest.status !== 'completed') {
                throw new Error('Document signing is not completed');
            }

            await this.initializeAuthentication();

            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            
            // Download combined PDF with signatures
            const documents = await envelopesApi.getDocument(
                this.accountId,
                signatureRequest.envelopeId,
                'combined'
            );

            // Upload signed document back to S3
            const signedDocument = await this.documentService.uploadDocument(
                {
                    originalname: `signed_${signatureRequest.documentId}.pdf`,
                    buffer: documents,
                    size: documents.length,
                    mimetype: 'application/pdf'
                },
                {
                    businessId: signatureRequest.businessId,
                    documentType: 'signed',
                    title: 'Signed Document',
                    uploadedBy: 'system'
                }
            );

            // Download certificate of completion
            const certificate = await envelopesApi.getDocument(
                this.accountId,
                signatureRequest.envelopeId,
                'certificate'
            );

            return {
                signedDocument: signedDocument,
                certificateBuffer: certificate,
                completedAt: signatureRequest.completedAt,
                signers: signatureRequest.signers.filter(s => s.status === 'completed')
            };
        } catch (error) {
            throw new Error(`Failed to download signed document: ${error.message}`);
        }
    }

    /**
     * Void signature request
     */
    async voidSignatureRequest(requestId, reason) {
        try {
            const signatureRequest = this.signatureRequests.get(requestId);
            if (!signatureRequest) {
                throw new Error('Signature request not found');
            }

            await this.initializeAuthentication();

            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            
            await envelopesApi.updateEnvelope(
                this.accountId,
                signatureRequest.envelopeId,
                {
                    envelope: {
                        status: 'voided',
                        voidedReason: reason
                    }
                }
            );

            signatureRequest.status = 'voided';
            signatureRequest.voidedAt = new Date();
            signatureRequest.voidReason = reason;
            this.signatureRequests.set(requestId, signatureRequest);

            // Log audit event
            await this.documentService.logAuditEvent(signatureRequest.documentId, 'signature_request_voided', 'system', {
                requestId: requestId,
                reason: reason
            });

            return {
                success: true,
                message: 'Signature request voided successfully',
                voidedAt: signatureRequest.voidedAt
            };
        } catch (error) {
            throw new Error(`Failed to void signature request: ${error.message}`);
        }
    }

    /**
     * Generate signature analytics
     */
    async getSignatureAnalytics(businessId, dateRange = {}) {
        try {
            const requests = Array.from(this.signatureRequests.values())
                .filter(request => {
                    if (request.businessId !== businessId) return false;
                    if (dateRange.from && request.createdAt < new Date(dateRange.from)) return false;
                    if (dateRange.to && request.createdAt > new Date(dateRange.to)) return false;
                    return true;
                });

            const analytics = {
                totalRequests: requests.length,
                completedRequests: requests.filter(r => r.status === 'completed').length,
                pendingRequests: requests.filter(r => r.status === 'sent').length,
                voidedRequests: requests.filter(r => r.status === 'voided').length,
                averageCompletionTime: 0,
                completionRate: 0,
                signerMetrics: {
                    totalSigners: 0,
                    completedSigners: 0,
                    averageSigningTime: 0
                },
                monthlyTrends: this.calculateMonthlyTrends(requests),
                topSigners: this.getTopSigners(requests)
            };

            // Calculate completion rate
            if (analytics.totalRequests > 0) {
                analytics.completionRate = (analytics.completedRequests / analytics.totalRequests) * 100;
            }

            // Calculate average completion time
            const completedRequests = requests.filter(r => r.status === 'completed' && r.completedAt);
            if (completedRequests.length > 0) {
                const totalTime = completedRequests.reduce((sum, request) => {
                    return sum + (request.completedAt.getTime() - request.createdAt.getTime());
                }, 0);
                analytics.averageCompletionTime = totalTime / completedRequests.length / (1000 * 60 * 60); // in hours
            }

            // Calculate signer metrics
            const allSigners = requests.flatMap(r => r.signers);
            analytics.signerMetrics.totalSigners = allSigners.length;
            analytics.signerMetrics.completedSigners = allSigners.filter(s => s.status === 'completed').length;

            return analytics;
        } catch (error) {
            throw new Error(`Failed to generate signature analytics: ${error.message}`);
        }
    }

    /**
     * Calculate monthly signature trends
     */
    calculateMonthlyTrends(requests) {
        const trends = {};
        
        requests.forEach(request => {
            const month = request.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!trends[month]) {
                trends[month] = { sent: 0, completed: 0, voided: 0 };
            }
            trends[month].sent++;
            if (request.status === 'completed') trends[month].completed++;
            if (request.status === 'voided') trends[month].voided++;
        });

        return trends;
    }

    /**
     * Get top signers by activity
     */
    getTopSigners(requests) {
        const signerActivity = {};
        
        requests.forEach(request => {
            request.signers.forEach(signer => {
                if (!signerActivity[signer.email]) {
                    signerActivity[signer.email] = {
                        email: signer.email,
                        name: signer.name,
                        totalSigns: 0,
                        completedSigns: 0
                    };
                }
                signerActivity[signer.email].totalSigns++;
                if (signer.status === 'completed') {
                    signerActivity[signer.email].completedSigns++;
                }
            });
        });

        return Object.values(signerActivity)
            .sort((a, b) => b.completedSigns - a.completedSigns)
            .slice(0, 10);
    }
}

module.exports = DocuSignService;