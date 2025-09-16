/**
 * Enhanced Card Component
 * Modern, responsive card with multiple variants and shadow support
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designSystem, getShadow, getColor } from '../../styles/designSystem';
import { responsive } from '../../utils/responsive';

export const Card = ({ 
  children, 
  variant = 'default',
  shadow = 'md',
  gradient = null,
  onPress,
  style,
  pressable = false,
  ...props 
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    getShadow(shadow),
    style
  ];

  const content = (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );

  // Gradient wrapper if gradient is specified
  const gradientContent = gradient ? (
    <LinearGradient
      colors={designSystem.colors.gradients[gradient] || gradient}
      style={[styles.base, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  ) : content;

  // Pressable wrapper if interactive
  if (onPress || pressable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && styles.pressed
        ]}
      >
        {gradientContent}
      </Pressable>
    );
  }

  return gradientContent;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: designSystem.borderRadius.lg,
    backgroundColor: 'white',
    overflow: 'hidden'
  },
  
  default: {
    padding: responsive.spacing('md')
  },
  
  elevated: {
    padding: responsive.spacing('lg'),
    borderWidth: 1,
    borderColor: getColor('gray.200')
  },
  
  compact: {
    padding: responsive.spacing('sm')
  },
  
  spacious: {
    padding: responsive.spacing('xl')
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: getColor('gray.300'),
    padding: responsive.spacing('md')
  },
  
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }]
  }
});

export default Card;