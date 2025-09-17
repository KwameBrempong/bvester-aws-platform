#!/usr/bin/env node
/**
 * 🚀 BVESTER BACKEND - DEMO SERVER
 * Standalone demo server showcasing the Bvester platform API
 * without requiring external service connections
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'https://bizinvest-hub-prod.web.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Homepage with API documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚀 Bvester Backend API</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333; min-height: 100vh; padding: 20px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { 
                background: white; border-radius: 12px; padding: 30px;
                margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                text-align: center;
            }
            .header h1 { color: #2d3748; font-size: 2.5rem; margin-bottom: 10px; }
            .header p { color: #4a5568; font-size: 1.2rem; margin-bottom: 20px; }
            .status { 
                display: inline-block; background: #10b981; color: white;
                padding: 8px 16px; border-radius: 20px; font-weight: 600;
            }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { 
                background: white; border-radius: 12px; padding: 25px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1); transition: transform 0.2s;
            }
            .card:hover { transform: translateY(-2px); }
            .card h3 { color: #2d3748; margin-bottom: 15px; font-size: 1.3rem; }
            .endpoint { 
                background: #f7fafc; padding: 12px; border-radius: 8px;
                margin: 8px 0; border-left: 4px solid #667eea;
            }
            .method { 
                display: inline-block; padding: 2px 8px; border-radius: 4px;
                font-size: 0.8rem; font-weight: 600; margin-right: 10px;
            }
            .get { background: #48bb78; color: white; }
            .post { background: #ed8936; color: white; }
            .test-btn { 
                background: #667eea; color: white; padding: 8px 16px;
                border: none; border-radius: 6px; cursor: pointer; text-decoration: none;
                display: inline-block; margin-top: 10px; font-weight: 600;
            }
            .test-btn:hover { background: #5a67d8; }
            .features { 
                display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px; margin-top: 20px;
            }
            .feature { 
                background: #edf2f7; padding: 15px; border-radius: 8px; text-align: center;
            }
            .footer { 
                text-align: center; margin-top: 40px; color: rgba(255,255,255,0.8);
            }
            
            /* Modal styles for API responses */
            .modal {
                display: none; position: fixed; z-index: 1000; left: 0; top: 0;
                width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);
            }
            .modal-content {
                background-color: white; margin: 5% auto; padding: 20px;
                border-radius: 12px; width: 90%; max-width: 800px; max-height: 80vh;
                overflow-y: auto; position: relative;
            }
            .modal-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;
            }
            .modal-title {
                font-size: 1.5rem; font-weight: 600; color: #2d3748;
            }
            .close {
                color: #a0aec0; font-size: 28px; font-weight: bold; cursor: pointer;
                width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
                border-radius: 50%; transition: all 0.2s;
            }
            .close:hover { background-color: #f7fafc; color: #2d3748; }
            .json-response {
                background-color: #1a202c; color: #e2e8f0; padding: 20px;
                border-radius: 8px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap;
            }
            .response-meta {
                background-color: #edf2f7; padding: 15px; border-radius: 8px;
                margin-bottom: 15px; font-size: 14px; color: #4a5568;
            }
            .status-success { color: #38a169; font-weight: 600; }
            .status-error { color: #e53e3e; font-weight: 600; }
            .loading {
                text-align: center; padding: 40px; color: #4a5568;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Bvester Backend API</h1>
                <p>African SME Investment Platform Backend</p>
                <span class="status">✅ Online & Ready</span>
                <div class="features">
                    <div class="feature">
                        <div>🔐</div>
                        <strong>Authentication</strong>
                    </div>
                    <div class="feature">
                        <div>🏢</div>
                        <strong>Business Management</strong>
                    </div>
                    <div class="feature">
                        <div>💰</div>
                        <strong>Investment Tracking</strong>
                    </div>
                    <div class="feature">
                        <div>💳</div>
                        <strong>Payment Processing</strong>
                    </div>
                    <div class="feature">
                        <div>🤖</div>
                        <strong>AI Matching</strong>
                    </div>
                    <div class="feature">
                        <div>🌱</div>
                        <strong>ESG Scoring</strong>
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <h3>🔍 System Status</h3>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/health</code>
                        <button class="test-btn" onclick="testEndpoint('/health')">Test</button>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/info</code>
                        <button class="test-btn" onclick="testEndpoint('/api/info')">Test</button>
                    </div>
                </div>

                <div class="card">
                    <h3>🔐 Authentication</h3>
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/auth/register</code>
                    </div>
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/auth/login</code>
                    </div>
                    <button class="test-btn" onclick="testAuth()">Test Demo Login</button>
                </div>

                <div class="card">
                    <h3>🏢 Business Management</h3>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/businesses</code>
                        <button class="test-btn" onclick="testEndpoint('/api/businesses')">Test</button>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/investments</code>
                        <button class="test-btn" onclick="testEndpoint('/api/investments')">Test</button>
                    </div>
                </div>

                <div class="card">
                    <h3>💳 Payment Processing</h3>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/payments/methods/supported</code>
                        <button class="test-btn" onclick="testEndpoint('/api/payments/methods/supported')">Test</button>
                    </div>
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/payments/process</code>
                    </div>
                </div>

                <div class="card">
                    <h3>🤖 AI & Analytics</h3>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/matching/recommendations/:userId</code>
                        <button class="test-btn" onclick="testEndpoint('/api/matching/recommendations/demo_user_123')">Test</button>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/esg/scores/:businessId</code>
                        <button class="test-btn" onclick="testEndpoint('/api/esg/scores/biz_001')">Test</button>
                    </div>
                </div>

                <div class="card">
                    <h3>📊 Platform Analytics</h3>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/analytics/dashboard</code>
                        <button class="test-btn" onclick="testEndpoint('/api/analytics/dashboard')">Test</button>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/admin/stats</code>
                        <button class="test-btn" onclick="testEndpoint('/api/admin/stats')">Test</button>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>🌍 <strong>Bvester Platform</strong> - Connecting Global Investors with African SMEs</p>
                <p>Built with Node.js, Express, and ❤️ for Africa</p>
            </div>
        </div>

        <!-- API Response Modal -->
        <div id="responseModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="modalTitle">API Response</div>
                    <span class="close" onclick="closeModal()">&times;</span>
                </div>
                <div id="modalBody">
                    <div class="loading">Loading...</div>
                </div>
            </div>
        </div>

        <script>
            // Open modal with API response
            function openModal(title, content) {
                document.getElementById('modalTitle').textContent = title;
                document.getElementById('modalBody').innerHTML = content;
                document.getElementById('responseModal').style.display = 'block';
            }

            // Close modal
            function closeModal() {
                document.getElementById('responseModal').style.display = 'none';
            }

            // Close modal when clicking outside
            window.onclick = function(event) {
                const modal = document.getElementById('responseModal');
                if (event.target === modal) {
                    closeModal();
                }
            }

            // Test API endpoint
            async function testEndpoint(endpoint) {
                const title = \`\${endpoint}\`;
                const loadingContent = '<div class="loading">🔄 Loading API response...</div>';
                openModal(title, loadingContent);

                try {
                    const startTime = Date.now();
                    const response = await fetch(endpoint);
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    const data = await response.json();
                    
                    const statusClass = response.ok ? 'status-success' : 'status-error';
                    const statusText = response.ok ? '✅ Success' : '❌ Error';
                    
                    const content = \`
                        <div class="response-meta">
                            <div><strong>Status:</strong> <span class="\${statusClass}">\${response.status} - \${statusText}</span></div>
                            <div><strong>Response Time:</strong> \${responseTime}ms</div>
                            <div><strong>Content-Type:</strong> \${response.headers.get('content-type') || 'application/json'}</div>
                            <div><strong>Endpoint:</strong> <code>\${endpoint}</code></div>
                        </div>
                        <div class="json-response">\${JSON.stringify(data, null, 2)}</div>
                    \`;
                    
                    document.getElementById('modalBody').innerHTML = content;
                } catch (error) {
                    const errorContent = \`
                        <div class="response-meta">
                            <div><strong>Status:</strong> <span class="status-error">❌ Network Error</span></div>
                            <div><strong>Error:</strong> \${error.message}</div>
                            <div><strong>Endpoint:</strong> <code>\${endpoint}</code></div>
                        </div>
                        <div class="json-response">{\n  "error": "\${error.message}",\n  "type": "NetworkError"\n}</div>
                    \`;
                    document.getElementById('modalBody').innerHTML = errorContent;
                }
            }

            // Test authentication with enhanced display
            async function testAuth() {
                const title = '🔐 Demo Authentication Test';
                const loadingContent = '<div class="loading">🔄 Testing demo login...</div>';
                openModal(title, loadingContent);

                try {
                    const startTime = Date.now();
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'demo@bvester.com',
                            password: 'demo123'
                        })
                    });
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    const data = await response.json();
                    
                    const statusClass = response.ok ? 'status-success' : 'status-error';
                    const statusText = response.ok ? '✅ Login Successful' : '❌ Login Failed';
                    
                    const content = \`
                        <div class="response-meta">
                            <div><strong>Status:</strong> <span class="\${statusClass}">\${statusText}</span></div>
                            <div><strong>Response Time:</strong> \${responseTime}ms</div>
                            <div><strong>Method:</strong> POST</div>
                            <div><strong>Endpoint:</strong> <code>/api/auth/login</code></div>
                            <div><strong>Demo Credentials:</strong> demo@bvester.com / demo123</div>
                        </div>
                        <div class="json-response">\${JSON.stringify(data, null, 2)}</div>
                    \`;
                    
                    document.getElementById('modalBody').innerHTML = content;
                } catch (error) {
                    const errorContent = \`
                        <div class="response-meta">
                            <div><strong>Status:</strong> <span class="status-error">❌ Authentication Error</span></div>
                            <div><strong>Error:</strong> \${error.message}</div>
                        </div>
                        <div class="json-response">{\n  "error": "\${error.message}",\n  "type": "AuthenticationError"\n}</div>
                    \`;
                    document.getElementById('modalBody').innerHTML = errorContent;
                }
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    closeModal();
                }
            });

            // Welcome message
            console.log('🚀 Welcome to Bvester Backend API!');
            console.log('💡 Click any Test button to see API responses in action');
            console.log('📊 This demo showcases 400+ endpoints for African SME investment platform');
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'connected',
      payment_stripe: 'connected',
      payment_flutterwave: 'connected',
      email: 'connected',
      sms: 'connected'
    }
  });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Bvester Platform API',
    version: '1.0.0',
    description: 'African SME Investment Platform Backend',
    endpoints: 400,
    features: [
      'User Authentication & Authorization',
      'Business Profile Management',
      'Investor Dashboard & Portfolio',
      'AI-Powered Matchmaking',
      'ESG Scoring System',
      'Payment Processing (Stripe & Flutterwave)',
      'Document Management',
      'Financial Health Analysis',
      'Investment Tracking',
      'Real-time Notifications',
      'Admin Panel & Analytics',
      'VR Tours Integration',
      'Compliance & KYC'
    ],
    markets_supported: ['Global', 'Africa'],
    payment_methods: ['Credit Cards', 'Bank Transfers', 'Mobile Money', 'Crypto'],
    demo_mode: true
  });
});

// Mock Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 'demo_user_123',
      email: req.body.email || 'demo@bvester.com',
      userType: req.body.userType || 'investor',
      verified: true
    },
    token: 'demo_jwt_token_' + Date.now()
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 'demo_user_123',
      email: req.body.email || 'demo@bvester.com',
      userType: 'investor',
      verified: true
    },
    token: 'demo_jwt_token_' + Date.now()
  });
});

// Mock Business endpoints
app.get('/api/businesses', (req, res) => {
  res.json({
    success: true,
    businesses: [
      {
        id: 'biz_001',
        name: 'GreenTech Solutions',
        industry: 'Renewable Energy',
        location: 'Lagos, Nigeria',
        fundingGoal: 50000,
        currentFunding: 32000,
        investors: 15,
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
        investors: 22,
        esgScore: 9.2,
        description: 'Connecting smallholder farmers to global markets',
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
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      pages: 1
    }
  });
});

// Mock Investment endpoints
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

// Mock Payment endpoints
app.get('/api/payments/methods/supported', (req, res) => {
  res.json({
    success: true,
    methods: {
      stripe: {
        available: true,
        currencies: ['USD', 'EUR', 'GBP'],
        methods: ['card', 'bank_transfer', 'sepa_debit']
      },
      flutterwave: {
        available: true,
        currencies: ['NGN', 'KES', 'GHS', 'ZAR', 'UGX'],
        methods: ['card', 'bank_transfer', 'mobile_money', 'ussd']
      }
    }
  });
});

app.post('/api/payments/process', (req, res) => {
  res.json({
    success: true,
    message: 'Payment processed successfully',
    payment: {
      id: 'pay_demo_' + Date.now(),
      amount: req.body.amount || 1000,
      currency: req.body.currency || 'USD',
      status: 'completed',
      method: req.body.method || 'card',
      timestamp: new Date().toISOString()
    }
  });
});

// Mock AI Matchmaking endpoints
app.get('/api/matching/recommendations/:userId', (req, res) => {
  res.json({
    success: true,
    recommendations: [
      {
        businessId: 'biz_001',
        businessName: 'GreenTech Solutions',
        matchScore: 94,
        reasons: ['ESG alignment', 'Risk profile match', 'Geographic preference'],
        confidence: 'high'
      },
      {
        businessId: 'biz_003',
        businessName: 'FinanceForAll',
        matchScore: 87,
        reasons: ['Industry expertise', 'Investment size match'],
        confidence: 'medium'
      }
    ]
  });
});

// Mock ESG endpoints
app.get('/api/esg/scores/:businessId', (req, res) => {
  res.json({
    success: true,
    esgScore: {
      overall: 8.5,
      environmental: 9.2,
      social: 8.1,
      governance: 8.2,
      breakdown: {
        carbonFootprint: 'Low',
        renewableEnergy: 'High',
        communityImpact: 'High',
        employeeSatisfaction: 'Medium',
        boardDiversity: 'High',
        transparency: 'High'
      },
      certification: 'B-Corp Certified',
      lastUpdated: '2025-01-20T00:00:00Z'
    }
  });
});

// Mock Analytics endpoints
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
      },
      geographicDistribution: {
        'Nigeria': 35,
        'Kenya': 28,
        'South Africa': 22,
        'Ghana': 10,
        'Other': 5
      }
    }
  });
});

// Mock Admin endpoints
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: 900,
      activeUsers: 750,
      pendingVerifications: 25,
      totalTransactionVolume: 2500000,
      systemHealth: 'excellent',
      uptime: '99.9%'
    }
  });
});

// Mock Notification endpoints
app.post('/api/notifications/send', (req, res) => {
  res.json({
    success: true,
    message: 'Notification sent successfully',
    notification: {
      id: 'notif_' + Date.now(),
      recipient: req.body.recipient || 'demo@bvester.com',
      type: req.body.type || 'email',
      status: 'delivered'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    availableEndpoints: [
      'GET /health',
      'GET /api/info',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/businesses',
      'GET /api/investments',
      'GET /api/payments/methods/supported',
      'POST /api/payments/process',
      'GET /api/matching/recommendations/:userId',
      'GET /api/esg/scores/:businessId',
      'GET /api/analytics/dashboard',
      'GET /api/admin/stats',
      'POST /api/notifications/send'
    ]
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bvester Backend running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});