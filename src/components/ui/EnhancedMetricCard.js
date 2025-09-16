/**
 * Premium Enhanced Metric Card Component
 * Professional financial data visualization with micro-interactions
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { designSystem, getColor } from '../../styles/designSystem';
import { responsive } from '../../utils/responsive';

export const EnhancedMetricCard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color = getColor('primary.500'),
  variant = 'premium',
  onPress,
  loading = false,
  style,
  showSparkline = false,
  sparklineData = [],
  ...props
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entry animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        delay: 200,
        useNativeDriver: false
      })
    ]).start();
  }, []);

  const handlePress = async () => {
    if (!onPress) return;
    
    // Premium haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Micro-interaction animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true
      })
    ]).start();
    
    onPress();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'neutral': return 'remove';
      default: return 'trending-up';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return getColor('success.500');
      case 'down': return getColor('error.500');
      case 'neutral': return getColor('gray.500');
      default: return getColor('gray.500');
    }
  };

  const renderSparkline = () => {
    if (!showSparkline || !sparklineData.length) return null;
    
    return (
      <View style={styles.sparklineContainer}>
        {sparklineData.slice(0, 8).map((point, index) => (
          <View 
            key={index}
            style={[
              styles.sparklineBar,
              { 
                height: Math.max(4, point * 20),
                backgroundColor: color + '40'
              }
            ]} 
          />
        ))}
      </View>
    );
  };

  const renderContent = () => (
    <Animated.View 
      style={[
        styles.content,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Header with enhanced icon and trend */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '15' }]}>
            <Ionicons 
              name={getTrendIcon()} 
              size={14} 
              color={getTrendColor()} 
              style={styles.trendIcon}
            />
            {trendValue && (
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Premium animated value display */}
      <Animated.View style={styles.valueSection}>
        <Text 
          style={[styles.value, { color }]} 
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {loading ? '---' : value}
        </Text>
        
        {/* Sparkline integration */}
        {renderSparkline()}
      </Animated.View>

      {/* Enhanced title with better typography */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Premium loading indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Animated.View 
            style={[
              styles.loadingBar,
              {
                width: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '70%']
                })
              }
            ]} 
          />
        </View>
      )}
    </Animated.View>
  );

  if (variant === 'glassmorphism') {
    return (
      <Animated.View 
        style={[
          { transform: [{ scale: scaleAnim }] }, 
          style
        ]}
      >
        <Pressable onPress={handlePress} disabled={!onPress}>
          <BlurView intensity={20} style={[styles.container, styles.glassContainer]}>
            <View style={[styles.glassOverlay, { backgroundColor: color + '10' }]} />
            {renderContent()}
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'gradient') {
    return (
      <Animated.View 
        style={[
          { transform: [{ scale: scaleAnim }] }, 
          style
        ]}
      >
        <Pressable onPress={handlePress} disabled={!onPress}>
          <LinearGradient
            colors={[color + '15', color + '05']}
            style={[styles.container, styles.gradientContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderContent()}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // Premium default variant
  return (
    <Animated.View 
      style={[
        { transform: [{ scale: scaleAnim }] }, 
        style
      ]}
    >
      <Pressable 
        onPress={handlePress} 
        disabled={!onPress}
        style={({ pressed }) => [
          styles.container,
          styles.premiumContainer,
          pressed && styles.pressed
        ]}
      >
        {renderContent()}
        
        {/* Premium shadow overlay */}
        <View style={[styles.shadowOverlay, { shadowColor: color }]} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 140,
    borderRadius: designSystem.borderRadius.xl,
    position: 'relative',
    overflow: 'hidden'
  },
  
  premiumContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: getColor('gray.100')
  },
  
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  
  gradientContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  
  content: {
    flex: 1,
    padding: responsive.spacing('lg'),
    justifyContent: 'space-between'
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsive.spacing('md')
  },
  
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: designSystem.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing('sm'),
    paddingVertical: responsive.spacing('xs'),
    borderRadius: designSystem.borderRadius.full,
    minHeight: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  
  trendIcon: {
    marginRight: responsive.spacing('xs')
  },
  
  trendText: {
    fontSize: responsive.fontSize('xs'),
    fontWeight: '700',
    letterSpacing: 0.5
  },
  
  valueSection: {
    alignItems: 'flex-start',
    marginBottom: responsive.spacing('sm')
  },
  
  value: {
    fontSize: responsive.fontSize('3xl'),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: responsive.spacing('xs')
  },
  
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    marginTop: responsive.spacing('xs')
  },
  
  sparklineBar: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 2
  },
  
  title: {
    fontSize: responsive.fontSize('sm'),
    color: getColor('gray.700'),
    fontWeight: '600',
    lineHeight: responsive.fontSize('sm') * 1.4,
    letterSpacing: 0.2
  },
  
  loadingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: getColor('gray.100'),
    borderRadius: 2
  },
  
  loadingBar: {
    height: '100%',
    backgroundColor: getColor('primary.500'),
    borderRadius: 2
  },
  
  shadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
    borderRadius: designSystem.borderRadius.xl
  },
  
  pressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2
  }
});

export default EnhancedMetricCard;