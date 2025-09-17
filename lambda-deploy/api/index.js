// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Import routes
const authRoutes = require('../backend/api/routes/authRoutesAWS');
const dynamodbRoutes = require('../backend/api/routes/dynamodbRoutes');
const chatRecordsRoutes = require('../backend/api/routes/chatRecordsRoutes');
const businessHealthRoutes = require('../backend/api/routes/businessHealthRoutes');
const investmentRoutes = require('../backend/api/routes/investmentRoutes');
const paymentRoutes = require('../backend/api/routes/paymentRoutes');
const kycRoutes = require('../backend/api/routes/kycRoutes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.bvester.com", "https://bvester.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: [
    'https://bvester.com',
    'https://www.bvester.com',
    'https://api.bvester.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:8081'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bvester API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dynamodb', dynamodbRoutes);
app.use('/api/chat-records', chatRecordsRoutes);
app.use('/api/business-health', businessHealthRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kyc', kycRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

module.exports = app;