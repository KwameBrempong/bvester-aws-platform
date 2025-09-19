// 🚀 BVESTER - LOGGING UTILITY
// Comprehensive logging system with multiple transports

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Define transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
);

// File transports (for production and development)
if (process.env.NODE_ENV !== 'test') {
  const logDir = path.join(__dirname, '../logs');
  
  // Ensure logs directory exists
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );

  // HTTP access logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      format: format,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Add custom methods for different types of logging
logger.api = (message, meta = {}) => {
  logger.info(`[API] ${message}`, meta);
};

logger.auth = (message, meta = {}) => {
  logger.info(`[AUTH] ${message}`, meta);
};

logger.payment = (message, meta = {}) => {
  logger.info(`[PAYMENT] ${message}`, meta);
};

logger.security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, meta);
};

logger.performance = (message, meta = {}) => {
  logger.info(`[PERFORMANCE] ${message}`, meta);
};

logger.database = (message, meta = {}) => {
  logger.info(`[DATABASE] ${message}`, meta);
};

logger.notification = (message, meta = {}) => {
  logger.info(`[NOTIFICATION] ${message}`, meta);
};

logger.matching = (message, meta = {}) => {
  logger.info(`[MATCHING] ${message}`, meta);
};

logger.esg = (message, meta = {}) => {
  logger.info(`[ESG] ${message}`, meta);
};

logger.business = (message, meta = {}) => {
  logger.info(`[BUSINESS] ${message}`, meta);
};

logger.investment = (message, meta = {}) => {
  logger.info(`[INVESTMENT] ${message}`, meta);
};

logger.admin = (message, meta = {}) => {
  logger.info(`[ADMIN] ${message}`, meta);
};

// Performance monitoring helper
logger.timeStart = (label) => {
  const start = process.hrtime.bigint();
  return {
    end: () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      logger.performance(`${label} completed in ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Request logging helper
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.uid || 'anonymous'
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

// Error logging helper with context
logger.logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  };

  if (error.statusCode >= 500 || !error.statusCode) {
    logger.error('Application Error', errorData);
  } else {
    logger.warn('Client Error', errorData);
  }
};

// Security event logging
logger.logSecurityEvent = (event, details = {}) => {
  logger.security(`Security Event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Business operation logging
logger.logBusinessOperation = (operation, userId, details = {}) => {
  logger.business(`Business Operation: ${operation}`, {
    operation,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Payment operation logging
logger.logPaymentOperation = (operation, amount, currency, userId, details = {}) => {
  logger.payment(`Payment Operation: ${operation}`, {
    operation,
    amount,
    currency,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Investment operation logging
logger.logInvestmentOperation = (operation, investmentId, userId, details = {}) => {
  logger.investment(`Investment Operation: ${operation}`, {
    operation,
    investmentId,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Matching operation logging
logger.logMatchingOperation = (operation, userId, details = {}) => {
  logger.matching(`Matching Operation: ${operation}`, {
    operation,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// ESG scoring logging
logger.logESGOperation = (operation, businessId, score, details = {}) => {
  logger.esg(`ESG Operation: ${operation}`, {
    operation,
    businessId,
    score,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Notification logging
logger.logNotificationOperation = (operation, userId, type, details = {}) => {
  logger.notification(`Notification Operation: ${operation}`, {
    operation,
    userId,
    type,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Admin operation logging
logger.logAdminOperation = (operation, adminId, targetId, details = {}) => {
  logger.admin(`Admin Operation: ${operation}`, {
    operation,
    adminId,
    targetId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Database operation logging
logger.logDatabaseOperation = (operation, collection, documentId, details = {}) => {
  logger.database(`Database Operation: ${operation}`, {
    operation,
    collection,
    documentId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// System health logging
logger.logSystemHealth = (metric, value, threshold, details = {}) => {
  const level = value > threshold ? 'warn' : 'info';
  logger[level](`System Health: ${metric}`, {
    metric,
    value,
    threshold,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Rate limiting logging
logger.logRateLimit = (identifier, limit, windowMs, details = {}) => {
  logger.warn('Rate Limit Exceeded', {
    identifier,
    limit,
    windowMs,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Authentication logging
logger.logAuthEvent = (event, userId, success, details = {}) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth Event: ${event}`, {
    event,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Graceful shutdown logging
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = logger;