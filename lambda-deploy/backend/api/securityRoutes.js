/**
 * Security API Routes for Bvester Platform
 * RESTful endpoints for security management, compliance, and audit
 * Week 13 Implementation - Security & Compliance System
 */

const express = require('express');
const router = express.Router();
const SecurityService = require('../services/securityService');
const ComplianceService = require('../services/complianceService');
const { authMiddleware, adminMiddleware, complianceMiddleware } = require('../middleware/auth');
const { validateSecurityData, validateComplianceData } = require('../middleware/securityValidation');
const { kycRateLimit, authRateLimit } = require('../middleware/rateLimitingMiddleware');

// Initialize services
const securityService = new SecurityService();
const complianceService = new ComplianceService();

/**
 * @route   POST /api/security/auth0/create-user
 * @desc    Create user in Auth0 with enhanced security
 * @access  Admin
 */
router.post('/auth0/create-user', authMiddleware, adminMiddleware, validateSecurityData, async (req, res) => {
    try {
        const userData = {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            businessId: req.body.businessId,
            role: req.body.role,
            country: req.body.country,
            phoneNumber: req.body.phoneNumber,
            expectedInvestment: req.body.expectedInvestment || 0
        };

        const auth0User = await securityService.createAuth0User(userData);

        res.status(201).json({
            success: true,
            message: 'User created successfully in Auth0',
            data: {
                auth0UserId: auth0User.auth0UserId,
                email: auth0User.email,
                securityLevel: auth0User.securityLevel,
                mfaRequired: auth0User.mfaRequired
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create Auth0 user',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/encrypt
 * @desc    Encrypt sensitive data
 * @access  Authenticated Users (Admin/System)
 */
router.post('/encrypt', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { plaintext, additionalData } = req.body;

        if (!plaintext) {
            return res.status(400).json({
                success: false,
                message: 'Plaintext data is required'
            });
        }

        const encryptedData = securityService.encryptData(plaintext, additionalData || '');

        // Log encryption event
        await securityService.logSecurityEvent('data_encrypted', req.user.id, {
            dataLength: plaintext.length,
            algorithm: encryptedData.algorithm
        });

        res.json({
            success: true,
            message: 'Data encrypted successfully',
            data: {
                encrypted: encryptedData.encrypted,
                iv: encryptedData.iv,
                authTag: encryptedData.authTag,
                algorithm: encryptedData.algorithm
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Data encryption failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/decrypt
 * @desc    Decrypt sensitive data
 * @access  Authenticated Users (Admin/System)
 */
router.post('/decrypt', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { encryptedData, additionalData } = req.body;

        if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
            return res.status(400).json({
                success: false,
                message: 'Complete encrypted data object is required'
            });
        }

        const decryptedData = securityService.decryptData(encryptedData, additionalData || '');

        // Log decryption event
        await securityService.logSecurityEvent('data_decrypted', req.user.id, {
            algorithm: encryptedData.algorithm
        });

        res.json({
            success: true,
            message: 'Data decrypted successfully',
            data: {
                plaintext: decryptedData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Data decryption failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/validate-password
 * @desc    Validate password against security policy
 * @access  Public
 */
router.post('/validate-password', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const validation = securityService.validatePassword(password);

        res.json({
            success: true,
            message: 'Password validation completed',
            data: {
                valid: validation.valid,
                errors: validation.errors,
                strength: validation.strength
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Password validation failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/kyc/initiate
 * @desc    Initiate KYC verification with Onfido
 * @access  Authenticated Users
 */
router.post('/kyc/initiate', authMiddleware, kycRateLimit(), validateSecurityData, async (req, res) => {
    try {
        const personalData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            dateOfBirth: req.body.dateOfBirth,
            address: req.body.address,
            expectedInvestment: req.body.expectedInvestment || 0,
            businessOwner: req.body.businessOwner || false
        };

        const kycVerification = await securityService.initiateKYCVerification(
            req.user.id,
            personalData
        );

        res.status(201).json({
            success: true,
            message: 'KYC verification initiated successfully',
            data: {
                kycId: kycVerification.kycId,
                onfidoApplicantId: kycVerification.onfidoApplicantId,
                level: kycVerification.level,
                status: kycVerification.status,
                requiredDocuments: kycVerification.requiredDocuments,
                sdkToken: kycVerification.sdkToken
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'KYC verification initiation failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/kyc/webhook
 * @desc    Handle KYC webhook from Onfido
 * @access  Public (with signature verification)
 */
router.post('/kyc/webhook', async (req, res) => {
    try {
        const result = await securityService.processKYCWebhook(req.body);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('KYC webhook error:', error);
        res.status(400).json({
            success: false,
            message: 'Webhook processing failed',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/security/kyc/:kycId/status
 * @desc    Get KYC verification status
 * @access  User (own KYC) or Admin
 */
router.get('/kyc/:kycId/status', authMiddleware, async (req, res) => {
    try {
        const { kycId } = req.params;
        const kycVerification = securityService.kycVerifications.get(kycId);

        if (!kycVerification) {
            return res.status(404).json({
                success: false,
                message: 'KYC verification not found'
            });
        }

        // Check access permissions
        if (kycVerification.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this KYC verification'
            });
        }

        res.json({
            success: true,
            message: 'KYC status retrieved successfully',
            data: {
                kycId: kycVerification.id,
                status: kycVerification.status,
                level: kycVerification.level,
                createdAt: kycVerification.createdAt,
                updatedAt: kycVerification.updatedAt,
                checks: kycVerification.checks,
                riskAssessment: kycVerification.riskAssessment
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve KYC status',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/tokens/generate
 * @desc    Generate secure API token
 * @access  Authenticated Users
 */
router.post('/tokens/generate', authMiddleware, async (req, res) => {
    try {
        const { purpose, expiresIn } = req.body;

        const payload = {
            userId: req.user.id,
            role: req.user.role,
            purpose: purpose || 'api_access',
            businessId: req.user.businessId
        };

        const tokenData = securityService.generateSecureToken(payload, expiresIn || '1h');

        // Log token generation
        await securityService.logSecurityEvent('token_generated', req.user.id, {
            purpose: payload.purpose,
            expiresIn: expiresIn || '1h'
        });

        res.json({
            success: true,
            message: 'Token generated successfully',
            data: {
                token: tokenData.token,
                type: tokenData.type,
                expiresIn: tokenData.expiresIn,
                createdAt: tokenData.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Token generation failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/tokens/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/tokens/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const verification = securityService.verifyToken(token);

        res.json({
            success: true,
            message: 'Token verification completed',
            data: {
                valid: verification.valid,
                payload: verification.valid ? verification.payload : null,
                expiresAt: verification.valid ? verification.expiresAt : null,
                error: verification.valid ? null : verification.error
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Token verification failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/tokens/revoke
 * @desc    Revoke JWT token
 * @access  Authenticated Users
 */
router.post('/tokens/revoke', authMiddleware, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const result = securityService.revokeToken(token);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Token revocation failed',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/security/summary
 * @desc    Get security summary dashboard
 * @access  Admin
 */
router.get('/summary', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { timeframe } = req.query;
        const summary = securityService.getSecuritySummary(timeframe || '24h');

        res.json({
            success: true,
            message: 'Security summary retrieved successfully',
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve security summary',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/codes/generate
 * @desc    Generate secure verification codes
 * @access  Authenticated Users
 */
router.post('/codes/generate', authMiddleware, async (req, res) => {
    try {
        const { length, type, purpose } = req.body;

        const codeData = securityService.generateSecureCode(
            length || 6,
            type || 'numeric'
        );

        // Log code generation
        await securityService.logSecurityEvent('verification_code_generated', req.user.id, {
            purpose: purpose || 'verification',
            type: codeData.type,
            length: codeData.length
        });

        res.json({
            success: true,
            message: 'Verification code generated successfully',
            data: {
                code: codeData.code,
                type: codeData.type,
                length: codeData.length,
                expiresAt: codeData.expiresAt,
                generatedAt: codeData.generatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Code generation failed',
            error: error.message
        });
    }
});

// Compliance Routes
/**
 * @route   POST /api/security/compliance/initialize
 * @desc    Initialize compliance framework for business
 * @access  Business Owner or Admin
 */
router.post('/compliance/initialize', authMiddleware, complianceMiddleware, validateComplianceData, async (req, res) => {
    try {
        const businessData = {
            ...req.body,
            businessId: req.user.businessId
        };

        const compliance = await complianceService.initializeCompliance(
            req.user.businessId,
            businessData
        );

        res.status(201).json({
            success: true,
            message: 'Compliance framework initialized successfully',
            data: compliance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Compliance initialization failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/compliance/consent
 * @desc    Record user consent for GDPR compliance
 * @access  Authenticated Users
 */
router.post('/compliance/consent', authMiddleware, async (req, res) => {
    try {
        const consentData = {
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };

        const consent = await complianceService.recordConsent(req.user.id, consentData);

        res.json({
            success: true,
            message: 'Consent recorded successfully',
            data: consent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Consent recording failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/compliance/data-subject-request
 * @desc    Process GDPR data subject request
 * @access  Authenticated Users
 */
router.post('/compliance/data-subject-request', authMiddleware, async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            userId: req.user.id,
            email: req.user.email
        };

        const request = await complianceService.processDataSubjectRequest(requestData);

        res.status(201).json({
            success: true,
            message: 'Data subject request submitted successfully',
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Data subject request failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/compliance/breach-report
 * @desc    Report data breach incident
 * @access  Admin or Compliance Officer
 */
router.post('/compliance/breach-report', authMiddleware, complianceMiddleware, async (req, res) => {
    try {
        const breachData = {
            ...req.body,
            reportedBy: req.user.id
        };

        const incident = await complianceService.reportDataBreach(breachData);

        res.status(201).json({
            success: true,
            message: 'Data breach reported successfully',
            data: incident
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Breach reporting failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/security/compliance/assessment
 * @desc    Conduct compliance assessment
 * @access  Compliance Officer or Admin
 */
router.post('/compliance/assessment', authMiddleware, complianceMiddleware, async (req, res) => {
    try {
        const { complianceId, framework } = req.body;

        const assessment = await complianceService.conductComplianceAssessment(
            complianceId,
            framework
        );

        res.json({
            success: true,
            message: 'Compliance assessment completed successfully',
            data: assessment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Compliance assessment failed',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/security/compliance/report/:complianceId
 * @desc    Generate compliance report
 * @access  Business Owner, Compliance Officer, or Admin
 */
router.get('/compliance/report/:complianceId', authMiddleware, complianceMiddleware, async (req, res) => {
    try {
        const { complianceId } = req.params;
        const { reportType } = req.query;

        const report = await complianceService.generateComplianceReport(
            complianceId,
            reportType || 'comprehensive'
        );

        res.json({
            success: true,
            message: 'Compliance report generated successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Compliance report generation failed',
            error: error.message
        });
    }
});

module.exports = router;