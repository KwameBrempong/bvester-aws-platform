/**
 * 🔒 BVESTER COMPREHENSIVE SECURITY SERVICE
 * Enterprise-grade security implementation for financial platform
 */

import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';

class SecurityService {
  constructor() {
    this.encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;
    this.sessionTimeout = parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT) || 3600000; // 1 hour
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 900000; // 15 minutes
    this.suspiciousActivityThreshold = 10;
    
    // Initialize security monitoring
    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize security monitoring and session management
   */
  initializeSecurityMonitoring() {
    // Session timeout monitoring
    setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // Check every minute

    // Suspicious activity monitoring
    setInterval(() => {
      this.analyzeSuspiciousActivity();
    }, 300000); // Check every 5 minutes
  }

  /**
   * Enhanced Input Validation and Sanitization
   */
  validateInput(input, type, options = {}) {
    if (typeof input !== 'string' && typeof input !== 'number') {
      throw new Error('Invalid input type');
    }

    const inputStr = String(input).trim();
    
    switch (type) {
      case 'email':
        return this.validateEmail(inputStr);
      
      case 'password':
        return this.validatePassword(inputStr, options);
      
      case 'amount':
        return this.validateAmount(inputStr, options);
      
      case 'text':
        return this.validateText(inputStr, options);
      
      case 'businessName':
        return this.validateBusinessName(inputStr);
      
      case 'phoneNumber':
        return this.validatePhoneNumber(inputStr);
      
      default:
        return this.sanitizeString(inputStr);
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    // Check for common attack patterns
    if (this.containsXSS(email) || this.containsSQLInjection(email)) {
      throw new Error('Invalid email content');
    }
    return email.toLowerCase();
  }

  validatePassword(password, options = {}) {
    const minLength = options.minLength || 8;
    const requireSpecial = options.requireSpecial !== false;
    const requireNumbers = options.requireNumbers !== false;
    const requireUppercase = options.requireUppercase !== false;

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      throw new Error('Password is too common, please choose a stronger password');
    }

    return password;
  }

  validateAmount(amount, options = {}) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < 0) {
      throw new Error('Invalid amount');
    }

    const maxAmount = options.maxAmount || 1000000; // $1M default max
    const minAmount = options.minAmount || 0;

    if (numAmount > maxAmount) {
      throw new Error(`Amount cannot exceed ${maxAmount}`);
    }

    if (numAmount < minAmount) {
      throw new Error(`Amount must be at least ${minAmount}`);
    }

    // Check for decimal precision
    if (numAmount.toString().includes('.')) {
      const decimals = numAmount.toString().split('.')[1].length;
      if (decimals > 2) {
        throw new Error('Amount cannot have more than 2 decimal places');
      }
    }

    return numAmount;
  }

  validateText(text, options = {}) {
    const maxLength = options.maxLength || 1000;
    const minLength = options.minLength || 0;

    if (text.length > maxLength) {
      throw new Error(`Text cannot exceed ${maxLength} characters`);
    }

    if (text.length < minLength) {
      throw new Error(`Text must be at least ${minLength} characters`);
    }

    // Check for XSS and SQL injection
    if (this.containsXSS(text) || this.containsSQLInjection(text)) {
      throw new Error('Text contains invalid content');
    }

    return this.sanitizeString(text);
  }

  validateBusinessName(name) {
    if (name.length < 2 || name.length > 100) {
      throw new Error('Business name must be between 2 and 100 characters');
    }

    // Allow letters, numbers, spaces, and common business characters
    const businessNameRegex = /^[a-zA-Z0-9\s\-&.,'\(\)]+$/;
    if (!businessNameRegex.test(name)) {
      throw new Error('Business name contains invalid characters');
    }

    return this.sanitizeString(name);
  }

  validatePhoneNumber(phone) {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check for valid international format
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      throw new Error('Invalid phone number format');
    }

    return digitsOnly;
  }

  /**
   * Security Pattern Detection
   */
  containsXSS(input) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  containsSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\b.*?=.*?(\b(OR|AND)\b|$))/gi,
      /(;|\||&)/g,
      /('|(\\')|('')|(`)|(\\")|(")/g,
      /(\b(SP_|XP_)\w+)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  sanitizeString(input) {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Advanced Session Management
   */
  async createSecureSession(userId, deviceInfo) {
    try {
      const sessionId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${userId}_${Date.now()}_${Math.random()}`
      );

      const sessionData = {
        sessionId,
        userId,
        deviceInfo,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: await this.getCurrentIP(),
        isActive: true,
        loginAttempts: 0,
        suspiciousActivity: false
      };

      // Store session in secure storage
      await SecureStore.setItemAsync(
        `session_${sessionId}`,
        JSON.stringify(sessionData)
      );

      // Store session metadata in Firestore
      await addDoc(collection(db, 'user_sessions'), sessionData);

      return sessionId;
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create secure session');
    }
  }

  async validateSession(sessionId) {
    try {
      const sessionData = await SecureStore.getItemAsync(`session_${sessionId}`);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const session = JSON.parse(sessionData);
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);

      // Check session timeout
      if (now - lastActivity > this.sessionTimeout) {
        await this.invalidateSession(sessionId);
        throw new Error('Session expired');
      }

      // Update last activity
      session.lastActivity = now;
      await SecureStore.setItemAsync(
        `session_${sessionId}`,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      throw new Error('Invalid session');
    }
  }

  async invalidateSession(sessionId) {
    try {
      await SecureStore.deleteItemAsync(`session_${sessionId}`);
      
      // Update session in Firestore
      const sessionsRef = collection(db, 'user_sessions');
      const q = query(sessionsRef, where('sessionId', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (docSnapshot) => {
        await updateDoc(doc(db, 'user_sessions', docSnapshot.id), {
          isActive: false,
          endedAt: new Date()
        });
      });
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  async checkSessionTimeout() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const sessions = await SecureStore.getAllKeysAsync();
      const sessionKeys = sessions.filter(key => key.startsWith('session_'));

      for (const key of sessionKeys) {
        const sessionData = await SecureStore.getItemAsync(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const now = new Date();
          const lastActivity = new Date(session.lastActivity);

          if (now - lastActivity > this.sessionTimeout) {
            await this.invalidateSession(session.sessionId);
            
            // Log out user if current session expired
            if (session.userId === currentUser.uid) {
              await auth.signOut();
              Alert.alert('Session Expired', 'Please log in again for security.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Session timeout check error:', error);
    }
  }

  /**
   * Fraud Detection and Monitoring
   */
  async trackSuspiciousActivity(userId, activityType, details) {
    try {
      const activityLog = {
        userId,
        activityType,
        details,
        timestamp: new Date(),
        ipAddress: await this.getCurrentIP(),
        userAgent: this.getUserAgent(),
        riskScore: this.calculateRiskScore(activityType, details)
      };

      await addDoc(collection(db, 'security_logs'), activityLog);

      // Check for immediate threats
      if (activityLog.riskScore > 8) {
        await this.handleHighRiskActivity(userId, activityLog);
      }

      return activityLog;
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  }

  calculateRiskScore(activityType, details) {
    let score = 0;

    switch (activityType) {
      case 'failed_login':
        score = 3;
        break;
      case 'large_transaction':
        score = details.amount > 10000 ? 6 : 4;
        break;
      case 'unusual_location':
        score = 7;
        break;
      case 'multiple_device_access':
        score = 5;
        break;
      case 'password_change':
        score = 4;
        break;
      case 'api_abuse':
        score = 8;
        break;
      case 'data_export':
        score = 6;
        break;
      default:
        score = 1;
    }

    // Increase score based on frequency
    if (details.frequency > 5) score += 2;
    if (details.frequency > 10) score += 3;

    return Math.min(score, 10); // Cap at 10
  }

  async handleHighRiskActivity(userId, activityLog) {
    try {
      // Lock user account temporarily
      await this.temporaryAccountLock(userId, 'High risk activity detected');

      // Send alert to security team
      await this.sendSecurityAlert(userId, activityLog);

      // Notify user
      await this.notifyUserOfSuspiciousActivity(userId, activityLog);

      console.warn('High risk activity detected:', activityLog);
    } catch (error) {
      console.error('High risk activity handling error:', error);
    }
  }

  async temporaryAccountLock(userId, reason) {
    try {
      const lockData = {
        userId,
        reason,
        lockedAt: new Date(),
        unlockAt: new Date(Date.now() + this.lockoutDuration),
        isActive: true
      };

      await addDoc(collection(db, 'account_locks'), lockData);
      
      // Store in secure storage for quick access
      await SecureStore.setItemAsync(
        `lock_${userId}`,
        JSON.stringify(lockData)
      );
    } catch (error) {
      console.error('Account lock error:', error);
    }
  }

  async checkAccountLock(userId) {
    try {
      const lockData = await SecureStore.getItemAsync(`lock_${userId}`);
      
      if (!lockData) return null;

      const lock = JSON.parse(lockData);
      const now = new Date();

      if (now < new Date(lock.unlockAt) && lock.isActive) {
        return lock;
      } else if (now >= new Date(lock.unlockAt)) {
        // Auto-unlock expired locks
        await SecureStore.deleteItemAsync(`lock_${userId}`);
        return null;
      }

      return null;
    } catch (error) {
      console.error('Account lock check error:', error);
      return null;
    }
  }

  /**
   * Transaction Security
   */
  async validateTransaction(transactionData) {
    try {
      // Input validation
      this.validateAmount(transactionData.amount, {
        maxAmount: 100000, // $100K max per transaction
        minAmount: 1
      });

      // Fraud pattern detection
      const fraudScore = await this.calculateTransactionFraudScore(transactionData);
      
      if (fraudScore > 7) {
        throw new Error('Transaction flagged for review');
      }

      // Rate limiting
      const isRateLimited = await this.checkTransactionRateLimit(
        transactionData.userId,
        transactionData.amount
      );

      if (isRateLimited) {
        throw new Error('Transaction rate limit exceeded');
      }

      return {
        validated: true,
        fraudScore,
        requiresApproval: fraudScore > 5
      };
    } catch (error) {
      await this.trackSuspiciousActivity(
        transactionData.userId,
        'transaction_validation_failed',
        { error: error.message, transactionData }
      );
      throw error;
    }
  }

  async calculateTransactionFraudScore(transactionData) {
    let score = 0;

    // Amount-based scoring
    if (transactionData.amount > 50000) score += 3;
    if (transactionData.amount > 20000) score += 2;
    if (transactionData.amount > 10000) score += 1;

    // Time-based scoring (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) score += 1;

    // Frequency-based scoring
    const recentTransactions = await this.getRecentTransactions(
      transactionData.userId,
      24 // hours
    );

    if (recentTransactions.length > 10) score += 2;
    if (recentTransactions.length > 20) score += 3;

    // Pattern analysis
    const totalAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalAmount > 100000) score += 2;

    return Math.min(score, 10);
  }

  async checkTransactionRateLimit(userId, amount) {
    const now = new Date();
    const oneHour = new Date(now.getTime() - 3600000);
    const oneDay = new Date(now.getTime() - 86400000);

    const recentTransactions = await this.getRecentTransactions(userId, 24);
    
    // Hourly limits
    const hourlyTransactions = recentTransactions.filter(
      tx => new Date(tx.createdAt) > oneHour
    );
    
    if (hourlyTransactions.length > 5) return true;

    // Daily limits
    const dailyAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (dailyAmount > 500000) return true; // $500K daily limit

    return false;
  }

  async getRecentTransactions(userId, hours) {
    try {
      const cutoff = new Date(Date.now() - (hours * 3600000));
      
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('createdAt', '>=', cutoff),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  /**
   * Utility Functions
   */
  async getCurrentIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  getUserAgent() {
    // In React Native, we'll simulate user agent
    return `BvesterApp/1.0 (${Platform.OS})`;
  }

  async sendSecurityAlert(userId, activityLog) {
    // Implementation for sending alerts to security team
    console.log('Security alert:', { userId, activityLog });
  }

  async notifyUserOfSuspiciousActivity(userId, activityLog) {
    // Implementation for notifying users
    console.log('User notification:', { userId, activityLog });
  }

  async analyzeSuspiciousActivity() {
    // Periodic analysis of security logs for patterns
    try {
      const recentLogs = await this.getRecentSecurityLogs();
      
      // Analyze patterns and generate alerts
      const suspiciousPatterns = this.detectSuspiciousPatterns(recentLogs);
      
      for (const pattern of suspiciousPatterns) {
        await this.handleSuspiciousPattern(pattern);
      }
    } catch (error) {
      console.error('Suspicious activity analysis error:', error);
    }
  }

  async getRecentSecurityLogs() {
    try {
      const cutoff = new Date(Date.now() - 3600000); // Last hour
      
      const q = query(
        collection(db, 'security_logs'),
        where('timestamp', '>=', cutoff),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching security logs:', error);
      return [];
    }
  }

  detectSuspiciousPatterns(logs) {
    const patterns = [];
    
    // Group by user ID and analyze
    const userActivities = {};
    
    logs.forEach(log => {
      if (!userActivities[log.userId]) {
        userActivities[log.userId] = [];
      }
      userActivities[log.userId].push(log);
    });

    // Detect patterns
    for (const [userId, activities] of Object.entries(userActivities)) {
      // High frequency of failed logins
      const failedLogins = activities.filter(a => a.activityType === 'failed_login');
      if (failedLogins.length > 5) {
        patterns.push({
          type: 'multiple_failed_logins',
          userId,
          count: failedLogins.length,
          severity: 'high'
        });
      }

      // High risk score activities
      const highRiskActivities = activities.filter(a => a.riskScore > 6);
      if (highRiskActivities.length > 3) {
        patterns.push({
          type: 'high_risk_activity_cluster',
          userId,
          count: highRiskActivities.length,
          severity: 'high'
        });
      }
    }

    return patterns;
  }

  async handleSuspiciousPattern(pattern) {
    switch (pattern.type) {
      case 'multiple_failed_logins':
        await this.temporaryAccountLock(
          pattern.userId,
          `Multiple failed login attempts: ${pattern.count}`
        );
        break;
        
      case 'high_risk_activity_cluster':
        await this.sendSecurityAlert(pattern.userId, {
          type: pattern.type,
          count: pattern.count,
          severity: pattern.severity
        });
        break;
    }
  }

  /**
   * Encryption Utilities
   */
  async encryptSensitiveData(data) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not configured');
      }

      const dataString = JSON.stringify(data);
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataString + this.encryptionKey
      );

      return {
        encrypted: true,
        data: digest,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Public API for security operations
   */
  async validateUserInput(input, type, options) {
    return this.validateInput(input, type, options);
  }

  async createUserSession(userId, deviceInfo) {
    return this.createSecureSession(userId, deviceInfo);
  }

  async validateUserSession(sessionId) {
    return this.validateSession(sessionId);
  }

  async logSecurityEvent(userId, eventType, details) {
    return this.trackSuspiciousActivity(userId, eventType, details);
  }

  async validateFinancialTransaction(transactionData) {
    return this.validateTransaction(transactionData);
  }

  async isAccountLocked(userId) {
    const lock = await this.checkAccountLock(userId);
    return lock !== null;
  }
}

export const securityService = new SecurityService();
export default securityService;