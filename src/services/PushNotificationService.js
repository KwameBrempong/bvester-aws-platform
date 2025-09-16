import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.initialized = false;
  }

  /**
   * Initialize push notification service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      this.initialized = true;
      console.log('✅ Push notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  /**
   * Register device for push notifications
   */
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });

      // Create investment-specific channels
      await this.createNotificationChannels();
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Push Notifications',
          'Failed to get push token for push notification!',
          [{ text: 'OK' }]
        );
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Push token:', token);
      
      this.expoPushToken = token;
      await AsyncStorage.setItem('pushToken', token);
      
      // Send token to backend (when API is ready)
      // await this.sendTokenToBackend(token);
      
    } else {
      console.log('📱 Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Create notification channels for different types of notifications
   */
  async createNotificationChannels() {
    const channels = [
      {
        id: 'investment-updates',
        name: 'Investment Updates',
        description: 'Notifications about your investments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#48bb78',
      },
      {
        id: 'messages',
        name: 'Messages',
        description: 'New messages from investors/businesses',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#667eea',
      },
      {
        id: 'opportunities',
        name: 'New Opportunities',
        description: 'New investment opportunities matching your criteria',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#ed8936',
      },
      {
        id: 'alerts',
        name: 'Alerts',
        description: 'Important alerts and notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#e53e3e',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }
  }

  /**
   * Set up notification event listeners
   */
  setupNotificationListeners() {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for notification responses (user interaction)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received while app is open
   */
  handleNotificationReceived(notification) {
    const { title, body, data } = notification.request.content;
    
    // Custom handling based on notification type
    switch (data?.type) {
      case 'investment_update':
        this.handleInvestmentUpdate(data);
        break;
      case 'new_message':
        this.handleNewMessage(data);
        break;
      case 'opportunity':
        this.handleNewOpportunity(data);
        break;
      default:
        console.log('📱 General notification received');
    }
  }

  /**
   * Handle notification tap/response
   */
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'investment_update':
        // Navigate to investment details
        this.navigateToInvestment(data.investmentId);
        break;
      case 'new_message':
        // Navigate to messages
        this.navigateToMessages(data.conversationId);
        break;
      case 'opportunity':
        // Navigate to opportunity details
        this.navigateToOpportunity(data.opportunityId);
        break;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification({ title, body, data = {}, channelId = 'default' }) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Send immediately
        channelId,
      });
    } catch (error) {
      console.error('❌ Failed to send local notification:', error);
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification({ title, body, data = {}, trigger, channelId = 'default' }) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
        channelId,
      });
      return id;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  // Specific notification handlers
  handleInvestmentUpdate(data) {
    console.log('💰 Investment update:', data);
    // Handle investment-specific logic
  }

  handleNewMessage(data) {
    console.log('💬 New message:', data);
    // Handle message-specific logic
  }

  handleNewOpportunity(data) {
    console.log('🚀 New opportunity:', data);
    // Handle opportunity-specific logic
  }

  // Navigation helpers (to be implemented with navigation ref)
  navigateToInvestment(investmentId) {
    console.log('🏃‍♂️ Navigate to investment:', investmentId);
    // Implementation depends on navigation setup
  }

  navigateToMessages(conversationId) {
    console.log('🏃‍♂️ Navigate to messages:', conversationId);
    // Implementation depends on navigation setup
  }

  navigateToOpportunity(opportunityId) {
    console.log('🏃‍♂️ Navigate to opportunity:', opportunityId);
    // Implementation depends on navigation setup
  }

  /**
   * Send token to backend server
   */
  async sendTokenToBackend(token) {
    try {
      // This would integrate with your backend API
      const response = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers
        },
        body: JSON.stringify({
          token,
          deviceType: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('✅ Push token sent to backend');
      } else {
        console.error('❌ Failed to send push token to backend');
      }
    } catch (error) {
      console.error('❌ Error sending push token to backend:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Convenience methods for common notifications
  async notifyInvestmentUpdate(investmentName, message) {
    await this.sendLocalNotification({
      title: `${investmentName} Update`,
      body: message,
      data: { type: 'investment_update', investmentName },
      channelId: 'investment-updates',
    });
  }

  async notifyNewMessage(senderName, message) {
    await this.sendLocalNotification({
      title: `New message from ${senderName}`,
      body: message,
      data: { type: 'new_message', senderName },
      channelId: 'messages',
    });
  }

  async notifyNewOpportunity(companyName, description) {
    await this.sendLocalNotification({
      title: `New Opportunity: ${companyName}`,
      body: description,
      data: { type: 'opportunity', companyName },
      channelId: 'opportunities',
    });
  }

  async notifyAlert(title, message) {
    await this.sendLocalNotification({
      title,
      body: message,
      data: { type: 'alert' },
      channelId: 'alerts',
    });
  }
}

// Export singleton instance
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;