/**
 * Security Service for Bvester Platform
 * Advanced authentication, data encryption, audit logging, and compliance
 * Week 13 Implementation - Security & Compliance System
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class SecurityService {
    constructor() {
        // Encryption configuration
        this.encryptionAlgorithm = 'aes-256-gcm';
        this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
        this.hashRounds = 12;

        // Auth0 configuration
        this.auth0Config = {
            domain: process.env.AUTH0_DOMAIN,
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            audience: process.env.AUTH0_AUDIENCE,
            managementAPI: `https://${process.env.AUTH0_DOMAIN}/api/v2/`
        };

        // Onfido KYC configuration
        this.onfidoConfig = {
            apiToken: process.env.ONFIDO_API_TOKEN,
            apiUrl: process.env.ONFIDO_API_URL || 'https://api.onfido.com/v3/',
            webhookToken: process.env.ONFIDO_WEBHOOK_TOKEN
        };

        // Security policies
        this.securityPolicies = {
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                preventCommonPasswords: true,
                maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
            },
            sessionPolicy: {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                refreshTokenMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                requireMFA: true,
                maxConcurrentSessions: 5
            },
            rateLimiting: {
                loginAttempts: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 min
                apiCalls: { max: 1000, window: 60 * 60 * 1000 }, // 1000 calls per hour
                fileUpload: { max: 10, window: 60 * 1000 }, // 10 uploads per minute
                kycVerification: { max: 3, window: 24 * 60 * 60 * 1000 } // 3 KYC attempts per day
            }
        };

        // Storage for security events and audit logs
        this.auditLogs = new Map();
        this.securityEvents = new Map();
        this.blacklistedTokens = new Set();
        this.failedLoginAttempts = new Map();
        this.kycVerifications = new Map();
    }

    /**
     * Initialize Auth0 management API client
     */
    async initializeAuth0Management() {
        try {
            const tokenResponse = await axios.post(`https://${this.auth0Config.domain}/oauth/token`, {
                client_id: this.auth0Config.clientId,
                client_secret: this.auth0Config.clientSecret,
                audience: this.auth0Config.managementAPI,
                grant_type: 'client_credentials'
            });

            this.auth0ManagementToken = tokenResponse.data.access_token;
            return { success: true, message: 'Auth0 management API initialized' };
        } catch (error) {
            throw new Error(`Failed to initialize Auth0: ${error.message}`);
        }
    }

    /**
     * Create Auth0 user with enhanced security
     */
    async createAuth0User(userData) {
        try {
            await this.initializeAuth0Management();

            const auth0User = {
                email: userData.email,
                password: userData.password,
                name: userData.name,
                connection: 'Username-Password-Authentication',
                user_metadata: {
                    businessId: userData.businessId,
                    role: userData.role,
                    country: userData.country,
                    phoneNumber: userData.phoneNumber,
                    createdAt: new Date().toISOString(),
                    securityLevel: this.determineSecurityLevel(userData),
                    complianceStatus: 'pending'
                },
                app_metadata: {
                    roles: [userData.role],
                    permissions: this.getRolePermissions(userData.role),
                    security_flags: {
                        mfa_required: true,
                        kyc_required: userData.role === 'business-owner' || userData.role === 'investor',
                        high_value_user: userData.expectedInvestment > 100000
                    }
                }
            };

            const response = await axios.post(
                `${this.auth0Config.managementAPI}users`,
                auth0User,
                {
                    headers: {
                        'Authorization': `Bearer ${this.auth0ManagementToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Log user creation
            await this.logSecurityEvent('user_created', userData.email, {
                auth0UserId: response.data.user_id,
                role: userData.role,
                securityLevel: auth0User.user_metadata.securityLevel
            });

            return {
                auth0UserId: response.data.user_id,
                email: response.data.email,
                securityLevel: auth0User.user_metadata.securityLevel,
                mfaRequired: auth0User.app_metadata.security_flags.mfa_required
            };
        } catch (error) {
            throw new Error(`Failed to create Auth0 user: ${error.message}`);
        }
    }

    /**
     * Determine security level based on user profile
     */
    determineSecurityLevel(userData) {
        let level = 'standard';

        if (userData.role === 'admin') {
            level = 'critical';
        } else if (userData.role === 'business-owner' || 
                  (userData.role === 'investor' && userData.expectedInvestment > 50000)) {
            level = 'high';
        } else if (userData.role === 'analyst' || userData.role === 'investor') {
            level = 'elevated';
        }

        return level;
    }

    /**
     * Get role-based permissions
     */
    getRolePermissions(role) {
        const permissions = {
            'admin': [
                'read:all', 'write:all', 'delete:all', 'manage:users', 
                'manage:system', 'view:audit_logs', 'manage:security'
            ],
            'business-owner': [
                'read:own_business', 'write:own_business', 'read:investments',
                'write:documents', 'manage:team', 'view:analytics'
            ],
            'investor': [
                'read:businesses', 'read:investments', 'write:investments',
                'read:own_portfolio', 'write:own_profile', 'view:market_data'
            ],
            'analyst': [
                'read:businesses', 'read:investments', 'read:market_data',
                'write:reports', 'view:analytics', 'read:documents'
            ],
            'viewer': [
                'read:public_data', 'read:own_profile'
            ]
        };

        return permissions[role] || permissions['viewer'];
    }

    /**
     * Encrypt sensitive data
     */
    encryptData(plaintext, additionalData = '') {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.encryptionAlgorithm, this.encryptionKey);
            cipher.setAAD(Buffer.from(additionalData));

            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.encryptionAlgorithm
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData, additionalData = '') {
        try {
            const decipher = crypto.createDecipher(
                encryptedData.algorithm,
                this.encryptionKey
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            decipher.setAAD(Buffer.from(additionalData));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Hash passwords with bcrypt
     */
    async hashPassword(password) {
        try {
            // Validate password against policy
            const validation = this.validatePassword(password);
            if (!validation.valid) {
                throw new Error(`Password policy violation: ${validation.errors.join(', ')}`);
            }

            const salt = await bcrypt.genSalt(this.hashRounds);
            const hash = await bcrypt.hash(password, salt);

            return {
                hash: hash,
                algorithm: 'bcrypt',
                rounds: this.hashRounds,
                createdAt: new Date()
            };
        } catch (error) {
            throw new Error(`Password hashing failed: ${error.message}`);
        }
    }

    /**
     * Validate password against security policy
     */
    validatePassword(password) {
        const errors = [];
        const policy = this.securityPolicies.passwordPolicy;

        if (password.length < policy.minLength) {
            errors.push(`Password must be at least ${policy.minLength} characters long`);
        }

        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (policy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        if (policy.preventCommonPasswords && this.isCommonPassword(password)) {
            errors.push('Password is too common. Please choose a more secure password');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    /**
     * Check if password is in common passwords list
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }

    /**
     * Calculate password strength score
     */
    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length bonus
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Character variety bonus
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
        if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters
        if (/^\d+$/.test(password)) score -= 2; // Only numbers

        const strength = Math.max(0, Math.min(5, score));
        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        
        return {
            score: strength,
            label: labels[strength],
            percentage: (strength / 5) * 100
        };
    }

    /**
     * Initialize KYC verification with Onfido
     */
    async initiateKYCVerification(userId, personalData) {
        try {
            const kycId = uuidv4();

            // Create Onfido applicant
            const applicantData = {
                first_name: personalData.firstName,
                last_name: personalData.lastName,
                email: personalData.email,
                dob: personalData.dateOfBirth,
                address: {
                    flat_number: personalData.address.flat,
                    building_number: personalData.address.building,
                    building_name: personalData.address.buildingName,
                    street: personalData.address.street,
                    sub_street: personalData.address.subStreet,
                    town: personalData.address.town,
                    state: personalData.address.state,
                    postcode: personalData.address.postcode,
                    country: personalData.address.country
                }
            };

            const applicantResponse = await axios.post(
                `${this.onfidoConfig.apiUrl}applicants`,
                applicantData,
                {
                    headers: {
                        'Authorization': `Token token=${this.onfidoConfig.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const onfidoApplicantId = applicantResponse.data.id;

            // Create KYC verification record
            const kycVerification = {
                id: kycId,
                userId: userId,
                onfidoApplicantId: onfidoApplicantId,
                status: 'initiated',
                level: this.determineKYCLevel(personalData),
                createdAt: new Date(),
                updatedAt: new Date(),
                personalData: this.encryptData(JSON.stringify(personalData)),
                checks: {
                    identity: { status: 'pending', result: null },
                    document: { status: 'pending', result: null },
                    facial_similarity: { status: 'pending', result: null },
                    address: { status: 'pending', result: null }
                },
                riskAssessment: {
                    score: null,
                    level: null,
                    factors: []
                }
            };

            this.kycVerifications.set(kycId, kycVerification);

            // Log KYC initiation
            await this.logSecurityEvent('kyc_initiated', userId, {
                kycId: kycId,
                onfidoApplicantId: onfidoApplicantId,
                level: kycVerification.level
            });

            return {
                kycId: kycId,
                onfidoApplicantId: onfidoApplicantId,
                level: kycVerification.level,
                status: 'initiated',
                requiredDocuments: this.getRequiredDocuments(kycVerification.level),
                sdkToken: await this.generateOnfidoSDKToken(onfidoApplicantId)
            };
        } catch (error) {
            throw new Error(`KYC verification initiation failed: ${error.message}`);
        }
    }

    /**
     * Determine KYC verification level based on user profile
     */
    determineKYCLevel(personalData) {
        // Enhanced KYC for high-value users or business owners
        if (personalData.expectedInvestment > 100000 || personalData.businessOwner) {
            return 'enhanced';
        }
        
        // Standard KYC for regular investors
        if (personalData.expectedInvestment > 10000) {
            return 'standard';
        }
        
        // Basic KYC for low-value users
        return 'basic';
    }

    /**
     * Get required documents for KYC level
     */
    getRequiredDocuments(level) {
        const documents = {
            basic: ['passport', 'driving_licence', 'national_identity_card'],
            standard: ['passport', 'driving_licence', 'national_identity_card', 'proof_of_address'],
            enhanced: [
                'passport', 'driving_licence', 'national_identity_card',
                'proof_of_address', 'bank_statement', 'utility_bill',
                'source_of_funds', 'business_registration'
            ]
        };

        return documents[level] || documents.basic;
    }

    /**
     * Generate Onfido SDK token for frontend integration
     */
    async generateOnfidoSDKToken(applicantId) {
        try {
            const tokenResponse = await axios.post(
                `${this.onfidoConfig.apiUrl}sdk_token`,
                {
                    applicant_id: applicantId,
                    application_id: process.env.ONFIDO_APPLICATION_ID
                },
                {
                    headers: {
                        'Authorization': `Token token=${this.onfidoConfig.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return tokenResponse.data.token;
        } catch (error) {
            throw new Error(`Failed to generate Onfido SDK token: ${error.message}`);
        }
    }

    /**
     * Process KYC webhook from Onfido
     */
    async processKYCWebhook(webhookData) {
        try {
            // Verify webhook signature
            if (!this.verifyOnfidoWebhook(webhookData)) {
                throw new Error('Invalid webhook signature');
            }

            const { resource_type, action, object } = webhookData;

            if (resource_type === 'check' && action === 'check.completed') {
                await this.handleKYCCheckCompleted(object);
            }

            return { success: true, message: 'Webhook processed successfully' };
        } catch (error) {
            throw new Error(`KYC webhook processing failed: ${error.message}`);
        }
    }

    /**
     * Handle completed KYC check
     */
    async handleKYCCheckCompleted(checkData) {
        try {
            const kycVerification = Array.from(this.kycVerifications.values())
                .find(kyc => kyc.onfidoApplicantId === checkData.applicant_id);

            if (!kycVerification) {
                throw new Error('KYC verification not found');
            }

            // Update KYC status based on check results
            kycVerification.status = checkData.result;
            kycVerification.updatedAt = new Date();
            
            // Update individual check results
            if (checkData.report_names.includes('identity_enhanced')) {
                kycVerification.checks.identity.status = 'completed';
                kycVerification.checks.identity.result = checkData.result;
            }

            if (checkData.report_names.includes('document')) {
                kycVerification.checks.document.status = 'completed';
                kycVerification.checks.document.result = checkData.result;
            }

            if (checkData.report_names.includes('facial_similarity_photo')) {
                kycVerification.checks.facial_similarity.status = 'completed';
                kycVerification.checks.facial_similarity.result = checkData.result;
            }

            // Calculate risk assessment
            kycVerification.riskAssessment = this.calculateKYCRiskScore(checkData);

            this.kycVerifications.set(kycVerification.id, kycVerification);

            // Log KYC completion
            await this.logSecurityEvent('kyc_completed', kycVerification.userId, {
                kycId: kycVerification.id,
                result: checkData.result,
                riskScore: kycVerification.riskAssessment.score
            });

            // Update user compliance status in Auth0
            await this.updateUserComplianceStatus(
                kycVerification.userId,
                checkData.result,
                kycVerification.riskAssessment
            );

            return kycVerification;
        } catch (error) {
            throw new Error(`KYC check handling failed: ${error.message}`);
        }
    }

    /**
     * Calculate KYC risk score
     */
    calculateKYCRiskScore(checkData) {
        let score = 100; // Start with perfect score
        const factors = [];

        // Deduct points based on check results
        if (checkData.result === 'consider') {
            score -= 30;
            factors.push('Manual review required');
        }

        if (checkData.result === 'unidentified') {
            score -= 60;
            factors.push('Identity verification failed');
        }

        // Additional risk factors from sub-results
        checkData.sub_result?.forEach(subResult => {
            if (subResult.result === 'rejected') {
                score -= 20;
                factors.push(`${subResult.check} failed`);
            } else if (subResult.result === 'consider') {
                score -= 10;
                factors.push(`${subResult.check} requires review`);
            }
        });

        const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

        return {
            score: Math.max(0, score),
            level: riskLevel,
            factors: factors
        };
    }

    /**
     * Verify Onfido webhook signature
     */
    verifyOnfidoWebhook(webhookData) {
        // In production, implement proper HMAC signature verification
        // This is a simplified version for demo purposes
        return webhookData.payload && webhookData.payload.resource_type;
    }

    /**
     * Update user compliance status in Auth0
     */
    async updateUserComplianceStatus(userId, kycResult, riskAssessment) {
        try {
            await this.initializeAuth0Management();

            const userMetadata = {
                kyc_status: kycResult,
                kyc_completed_at: new Date().toISOString(),
                risk_score: riskAssessment.score,
                risk_level: riskAssessment.level,
                compliance_status: kycResult === 'clear' ? 'approved' : 'pending_review'
            };

            await axios.patch(
                `${this.auth0Config.managementAPI}users/${userId}`,
                { user_metadata: userMetadata },
                {
                    headers: {
                        'Authorization': `Bearer ${this.auth0ManagementToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { success: true, message: 'User compliance status updated' };
        } catch (error) {
            throw new Error(`Failed to update compliance status: ${error.message}`);
        }
    }

    /**
     * Log security events for audit trail
     */
    async logSecurityEvent(eventType, userId, details = {}) {
        try {
            const eventId = uuidv4();
            const securityEvent = {
                id: eventId,
                eventType: eventType,
                userId: userId,
                timestamp: new Date(),
                ipAddress: details.ipAddress || null,
                userAgent: details.userAgent || null,
                sessionId: details.sessionId || null,
                severity: this.getEventSeverity(eventType),
                details: details,
                processed: false
            };

            if (!this.securityEvents.has(eventType)) {
                this.securityEvents.set(eventType, []);
            }
            this.securityEvents.get(eventType).push(securityEvent);

            // Also add to general audit log
            await this.logAuditEvent(userId, eventType, details);

            return eventId;
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    /**
     * Get event severity level
     */
    getEventSeverity(eventType) {
        const severityMap = {
            'user_created': 'info',
            'user_login': 'info',
            'user_logout': 'info',
            'password_changed': 'warning',
            'failed_login': 'warning',
            'kyc_initiated': 'info',
            'kyc_completed': 'info',
            'suspicious_activity': 'critical',
            'security_breach': 'critical',
            'unauthorized_access': 'high',
            'data_access': 'info',
            'admin_action': 'warning'
        };

        return severityMap[eventType] || 'info';
    }

    /**
     * Log audit events for compliance
     */
    async logAuditEvent(userId, action, details = {}) {
        try {
            const auditId = uuidv4();
            const auditEvent = {
                id: auditId,
                userId: userId,
                action: action,
                timestamp: new Date(),
                details: details,
                compliance: {
                    gdpr: true,
                    pci: action.includes('payment'),
                    sox: action.includes('financial'),
                    retention_period: this.getRetentionPeriod(action)
                }
            };

            if (!this.auditLogs.has(userId)) {
                this.auditLogs.set(userId, []);
            }
            this.auditLogs.get(userId).push(auditEvent);

            return auditId;
        } catch (error) {
            console.error('Failed to log audit event:', error);
        }
    }

    /**
     * Get retention period for audit events
     */
    getRetentionPeriod(action) {
        // Return retention period in days based on compliance requirements
        const retentionMap = {
            'financial': 2555, // 7 years for financial records
            'kyc': 1825, // 5 years for KYC records
            'login': 365, // 1 year for login records
            'default': 1095 // 3 years default
        };

        for (const [key, period] of Object.entries(retentionMap)) {
            if (action.includes(key)) {
                return period;
            }
        }

        return retentionMap.default;
    }

    /**
     * Generate secure API tokens
     */
    generateSecureToken(payload, expiresIn = '1h') {
        try {
            const token = jwt.sign(
                {
                    ...payload,
                    jti: uuidv4(), // JWT ID for tracking
                    iat: Math.floor(Date.now() / 1000)
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: expiresIn,
                    issuer: 'bvester.com',
                    audience: 'bvester-api'
                }
            );

            return {
                token: token,
                type: 'Bearer',
                expiresIn: expiresIn,
                createdAt: new Date()
            };
        } catch (error) {
            throw new Error(`Token generation failed: ${error.message}`);
        }
    }

    /**
     * Validate and verify JWT tokens
     */
    verifyToken(token) {
        try {
            // Check if token is blacklisted
            if (this.blacklistedTokens.has(token)) {
                throw new Error('Token has been revoked');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'bvester.com',
                audience: 'bvester-api'
            });

            return {
                valid: true,
                payload: decoded,
                expiresAt: new Date(decoded.exp * 1000)
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Revoke JWT token (add to blacklist)
     */
    revokeToken(token) {
        try {
            this.blacklistedTokens.add(token);
            
            // Log token revocation
            this.logSecurityEvent('token_revoked', null, { token: token.substring(0, 20) + '...' });
            
            return { success: true, message: 'Token revoked successfully' };
        } catch (error) {
            throw new Error(`Token revocation failed: ${error.message}`);
        }
    }

    /**
     * Generate secure random codes (for MFA, etc.)
     */
    generateSecureCode(length = 6, type = 'numeric') {
        const characters = {
            numeric: '0123456789',
            alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        };

        const charset = characters[type] || characters.numeric;
        let result = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            result += charset[randomIndex];
        }

        return {
            code: result,
            type: type,
            length: length,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            generatedAt: new Date()
        };
    }

    /**
     * Get security summary for dashboard
     */
    getSecuritySummary(timeframe = '24h') {
        try {
            const timeLimit = new Date();
            switch (timeframe) {
                case '1h':
                    timeLimit.setHours(timeLimit.getHours() - 1);
                    break;
                case '24h':
                    timeLimit.setHours(timeLimit.getHours() - 24);
                    break;
                case '7d':
                    timeLimit.setDate(timeLimit.getDate() - 7);
                    break;
                case '30d':
                    timeLimit.setDate(timeLimit.getDate() - 30);
                    break;
                default:
                    timeLimit.setHours(timeLimit.getHours() - 24);
            }

            const recentEvents = [];
            for (const events of this.securityEvents.values()) {
                recentEvents.push(...events.filter(event => event.timestamp >= timeLimit));
            }

            const summary = {
                timeframe: timeframe,
                totalEvents: recentEvents.length,
                eventsByType: {},
                eventsBySeverity: {
                    info: 0,
                    warning: 0,
                    high: 0,
                    critical: 0
                },
                topUsers: {},
                securityScore: 100,
                recommendations: []
            };

            // Analyze events
            recentEvents.forEach(event => {
                // Count by type
                summary.eventsByType[event.eventType] = (summary.eventsByType[event.eventType] || 0) + 1;
                
                // Count by severity
                summary.eventsBySeverity[event.severity]++;
                
                // Count by user
                if (event.userId) {
                    summary.topUsers[event.userId] = (summary.topUsers[event.userId] || 0) + 1;
                }
            });

            // Calculate security score
            summary.securityScore -= summary.eventsBySeverity.critical * 20;
            summary.securityScore -= summary.eventsBySeverity.high * 10;
            summary.securityScore -= summary.eventsBySeverity.warning * 5;
            summary.securityScore = Math.max(0, summary.securityScore);

            // Generate recommendations
            if (summary.eventsBySeverity.critical > 0) {
                summary.recommendations.push('Address critical security events immediately');
            }
            if (summary.eventsBySeverity.warning > 10) {
                summary.recommendations.push('Review warning events for patterns');
            }
            if (summary.securityScore < 80) {
                summary.recommendations.push('Consider implementing additional security measures');
            }

            return summary;
        } catch (error) {
            throw new Error(`Failed to generate security summary: ${error.message}`);
        }
    }
}

module.exports = SecurityService;