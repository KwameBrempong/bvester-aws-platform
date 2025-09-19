/**
 * BVESTER PLATFORM - AUTHENTICATION SERVICE
 * Comprehensive user authentication and authorization
 * Generated: January 28, 2025
 */

const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  reauthenticateWithCredential,
  EmailAuthProvider
} = require('firebase/auth');

const FirebaseService = require('./firebaseService');

class AuthService {
  constructor() {
    this.auth = getAuth();
    this.currentUser = null;
    
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.handleUserLogin(user);
      }
    });
  }
  
  // ============================================================================
  // USER REGISTRATION
  // ============================================================================
  
  /**
   * Register new user (Business or Investor)
   */
  async registerUser(userData) {
    try {
      const { email, password, userType, ...profileData } = userData;
      
      // Validate required fields
      if (!email || !password || !userType) {
        return { 
          success: false, 
          error: 'Email, password, and user type are required' 
        };
      }
      
      if (!['investor', 'business'].includes(userType)) {
        return { 
          success: false, 
          error: 'User type must be either "investor" or "business"' 
        };
      }
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${profileData.firstName} ${profileData.lastName}`
      });
      
      // Create comprehensive user profile in Firestore
      const userProfile = {
        userId: user.uid,
        email: email,
        userType: userType,
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          displayName: `${profileData.firstName} ${profileData.lastName}`,
          avatar: null,
          phoneNumber: profileData.phoneNumber || '',
          country: profileData.country || '',
          city: profileData.city || '',
          timezone: profileData.timezone || 'UTC',
          language: profileData.language || 'en'
        },
        verification: {
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'pending',
          kycDocuments: [],
          kycProvider: null,
          verifiedAt: null
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: new Date(),
          endDate: null,
          paymentMethod: null,
          subscriptionId: null
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'public',
            dataSharing: true
          },
          currency: profileData.currency || 'USD'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          loginCount: 1,
          referralCode: this.generateReferralCode(),
          referredBy: profileData.referredBy || null
        }
      };
      
      // Save to Firestore
      const dbResult = await FirebaseService.createUser({
        ...userProfile,
        password: password // This will be handled securely
      });
      
      if (!dbResult.success) {
        // If Firestore creation fails, we should clean up the Auth user
        await deleteUser(user);
        return { success: false, error: 'Failed to create user profile' };
      }
      
      // Send email verification
      await this.sendEmailVerification();
      
      // Log registration activity
      await FirebaseService.logActivity(
        user.uid, 
        'user_registered', 
        'user', 
        user.uid,
        { userType, email }
      );
      
      // Create welcome notification
      await FirebaseService.createNotification({
        userId: user.uid,
        type: 'system',
        title: 'Welcome to Bvester!',
        message: `Welcome to Africa's leading investment platform. Complete your profile to get started.`,
        channels: {
          push: true,
          email: true,
          sms: false
        }
      });
      
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          userType: userType,
          profile: userProfile.profile
        },
        message: 'Registration successful. Please verify your email.'
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase Auth errors
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email address is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  // ============================================================================
  // USER LOGIN
  // ============================================================================
  
  /**
   * Login user with email and password
   */
  async loginUser(email, password) {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const profileResult = await FirebaseService.getUserProfile(user.uid);
      
      if (!profileResult.success) {
        return { success: false, error: 'User profile not found' };
      }
      
      const userProfile = profileResult.user;
      
      // Update login metadata
      await FirebaseService.updateUserProfile(user.uid, {
        'metadata.lastLoginAt': new Date(),
        'metadata.loginCount': userProfile.metadata.loginCount + 1
      });
      
      // Log login activity
      await FirebaseService.logActivity(
        user.uid, 
        'user_login', 
        'user', 
        user.uid,
        { email, loginMethod: 'email_password' }
      );
      
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          userType: userProfile.userType,
          profile: userProfile.profile,
          subscription: userProfile.subscription,
          emailVerified: user.emailVerified
        }
      };
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Login with Google OAuth
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      // Check if user profile exists in Firestore
      const profileResult = await FirebaseService.getUserProfile(user.uid);
      
      if (!profileResult.success) {
        // Create user profile for new Google users
        const userProfile = {
          userId: user.uid,
          email: user.email,
          userType: 'investor', // Default for Google login
          profile: {
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: user.displayName || '',
            avatar: user.photoURL || null,
            phoneNumber: user.phoneNumber || '',
          },
          verification: {
            emailVerified: user.emailVerified,
            phoneVerified: false,
            kycStatus: 'pending'
          },
          subscription: {
            plan: 'basic',
            status: 'active'
          },
          metadata: {
            createdAt: new Date(),
            loginCount: 1,
            referralCode: this.generateReferralCode()
          }
        };
        
        await FirebaseService.createUser(userProfile);
      }
      
      // Log Google login
      await FirebaseService.logActivity(
        user.uid, 
        'user_login', 
        'user', 
        user.uid,
        { email: user.email, loginMethod: 'google_oauth' }
      );
      
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        }
      };
      
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Google login failed' };
    }
  }
  
  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================
  
  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      
      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      };
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Password reset failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Update user password
   */
  async updateUserPassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        this.currentUser.email, 
        currentPassword
      );
      
      await reauthenticateWithCredential(this.currentUser, credential);
      
      // Update password
      await updatePassword(this.currentUser, newPassword);
      
      // Log password change
      await FirebaseService.logActivity(
        this.currentUser.uid, 
        'password_changed', 
        'user', 
        this.currentUser.uid
      );
      
      return { success: true, message: 'Password updated successfully' };
      
    } catch (error) {
      console.error('Password update error:', error);
      
      let errorMessage = 'Password update failed';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================
  
  /**
   * Send email verification
   */
  async sendEmailVerification() {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      await sendEmailVerification(this.currentUser);
      
      return { 
        success: true, 
        message: 'Verification email sent successfully' 
      };
      
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }
  
  // ============================================================================
  // USER LOGOUT
  // ============================================================================
  
  /**
   * Logout current user
   */
  async logoutUser() {
    try {
      if (this.currentUser) {
        // Log logout activity
        await FirebaseService.logActivity(
          this.currentUser.uid, 
          'user_logout', 
          'user', 
          this.currentUser.uid
        );
      }
      
      await signOut(this.auth);
      
      return { success: true, message: 'Logged out successfully' };
      
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }
  
  // ============================================================================
  // USER SESSION MANAGEMENT
  // ============================================================================
  
  /**
   * Get current user session
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }
  
  /**
   * Get user role/type
   */
  async getUserRole() {
    if (!this.currentUser) {
      return null;
    }
    
    const profileResult = await FirebaseService.getUserProfile(this.currentUser.uid);
    return profileResult.success ? profileResult.user.userType : null;
  }
  
  /**
   * Handle user login (called by auth state listener)
   */
  async handleUserLogin(user) {
    try {
      // Update last login time
      await FirebaseService.updateUserProfile(user.uid, {
        'metadata.lastLoginAt': new Date()
      });
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate referral code
   */
  generateReferralCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate password strength
   */
  isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
  
  /**
   * Get password strength score
   */
  getPasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      score: score,
      strength: strength[score] || 'Very Weak',
      isValid: score >= 4
    };
  }
}

module.exports = new AuthService();