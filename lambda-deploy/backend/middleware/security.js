// Security middleware for Bvester platform
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// CORS configuration based on environment
const getCorsOptions = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      origin: [
        'https://www.bvester.com',
        'https://bvester.com',
        'https://app.bvester.com',
        'https://api.bvester.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400 // 24 hours
    };
  }
  
  // Development configuration
  return {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:19000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600
  };
};

// Rate limiting configuration
const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Strict rate limiter for auth endpoints
const authRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes

// Standard rate limiter for API endpoints
const apiRateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Security headers middleware
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["https://js.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
};

// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    return res.redirect('https://' + req.get('Host') + req.url);
  }
  next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Remove any potential XSS attempts from query parameters
  for (let key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  }
  
  // Remove any potential XSS attempts from body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    sanitizeObject(req.body);
  }
  
  next();
};

// API key validation middleware (for external services)
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing API key'
      });
    }
  }
  
  next();
};

module.exports = {
  getCorsOptions,
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  securityHeaders,
  enforceHTTPS,
  sanitizeRequest,
  validateAPIKey
};