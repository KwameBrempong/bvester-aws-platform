// Production Communication Service for Bvester
// Handles WhatsApp Business, SendGrid Email, and SMS notifications

const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const EventEmitter = require('events');

class CommunicationService extends EventEmitter {
  constructor() {
    super();
    this.initializeSendGrid();
    this.initializeWhatsApp();
    this.messageQueue = [];
    this.templates = new Map();
    this.initialize();
  }

  initialize() {
    console.log('📧 Communication Service initializing...');
    this.loadMessageTemplates();
    this.startMessageProcessor();
  }

  // Initialize SendGrid
  initializeSendGrid() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized');
  }

  // Initialize WhatsApp Business API
  initializeWhatsApp() {
    this.whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.whatsappBaseUrl = 'https://graph.facebook.com/v17.0';
    console.log('✅ WhatsApp Business API initialized');
  }

  // Load message templates
  loadMessageTemplates() {
    // Email templates
    this.templates.set('welcome', {
      subject: 'Welcome to Bvester - Your Investment Journey Begins! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366F1;">Welcome to Bvester!</h1>
          <p>Hi {{name}},</p>
          <p>Welcome to Bvester, the revolutionary investment platform powered by AI.</p>
          <p>Your account has been created successfully. Here's what you can do next:</p>
          <ul>
            <li>Complete your KYC verification</li>
            <li>Explore investment opportunities</li>
            <li>Set up your investment preferences</li>
            <li>Connect with our AI advisor</li>
          </ul>
          <a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
          <p>Best regards,<br>The Bvester Team</p>
        </div>
      `
    });

    this.templates.set('investment_confirmation', {
      subject: 'Investment Confirmed - {{businessName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Investment Confirmed! ✅</h2>
          <p>Hi {{investorName}},</p>
          <p>Your investment has been successfully processed:</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px;">
            <p><strong>Business:</strong> {{businessName}}</p>
            <p><strong>Amount:</strong> {{amount}}</p>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          </div>
          <p>The funds are held in escrow and will be released to the business upon milestone completion.</p>
          <a href="{{investmentUrl}}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Investment Details</a>
        </div>
      `
    });

    this.templates.set('kyc_reminder', {
      subject: 'Complete Your KYC Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Action Required: KYC Verification</h2>
          <p>Hi {{name}},</p>
          <p>To start investing on Bvester, please complete your KYC verification.</p>
          <p>This is a one-time process that helps us ensure the security of all transactions.</p>
          <a href="{{kycUrl}}" style="display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 6px;">Complete KYC Now</a>
          <p>The process takes only 5 minutes!</p>
        </div>
      `
    });

    // WhatsApp templates (must be pre-approved by Meta)
    this.templates.set('whatsapp_welcome', {
      template_name: 'welcome_message',
      language: 'en',
      components: []
    });

    this.templates.set('whatsapp_investment', {
      template_name: 'investment_confirmation',
      language: 'en',
      components: []
    });

    console.log(`📝 Loaded ${this.templates.size} message templates`);
  }

  // Send email via SendGrid
  async sendEmail(emailData) {
    try {
      const { to, templateId, dynamicData, attachments } = emailData;

      // Get template
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Replace variables in template
      let htmlContent = template.html;
      let subject = template.subject;

      for (const [key, value] of Object.entries(dynamicData || {})) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, value);
        subject = subject.replace(regex, value);
      }

      const msg = {
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME
        },
        subject,
        html: htmlContent,
        attachments: attachments || []
      };

      const response = await sgMail.send(msg);

      this.emit('emailSent', {
        to,
        subject,
        messageId: response[0].headers['x-message-id']
      });

      console.log(`📧 Email sent to ${to}: ${subject}`);

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('Email sending error:', error);
      this.emit('emailFailed', {
        to: emailData.to,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send WhatsApp message
  async sendWhatsApp(messageData) {
    try {
      const { to, templateName, languageCode = 'en', components = [] } = messageData;

      // Format phone number (remove + and spaces)
      const phoneNumber = to.replace(/[^\d]/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components
        }
      };

      const response = await axios.post(
        `${this.whatsappBaseUrl}/${this.whatsappPhoneId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.emit('whatsappSent', {
        to,
        messageId: response.data.messages[0].id
      });

      console.log(`📱 WhatsApp sent to ${to}`);

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      console.error('WhatsApp sending error:', error.response?.data || error.message);
      this.emit('whatsappFailed', {
        to: messageData.to,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send transactional WhatsApp message (after user interaction)
  async sendWhatsAppText(messageData) {
    try {
      const { to, text } = messageData;
      const phoneNumber = to.replace(/[^\d]/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      };

      const response = await axios.post(
        `${this.whatsappBaseUrl}/${this.whatsappPhoneId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      console.error('WhatsApp text error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, templateId, commonData = {}) {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => 
        this.sendEmail({
          to: recipient.email,
          templateId,
          dynamicData: {
            ...commonData,
            ...recipient.data
          }
        })
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📧 Bulk email complete: ${successful} sent, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  }

  // Send notification through multiple channels
  async sendMultiChannelNotification(notificationData) {
    const { userId, channels, message, data } = notificationData;
    const results = {};

    // Get user preferences
    const userPreferences = await this.getUserNotificationPreferences(userId);

    if (channels.includes('email') && userPreferences.email) {
      results.email = await this.sendEmail({
        to: userPreferences.email,
        templateId: message.templateId,
        dynamicData: data
      });
    }

    if (channels.includes('whatsapp') && userPreferences.whatsapp) {
      results.whatsapp = await this.sendWhatsApp({
        to: userPreferences.phone,
        templateName: message.whatsappTemplate,
        components: data.components
      });
    }

    if (channels.includes('push') && userPreferences.pushToken) {
      results.push = await this.sendPushNotification({
        token: userPreferences.pushToken,
        title: message.title,
        body: message.body,
        data
      });
    }

    return results;
  }

  // Send push notification (mobile app)
  async sendPushNotification(pushData) {
    // This would integrate with Expo Push Notifications or Firebase Cloud Messaging
    console.log('📲 Push notification queued:', pushData);
    return { success: true };
  }

  // Get user notification preferences
  async getUserNotificationPreferences(userId) {
    // This would fetch from database
    return {
      email: 'user@example.com',
      phone: '+1234567890',
      pushToken: 'ExponentPushToken[xxx]',
      preferences: {
        email: true,
        whatsapp: true,
        push: true
      }
    };
  }

  // Queue message for processing
  queueMessage(message) {
    this.messageQueue.push({
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    });
  }

  // Process message queue
  startMessageProcessor() {
    setInterval(async () => {
      if (this.messageQueue.length === 0) return;

      const pendingMessages = this.messageQueue.filter(m => m.status === 'pending');
      
      for (const message of pendingMessages) {
        try {
          message.status = 'processing';
          
          switch (message.type) {
            case 'email':
              await this.sendEmail(message.data);
              break;
            case 'whatsapp':
              await this.sendWhatsApp(message.data);
              break;
            case 'multi':
              await this.sendMultiChannelNotification(message.data);
              break;
          }

          message.status = 'sent';
          message.sentAt = new Date();
        } catch (error) {
          message.status = 'failed';
          message.error = error.message;
          message.retryCount = (message.retryCount || 0) + 1;

          // Retry logic
          if (message.retryCount < 3) {
            message.status = 'pending';
            message.nextRetry = new Date(Date.now() + 60000 * message.retryCount);
          }
        }
      }

      // Clean old messages
      this.messageQueue = this.messageQueue.filter(m => 
        m.status !== 'sent' || 
        (new Date() - m.sentAt) < 86400000 // Keep for 24 hours
      );
    }, 5000); // Process every 5 seconds
  }

  // Send investor update
  async sendInvestorUpdate(investorId, updateData) {
    const { subject, content, attachments } = updateData;

    return await this.sendEmail({
      to: await this.getInvestorEmail(investorId),
      templateId: 'investor_update',
      dynamicData: {
        subject,
        content,
        date: new Date().toLocaleDateString()
      },
      attachments
    });
  }

  // Send KYC verification status
  async sendKYCStatus(userId, status, details) {
    const templates = {
      approved: 'kyc_approved',
      rejected: 'kyc_rejected',
      pending: 'kyc_pending',
      additional_required: 'kyc_additional'
    };

    return await this.sendMultiChannelNotification({
      userId,
      channels: ['email', 'whatsapp', 'push'],
      message: {
        templateId: templates[status],
        whatsappTemplate: `kyc_${status}`,
        title: 'KYC Verification Update',
        body: details.message
      },
      data: details
    });
  }

  // Send payment confirmation
  async sendPaymentConfirmation(paymentData) {
    const { userId, amount, transactionId, type } = paymentData;

    return await this.sendMultiChannelNotification({
      userId,
      channels: ['email', 'whatsapp'],
      message: {
        templateId: 'payment_confirmation',
        whatsappTemplate: 'payment_success',
        title: 'Payment Confirmed',
        body: `Your ${type} of ${amount} has been processed successfully.`
      },
      data: {
        amount,
        transactionId,
        type,
        date: new Date().toISOString()
      }
    });
  }

  // Get investor email (mock implementation)
  async getInvestorEmail(investorId) {
    // This would fetch from database
    return 'investor@example.com';
  }

  // Generate and send OTP
  async sendOTP(phone, channel = 'whatsapp') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP (in production, use Redis with expiry)
    this.otpStore = this.otpStore || new Map();
    this.otpStore.set(phone, {
      otp,
      expires: Date.now() + 600000 // 10 minutes
    });

    if (channel === 'whatsapp') {
      await this.sendWhatsAppText({
        to: phone,
        text: `Your Bvester verification code is: ${otp}\n\nThis code expires in 10 minutes.`
      });
    }

    return { success: true };
  }

  // Verify OTP
  verifyOTP(phone, otp) {
    const stored = this.otpStore?.get(phone);
    
    if (!stored) {
      return { valid: false, error: 'No OTP found' };
    }

    if (Date.now() > stored.expires) {
      this.otpStore.delete(phone);
      return { valid: false, error: 'OTP expired' };
    }

    if (stored.otp !== otp) {
      return { valid: false, error: 'Invalid OTP' };
    }

    this.otpStore.delete(phone);
    return { valid: true };
  }
}

module.exports = CommunicationService;