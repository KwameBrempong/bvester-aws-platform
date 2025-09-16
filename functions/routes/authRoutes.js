// Firebase Functions - Authentication Routes
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();
const auth = admin.auth();

/**
 * 📝 REGISTER USER
 * Create new user account with profile setup
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      userType, // 'investor', 'business', 'admin'
      profile = {},
      businessInfo = {} // Only for business users
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

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });

    // Create user profile in Firestore
    const userData = {
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
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        preferredCurrency: profile.preferredCurrency || 'USD',
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
        startDate: new Date(),
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
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'self_registration',
        source: 'web'
      }
    };

    // Add user type specific data
    if (userType === 'investor') {
      userData.investorProfile = {
        preferences: {
          investment: {
            minInvestment: 100,
            maxInvestment: 10000,
            preferredCurrency: 'USD',
            riskTolerance: 'medium',
            investmentHorizon: 'medium'
          },
          sectors: {
            preferred: [],
            excluded: []
          },
          geographic: {
            preferredCountries: [],
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
        createdAt: new Date()
      };
    }

    // Save user profile to Firestore
    await db.collection('users').doc(userRecord.uid).set(userData);

    // Send email verification
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // Create welcome notification
    await db.collection('notifications').add({
      userId: userRecord.uid,
      type: 'welcome',
      title: 'Welcome to Bvester!',
      message: `Welcome ${profile.displayName || 'to our platform'}! Please verify your email address to get started.`,
      data: { verificationLink: verificationLink },
      channels: { email: true, push: false },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    // Log registration
    await db.collection('activityLogs').add({
      userId: userRecord.uid,
      action: 'user_registered',
      resource: { type: 'user', id: userRecord.uid },
      details: { userType: userType, email: email },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: email,
        userType: userType,
        emailVerified: false
      },
      verificationLink: verificationLink,
      nextSteps: [
        'Verify your email address',
        'Complete your profile',
        userType === 'business' ? 'Create your business profile' : 'Set your investment preferences'
      ]
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
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
 * Authenticate user and return session info
 */
router.post('/login', async (req, res) => {
  try {
    const { idToken, deviceInfo = {} } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    const userData = userDoc.data();

    // Check if account is suspended or deactivated
    if (userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended',
        code: 'ACCOUNT_SUSPENDED',
        details: userData.suspension
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
    const loginData = {
      'activity.lastLoginAt': new Date(),
      'activity.lastActiveAt': new Date(),
      'activity.loginCount': (userData.activity?.loginCount || 0) + 1,
      'metadata.updatedAt': new Date()
    };

    // Track IP and device info if provided
    if (deviceInfo.ipAddress) {
      const ipAddresses = userData.activity?.ipAddresses || [];
      if (!ipAddresses.includes(deviceInfo.ipAddress)) {
        ipAddresses.push(deviceInfo.ipAddress);
        loginData['activity.ipAddresses'] = ipAddresses.slice(-10); // Keep last 10 IPs
      }
    }

    if (deviceInfo.deviceToken) {
      const deviceTokens = userData.activity?.deviceTokens || [];
      if (!deviceTokens.includes(deviceInfo.deviceToken)) {
        deviceTokens.push(deviceInfo.deviceToken);
        loginData['activity.deviceTokens'] = deviceTokens.slice(-5); // Keep last 5 tokens
      }
    }

    await db.collection('users').doc(userId).update(loginData);

    // Log login activity
    await db.collection('activityLogs').add({
      userId: userId,
      action: 'user_login',
      resource: { type: 'user', id: userId },
      details: { 
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceType: deviceInfo.deviceType
      },
      timestamp: new Date()
    });

    // Return user session data
    const sessionData = {
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
      session: {
        loginCount: loginData['activity.loginCount'],
        lastLogin: loginData['activity.lastLoginAt'],
        isNewUser: loginData['activity.loginCount'] === 1
      }
    };

    res.json({
      success: true,
      message: 'Login successful',
      ...sessionData
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Session has been revoked. Please login again.',
        code: 'TOKEN_REVOKED'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * 📧 VERIFY EMAIL
 * Verify user email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { oobCode } = req.body;

    if (!oobCode) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      });
    }

    // Verify the email using Firebase Admin
    await auth.checkActionCode(oobCode);
    const result = await auth.applyActionCode(oobCode);

    // Update user verification status in Firestore
    const email = result.data.email;
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        'verification.emailVerified': true,
        'verification.emailVerifiedAt': new Date(),
        'metadata.updatedAt': new Date()
      });

      // Send welcome notification
      await db.collection('notifications').add({
        userId: userDoc.id,
        type: 'verification',
        title: 'Email Verified!',
        message: 'Your email has been verified successfully. You can now access all platform features.',
        channels: { push: true },
        priority: 'normal',
        createdAt: new Date(),
        read: false
      });

      // Log verification
      await db.collection('activityLogs').add({
        userId: userDoc.id,
        action: 'email_verified',
        resource: { type: 'user', id: userDoc.id },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);

    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to verify email'
    });
  }
});

/**
 * 🔐 FORGOT PASSWORD
 * Send password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // Log password reset request
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      
      await db.collection('activityLogs').add({
        userId: userDoc.id,
        action: 'password_reset_requested',
        resource: { type: 'user', id: userDoc.id },
        timestamp: new Date()
      });

      // Create notification
      await db.collection('notifications').add({
        userId: userDoc.id,
        type: 'security',
        title: 'Password Reset Requested',
        message: 'A password reset has been requested for your account. If this wasn\'t you, please contact support.',
        data: { resetLink: resetLink },
        channels: { email: true, push: true },
        priority: 'high',
        createdAt: new Date(),
        read: false
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      resetLink: resetLink
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset email has been sent.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send password reset email'
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

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get latest user data
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: userData.email,
        userType: userData.userType,
        emailVerified: decodedToken.email_verified,
        profile: userData.profile,
        subscription: userData.subscription,
        verification: userData.verification,
        status: userData.status
      }
    });

  } catch (error) {
    console.error('Auth status check error:', error);
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

module.exports = router;