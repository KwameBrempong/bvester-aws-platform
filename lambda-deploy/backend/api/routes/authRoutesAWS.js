/**
 * 🚀 BVESTER - AWS COGNITO AUTHENTICATION API ROUTES
 * AWS Cognito integration with enhanced features
 */

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { dynamoDBService } = require('../../services/aws/DynamoDBService');
const authMiddleware = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const cognito = new AWS.CognitoIdentityServiceProvider();
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID;

/**
 * 📝 REGISTER USER
 * Create new user account with AWS Cognito
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      userType,
      profile = {},
      businessInfo = {}
    } = req.body;

    // Validate required fields
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and userType are required'
      });
    }

    // Validate user type
    const validUserTypes = ['investor', 'business'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user type. Must be investor or business'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Create user in Cognito
    const cognitoParams = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      MessageAction: 'SUPPRESS', // We'll handle email verification ourselves
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'custom:userType', Value: userType }
      ]
    };

    const cognitoUser = await cognito.adminCreateUser(cognitoParams).promise();
    const userId = cognitoUser.User.Username;

    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      Password: password,
      Permanent: true
    }).promise();

    // Create user profile in DynamoDB
    const userData = {
      id: userId,
      email: email,
      userType: userType,
      status: 'active',
      profile: {
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        country: profile.country || '',
        city: profile.city || '',
        avatar: profile.avatar || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth || null,
        preferredCurrency: profile.preferredCurrency || 'GHS',
        language: profile.language || 'en'
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        kycStatus: 'pending',
        kycDocuments: [],
        verificationAttempts: 0,
        lastVerificationAttempt: null
      },
      preferences: {
        notifications: {
          channels: {
            email: true,
            push: true,
            sms: false
          },
          types: {
            investment: true,
            business: true,
            matching: true,
            marketing: false,
            security: true,
            system: true
          }
        },
        privacy: {
          profileVisibility: 'public',
          showInvestmentHistory: false,
          allowDirectMessages: true
        }
      },
      subscription: {
        plan: 'basic',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
        paymentMethod: null
      },
      activity: {
        lastLoginAt: null,
        lastActiveAt: null,
        loginCount: 0,
        ipAddresses: [],
        deviceTokens: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add user type specific data
    if (userType === 'investor') {
      userData.investorProfile = {
        preferences: {
          investment: {
            minInvestment: 100,
            maxInvestment: 10000,
            preferredCurrency: 'GHS',
            riskTolerance: 'medium',
            investmentHorizon: 'medium'
          },
          sectors: {
            preferred: [],
            excluded: []
          },
          geographic: {
            preferredCountries: ['Ghana'],
            excludedCountries: []
          },
          esg: {
            minimumScore: 50,
            priorities: ['environmental', 'social', 'governance']
          }
        },
        portfolio: {
          totalInvested: 0,
          currentValue: 0,
          totalReturn: 0,
          activeInvestments: 0
        }
      };
    } else if (userType === 'business') {
      userData.businessProfile = {
        businessId: null,
        businessName: businessInfo.businessName || '',
        role: businessInfo.role || 'owner',
        createdAt: new Date().toISOString()
      };
    }

    // Save user profile to DynamoDB
    await dynamoDBService.create('bvester-users-prod', userData);

    // Create welcome notification
    await dynamoDBService.create('bvester-notifications-prod', {
      id: uuidv4(),
      userId: userId,
      type: 'welcome',
      title: 'Welcome to Bvester!',
      message: `Welcome ${profile.displayName || 'to our platform'}! Please verify your email address to get started.`,
      channels: { email: true, push: false },
      priority: 'high',
      createdAt: new Date().toISOString(),
      read: false
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userId,
        email: email,
        userType: userType,
        emailVerified: false
      },
      nextSteps: [
        'Verify your email address',
        'Complete your profile',
        userType === 'business' ? 'Create your business profile' : 'Set your investment preferences'
      ]
    });

  } catch (error) {
    logger.error('Registration error:', error);

    if (error.code === 'UsernameExistsException') {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

/**
 * 🔐 LOGIN USER
 * Authenticate user with AWS Cognito
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceInfo = {} } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Authenticate with Cognito
    const authParams = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    const authResult = await cognito.adminInitiateAuth(authParams).promise();
    const tokens = authResult.AuthenticationResult;

    // Decode JWT to get user info
    const decodedToken = jwt.decode(tokens.IdToken);
    const userId = decodedToken.sub;

    // Get user profile from DynamoDB
    const userData = await dynamoDBService.get('bvester-users-prod', userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Check account status
    if (userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (userData.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Update login activity
    const loginCount = (userData.activity?.loginCount || 0) + 1;
    const updatedUser = {
      ...userData,
      activity: {
        ...userData.activity,
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        loginCount: loginCount
      },
      updatedAt: new Date().toISOString()
    };

    await dynamoDBService.update('bvester-users-prod', userId, updatedUser);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        uid: userId,
        email: userData.email,
        userType: userData.userType,
        emailVerified: decodedToken.email_verified,
        profile: userData.profile,
        subscription: userData.subscription,
        verification: userData.verification,
        preferences: userData.preferences
      },
      tokens: {
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken,
        refreshToken: tokens.RefreshToken
      },
      session: {
        loginCount: loginCount,
        lastLogin: updatedUser.activity.lastLoginAt,
        isNewUser: loginCount === 1
      }
    });

  } catch (error) {
    logger.error('Login error:', error);

    if (error.code === 'NotAuthorizedException') {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (error.code === 'UserNotConfirmedException') {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email address first',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * 🚪 LOGOUT USER
 * Invalidate user session
 */
router.post('/logout', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (accessToken) {
      // Revoke the access token
      await cognito.globalSignOut({
        AccessToken: accessToken
      }).promise();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

/**
 * 🔄 REFRESH TOKEN
 * Refresh user tokens
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const refreshParams = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    };

    const result = await cognito.adminInitiateAuth(refreshParams).promise();
    const tokens = result.AuthenticationResult;

    res.json({
      success: true,
      tokens: {
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

/**
 * 🔍 CHECK AUTH STATUS
 * Verify current authentication status
 */
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with Cognito
      const decodedToken = jwt.decode(token);
      const userId = decodedToken.sub;

      // Get user data
      const userData = await dynamoDBService.get('bvester-users-prod', userId);

      if (!userData) {
        return res.json({
          success: true,
          authenticated: false,
          user: null
        });
      }

      res.json({
        success: true,
        authenticated: true,
        user: {
          uid: userId,
          email: userData.email,
          userType: userData.userType,
          emailVerified: decodedToken.email_verified,
          profile: userData.profile,
          subscription: userData.subscription,
          verification: userData.verification,
          status: userData.status
        }
      });

    } catch (tokenError) {
      res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }

  } catch (error) {
    logger.error('Auth status check error:', error);
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

module.exports = router;