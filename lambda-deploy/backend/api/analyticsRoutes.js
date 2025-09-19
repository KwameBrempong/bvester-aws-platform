/**
 * Advanced Analytics API Routes for Bvester Platform
 * RESTful endpoints for BI reports, data visualization, dashboards, and exports
 * Week 12 Implementation - Advanced Analytics System
 */

const express = require('express');
const router = express.Router();
const AdvancedAnalyticsService = require('../services/analyticsService');
const DataVisualizationService = require('../services/dataVisualizationService');
const { authMiddleware, businessOwnerMiddleware, analystMiddleware } = require('../middleware/auth');
const { validateAnalyticsRequest, validateDashboardConfig } = require('../middleware/analyticsValidation');

// Initialize services
const analyticsService = new AdvancedAnalyticsService();
const visualizationService = new DataVisualizationService();

/**
 * @route   POST /api/analytics/track-event
 * @desc    Track custom analytics event with Mixpanel
 * @access  Authenticated Users
 */
router.post('/track-event', authMiddleware, validateAnalyticsRequest, async (req, res) => {
    try {
        const { eventName, properties } = req.body;
        
        const result = await analyticsService.trackMixpanelEvent(
            eventName,
            req.user.id,
            {
                ...properties,
                businessId: req.user.businessId,
                userType: req.user.role,
                sessionId: req.sessionID,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        );

        res.json({
            success: true,
            message: 'Event tracked successfully',
            data: {
                eventId: result.eventId,
                eventName: result.eventName,
                timestamp: result.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to track event',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/analytics/initialize-ga4
 * @desc    Initialize Google Analytics 4 tracking for business
 * @access  Business Owner
 */
router.post('/initialize-ga4', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { websiteUrl } = req.body;

        if (!websiteUrl) {
            return res.status(400).json({
                success: false,
                message: 'Website URL is required'
            });
        }

        const trackingConfig = await analyticsService.initializeGA4Tracking(
            req.user.businessId,
            websiteUrl
        );

        res.json({
            success: true,
            message: 'GA4 tracking initialized successfully',
            data: {
                propertyId: trackingConfig.propertyId,
                customDimensions: trackingConfig.customDimensions,
                customMetrics: trackingConfig.customMetrics,
                conversionEvents: trackingConfig.conversionEvents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to initialize GA4 tracking',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/analytics/reports/generate
 * @desc    Generate comprehensive BI report
 * @access  Business Owner or Analyst
 */
router.post('/reports/generate', authMiddleware, async (req, res) => {
    try {
        const { reportType, dateRange } = req.body;

        // Validate access permissions
        if (req.user.role !== 'business-owner' && req.user.role !== 'analyst' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to generate reports'
            });
        }

        const businessId = req.body.businessId || req.user.businessId;
        const parsedDateRange = dateRange ? {
            startDate: new Date(dateRange.startDate),
            endDate: new Date(dateRange.endDate)
        } : {};

        const report = await analyticsService.generateBIReport(
            businessId,
            reportType,
            parsedDateRange
        );

        res.json({
            success: true,
            message: 'BI report generated successfully',
            data: {
                reportId: report.id,
                reportType: report.reportType,
                businessId: report.businessId,
                dateRange: report.dateRange,
                generatedAt: report.generatedAt,
                insights: report.insights,
                recommendations: report.recommendations,
                summary: this.generateReportSummary(report.data, reportType)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate BI report',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/reports/:reportId
 * @desc    Get specific analytics report
 * @access  Business Owner or Analyst
 */
router.get('/reports/:reportId', authMiddleware, async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = analyticsService.reports.get(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check access permissions
        if (report.businessId !== req.user.businessId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this report'
            });
        }

        res.json({
            success: true,
            message: 'Report retrieved successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve report',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/reports/:reportId/export
 * @desc    Export analytics report in various formats
 * @access  Business Owner or Analyst
 */
router.get('/reports/:reportId/export', authMiddleware, async (req, res) => {
    try {
        const { reportId } = req.params;
        const { format = 'xlsx' } = req.query;

        const exportData = await analyticsService.exportAnalyticsData(reportId, format);

        res.setHeader('Content-Type', this.getContentType(format));
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        res.setHeader('Content-Length', exportData.size);

        if (format === 'json') {
            res.json(exportData.data);
        } else {
            res.send(exportData.buffer);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export report',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/analytics/dashboards/create
 * @desc    Create custom dashboard with widgets
 * @access  Business Owner or Analyst
 */
router.post('/dashboards/create', authMiddleware, validateDashboardConfig, async (req, res) => {
    try {
        const dashboardConfig = {
            ...req.body,
            businessId: req.user.businessId,
            createdBy: req.user.id
        };

        const dashboard = await analyticsService.createCustomDashboard(
            req.user.businessId,
            dashboardConfig
        );

        res.status(201).json({
            success: true,
            message: 'Custom dashboard created successfully',
            data: {
                dashboardId: dashboard.id,
                name: dashboard.name,
                widgetCount: dashboard.widgets.length,
                createdAt: dashboard.createdAt,
                refreshInterval: dashboard.refreshInterval
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create custom dashboard',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/dashboards/:dashboardId
 * @desc    Get dashboard configuration and data
 * @access  Authenticated Users
 */
router.get('/dashboards/:dashboardId', authMiddleware, async (req, res) => {
    try {
        const { dashboardId } = req.params;
        const dashboard = analyticsService.dashboards.get(dashboardId);

        if (!dashboard) {
            return res.status(404).json({
                success: false,
                message: 'Dashboard not found'
            });
        }

        // Check access permissions
        if (dashboard.businessId !== req.user.businessId && 
            !dashboard.permissions.includes(req.user.role) && 
            !dashboard.isPublic) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this dashboard'
            });
        }

        res.json({
            success: true,
            message: 'Dashboard retrieved successfully',
            data: {
                id: dashboard.id,
                name: dashboard.name,
                description: dashboard.description,
                widgets: dashboard.widgets.map(widget => ({
                    id: widget.id,
                    type: widget.type,
                    title: widget.title,
                    position: widget.position,
                    refreshInterval: widget.refreshInterval
                })),
                updatedAt: dashboard.updatedAt,
                refreshInterval: dashboard.refreshInterval
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/analytics/visualizations/chart
 * @desc    Generate data visualization chart
 * @access  Authenticated Users
 */
router.post('/visualizations/chart', authMiddleware, async (req, res) => {
    try {
        const { chartType, data, options } = req.body;

        if (!chartType || !data) {
            return res.status(400).json({
                success: false,
                message: 'Chart type and data are required'
            });
        }

        let chart;
        switch (chartType) {
            case 'investment_trends':
                chart = await visualizationService.generateInvestmentTrendsChart(data, options);
                break;
            case 'region_distribution':
                chart = await visualizationService.generateRegionDistributionChart(data, options);
                break;
            case 'portfolio_performance':
                chart = await visualizationService.generatePortfolioPerformanceChart(data, options);
                break;
            case 'conversion_funnel':
                chart = await visualizationService.generateConversionFunnelChart(data, options);
                break;
            case 'engagement_heatmap':
                chart = await visualizationService.generateUserEngagementHeatmap(data, options);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Unsupported chart type: ${chartType}`
                });
        }

        res.json({
            success: true,
            message: 'Chart generated successfully',
            data: {
                chartId: chart.id,
                chartType: chart.type,
                generatedAt: chart.generatedAt,
                imageUrl: chart.svg ? null : `/api/analytics/visualizations/${chart.id}/image`,
                svgData: chart.svg || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate chart',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/visualizations/:chartId/image
 * @desc    Get chart image
 * @access  Authenticated Users
 */
router.get('/visualizations/:chartId/image', authMiddleware, async (req, res) => {
    try {
        const { chartId } = req.params;
        const chart = visualizationService.getChart(chartId);

        if (!chart) {
            return res.status(404).json({
                success: false,
                message: 'Chart not found'
            });
        }

        if (!chart.buffer) {
            return res.status(400).json({
                success: false,
                message: 'Chart image not available'
            });
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', chart.buffer.length);
        res.send(chart.buffer);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chart image',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/analytics/visualizations/widget
 * @desc    Generate dashboard widget
 * @access  Authenticated Users
 */
router.post('/visualizations/widget', authMiddleware, async (req, res) => {
    try {
        const widgetConfig = {
            ...req.body,
            businessId: req.user.businessId,
            createdBy: req.user.id
        };

        const widget = await visualizationService.generateDashboardWidget(widgetConfig);

        res.json({
            success: true,
            message: 'Widget generated successfully',
            data: {
                widgetId: widget.id,
                type: widget.type,
                title: widget.title,
                component: widget.component,
                position: widget.position,
                refreshInterval: widget.refreshInterval
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate widget',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/kpis/business/:businessId
 * @desc    Get key performance indicators for business
 * @access  Business Owner or Analyst
 */
router.get('/kpis/business/:businessId', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { timeframe = '30d' } = req.query;

        // Check permissions
        if (businessId !== req.user.businessId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to business KPIs'
            });
        }

        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        switch (timeframe) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        // Generate KPI report
        const kpiReport = await analyticsService.generateBIReport(
            businessId,
            'investment_performance',
            { startDate, endDate }
        );

        const kpis = {
            totalInvestments: {
                value: kpiReport.data.overview.totalInvestments,
                change: this.calculateKPIChange(kpiReport.data.trends.monthlyGrowth),
                trend: 'up',
                target: null
            },
            totalInvestmentValue: {
                value: kpiReport.data.overview.totalInvestmentValue,
                change: this.calculateKPIChange(kpiReport.data.trends.monthlyGrowth),
                trend: 'up',
                target: 1000000
            },
            conversionRate: {
                value: kpiReport.data.overview.conversionRate,
                change: Math.random() * 10 - 5, // Mock change
                trend: 'stable',
                target: 15
            },
            activeInvestors: {
                value: kpiReport.data.overview.activeInvestors,
                change: Math.random() * 20 - 10, // Mock change
                trend: 'up',
                target: null
            },
            averageInvestmentSize: {
                value: kpiReport.data.overview.averageInvestmentSize,
                change: Math.random() * 15 - 7.5, // Mock change
                trend: 'stable',
                target: 25000
            }
        };

        res.json({
            success: true,
            message: 'Business KPIs retrieved successfully',
            data: {
                businessId: businessId,
                timeframe: timeframe,
                dateRange: { startDate, endDate },
                kpis: kpis,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve business KPIs',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/insights/african-market
 * @desc    Get African market insights and trends
 * @access  Authenticated Users
 */
router.get('/insights/african-market', authMiddleware, async (req, res) => {
    try {
        const { region, timeframe = '90d' } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(timeframe.replace('d', '')));

        const marketReport = await analyticsService.generateBIReport(
            'global', // Use global scope for market analysis
            'african_market_analysis',
            { startDate, endDate }
        );

        let insights = marketReport.data;

        // Filter by region if specified
        if (region && insights.regionalBreakdown) {
            insights.regionalBreakdown = insights.regionalBreakdown.filter(
                r => r.region.toLowerCase() === region.toLowerCase()
            );
        }

        res.json({
            success: true,
            message: 'African market insights retrieved successfully',
            data: {
                timeframe: timeframe,
                region: region || 'all',
                dateRange: { startDate, endDate },
                insights: insights,
                generatedAt: marketReport.generatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve African market insights',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/analytics/visualizations/:chartId
 * @desc    Delete generated chart
 * @access  Authenticated Users
 */
router.delete('/visualizations/:chartId', authMiddleware, async (req, res) => {
    try {
        const { chartId } = req.params;
        
        const deleted = visualizationService.deleteChart(chartId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Chart not found'
            });
        }

        res.json({
            success: true,
            message: 'Chart deleted successfully',
            data: {
                chartId: chartId,
                deletedAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete chart',
            error: error.message
        });
    }
});

// Helper methods
function generateReportSummary(data, reportType) {
    switch (reportType) {
        case 'investment_performance':
            return {
                totalInvestments: data.overview?.totalInvestments || 0,
                totalValue: data.overview?.totalInvestmentValue || 0,
                conversionRate: data.overview?.conversionRate || 0,
                topRegion: data.demographics?.byRegion ? 
                    Object.keys(data.demographics.byRegion)[0] : 'N/A'
            };
        case 'user_engagement':
            return {
                totalUsers: data.userMetrics?.totalActiveUsers || 0,
                retentionRate: data.userMetrics?.userRetentionRate || 0,
                avgEngagementTime: data.userMetrics?.averageEngagementTime || 0,
                topPage: data.behaviorFlows?.topPages?.[0]?.page || 'N/A'
            };
        default:
            return {};
    }
}

function getContentType(format) {
    switch (format.toLowerCase()) {
        case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'pdf':
            return 'application/pdf';
        case 'csv':
            return 'text/csv';
        case 'json':
            return 'application/json';
        default:
            return 'application/octet-stream';
    }
}

function calculateKPIChange(monthlyData) {
    if (!monthlyData || Object.keys(monthlyData).length < 2) return 0;
    
    const months = Object.keys(monthlyData).sort();
    const currentMonth = monthlyData[months[months.length - 1]];
    const previousMonth = monthlyData[months[months.length - 2]];
    
    if (!previousMonth || previousMonth === 0) return 0;
    return ((currentMonth - previousMonth) / previousMonth) * 100;
}

module.exports = router;