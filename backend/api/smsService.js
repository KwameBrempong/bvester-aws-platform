/**
 * BVESTER PLATFORM - SMS SERVICE (Twilio Integration)
 * Week 4: SMS Notifications Implementation
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class SMSService {
  constructor() {
    // Twilio configuration (credentials will be added later)
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token';
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
    
    // SMS templates for different notification types
    this.smsTemplates = {
      verification: {
        message: 'Your Bvester verification code is: {{code}}. This code will expire in 10 minutes.',
        category: 'verification'
      },
      login_alert: {
        message: 'New login to your Bvester account from {{location}}. If this wasn\'t you, please secure your account immediately.',
        category: 'security'
      },
      payment_confirmation: {
        message: 'Payment confirmed: {{currency}} {{amount}} for {{businessName}}. Transaction ID: {{transactionId}}',
        category: 'payment'
      },
      investment_alert: {
        message: 'New investment opportunity: {{businessName}} seeking {{currency}} {{amount}}. View: {{shortUrl}}',
        category: 'investment'
      },
      kyc_update: {
        message: 'KYC Status Update: Your verification is {{status}}. Check your dashboard for details.',
        category: 'verification'
      },
      funding_milestone: {
        message: 'Congratulations! {{businessName}} reached {{percentage}}% funding milestone.',
        category: 'milestone'
      },
      security_alert: {
        message: 'Security Alert: {{alertType}} detected on your account. Login to review: {{loginUrl}}',
        category: 'security'
      },
      password_reset: {
        message: 'Bvester password reset requested. Code: {{code}}. Don\'t share this code with anyone.',
        category: 'security'
      }
    };
    
    // SMS delivery tracking
    this.deliveryTracking = {
      enableTracking: true,
      webhookUrl: process.env.SMS_WEBHOOK_URL || 'https://api.bvester.com/webhooks/sms'
    };
    
    // Regional settings for African markets
    this.regionalSettings = {
      'NG': { // Nigeria
        countryCode: '+234',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms', 'voice']
      },
      'KE': { // Kenya
        countryCode: '+254',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms', 'voice']
      },
      'GH': { // Ghana
        countryCode: '+233',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms', 'voice']
      },
      'ZA': { // South Africa
        countryCode: '+27',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms', 'voice']
      },
      'UG': { // Uganda
        countryCode: '+256',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms']
      },
      'TZ': { // Tanzania
        countryCode: '+255',
        provider: 'twilio',
        maxLength: 160,
        supportedFeatures: ['sms']
      }
    };
  }
  
  // ============================================================================
  // CORE SMS FUNCTIONS
  // ============================================================================
  
  /**
   * Send SMS using template
   */
  async sendSMS(phoneNumber, templateKey, templateData, options = {}) {
    try {
      console.log(`📱 Sending ${templateKey} SMS to ${phoneNumber}`);
      
      const template = this.smsTemplates[templateKey];
      if (!template) {
        throw new Error(`SMS template ${templateKey} not found`);
      }
      
      // Generate SMS content
      const message = this.generateSMSContent(template.message, templateData);
      
      // Validate phone number and format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone.valid) {
        throw new Error('Invalid phone number format');
      }
      
      // Check SMS length limits
      const regionalSettings = this.getRegionalSettings(formattedPhone.countryCode);
      if (message.length > regionalSettings.maxLength) {
        console.warn(`SMS message truncated from ${message.length} to ${regionalSettings.maxLength} characters`);
      }
      
      // Prepare SMS data
      const smsData = {
        to: formattedPhone.e164,
        from: this.twilioPhoneNumber,
        body: message.substring(0, regionalSettings.maxLength),
        statusCallback: this.deliveryTracking.webhookUrl
      };
      
      // Send SMS via Twilio (simulated)
      const result = await this.simulateTwilioAPI(smsData);
      
      // Log SMS sending
      await this.logSMSActivity({
        phoneNumber: formattedPhone.e164,
        templateKey: templateKey,
        messageId: result.sid,
        status: result.status,
        timestamp: new Date(),
        templateData: templateData,
        messageLength: message.length
      });
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        cost: result.price
      };
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      
      // Log failed SMS
      await this.logSMSActivity({
        phoneNumber: phoneNumber,
        templateKey: templateKey,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send custom SMS without template
   */
  async sendCustomSMS(phoneNumber, message, options = {}) {
    try {
      console.log(`📱 Sending custom SMS to ${phoneNumber}`);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone.valid) {
        throw new Error('Invalid phone number format');
      }
      
      const smsData = {
        to: formattedPhone.e164,
        from: this.twilioPhoneNumber,
        body: message,
        statusCallback: this.deliveryTracking.webhookUrl
      };
      
      // Send SMS via Twilio (simulated)
      const result = await this.simulateTwilioAPI(smsData);
      
      // Log SMS sending
      await this.logSMSActivity({
        phoneNumber: formattedPhone.e164,
        type: 'custom',
        messageId: result.sid,
        status: result.status,
        timestamp: new Date(),
        messageLength: message.length
      });
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
      
    } catch (error) {
      console.error('Error sending custom SMS:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(recipients, templateKey, templateData, options = {}) {
    try {
      console.log(`📱 Sending bulk ${templateKey} SMS to ${recipients.length} recipients`);
      
      const template = this.smsTemplates[templateKey];
      if (!template) {
        throw new Error(`SMS template ${templateKey} not found`);
      }
      
      const results = [];
      const batchSize = options.batchSize || 20; // Smaller batches for SMS
      
      // Process recipients in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          const personalizedData = { ...templateData, ...recipient.data };
          const result = await this.sendSMS(recipient.phoneNumber, templateKey, personalizedData, options);
          return { phoneNumber: recipient.phoneNumber, ...result };
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }));
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      // Log bulk SMS activity
      await this.logSMSActivity({
        type: 'bulk',
        templateKey: templateKey,
        recipientCount: recipients.length,
        successCount: successful,
        failedCount: failed,
        status: 'completed',
        timestamp: new Date()
      });
      
      return {
        success: true,
        results: results,
        stats: { successful, failed, total: recipients.length }
      };
      
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // SPECIALIZED SMS FUNCTIONS
  // ============================================================================
  
  /**
   * Send verification code SMS
   */
  async sendVerificationCode(phoneNumber, code) {
    const templateData = {
      code: code
    };
    
    return await this.sendSMS(phoneNumber, 'verification', templateData);
  }
  
  /**
   * Send login alert SMS
   */
  async sendLoginAlert(phoneNumber, loginData) {
    const templateData = {
      location: loginData.location || 'Unknown location',
      timestamp: new Date().toLocaleString()
    };
    
    return await this.sendSMS(phoneNumber, 'login_alert', templateData);
  }
  
  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(phoneNumber, paymentData) {
    const templateData = {
      currency: paymentData.currency,
      amount: paymentData.amount.toLocaleString(),
      businessName: paymentData.businessName,
      transactionId: paymentData.transactionId
    };
    
    return await this.sendSMS(phoneNumber, 'payment_confirmation', templateData);
  }
  
  /**
   * Send investment opportunity SMS
   */
  async sendInvestmentAlert(phoneNumber, investmentData) {
    const templateData = {
      businessName: investmentData.businessName,
      currency: investmentData.currency,
      amount: investmentData.amount.toLocaleString(),
      shortUrl: this.shortenUrl(investmentData.opportunityUrl)
    };
    
    return await this.sendSMS(phoneNumber, 'investment_alert', templateData);
  }
  
  /**
   * Send KYC status update SMS
   */
  async sendKYCUpdate(phoneNumber, status) {
    const templateData = {
      status: status
    };
    
    return await this.sendSMS(phoneNumber, 'kyc_update', templateData);
  }
  
  /**
   * Send security alert SMS
   */
  async sendSecurityAlert(phoneNumber, alertData) {
    const templateData = {
      alertType: alertData.type,
      loginUrl: this.shortenUrl(alertData.loginUrl || process.env.FRONTEND_URL + '/login')
    };
    
    return await this.sendSMS(phoneNumber, 'security_alert', templateData);
  }
  
  // ============================================================================
  // SMS UTILITIES
  // ============================================================================
  
  /**
   * Generate SMS content from template
   */
  generateSMSContent(template, data) {
    let message = template;
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), data[key]);
    });
    
    return message;
  }
  
  /**
   * Format and validate phone number
   */
  formatPhoneNumber(phoneNumber) {
    try {
      // Remove all non-digit characters except +
      let cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // If no country code, try to detect from regional settings
      if (!cleaned.startsWith('+')) {
        // For now, assume it's a Nigerian number if no country code
        cleaned = '+234' + cleaned;
      }
      
      // Basic validation
      if (cleaned.length < 10 || cleaned.length > 15) {
        return { valid: false, error: 'Invalid phone number length' };
      }
      
      // Extract country code
      const countryCode = this.extractCountryCode(cleaned);
      
      return {
        valid: true,
        e164: cleaned,
        countryCode: countryCode,
        national: cleaned.replace(countryCode, ''),
        formatted: this.formatForDisplay(cleaned)
      };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Extract country code from phone number
   */
  extractCountryCode(phoneNumber) {
    for (const [country, settings] of Object.entries(this.regionalSettings)) {
      if (phoneNumber.startsWith(settings.countryCode)) {
        return settings.countryCode;
      }
    }
    return '+1'; // Default to US if not found
  }
  
  /**
   * Get regional settings for country code
   */
  getRegionalSettings(countryCode) {
    for (const [country, settings] of Object.entries(this.regionalSettings)) {
      if (settings.countryCode === countryCode) {
        return settings;
      }
    }
    return this.regionalSettings.NG; // Default to Nigeria settings
  }
  
  /**
   * Format phone number for display
   */
  formatForDisplay(phoneNumber) {
    // Simple formatting for display
    const cleaned = phoneNumber.replace('+', '');
    if (cleaned.length >= 10) {
      return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
    }
    return phoneNumber;
  }
  
  /**
   * Shorten URL for SMS
   */
  shortenUrl(url) {
    // In production, integrate with URL shortening service
    if (url && url.length > 50) {
      return 'short.ly/bvester';
    }
    return url;
  }
  
  /**
   * Simulate Twilio API call (placeholder for real implementation)
   */
  async simulateTwilioAPI(smsData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // Simulate successful response
    return {
      sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      price: '0.0075', // USD cents per SMS
      priceUnit: 'USD',
      direction: 'outbound-api',
      to: smsData.to,
      from: smsData.from,
      body: smsData.body,
      dateCreated: new Date(),
      accountSid: this.twilioAccountSid
    };
  }
  
  /**
   * Log SMS activity
   */
  async logSMSActivity(activityData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('smsLogs')
        .add({
          ...activityData,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error logging SMS activity:', error);
    }
  }
  
  /**
   * Get SMS analytics
   */
  async getSMSAnalytics(timeRange = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }
      
      const logsQuery = FirebaseAdmin.adminFirestore
        .collection('smsLogs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await logsQuery.get();
      
      const analytics = {
        totalSMS: 0,
        sentSMS: 0,
        failedSMS: 0,
        deliveryRate: 0,
        templates: {},
        countries: {},
        totalCost: 0
      };
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalSMS++;
        
        if (log.status === 'sent' || log.status === 'delivered' || log.status === 'queued') {
          analytics.sentSMS++;
        } else if (log.status === 'failed') {
          analytics.failedSMS++;
        }
        
        // Track by template
        if (log.templateKey) {
          analytics.templates[log.templateKey] = 
            (analytics.templates[log.templateKey] || 0) + 1;
        }
        
        // Estimate cost (0.0075 USD per SMS)
        if (log.status !== 'failed') {
          analytics.totalCost += 0.0075;
        }
      });
      
      analytics.deliveryRate = analytics.totalSMS > 0 ? 
        (analytics.sentSMS / analytics.totalSMS) * 100 : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting SMS analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user SMS preferences
   */
  async updateSMSPreferences(userId, preferences) {
    try {
      await FirebaseService.updateUserProfile(userId, {
        'preferences.sms': preferences,
        'metadata.updatedAt': new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating SMS preferences:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if user has opted in for SMS type
   */
  async checkSMSOptIn(userId, smsType) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { optedIn: false };
      }
      
      const preferences = userResult.user.preferences?.sms || {};
      
      // Default opt-in for essential SMS
      const essentialSMS = ['verification', 'security_alert', 'password_reset'];
      
      if (essentialSMS.includes(smsType)) {
        return { optedIn: true };
      }
      
      return { optedIn: preferences[smsType] !== false };
      
    } catch (error) {
      console.error('Error checking SMS opt-in:', error);
      return { optedIn: false };
    }
  }
}

module.exports = new SMSService();