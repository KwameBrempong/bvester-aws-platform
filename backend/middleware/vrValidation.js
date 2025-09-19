/**
 * VR Tour Validation Middleware for Bvester Platform
 * Input validation for VR tours, WebXR sessions, and live demos
 * Week 10 Implementation - VR Integration Setup
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for VR tour initialization
 */
const validateVRTourData = [
    body('businessId')
        .notEmpty()
        .withMessage('Business ID is required')
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    body('tourType')
        .optional()
        .isIn(['360-video', 'webxr', 'panoramic-images'])
        .withMessage('Tour type must be one of: 360-video, webxr, panoramic-images'),
    
    body('options.duration')
        .optional()
        .isInt({ min: 30, max: 1800 })
        .withMessage('Duration must be between 30 seconds and 30 minutes'),
    
    body('options.quality')
        .optional()
        .isIn(['SD', 'HD', '4K', '8K'])
        .withMessage('Quality must be one of: SD, HD, 4K, 8K'),
    
    body('options.interactive')
        .optional()
        .isBoolean()
        .withMessage('Interactive option must be a boolean'),
    
    body('options.audio')
        .optional()
        .isBoolean()
        .withMessage('Audio option must be a boolean'),
    
    body('options.languages')
        .optional()
        .isArray()
        .withMessage('Languages must be an array'),
    
    body('options.languages.*')
        .optional()
        .isLength({ min: 2, max: 3 })
        .withMessage('Language codes must be 2-3 characters'),

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
 * Validation middleware for live demo setup
 */
const validateLiveDemoData = [
    body('businessId')
        .notEmpty()
        .withMessage('Business ID is required')
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    body('scheduledTime')
        .notEmpty()
        .withMessage('Scheduled time is required')
        .isISO8601()
        .withMessage('Scheduled time must be a valid ISO 8601 date')
        .custom((value) => {
            const scheduledDate = new Date(value);
            const now = new Date();
            const maxFuture = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
            
            if (scheduledDate <= now) {
                throw new Error('Scheduled time must be in the future');
            }
            
            if (scheduledDate > maxFuture) {
                throw new Error('Scheduled time cannot be more than 90 days in the future');
            }
            
            return true;
        }),
    
    body('participantEmails')
        .optional()
        .isArray()
        .withMessage('Participant emails must be an array'),
    
    body('participantEmails.*')
        .optional()
        .isEmail()
        .withMessage('Each participant email must be valid')
        .normalizeEmail(),

    body('participantEmails')
        .optional()
        .custom((emails) => {
            if (emails && emails.length > 100) {
                throw new Error('Cannot have more than 100 participants');
            }
            return true;
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
 * Validation middleware for 360° video upload
 */
const validate360VideoData = [
    body('videoAssets')
        .isArray({ min: 1 })
        .withMessage('At least one video asset is required'),
    
    body('videoAssets.*.name')
        .notEmpty()
        .withMessage('Video name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Video name must be 1-100 characters'),
    
    body('videoAssets.*.url')
        .notEmpty()
        .withMessage('Video URL is required')
        .isURL()
        .withMessage('Video URL must be valid'),
    
    body('videoAssets.*.duration')
        .optional()
        .isInt({ min: 10, max: 600 })
        .withMessage('Video duration must be between 10 seconds and 10 minutes'),
    
    body('videoAssets.*.resolution')
        .optional()
        .isIn(['HD', '2K', '4K', '8K'])
        .withMessage('Resolution must be one of: HD, 2K, 4K, 8K'),
    
    body('videoAssets.*.description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('metadata.autoProgress')
        .optional()
        .isBoolean()
        .withMessage('Auto progress must be a boolean'),
    
    body('metadata.allowSkip')
        .optional()
        .isBoolean()
        .withMessage('Allow skip must be a boolean'),
    
    body('metadata.showProgress')
        .optional()
        .isBoolean()
        .withMessage('Show progress must be a boolean'),

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
 * Validation middleware for WebXR session setup
 */
const validateWebXRSessionData = [
    body('deviceCapabilities')
        .notEmpty()
        .withMessage('Device capabilities are required')
        .isObject()
        .withMessage('Device capabilities must be an object'),
    
    body('deviceCapabilities.webxrSupport')
        .isBoolean()
        .withMessage('WebXR support status must be a boolean'),
    
    body('deviceCapabilities.vrHeadset')
        .isBoolean()
        .withMessage('VR headset status must be a boolean'),
    
    body('deviceCapabilities.mobile')
        .isBoolean()
        .withMessage('Mobile status must be a boolean'),
    
    body('deviceCapabilities.recommendedExperience')
        .isIn(['immersive-vr', 'mobile-360', 'desktop-360', 'fallback'])
        .withMessage('Recommended experience must be valid'),
    
    body('sessionPreferences.quality')
        .optional()
        .isIn(['low', 'medium', 'high', 'ultra'])
        .withMessage('Quality preference must be valid'),
    
    body('sessionPreferences.enableHandTracking')
        .optional()
        .isBoolean()
        .withMessage('Hand tracking preference must be a boolean'),
    
    body('sessionPreferences.enableSpatialAudio')
        .optional()
        .isBoolean()
        .withMessage('Spatial audio preference must be a boolean'),

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
 * Validation middleware for tour parameters
 */
const validateTourParams = [
    param('tourId')
        .isUUID()
        .withMessage('Tour ID must be a valid UUID'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tour ID',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for business tour queries
 */
const validateBusinessTourQuery = [
    param('businessId')
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    query('tourType')
        .optional()
        .isIn(['360-video', 'webxr', 'panoramic-images'])
        .withMessage('Tour type must be valid'),
    
    query('status')
        .optional()
        .isIn(['initializing', 'processing', 'ready', 'active', 'paused', 'archived'])
        .withMessage('Status must be valid'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be non-negative'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for tour status updates
 */
const validateTourStatusUpdate = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['initializing', 'processing', 'ready', 'active', 'paused', 'archived'])
        .withMessage('Status must be valid'),
    
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    
    body('metadata.reason')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Reason must be 1-200 characters'),

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
 * Validation middleware for device info
 */
const validateDeviceInfo = [
    body('deviceInfo')
        .optional()
        .isObject()
        .withMessage('Device info must be an object'),
    
    body('deviceInfo.screenWidth')
        .optional()
        .isInt({ min: 320, max: 7680 })
        .withMessage('Screen width must be between 320 and 7680 pixels'),
    
    body('deviceInfo.screenHeight')
        .optional()
        .isInt({ min: 240, max: 4320 })
        .withMessage('Screen height must be between 240 and 4320 pixels'),
    
    body('deviceInfo.devicePixelRatio')
        .optional()
        .isFloat({ min: 0.5, max: 4.0 })
        .withMessage('Device pixel ratio must be between 0.5 and 4.0'),
    
    body('deviceInfo.platform')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Platform must be 1-50 characters'),
    
    body('deviceInfo.webglSupport')
        .optional()
        .isBoolean()
        .withMessage('WebGL support must be a boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid device info',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateVRTourData,
    validateLiveDemoData,
    validate360VideoData,
    validateWebXRSessionData,
    validateTourParams,
    validateBusinessTourQuery,
    validateTourStatusUpdate,
    validateDeviceInfo
};