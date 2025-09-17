/**
 * Document Management Validation Middleware for Bvester Platform
 * Input validation for document uploads, versioning, and signature requests
 * Week 11 Implementation - Document Management System
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for document upload
 */
const validateDocumentUpload = [
    body('businessId')
        .optional()
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    body('title')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters')
        .trim(),
    
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .trim(),
    
    body('documentType')
        .isIn(['legal', 'financial', 'operational', 'marketing', 'general', 'generated', 'signed'])
        .withMessage('Document type must be one of: legal, financial, operational, marketing, general, generated, signed'),
    
    body('category')
        .optional()
        .isIn(['contracts', 'agreements', 'reports', 'presentations', 'images', 'videos', 'certificates', 'uncategorized'])
        .withMessage('Category must be valid'),
    
    body('confidentiality')
        .optional()
        .isIn(['public', 'internal', 'confidential', 'restricted'])
        .withMessage('Confidentiality level must be one of: public, internal, confidential, restricted'),
    
    body('tags')
        .optional()
        .custom((value) => {
            try {
                const tags = JSON.parse(value);
                if (!Array.isArray(tags)) {
                    throw new Error('Tags must be an array');
                }
                if (tags.length > 10) {
                    throw new Error('Maximum 10 tags allowed');
                }
                if (tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
                    throw new Error('Each tag must be a string with maximum 50 characters');
                }
                return true;
            } catch (error) {
                throw new Error(`Invalid tags format: ${error.message}`);
            }
        }),
    
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean'),
    
    body('allowedUsers')
        .optional()
        .custom((value) => {
            try {
                const users = JSON.parse(value);
                if (!Array.isArray(users)) {
                    throw new Error('Allowed users must be an array');
                }
                if (users.length > 100) {
                    throw new Error('Maximum 100 allowed users');
                }
                if (users.some(user => typeof user !== 'string' || !user.match(/^[a-f\d-]{36}$/i))) {
                    throw new Error('Each user ID must be a valid UUID');
                }
                return true;
            } catch (error) {
                throw new Error(`Invalid allowed users format: ${error.message}`);
            }
        }),
    
    body('allowedRoles')
        .optional()
        .custom((value) => {
            try {
                const roles = JSON.parse(value);
                if (!Array.isArray(roles)) {
                    throw new Error('Allowed roles must be an array');
                }
                const validRoles = ['admin', 'business-owner', 'investor', 'analyst', 'viewer'];
                if (roles.some(role => !validRoles.includes(role))) {
                    throw new Error(`Roles must be one of: ${validRoles.join(', ')}`);
                }
                return true;
            } catch (error) {
                throw new Error(`Invalid allowed roles format: ${error.message}`);
            }
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for document template generation
 */
const validateTemplateGeneration = [
    body('templateId')
        .notEmpty()
        .withMessage('Template ID is required')
        .isIn(['investment-agreement', 'loan-agreement', 'revenue-share', 'kyc-form', 'business-plan'])
        .withMessage('Template ID must be valid'),
    
    body('templateData')
        .notEmpty()
        .withMessage('Template data is required')
        .isObject()
        .withMessage('Template data must be an object'),
    
    // Investment Agreement specific validations
    body('templateData.businessName')
        .if(body('templateId').equals('investment-agreement'))
        .notEmpty()
        .withMessage('Business name is required for investment agreement')
        .isLength({ min: 1, max: 100 })
        .withMessage('Business name must be between 1 and 100 characters'),
    
    body('templateData.investorName')
        .if(body('templateId').equals('investment-agreement'))
        .notEmpty()
        .withMessage('Investor name is required for investment agreement')
        .isLength({ min: 1, max: 100 })
        .withMessage('Investor name must be between 1 and 100 characters'),
    
    body('templateData.investmentAmount')
        .if(body('templateId').equals('investment-agreement'))
        .notEmpty()
        .withMessage('Investment amount is required for investment agreement')
        .isNumeric()
        .withMessage('Investment amount must be numeric')
        .custom((value) => {
            if (parseFloat(value) <= 0) {
                throw new Error('Investment amount must be greater than 0');
            }
            return true;
        }),
    
    body('templateData.equityPercentage')
        .if(body('templateId').equals('investment-agreement'))
        .notEmpty()
        .withMessage('Equity percentage is required for investment agreement')
        .isFloat({ min: 0.01, max: 100 })
        .withMessage('Equity percentage must be between 0.01 and 100'),
    
    // Loan Agreement specific validations
    body('templateData.loanAmount')
        .if(body('templateId').equals('loan-agreement'))
        .notEmpty()
        .withMessage('Loan amount is required for loan agreement')
        .isNumeric()
        .withMessage('Loan amount must be numeric')
        .custom((value) => {
            if (parseFloat(value) <= 0) {
                throw new Error('Loan amount must be greater than 0');
            }
            return true;
        }),
    
    body('templateData.interestRate')
        .if(body('templateId').equals('loan-agreement'))
        .notEmpty()
        .withMessage('Interest rate is required for loan agreement')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Interest rate must be between 0 and 100'),
    
    body('templateData.termMonths')
        .if(body('templateId').equals('loan-agreement'))
        .notEmpty()
        .withMessage('Term in months is required for loan agreement')
        .isInt({ min: 1, max: 360 })
        .withMessage('Term must be between 1 and 360 months'),
    
    // KYC Form specific validations
    body('templateData.fullName')
        .if(body('templateId').equals('kyc-form'))
        .notEmpty()
        .withMessage('Full name is required for KYC form')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    
    body('templateData.email')
        .if(body('templateId').equals('kyc-form'))
        .isEmail()
        .withMessage('Valid email is required for KYC form')
        .normalizeEmail(),
    
    body('templateData.phone')
        .if(body('templateId').equals('kyc-form'))
        .notEmpty()
        .withMessage('Phone number is required for KYC form')
        .isMobilePhone()
        .withMessage('Valid phone number is required'),
    
    body('templateData.idNumber')
        .if(body('templateId').equals('kyc-form'))
        .notEmpty()
        .withMessage('ID number is required for KYC form')
        .isLength({ min: 5, max: 50 })
        .withMessage('ID number must be between 5 and 50 characters'),
    
    // Common date validation
    body('templateData.date')
        .optional()
        .isISO8601()
        .withMessage('Date must be in valid ISO 8601 format'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Template validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for signature requests
 */
const validateSignatureRequest = [
    body('signers')
        .isArray({ min: 1, max: 10 })
        .withMessage('Must have 1-10 signers'),
    
    body('signers.*.name')
        .notEmpty()
        .withMessage('Signer name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Signer name must be between 2 and 100 characters')
        .trim(),
    
    body('signers.*.email')
        .isEmail()
        .withMessage('Valid signer email is required')
        .normalizeEmail(),
    
    body('signers.*.role')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Signer role must be between 1 and 50 characters'),
    
    body('signers.*.routingOrder')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Routing order must be between 1 and 10'),
    
    body('signers.*.requireIdVerification')
        .optional()
        .isBoolean()
        .withMessage('ID verification requirement must be boolean'),
    
    body('signers.*.accessCode')
        .optional()
        .isLength({ min: 4, max: 20 })
        .withMessage('Access code must be between 4 and 20 characters'),
    
    body('signers.*.note')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Signer note cannot exceed 500 characters'),
    
    body('signers.*.phoneAuth.number')
        .optional()
        .isMobilePhone()
        .withMessage('Phone authentication number must be valid'),
    
    body('subject')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Subject must be between 1 and 200 characters')
        .trim(),
    
    body('message')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters')
        .trim(),
    
    body('expirationDays')
        .optional()
        .isInt({ min: 1, max: 120 })
        .withMessage('Expiration days must be between 1 and 120'),
    
    body('requireIdVerification')
        .optional()
        .isBoolean()
        .withMessage('ID verification requirement must be boolean'),
    
    body('requireInPerson')
        .optional()
        .isBoolean()
        .withMessage('In-person requirement must be boolean'),
    
    body('allowReassign')
        .optional()
        .isBoolean()
        .withMessage('Reassign allowance must be boolean'),
    
    body('sendReminders')
        .optional()
        .isBoolean()
        .withMessage('Send reminders setting must be boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Signature request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for document search
 */
const validateDocumentSearch = [
    query('query')
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Search query must be between 2 and 200 characters')
        .trim(),
    
    query('documentType')
        .optional()
        .isIn(['legal', 'financial', 'operational', 'marketing', 'general', 'generated', 'signed'])
        .withMessage('Document type must be valid'),
    
    query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Date from must be in valid ISO 8601 format'),
    
    query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Date to must be in valid ISO 8601 format')
        .custom((value, { req }) => {
            if (req.query.dateFrom && new Date(value) <= new Date(req.query.dateFrom)) {
                throw new Error('Date to must be after date from');
            }
            return true;
        }),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('category')
        .optional()
        .isIn(['contracts', 'agreements', 'reports', 'presentations', 'images', 'videos', 'certificates', 'uncategorized'])
        .withMessage('Category must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Search validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for document parameters
 */
const validateDocumentParams = [
    param('documentId')
        .isUUID()
        .withMessage('Document ID must be a valid UUID'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document ID',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for signature request parameters
 */
const validateSignatureParams = [
    param('requestId')
        .isUUID()
        .withMessage('Request ID must be a valid UUID'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for document version creation
 */
const validateVersionCreation = [
    body('changes')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Changes description must be between 1 and 500 characters')
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Version creation validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for signature reminder
 */
const validateSignatureReminder = [
    body('signerEmail')
        .optional()
        .isEmail()
        .withMessage('Signer email must be valid')
        .normalizeEmail(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Reminder validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for signature request void
 */
const validateSignatureVoid = [
    body('reason')
        .notEmpty()
        .withMessage('Void reason is required')
        .isLength({ min: 5, max: 500 })
        .withMessage('Void reason must be between 5 and 500 characters')
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Void request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for download URL generation
 */
const validateDownloadRequest = [
    query('expiration')
        .optional()
        .isInt({ min: 5, max: 1440 })
        .withMessage('Expiration must be between 5 minutes and 24 hours'),
    
    query('returnUrl')
        .optional()
        .isURL()
        .withMessage('Return URL must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Download request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * File validation helper function
 */
const validateFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const file = req.file || req.files[0];
    
    // Additional file validation
    if (file.size === 0) {
        return res.status(400).json({
            success: false,
            message: 'Uploaded file is empty'
        });
    }

    // Check for potentially malicious file names
    const maliciousPatterns = [
        /\.\./,  // Directory traversal
        /[<>:"|?*]/,  // Invalid characters
        /\x00/,  // Null bytes
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i  // Windows reserved names
    ];

    if (maliciousPatterns.some(pattern => pattern.test(file.originalname))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid file name'
        });
    }

    next();
};

module.exports = {
    validateDocumentUpload,
    validateTemplateGeneration,
    validateSignatureRequest,
    validateDocumentSearch,
    validateDocumentParams,
    validateSignatureParams,
    validateVersionCreation,
    validateSignatureReminder,
    validateSignatureVoid,
    validateDownloadRequest,
    validateFileUpload
};