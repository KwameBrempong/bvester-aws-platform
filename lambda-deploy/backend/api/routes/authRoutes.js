// 🚀 BVESTER - AUTHENTICATION API ROUTES
// Firebase Auth integration with enhanced features

const express = require('express');
const router = express.Router();
const { FirebaseAdmin } = require('../../config/firebase-admin');
const authMiddleware = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');

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
    const userRecord = await FirebaseAdmin.adminAuth.createUser({
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
        businessId: null, // Will be set when business profile is created
        businessName: businessInfo.businessName || '',
        role: businessInfo.role || 'owner', // owner, manager, employee
        createdAt: new Date()
      };
    }

    // Save user profile to Firestore
    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userRecord.uid)
      .set(userData);

    // Send email verification
    const verificationLink = await FirebaseAdmin.adminAuth.generateEmailVerificationLink(email);

    // Create welcome notification
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
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
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
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
    logger.error('Registration error:', error);

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
    const decodedToken = await FirebaseAdmin.adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user profile
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

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

    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update(loginData);

    // Log login activity
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
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

    // Check for security alerts (unusual login location, etc.)
    const securityAlerts = await checkSecurityAlerts(userId, userData, deviceInfo);

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
      },
      securityAlerts: securityAlerts
    };

    res.json({
      success: true,
      message: 'Login successful',
      ...sessionData
    });

  } catch (error) {
    logger.error('Login error:', error);

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
 * 🚪 LOGOUT USER
 * Invalidate user session
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { deviceToken, revokeAllSessions = false } = req.body;

    if (revokeAllSessions) {
      // Revoke all refresh tokens
      await FirebaseAdmin.adminAuth.revokeRefreshTokens(userId);
    }

    // Remove device token if provided
    if (deviceToken) {
      const userDoc = await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.data();
      const deviceTokens = userData.activity?.deviceTokens || [];
      const updatedTokens = deviceTokens.filter(token => token !== deviceToken);

      await FirebaseAdmin.adminFirestore
        .collection('users')
        .doc(userId)
        .update({
          'activity.deviceTokens': updatedTokens,
          'metadata.updatedAt': new Date()
        });
    }

    // Log logout activity
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'user_logout',
        resource: { type: 'user', id: userId },
        details: { revokeAllSessions: revokeAllSessions },
        timestamp: new Date()
      });

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
    await FirebaseAdmin.adminAuth.checkActionCode(oobCode);
    const result = await FirebaseAdmin.adminAuth.applyActionCode(oobCode);

    // Update user verification status in Firestore
    const email = result.data.email;
    const userQuery = await FirebaseAdmin.adminFirestore
      .collection('users')
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
      await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .add({
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
      await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .add({
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
    logger.error('Email verification error:', error);

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
 * 🔄 RESEND EMAIL VERIFICATION
 * Send new email verification link
 */
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;

    // Check if email is already verified
    if (req.user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Check rate limiting (prevent spam)
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .get();

    const userData = userDoc.data();
    const lastAttempt = userData.verification?.lastVerificationAttempt;
    const attemptCount = userData.verification?.verificationAttempts || 0;

    // Rate limiting: max 3 attempts per hour
    if (lastAttempt && attemptCount >= 3) {
      const timeSinceLastAttempt = new Date() - lastAttempt.toDate();
      const oneHour = 60 * 60 * 1000;

      if (timeSinceLastAttempt < oneHour) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: new Date(lastAttempt.toDate().getTime() + oneHour)
        });
      }
    }

    // Generate new verification link
    const verificationLink = await FirebaseAdmin.adminAuth.generateEmailVerificationLink(userEmail);

    // Update attempt count
    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        'verification.lastVerificationAttempt': new Date(),
        'verification.verificationAttempts': (attemptCount % 3) + 1,
        'metadata.updatedAt': new Date()
      });

    // Create notification with verification link
    await FirebaseAdmin.adminFirestore
      .collection('notifications')
      .add({
        userId: userId,
        type: 'verification',
        title: 'Email Verification',
        message: 'Please verify your email address to continue using Bvester.',
        data: { verificationLink: verificationLink },
        channels: { email: true },
        priority: 'high',
        createdAt: new Date(),
        read: false
      });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      verificationLink: verificationLink
    });

  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
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
    const resetLink = await FirebaseAdmin.adminAuth.generatePasswordResetLink(email);

    // Log password reset request
    const userQuery = await FirebaseAdmin.adminFirestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      
      await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .add({
          userId: userDoc.id,
          action: 'password_reset_requested',
          resource: { type: 'user', id: userDoc.id },
          timestamp: new Date()
        });

      // Create notification
      await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .add({
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
    logger.error('Forgot password error:', error);

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
 * ✅ CONFIRM PASSWORD RESET
 * Confirm password reset with new password
 */
router.post('/confirm-password-reset', async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;

    if (!oobCode || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset code and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Verify and apply password reset
    const email = await FirebaseAdmin.adminAuth.verifyPasswordResetCode(oobCode);
    await FirebaseAdmin.adminAuth.confirmPasswordReset(oobCode, newPassword);

    // Log password reset completion
    const userQuery = await FirebaseAdmin.adminFirestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      
      await FirebaseAdmin.adminFirestore
        .collection('activityLogs')
        .add({
          userId: userDoc.id,
          action: 'password_reset_completed',
          resource: { type: 'user', id: userDoc.id },
          timestamp: new Date()
        });

      // Send security notification
      await FirebaseAdmin.adminFirestore
        .collection('notifications')
        .add({
          userId: userDoc.id,
          type: 'security',
          title: 'Password Reset Successful',
          message: 'Your password has been successfully reset. If this wasn\'t you, please contact support immediately.',
          channels: { email: true, push: true },
          priority: 'high',
          createdAt: new Date(),
          read: false
        });

      // Revoke all existing sessions for security
      await FirebaseAdmin.adminAuth.revokeRefreshTokens(userDoc.id);
    }

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    logger.error('Password reset confirmation error:', error);

    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

/**
 * 🔍 CHECK AUTH STATUS
 * Verify current authentication status
 */
router.get('/status', authMiddleware.optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // Get latest user data
    const userDoc = await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(req.user.uid)
      .get();

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
        uid: req.user.uid,
        email: userData.email,
        userType: userData.userType,
        emailVerified: req.user.emailVerified,
        profile: userData.profile,
        subscription: userData.subscription,
        verification: userData.verification,
        status: userData.status
      }
    });

  } catch (error) {
    logger.error('Auth status check error:', error);
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

/**
 * 🔒 DELETE ACCOUNT
 * Permanently delete user account
 */
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required'
      });
    }

    // For production, you'd want to verify the password
    // This is a simplified version

    // Mark user as deleted (soft delete)
    await FirebaseAdmin.adminFirestore
      .collection('users')
      .doc(userId)
      .update({
        status: 'deleted',
        deletion: {
          deletedAt: new Date(),
          reason: 'user_requested'
        },
        'metadata.updatedAt': new Date()
      });

    // Disable Firebase Auth account
    await FirebaseAdmin.adminAuth.updateUser(userId, { disabled: true });

    // Log account deletion
    await FirebaseAdmin.adminFirestore
      .collection('activityLogs')
      .add({
        userId: userId,
        action: 'account_deleted',
        resource: { type: 'user', id: userId },
        timestamp: new Date()
      });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Helper function to check for security alerts
async function checkSecurityAlerts(userId, userData, deviceInfo) {
  const alerts = [];

  try {
    // Check for new IP address
    const knownIPs = userData.activity?.ipAddresses || [];
    if (deviceInfo.ipAddress && !knownIPs.includes(deviceInfo.ipAddress)) {
      alerts.push({
        type: 'new_ip',
        severity: 'low',
        message: 'Login from new IP address detected',
        data: { ipAddress: deviceInfo.ipAddress }
      });
    }

    // Check for unusual location (would require IP geolocation service)
    // This is a placeholder for geolocation checking
    if (deviceInfo.location && userData.profile?.country) {
      const userCountry = userData.profile.country.toLowerCase();
      const loginCountry = deviceInfo.location.country?.toLowerCase();
      
      if (loginCountry && loginCountry !== userCountry) {
        alerts.push({
          type: 'unusual_location',
          severity: 'medium',
          message: 'Login from unusual location detected',
          data: { 
            expectedCountry: userData.profile.country,
            actualCountry: deviceInfo.location.country
          }
        });
      }
    }

    // Check for rapid successive logins
    const lastLogin = userData.activity?.lastLoginAt;
    if (lastLogin) {
      const timeSinceLastLogin = new Date() - lastLogin.toDate();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastLogin < fiveMinutes) {
        alerts.push({
          type: 'rapid_login',
          severity: 'low',
          message: 'Rapid successive login detected',
          data: { timeSinceLastLogin: timeSinceLastLogin }
        });
      }
    }

    // Store security alerts if any
    if (alerts.length > 0) {
      await FirebaseAdmin.adminFirestore
        .collection('securityAlerts')
        .add({
          userId: userId,
          alerts: alerts,
          deviceInfo: deviceInfo,
          createdAt: new Date(),
          resolved: false
        });
    }

    return alerts;

  } catch (error) {
    logger.error('Security check error:', error);
    return [];
  }
}

module.exports = router;