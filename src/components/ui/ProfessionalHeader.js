/**
 * Professional Header Component
 * Premium header with glassmorphism, proper typography, and micro-interactions
 */

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Animated,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem, getColor } from '../../styles/designSystem';
import { responsive } from '../../utils/responsive';

export const ProfessionalHeader = ({
  title,
  subtitle,
  userInfo,
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
  variant = 'premium',
  showBackButton = false,
  onBackPress,
  style,
  children
}) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleNotificationPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotificationPress?.();
  };

  const handleProfilePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onProfilePress?.();
  };

  const handleBackPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress?.();
  };

  const renderContent = () => (
    <View style={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header Content */}
      <View style={styles.headerRow}>
        {/* Back Button */}
        {showBackButton && (
          <Pressable 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        )}

        {/* Title & User Info Section */}
        <Animated.View 
          style={[
            styles.titleSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {userInfo ? (
            <View style={styles.userInfoSection}>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.userName}>{userInfo.name}</Text>
              {userInfo.businessName && (
                <Text style={styles.businessName}>{userInfo.businessName}</Text>
              )}
              {userInfo.subtitle && (
                <Text style={styles.userSubtitle}>{userInfo.subtitle}</Text>
              )}
            </View>
          ) : (
            <View style={styles.titleOnly}>
              <Text style={styles.mainTitle}>{title}</Text>
              {subtitle && (
                <Text style={styles.mainSubtitle}>{subtitle}</Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          {/* Notification Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed
            ]}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Profile Button */}
          {userInfo && (
            <Pressable 
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={handleProfilePress}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userInfo.name?.charAt(0) || 'U'}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Custom Content */}
      {children && (
        <Animated.View 
          style={[
            styles.customContent,
            { opacity: fadeAnim }
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );

  if (variant === 'glassmorphism') {
    return (
      <View style={[styles.container, style]}>
        <BlurView intensity={20} style={styles.glassHeader}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.6)']}
            style={styles.glassGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderContent()}
          </LinearGradient>
        </BlurView>
      </View>
    );
  }

  // Premium gradient header (default)
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={getColor('gradients.primary')}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {renderContent()}
        
        {/* Premium shadow overlay */}
        <View style={styles.shadowOverlay} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10
  },
  
  gradientHeader: {
    paddingTop: StatusBar.currentHeight + responsive.spacing('lg'),
    paddingBottom: responsive.spacing('xl'),
    paddingHorizontal: responsive.spacing('lg')
  },
  
  glassHeader: {
    paddingTop: StatusBar.currentHeight + responsive.spacing('lg'),
    paddingBottom: responsive.spacing('xl'),
    overflow: 'hidden'
  },
  
  glassGradient: {
    flex: 1,
    paddingHorizontal: responsive.spacing('lg')
  },
  
  content: {
    flex: 1
  },
  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsive.spacing('md')
  },
  
  titleSection: {
    flex: 1,
    paddingRight: responsive.spacing('md')
  },
  
  userInfoSection: {
    alignItems: 'flex-start'
  },
  
  titleOnly: {
    alignItems: 'flex-start'
  },
  
  greeting: {
    fontSize: responsive.fontSize('base'),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: responsive.spacing('xs'),
    letterSpacing: 0.5
  },
  
  userName: {
    fontSize: responsive.fontSize('2xl'),
    fontWeight: '700',
    color: 'white',
    marginBottom: responsive.spacing('xs'),
    letterSpacing: -0.5
  },
  
  businessName: {
    fontSize: responsive.fontSize('base'),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.3
  },
  
  userSubtitle: {
    fontSize: responsive.fontSize('sm'),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: responsive.spacing('xs')
  },
  
  mainTitle: {
    fontSize: responsive.fontSize('3xl'),
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.8,
    marginBottom: responsive.spacing('xs')
  },
  
  mainSubtitle: {
    fontSize: responsive.fontSize('base'),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    letterSpacing: 0.3
  },
  
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: responsive.spacing('sm'),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  
  actionButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  
  profileButton: {
    marginLeft: responsive.spacing('sm'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  
  avatarText: {
    fontSize: responsive.fontSize('lg'),
    fontWeight: '700',
    color: getColor('primary.600'),
    letterSpacing: 0.5
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: getColor('error.500'),
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  
  customContent: {
    marginTop: responsive.spacing('lg')
  },
  
  shadowOverlay: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  }
});

export default ProfessionalHeader;