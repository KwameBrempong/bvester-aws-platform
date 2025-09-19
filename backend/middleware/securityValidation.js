/**
 * Security Validation Middleware for Bvester Platform
 * Input validation for security operations, KYC, and compliance
 * Week 13 Implementation - Security & Compliance System
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for Auth0 user creation
 */
const validateSecurityData = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
        .custom(async (email) => {
            // Check for disposable email domains
            const disposableDomains = [
                '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
                'mailinator.com', 'yopmail.com'
            ];
            const domain = email.split('@')[1].toLowerCase();
            if (disposableDomains.includes(domain)) {
                throw new Error('Disposable email addresses are not allowed');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and dots')
        .trim(),
    
    body('businessId')
        .optional()
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    body('role')
        .isIn(['admin', 'business-owner', 'investor', 'analyst', 'viewer'])
        .withMessage('Role must be valid'),
    
    body('country')
        .isLength({ min: 2, max: 2 })
        .withMessage('Country must be a 2-character ISO code')
        .isAlpha()
        .withMessage('Country code must contain only letters')
        .toUpperCase(),
    
    body('phoneNumber')
        .optional()
        .isMobilePhone()
        .withMessage('Valid phone number is required'),
    
    body('expectedInvestment')
        .optional()
        .isNumeric()
        .withMessage('Expected investment must be numeric')
        .custom((value) => {
            if (parseFloat(value) < 0) {
                throw new Error('Expected investment cannot be negative');
            }
            if (parseFloat(value) > 100000000) {
                throw new Error('Expected investment cannot exceed $100,000,000');
            }
            return true;
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Security data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for KYC verification
 */
const validateKYCData = [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, apostrophes, and dots')
        .trim(),
    
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, apostrophes, and dots')
        .trim(),
    
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('dateOfBirth')
        .isISO8601()
        .withMessage('Date of birth must be in valid ISO 8601 format')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                throw new Error('You must be at least 18 years old');
            }
            
            if (age > 120) {
                throw new Error('Invalid date of birth');
            }
            
            if (birthDate > today) {
                throw new Error('Date of birth cannot be in the future');
            }
            
            return true;
        }),
    
    body('address')
        .isObject()
        .withMessage('Address must be an object'),
    
    body('address.street')
        .notEmpty()
        .withMessage('Street address is required')
        .isLength({ min: 5, max: 200 })
        .withMessage('Street address must be between 5 and 200 characters')
        .trim(),
    
    body('address.town')
        .notEmpty()
        .withMessage('Town/City is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Town/City must be between 2 and 100 characters')
        .trim(),
    
    body('address.state')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('State/Province must be between 2 and 100 characters')
        .trim(),
    
    body('address.postcode')
        .notEmpty()
        .withMessage('Postal code is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters')
        .trim(),
    
    body('address.country')
        .isLength({ min: 2, max: 2 })
        .withMessage('Country must be a 2-character ISO code')
        .isAlpha()
        .withMessage('Country code must contain only letters')
        .toUpperCase(),
    
    body('expectedInvestment')
        .optional()
        .isNumeric()
        .withMessage('Expected investment must be numeric')
        .custom((value) => {
            if (parseFloat(value) < 0) {
                throw new Error('Expected investment cannot be negative');
            }
            return true;
        }),
    
    body('businessOwner')
        .optional()
        .isBoolean()
        .withMessage('Business owner flag must be boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'KYC data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for compliance initialization
 */
const validateComplianceData = [
    body('operatesInEU')
        .optional()
        .isBoolean()
        .withMessage('EU operations flag must be boolean'),
    
    body('hasEUCustomers')
        .optional()
        .isBoolean()
        .withMessage('EU customers flag must be boolean'),
    
    body('operatesInUS')
        .optional()
        .isBoolean()
        .withMessage('US operations flag must be boolean'),
    
    body('hasUSInvestors')
        .optional()
        .isBoolean()
        .withMessage('US investors flag must be boolean'),
    
    body('processesPayments')
        .optional()
        .isBoolean()
        .withMessage('Payment processing flag must be boolean'),
    
    body('primaryJurisdiction')
        .optional()
        .isLength({ min: 2, max: 2 })
        .withMessage('Primary jurisdiction must be a 2-character ISO code')
        .isAlpha()
        .withMessage('Jurisdiction code must contain only letters')
        .toUpperCase(),
    
    body('dataVolume')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Data volume must be one of: low, medium, high'),
    
    body('crossBorderTransfers')
        .optional()
        .isBoolean()
        .withMessage('Cross-border transfers flag must be boolean'),
    
    body('sensitiveData')
        .optional()
        .isBoolean()
        .withMessage('Sensitive data flag must be boolean'),
    
    body('publicCompany')
        .optional()
        .isBoolean()
        .withMessage('Public company flag must be boolean'),
    
    body('financialServices')
        .optional()
        .isBoolean()
        .withMessage('Financial services flag must be boolean'),
    
    body('dataProtectionOfficer')
        .optional()
        .isEmail()
        .withMessage('Data Protection Officer email must be valid')
        .normalizeEmail(),
    
    body('complianceOfficer')
        .optional()
        .isEmail()
        .withMessage('Compliance Officer email must be valid')
        .normalizeEmail(),
    
    body('legalCounsel')
        .optional()
        .isEmail()
        .withMessage('Legal Counsel email must be valid')
        .normalizeEmail(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Compliance data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for consent recording
 */
const validateConsentData = [
    body('consentTypes')
        .isArray({ min: 1 })
        .withMessage('At least one consent type is required'),
    
    body('consentTypes.*')
        .isIn(['necessary', 'functional', 'analytics', 'marketing', 'advertising'])
        .withMessage('Each consent type must be valid'),
    
    body('purposes')
        .isArray({ min: 1 })
        .withMessage('At least one purpose is required'),
    
    body('purposes.*')
        .isLength({ min: 5, max: 200 })
        .withMessage('Each purpose must be between 5 and 200 characters'),
    
    body('legalBasis')
        .optional()
        .isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'])
        .withMessage('Legal basis must be valid GDPR basis'),
    
    body('formVersion')
        .optional()
        .matches(/^\d+\.\d+$/)
        .withMessage('Form version must be in format X.Y'),
    
    body('language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Language code must be 2-5 characters'),
    
    body('method')
        .optional()
        .isIn(['click', 'signature', 'verbal', 'written'])
        .withMessage('Consent method must be valid'),
    
    body('doubleOptIn')
        .optional()
        .isBoolean()
        .withMessage('Double opt-in flag must be boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Consent data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for data subject requests
 */
const validateDataSubjectRequest = [
    body('type')
        .isIn(['access', 'rectification', 'erasure', 'portability', 'restrict', 'object'])
        .withMessage('Request type must be valid GDPR right'),
    
    body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
        .trim(),
    
    body('identityProof')
        .optional()
        .isBase64()
        .withMessage('Identity proof must be base64 encoded'),
    
    body('communicationMethod')
        .optional()
        .isIn(['email', 'postal', 'secure_portal'])
        .withMessage('Communication method must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Data subject request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for breach reporting
 */
const validateBreachData = [
    body('discoveredAt')
        .isISO8601()
        .withMessage('Discovery date must be in valid ISO 8601 format')
        .custom((value) => {
            const discoveryDate = new Date(value);
            const now = new Date();
            const maxPastDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
            
            if (discoveryDate > now) {
                throw new Error('Discovery date cannot be in the future');
            }
            
            if (discoveryDate < maxPastDate) {
                throw new Error('Discovery date cannot be more than 30 days ago');
            }
            
            return true;
        }),
    
    body('description')
        .isLength({ min: 20, max: 2000 })
        .withMessage('Description must be between 20 and 2000 characters')
        .trim(),
    
    body('affectedDataTypes')
        .isArray({ min: 1 })
        .withMessage('At least one affected data type is required'),
    
    body('affectedDataTypes.*')
        .isIn([
            'personal', 'financial', 'health', 'biometric', 'location',
            'contact', 'behavioral', 'professional', 'criminal', 'other'
        ])
        .withMessage('Each affected data type must be valid'),
    
    body('affectedRecords')
        .isInt({ min: 1, max: 1000000000 })
        .withMessage('Affected records must be between 1 and 1,000,000,000'),
    
    body('containmentActions')
        .optional()
        .isArray()
        .withMessage('Containment actions must be an array'),
    
    body('containmentActions.*')
        .optional()
        .isLength({ min: 5, max: 500 })
        .withMessage('Each containment action must be between 5 and 500 characters'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Breach data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for token operations
 */
const validateTokenData = [
    body('token')
        .optional()
        .isJWT()
        .withMessage('Token must be a valid JWT'),
    
    body('purpose')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Purpose must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Purpose can only contain letters, numbers, underscores, and hyphens'),
    
    body('expiresIn')
        .optional()
        .matches(/^(\d+[smhdw])|(\d+)$/)
        .withMessage('Expires in must be a valid time format (e.g., 1h, 30m, 7d)'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Token data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for code generation
 */
const validateCodeGeneration = [
    body('length')
        .optional()
        .isInt({ min: 4, max: 20 })
        .withMessage('Code length must be between 4 and 20'),
    
    body('type')
        .optional()
        .isIn(['numeric', 'alphanumeric', 'alphabetic', 'uppercase'])
        .withMessage('Code type must be valid'),
    
    body('purpose')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Purpose must be between 3 and 100 characters')
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Code generation validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for encryption operations
 */
const validateEncryptionData = [
    body('plaintext')
        .optional()
        .isLength({ min: 1, max: 10000 })
        .withMessage('Plaintext must be between 1 and 10,000 characters'),
    
    body('additionalData')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Additional data cannot exceed 1,000 characters'),
    
    body('encryptedData')
        .optional()
        .isObject()
        .withMessage('Encrypted data must be an object'),
    
    body('encryptedData.encrypted')
        .optional()
        .isHexadecimal()
        .withMessage('Encrypted data must be hexadecimal'),
    
    body('encryptedData.iv')
        .optional()
        .isHexadecimal()
        .withMessage('IV must be hexadecimal'),
    
    body('encryptedData.authTag')
        .optional()
        .isHexadecimal()
        .withMessage('Auth tag must be hexadecimal'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Encryption data validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for security parameters
 */
const validateSecurityParams = [
    param('kycId')
        .optional()
        .isUUID()
        .withMessage('KYC ID must be a valid UUID'),
    
    param('complianceId')
        .optional()
        .isUUID()
        .withMessage('Compliance ID must be a valid UUID'),
    
    query('timeframe')
        .optional()
        .isIn(['1h', '6h', '24h', '7d', '30d'])
        .withMessage('Timeframe must be valid'),
    
    query('reportType')
        .optional()
        .isIn(['comprehensive', 'summary', 'executive', 'technical'])
        .withMessage('Report type must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Security parameter validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Custom validation for file uploads in security context
 */
const validateSecureFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const file = req.file || req.files[0];
    
    // Security-specific file validation
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'File type not allowed for security operations'
        });
    }

    // Check file size (max 10MB for security documents)
    if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            message: 'File size exceeds 10MB limit'
        });
    }

    // Check for suspicious file characteristics
    const suspiciousPatterns = [
        /\.exe$/i,
        /\.scr$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.com$/i,
        /\.pif$/i,
        /\.vbs$/i,
        /\.js$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
        return res.status(400).json({
            success: false,
            message: 'Suspicious file type detected'
        });
    }

    next();
};

module.exports = {
    validateSecurityData,
    validateKYCData,
    validateComplianceData,
    validateConsentData,
    validateDataSubjectRequest,
    validateBreachData,
    validateTokenData,
    validateCodeGeneration,
    validateEncryptionData,
    validateSecurityParams,
    validateSecureFileUpload
};