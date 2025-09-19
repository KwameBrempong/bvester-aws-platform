/**
 * Enhanced Metric Card Component
 * Specialized card for displaying financial metrics with trends and animations
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
import { designSystem, getColor } from '../../styles/designSystem';
import { responsive } from '../../utils/responsive';
import Card from './Card';

export const MetricCard = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  color = getColor('primary.500'),
  variant = 'default',
  onPress,
  loading = false,
  style,
  ...props
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate value on mount
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, []);

  const handlePress = () => {
    if (!onPress) return;
    
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    onPress();
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
        return 'remove';
      default:
        return 'trending-up';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return getColor('success.500');
      case 'down':
        return getColor('error.500');
      case 'neutral':
        return getColor('gray.500');
      default:
        return getColor('gray.500');
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      {/* Header with icon and trend */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
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

      {/* Value */}
      <Animated.View style={{ opacity: animatedValue }}>
        <Text style={[styles.value, { color }]} numberOfLines={1}>
          {loading ? '---' : value}
        </Text>
      </Animated.View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBar} />
        </View>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable onPress={handlePress} disabled={!onPress}>
          <LinearGradient
            colors={[color + '10', color + '05']}
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

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Card 
        variant="elevated"
        shadow="md"
        onPress={handlePress}
        pressable={!!onPress}
        style={styles.container}
        {...props}
      >
        {renderContent()}
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    position: 'relative'
  },
  
  gradientContainer: {
    borderRadius: designSystem.borderRadius.lg,
    padding: responsive.spacing('md')
  },
  
  content: {
    flex: 1,
    justifyContent: 'space-between'
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsive.spacing('sm')
  },
  
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: designSystem.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing('sm'),
    paddingVertical: responsive.spacing('xs'),
    borderRadius: designSystem.borderRadius.full,
    minHeight: 24
  },
  
  trendIcon: {
    marginRight: responsive.spacing('xs')
  },
  
  trendText: {
    fontSize: responsive.fontSize('xs'),
    fontWeight: designSystem.typography.weights.semibold
  },
  
  value: {
    fontSize: responsive.fontSize('2xl'),
    fontWeight: designSystem.typography.weights.bold,
    marginBottom: responsive.spacing('xs')
  },
  
  title: {
    fontSize: responsive.fontSize('sm'),
    color: getColor('gray.600'),
    fontWeight: designSystem.typography.weights.medium,
    lineHeight: responsive.fontSize('sm') * 1.4
  },
  
  loadingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: getColor('gray.200'),
    borderRadius: 1.5
  },
  
  loadingBar: {
    height: '100%',
    width: '60%',
    backgroundColor: getColor('primary.500'),
    borderRadius: 1.5
  }
});

export default MetricCard;