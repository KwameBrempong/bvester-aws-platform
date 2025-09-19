/**
 * BVESTER PLATFORM - REAL-TIME MESSAGING SERVICE
 * Secure communication between investors and businesses
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const NotificationService = require('./notificationService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const crypto = require('crypto');

class MessagingService {
  constructor() {
    // Message types and priorities
    this.messageTypes = {
      'initial_inquiry': {
        priority: 'high',
        autoResponse: true,
        requiresApproval: false,
        description: 'First contact between investor and business'
      },
      'investment_discussion': {
        priority: 'high',
        autoResponse: false,
        requiresApproval: false,
        description: 'Ongoing investment negotiations'
      },
      'due_diligence': {
        priority: 'high',
        autoResponse: false,
        requiresApproval: true,
        description: 'Due diligence related communications'
      },
      'document_sharing': {
        priority: 'medium',
        autoResponse: false,
        requiresApproval: true,
        description: 'Sharing of confidential documents'
      },
      'general_inquiry': {
        priority: 'medium',
        autoResponse: true,
        requiresApproval: false,
        description: 'General questions and information requests'
      },
      'system_notification': {
        priority: 'low',
        autoResponse: false,
        requiresApproval: false,
        description: 'Automated system notifications'
      }
    };
    
    // Message status definitions
    this.messageStatuses = {
      'sent': 'Message sent successfully',
      'delivered': 'Message delivered to recipient',
      'read': 'Message read by recipient',
      'replied': 'Recipient has replied to message',
      'archived': 'Message archived by user',
      'deleted': 'Message deleted by user',
      'blocked': 'Message blocked by content filter'
    };
    
    // Content filtering keywords (basic implementation)
    this.blockedKeywords = [
      'spam', 'scam', 'fraud', 'fake', 'illegal',
      'money laundering', 'terrorist', 'drugs'
    ];
    
    // Message limits and throttling
    this.messageLimits = {
      'basic': { daily: 50, hourly: 10, perConversation: 20 },
      'professional': { daily: 200, hourly: 30, perConversation: 50 },
      'enterprise': { daily: 500, hourly: 100, perConversation: 100 }
    };
    
    // Auto-response templates
    this.autoResponses = {
      'initial_inquiry': {
        'business': 'Thank you for your interest in our business! We will review your inquiry and respond within 24 hours.',
        'investor': 'Thank you for reaching out! We appreciate your investment interest and will get back to you soon.'
      },
      'general_inquiry': {
        'business': 'Thank you for your message. We will respond to your inquiry as soon as possible.',
        'investor': 'We have received your inquiry and will provide a response shortly.'
      }
    };
  }
  
  // ============================================================================
  // CORE MESSAGING FUNCTIONS
  // ============================================================================
  
  /**
   * Send a message between users
   */
  async sendMessage(senderId, recipientId, messageData) {
    try {
      console.log(`💬 Sending message from ${senderId} to ${recipientId}`);
      
      // Validate users and permissions
      const validationResult = await this.validateMessagePermissions(senderId, recipientId, messageData);
      if (!validationResult.allowed) {
        return { success: false, error: validationResult.reason };
      }
      
      // Content filtering
      const contentCheck = await this.filterMessageContent(messageData.content);
      if (!contentCheck.allowed) {
        return { success: false, error: 'Message content violates community guidelines' };
      }
      
      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(senderId, messageData.type || 'general_inquiry');
      if (!rateLimitCheck.allowed) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }
      
      // Get or create conversation
      const conversationResult = await this.getOrCreateConversation(senderId, recipientId, messageData);
      if (!conversationResult.success) {
        return conversationResult;
      }
      
      const conversationId = conversationResult.conversationId;
      
      // Create message object
      const message = {
        messageId: this.generateMessageId(),
        conversationId: conversationId,
        senderId: senderId,
        recipientId: recipientId,
        type: messageData.type || 'general_inquiry',
        subject: messageData.subject || '',
        content: messageData.content,
        attachments: messageData.attachments || [],
        metadata: {
          businessId: messageData.businessId || null,
          opportunityId: messageData.opportunityId || null,
          investmentId: messageData.investmentId || null,
          urgency: messageData.urgency || 'normal',
          encrypted: messageData.encrypted || false
        },
        status: 'sent',
        timestamp: new Date(),
        readAt: null,
        replyToMessageId: messageData.replyToMessageId || null,
        tags: messageData.tags || [],
        
        // Security and compliance
        contentHash: this.generateContentHash(messageData.content),
        ipAddress: messageData.ipAddress || 'unknown',
        userAgent: messageData.userAgent || 'unknown'
      };
      
      // Encrypt sensitive content if needed
      if (this.shouldEncryptMessage(message)) {
        message.content = await this.encryptContent(message.content);
        message.metadata.encrypted = true;
      }
      
      // Store message in database
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('messages')
        .add(message);
      
      // Update conversation metadata
      await this.updateConversationMetadata(conversationId, message);
      
      // Send real-time notification
      await this.sendMessageNotification(recipientId, senderId, message);
      
      // Handle auto-responses
      if (this.messageTypes[message.type]?.autoResponse) {
        await this.sendAutoResponse(recipientId, senderId, message);
      }
      
      // Log message activity
      await FirebaseService.logActivity(
        senderId,
        'message_sent',
        'communication',
        conversationId,
        { 
          recipientId, 
          messageType: message.type,
          hasAttachments: message.attachments.length > 0
        }
      );
      
      return {
        success: true,
        messageId: message.messageId,
        conversationId: conversationId,
        timestamp: message.timestamp
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get conversation history
   */
  async getConversation(conversationId, userId, options = {}) {
    try {
      // Verify user has access to conversation
      const accessCheck = await this.verifyConversationAccess(conversationId, userId);
      if (!accessCheck.allowed) {
        return { success: false, error: 'Access denied to conversation' };
      }
      
      // Get conversation metadata
      const conversationDoc = await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .doc(conversationId)
        .get();
      
      if (!conversationDoc.exists) {
        return { success: false, error: 'Conversation not found' };
      }
      
      const conversation = conversationDoc.data();
      
      // Get messages with pagination
      let messagesQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc');
      
      if (options.limit) {
        messagesQuery = messagesQuery.limit(options.limit);
      }
      
      if (options.startAfter) {
        messagesQuery = messagesQuery.startAfter(options.startAfter);
      }
      
      const messagesSnapshot = await messagesQuery.get();
      const messages = [];
      
      for (const doc of messagesSnapshot.docs) {
        const messageData = doc.data();
        
        // Decrypt content if needed and user has permission
        if (messageData.metadata?.encrypted) {
          messageData.content = await this.decryptContent(messageData.content, userId);
        }
        
        // Mark message as delivered if not already
        if (messageData.recipientId === userId && messageData.status === 'sent') {
          await this.updateMessageStatus(messageData.messageId, 'delivered');
          messageData.status = 'delivered';
        }
        
        messages.push({
          id: doc.id,
          ...messageData
        });
      }
      
      // Mark unread messages as read
      if (!options.previewOnly) {
        await this.markMessagesAsRead(conversationId, userId);
      }
      
      return {
        success: true,
        conversation: {
          id: conversationId,
          ...conversation
        },
        messages: messages.reverse(), // Oldest first for display
        pagination: {
          hasMore: messagesSnapshot.size === (options.limit || 50),
          lastMessage: messagesSnapshot.docs[messagesSnapshot.docs.length - 1]
        }
      };
      
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user's conversation list
   */
  async getUserConversations(userId, options = {}) {
    try {
      let conversationsQuery = FirebaseAdmin.adminFirestore
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc');
      
      if (options.limit) {
        conversationsQuery = conversationsQuery.limit(options.limit);
      }
      
      const snapshot = await conversationsQuery.get();
      const conversations = [];
      
      for (const doc of snapshot.docs) {
        const conversationData = doc.data();
        
        // Get unread count for user
        const unreadCount = await this.getUnreadCount(doc.id, userId);
        
        // Get other participant info
        const otherParticipant = conversationData.participants.find(id => id !== userId);
        const participantInfo = await this.getUserInfo(otherParticipant);
        
        conversations.push({
          id: doc.id,
          ...conversationData,
          unreadCount: unreadCount,
          otherParticipant: participantInfo,
          preview: await this.getConversationPreview(doc.id, userId)
        });
      }
      
      return {
        success: true,
        conversations: conversations,
        totalUnread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
      };
      
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Search messages
   */
  async searchMessages(userId, searchQuery, options = {}) {
    try {
      // Get user's conversations first
      const userConversations = await this.getUserConversations(userId, { limit: 100 });
      if (!userConversations.success) {
        return userConversations;
      }
      
      const conversationIds = userConversations.conversations.map(conv => conv.id);
      
      if (conversationIds.length === 0) {
        return { success: true, results: [] };
      }
      
      // Search in batches (Firestore limitation)
      const batchSize = 10;
      const searchResults = [];
      
      for (let i = 0; i < conversationIds.length; i += batchSize) {
        const batch = conversationIds.slice(i, i + batchSize);
        
        const messagesQuery = FirebaseAdmin.adminFirestore
          .collection('messages')
          .where('conversationId', 'in', batch);
        
        const snapshot = await messagesQuery.get();
        
        snapshot.forEach(doc => {
          const message = doc.data();
          
          // Simple text search (in production, use full-text search)
          if (this.messageMatchesSearch(message, searchQuery)) {
            searchResults.push({
              id: doc.id,
              ...message,
              relevanceScore: this.calculateRelevanceScore(message, searchQuery)
            });
          }
        });
      }
      
      // Sort by relevance and timestamp
      searchResults.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      const limit = options.limit || 50;
      return {
        success: true,
        results: searchResults.slice(0, limit),
        query: searchQuery,
        totalResults: searchResults.length
      };
      
    } catch (error) {
      console.error('Error searching messages:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================
  
  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(user1Id, user2Id, messageData) {
    try {
      // Check if conversation already exists
      const existingQuery = FirebaseAdmin.adminFirestore
        .collection('conversations')
        .where('participants', 'array-contains', user1Id);
      
      const snapshot = await existingQuery.get();
      
      for (const doc of snapshot.docs) {
        const conversation = doc.data();
        if (conversation.participants.includes(user2Id)) {
          return { success: true, conversationId: doc.id };
        }
      }
      
      // Create new conversation
      const conversation = {
        conversationId: this.generateConversationId(),
        participants: [user1Id, user2Id],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastMessage: {
          content: messageData.content.substring(0, 100) + '...',
          senderId: user1Id,
          timestamp: new Date()
        },
        messageCount: 0,
        context: {
          businessId: messageData.businessId || null,
          opportunityId: messageData.opportunityId || null,
          investmentId: messageData.investmentId || null,
          initiatedBy: user1Id,
          purpose: messageData.type || 'general_inquiry'
        },
        settings: {
          notifications: {
            [user1Id]: { email: true, push: true, sms: false },
            [user2Id]: { email: true, push: true, sms: false }
          },
          archived: {
            [user1Id]: false,
            [user2Id]: false
          },
          blocked: {
            [user1Id]: false,
            [user2Id]: false
          }
        },
        metadata: {
          createdBy: user1Id,
          conversationType: this.determineConversationType(messageData),
          priority: this.messageTypes[messageData.type || 'general_inquiry']?.priority || 'medium'
        }
      };
      
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .add(conversation);
      
      return { success: true, conversationId: docRef.id };
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update conversation metadata
   */
  async updateConversationMetadata(conversationId, message) {
    try {
      const updateData = {
        lastMessageAt: message.timestamp,
        lastMessage: {
          content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          senderId: message.senderId,
          timestamp: message.timestamp,
          type: message.type
        },
        messageCount: FirebaseService.increment(1)
      };
      
      await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .doc(conversationId)
        .update(updateData);
        
    } catch (error) {
      console.error('Error updating conversation metadata:', error);
    }
  }
  
  /**
   * Archive conversation
   */
  async archiveConversation(conversationId, userId) {
    try {
      const accessCheck = await this.verifyConversationAccess(conversationId, userId);
      if (!accessCheck.allowed) {
        return { success: false, error: 'Access denied' };
      }
      
      await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .doc(conversationId)
        .update({
          [`settings.archived.${userId}`]: true,
          [`metadata.archivedAt.${userId}`]: new Date()
        });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Block user from conversation
   */
  async blockUser(conversationId, blockerId, blockedUserId) {
    try {
      // Verify blocker has access to conversation
      const accessCheck = await this.verifyConversationAccess(conversationId, blockerId);
      if (!accessCheck.allowed) {
        return { success: false, error: 'Access denied' };
      }
      
      // Update conversation settings
      await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .doc(conversationId)
        .update({
          [`settings.blocked.${blockerId}`]: true,
          [`metadata.blockedAt.${blockerId}`]: new Date(),
          [`metadata.blockedUser.${blockerId}`]: blockedUserId
        });
      
      // Add to user's blocked list
      await FirebaseService.updateUserProfile(blockerId, {
        'privacy.blockedUsers': FirebaseService.arrayUnion(blockedUserId),
        'metadata.updatedAt': new Date()
      });
      
      // Log blocking activity
      await FirebaseService.logActivity(
        blockerId,
        'user_blocked',
        'communication',
        conversationId,
        { blockedUserId }
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // MESSAGE STATUS AND TRACKING
  // ============================================================================
  
  /**
   * Update message status
   */
  async updateMessageStatus(messageId, status) {
    try {
      const updateData = {
        status: status,
        [`${status}At`]: new Date()
      };
      
      // Find message by messageId
      const messageQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('messageId', '==', messageId);
      
      const snapshot = await messageQuery.get();
      
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update(updateData);
      }
      
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }
  
  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      const unreadQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .where('recipientId', '==', userId)
        .where('status', 'in', ['sent', 'delivered']);
      
      const snapshot = await unreadQuery.get();
      const batch = FirebaseAdmin.adminFirestore.batch();
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: 'read',
          readAt: new Date()
        });
      });
      
      if (!snapshot.empty) {
        await batch.commit();
      }
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
  
  /**
   * Get unread message count
   */
  async getUnreadCount(conversationId, userId) {
    try {
      const unreadQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .where('recipientId', '==', userId)
        .where('status', 'in', ['sent', 'delivered']);
      
      const snapshot = await unreadQuery.get();
      return snapshot.size;
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
  
  // ============================================================================
  // SECURITY AND VALIDATION
  // ============================================================================
  
  /**
   * Validate message permissions
   */
  async validateMessagePermissions(senderId, recipientId, messageData) {
    try {
      // Check if users exist and are active
      const senderResult = await FirebaseService.getUserProfile(senderId);
      const recipientResult = await FirebaseService.getUserProfile(recipientId);
      
      if (!senderResult.success || !recipientResult.success) {
        return { allowed: false, reason: 'Invalid user accounts' };
      }
      
      const sender = senderResult.user;
      const recipient = recipientResult.user;
      
      // Check if sender is blocked by recipient
      if (recipient.privacy?.blockedUsers?.includes(senderId)) {
        return { allowed: false, reason: 'You have been blocked by this user' };
      }
      
      // Check if recipient is blocked by sender
      if (sender.privacy?.blockedUsers?.includes(recipientId)) {
        return { allowed: false, reason: 'You have blocked this user' };
      }
      
      // Check user types and context
      if (messageData.businessId || messageData.opportunityId) {
        // Business-related messaging requires appropriate user types
        if (sender.userType === 'investor' && recipient.userType === 'investor') {
          return { allowed: false, reason: 'Investors cannot message each other directly about business opportunities' };
        }
      }
      
      // Check subscription-based messaging limits
      const senderPlan = sender.subscription?.plan || 'basic';
      if (this.messageLimits[senderPlan]) {
        const rateLimitCheck = await this.checkDetailedRateLimit(senderId, senderPlan);
        if (!rateLimitCheck.allowed) {
          return { allowed: false, reason: rateLimitCheck.reason };
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error validating message permissions:', error);
      return { allowed: false, reason: 'Permission validation failed' };
    }
  }
  
  /**
   * Filter message content
   */
  async filterMessageContent(content) {
    try {
      const lowerContent = content.toLowerCase();
      
      // Check for blocked keywords
      for (const keyword of this.blockedKeywords) {
        if (lowerContent.includes(keyword)) {
          return { 
            allowed: false, 
            reason: 'Content contains prohibited terms',
            flaggedKeyword: keyword
          };
        }
      }
      
      // Check for suspicious patterns
      if (this.containsSuspiciousPatterns(content)) {
        return { 
          allowed: false, 
          reason: 'Content flagged for manual review' 
        };
      }
      
      // Check content length
      if (content.length > 10000) {
        return { 
          allowed: false, 
          reason: 'Message too long (max 10,000 characters)' 
        };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error filtering content:', error);
      return { allowed: false, reason: 'Content filtering failed' };
    }
  }
  
  /**
   * Check rate limits
   */
  async checkRateLimit(userId, messageType) {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get user's subscription plan
      const userResult = await FirebaseService.getUserProfile(userId);
      const plan = userResult.success ? (userResult.user.subscription?.plan || 'basic') : 'basic';
      const limits = this.messageLimits[plan];
      
      // Check hourly limit
      const hourlyQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('senderId', '==', userId)
        .where('timestamp', '>=', hourAgo);
      
      const hourlySnapshot = await hourlyQuery.get();
      if (hourlySnapshot.size >= limits.hourly) {
        return { 
          allowed: false, 
          reason: `Hourly message limit exceeded (${limits.hourly})` 
        };
      }
      
      // Check daily limit
      const dailyQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('senderId', '==', userId)
        .where('timestamp', '>=', dayAgo);
      
      const dailySnapshot = await dailyQuery.get();
      if (dailySnapshot.size >= limits.daily) {
        return { 
          allowed: false, 
          reason: `Daily message limit exceeded (${limits.daily})` 
        };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true }; // Allow on error
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Generate unique conversation ID
   */
  generateConversationId() {
    return `conv_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Generate content hash for integrity
   */
  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Send message notification
   */
  async sendMessageNotification(recipientId, senderId, message) {
    try {
      // Get sender info
      const senderResult = await FirebaseService.getUserProfile(senderId);
      const senderName = senderResult.success ? 
        senderResult.user.profile?.displayName || 'Someone' : 'Someone';
      
      // Send notification
      await NotificationService.sendNotification(
        recipientId,
        'new_message',
        {
          title: 'New Message',
          message: `${senderName} sent you a message`,
          senderId: senderId,
          senderName: senderName,
          messagePreview: message.content.substring(0, 100),
          conversationId: message.conversationId
        }
      );
      
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }
  
  /**
   * Send auto-response
   */
  async sendAutoResponse(recipientId, senderId, originalMessage) {
    try {
      const recipientResult = await FirebaseService.getUserProfile(recipientId);
      if (!recipientResult.success) return;
      
      const recipientType = recipientResult.user.userType;
      const messageType = originalMessage.type;
      
      const autoResponse = this.autoResponses[messageType]?.[recipientType];
      if (!autoResponse) return;
      
      // Send auto-response after a short delay
      setTimeout(async () => {
        await this.sendMessage(recipientId, senderId, {
          type: 'system_notification',
          content: autoResponse,
          replyToMessageId: originalMessage.messageId,
          automated: true
        });
      }, 2000); // 2 second delay
      
    } catch (error) {
      console.error('Error sending auto-response:', error);
    }
  }
  
  /**
   * Determine conversation type
   */
  determineConversationType(messageData) {
    if (messageData.businessId || messageData.opportunityId) {
      return 'business_inquiry';
    }
    if (messageData.investmentId) {
      return 'investment_discussion';
    }
    return 'general';
  }
  
  /**
   * Check if message should be encrypted
   */
  shouldEncryptMessage(message) {
    const sensitiveTypes = ['due_diligence', 'document_sharing', 'investment_discussion'];
    return sensitiveTypes.includes(message.type) || message.attachments.length > 0;
  }
  
  /**
   * Encrypt sensitive content (placeholder implementation)
   */
  async encryptContent(content) {
    // In production, use proper encryption
    return Buffer.from(content).toString('base64');
  }
  
  /**
   * Decrypt content (placeholder implementation)
   */
  async decryptContent(encryptedContent, userId) {
    try {
      // In production, verify user has decryption permissions
      return Buffer.from(encryptedContent, 'base64').toString();
    } catch (error) {
      return '[Encrypted content - Unable to decrypt]';
    }
  }
  
  /**
   * Verify conversation access
   */
  async verifyConversationAccess(conversationId, userId) {
    try {
      const conversationDoc = await FirebaseAdmin.adminFirestore
        .collection('conversations')
        .doc(conversationId)
        .get();
      
      if (!conversationDoc.exists) {
        return { allowed: false, reason: 'Conversation not found' };
      }
      
      const conversation = conversationDoc.data();
      if (!conversation.participants.includes(userId)) {
        return { allowed: false, reason: 'User not a participant' };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error verifying conversation access:', error);
      return { allowed: false, reason: 'Access verification failed' };
    }
  }
  
  /**
   * Get user info for messaging
   */
  async getUserInfo(userId) {
    try {
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { id: userId, name: 'Unknown User', avatar: null };
      }
      
      const user = userResult.user;
      return {
        id: userId,
        name: user.profile?.displayName || 'Unknown User',
        avatar: user.profile?.avatar || null,
        userType: user.userType || 'user',
        verified: user.verification?.emailVerified || false,
        lastSeen: user.metadata?.lastActivity || null
      };
      
    } catch (error) {
      console.error('Error getting user info:', error);
      return { id: userId, name: 'Unknown User', avatar: null };
    }
  }
  
  /**
   * Get conversation preview
   */
  async getConversationPreview(conversationId, userId) {
    try {
      const lastMessageQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc')
        .limit(1);
      
      const snapshot = await lastMessageQuery.get();
      
      if (snapshot.empty) {
        return { content: 'No messages yet', timestamp: null };
      }
      
      const lastMessage = snapshot.docs[0].data();
      return {
        content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId,
        isOwn: lastMessage.senderId === userId
      };
      
    } catch (error) {
      console.error('Error getting conversation preview:', error);
      return { content: 'Preview unavailable', timestamp: null };
    }
  }
  
  /**
   * Check if message matches search query
   */
  messageMatchesSearch(message, query) {
    const searchTerms = query.toLowerCase().split(' ');
    const searchableText = `${message.subject} ${message.content}`.toLowerCase();
    
    return searchTerms.some(term => searchableText.includes(term));
  }
  
  /**
   * Calculate search relevance score
   */
  calculateRelevanceScore(message, query) {
    const searchTerms = query.toLowerCase().split(' ');
    const content = message.content.toLowerCase();
    const subject = message.subject.toLowerCase();
    
    let score = 0;
    
    searchTerms.forEach(term => {
      // Subject matches are worth more
      if (subject.includes(term)) score += 3;
      // Content matches
      if (content.includes(term)) score += 1;
      // Exact phrase matches
      if (content.includes(query.toLowerCase())) score += 5;
    });
    
    // Recent messages get bonus points
    const daysSinceMessage = (new Date() - new Date(message.timestamp)) / (1000 * 60 * 60 * 24);
    if (daysSinceMessage < 7) score += 2;
    if (daysSinceMessage < 30) score += 1;
    
    return score;
  }
  
  /**
   * Check for suspicious content patterns
   */
  containsSuspiciousPatterns(content) {
    // Check for excessive special characters
    const specialCharCount = (content.match(/[!@#$%^&*()]/g) || []).length;
    if (specialCharCount > content.length * 0.1) return true;
    
    // Check for excessive capitalization
    const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
    if (upperCaseCount > content.length * 0.3) return true;
    
    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) return true;
    
    return false;
  }
  
  /**
   * Get messaging analytics
   */
  async getMessagingAnalytics(timeRange = '30d') {
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
      
      const messagesQuery = FirebaseAdmin.adminFirestore
        .collection('messages')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await messagesQuery.get();
      
      const analytics = {
        totalMessages: 0,
        conversationsStarted: 0,
        responseRate: 0,
        averageResponseTime: 0,
        messageTypes: {},
        blockedMessages: 0,
        automatedMessages: 0
      };
      
      const responseTracker = new Map();
      
      snapshot.forEach(doc => {
        const message = doc.data();
        analytics.totalMessages++;
        
        // Track message types
        analytics.messageTypes[message.type] = (analytics.messageTypes[message.type] || 0) + 1;
        
        // Track blocked/automated messages
        if (message.status === 'blocked') analytics.blockedMessages++;
        if (message.automated) analytics.automatedMessages++;
        
        // Track response patterns
        if (message.replyToMessageId) {
          responseTracker.set(message.replyToMessageId, message.timestamp);
        }
      });
      
      // Calculate response rate and time (simplified)
      analytics.responseRate = Math.round((responseTracker.size / analytics.totalMessages) * 100);
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting messaging analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MessagingService();