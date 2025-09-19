import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

class MessagingService {
  constructor() {
    this.conversationsCollection = collection(db, 'conversations');
    this.messagesCollection = collection(db, 'messages');
  }

  // Create a new conversation
  async createConversation(conversationData) {
    try {
      const docRef = await addDoc(this.conversationsCollection, {
        ...conversationData,
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
      });
      
      return {
        id: docRef.id,
        ...conversationData
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Find existing conversation between two users
  async findConversation(userId1, userId2, businessId = null) {
    try {
      let q = query(
        this.conversationsCollection,
        where('participants', 'array-contains', userId1)
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          // If businessId is provided, match it as well
          if (businessId && data.businessId === businessId) {
            return { id: doc.id, ...data };
          } else if (!businessId && !data.businessId) {
            return { id: doc.id, ...data };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding conversation:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const docRef = doc(this.conversationsCollection, conversationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Conversation not found');
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Get all conversations for a user
  async getUserConversations(userId) {
    try {
      const q = query(
        this.conversationsCollection,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(messageData) {
    try {
      const batch = writeBatch(db);
      
      // Add the message
      const messageRef = doc(this.messagesCollection);
      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation with last message info
      const conversationRef = doc(this.conversationsCollection, messageData.conversationId);
      batch.update(conversationRef, {
        lastMessage: messageData.text,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: messageData.senderId,
        [`unreadCount.${messageData.recipientId}`]: increment(1)
      });

      await batch.commit();
      
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, limitCount = 50) {
    try {
      const q = query(
        this.messagesCollection,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      const batch = writeBatch(db);
      
      // Mark all unread messages as read
      const q = query(
        this.messagesCollection,
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      // Reset unread count for this user
      const conversationRef = doc(this.conversationsCollection, conversationId);
      batch.update(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Listen to messages in real-time
  subscribeToMessages(conversationId, callback) {
    const q = query(
      this.messagesCollection,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });
  }

  // Listen to conversations in real-time
  subscribeToConversations(userId, callback) {
    const q = query(
      this.conversationsCollection,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations = [];
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(conversations);
    });
  }

  // Delete a conversation (soft delete - mark as deleted for user)
  async deleteConversation(conversationId, userId) {
    try {
      const conversationRef = doc(this.conversationsCollection, conversationId);
      await updateDoc(conversationRef, {
        [`deletedFor.${userId}`]: true
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Search conversations
  async searchConversations(userId, searchTerm) {
    try {
      const conversations = await this.getUserConversations(userId);
      
      return conversations.filter(conversation => {
        const participantNames = Object.values(conversation.participantNames || {});
        return participantNames.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || (
          conversation.lastMessage && 
          conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId) {
    try {
      const conversations = await this.getUserConversations(userId);
      
      return conversations.reduce((total, conversation) => {
        const unreadCount = conversation.unreadCount?.[userId] || 0;
        return total + unreadCount;
      }, 0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mock data for development/testing
  async createMockConversations(userId) {
    try {
      const mockConversations = [
        {
          participants: [userId, 'mock-business-owner-1'],
          participantNames: {
            [userId]: 'You',
            'mock-business-owner-1': 'Sarah Okafor'
          },
          businessId: 'agritech-solutions',
          lastMessage: 'Thank you for your interest in investing in our agritech startup!',
          lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
          lastMessageSender: 'mock-business-owner-1',
          unreadCount: { [userId]: 1, 'mock-business-owner-1': 0 }
        },
        {
          participants: [userId, 'mock-business-owner-2'],
          participantNames: {
            [userId]: 'You',
            'mock-business-owner-2': 'David Kimani'
          },
          businessId: 'fintech-kenya',
          lastMessage: 'I would love to discuss the investment terms with you.',
          lastMessageTime: new Date(Date.now() - 7200000), // 2 hours ago
          lastMessageSender: userId,
          unreadCount: { [userId]: 0, 'mock-business-owner-2': 1 }
        }
      ];

      for (const conversation of mockConversations) {
        await this.createConversation(conversation);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating mock conversations:', error);
      throw error;
    }
  }

  // Mock messages for testing
  async createMockMessages(conversationId, userId, recipientId) {
    try {
      const mockMessages = [
        {
          conversationId,
          senderId: recipientId,
          senderName: 'Business Owner',
          recipientId: userId,
          text: 'Hello! Thank you for expressing interest in our business. I would love to discuss the investment opportunity with you.',
          timestamp: new Date(Date.now() - 3600000),
          read: false
        },
        {
          conversationId,
          senderId: userId,
          senderName: 'You',
          recipientId: recipientId,
          text: 'Hi! I\'m very interested in learning more about your business model and growth plans.',
          timestamp: new Date(Date.now() - 3000000),
          read: true
        },
        {
          conversationId,
          senderId: recipientId,
          senderName: 'Business Owner',
          recipientId: userId,
          text: 'Great! We are a technology company focusing on agricultural solutions for smallholder farmers in East Africa. Our platform has helped over 10,000 farmers increase their yields by 30%.',
          timestamp: new Date(Date.now() - 2400000),
          read: false
        }
      ];

      for (const message of mockMessages) {
        await this.sendMessage(message);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating mock messages:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();