/**
 * BVESTER LOCAL DEVELOPMENT SERVER
 * Works without AWS credentials using in-memory data
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// IN-MEMORY DATABASE (for local testing)
// ============================================================================

const db = {
  users: new Map(),
  businesses: new Map(),
  investments: new Map(),
  transactions: new Map()
};

// Seed with demo data
function seedDemoData() {
  // Demo users
  const demoUsers = [
    {
      userId: uuidv4(),
      email: 'sme@demo.com',
      password: '$2a$10$GHxP8Nr7GMwNRSzOAqVi2On1kLA0uCHcAA21O3nt6FZAd9u7XK7oe', // Demo123!
      fullName: 'John SME Owner',
      role: 'sme',
      country: 'Ghana',
      emailVerified: true,
      kycStatus: 'verified',
      investmentReadinessScore: 75
    },
    {
      userId: uuidv4(),
      email: 'investor@demo.com',
      password: '$2a$10$GHxP8Nr7GMwNRSzOAqVi2On1kLA0uCHcAA21O3nt6FZAd9u7XK7oe', // Demo123!
      fullName: 'Sarah Investor',
      role: 'investor',
      country: 'USA',
      emailVerified: true,
      kycStatus: 'verified',
      investmentCapacity: 100000
    }
  ];

  demoUsers.forEach(user => {
    db.users.set(user.email, user);
  });

  // Demo businesses
  const demoBusinesses = [
    {
      businessId: uuidv4(),
      businessName: 'AgroTech Solutions Ghana',
      ownerEmail: 'sme@demo.com',
      industry: 'Agriculture',
      country: 'Ghana',
      monthlyRevenue: 85000,
      employeeCount: 24,
      investmentReadinessScore: 82,
      verified: true,
      status: 'active'
    },
    {
      businessId: uuidv4(),
      businessName: 'MediCare Plus Nigeria',
      ownerEmail: 'demo2@demo.com',
      industry: 'Healthcare',
      country: 'Nigeria',
      monthlyRevenue: 120000,
      employeeCount: 45,
      investmentReadinessScore: 88,
      verified: true,
      status: 'active'
    }
  ];

  demoBusinesses.forEach(business => {
    db.businesses.set(business.businessId, business);
  });

  // Demo investments
  const demoInvestments = [
    {
      investmentId: uuidv4(),
      businessId: demoBusinesses[0].businessId,
      businessName: demoBusinesses[0].businessName,
      amount: 500000,
      type: 'equity',
      status: 'open',
      currentRaised: 150000,
      investorCount: 12
    }
  ];

  demoInvestments.forEach(investment => {
    db.investments.set(investment.investmentId, investment);
  });

  console.log('📊 Demo data seeded successfully');
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// ============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'bvester-local-secret-key';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ============================================================================
// API ROUTES
// ============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bvester Platform API v2.0 - Local Development',
    status: 'operational',
    mode: 'local-memory',
    environment: 'development',
    timestamp: new Date().toISOString(),
    demo_accounts: {
      sme: 'sme@demo.com / Demo123!',
      investor: 'investor@demo.com / Demo123!'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    service: 'bvester-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
    },
    database: {
      users: db.users.size,
      businesses: db.businesses.size,
      investments: db.investments.size
    }
  });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role, country, phoneNumber } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (db.users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      userId,
      email,
      password: hashedPassword,
      fullName,
      role,
      country: country || 'Ghana',
      phoneNumber: phoneNumber || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false,
      kycStatus: 'pending',
      investmentReadinessScore: 0,
      totalInvestments: 0,
      totalFunding: 0,
      profileComplete: false
    };

    db.users.set(email, newUser);

    const token = generateToken(userId, email, role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        userId,
        email,
        fullName,
        role,
        country: newUser.country
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.users.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.userId, user.email, user.role);

    user.lastLogin = new Date().toISOString();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        country: user.country,
        profileComplete: user.profileComplete,
        kycStatus: user.kycStatus,
        investmentReadinessScore: user.investmentReadinessScore
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = db.users.get(req.user.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userCopy = { ...user };
    delete userCopy.password;

    res.json({
      success: true,
      user: userCopy
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = db.users.get(req.user.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = req.body;
    delete updates.email;
    delete updates.password;
    delete updates.userId;

    Object.assign(user, updates, {
      updatedAt: new Date().toISOString()
    });

    const userCopy = { ...user };
    delete userCopy.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userCopy
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create Business Profile
app.post('/api/businesses', authenticateToken, async (req, res) => {
  try {
    const businessData = req.body;
    const businessId = uuidv4();

    const business = {
      businessId,
      ownerId: req.user.userId,
      ownerEmail: req.user.email,
      ...businessData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      verified: false,
      investmentReadinessScore: 0,
      totalFundingReceived: 0,
      activeInvestors: 0
    };

    db.businesses.set(businessId, business);

    res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      business
    });
  } catch (error) {
    console.error('Business creation error:', error);
    res.status(500).json({ error: 'Failed to create business profile' });
  }
});

// Get User's Businesses
app.get('/api/businesses/my-businesses', authenticateToken, async (req, res) => {
  try {
    const userBusinesses = Array.from(db.businesses.values()).filter(
      b => b.ownerEmail === req.user.email
    );

    res.json({
      success: true,
      businesses: userBusinesses
    });
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get All Businesses (for investors)
app.get('/api/businesses', async (req, res) => {
  try {
    const allBusinesses = Array.from(db.businesses.values()).filter(
      b => b.verified && b.status === 'active'
    );

    res.json({
      success: true,
      businesses: allBusinesses,
      count: allBusinesses.length
    });
  } catch (error) {
    console.error('Business search error:', error);
    res.status(500).json({ error: 'Failed to search businesses' });
  }
});

// Get Single Business
app.get('/api/businesses/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = db.businesses.get(businessId);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      success: true,
      business
    });
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Create Investment Opportunity
app.post('/api/investments', authenticateToken, async (req, res) => {
  try {
    const { businessId, amount, type, terms, description } = req.body;
    const investmentId = uuidv4();

    const investment = {
      investmentId,
      businessId,
      creatorId: req.user.userId,
      creatorEmail: req.user.email,
      amount,
      type,
      terms,
      description,
      status: 'open',
      currentRaised: 0,
      investorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    db.investments.set(investmentId, investment);

    res.status(201).json({
      success: true,
      message: 'Investment opportunity created successfully',
      investment
    });
  } catch (error) {
    console.error('Investment creation error:', error);
    res.status(500).json({ error: 'Failed to create investment opportunity' });
  }
});

// Get Investment Opportunities
app.get('/api/investments', async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    
    const investments = Array.from(db.investments.values()).filter(
      i => i.status === status
    );

    res.json({
      success: true,
      investments,
      count: investments.length
    });
  } catch (error) {
    console.error('Investment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Calculate Investment Readiness Score
app.post('/api/analytics/readiness-score', authenticateToken, async (req, res) => {
  try {
    const { 
      businessAge,
      monthlyRevenue,
      employeeCount,
      hasFinancialRecords,
      hasBusinessPlan,
      hasTaxCompliance,
      hasInsurance
    } = req.body;

    let score = 0;
    
    if (businessAge >= 3) score += 20;
    else if (businessAge >= 2) score += 15;
    else if (businessAge >= 1) score += 10;
    else score += 5;

    if (monthlyRevenue >= 100000) score += 25;
    else if (monthlyRevenue >= 50000) score += 20;
    else if (monthlyRevenue >= 20000) score += 15;
    else if (monthlyRevenue >= 10000) score += 10;
    else score += 5;

    if (employeeCount >= 10) score += 15;
    else if (employeeCount >= 5) score += 10;
    else if (employeeCount >= 2) score += 7;
    else score += 5;

    if (hasFinancialRecords) score += 15;
    if (hasBusinessPlan) score += 10;
    if (hasTaxCompliance) score += 10;
    if (hasInsurance) score += 5;

    const recommendations = [];
    if (!hasFinancialRecords) recommendations.push('Organize your financial records');
    if (!hasBusinessPlan) recommendations.push('Create a comprehensive business plan');
    if (!hasTaxCompliance) recommendations.push('Ensure tax compliance');
    if (!hasInsurance) recommendations.push('Get business insurance');
    if (monthlyRevenue < 50000) recommendations.push('Focus on increasing monthly revenue');
    if (employeeCount < 5) recommendations.push('Consider expanding your team');

    res.json({
      success: true,
      score,
      maxScore: 100,
      readinessLevel: score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low',
      recommendations
    });
  } catch (error) {
    console.error('Score calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate readiness score' });
  }
});

// Get Platform Statistics
app.get('/api/analytics/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        totalUsers: db.users.size,
        totalBusinesses: db.businesses.size,
        totalInvestments: db.investments.size,
        totalFunding: 2450000, // Demo value
        countries: ['Ghana', 'Nigeria', 'Kenya', 'South Africa'],
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// File Upload (mock)
app.post('/api/upload/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const key = `uploads/${req.user.userId}/${Date.now()}-${fileName}`;

    res.json({
      success: true,
      uploadUrl: `http://localhost:${PORT}/mock-upload`,
      key
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Seed demo data on startup
seedDemoData();

app.listen(PORT, () => {
  console.log(`🚀 Bvester Local Server running on port ${PORT}`);
  console.log(`📦 Mode: In-Memory Database (No AWS Required)`);
  console.log(`💾 Demo users seeded: ${db.users.size}`);
  console.log(`🏢 Demo businesses: ${db.businesses.size}`);
  console.log(`💰 Demo investments: ${db.investments.size}`);
  console.log(`🔑 Demo Login: sme@demo.com / Demo123!`);
  console.log(`🔑 Demo Login: investor@demo.com / Demo123!`);
  console.log(`🌍 CORS enabled for: *`);
});

module.exports = app;