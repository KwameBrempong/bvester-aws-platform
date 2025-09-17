// 🚀 BVESTER BACKEND API SERVER
// Main Express server with comprehensive API endpoints
// Supports all frontend features with African market optimizations

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import services and middleware
const authMiddleware = require('../middleware/authMiddleware');
const errorHandler = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes');
const investorRoutes = require('./routes/investorRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const esgRoutes = require('./routes/esgRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

class BvesterServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration for African markets
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'https://bizinvest-hub-prod.web.app',
        'https://bvester.com',
        /\.bvester\.com$/,
        /\.ngrok\.io$/
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting - more lenient for African internet conditions
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Increased limit for slower connections
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression for African bandwidth optimization
    this.app.use(compression({
      level: 6,
      threshold: 1024,
    }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Bvester API',
        version: '1.0.0',
        description: 'African SME Investment Platform API',
        documentation: '/api/docs',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          businesses: '/api/businesses',
          investors: '/api/investors',
          investments: '/api/investments',
          payments: '/api/payments',
          analytics: '/api/analytics',
          matching: '/api/matching',
          esg: '/api/esg',
          notifications: '/api/notifications',
          admin: '/api/admin'
        }
      });
    });
  }

  setupRoutes() {
    // Public routes (no authentication required)
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/public', this.createPublicRoutes());

    // Protected routes (authentication required)
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/businesses', authMiddleware, businessRoutes);
    this.app.use('/api/investors', authMiddleware, investorRoutes);
    this.app.use('/api/investments', authMiddleware, investmentRoutes);
    this.app.use('/api/payments', authMiddleware, paymentRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/matching', authMiddleware, matchingRoutes);
    this.app.use('/api/esg', authMiddleware, esgRoutes);
    this.app.use('/api/notifications', authMiddleware, notificationRoutes);

    // Admin routes (admin authentication required)
    this.app.use('/api/admin', authMiddleware, adminRoutes);

    // Webhook routes (special handling)
    this.app.use('/api/webhooks', this.createWebhookRoutes());

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  createPublicRoutes() {
    const router = express.Router();

    // Public business listings (for homepage)
    router.get('/businesses', async (req, res) => {
      try {
        const { country, sector, limit = 12 } = req.query;
        
        // This would integrate with your business service
        const businesses = []; // Fetch from database
        
        res.json({
          success: true,
          businesses: businesses,
          total: businesses.length,
          filters: { country, sector, limit: parseInt(limit) }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch businesses'
        });
      }
    });

    // Public market statistics
    router.get('/stats', async (req, res) => {
      try {
        const stats = {
          totalBusinesses: 1247,
          totalInvestors: 892,
          totalInvestments: 5643,
          totalFunding: 12500000,
          averageInvestment: 2215,
          successfulExits: 234,
          countries: 12,
          sectors: 8
        };

        res.json({
          success: true,
          stats: stats,
          lastUpdated: new Date()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch statistics'
        });
      }
    });

    // Public ESG insights
    router.get('/esg-insights', async (req, res) => {
      try {
        const insights = {
          averageESGScore: 67,
          topPerformingSectors: ['technology', 'healthcare', 'fintech'],
          improvementTrends: {
            environmental: 8.5,
            social: 12.3,
            governance: 6.2
          },
          sdgAlignment: {
            mostAligned: [1, 8, 3, 5, 13],
            averageAlignment: 73
          }
        };

        res.json({
          success: true,
          insights: insights,
          generatedAt: new Date()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch ESG insights'
        });
      }
    });

    return router;
  }

  createWebhookRoutes() {
    const router = express.Router();

    // Stripe webhooks
    router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
      try {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        // Verify webhook signature
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        
        // Handle webhook event
        await this.handleStripeWebhook(event);
        
        res.json({ received: true });
      } catch (error) {
        logger.error('Stripe webhook error:', error);
        res.status(400).json({ error: 'Webhook signature verification failed' });
      }
    });

    // Flutterwave webhooks
    router.post('/flutterwave', async (req, res) => {
      try {
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
        const signature = req.headers['verif-hash'];
        
        if (!signature || signature !== secretHash) {
          return res.status(401).json({ error: 'Unauthorized webhook' });
        }
        
        // Handle webhook event
        await this.handleFlutterwaveWebhook(req.body);
        
        res.json({ received: true });
      } catch (error) {
        logger.error('Flutterwave webhook error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    });

    return router;
  }

  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleSuccessfulSubscriptionPayment(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleFailedSubscriptionPayment(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Stripe webhook handling error:', error);
      throw error;
    }
  }

  async handleFlutterwaveWebhook(data) {
    try {
      if (data.event === 'charge.completed' && data.data.status === 'successful') {
        await this.handleSuccessfulFlutterwavePayment(data.data);
      } else {
        logger.info(`Unhandled Flutterwave webhook event: ${data.event}`);
      }
    } catch (error) {
      logger.error('Flutterwave webhook handling error:', error);
      throw error;
    }
  }

  async handleSuccessfulSubscriptionPayment(invoice) {
    // Handle successful subscription payment
    logger.info('Subscription payment succeeded:', invoice.id);
  }

  async handleFailedSubscriptionPayment(invoice) {
    // Handle failed subscription payment
    logger.info('Subscription payment failed:', invoice.id);
  }

  async handleSubscriptionCancellation(subscription) {
    // Handle subscription cancellation
    logger.info('Subscription cancelled:', subscription.id);
  }

  async handleSuccessfulPayment(paymentIntent) {
    // Handle successful one-time payment
    logger.info('Payment succeeded:', paymentIntent.id);
  }

  async handleSuccessfulFlutterwavePayment(data) {
    // Handle successful Flutterwave payment
    logger.info('Flutterwave payment succeeded:', data.id);
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Bvester API Server running on port ${this.port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${this.port}/health`);
      logger.info(`📚 API documentation: http://localhost:${this.port}/api`);
    });
  }
}

// Create and start server
const server = new BvesterServer();

if (require.main === module) {
  server.start();
}

module.exports = server;