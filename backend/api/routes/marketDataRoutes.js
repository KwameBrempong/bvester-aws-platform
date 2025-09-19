/**
 * BVESTER MARKET DATA API ROUTES
 * Real-time market data, analysis, and insights for African investment opportunities
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');
const admin = require('firebase-admin');
const winston = require('winston');
const axios = require('axios');

const router = express.Router();
const db = admin.firestore();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/market-data-routes.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// MARKET DATA ENDPOINTS
// ============================================================================

/**
 * Get African market overview
 */
router.get('/africa-overview', authenticateToken, async (req, res) => {
  try {
    // This would typically fetch from multiple data sources
    // For now, we'll return mock data with real structure
    
    const marketData = {
      regions: {
        west_africa: {
          name: 'West Africa',
          countries: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Mali'],
          totalMarketCap: 850000000000, // $850B
          gdpGrowthRate: 3.2,
          topSectors: ['fintech', 'agriculture', 'renewable_energy'],
          investmentOpportunities: 156,
          activeDeals: 23
        },
        east_africa: {
          name: 'East Africa',
          countries: ['Kenya', 'Ethiopia', 'Uganda', 'Tanzania', 'Rwanda'],
          totalMarketCap: 420000000000, // $420B
          gdpGrowthRate: 4.1,
          topSectors: ['agriculture', 'fintech', 'healthcare'],
          investmentOpportunities: 98,
          activeDeals: 18
        },
        southern_africa: {
          name: 'Southern Africa',
          countries: ['South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Namibia'],
          totalMarketCap: 680000000000, // $680B
          gdpGrowthRate: 2.8,
          topSectors: ['mining', 'fintech', 'renewable_energy'],
          investmentOpportunities: 74,
          activeDeals: 12
        },
        north_africa: {
          name: 'North Africa',
          countries: ['Egypt', 'Morocco', 'Tunisia', 'Algeria', 'Libya'],
          totalMarketCap: 920000000000, // $920B
          gdpGrowthRate: 3.5,
          topSectors: ['manufacturing', 'agriculture', 'technology'],
          investmentOpportunities: 87,
          activeDeals: 15
        }
      },
      topCountries: [
        {
          name: 'Nigeria',
          region: 'West Africa',
          gdp: 440000000000,
          populationMillions: 218,
          easeOfDoingBusiness: 131,
          investmentOpportunities: 89,
          topSectors: ['fintech', 'agriculture', 'e_commerce']
        },
        {
          name: 'South Africa',
          region: 'Southern Africa',
          gdp: 420000000000,
          populationMillions: 60,
          easeOfDoingBusiness: 84,
          investmentOpportunities: 67,
          topSectors: ['fintech', 'mining', 'renewable_energy']
        },
        {
          name: 'Egypt',
          region: 'North Africa',
          gdp: 470000000000,
          populationMillions: 104,
          easeOfDoingBusiness: 114,
          investmentOpportunities: 52,
          topSectors: ['manufacturing', 'agriculture', 'tourism']
        },
        {
          name: 'Kenya',
          region: 'East Africa',
          gdp: 110000000000,
          populationMillions: 54,
          easeOfDoingBusiness: 56,
          investmentOpportunities: 78,
          topSectors: ['agriculture', 'fintech', 'healthcare']
        }
      ],
      sectorAnalysis: {
        fintech: {
          totalMarketSize: 45000000000, // $45B
          growthRate: 23.5,
          activeCompanies: 1200,
          totalFunding: 2800000000, // $2.8B
          topCountries: ['Nigeria', 'Kenya', 'South Africa', 'Egypt']
        },
        agriculture: {
          totalMarketSize: 180000000000, // $180B
          growthRate: 8.2,
          activeCompanies: 3400,
          totalFunding: 890000000, // $890M
          topCountries: ['Nigeria', 'Kenya', 'Ethiopia', 'Ghana']
        },
        renewable_energy: {
          totalMarketSize: 25000000000, // $25B
          growthRate: 15.8,
          activeCompanies: 650,
          totalFunding: 3200000000, // $3.2B
          topCountries: ['South Africa', 'Morocco', 'Kenya', 'Egypt']
        },
        healthcare: {
          totalMarketSize: 35000000000, // $35B
          growthRate: 12.4,
          activeCompanies: 890,
          totalFunding: 1500000000, // $1.5B
          topCountries: ['Nigeria', 'Kenya', 'South Africa', 'Rwanda']
        }
      },
      lastUpdated: new Date().toISOString()
    };

    logger.info('Africa market overview requested', {
      userId: req.user.uid
    });

    res.json({
      success: true,
      data: marketData
    });

  } catch (error) {
    logger.error('Error fetching Africa market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview',
      error: error.message
    });
  }
});

/**
 * Get sector analysis
 */
router.get('/sectors/:sector', authenticateToken, async (req, res) => {
  try {
    const { sector } = req.params;
    const { country, period = '1y' } = req.query;

    // Mock sector data - in production, this would come from market data providers
    const sectorData = {
      fintech: {
        overview: {
          marketSize: 45000000000,
          growthRate: 23.5,
          totalCompanies: 1200,
          totalFunding: 2800000000,
          averageDealSize: 2300000
        },
        trends: {
          paymentSolutions: { growth: 28.4, marketShare: 35 },
          digitalLending: { growth: 31.2, marketShare: 22 },
          insurtech: { growth: 18.7, marketShare: 12 },
          wealthtech: { growth: 25.1, marketShare: 8 },
          regtech: { growth: 22.3, marketShare: 6 }
        },
        keyPlayers: [
          { name: 'Flutterwave', country: 'Nigeria', valuation: 3000000000 },
          { name: 'Paystack', country: 'Nigeria', valuation: 200000000 },
          { name: 'M-Pesa', country: 'Kenya', valuation: 4100000000 },
          { name: 'Jumo', country: 'South Africa', valuation: 120000000 }
        ],
        investmentOpportunities: 89,
        riskFactors: [
          'Regulatory uncertainty',
          'Currency volatility',
          'Infrastructure challenges',
          'Talent shortage'
        ]
      },
      agriculture: {
        overview: {
          marketSize: 180000000000,
          growthRate: 8.2,
          totalCompanies: 3400,
          totalFunding: 890000000,
          averageDealSize: 260000
        },
        trends: {
          agritech: { growth: 15.6, marketShare: 18 },
          supplyChain: { growth: 12.3, marketShare: 25 },
          irrigation: { growth: 9.8, marketShare: 22 },
          seeds: { growth: 7.4, marketShare: 35 }
        },
        keyPlayers: [
          { name: 'Twiga Foods', country: 'Kenya', valuation: 87000000 },
          { name: 'Thrive Agric', country: 'Nigeria', valuation: 56000000 },
          { name: 'Aerobotics', country: 'South Africa', valuation: 17000000 }
        ],
        investmentOpportunities: 156,
        riskFactors: [
          'Climate change impact',
          'Limited access to credit',
          'Infrastructure gaps',
          'Market fragmentation'
        ]
      },
      renewable_energy: {
        overview: {
          marketSize: 25000000000,
          growthRate: 15.8,
          totalCompanies: 650,
          totalFunding: 3200000000,
          averageDealSize: 4900000
        },
        trends: {
          solar: { growth: 18.2, marketShare: 45 },
          wind: { growth: 12.7, marketShare: 28 },
          hydro: { growth: 8.9, marketShare: 15 },
          biomass: { growth: 14.3, marketShare: 12 }
        },
        keyPlayers: [
          { name: 'M-KOPA', country: 'Kenya', valuation: 120000000 },
          { name: 'd.light', country: 'Multi-country', valuation: 95000000 },
          { name: 'Lumos', country: 'Nigeria', valuation: 90000000 }
        ],
        investmentOpportunities: 74,
        riskFactors: [
          'Policy changes',
          'Grid integration challenges',
          'Technology costs',
          'Financing gaps'
        ]
      }
    };

    const data = sectorData[sector];
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Sector data not found'
      });
    }

    // Filter by country if specified
    if (country) {
      data.keyPlayers = data.keyPlayers.filter(player => 
        player.country.toLowerCase().includes(country.toLowerCase())
      );
    }

    logger.info(`Sector analysis requested: ${sector}`, {
      userId: req.user.uid,
      country,
      period
    });

    res.json({
      success: true,
      data: {
        sector,
        ...data,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching sector analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sector analysis',
      error: error.message
    });
  }
});

/**
 * Get country profile
 */
router.get('/countries/:country', authenticateToken, async (req, res) => {
  try {
    const { country } = req.params;
    
    // Mock country data - in production, this would come from various APIs
    const countryProfiles = {
      nigeria: {
        basicInfo: {
          name: 'Nigeria',
          capital: 'Abuja',
          population: 218000000,
          gdp: 440000000000,
          gdpPerCapita: 2020,
          currency: 'NGN',
          mainLanguages: ['English', 'Hausa', 'Yoruba', 'Igbo']
        },
        businessEnvironment: {
          easeOfDoingBusiness: 131,
          corporateTaxRate: 30,
          startupCosts: 850,
          timeToStartBusiness: 19.5,
          investorProtectionIndex: 6.0
        },
        economicIndicators: {
          gdpGrowthRate: 3.2,
          inflationRate: 15.7,
          unemploymentRate: 33.3,
          currentAccountBalance: -4200000000
        },
        investmentLandscape: {
          totalVCFunding: 1800000000, // $1.8B in 2023
          totalDeals: 189,
          averageDealSize: 9500000,
          activeVCFunds: 45,
          unicorns: 2,
          topSectors: ['fintech', 'e_commerce', 'logistics', 'healthtech']
        },
        infrastructure: {
          internetPenetration: 51.2,
          mobilePenetration: 98.7,
          electricityAccess: 62.3,
          roadDensity: 196, // km per 1000 sq km
          ports: ['Lagos', 'Port Harcourt', 'Calabar']
        },
        opportunities: {
          count: 89,
          sectors: {
            fintech: 32,
            agriculture: 18,
            healthcare: 14,
            education: 12,
            e_commerce: 13
          }
        },
        challenges: [
          'Regulatory uncertainty',
          'Infrastructure gaps',
          'Currency volatility',
          'Security concerns',
          'Power supply issues'
        ]
      },
      kenya: {
        basicInfo: {
          name: 'Kenya',
          capital: 'Nairobi',
          population: 54000000,
          gdp: 110000000000,
          gdpPerCapita: 2040,
          currency: 'KES',
          mainLanguages: ['English', 'Swahili']
        },
        businessEnvironment: {
          easeOfDoingBusiness: 56,
          corporateTaxRate: 30,
          startupCosts: 450,
          timeToStartBusiness: 21.0,
          investorProtectionIndex: 6.8
        },
        economicIndicators: {
          gdpGrowthRate: 4.1,
          inflationRate: 7.9,
          unemploymentRate: 5.7,
          currentAccountBalance: -5100000000
        },
        investmentLandscape: {
          totalVCFunding: 890000000, // $890M in 2023
          totalDeals: 156,
          averageDealSize: 5700000,
          activeVCFunds: 28,
          unicorns: 1,
          topSectors: ['agriculture', 'fintech', 'cleantech', 'healthtech']
        },
        infrastructure: {
          internetPenetration: 29.0,
          mobilePenetration: 116.9,
          electricityAccess: 75.4,
          roadDensity: 177,
          ports: ['Mombasa', 'Kilifi']
        },
        opportunities: {
          count: 78,
          sectors: {
            agriculture: 28,
            fintech: 22,
            healthcare: 12,
            education: 8,
            cleantech: 8
          }
        },
        challenges: [
          'Limited access to credit',
          'Drought and climate change',
          'Youth unemployment',
          'Infrastructure needs'
        ]
      }
    };

    const countryKey = country.toLowerCase();
    const data = countryProfiles[countryKey];
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Country profile not found'
      });
    }

    logger.info(`Country profile requested: ${country}`, {
      userId: req.user.uid
    });

    res.json({
      success: true,
      data: {
        ...data,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching country profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country profile',
      error: error.message
    });
  }
});

/**
 * Get investment trends
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { period = '1y', sector, country } = req.query;

    const trendsData = {
      fundingTrends: {
        totalFunding: {
          '2024': 4200000000,
          '2023': 3800000000,
          '2022': 3200000000,
          '2021': 2100000000
        },
        dealCount: {
          '2024': 450,
          '2023': 423,
          '2022': 389,
          '2021': 312
        },
        averageDealSize: {
          '2024': 9300000,
          '2023': 8900000,
          '2022': 8200000,
          '2021': 6700000
        }
      },
      sectorTrends: {
        fintech: {
          fundingGrowth: 28.4,
          dealGrowth: 15.2,
          marketShare: 35.8
        },
        agriculture: {
          fundingGrowth: 18.7,
          dealGrowth: 22.1,
          marketShare: 18.3
        },
        healthcare: {
          fundingGrowth: 34.2,
          dealGrowth: 19.8,
          marketShare: 12.4
        },
        cleantech: {
          fundingGrowth: 45.6,
          dealGrowth: 31.2,
          marketShare: 8.9
        }
      },
      stageDistribution: {
        seed: { percentage: 45.2, averageSize: 250000 },
        series_a: { percentage: 28.7, averageSize: 3200000 },
        series_b: { percentage: 15.8, averageSize: 12500000 },
        series_c: { percentage: 7.3, averageSize: 35000000 },
        growth: { percentage: 3.0, averageSize: 85000000 }
      },
      emergingOpportunities: [
        {
          sector: 'climate_tech',
          description: 'Climate adaptation and mitigation solutions',
          potentialMarketSize: 15000000000,
          currentFunding: 450000000,
          growthRate: 67.8
        },
        {
          sector: 'edtech',
          description: 'Educational technology and digital learning',
          potentialMarketSize: 8500000000,
          currentFunding: 180000000,
          growthRate: 52.3
        },
        {
          sector: 'mobility',
          description: 'Transportation and logistics solutions',
          potentialMarketSize: 12000000000,
          currentFunding: 320000000,
          growthRate: 41.7
        }
      ],
      riskFactors: {
        macroeconomic: {
          currencyVolatility: 'high',
          inflationRisk: 'medium',
          politicalStability: 'medium'
        },
        marketSpecific: {
          regulatoryUncertainty: 'high',
          infrastructureGaps: 'high',
          talentAvailability: 'medium'
        }
      }
    };

    logger.info('Investment trends requested', {
      userId: req.user.uid,
      period,
      sector,
      country
    });

    res.json({
      success: true,
      data: {
        ...trendsData,
        period,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching investment trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment trends',
      error: error.message
    });
  }
});

/**
 * Get market alerts and news
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { severity, category } = req.query;

    const alerts = [
      {
        id: '1',
        title: 'Nigerian Central Bank Updates Fintech Regulations',
        severity: 'medium',
        category: 'regulatory',
        description: 'New guidelines for payment service providers announced',
        impact: 'Affects fintech companies operating in Nigeria',
        date: new Date('2024-01-15'),
        relevantSectors: ['fintech'],
        relevantCountries: ['Nigeria']
      },
      {
        id: '2',
        title: 'Kenya Announces $500M Climate Investment Fund',
        severity: 'low',
        category: 'opportunity',
        description: 'New government-backed fund for climate solutions',
        impact: 'Significant funding opportunity for cleantech startups',
        date: new Date('2024-01-12'),
        relevantSectors: ['cleantech', 'agriculture'],
        relevantCountries: ['Kenya']
      },
      {
        id: '3',
        title: 'Currency Volatility Alert: West African Markets',
        severity: 'high',
        category: 'market_risk',
        description: 'Increased volatility in NGN and GHS currencies',
        impact: 'May affect investment returns and valuations',
        date: new Date('2024-01-10'),
        relevantSectors: ['all'],
        relevantCountries: ['Nigeria', 'Ghana']
      }
    ].filter(alert => {
      if (severity && alert.severity !== severity) return false;
      if (category && alert.category !== category) return false;
      return true;
    });

    logger.info('Market alerts requested', {
      userId: req.user.uid,
      severity,
      category
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    logger.error('Error fetching market alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market alerts',
      error: error.message
    });
  }
});

/**
 * Create market alert (Admin only)
 */
router.post('/alerts', 
  authenticateToken, 
  requireRole('admin'),
  [
    body('title').isLength({ min: 1 }).withMessage('Title required'),
    body('severity').isIn(['low', 'medium', 'high']).withMessage('Invalid severity'),
    body('category').isIn(['regulatory', 'market_risk', 'opportunity', 'economic']).withMessage('Invalid category')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const alertData = {
        ...req.body,
        id: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await db.collection('market_alerts').add(alertData);

      logger.info(`Market alert created: ${alertData.title}`, {
        createdBy: req.user.uid,
        severity: alertData.severity
      });

      res.status(201).json({
        success: true,
        message: 'Market alert created successfully',
        data: alertData
      });

    } catch (error) {
      logger.error('Error creating market alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create market alert',
        error: error.message
      });
    }
  }
);

module.exports = router;