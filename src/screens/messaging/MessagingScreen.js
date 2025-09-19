import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { messagingService } from '../../services/messagingService';

const MessagingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  const scrollViewRef = useRef();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  
  const { recipientId, recipientName, conversationId, businessId } = route.params || {};

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
    } else if (recipientId) {
      createOrFindConversation();
    }
  }, [conversationId, recipientId]);

  const createOrFindConversation = async () => {
    try {
      setLoading(true);
      const existingConversation = await messagingService.findConversation(
        currentUser.uid,
        recipientId,
        businessId
      );

      if (existingConversation) {
        setConversation(existingConversation);
        loadMessages(existingConversation.id);
      } else {
        const newConversation = await messagingService.createConversation({
          participants: [currentUser.uid, recipientId],
          participantNames: {
            [currentUser.uid]: currentUser.displayName || currentUser.email,
            [recipientId]: recipientName
          },
          businessId: businessId,
          createdAt: new Date(),
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: { [currentUser.uid]: 0, [recipientId]: 0 }
        });
        setConversation(newConversation);
      }
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const conversationData = await messagingService.getConversation(conversationId);
      setConversation(conversationData);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async (convId = conversationId) => {
    try {
      setLoading(true);
      const messagesData = await messagingService.getMessages(convId);
      setMessages(messagesData);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(convId, currentUser.uid);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      
      const messageData = {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        recipientId: recipientId,
        text: messageText,
        timestamp: new Date(),
        read: false,
        businessId: businessId
      };

      await messagingService.sendMessage(messageData);
      
      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, {
        ...messageData,
        id: 'temp-' + Date.now(),
        isSending: true
      }]);

      // Reload messages to get the actual message from server
      await loadMessages(conversation.id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message, index) => {
    const isMyMessage = message.senderId === currentUser.uid;
    const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && showAvatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {message.senderName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          !isMyMessage && !showAvatar && styles.messageWithoutAvatar
        ]}>
          {!isMyMessage && showAvatar && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isMyMessage && (
              <View style={styles.messageStatus}>
                {message.isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons 
                    name={message.read ? "checkmark-done" : "checkmark"} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{recipientName || 'Conversation'}</Text>
          <Text style={styles.headerSubtitle}>
            {conversation?.businessId ? 'About business investment' : 'Direct message'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyDescription}>
                Send a message to begin discussing investment opportunities
              </Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((message, index) => renderMessage(message, index))}
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesList: {
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myMessageBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#6B7280',
  },
  messageStatus: {
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default MessagingScreen;