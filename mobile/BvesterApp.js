// Bvester Mobile App - React Native
// Main application component with navigation and global state

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Vibration,
  Share
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Global theme configuration
const theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    dark: '#1F2937',
    light: '#F9FAFB',
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fonts: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },
};

// Main App Component
export default function BvesterApp() {
  // State management
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(SCREEN_HEIGHT);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
    setupNotifications();
    checkBiometricSupport();
    animateIntro();
  }, []);

  // Initialize app
  const initializeApp = async () => {
    try {
      // Load cached data
      const cachedUser = await AsyncStorage.getItem('@user');
      const cachedPortfolio = await AsyncStorage.getItem('@portfolio');
      const cachedSettings = await AsyncStorage.getItem('@settings');
      
      if (cachedUser) setUser(JSON.parse(cachedUser));
      if (cachedPortfolio) setPortfolio(JSON.parse(cachedPortfolio));
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        setLanguage(settings.language || 'en');
        setBiometricEnabled(settings.biometric || false);
      }

      // Authenticate if biometric enabled
      if (biometricEnabled) {
        await authenticateWithBiometrics();
      }

      // Sync with server
      await syncData();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  // Network connectivity listener
  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected && isOffline) {
        // Coming back online - sync data
        syncData();
        showNotification('Back Online', 'Your data has been synced');
      }
    });
    return () => unsubscribe();
  };

  // Setup push notifications
  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token);
      
      // Listen for notifications
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        setNotifications(prev => [notification, ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });

      return () => subscription.remove();
    }
  };

  // Check biometric support
  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (compatible) {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (enrolled) {
        const settings = await AsyncStorage.getItem('@settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setBiometricEnabled(parsed.biometric || false);
        }
      }
    }
  };

  // Biometric authentication
  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Bvester',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        Alert.alert('Authentication Failed', 'Please try again');
        return false;
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('Biometric error:', error);
      return false;
    }
  };

  // Sync data with server
  const syncData = async () => {
    if (isOffline) {
      console.log('Offline - using cached data');
      return;
    }

    try {
      setRefreshing(true);
      
      // Fetch latest data from server
      const response = await fetch('https://api.bvester.com/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          lastSync: await AsyncStorage.getItem('@lastSync'),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        if (data.portfolio) setPortfolio(data.portfolio);
        if (data.marketData) setMarketData(data.marketData);
        
        // Cache data for offline use
        await AsyncStorage.setItem('@portfolio', JSON.stringify(data.portfolio));
        await AsyncStorage.setItem('@marketData', JSON.stringify(data.marketData));
        await AsyncStorage.setItem('@lastSync', new Date().toISOString());
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Animate intro
  const animateIntro = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Show notification
  const showNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { timestamp: Date.now() },
      },
      trigger: null,
    });
  };

  // Handle share
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Join me on Bvester! Use my referral code: ${user?.referralCode || 'BVEST2024'} to get bonus rewards! 🚀`,
        url: 'https://bvester.com/invite',
        title: 'Invest Smarter with Bvester',
      });

      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showNotification('Referral Shared!', 'You earned 100 points');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share at this time');
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await syncData();
  };

  // Render dashboard
  const renderDashboard = () => (
    <Animated.View style={[styles.dashboard, {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }]
    }]}>
      {/* Portfolio Card */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.portfolioCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={20} style={styles.blurOverlay}>
          <Text style={styles.portfolioTitle}>Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>
            ${portfolio?.totalValue?.toLocaleString() || '0'}
          </Text>
          <View style={styles.portfolioStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24h Change</Text>
              <Text style={[styles.statValue, 
                portfolio?.dayChange > 0 ? styles.positive : styles.negative
              ]}>
                {portfolio?.dayChange > 0 ? '+' : ''}{portfolio?.dayChange?.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Return</Text>
              <Text style={[styles.statValue,
                portfolio?.totalReturn > 0 ? styles.positive : styles.negative
              ]}>
                {portfolio?.totalReturn > 0 ? '+' : ''}{portfolio?.totalReturn?.toFixed(2)}%
              </Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentScreen('invest');
          }}
        >
          <LinearGradient
            colors={[theme.colors.success, '#059669']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Invest</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentScreen('aiAdvisor');
          }}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionText}>AI Advisor</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentScreen('market');
          }}
        >
          <LinearGradient
            colors={[theme.colors.warning, '#D97706']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Market</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <LinearGradient
            colors={[theme.colors.secondary, '#7C3AED']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>🎁</Text>
            <Text style={styles.actionText}>Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Market Overview */}
      <View style={styles.marketOverview}>
        <Text style={styles.sectionTitle}>Market Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(marketData).map(([index, data]) => (
            <View key={index} style={styles.marketCard}>
              <Text style={styles.marketIndex}>{index}</Text>
              <Text style={styles.marketPrice}>{data?.current?.toFixed(2)}</Text>
              <Text style={[styles.marketChange,
                data?.changePercent > 0 ? styles.positive : styles.negative
              ]}>
                {data?.changePercent > 0 ? '+' : ''}{data?.changePercent?.toFixed(2)}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Recent Activity */}
      <View style={styles.activity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {notifications.slice(0, 3).map((notif, index) => (
          <View key={index} style={styles.activityItem}>
            <Text style={styles.activityText}>{notif.request.content.body}</Text>
            <Text style={styles.activityTime}>
              {new Date(notif.request.content.data.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Offline Indicator */}
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 Offline Mode - Data may be outdated</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.logo}>Bvester</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showNotification('Test', 'Notification system working!');
          }}>
            <Text style={styles.headerIcon}>🔔</Text>
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('settings');
          }}>
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {currentScreen === 'dashboard' && renderDashboard()}
          {/* Additional screens would be rendered here */}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {['dashboard', 'portfolio', 'discover', 'rewards', 'profile'].map((screen) => (
          <TouchableOpacity
            key={screen}
            style={styles.navItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentScreen(screen);
            }}
          >
            <Text style={[styles.navIcon, 
              currentScreen === screen && styles.navIconActive
            ]}>
              {screen === 'dashboard' && '🏠'}
              {screen === 'portfolio' && '💼'}
              {screen === 'discover' && '🔍'}
              {screen === 'rewards' && '🏆'}
              {screen === 'profile' && '👤'}
            </Text>
            <Text style={[styles.navLabel,
              currentScreen === screen && styles.navLabelActive
            ]}>
              {screen.charAt(0).toUpperCase() + screen.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.lg,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  dashboard: {
    padding: theme.spacing.md,
  },
  portfolioCard: {
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  blurOverlay: {
    padding: theme.spacing.lg,
  },
  portfolioTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.xs,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.md,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positive: {
    color: theme.colors.success,
  },
  negative: {
    color: theme.colors.error,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  actionGradient: {
    padding: theme.spacing.md,
    borderRadius: 15,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  marketOverview: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark,
    marginBottom: theme.spacing.md,
  },
  marketCard: {
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: 15,
    marginRight: theme.spacing.md,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  marketIndex: {
    fontSize: 12,
    color: theme.colors.dark,
    opacity: 0.6,
    marginBottom: theme.spacing.xs,
  },
  marketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.dark,
    marginBottom: theme.spacing.xs,
  },
  marketChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  activity: {
    marginBottom: theme.spacing.lg,
  },
  activityItem: {
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: 10,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.dark,
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.dark,
    opacity: 0.5,
  },
  offlineIndicator: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.sm,
    borderRadius: 10,
    marginTop: theme.spacing.md,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: theme.colors.dark,
    opacity: 0.5,
  },
  navLabelActive: {
    opacity: 1,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});