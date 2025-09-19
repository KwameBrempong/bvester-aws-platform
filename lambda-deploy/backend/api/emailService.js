/**
 * BVESTER PLATFORM - EMAIL SERVICE (SendGrid Integration)
 * Week 4: Email & Notifications Implementation
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

class EmailService {
  constructor() {
    // SendGrid configuration (API key will be added later)
    this.sendGridApiKey = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@bvester.com';
    this.fromName = process.env.FROM_NAME || 'Bvester Platform';
    
    // Email templates configuration
    this.templates = {
      welcome: {
        subject: 'Welcome to Bvester - Your Investment Journey Begins!',
        category: 'onboarding'
      },
      verification: {
        subject: 'Verify Your Email Address',
        category: 'authentication'
      },
      password_reset: {
        subject: 'Reset Your Password - Bvester',
        category: 'authentication'
      },
      investment_notification: {
        subject: 'New Investment Opportunity Available',
        category: 'investment'
      },
      payment_confirmation: {
        subject: 'Payment Confirmation - Bvester',
        category: 'payment'
      },
      kyc_update: {
        subject: 'Identity Verification Update',
        category: 'verification'
      },
      subscription_update: {
        subject: 'Subscription Update - Bvester',
        category: 'billing'
      },
      business_approved: {
        subject: 'Business Profile Approved!',
        category: 'business'
      },
      investment_matched: {
        subject: 'Perfect Investment Match Found!',
        category: 'matching'
      },
      weekly_digest: {
        subject: 'Your Weekly Investment Digest',
        category: 'digest'
      }
    };
    
    // Email preferences
    this.defaultFromEmail = process.env.FROM_EMAIL || 'noreply@bvester.com';
    this.defaultFromName = 'Bvester Platform';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@bvester.com';
  }
  
  // ============================================================================
  // CORE EMAIL SENDING
  // ============================================================================
  
  /**
   * Send email with template
   */
  async sendEmail(to, templateKey, data = {}, options = {}) {
    try {
      const template = this.templates[templateKey];
      if (!template) {
        throw new Error(`Email template '${templateKey}' not found`);
      }
      
      // Generate email content
      const emailContent = await this.generateEmailContent(templateKey, data);
      
      const mailOptions = {
        from: {
          name: options.fromName || this.defaultFromName,
          address: options.fromEmail || this.defaultFromEmail
        },
        to: to,
        subject: options.subject || template.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: options.attachments || []
      };
      
      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email sending
      await this.logEmailSent(to, templateKey, result.messageId, template.category);
      
      return {
        success: true,
        messageId: result.messageId,
        template: templateKey
      };
      
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log email failure
      await this.logEmailFailed(to, templateKey, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send bulk emails
   */
  async sendBulkEmails(recipients, templateKey, data = {}, options = {}) {
    try {
      const results = [];
      const batchSize = 50; // Process in batches to avoid rate limits
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          const personalizedData = { ...data, ...recipient.data };
          const result = await this.sendEmail(recipient.email, templateKey, personalizedData, options);
          return { email: recipient.email, ...result };
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }));
        
        // Add delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Bulk email completed: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        results: results,
        stats: { successful, failed, total: recipients.length }
      };
      
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================
  
  /**
   * Generate email content from template
   */
  async generateEmailContent(templateKey, data) {
    const templates = {
      welcome: () => this.generateWelcomeEmail(data),
      verification: () => this.generateVerificationEmail(data),
      password_reset: () => this.generatePasswordResetEmail(data),
      investment_notification: () => this.generateInvestmentNotificationEmail(data),
      payment_confirmation: () => this.generatePaymentConfirmationEmail(data),
      kyc_update: () => this.generateKYCUpdateEmail(data),
      subscription_update: () => this.generateSubscriptionUpdateEmail(data),
      business_approved: () => this.generateBusinessApprovedEmail(data),
      investment_matched: () => this.generateInvestmentMatchedEmail(data),
      weekly_digest: () => this.generateWeeklyDigestEmail(data)
    };
    
    const generator = templates[templateKey];
    if (!generator) {
      throw new Error(`Email template generator for '${templateKey}' not found`);
    }
    
    return await generator();
  }
  
  /**
   * Welcome email template
   */
  async generateWelcomeEmail(data) {
    const { firstName, userType, dashboardUrl } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Bvester!</h1>
          <p>Connecting African SMEs with Global Investors</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName || 'there'}!</h2>
          
          <p>Welcome to Bvester, the premier platform for African SME investment. We're excited to have you join our community of ${userType === 'investor' ? 'investors' : 'entrepreneurs'} making a difference across Africa.</p>
          
          ${userType === 'investor' ? `
            <h3>As an Investor, you can:</h3>
            <ul>
              <li>Discover vetted African SMEs with high growth potential</li>
              <li>Make equity, loan, or revenue-sharing investments</li>
              <li>Track your portfolio performance in real-time</li>
              <li>Access ESG impact scoring and analytics</li>
              <li>Connect directly with business owners</li>
            </ul>
          ` : `
            <h3>As a Business Owner, you can:</h3>
            <ul>
              <li>Create compelling business profiles to attract investors</li>
              <li>Access AI-powered investor matching</li>
              <li>Manage your funding campaigns</li>
              <li>Track investor interest and communications</li>
              <li>Build long-term investor relationships</li>
            </ul>
          `}
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Complete your profile to unlock all features</li>
            <li>Verify your identity for enhanced access</li>
            <li>Explore the platform and start ${userType === 'investor' ? 'investing' : 'fundraising'}</li>
          </ol>
          
          <p style="text-align: center;">
            <a href="${dashboardUrl || '#'}" class="button">Go to Dashboard</a>
          </p>
          
          <p>If you have any questions, our support team is here to help at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>.</p>
          
          <p>Best regards,<br>The Bvester Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 Bvester Platform. All rights reserved.</p>
          <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Welcome to Bvester!
      
      Hello ${firstName || 'there'}!
      
      Welcome to Bvester, the premier platform for African SME investment. We're excited to have you join our community.
      
      Next Steps:
      1. Complete your profile to unlock all features
      2. Verify your identity for enhanced access
      3. Explore the platform and start ${userType === 'investor' ? 'investing' : 'fundraising'}
      
      Dashboard: ${dashboardUrl || 'Visit our website'}
      
      Questions? Contact us at ${this.supportEmail}
      
      Best regards,
      The Bvester Team
    `;
    
    return { html, text };
  }
  
  /**
   * Email verification template
   */
  async generateVerificationEmail(data) {
    const { firstName, verificationUrl, verificationCode } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .code { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName || 'there'}!</h2>
            
            <p>To complete your Bvester account setup, please verify your email address.</p>
            
            ${verificationCode ? `
              <p>Enter this verification code in the app:</p>
              <div class="code">${verificationCode}</div>
            ` : ''}
            
            ${verificationUrl ? `
              <p>Or click the button below to verify automatically:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
            ` : ''}
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create a Bvester account, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The Bvester Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Verify Your Email Address
      
      Hello ${firstName || 'there'}!
      
      To complete your Bvester account setup, please verify your email address.
      
      ${verificationCode ? `Verification Code: ${verificationCode}` : ''}
      ${verificationUrl ? `Verification Link: ${verificationUrl}` : ''}
      
      This verification link will expire in 24 hours.
      
      If you didn't create a Bvester account, you can safely ignore this email.
      
      Best regards,
      The Bvester Team
    `;
    
    return { html, text };
  }
  
  /**
   * Password reset email template
   */
  async generatePasswordResetEmail(data) {
    const { firstName, resetUrl, resetCode } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName || 'there'}!</h2>
            
            <p>We received a request to reset your Bvester account password.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
            
            ${resetUrl ? `
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
            ` : ''}
            
            <p><strong>This reset link will expire in 1 hour for security.</strong></p>
            
            <p>If you're having trouble with the button, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p>For security questions, contact us at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>.</p>
            
            <p>Best regards,<br>The Bvester Security Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Reset Your Password
      
      Hello ${firstName || 'there'}!
      
      We received a request to reset your Bvester account password.
      
      Security Notice: If you didn't request this password reset, please ignore this email.
      
      Reset Link: ${resetUrl}
      
      This reset link will expire in 1 hour for security.
      
      For questions, contact us at ${this.supportEmail}
      
      Best regards,
      The Bvester Security Team
    `;
    
    return { html, text };
  }
  
  /**
   * Investment notification email template
   */
  async generateInvestmentNotificationEmail(data) {
    const { firstName, businessName, investmentType, amount, currency, opportunityUrl } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
          .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Investment Opportunity!</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            
            <p>A new investment opportunity matching your preferences is now available:</p>
            
            <div class="highlight">
              <h3>${businessName}</h3>
              <p><strong>Investment Type:</strong> ${investmentType}</p>
              <p><strong>Amount Seeking:</strong> ${currency} ${amount?.toLocaleString()}</p>
            </div>
            
            <p>This opportunity has been personally matched to your investment criteria and risk profile.</p>
            
            <p style="text-align: center;">
              <a href="${opportunityUrl}" class="button">View Opportunity</a>
            </p>
            
            <p><em>Remember: All investments carry risk. Please review all information carefully before investing.</em></p>
            
            <p>Happy investing!<br>The Bvester Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      New Investment Opportunity!
      
      Hello ${firstName}!
      
      A new investment opportunity matching your preferences is now available:
      
      Business: ${businessName}
      Investment Type: ${investmentType}
      Amount Seeking: ${currency} ${amount?.toLocaleString()}
      
      View Opportunity: ${opportunityUrl}
      
      Remember: All investments carry risk. Please review all information carefully.
      
      Happy investing!
      The Bvester Team
    `;
    
    return { html, text };
  }
  
  /**
   * Payment confirmation email template
   */
  async generatePaymentConfirmationEmail(data) {
    const { firstName, amount, currency, transactionId, businessName, paymentType } = data;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .receipt { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmation</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            
            <p>Your payment has been successfully processed. Thank you for your ${paymentType}!</p>
            
            <div class="receipt">
              <h3>Payment Details</h3>
              <div class="amount">${currency} ${amount?.toLocaleString()}</div>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Payment Type:</strong> ${paymentType}</p>
              ${businessName ? `<p><strong>Business:</strong> ${businessName}</p>` : ''}
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
            
            <p>A receipt has been sent to your email for your records.</p>
            
            <p>Thank you for being part of the Bvester community!</p>
            
            <p>Best regards,<br>The Bvester Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Payment Confirmation
      
      Hello ${firstName}!
      
      Your payment has been successfully processed.
      
      Payment Details:
      Amount: ${currency} ${amount?.toLocaleString()}
      Transaction ID: ${transactionId}
      Payment Type: ${paymentType}
      ${businessName ? `Business: ${businessName}` : ''}
      Date: ${new Date().toLocaleDateString()}
      Status: Completed
      
      Thank you for being part of the Bvester community!
      
      Best regards,
      The Bvester Team
    `;
    
    return { html, text };
  }
  
  /**
   * KYC update email template
   */
  async generateKYCUpdateEmail(data) {
    const { firstName, status, reviewNotes, dashboardUrl } = data;
    
    const statusColors = {
      approved: '#28a745',
      rejected: '#dc3545',
      requires_additional_info: '#ffc107'
    };
    
    const statusMessages = {
      approved: 'Your identity has been successfully verified! You now have access to all platform features.',
      rejected: 'We were unable to verify your identity with the provided documents. Please review the notes below and resubmit if needed.',
      requires_additional_info: 'We need additional information to complete your identity verification. Please review the requirements below.'
    };
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: ${statusColors[status] || '#6c757d'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .status { background: ${status === 'approved' ? '#d4edda' : status === 'rejected' ? '#f8d7da' : '#fff3cd'}; 
                   border: 1px solid ${statusColors[status] || '#6c757d'}; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { background: ${statusColors[status] || '#6c757d'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Identity Verification Update</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            
            <div class="status">
              <h3>Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</h3>
              <p>${statusMessages[status]}</p>
            </div>
            
            ${reviewNotes ? `
              <h3>Review Notes:</h3>
              <p>${reviewNotes}</p>
            ` : ''}
            
            ${status === 'approved' ? `
              <p><strong>What's next?</strong> You can now access all premium features including larger investment amounts and advanced analytics.</p>
            ` : status === 'rejected' ? `
              <p><strong>What's next?</strong> You can resubmit your documents with the corrections noted above.</p>
            ` : `
              <p><strong>What's next?</strong> Please provide the additional information requested to complete your verification.</p>
            `}
            
            <p style="text-align: center;">
              <a href="${dashboardUrl || '#'}" class="button">Go to Dashboard</a>
            </p>
            
            <p>If you have questions about this update, please contact our support team at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>.</p>
            
            <p>Best regards,<br>The Bvester Verification Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Identity Verification Update
      
      Hello ${firstName}!
      
      Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      
      ${statusMessages[status]}
      
      ${reviewNotes ? `Review Notes: ${reviewNotes}` : ''}
      
      Dashboard: ${dashboardUrl || 'Visit our website'}
      
      Questions? Contact us at ${this.supportEmail}
      
      Best regards,
      The Bvester Verification Team
    `;
    
    return { html, text };
  }
  
  // Additional template generators would continue here...
  async generateSubscriptionUpdateEmail(data) {
    // Implementation for subscription updates
    return { html: '<p>Subscription update</p>', text: 'Subscription update' };
  }
  
  async generateBusinessApprovedEmail(data) {
    // Implementation for business approval
    return { html: '<p>Business approved</p>', text: 'Business approved' };
  }
  
  async generateInvestmentMatchedEmail(data) {
    // Implementation for investment matching
    return { html: '<p>Investment matched</p>', text: 'Investment matched' };
  }
  
  async generateWeeklyDigestEmail(data) {
    // Implementation for weekly digest
    return { html: '<p>Weekly digest</p>', text: 'Weekly digest' };
  }
  
  // ============================================================================
  // EMAIL LOGGING & ANALYTICS
  // ============================================================================
  
  /**
   * Log successful email sending
   */
  async logEmailSent(to, template, messageId, category) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('emailLogs')
        .add({
          to: to,
          template: template,
          category: category,
          messageId: messageId,
          status: 'sent',
          sentAt: new Date(),
          provider: 'nodemailer'
        });
    } catch (error) {
      console.error('Error logging email sent:', error);
    }
  }
  
  /**
   * Log failed email sending
   */
  async logEmailFailed(to, template, error) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('emailLogs')
        .add({
          to: to,
          template: template,
          status: 'failed',
          error: error,
          failedAt: new Date(),
          provider: 'nodemailer'
        });
    } catch (error) {
      console.error('Error logging email failure:', error);
    }
  }
  
  /**
   * Get email analytics
   */
  async getEmailAnalytics(timeRange = '30d') {
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
        .collection('emailLogs')
        .where('sentAt', '>=', startDate)
        .where('sentAt', '<=', endDate);
      
      const snapshot = await logsQuery.get();
      
      const analytics = {
        totalEmails: 0,
        sentEmails: 0,
        failedEmails: 0,
        deliveryRate: 0,
        templateBreakdown: {},
        categoryBreakdown: {}
      };
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalEmails++;
        
        if (log.status === 'sent') {
          analytics.sentEmails++;
        } else {
          analytics.failedEmails++;
        }
        
        // Template breakdown
        analytics.templateBreakdown[log.template] = 
          (analytics.templateBreakdown[log.template] || 0) + 1;
        
        // Category breakdown
        if (log.category) {
          analytics.categoryBreakdown[log.category] = 
            (analytics.categoryBreakdown[log.category] || 0) + 1;
        }
      });
      
      analytics.deliveryRate = analytics.totalEmails > 0 ? 
        (analytics.sentEmails / analytics.totalEmails) * 100 : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // EMAIL PREFERENCES & SUBSCRIPTIONS
  // ============================================================================
  
  /**
   * Update user email preferences
   */
  async updateEmailPreferences(userId, preferences) {
    try {
      await FirebaseService.updateUserProfile(userId, {
        'preferences.email': preferences,
        'metadata.updatedAt': new Date()
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error updating email preferences:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if user has opted in for email type
   */
  async checkEmailOptIn(userId, emailType) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { optedIn: false };
      }
      
      const preferences = userResult.user.preferences?.email || {};
      
      // Default opt-in for essential emails
      const essentialEmails = ['verification', 'password_reset', 'payment_confirmation'];
      
      if (essentialEmails.includes(emailType)) {
        return { optedIn: true };
      }
      
      return { optedIn: preferences[emailType] !== false };
      
    } catch (error) {
      console.error('Error checking email opt-in:', error);
      return { optedIn: false };
    }
  }
}

module.exports = new EmailService();