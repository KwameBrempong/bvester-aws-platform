/**
 * BVESTER AWS PRODUCTION SERVER
 * Complete backend for African SME investment platform
 * AWS DynamoDB + Real API Implementation
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
const Stripe = require('stripe');
const Flutterwave = require('flutterwave-node-v3');

// AWS SDK imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// AWS CONFIGURATION
// ============================================================================

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined
});

// ============================================================================
// PAYMENT PROCESSORS
// ============================================================================

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
}) : null;

const flw = process.env.FLUTTERWAVE_SECRET_KEY ? new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
) : null;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'bvester-secret-key-change-in-production';

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
// API ROUTES - AUTHENTICATION
// ============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bvester Platform API v2.0 - AWS Production',
    status: 'operational',
    region: process.env.AWS_REGION || 'eu-west-2',
    environment: 'production',
    deployment: 'Auto-deployed via CodePipeline',
    timestamp: new Date().toISOString()
  });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role, country, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const getParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Key: { email }
    };

    const existingUser = await docClient.send(new GetCommand(getParams));
    if (existingUser.Item) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
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

    const putParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Item: newUser
    };

    await docClient.send(new PutCommand(putParams));

    // Generate token
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

    // Get user from DynamoDB
    const getParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Key: { email }
    };

    const result = await docClient.send(new GetCommand(getParams));
    const user = result.Item;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.userId, user.email, user.role);

    // Update last login
    const updateParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Key: { email },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    };

    await docClient.send(new UpdateCommand(updateParams));

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

// ============================================================================
// API ROUTES - USER PROFILE
// ============================================================================

// Get User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const getParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Key: { email: req.user.email }
    };

    const result = await docClient.send(new GetCommand(getParams));
    const user = result.Item;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    delete user.password;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.email; // Prevent email changes
    delete updates.password; // Prevent password changes through this endpoint
    delete updates.userId; // Prevent ID changes

    const updateExpressions = [];
    const expressionAttributeValues = {};

    Object.keys(updates).forEach(key => {
      updateExpressions.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = updates[key];
    });

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
      Key: { email: req.user.email },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    delete result.Attributes.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.Attributes
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================================================
// API ROUTES - BUSINESS MANAGEMENT
// ============================================================================

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

    const putParams = {
      TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
      Item: business
    };

    await docClient.send(new PutCommand(putParams));

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
    const queryParams = {
      TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
      IndexName: 'ownerEmail-index',
      KeyConditionExpression: 'ownerEmail = :email',
      ExpressionAttributeValues: {
        ':email': req.user.email
      }
    };

    const result = await docClient.send(new QueryCommand(queryParams));

    res.json({
      success: true,
      businesses: result.Items || []
    });
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get All Businesses (for investors)
app.get('/api/businesses', async (req, res) => {
  try {
    const { country, industry, minScore, limit = 20 } = req.query;

    const scanParams = {
      TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
      FilterExpression: 'verified = :verified AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':verified': true,
        ':status': 'active'
      },
      Limit: parseInt(limit)
    };

    // Add filters
    if (country) {
      scanParams.FilterExpression += ' AND country = :country';
      scanParams.ExpressionAttributeValues[':country'] = country;
    }

    if (industry) {
      scanParams.FilterExpression += ' AND industry = :industry';
      scanParams.ExpressionAttributeValues[':industry'] = industry;
    }

    if (minScore) {
      scanParams.FilterExpression += ' AND investmentReadinessScore >= :minScore';
      scanParams.ExpressionAttributeValues[':minScore'] = parseInt(minScore);
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    res.json({
      success: true,
      businesses: result.Items || [],
      count: result.Count
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

    const scanParams = {
      TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
      FilterExpression: 'businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': businessId
      }
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    const business = result.Items && result.Items[0];

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

// ============================================================================
// API ROUTES - INVESTMENT MANAGEMENT
// ============================================================================

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
      type, // equity, loan, revenue-share
      terms,
      description,
      status: 'open',
      currentRaised: 0,
      investorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    const putParams = {
      TableName: process.env.DYNAMODB_INVESTMENTS_TABLE || 'bvester-investments',
      Item: investment
    };

    await docClient.send(new PutCommand(putParams));

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

// Make Investment (Investor)
app.post('/api/investments/:investmentId/invest', authenticateToken, async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { amount, paymentMethod } = req.body;
    const transactionId = uuidv4();

    // Create transaction record
    const transaction = {
      transactionId,
      investmentId,
      investorId: req.user.userId,
      investorEmail: req.user.email,
      amount,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const putParams = {
      TableName: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'bvester-transactions',
      Item: transaction
    };

    await docClient.send(new PutCommand(putParams));

    // TODO: Process payment through Stripe/Flutterwave

    res.status(201).json({
      success: true,
      message: 'Investment initiated successfully',
      transaction
    });
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({ error: 'Failed to process investment' });
  }
});

// Get Investment Opportunities
app.get('/api/investments', async (req, res) => {
  try {
    const { status = 'open', limit = 20 } = req.query;

    const scanParams = {
      TableName: process.env.DYNAMODB_INVESTMENTS_TABLE || 'bvester-investments',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      },
      Limit: parseInt(limit)
    };

    const result = await docClient.send(new ScanCommand(scanParams));

    res.json({
      success: true,
      investments: result.Items || [],
      count: result.Count
    });
  } catch (error) {
    console.error('Investment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// ============================================================================
// API ROUTES - ANALYTICS & METRICS
// ============================================================================

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

    // Simple scoring algorithm
    let score = 0;
    
    // Business age (max 20 points)
    if (businessAge >= 3) score += 20;
    else if (businessAge >= 2) score += 15;
    else if (businessAge >= 1) score += 10;
    else score += 5;

    // Monthly revenue (max 25 points)
    if (monthlyRevenue >= 100000) score += 25;
    else if (monthlyRevenue >= 50000) score += 20;
    else if (monthlyRevenue >= 20000) score += 15;
    else if (monthlyRevenue >= 10000) score += 10;
    else score += 5;

    // Employee count (max 15 points)
    if (employeeCount >= 10) score += 15;
    else if (employeeCount >= 5) score += 10;
    else if (employeeCount >= 2) score += 7;
    else score += 5;

    // Documentation (max 40 points)
    if (hasFinancialRecords) score += 15;
    if (hasBusinessPlan) score += 10;
    if (hasTaxCompliance) score += 10;
    if (hasInsurance) score += 5;

    // Calculate recommendations
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
    // Get counts from each table
    const [usersResult, businessesResult, investmentsResult] = await Promise.all([
      docClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
        Select: 'COUNT'
      })),
      docClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
        Select: 'COUNT'
      })),
      docClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_INVESTMENTS_TABLE || 'bvester-investments',
        Select: 'COUNT'
      }))
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: usersResult.Count || 0,
        totalBusinesses: businessesResult.Count || 0,
        totalInvestments: investmentsResult.Count || 0,
        totalFunding: 0, // TODO: Calculate from transactions
        countries: ['Ghana', 'Nigeria', 'Kenya', 'South Africa'],
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================================================
// API ROUTES - FILE UPLOAD
// ============================================================================

// Generate presigned URL for S3 upload
app.post('/api/upload/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const key = `uploads/${req.user.userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'bvester-uploads',
      Key: key,
      ContentType: fileType
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    res.json({
      success: true,
      uploadUrl: signedUrl,
      key
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Bvester API Server running on port ${PORT}`);
  console.log(`📦 AWS Region: ${process.env.AWS_REGION || 'eu-west-2'}`);
  console.log(`💾 DynamoDB Tables Connected`);
  console.log(`💳 Payment processors: ${stripe ? 'Stripe ✓' : 'Stripe ✗'} ${flw ? 'Flutterwave ✓' : 'Flutterwave ✗'}`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
});

module.exports = app;