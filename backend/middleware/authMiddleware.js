// 🚀 BVESTER - AUTHENTICATION MIDDLEWARE
// Advanced Firebase Auth middleware with role-based access control

const { adminAuth, adminFirestore } = require('../config/firebase-admin');
const logger = require('../utils/logger');

/**
 * 🔐 AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 */
class AuthMiddleware {
  constructor() {
    this.adminAuth = adminAuth;
    this.firestore = adminFirestore;
  }

  /**
   * Verify Firebase ID token and extract user info
   */
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No authentication token provided',
          code: 'NO_TOKEN'
        });
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the ID token
      const decodedToken = await this.adminAuth.verifyIdToken(idToken);
      
      // Get user profile from Firestore
      const userDoc = await this.firestore
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const userData = userDoc.data();
      
      // Check if user account is active
      if (userData.status === 'suspended' || userData.status === 'deactivated') {
        return res.status(403).json({
          success: false,
          error: 'Account has been suspended',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...userData
      };

      // Update last active timestamp
      await this.updateLastActive(decodedToken.uid);

      next();

    } catch (error) {
      logger.error('Authentication error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          error: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          success: false,
          error: 'Authentication token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  }

  /**
   * Require specific user type (investor, business, admin)
   */
  requireUserType(allowedTypes) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const userType = req.user.userType;
      const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

      if (!types.includes(userType)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required user type: ${types.join(' or ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  /**
   * Require admin access
   */
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.userType !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  }

  /**
   * Require subscription plan (for premium features)
   */
  requireSubscription(requiredPlans) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const userPlan = req.user.subscription?.plan || 'basic';
      const plans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

      if (!plans.includes(userPlan)) {
        return res.status(403).json({
          success: false,
          error: `Premium subscription required. Upgrade to: ${plans.join(' or ')}`,
          code: 'SUBSCRIPTION_REQUIRED',
          requiredPlans: plans,
          currentPlan: userPlan
        });
      }

      // Check if subscription is active
      if (req.user.subscription?.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_INACTIVE'
        });
      }

      next();
    };
  }

  /**
   * Require verified account
   */
  requireVerification(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    if (req.user.verification?.kycStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'Account verification required',
        code: 'KYC_NOT_VERIFIED'
      });
    }

    next();
  }

  /**
   * Rate limiting per user
   */
  rateLimitPerUser(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.uid;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      if (userRequests.has(userId)) {
        const requests = userRequests.get(userId);
        const validRequests = requests.filter(time => time > windowStart);
        userRequests.set(userId, validRequests);
      }

      // Check current request count
      const currentRequests = userRequests.get(userId) || [];
      
      if (currentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      currentRequests.push(now);
      userRequests.set(userId, currentRequests);

      next();
    };
  }

  /**
   * Optional authentication (doesn't fail if no token)
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await this.adminAuth.verifyIdToken(idToken);
      
      const userDoc = await this.firestore
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          ...userData
        };
      } else {
        req.user = null;
      }

      next();

    } catch (error) {
      // If token is invalid, continue without user
      req.user = null;
      next();
    }
  }

  /**
   * Resource ownership check
   */
  requireOwnership(resourceType, resourceIdParam = 'id') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'NOT_AUTHENTICATED'
          });
        }

        const resourceId = req.params[resourceIdParam];
        const userId = req.user.uid;

        // Admin can access all resources
        if (req.user.userType === 'admin' || req.user.isAdmin) {
          return next();
        }

        let isOwner = false;

        switch (resourceType) {
          case 'business':
            const businessDoc = await this.firestore
              .collection('businesses')
              .doc(resourceId)
              .get();
            
            if (businessDoc.exists) {
              isOwner = businessDoc.data().ownerId === userId;
            }
            break;

          case 'investment':
            const investmentDoc = await this.firestore
              .collection('investments')
              .doc(resourceId)
              .get();
            
            if (investmentDoc.exists) {
              const investmentData = investmentDoc.data();
              isOwner = investmentData.investorId === userId || 
                       investmentData.businessId === userId;
            }
            break;

          case 'user':
            isOwner = resourceId === userId;
            break;

          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid resource type for ownership check',
              code: 'INVALID_RESOURCE_TYPE'
            });
        }

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You do not own this resource.',
            code: 'NOT_RESOURCE_OWNER'
          });
        }

        next();

      } catch (error) {
        logger.error('Ownership check error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify resource ownership',
          code: 'OWNERSHIP_CHECK_FAILED'
        });
      }
    };
  }

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(userId) {
    try {
      await this.firestore
        .collection('users')
        .doc(userId)
        .update({
          'activity.lastActiveAt': new Date(),
          'metadata.updatedAt': new Date()
        });
    } catch (error) {
      // Don't fail the request if this fails
      logger.error('Failed to update last active:', error);
    }
  }

  /**
   * Log API access for analytics
   */
  logApiAccess(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      try {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const logData = {
          userId: req.user?.uid,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          timestamp: new Date()
        };

        // Log to analytics collection (don't await to avoid slowing down response)
        this.firestore
          .collection('apiLogs')
          .add(logData)
          .catch(error => logger.error('Failed to log API access:', error));

      } catch (error) {
        logger.error('API access logging error:', error);
      }
    });

    next();
  }
}

const authMiddleware = new AuthMiddleware();

// Export commonly used middleware functions
module.exports = authMiddleware.verifyToken.bind(authMiddleware);
module.exports.authenticateToken = authMiddleware.verifyToken.bind(authMiddleware);
module.exports.requireUserType = authMiddleware.requireUserType.bind(authMiddleware);
module.exports.requireAdmin = authMiddleware.requireAdmin.bind(authMiddleware);
module.exports.requireSubscription = authMiddleware.requireSubscription.bind(authMiddleware);
module.exports.requireVerification = authMiddleware.requireVerification.bind(authMiddleware);
module.exports.rateLimitPerUser = authMiddleware.rateLimitPerUser.bind(authMiddleware);
module.exports.optionalAuth = authMiddleware.optionalAuth.bind(authMiddleware);
module.exports.requireOwnership = authMiddleware.requireOwnership.bind(authMiddleware);
module.exports.logApiAccess = authMiddleware.logApiAccess.bind(authMiddleware);