/**
 * Analytics Validation Middleware for Bvester Platform
 * Input validation for analytics tracking, reports, and dashboards
 * Week 12 Implementation - Advanced Analytics System
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for analytics event tracking
 */
const validateAnalyticsRequest = [
    body('eventName')
        .notEmpty()
        .withMessage('Event name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Event name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Event name can only contain letters, numbers, underscores, dots, and hyphens')
        .trim(),
    
    body('properties')
        .optional()
        .isObject()
        .withMessage('Properties must be an object')
        .custom((properties) => {
            // Validate properties object structure
            if (properties && typeof properties === 'object') {
                const keys = Object.keys(properties);
                if (keys.length > 50) {
                    throw new Error('Maximum 50 properties allowed per event');
                }
                
                for (const key of keys) {
                    if (key.length > 100) {
                        throw new Error('Property keys cannot exceed 100 characters');
                    }
                    
                    const value = properties[key];
                    if (typeof value === 'string' && value.length > 1000) {
                        throw new Error('Property values cannot exceed 1000 characters');
                    }
                    
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        throw new Error('Nested objects are not allowed in properties');
                    }
                }
            }
            return true;
        }),
    
    body('properties.investmentAmount')
        .optional()
        .isNumeric()
        .withMessage('Investment amount must be numeric')
        .custom((value) => {
            if (parseFloat(value) < 0) {
                throw new Error('Investment amount cannot be negative');
            }
            if (parseFloat(value) > 10000000) {
                throw new Error('Investment amount cannot exceed $10,000,000');
            }
            return true;
        }),
    
    body('properties.country')
        .optional()
        .isLength({ min: 2, max: 2 })
        .withMessage('Country must be a 2-character ISO code')
        .isAlpha()
        .withMessage('Country code must contain only letters')
        .toUpperCase(),
    
    body('properties.userType')
        .optional()
        .isIn(['business-owner', 'investor', 'analyst', 'admin', 'viewer'])
        .withMessage('User type must be valid'),
    
    body('properties.fundingStage')
        .optional()
        .isIn(['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'ipo'])
        .withMessage('Funding stage must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Analytics validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for BI report generation
 */
const validateReportRequest = [
    body('reportType')
        .notEmpty()
        .withMessage('Report type is required')
        .isIn([
            'investment_performance',
            'user_engagement',
            'conversion_funnel',
            'african_market_analysis',
            'financial_health_trends',
            'portfolio_analytics',
            'esg_impact'
        ])
        .withMessage('Report type must be valid'),
    
    body('businessId')
        .optional()
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    body('dateRange')
        .optional()
        .isObject()
        .withMessage('Date range must be an object'),
    
    body('dateRange.startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in valid ISO 8601 format')
        .custom((value, { req }) => {
            const startDate = new Date(value);
            const now = new Date();
            const maxPastDate = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years ago
            
            if (startDate > now) {
                throw new Error('Start date cannot be in the future');
            }
            
            if (startDate < maxPastDate) {
                throw new Error('Start date cannot be more than 2 years ago');
            }
            
            return true;
        }),
    
    body('dateRange.endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in valid ISO 8601 format')
        .custom((value, { req }) => {
            const endDate = new Date(value);
            const now = new Date();
            
            if (endDate > now) {
                throw new Error('End date cannot be in the future');
            }
            
            if (req.body.dateRange && req.body.dateRange.startDate) {
                const startDate = new Date(req.body.dateRange.startDate);
                if (endDate <= startDate) {
                    throw new Error('End date must be after start date');
                }
                
                const daysDifference = (endDate - startDate) / (1000 * 60 * 60 * 24);
                if (daysDifference > 365) {
                    throw new Error('Date range cannot exceed 365 days');
                }
            }
            
            return true;
        }),
    
    body('filters')
        .optional()
        .isObject()
        .withMessage('Filters must be an object'),
    
    body('filters.region')
        .optional()
        .isIn(['west', 'east', 'south', 'north', 'central'])
        .withMessage('Region must be a valid African region'),
    
    body('filters.investmentType')
        .optional()
        .isIn(['equity', 'loan', 'revenue-share', 'convertible'])
        .withMessage('Investment type must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Report request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for dashboard configuration
 */
const validateDashboardConfig = [
    body('name')
        .notEmpty()
        .withMessage('Dashboard name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Dashboard name must be between 1 and 100 characters')
        .trim(),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    
    body('refreshInterval')
        .optional()
        .isInt({ min: 60000, max: 3600000 })
        .withMessage('Refresh interval must be between 60 seconds and 1 hour (in milliseconds)'),
    
    body('permissions')
        .optional()
        .isArray()
        .withMessage('Permissions must be an array'),
    
    body('permissions.*')
        .optional()
        .isIn(['owner', 'admin', 'analyst', 'viewer', 'business-owner', 'investor'])
        .withMessage('Each permission must be a valid role'),
    
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean'),
    
    body('kpis')
        .optional()
        .isArray({ max: 20 })
        .withMessage('Maximum 20 KPIs allowed per dashboard'),
    
    body('kpis.*.title')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('KPI title must be between 1 and 100 characters'),
    
    body('kpis.*.metric')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('KPI metric must be between 1 and 50 characters'),
    
    body('kpis.*.dataSource')
        .optional()
        .isIn(['mixpanel', 'ga4', 'internal', 'custom'])
        .withMessage('KPI data source must be valid'),
    
    body('kpis.*.format')
        .optional()
        .isIn(['number', 'currency', 'percentage', 'compact'])
        .withMessage('KPI format must be valid'),
    
    body('charts')
        .optional()
        .isArray({ max: 10 })
        .withMessage('Maximum 10 charts allowed per dashboard'),
    
    body('charts.*.title')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Chart title must be between 1 and 100 characters'),
    
    body('charts.*.chartType')
        .optional()
        .isIn(['line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'heatmap'])
        .withMessage('Chart type must be valid'),
    
    body('tables')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 tables allowed per dashboard'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dashboard configuration validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for chart generation
 */
const validateChartRequest = [
    body('chartType')
        .notEmpty()
        .withMessage('Chart type is required')
        .isIn([
            'investment_trends',
            'region_distribution',
            'portfolio_performance',
            'conversion_funnel',
            'engagement_heatmap',
            'financial_health',
            'esg_scores'
        ])
        .withMessage('Chart type must be valid'),
    
    body('data')
        .notEmpty()
        .withMessage('Chart data is required')
        .isObject()
        .withMessage('Chart data must be an object'),
    
    body('data.labels')
        .optional()
        .isArray({ max: 100 })
        .withMessage('Maximum 100 data labels allowed'),
    
    body('data.values')
        .optional()
        .isArray({ max: 100 })
        .withMessage('Maximum 100 data values allowed'),
    
    body('data.datasets')
        .optional()
        .isArray({ max: 10 })
        .withMessage('Maximum 10 datasets allowed per chart'),
    
    body('options')
        .optional()
        .isObject()
        .withMessage('Chart options must be an object'),
    
    body('options.title')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Chart title must be between 1 and 200 characters'),
    
    body('options.width')
        .optional()
        .isInt({ min: 200, max: 2000 })
        .withMessage('Chart width must be between 200 and 2000 pixels'),
    
    body('options.height')
        .optional()
        .isInt({ min: 200, max: 2000 })
        .withMessage('Chart height must be between 200 and 2000 pixels'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Chart request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for widget configuration
 */
const validateWidgetConfig = [
    body('type')
        .notEmpty()
        .withMessage('Widget type is required')
        .isIn(['kpi', 'chart', 'table', 'map', 'text', 'gauge'])
        .withMessage('Widget type must be valid'),
    
    body('title')
        .notEmpty()
        .withMessage('Widget title is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Widget title must be between 1 and 100 characters')
        .trim(),
    
    body('position')
        .optional()
        .isObject()
        .withMessage('Widget position must be an object'),
    
    body('position.x')
        .optional()
        .isInt({ min: 0, max: 24 })
        .withMessage('Widget x position must be between 0 and 24'),
    
    body('position.y')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Widget y position must be between 0 and 100'),
    
    body('position.w')
        .optional()
        .isInt({ min: 1, max: 24 })
        .withMessage('Widget width must be between 1 and 24 grid units'),
    
    body('position.h')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Widget height must be between 1 and 20 grid units'),
    
    body('data')
        .optional()
        .isObject()
        .withMessage('Widget data must be an object'),
    
    body('config')
        .optional()
        .isObject()
        .withMessage('Widget config must be an object'),
    
    body('refreshInterval')
        .optional()
        .isInt({ min: 30000, max: 3600000 })
        .withMessage('Refresh interval must be between 30 seconds and 1 hour'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Widget configuration validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for export requests
 */
const validateExportRequest = [
    param('reportId')
        .isUUID()
        .withMessage('Report ID must be a valid UUID'),
    
    query('format')
        .optional()
        .isIn(['xlsx', 'pdf', 'csv', 'json'])
        .withMessage('Export format must be one of: xlsx, pdf, csv, json'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Export request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for KPI requests
 */
const validateKPIRequest = [
    param('businessId')
        .isUUID()
        .withMessage('Business ID must be a valid UUID'),
    
    query('timeframe')
        .optional()
        .isIn(['7d', '30d', '90d', '1y'])
        .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y'),
    
    query('metrics')
        .optional()
        .custom((value) => {
            if (value) {
                const metrics = value.split(',');
                const validMetrics = [
                    'total_investments',
                    'investment_value',
                    'conversion_rate',
                    'active_investors',
                    'average_investment',
                    'portfolio_performance',
                    'user_engagement',
                    'retention_rate'
                ];
                
                for (const metric of metrics) {
                    if (!validMetrics.includes(metric.trim())) {
                        throw new Error(`Invalid metric: ${metric}`);
                    }
                }
                
                if (metrics.length > 10) {
                    throw new Error('Maximum 10 metrics allowed per request');
                }
            }
            return true;
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'KPI request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for African market insights
 */
const validateMarketInsightsRequest = [
    query('region')
        .optional()
        .isIn(['west', 'east', 'south', 'north', 'central'])
        .withMessage('Region must be a valid African region'),
    
    query('timeframe')
        .optional()
        .matches(/^\d+d$/)
        .withMessage('Timeframe must be in format like "30d", "90d"')
        .custom((value) => {
            const days = parseInt(value.replace('d', ''));
            if (days < 7 || days > 730) {
                throw new Error('Timeframe must be between 7 and 730 days');
            }
            return true;
        }),
    
    query('country')
        .optional()
        .isLength({ min: 2, max: 2 })
        .withMessage('Country must be a 2-character ISO code')
        .isAlpha()
        .withMessage('Country code must contain only letters')
        .toUpperCase(),
    
    query('sector')
        .optional()
        .isIn(['agriculture', 'technology', 'manufacturing', 'retail', 'services', 'healthcare', 'energy', 'finance'])
        .withMessage('Sector must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Market insights request validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Validation middleware for GA4 initialization
 */
const validateGA4Request = [
    body('websiteUrl')
        .notEmpty()
        .withMessage('Website URL is required')
        .isURL({ 
            protocols: ['http', 'https'],
            require_protocol: true 
        })
        .withMessage('Website URL must be a valid URL with protocol')
        .custom((value) => {
            // Additional validation for reasonable domains
            const url = new URL(value);
            if (url.hostname === 'localhost' && process.env.NODE_ENV === 'production') {
                throw new Error('Localhost URLs not allowed in production');
            }
            return true;
        }),
    
    body('customDimensions')
        .optional()
        .isObject()
        .withMessage('Custom dimensions must be an object'),
    
    body('customMetrics')
        .optional()
        .isObject()
        .withMessage('Custom metrics must be an object'),
    
    body('conversionEvents')
        .optional()
        .isArray({ max: 30 })
        .withMessage('Maximum 30 conversion events allowed'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'GA4 initialization validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateAnalyticsRequest,
    validateReportRequest,
    validateDashboardConfig,
    validateChartRequest,
    validateWidgetConfig,
    validateExportRequest,
    validateKPIRequest,
    validateMarketInsightsRequest,
    validateGA4Request
};