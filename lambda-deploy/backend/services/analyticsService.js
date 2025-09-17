/**
 * Advanced Analytics Service for Bvester Platform
 * Business Intelligence with Google Analytics 4, Mixpanel, and custom reporting
 * Week 12 Implementation - Advanced Analytics System
 */

const { GoogleAnalyticsData } = require('@google-analytics/data');
const Mixpanel = require('mixpanel');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class AdvancedAnalyticsService {
    constructor() {
        // Google Analytics 4 Configuration
        this.ga4Client = new GoogleAnalyticsData({
            keyFilename: process.env.GA4_SERVICE_ACCOUNT_KEY,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        this.ga4PropertyId = process.env.GA4_PROPERTY_ID;

        // Mixpanel Configuration
        this.mixpanel = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN, {
            debug: process.env.NODE_ENV === 'development',
            protocol: 'https'
        });

        // Internal analytics storage
        this.customEvents = new Map();
        this.dashboards = new Map();
        this.reports = new Map();
        this.kpiTracking = new Map();
        
        // African market regions for localized analytics
        this.africanRegions = {
            'west': ['NG', 'GH', 'SN', 'ML', 'BF', 'CI', 'GN', 'SL', 'LR'],
            'east': ['KE', 'UG', 'TZ', 'RW', 'ET', 'DJ', 'SO', 'SS'],
            'south': ['ZA', 'BW', 'ZW', 'ZM', 'MW', 'MZ', 'SZ', 'LS'],
            'north': ['EG', 'LY', 'TN', 'DZ', 'MA', 'SD'],
            'central': ['CM', 'CF', 'TD', 'CG', 'CD', 'GQ', 'GA', 'AO']
        };
    }

    /**
     * Initialize Google Analytics 4 tracking for business events
     */
    async initializeGA4Tracking(businessId, websiteUrl) {
        try {
            const trackingConfig = {
                propertyId: this.ga4PropertyId,
                businessId: businessId,
                websiteUrl: websiteUrl,
                customDimensions: {
                    'business_id': businessId,
                    'user_type': 'custom_dimension_1',
                    'investment_type': 'custom_dimension_2',
                    'african_region': 'custom_dimension_3',
                    'funding_stage': 'custom_dimension_4'
                },
                customMetrics: {
                    'investment_amount': 'custom_metric_1',
                    'funding_goal': 'custom_metric_2',
                    'portfolio_value': 'custom_metric_3',
                    'roi_percentage': 'custom_metric_4'
                },
                enhancedEcommerce: {
                    enabled: true,
                    currencyCode: 'USD'
                },
                conversionEvents: [
                    'investment_completed',
                    'business_funded',
                    'portfolio_milestone',
                    'document_signed',
                    'kyc_completed'
                ]
            };

            return trackingConfig;
        } catch (error) {
            throw new Error(`Failed to initialize GA4 tracking: ${error.message}`);
        }
    }

    /**
     * Track business and investment events with Mixpanel
     */
    async trackMixpanelEvent(eventName, userId, properties = {}) {
        try {
            // Enhance properties with African market context
            const enhancedProperties = {
                ...properties,
                timestamp: new Date().toISOString(),
                platform: 'bvester',
                environment: process.env.NODE_ENV,
                african_region: this.getAfricanRegion(properties.country),
                user_segment: this.determineUserSegment(properties),
                session_id: properties.sessionId || uuidv4()
            };

            // Track event in Mixpanel
            this.mixpanel.track(eventName, {
                distinct_id: userId,
                ...enhancedProperties
            });

            // Store custom event locally for advanced analytics
            const customEvent = {
                id: uuidv4(),
                eventName,
                userId,
                properties: enhancedProperties,
                timestamp: new Date(),
                processed: false
            };

            if (!this.customEvents.has(eventName)) {
                this.customEvents.set(eventName, []);
            }
            this.customEvents.get(eventName).push(customEvent);

            return {
                success: true,
                eventId: customEvent.id,
                eventName,
                timestamp: customEvent.timestamp
            };
        } catch (error) {
            throw new Error(`Failed to track Mixpanel event: ${error.message}`);
        }
    }

    /**
     * Determine African region from country code
     */
    getAfricanRegion(countryCode) {
        if (!countryCode) return 'unknown';
        
        for (const [region, countries] of Object.entries(this.africanRegions)) {
            if (countries.includes(countryCode.toUpperCase())) {
                return region;
            }
        }
        return 'other';
    }

    /**
     * Determine user segment for analytics
     */
    determineUserSegment(properties) {
        if (properties.userType === 'business-owner') {
            if (properties.fundingStage === 'pre-seed') return 'early_stage_entrepreneur';
            if (properties.fundingStage === 'seed') return 'growth_stage_business';
            if (properties.fundingStage === 'series_a') return 'established_business';
            return 'business_owner';
        }
        
        if (properties.userType === 'investor') {
            if (properties.investmentAmount && properties.investmentAmount > 100000) return 'high_value_investor';
            if (properties.investmentAmount && properties.investmentAmount > 10000) return 'medium_investor';
            return 'retail_investor';
        }
        
        return 'general_user';
    }

    /**
     * Generate comprehensive business intelligence reports
     */
    async generateBIReport(businessId, reportType, dateRange = {}) {
        try {
            const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = dateRange.endDate || new Date();

            let reportData = {};

            switch (reportType) {
                case 'investment_performance':
                    reportData = await this.generateInvestmentPerformanceReport(businessId, startDate, endDate);
                    break;
                case 'user_engagement':
                    reportData = await this.generateUserEngagementReport(businessId, startDate, endDate);
                    break;
                case 'conversion_funnel':
                    reportData = await this.generateConversionFunnelReport(businessId, startDate, endDate);
                    break;
                case 'african_market_analysis':
                    reportData = await this.generateAfricanMarketReport(businessId, startDate, endDate);
                    break;
                case 'financial_health_trends':
                    reportData = await this.generateFinancialHealthReport(businessId, startDate, endDate);
                    break;
                default:
                    throw new Error(`Unknown report type: ${reportType}`);
            }

            const report = {
                id: uuidv4(),
                businessId,
                reportType,
                dateRange: { startDate, endDate },
                generatedAt: new Date(),
                data: reportData,
                insights: this.generateInsights(reportData, reportType),
                recommendations: this.generateRecommendations(reportData, reportType)
            };

            this.reports.set(report.id, report);
            return report;
        } catch (error) {
            throw new Error(`Failed to generate BI report: ${error.message}`);
        }
    }

    /**
     * Generate investment performance report
     */
    async generateInvestmentPerformanceReport(businessId, startDate, endDate) {
        // Query GA4 for investment-related metrics
        const ga4Data = await this.queryGA4Data(businessId, [
            'sessions',
            'users',
            'bounceRate',
            'averageSessionDuration',
            'conversions'
        ], startDate, endDate);

        // Query Mixpanel for investment events
        const mixpanelData = await this.queryMixpanelData(businessId, [
            'investment_initiated',
            'investment_completed',
            'portfolio_updated',
            'roi_calculated'
        ], startDate, endDate);

        return {
            overview: {
                totalInvestments: mixpanelData.investment_completed?.length || 0,
                totalInvestmentValue: this.calculateTotalInvestmentValue(mixpanelData.investment_completed),
                averageInvestmentSize: this.calculateAverageInvestmentSize(mixpanelData.investment_completed),
                conversionRate: this.calculateConversionRate(mixpanelData.investment_initiated, mixpanelData.investment_completed),
                activeInvestors: this.countUniqueInvestors(mixpanelData.investment_completed)
            },
            trends: {
                weeklyInvestments: this.groupDataByWeek(mixpanelData.investment_completed),
                monthlyGrowth: this.calculateGrowthRate(mixpanelData.investment_completed),
                seasonalPatterns: this.analyzeSeasonalPatterns(mixpanelData.investment_completed)
            },
            demographics: {
                byRegion: this.groupByAfricanRegion(mixpanelData.investment_completed),
                byInvestorType: this.groupByInvestorType(mixpanelData.investment_completed),
                byInvestmentAmount: this.groupByInvestmentAmount(mixpanelData.investment_completed)
            },
            performance: {
                roiMetrics: this.calculateROIMetrics(mixpanelData.roi_calculated),
                portfolioPerformance: this.analyzePortfolioPerformance(mixpanelData.portfolio_updated),
                benchmarkComparison: this.compareToBenchmarks(mixpanelData)
            }
        };
    }

    /**
     * Generate user engagement report
     */
    async generateUserEngagementReport(businessId, startDate, endDate) {
        const ga4Data = await this.queryGA4Data(businessId, [
            'activeUsers',
            'newUsers',
            'returningUsers',
            'userEngagementDuration',
            'engagedSessions'
        ], startDate, endDate);

        const mixpanelData = await this.queryMixpanelData(businessId, [
            'page_view',
            'button_click',
            'form_submit',
            'document_view',
            'vr_tour_start'
        ], startDate, endDate);

        return {
            userMetrics: {
                totalActiveUsers: ga4Data.activeUsers || 0,
                newUsers: ga4Data.newUsers || 0,
                returningUsers: ga4Data.returningUsers || 0,
                userRetentionRate: this.calculateRetentionRate(ga4Data),
                averageEngagementTime: ga4Data.userEngagementDuration || 0
            },
            engagement: {
                pageViews: mixpanelData.page_view?.length || 0,
                interactions: mixpanelData.button_click?.length || 0,
                formSubmissions: mixpanelData.form_submit?.length || 0,
                documentViews: mixpanelData.document_view?.length || 0,
                vrTourEngagement: mixpanelData.vr_tour_start?.length || 0
            },
            behaviorFlows: {
                topPages: this.getTopPages(mixpanelData.page_view),
                userJourneys: this.analyzeUserJourneys(mixpanelData),
                dropOffPoints: this.identifyDropOffPoints(mixpanelData)
            },
            segmentation: {
                byUserType: this.segmentByUserType(mixpanelData),
                byGeography: this.segmentByGeography(mixpanelData),
                byDeviceType: this.segmentByDeviceType(mixpanelData)
            }
        };
    }

    /**
     * Generate conversion funnel report
     */
    async generateConversionFunnelReport(businessId, startDate, endDate) {
        const funnelEvents = [
            'landing_page_view',
            'business_profile_view',
            'investment_interest',
            'kyc_started',
            'kyc_completed',
            'investment_initiated',
            'investment_completed'
        ];

        const funnelData = {};
        for (const event of funnelEvents) {
            const eventData = await this.queryMixpanelData(businessId, [event], startDate, endDate);
            funnelData[event] = eventData[event] || [];
        }

        return {
            funnelSteps: funnelEvents.map((event, index) => ({
                step: index + 1,
                eventName: event,
                count: funnelData[event].length,
                conversionRate: index === 0 ? 100 : 
                    (funnelData[event].length / funnelData[funnelEvents[0]].length) * 100,
                dropOffRate: index === 0 ? 0 : 
                    ((funnelData[funnelEvents[index - 1]].length - funnelData[event].length) / 
                     funnelData[funnelEvents[index - 1]].length) * 100
            })),
            insights: {
                overallConversionRate: (funnelData.investment_completed.length / funnelData.landing_page_view.length) * 100,
                biggestDropOff: this.findBiggestDropOff(funnelData, funnelEvents),
                timeToConvert: this.calculateTimeToConvert(funnelData),
                regionalVariations: this.analyzeFunnelByRegion(funnelData)
            }
        };
    }

    /**
     * Generate African market analysis report
     */
    async generateAfricanMarketReport(businessId, startDate, endDate) {
        const marketData = await this.queryMixpanelData(businessId, [
            'investment_completed',
            'business_registered',
            'user_registration'
        ], startDate, endDate);

        return {
            regionalBreakdown: Object.keys(this.africanRegions).map(region => ({
                region: region,
                countries: this.africanRegions[region],
                totalUsers: this.countUsersByRegion(marketData.user_registration, region),
                totalBusinesses: this.countBusinessesByRegion(marketData.business_registered, region),
                totalInvestments: this.countInvestmentsByRegion(marketData.investment_completed, region),
                marketPenetration: this.calculateMarketPenetration(region, marketData),
                growthRate: this.calculateRegionalGrowthRate(region, marketData)
            })),
            topCountries: this.getTopAfricanCountries(marketData),
            marketTrends: {
                emergingMarkets: this.identifyEmergingMarkets(marketData),
                seasonality: this.analyzeAfricanSeasonality(marketData),
                economicIndicators: this.correlateWithEconomicData(marketData)
            },
            opportunities: {
                underservedRegions: this.identifyUnderservedRegions(marketData),
                highGrowthSegments: this.identifyHighGrowthSegments(marketData),
                partnershipOpportunities: this.identifyPartnershipOpportunities(marketData)
            }
        };
    }

    /**
     * Create custom dashboard with KPI tracking
     */
    async createCustomDashboard(businessId, dashboardConfig) {
        try {
            const dashboardId = uuidv4();
            const dashboard = {
                id: dashboardId,
                businessId: businessId,
                name: dashboardConfig.name || 'Custom Dashboard',
                description: dashboardConfig.description || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                widgets: [],
                refreshInterval: dashboardConfig.refreshInterval || 300000, // 5 minutes
                permissions: dashboardConfig.permissions || ['owner'],
                isPublic: dashboardConfig.isPublic || false
            };

            // Add KPI widgets
            if (dashboardConfig.kpis) {
                for (const kpi of dashboardConfig.kpis) {
                    const widget = await this.createKPIWidget(kpi);
                    dashboard.widgets.push(widget);
                }
            }

            // Add chart widgets
            if (dashboardConfig.charts) {
                for (const chart of dashboardConfig.charts) {
                    const widget = await this.createChartWidget(chart);
                    dashboard.widgets.push(widget);
                }
            }

            // Add table widgets
            if (dashboardConfig.tables) {
                for (const table of dashboardConfig.tables) {
                    const widget = await this.createTableWidget(table);
                    dashboard.widgets.push(widget);
                }
            }

            this.dashboards.set(dashboardId, dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to create custom dashboard: ${error.message}`);
        }
    }

    /**
     * Create KPI widget for dashboard
     */
    async createKPIWidget(kpiConfig) {
        const widget = {
            id: uuidv4(),
            type: 'kpi',
            title: kpiConfig.title,
            metric: kpiConfig.metric,
            dataSource: kpiConfig.dataSource || 'mixpanel',
            filters: kpiConfig.filters || {},
            format: kpiConfig.format || 'number',
            position: kpiConfig.position || { x: 0, y: 0, w: 3, h: 2 },
            refreshInterval: kpiConfig.refreshInterval || 300000,
            target: kpiConfig.target || null,
            thresholds: kpiConfig.thresholds || {
                excellent: { min: 90, color: '#4CAF50' },
                good: { min: 70, color: '#FFC107' },
                poor: { min: 0, color: '#F44336' }
            }
        };

        return widget;
    }

    /**
     * Create chart widget for dashboard
     */
    async createChartWidget(chartConfig) {
        const widget = {
            id: uuidv4(),
            type: 'chart',
            title: chartConfig.title,
            chartType: chartConfig.chartType || 'line', // line, bar, pie, area
            dataSource: chartConfig.dataSource || 'mixpanel',
            query: chartConfig.query,
            xAxis: chartConfig.xAxis,
            yAxis: chartConfig.yAxis,
            groupBy: chartConfig.groupBy,
            filters: chartConfig.filters || {},
            position: chartConfig.position || { x: 0, y: 0, w: 6, h: 4 },
            refreshInterval: chartConfig.refreshInterval || 300000,
            colors: chartConfig.colors || ['#2196F3', '#4CAF50', '#FF9800', '#F44336']
        };

        return widget;
    }

    /**
     * Export analytics data in various formats
     */
    async exportAnalyticsData(reportId, format = 'xlsx') {
        try {
            const report = this.reports.get(reportId);
            if (!report) {
                throw new Error('Report not found');
            }

            switch (format.toLowerCase()) {
                case 'xlsx':
                    return await this.exportToExcel(report);
                case 'pdf':
                    return await this.exportToPDF(report);
                case 'csv':
                    return await this.exportToCSV(report);
                case 'json':
                    return await this.exportToJSON(report);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to export analytics data: ${error.message}`);
        }
    }

    /**
     * Export report to Excel format
     */
    async exportToExcel(report) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Bvester Analytics';
        workbook.created = new Date();

        // Summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.addRow(['Report Type', report.reportType]);
        summarySheet.addRow(['Business ID', report.businessId]);
        summarySheet.addRow(['Generated At', report.generatedAt.toISOString()]);
        summarySheet.addRow(['Date Range', `${report.dateRange.startDate.toISOString()} to ${report.dateRange.endDate.toISOString()}`]);

        // Data sheets based on report type
        if (report.reportType === 'investment_performance') {
            this.addInvestmentDataToExcel(workbook, report.data);
        } else if (report.reportType === 'user_engagement') {
            this.addEngagementDataToExcel(workbook, report.data);
        }

        // Insights sheet
        const insightsSheet = workbook.addWorksheet('Insights');
        insightsSheet.addRow(['Key Insights']);
        report.insights.forEach(insight => {
            insightsSheet.addRow([insight]);
        });

        // Recommendations sheet
        const recommendationsSheet = workbook.addWorksheet('Recommendations');
        recommendationsSheet.addRow(['Recommendations']);
        report.recommendations.forEach(recommendation => {
            recommendationsSheet.addRow([recommendation]);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return {
            format: 'xlsx',
            filename: `${report.reportType}_${report.businessId}_${Date.now()}.xlsx`,
            buffer: buffer,
            size: buffer.length
        };
    }

    /**
     * Export report to PDF format
     */
    async exportToPDF(report) {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {});

        // Header
        doc.fontSize(20).text('Bvester Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Report Type: ${report.reportType}`);
        doc.text(`Business ID: ${report.businessId}`);
        doc.text(`Generated: ${report.generatedAt.toLocaleDateString()}`);
        doc.moveDown();

        // Key metrics (simplified for PDF)
        if (report.data.overview) {
            doc.fontSize(16).text('Overview', { underline: true });
            doc.fontSize(12);
            Object.entries(report.data.overview).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`);
            });
            doc.moveDown();
        }

        // Insights
        if (report.insights && report.insights.length > 0) {
            doc.fontSize(16).text('Key Insights', { underline: true });
            doc.fontSize(12);
            report.insights.forEach((insight, index) => {
                doc.text(`${index + 1}. ${insight}`);
            });
            doc.moveDown();
        }

        // Recommendations
        if (report.recommendations && report.recommendations.length > 0) {
            doc.fontSize(16).text('Recommendations', { underline: true });
            doc.fontSize(12);
            report.recommendations.forEach((rec, index) => {
                doc.text(`${index + 1}. ${rec}`);
            });
        }

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    format: 'pdf',
                    filename: `${report.reportType}_${report.businessId}_${Date.now()}.pdf`,
                    buffer: buffer,
                    size: buffer.length
                });
            });
        });
    }

    // Helper methods for data analysis
    calculateTotalInvestmentValue(investments = []) {
        return investments.reduce((total, investment) => {
            return total + (investment.properties?.investmentAmount || 0);
        }, 0);
    }

    calculateAverageInvestmentSize(investments = []) {
        if (investments.length === 0) return 0;
        return this.calculateTotalInvestmentValue(investments) / investments.length;
    }

    calculateConversionRate(initiated = [], completed = []) {
        if (initiated.length === 0) return 0;
        return (completed.length / initiated.length) * 100;
    }

    countUniqueInvestors(investments = []) {
        const uniqueInvestors = new Set();
        investments.forEach(investment => {
            if (investment.userId) {
                uniqueInvestors.add(investment.userId);
            }
        });
        return uniqueInvestors.size;
    }

    groupDataByWeek(data = []) {
        const weeklyData = {};
        data.forEach(item => {
            const week = this.getWeekKey(item.timestamp);
            if (!weeklyData[week]) {
                weeklyData[week] = [];
            }
            weeklyData[week].push(item);
        });
        return weeklyData;
    }

    getWeekKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }

    generateInsights(data, reportType) {
        const insights = [];
        
        if (reportType === 'investment_performance' && data.overview) {
            if (data.overview.conversionRate > 15) {
                insights.push('Excellent conversion rate indicates strong investor interest');
            } else if (data.overview.conversionRate < 5) {
                insights.push('Low conversion rate suggests need for improved investor acquisition');
            }
            
            if (data.overview.averageInvestmentSize > 25000) {
                insights.push('High average investment size indicates premium investor segment');
            }
        }
        
        return insights;
    }

    generateRecommendations(data, reportType) {
        const recommendations = [];
        
        if (reportType === 'investment_performance' && data.overview) {
            if (data.overview.conversionRate < 10) {
                recommendations.push('Focus on improving investment onboarding process');
                recommendations.push('Consider targeted investor education campaigns');
            }
            
            if (data.demographics?.byRegion) {
                const topRegion = Object.entries(data.demographics.byRegion)
                    .sort(([,a], [,b]) => b.length - a.length)[0];
                if (topRegion) {
                    recommendations.push(`Consider expanding marketing efforts in ${topRegion[0]} region`);
                }
            }
        }
        
        return recommendations;
    }

    // Mock methods for GA4 and Mixpanel data queries (to be implemented with actual APIs)
    async queryGA4Data(businessId, metrics, startDate, endDate) {
        // Mock GA4 data - implement actual GA4 API calls
        return {
            sessions: Math.floor(Math.random() * 10000),
            users: Math.floor(Math.random() * 5000),
            bounceRate: Math.random() * 100,
            averageSessionDuration: Math.random() * 300,
            conversions: Math.floor(Math.random() * 100)
        };
    }

    async queryMixpanelData(businessId, events, startDate, endDate) {
        // Mock Mixpanel data - implement actual Mixpanel API calls
        const mockData = {};
        events.forEach(event => {
            mockData[event] = Array.from({ length: Math.floor(Math.random() * 100) }, (_, i) => ({
                id: uuidv4(),
                userId: `user_${Math.floor(Math.random() * 1000)}`,
                timestamp: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
                properties: {
                    businessId: businessId,
                    country: ['NG', 'KE', 'GH', 'ZA'][Math.floor(Math.random() * 4)],
                    investmentAmount: Math.floor(Math.random() * 100000),
                    userType: ['business-owner', 'investor'][Math.floor(Math.random() * 2)]
                }
            }));
        });
        return mockData;
    }
}

module.exports = AdvancedAnalyticsService;