/**
 * BVESTER PLATFORM - ADVANCED AUTHENTICATION SERVICE
 * Enhanced authentication with OAuth, MFA, and role management
 * Generated: January 28, 2025
 */

const { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  reauthenticateWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  multiFactor,
  PhoneMultiFactorGenerator
} = require('firebase/auth');

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class AdvancedAuthService {
  constructor() {
    this.auth = getAuth();
    this.currentUser = null;
    
    // OAuth Providers
    this.providers = {
      google: new GoogleAuthProvider(),
      // LinkedIn provider would be custom implementation
    };
    
    // Configure OAuth scopes
    this.providers.google.addScope('email');
    this.providers.google.addScope('profile');
    
    // User roles and permissions
    this.roles = {
      admin: {
        name: 'Administrator',
        permissions: ['*'], // All permissions
        level: 100
      },
      business_owner: {
        name: 'Business Owner',
        permissions: [
          'business.create',
          'business.update',
          'business.delete',
          'financial.create',
          'financial.update',
          'opportunity.create',
          'opportunity.update',
          'messages.send',
          'messages.receive',
          'analytics.view'
        ],
        level: 50
      },
      investor: {
        name: 'Investor',
        permissions: [
          'investment.create',
          'portfolio.view',
          'portfolio.update',
          'business.view',
          'opportunity.view',
          'messages.send',
          'messages.receive',
          'analytics.view'
        ],
        level: 40
      },
      verified_investor: {
        name: 'Verified Investor',
        permissions: [
          'investment.create',
          'investment.large_amounts',
          'portfolio.view',
          'portfolio.update',
          'portfolio.advanced',
          'business.view',
          'business.detailed',
          'opportunity.view',
          'opportunity.premium',
          'messages.send',
          'messages.receive',
          'analytics.view',
          'analytics.advanced',
          'vr.access'
        ],
        level: 60
      },
      user: {
        name: 'Basic User',
        permissions: [
          'profile.view',
          'profile.update',
          'business.view_public',
          'opportunity.view_public'
        ],
        level: 10
      }
    };
    
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.handleUserStateChange(user);
      }
    });
  }
  
  // ============================================================================
  // ADVANCED OAUTH INTEGRATION
  // ============================================================================
  
  /**
   * Enhanced Google OAuth with profile creation
   */
  async signInWithGoogle(userType = 'investor') {
    try {
      const result = await signInWithPopup(this.auth, this.providers.google);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      // Get additional user info
      const additionalUserInfo = result._tokenResponse;
      
      // Check if user profile exists
      const profileResult = await FirebaseService.getUserProfile(user.uid);
      
      if (!profileResult.success) {
        // Create comprehensive user profile for new Google users
        const userProfile = {
          userId: user.uid,
          email: user.email,
          userType: userType,
          profile: {
            firstName: additionalUserInfo.firstName || user.displayName?.split(' ')[0] || '',
            lastName: additionalUserInfo.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: user.displayName || '',
            avatar: user.photoURL || null,
            phoneNumber: user.phoneNumber || '',
            locale: additionalUserInfo.locale || 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: 'en'
          },
          verification: {
            emailVerified: user.emailVerified,
            phoneVerified: false,
            kycStatus: 'pending',
            googleVerified: true,
            verificationProvider: 'google'
          },
          oauth: {
            google: {
              id: additionalUserInfo.localId,
              verified: true,
              connectedAt: new Date(),
              scope: ['email', 'profile'],
              refreshToken: credential?.refreshToken || null
            }
          },
          subscription: {
            plan: 'basic',
            status: 'active',
            source: 'google_signup'
          },
          security: {
            loginMethod: 'google_oauth',
            lastGoogleLogin: new Date(),
            ipAddress: await this.getClientIP(),
            userAgent: navigator.userAgent
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            loginCount: 1,
            referralCode: this.generateReferralCode(),
            signupSource: 'google'
          }
        };
        
        const createResult = await FirebaseService.createUser(userProfile);
        if (!createResult.success) {
          throw new Error('Failed to create user profile after Google login');
        }
        
        // Set custom claims for new user
        await this.setUserRole(user.uid, userType);
        
        // Send welcome notification
        await FirebaseService.createNotification({
          userId: user.uid,
          type: 'welcome',
          title: 'Welcome to Bvester!',
          message: `Welcome ${user.displayName}! Your account has been created successfully.`,
          channels: { email: true, push: true }
        });
      } else {
        // Update existing user's Google login info
        await FirebaseService.updateUserProfile(user.uid, {
          'oauth.google.lastLogin': new Date(),
          'security.lastGoogleLogin': new Date(),
          'metadata.lastLoginAt': new Date(),
          'metadata.loginCount': (profileResult.user.metadata?.loginCount || 0) + 1
        });
      }
      
      // Log Google login
      await FirebaseService.logActivity(
        user.uid,
        'oauth_login',
        'user',
        user.uid,
        { 
          provider: 'google',
          email: user.email,
          newUser: !profileResult.success
        }
      );
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          userType: userType,
          isNewUser: !profileResult.success
        },
        credential: credential
      };
      
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login failed';
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login cancelled by user';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked. Please allow popups and try again';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Login request cancelled';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Account exists with different login method';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * LinkedIn OAuth integration (custom implementation)
   */
  async signInWithLinkedIn(userType = 'business') {
    try {
      // LinkedIn OAuth flow would be implemented here
      // This requires custom implementation as Firebase doesn't have built-in LinkedIn provider
      
      const linkedInConfig = {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        redirectUri: process.env.LINKEDIN_REDIRECT_URI,
        scope: 'r_liteprofile r_emailaddress'
      };
      
      // Generate LinkedIn OAuth URL
      const authUrl = this.generateLinkedInAuthUrl(linkedInConfig);
      
      return {
        success: true,
        authUrl: authUrl,
        message: 'Redirect to LinkedIn for authentication'
      };
      
    } catch (error) {
      console.error('LinkedIn login initialization error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Handle LinkedIn OAuth callback
   */
  async handleLinkedInCallback(code, state) {
    try {
      // Exchange code for access token
      const tokenResponse = await this.exchangeLinkedInCode(code);
      
      if (!tokenResponse.access_token) {
        throw new Error('Failed to get LinkedIn access token');
      }
      
      // Get LinkedIn profile data
      const profileData = await this.getLinkedInProfile(tokenResponse.access_token);
      
      // Create or update user profile
      const userProfile = await this.createLinkedInUser(profileData, tokenResponse);
      
      return {
        success: true,
        user: userProfile,
        accessToken: tokenResponse.access_token
      };
      
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================================
  
  /**
   * Set user role with custom claims
   */
  async setUserRole(userId, role) {
    try {
      if (!this.roles[role]) {
        return { success: false, error: 'Invalid role' };
      }
      
      const roleData = this.roles[role];
      
      // Set custom claims in Firebase
      await FirebaseAdmin.setCustomClaims(userId, {
        role: role,
        permissions: roleData.permissions,
        level: roleData.level,
        updatedAt: new Date().toISOString()
      });
      
      // Update user profile in Firestore
      await FirebaseService.updateUserProfile(userId, {
        'role.current': role,
        'role.name': roleData.name,
        'role.level': roleData.level,
        'role.permissions': roleData.permissions,
        'role.assignedAt': new Date(),
        'metadata.updatedAt': new Date()
      });
      
      // Log role assignment
      await FirebaseService.logActivity(
        userId,
        'role_assigned',
        'user',
        userId,
        { role: role, permissions: roleData.permissions.length }
      );
      
      return { success: true, role: roleData };
      
    } catch (error) {
      console.error('Error setting user role:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check user permission
   */
  async checkPermission(userId, permission) {
    try {
      // Get user's current role and permissions
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { allowed: false, error: 'User not found' };
      }
      
      const userRole = userResult.user.role;
      if (!userRole) {
        return { allowed: false, error: 'No role assigned' };
      }
      
      // Check if user has admin role (all permissions)
      if (userRole.permissions.includes('*')) {
        return { allowed: true, role: userRole.current };
      }
      
      // Check specific permission
      const hasPermission = userRole.permissions.includes(permission);
      
      return {
        allowed: hasPermission,
        role: userRole.current,
        permission: permission
      };
      
    } catch (error) {
      console.error('Error checking permission:', error);
      return { allowed: false, error: error.message };
    }
  }
  
  /**
   * Get user's effective permissions
   */
  async getUserPermissions(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const userRole = userResult.user.role;
      if (!userRole) {
        return { success: false, error: 'No role assigned' };
      }
      
      return {
        success: true,
        role: userRole.current,
        permissions: userRole.permissions,
        level: userRole.level
      };
      
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // MULTI-FACTOR AUTHENTICATION (MFA)
  // ============================================================================
  
  /**
   * Enable TOTP (Time-based One-Time Password) for user
   */
  async enableTOTP(userId) {
    try {
      // Generate secret key
      const secret = speakeasy.generateSecret({
        name: `Bvester (${userId})`,
        issuer: 'Bvester Platform',
        length: 32
      });
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      // Store secret temporarily (user needs to confirm setup)
      await FirebaseService.updateUserProfile(userId, {
        'security.totp.tempSecret': secret.base32,
        'security.totp.setupInProgress': true,
        'security.totp.setupStartedAt': new Date()
      });
      
      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        setupInstructions: [
          '1. Download an authenticator app (Google Authenticator, Authy, etc.)',
          '2. Scan the QR code or manually enter the key',
          '3. Enter the 6-digit code from your app to confirm setup'
        ]
      };
      
    } catch (error) {
      console.error('Error enabling TOTP:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Confirm TOTP setup
   */
  async confirmTOTPSetup(userId, token) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const tempSecret = userResult.user.security?.totp?.tempSecret;
      if (!tempSecret) {
        return { success: false, error: 'TOTP setup not in progress' };
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps tolerance
      });
      
      if (!verified) {
        return { success: false, error: 'Invalid verification code' };
      }
      
      // Enable TOTP for user
      await FirebaseService.updateUserProfile(userId, {
        'security.totp.enabled': true,
        'security.totp.secret': tempSecret,
        'security.totp.enabledAt': new Date(),
        'security.totp.backupCodes': this.generateBackupCodes(),
        'security.mfaEnabled': true,
        'security.totp.tempSecret': null,
        'security.totp.setupInProgress': false
      });
      
      // Log MFA enablement
      await FirebaseService.logActivity(
        userId,
        'mfa_enabled',
        'security',
        userId,
        { method: 'totp' }
      );
      
      return {
        success: true,
        message: 'TOTP authentication enabled successfully',
        backupCodes: this.generateBackupCodes()
      };
      
    } catch (error) {
      console.error('Error confirming TOTP setup:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Verify TOTP token
   */
  async verifyTOTP(userId, token) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const totpSecret = userResult.user.security?.totp?.secret;
      if (!totpSecret) {
        return { success: false, error: 'TOTP not enabled for user' };
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: totpSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      
      if (verified) {
        // Update last successful MFA
        await FirebaseService.updateUserProfile(userId, {
          'security.lastMfaSuccess': new Date()
        });
        
        await FirebaseService.logActivity(
          userId,
          'mfa_success',
          'security',
          userId,
          { method: 'totp' }
        );
      } else {
        await FirebaseService.logActivity(
          userId,
          'mfa_failed',
          'security',
          userId,
          { method: 'totp', reason: 'invalid_token' }
        );
      }
      
      return { success: verified };
      
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * SMS-based MFA
   */
  async sendSMSCode(userId, phoneNumber) {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store code temporarily
      await FirebaseService.updateUserProfile(userId, {
        'security.sms.code': code,
        'security.sms.expiresAt': expiresAt,
        'security.sms.phoneNumber': phoneNumber,
        'security.sms.attempts': 0
      });
      
      // Send SMS (would integrate with Twilio in production)
      const smsResult = await this.sendSMS(phoneNumber, `Your Bvester verification code is: ${code}`);
      
      if (smsResult.success) {
        await FirebaseService.logActivity(
          userId,
          'sms_code_sent',
          'security',
          userId,
          { phoneNumber: this.maskPhoneNumber(phoneNumber) }
        );
      }
      
      return {
        success: smsResult.success,
        message: 'Verification code sent to your phone',
        expiresAt: expiresAt
      };
      
    } catch (error) {
      console.error('Error sending SMS code:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Verify SMS code
   */
  async verifySMSCode(userId, code) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const smsData = userResult.user.security?.sms;
      if (!smsData || !smsData.code) {
        return { success: false, error: 'No SMS verification in progress' };
      }
      
      // Check expiration
      if (new Date() > new Date(smsData.expiresAt)) {
        return { success: false, error: 'Verification code expired' };
      }
      
      // Check attempts
      if (smsData.attempts >= 3) {
        return { success: false, error: 'Too many failed attempts' };
      }
      
      // Verify code
      if (code === smsData.code) {
        // Clear SMS data
        await FirebaseService.updateUserProfile(userId, {
          'security.sms': null,
          'security.phoneVerified': true,
          'security.lastMfaSuccess': new Date()
        });
        
        await FirebaseService.logActivity(
          userId,
          'sms_verification_success',
          'security',
          userId
        );
        
        return { success: true };
      } else {
        // Increment attempts
        await FirebaseService.updateUserProfile(userId, {
          'security.sms.attempts': smsData.attempts + 1
        });
        
        await FirebaseService.logActivity(
          userId,
          'sms_verification_failed',
          'security',
          userId,
          { attempts: smsData.attempts + 1 }
        );
        
        return { success: false, error: 'Invalid verification code' };
      }
      
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  
  /**
   * Create secure session
   */
  async createSession(userId, deviceInfo = {}) {
    try {
      const sessionId = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const session = {
        sessionId: sessionId,
        userId: userId,
        createdAt: new Date(),
        expiresAt: expiresAt,
        lastActivity: new Date(),
        device: {
          userAgent: deviceInfo.userAgent || '',
          ipAddress: deviceInfo.ipAddress || '',
          platform: deviceInfo.platform || '',
          browser: deviceInfo.browser || ''
        },
        isActive: true
      };
      
      // Store session in Firestore
      await FirebaseAdmin.adminFirestore
        .collection('userSessions')
        .doc(sessionId)
        .set(session);
      
      // Update user's active sessions
      await FirebaseService.updateUserProfile(userId, {
        'security.lastSessionCreated': new Date(),
        'security.activeSessionCount': FirebaseService.increment(1)
      });
      
      return {
        success: true,
        sessionId: sessionId,
        expiresAt: expiresAt
      };
      
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Validate session
   */
  async validateSession(sessionId) {
    try {
      const sessionDoc = await FirebaseAdmin.adminFirestore
        .collection('userSessions')
        .doc(sessionId)
        .get();
      
      if (!sessionDoc.exists) {
        return { valid: false, error: 'Session not found' };
      }
      
      const session = sessionDoc.data();
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(sessionId);
        return { valid: false, error: 'Session expired' };
      }
      
      // Check if session is active
      if (!session.isActive) {
        return { valid: false, error: 'Session inactive' };
      }
      
      // Update last activity
      await sessionDoc.ref.update({
        lastActivity: new Date()
      });
      
      return {
        valid: true,
        session: session
      };
      
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Invalidate session
   */
  async invalidateSession(sessionId) {
    try {
      const sessionDoc = await FirebaseAdmin.adminFirestore
        .collection('userSessions')
        .doc(sessionId)
        .get();
      
      if (sessionDoc.exists) {
        const session = sessionDoc.data();
        
        await sessionDoc.ref.update({
          isActive: false,
          invalidatedAt: new Date()
        });
        
        // Update user's active session count
        await FirebaseService.updateUserProfile(session.userId, {
          'security.activeSessionCount': FirebaseService.increment(-1)
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error invalidating session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user's active sessions
   */
  async getUserSessions(userId) {
    try {
      const sessionsQuery = FirebaseAdmin.adminFirestore
        .collection('userSessions')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .orderBy('lastActivity', 'desc');
      
      const snapshot = await sessionsQuery.get();
      const sessions = [];
      
      snapshot.forEach(doc => {
        const session = doc.data();
        sessions.push({
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          device: session.device,
          isCurrent: false // Would be determined by comparing with current session
        });
      });
      
      return { success: true, sessions };
      
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate secure token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Generate backup codes for MFA
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
  
  /**
   * Generate referral code
   */
  generateReferralCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  /**
   * Get client IP address
   */
  async getClientIP() {
    try {
      // This would be implemented to get actual client IP
      return '127.0.0.1'; // Placeholder
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Mask phone number for privacy
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
  }
  
  /**
   * Send SMS (integration with Twilio)
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Twilio integration would go here
      // For now, just log the message
      console.log(`SMS to ${phoneNumber}: ${message}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate LinkedIn OAuth URL
   */
  generateLinkedInAuthUrl(config) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: this.generateSecureToken(16)
    });
    
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }
  
  /**
   * Exchange LinkedIn code for token
   */
  async exchangeLinkedInCode(code) {
    try {
      // LinkedIn token exchange implementation
      // This would make HTTP request to LinkedIn's token endpoint
      throw new Error('LinkedIn integration not fully implemented');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get LinkedIn profile data
   */
  async getLinkedInProfile(accessToken) {
    try {
      // LinkedIn profile API implementation
      // This would make HTTP request to LinkedIn's profile endpoint
      throw new Error('LinkedIn integration not fully implemented');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Create LinkedIn user profile
   */
  async createLinkedInUser(profileData, tokenData) {
    try {
      // Create user profile from LinkedIn data
      throw new Error('LinkedIn integration not fully implemented');
    } catch (error) {
      throw error;
    }
  }
  
  // ============================================================================
  // PASSWORD RESET & RECOVERY
  // ============================================================================
  
  /**
   * Enhanced password reset with security measures
   */
  async initiatePasswordReset(email, userType = null) {
    try {
      // Check if user exists
      const userQuery = FirebaseAdmin.adminFirestore
        .collection('users')
        .where('email', '==', email);
      
      const snapshot = await userQuery.get();
      
      if (snapshot.empty) {
        // Don't reveal if email exists or not for security
        return { 
          success: true, 
          message: 'If this email exists, you will receive reset instructions.' 
        };
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      // Generate secure reset token
      const resetToken = this.generateSecureToken(32);
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      await userDoc.ref.update({
        'security.passwordReset': {
          token: resetToken,
          expiresAt: resetExpires,
          requestedAt: new Date(),
          ipAddress: await this.getClientIP(),
          attempts: 0
        },
        'metadata.updatedAt': new Date()
      });
      
      // Send password reset email via Firebase Auth
      await sendPasswordResetEmail(this.auth, email);
      
      // Also create custom reset link for enhanced features
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // Send notification
      await FirebaseService.createNotification({
        userId: userData.userId,
        type: 'security',
        title: 'Password Reset Requested',
        message: 'A password reset was requested for your account. Click the link in your email to reset your password.',
        data: { resetToken },
        channels: { email: true }
      });
      
      // Log security event
      await FirebaseService.logActivity(
        userData.userId,
        'password_reset_requested',
        'security',
        userData.userId,
        { email: this.maskEmail(email) }
      );
      
      return { 
        success: true, 
        message: 'Password reset instructions sent to your email.',
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      };
      
    } catch (error) {
      console.error('Error initiating password reset:', error);
      return { success: false, error: 'Unable to process password reset request' };
    }
  }
  
  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token, email) {
    try {
      const userQuery = FirebaseAdmin.adminFirestore
        .collection('users')
        .where('email', '==', email);
      
      const snapshot = await userQuery.get();
      
      if (snapshot.empty) {
        return { valid: false, error: 'Invalid reset request' };
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const resetData = userData.security?.passwordReset;
      
      if (!resetData || !resetData.token) {
        return { valid: false, error: 'No reset request found' };
      }
      
      if (resetData.token !== token) {
        // Increment failed attempts
        await userDoc.ref.update({
          'security.passwordReset.attempts': (resetData.attempts || 0) + 1
        });
        
        return { valid: false, error: 'Invalid reset token' };
      }
      
      if (new Date() > new Date(resetData.expiresAt)) {
        return { valid: false, error: 'Reset token has expired' };
      }
      
      return { 
        valid: true, 
        userId: userData.userId,
        email: userData.email 
      };
      
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      return { valid: false, error: 'Unable to verify reset token' };
    }
  }
  
  /**
   * Complete password reset
   */
  async completePasswordReset(token, email, newPassword) {
    try {
      // Verify token first
      const tokenVerification = await this.verifyPasswordResetToken(token, email);
      if (!tokenVerification.valid) {
        return tokenVerification;
      }
      
      // Update password using Firebase Auth
      const user = await FirebaseAdmin.getUserByEmail(email);
      await FirebaseAdmin.updateUser(user.uid, {
        password: newPassword
      });
      
      // Clear reset token and update security info
      const userQuery = FirebaseAdmin.adminFirestore
        .collection('users')
        .where('email', '==', email);
      
      const snapshot = await userQuery.get();
      const userDoc = snapshot.docs[0];
      
      await userDoc.ref.update({
        'security.passwordReset': null,
        'security.lastPasswordChange': new Date(),
        'security.passwordResetCount': FirebaseService.increment(1),
        'metadata.updatedAt': new Date()
      });
      
      // Log security event
      await FirebaseService.logActivity(
        tokenVerification.userId,
        'password_reset_completed',
        'security',
        tokenVerification.userId
      );
      
      // Send confirmation notification
      await FirebaseService.createNotification({
        userId: tokenVerification.userId,
        type: 'security',
        title: 'Password Changed',
        message: 'Your password has been successfully changed.',
        channels: { email: true, push: true }
      });
      
      // Invalidate all existing sessions for security
      await this.invalidateAllUserSessions(tokenVerification.userId);
      
      return { 
        success: true, 
        message: 'Password has been reset successfully. Please log in with your new password.' 
      };
      
    } catch (error) {
      console.error('Error completing password reset:', error);
      return { success: false, error: 'Unable to complete password reset' };
    }
  }
  
  // ============================================================================
  // BASIC KYC VERIFICATION
  // ============================================================================
  
  /**
   * Submit KYC documents
   */
  async submitKYCDocuments(userId, documents, personalInfo) {
    try {
      const kycData = {
        status: 'pending',
        submittedAt: new Date(),
        documents: documents.map(doc => ({
          type: doc.type, // 'id_card', 'passport', 'drivers_license', 'proof_of_address'
          filename: doc.filename,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          uploadedAt: new Date()
        })),
        personalInfo: {
          fullName: personalInfo.fullName,
          dateOfBirth: personalInfo.dateOfBirth,
          nationality: personalInfo.nationality,
          address: {
            street: personalInfo.address.street,
            city: personalInfo.address.city,
            state: personalInfo.address.state,
            country: personalInfo.address.country,
            postalCode: personalInfo.address.postalCode
          },
          phoneNumber: personalInfo.phoneNumber
        },
        verification: {
          provider: 'manual', // Could be 'jumio', 'onfido', etc.
          submissionId: this.generateSecureToken(16),
          attempts: 1
        }
      };
      
      // Update user profile with KYC data
      await FirebaseService.updateUserProfile(userId, {
        'verification.kycStatus': 'pending',
        'verification.kycDocuments': kycData.documents,
        'verification.kycSubmittedAt': new Date(),
        'verification.kycData': kycData,
        'metadata.updatedAt': new Date()
      });
      
      // Log KYC submission
      await FirebaseService.logActivity(
        userId,
        'kyc_submitted',
        'verification',
        userId,
        { documentCount: documents.length, submissionId: kycData.verification.submissionId }
      );
      
      // Send confirmation notification
      await FirebaseService.createNotification({
        userId: userId,
        type: 'verification',
        title: 'KYC Documents Submitted',
        message: 'Your identity verification documents have been submitted for review. We will notify you once the review is complete.',
        data: { submissionId: kycData.verification.submissionId },
        channels: { email: true, push: true }
      });
      
      return { 
        success: true, 
        submissionId: kycData.verification.submissionId,
        message: 'KYC documents submitted successfully. Review typically takes 1-3 business days.'
      };
      
    } catch (error) {
      console.error('Error submitting KYC documents:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update KYC status (admin function)
   */
  async updateKYCStatus(userId, status, reviewNotes = '', reviewerId = null) {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'requires_additional_info'];
      
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid KYC status' };
      }
      
      const updateData = {
        'verification.kycStatus': status,
        'verification.kycReviewedAt': new Date(),
        'verification.kycReviewNotes': reviewNotes,
        'verification.kycReviewerId': reviewerId,
        'metadata.updatedAt': new Date()
      };
      
      if (status === 'approved') {
        updateData['verification.kycApprovedAt'] = new Date();
        updateData['verification.kycVerified'] = true;
      }
      
      await FirebaseService.updateUserProfile(userId, updateData);
      
      // Log status change
      await FirebaseService.logActivity(
        reviewerId || 'system',
        'kyc_status_updated',
        'verification',
        userId,
        { newStatus: status, reviewerId }
      );
      
      // Send notification to user
      let notificationTitle = '';
      let notificationMessage = '';
      
      switch (status) {
        case 'approved':
          notificationTitle = 'Identity Verified!';
          notificationMessage = 'Your identity has been successfully verified. You now have access to all platform features.';
          break;
        case 'rejected':
          notificationTitle = 'Identity Verification Failed';
          notificationMessage = 'Your identity verification was not successful. Please check your email for details and resubmit if needed.';
          break;
        case 'requires_additional_info':
          notificationTitle = 'Additional Information Required';
          notificationMessage = 'We need additional information to complete your identity verification. Please check your email for details.';
          break;
      }
      
      if (notificationTitle) {
        await FirebaseService.createNotification({
          userId: userId,
          type: 'verification',
          title: notificationTitle,
          message: notificationMessage,
          data: { kycStatus: status, reviewNotes },
          channels: { email: true, push: true }
        });
      }
      
      return { success: true, status };
      
    } catch (error) {
      console.error('Error updating KYC status:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get KYC status and details
   */
  async getKYCStatus(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const verification = userResult.user.verification || {};
      
      return {
        success: true,
        kyc: {
          status: verification.kycStatus || 'not_started',
          verified: verification.kycVerified || false,
          submittedAt: verification.kycSubmittedAt,
          reviewedAt: verification.kycReviewedAt,
          approvedAt: verification.kycApprovedAt,
          reviewNotes: verification.kycReviewNotes,
          documentCount: verification.kycDocuments?.length || 0,
          submissionId: verification.kycData?.verification?.submissionId
        }
      };
      
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // ENHANCED UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Mask email for privacy
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return '****';
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 ? 
      username.substring(0, 2) + '*'.repeat(username.length - 2) : 
      '*'.repeat(username.length);
    return `${maskedUsername}@${domain}`;
  }
  
  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId) {
    try {
      const sessionsQuery = FirebaseAdmin.adminFirestore
        .collection('userSessions')
        .where('userId', '==', userId)
        .where('isActive', '==', true);
      
      const snapshot = await sessionsQuery.get();
      const batch = FirebaseAdmin.adminFirestore.batch();
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: 'password_reset'
        });
      });
      
      await batch.commit();
      
      // Update user's active session count
      await FirebaseService.updateUserProfile(userId, {
        'security.activeSessionCount': 0
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error invalidating all user sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle user state change
   */
  async handleUserStateChange(user) {
    try {
      // Update last activity and login tracking
      await FirebaseService.updateUserProfile(user.uid, {
        'metadata.lastActivity': new Date()
      });
    } catch (error) {
      console.error('Error handling user state change:', error);
    }
  }
}

module.exports = new AdvancedAuthService();