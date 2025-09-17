import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { chatRecordsService } from '../../services/ChatRecordsService';
import { voiceRecordingService } from '../../services/VoiceRecordingService';
import {
  Card,
  Button,
  getColor,
  getEnhancedColor,
  useTheme,
  getSpacing,
  getFontSize
} from '../../components/ui';

const ChatRecordsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { formatCurrency, currency } = useApp();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    showWelcomeMessage();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await chatRecordsService.getChatHistory(user.uid);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const showWelcomeMessage = () => {
    const welcomeMessage = {
      id: 'welcome',
      type: 'system',
      text: '👋 Welcome to Bvester Chat Records!\n\nJust type your business transactions naturally like:\n• "Sold 5 bags of rice for GHC 250"\n• "Bought fuel for GHC 50"\n• "Customer paid GHC 120 for foodstuff"\n\nI\'ll automatically track everything for you! 🚀',
      timestamp: new Date(),
      processed: true
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
      processed: false
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Process the transaction with AI
      const result = await chatRecordsService.processTransactionMessage(inputText.trim(), user.uid);

      if (result.success) {
        // Add bot response with transaction details
        const botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: generateBotResponse(result.transaction),
          timestamp: new Date(),
          transaction: result.transaction,
          processed: true
        };

        setMessages(prev => [
          ...prev.map(msg => msg.id === userMessage.id ? { ...msg, processed: true } : msg),
          botResponse
        ]);

        // Show quick summary
        if (result.transaction) {
          showQuickSummary(result.transaction);
        }
      } else {
        // Handle parsing error
        const errorResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: `🤔 I couldn't understand that transaction. Try something like:\n• "Sold rice for GHC 100"\n• "Bought supplies for GHC 50"\n• "Customer payment GHC 200"`,
          timestamp: new Date(),
          processed: true,
          isError: true
        };

        setMessages(prev => [
          ...prev.map(msg => msg.id === userMessage.id ? { ...msg, processed: true, hasError: true } : msg),
          errorResponse
        ]);
      }
    } catch (error) {
      console.error('Error processing message:', error);

      const errorResponse = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: '❌ Something went wrong. Please try again.',
        timestamp: new Date(),
        processed: true,
        isError: true
      };

      setMessages(prev => [
        ...prev.map(msg => msg.id === userMessage.id ? { ...msg, processed: true, hasError: true } : msg),
        errorResponse
      ]);
    } finally {
      setIsProcessing(false);
      scrollToBottom();
    }
  };

  const generateBotResponse = (transaction) => {
    const { type, amount, description, category } = transaction;
    const emoji = type === 'income' ? '💰' : '💸';
    const typeText = type === 'income' ? 'Income' : 'Expense';

    return `${emoji} Got it! Recorded ${typeText}:\n\n` +
           `💵 Amount: ${formatCurrency(amount, currency)}\n` +
           `📝 Description: ${description}\n` +
           `🏷️ Category: ${category.replace('_', ' ').toUpperCase()}\n\n` +
           `✅ Transaction saved successfully!`;
  };

  const showQuickSummary = (transaction) => {
    // This could trigger a small toast or update a summary widget
    console.log('Transaction recorded:', transaction);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const startVoiceRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        setIsProcessing(true);

        const audioUri = await voiceRecordingService.stopRecording();

        if (audioUri) {
          // Convert speech to text
          const speechResult = await voiceRecordingService.speechToText(audioUri);

          if (speechResult.success) {
            setInputText(speechResult.text);

            // Show confidence level
            if (speechResult.confidence < 0.7) {
              Alert.alert(
                'Voice Recognition',
                `I heard: "${speechResult.text}"\n\nConfidence: ${Math.round(speechResult.confidence * 100)}%\n\nPlease review and edit if needed.`
              );
            }
          } else {
            Alert.alert('Voice Recognition Error', 'Could not understand the audio. Please try again.');
          }
        }

        setIsProcessing(false);
      } else {
        // Start recording
        const started = await voiceRecordingService.startRecording();

        if (started) {
          setIsRecording(true);

          // Auto-stop after 30 seconds
          setTimeout(() => {
            if (isRecording) {
              startVoiceRecording(); // This will stop the recording
            }
          }, 30000);
        } else {
          Alert.alert(
            'Recording Error',
            'Could not start voice recording. Please check microphone permissions.'
          );
        }
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      setIsProcessing(false);

      Alert.alert(
        'Voice Recording Error',
        'Something went wrong with voice recording. Please try typing your transaction instead.'
      );
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View style={[
          styles.messageCard,
          isUser && styles.userMessage,
          isSystem && styles.systemMessage,
          message.isError && styles.errorMessage
        ]}>
          {!message.processed && message.type === 'user' && (
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}

          <Text style={[
            styles.messageText,
            isUser && styles.userMessageText,
            isSystem && styles.systemMessageText,
            message.isError && styles.errorMessageText
          ]}>
            {message.text}
          </Text>

          {message.transaction && (
            <View style={styles.transactionSummary}>
              <View style={styles.transactionHeader}>
                <Ionicons
                  name={message.transaction.type === 'income' ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={message.transaction.type === 'income' ? colors.success[500] : colors.error[500]}
                />
                <Text style={styles.transactionType}>
                  {message.transaction.type === 'income' ? 'Income' : 'Expense'}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>
                {formatCurrency(message.transaction.amount, currency)}
              </Text>
            </View>
          )}

          <Text style={[
            styles.messageTime,
            isUser && styles.userMessageTime
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('Sold items for GHC ')}
        >
          <Text style={styles.quickActionText}>💰 Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('Bought supplies for GHC ')}
        >
          <Text style={styles.quickActionText}>🛒 Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('Customer payment GHC ')}
        >
          <Text style={styles.quickActionText}>💳 Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setInputText('Transport cost GHC ')}
        >
          <Text style={styles.quickActionText}>🚗 Transport</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Records')}
        >
          <Text style={styles.quickActionText}>📊 View All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Records</Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('Records')}
        >
          <Ionicons name="list" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {renderQuickActions()}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your transaction... e.g. 'Sold rice for GHC 100'"
              placeholderTextColor={colors.gray[400]}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />

            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={startVoiceRecording}
              disabled={isProcessing}
            >
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={20}
                color={isRecording ? colors.error[500] : colors.gray[500]}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isProcessing) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: getEnhancedColor('gray.100'),
  },
  backButton: {
    padding: getSpacing('sm'),
  },
  headerTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
  },
  headerAction: {
    padding: getSpacing('sm'),
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: getSpacing('md'),
  },
  messagesContent: {
    paddingVertical: getSpacing('md'),
  },
  messageContainer: {
    marginBottom: getSpacing('md'),
  },
  messageCard: {
    backgroundColor: getEnhancedColor('gray.50'),
    padding: getSpacing('md'),
    borderRadius: 16,
    maxWidth: '85%',
    position: 'relative',
  },
  userMessage: {
    backgroundColor: getEnhancedColor('primary.500'),
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  systemMessage: {
    backgroundColor: getEnhancedColor('blue.50'),
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: getEnhancedColor('blue.200'),
  },
  errorMessage: {
    backgroundColor: getEnhancedColor('error.50'),
    borderWidth: 1,
    borderColor: getEnhancedColor('error.200'),
  },
  messageText: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.700'),
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  systemMessageText: {
    color: getEnhancedColor('blue.700'),
    textAlign: 'center',
  },
  errorMessageText: {
    color: getEnhancedColor('error.700'),
  },
  messageTime: {
    fontSize: getFontSize('xs'),
    color: getEnhancedColor('gray.500'),
    marginTop: getSpacing('xs'),
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  processingText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.500'),
    marginLeft: getSpacing('xs'),
    fontStyle: 'italic',
  },
  transactionSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: getSpacing('sm'),
    marginTop: getSpacing('sm'),
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  transactionType: {
    fontSize: getFontSize('sm'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: getSpacing('xs'),
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: getFontSize('lg'),
    color: 'white',
    fontWeight: '700',
  },
  quickActions: {
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: getEnhancedColor('gray.100'),
  },
  quickActionButton: {
    backgroundColor: getEnhancedColor('gray.100'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderRadius: 20,
    marginRight: getSpacing('sm'),
  },
  quickActionText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.700'),
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: getEnhancedColor('gray.100'),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: getEnhancedColor('gray.50'),
    borderRadius: 25,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    marginRight: getSpacing('sm'),
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.900'),
    maxHeight: 100,
    paddingVertical: 0,
  },
  voiceButton: {
    padding: getSpacing('sm'),
    marginLeft: getSpacing('sm'),
  },
  voiceButtonActive: {
    backgroundColor: getEnhancedColor('error.100'),
    borderRadius: 20,
  },
  sendButton: {
    backgroundColor: getEnhancedColor('primary.500'),
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: getEnhancedColor('gray.300'),
  },
});

export default ChatRecordsScreen;