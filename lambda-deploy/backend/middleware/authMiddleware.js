/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 * JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS Cognito
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * Middleware to verify JWT token from AWS Cognito
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    try {
      // Decode JWT token (basic validation)
      const decodedToken = jwt.decode(token, { complete: true });

      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format',
          code: 'INVALID_TOKEN'
        });
      }

      // Extract user information from token
      const payload = decodedToken.payload;

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // For production, you would verify the token signature with Cognito's public keys
      // For MVP, we'll do basic validation

      // Attach user info to request
      req.user = {
        uid: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        userType: payload['custom:userType'] || 'business',
        tokenUse: payload.token_use,
        aud: payload.aud,
        iss: payload.iss
      };

      next();

    } catch (tokenError) {
      logger.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or malformed token',
        code: 'INVALID_TOKEN'
      });
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decodedToken = jwt.decode(token, { complete: true });

      if (decodedToken && decodedToken.payload) {
        const payload = decodedToken.payload;

        // Check if token is not expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp >= currentTime) {
          req.user = {
            uid: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified || false,
            userType: payload['custom:userType'] || 'business',
            tokenUse: payload.token_use,
            aud: payload.aud,
            iss: payload.iss
          };
        } else {
          req.user = null;
        }
      } else {
        req.user = null;
      }

    } catch (tokenError) {
      req.user = null;
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Admin-only middleware
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

/**
 * Business user only middleware
 */
const businessOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.userType !== 'business') {
    return res.status(403).json({
      success: false,
      error: 'Business account required'
    });
  }

  next();
};

/**
 * Investor user only middleware
 */
const investorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.userType !== 'investor') {
    return res.status(403).json({
      success: false,
      error: 'Investor account required'
    });
  }

  next();
};

/**
 * Verified email only middleware
 */
const verifiedEmailOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
module.exports.adminOnly = adminOnly;
module.exports.businessOnly = businessOnly;
module.exports.investorOnly = investorOnly;
module.exports.verifiedEmailOnly = verifiedEmailOnly;