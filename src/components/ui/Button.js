/**
 * Enhanced Button Component
 * Modern button with multiple variants, loading states, and haptic feedback
 */

import React from 'react';
import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getEnhancedColor, getSpacing, getFontSize, getBorderRadius } from '../../styles/enhancedDesignSystem';
import { getFont } from '../../config/fonts';
import { useTheme } from '../../context/ThemeContext';
import { responsive } from '../../utils/responsive';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  gradient = null,
  hapticFeedback = true,
  style,
  textStyle,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  const handlePress = async () => {
    if (loading || disabled || !onPress) return;
    
    // Add haptic feedback
    if (hapticFeedback) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available on this device
      }
    }
    
    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : colors.primary[500]} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={getFontSize('base')} 
              color={variant === 'primary' ? 'white' : colors.primary[500]}
              style={styles.iconLeft}
            />
          )}
          
          <Text style={textStyles}>
            {children || title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={getFontSize('base')} 
              color={variant === 'primary' ? 'white' : colors.primary[500]}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  // Gradient button
  if (gradient) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading || disabled}
        style={({ pressed }) => [
          styles.base,
          styles[size],
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
          style
        ]}
        {...props}
      >
        <LinearGradient
          colors={colors.gradients?.[gradient] || gradient || colors.gradients.primary}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {renderContent()}
        </LinearGradient>
      </Pressable>
    );
  }

  // Regular button
  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && !disabled && styles.pressed
      ]}
      {...props}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: getBorderRadius('lg'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  
  // Variants
  primary: {
    backgroundColor: getEnhancedColor('primary.500')
  },
  
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: getEnhancedColor('primary.500')
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: getEnhancedColor('gray.300')
  },
  
  ghost: {
    backgroundColor: 'transparent'
  },
  
  danger: {
    backgroundColor: getEnhancedColor('error.500')
  },
  
  success: {
    backgroundColor: getEnhancedColor('success.500')
  },
  
  // Sizes
  sm: {
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    minHeight: 36
  },
  
  md: {
    paddingHorizontal: getSpacing('lg'),
    paddingVertical: getSpacing('md'),
    minHeight: 44
  },
  
  lg: {
    paddingHorizontal: getSpacing('xl'),
    paddingVertical: getSpacing('lg'),
    minHeight: 52
  },
  
  // Text styles
  text: {
    fontFamily: getFont('semibold'),
    textAlign: 'center',
    letterSpacing: -0.2
  },
  
  primaryText: {
    color: 'white'
  },
  
  secondaryText: {
    color: getEnhancedColor('primary.500')
  },
  
  outlineText: {
    color: getEnhancedColor('gray.700')
  },
  
  ghostText: {
    color: getEnhancedColor('primary.500')
  },
  
  dangerText: {
    color: 'white'
  },
  
  successText: {
    color: 'white'
  },
  
  // Size text styles
  smText: {
    fontSize: getFontSize('sm')
  },
  
  mdText: {
    fontSize: getFontSize('base')
  },
  
  lgText: {
    fontSize: getFontSize('lg')
  },
  
  // States
  disabled: {
    opacity: 0.5
  },
  
  disabledText: {
    opacity: 0.7
  },
  
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  
  // Content and icons
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  iconLeft: {
    marginRight: getSpacing('sm')
  },
  
  iconRight: {
    marginLeft: getSpacing('sm')
  },
  
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing('lg'),
    paddingVertical: getSpacing('md'),
    borderRadius: getBorderRadius('lg')
  }
});

export default Button;