const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bvester Backend is running!',
    version: '1.0.0',
    platform: 'African SME Investment Platform',
    endpoints: [
      'GET /',
      'GET /health',
      'GET /api/info',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/businesses',
      'GET /api/investments',
      'GET /api/analytics/dashboard',
      // CMS Endpoints
      'GET /api/cms/content',
      'POST /api/cms/content',
      'GET /api/cms/opportunities',
      'POST /api/cms/opportunities',
      'GET /api/cms/sme-profiles',
      'GET /api/cms/analytics',
      // Market Data Endpoints
      'GET /api/market/africa-overview',
      'GET /api/market/sectors/:sector',
      'GET /api/market/countries/:country',
      'GET /api/market/trends',
      'GET /api/market/alerts'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Info
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    name: 'Bvester Backend API',
    description: 'African SME Investment Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    features: [
      'User Authentication',
      'Business Listings',
      'Investment Tracking',
      'AI Matchmaking',
      'ESG Scoring',
      'Payment Processing',
      'Analytics Dashboard'
    ]
  });
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 'user_' + Date.now(),
      email: req.body.email || 'demo@bvester.com',
      type: req.body.type || 'investor',
      verified: false
    },
    token: 'demo_token_' + Date.now()
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 'user_123',
      email: req.body.email || 'demo@bvester.com',
      type: 'investor',
      verified: true
    },
    token: 'demo_token_' + Date.now()
  });
});

// Business endpoints
app.get('/api/businesses', (req, res) => {
  res.json({
    success: true,
    businesses: [
      {
        id: 'biz_001',
        name: 'GreenTech Solutions',
        industry: 'Clean Energy',
        location: 'Lagos, Nigeria',
        fundingGoal: 50000,
        currentFunding: 32000,
        investors: 24,
        esgScore: 8.5,
        description: 'Solar energy solutions for rural communities',
        stage: 'Series A'
      },
      {
        id: 'biz_002',
        name: 'AgriConnect',
        industry: 'Agriculture',
        location: 'Nairobi, Kenya',
        fundingGoal: 75000,
        currentFunding: 45000,
        investors: 18,
        esgScore: 9.2,
        description: 'Digital marketplace connecting farmers to markets',
        stage: 'Seed'
      },
      {
        id: 'biz_003',
        name: 'FinanceForAll',
        industry: 'Fintech',
        location: 'Cape Town, South Africa',
        fundingGoal: 100000,
        currentFunding: 78000,
        investors: 35,
        esgScore: 7.8,
        description: 'Mobile banking for the unbanked',
        stage: 'Series B'
      }
    ],
    total: 3,
    page: 1,
    limit: 10
  });
});

// Investment endpoints
app.get('/api/investments', (req, res) => {
  res.json({
    success: true,
    investments: [
      {
        id: 'inv_001',
        businessId: 'biz_001',
        businessName: 'GreenTech Solutions',
        amount: 5000,
        type: 'equity',
        date: '2025-01-15T00:00:00Z',
        status: 'active',
        returns: 12.5
      },
      {
        id: 'inv_002',
        businessId: 'biz_002',
        businessName: 'AgriConnect',
        amount: 3000,
        type: 'loan',
        date: '2025-01-10T00:00:00Z',
        status: 'active',
        returns: 8.2
      }
    ],
    totalInvested: 8000,
    totalReturns: 1240,
    portfolioValue: 9240
  });
});

// Import route modules
const cmsRoutes = require('./api/routes/cmsRoutes');
const marketDataRoutes = require('./api/routes/marketDataRoutes');

// Use route modules
app.use('/api/cms', cmsRoutes);
app.use('/api/market', marketDataRoutes);

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    analytics: {
      totalBusinesses: 150,
      totalInvestors: 750,
      totalInvestments: 1250000,
      averageInvestment: 5500,
      topIndustries: [
        { name: 'Fintech', count: 45, percentage: 30 },
        { name: 'Agriculture', count: 38, percentage: 25 },
        { name: 'Healthcare', count: 32, percentage: 21 },
        { name: 'Education', count: 25, percentage: 17 },
        { name: 'Clean Energy', count: 10, percentage: 7 }
      ],
      monthlyGrowth: {
        businesses: 12,
        investors: 45,
        investments: 85000
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not available`
  });
});

app.listen(PORT, () => {
  console.log(`Bvester Backend running on port ${PORT}`);
});