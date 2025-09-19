// 🚀 BVESTER - ERROR HANDLING MIDDLEWARE
// Comprehensive error handling and logging system

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid || 'anonymous',
    body: req.method === 'POST' || req.method === 'PUT' ? sanitizeBody(req.body) : undefined,
    params: req.params,
    query: req.query
  });

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    return handleFirebaseAuthError(err, res);
  }

  // Firebase Firestore errors
  if (err.code && (err.code.includes('firestore') || err.code.includes('permission-denied'))) {
    return handleFirestoreError(err, res);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return handleValidationError(err, res);
  }

  // Payment errors (Stripe, Flutterwave)
  if (err.type && (err.type.includes('stripe') || err.type.includes('flutterwave'))) {
    return handlePaymentError(err, res);
  }

  // Rate limiting errors
  if (err.status === 429) {
    return handleRateLimitError(err, res);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return handleJWTError(err, res);
  }

  // Network/Connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    return handleNetworkError(err, res);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return handleFileUploadError(err, res);
  }

  // Database constraint errors
  if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
    return handleDuplicateError(err, res);
  }

  // Default server error
  return handleServerError(err, res);
};

/**
 * Handle Firebase Authentication errors
 */
function handleFirebaseAuthError(err, res) {
  const authErrors = {
    'auth/user-not-found': {
      statusCode: 404,
      message: 'User account not found',
      code: 'USER_NOT_FOUND'
    },
    'auth/wrong-password': {
      statusCode: 401,
      message: 'Invalid password',
      code: 'INVALID_PASSWORD'
    },
    'auth/email-already-exists': {
      statusCode: 400,
      message: 'An account with this email already exists',
      code: 'EMAIL_EXISTS'
    },
    'auth/invalid-email': {
      statusCode: 400,
      message: 'Invalid email address format',
      code: 'INVALID_EMAIL'
    },
    'auth/weak-password': {
      statusCode: 400,
      message: 'Password is too weak. Please choose a stronger password',
      code: 'WEAK_PASSWORD'
    },
    'auth/too-many-requests': {
      statusCode: 429,
      message: 'Too many failed attempts. Please try again later',
      code: 'TOO_MANY_REQUESTS'
    },
    'auth/id-token-expired': {
      statusCode: 401,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED'
    },
    'auth/id-token-revoked': {
      statusCode: 401,
      message: 'Authentication token has been revoked',
      code: 'TOKEN_REVOKED'
    },
    'auth/invalid-id-token': {
      statusCode: 401,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    }
  };

  const errorInfo = authErrors[err.code] || {
    statusCode: 500,
    message: 'Authentication service error',
    code: 'AUTH_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code,
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}

/**
 * Handle Firestore database errors
 */
function handleFirestoreError(err, res) {
  const firestoreErrors = {
    'permission-denied': {
      statusCode: 403,
      message: 'Access denied. You do not have permission to access this resource',
      code: 'PERMISSION_DENIED'
    },
    'not-found': {
      statusCode: 404,
      message: 'Requested resource not found',
      code: 'RESOURCE_NOT_FOUND'
    },
    'already-exists': {
      statusCode: 400,
      message: 'Resource already exists',
      code: 'RESOURCE_EXISTS'
    },
    'failed-precondition': {
      statusCode: 400,
      message: 'Operation failed due to precondition failure',
      code: 'PRECONDITION_FAILED'
    },
    'resource-exhausted': {
      statusCode: 429,
      message: 'Resource quota exceeded. Please try again later',
      code: 'QUOTA_EXCEEDED'
    },
    'cancelled': {
      statusCode: 499,
      message: 'Operation was cancelled',
      code: 'OPERATION_CANCELLED'
    },
    'deadline-exceeded': {
      statusCode: 504,
      message: 'Operation timeout',
      code: 'TIMEOUT'
    }
  };

  const errorCode = err.code || 'unknown';
  const errorInfo = firestoreErrors[errorCode] || {
    statusCode: 500,
    message: 'Database service error',
    code: 'DATABASE_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code,
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}

/**
 * Handle validation errors
 */
function handleValidationError(err, res) {
  const errors = {};
  
  if (err.errors) {
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors
  });
}

/**
 * Handle payment processing errors
 */
function handlePaymentError(err, res) {
  const paymentErrors = {
    'card_declined': {
      statusCode: 400,
      message: 'Your card was declined. Please try a different payment method',
      code: 'CARD_DECLINED'
    },
    'insufficient_funds': {
      statusCode: 400,
      message: 'Insufficient funds. Please check your account balance',
      code: 'INSUFFICIENT_FUNDS'
    },
    'expired_card': {
      statusCode: 400,
      message: 'Your card has expired. Please use a different payment method',
      code: 'EXPIRED_CARD'
    },
    'invalid_cvc': {
      statusCode: 400,
      message: 'Invalid CVC code. Please check and try again',
      code: 'INVALID_CVC'
    },
    'processing_error': {
      statusCode: 400,
      message: 'Payment processing failed. Please try again',
      code: 'PROCESSING_ERROR'
    }
  };

  const errorCode = err.code || err.decline_code || 'processing_error';
  const errorInfo = paymentErrors[errorCode] || {
    statusCode: 400,
    message: 'Payment processing failed',
    code: 'PAYMENT_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code,
    provider: err.provider || 'unknown',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}

/**
 * Handle rate limiting errors
 */
function handleRateLimitError(err, res) {
  return res.status(429).json({
    success: false,
    error: 'Too many requests. Please slow down and try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: err.retryAfter || 60
  });
}

/**
 * Handle JWT token errors
 */
function handleJWTError(err, res) {
  const jwtErrors = {
    'JsonWebTokenError': {
      statusCode: 401,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    },
    'TokenExpiredError': {
      statusCode: 401,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED'
    },
    'NotBeforeError': {
      statusCode: 401,
      message: 'Authentication token not active yet',
      code: 'TOKEN_NOT_ACTIVE'
    }
  };

  const errorInfo = jwtErrors[err.name] || {
    statusCode: 401,
    message: 'Authentication failed',
    code: 'AUTH_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code
  });
}

/**
 * Handle network/connection errors
 */
function handleNetworkError(err, res) {
  const networkErrors = {
    'ECONNREFUSED': {
      statusCode: 503,
      message: 'Service temporarily unavailable. Please try again later',
      code: 'SERVICE_UNAVAILABLE'
    },
    'ENOTFOUND': {
      statusCode: 503,
      message: 'External service not found',
      code: 'SERVICE_NOT_FOUND'
    },
    'ETIMEDOUT': {
      statusCode: 504,
      message: 'Request timeout. Please try again',
      code: 'REQUEST_TIMEOUT'
    }
  };

  const errorInfo = networkErrors[err.code] || {
    statusCode: 503,
    message: 'Network error occurred',
    code: 'NETWORK_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code
  });
}

/**
 * Handle file upload errors
 */
function handleFileUploadError(err, res) {
  const fileErrors = {
    'LIMIT_FILE_SIZE': {
      statusCode: 400,
      message: 'File size too large. Please upload a smaller file',
      code: 'FILE_TOO_LARGE'
    },
    'LIMIT_UNEXPECTED_FILE': {
      statusCode: 400,
      message: 'Unexpected file type. Please check allowed file formats',
      code: 'INVALID_FILE_TYPE'
    },
    'LIMIT_PART_COUNT': {
      statusCode: 400,
      message: 'Too many files. Please reduce the number of files',
      code: 'TOO_MANY_FILES'
    }
  };

  const errorInfo = fileErrors[err.code] || {
    statusCode: 400,
    message: 'File upload failed',
    code: 'UPLOAD_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    error: errorInfo.message,
    code: errorInfo.code,
    limit: err.limit
  });
}

/**
 * Handle duplicate entry errors
 */
function handleDuplicateError(err, res) {
  return res.status(400).json({
    success: false,
    error: 'Resource already exists. Please use a different value',
    code: 'DUPLICATE_ENTRY'
  });
}

/**
 * Handle generic server errors
 */
function handleServerError(err, res) {
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error. Please try again later'
      : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'creditCard', 'cardNumber', 'cvv', 'ssn', 'social',
    'idToken', 'accessToken', 'refreshToken'
  ];

  const sanitized = { ...body };
  
  function sanitizeObject(obj) {
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  }

  sanitizeObject(sanitized);
  return sanitized;
}

/**
 * Not Found middleware (404 handler)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error classes for specific use cases
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};