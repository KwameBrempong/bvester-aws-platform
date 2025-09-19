/**
 * Enhanced Input Component
 * Modern input field with validation, icons, and accessibility
 */

import React, { useState, forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  Pressable,
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem, getColor } from '../../styles/designSystem';
import { responsive } from '../../utils/responsive';

export const Input = forwardRef(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  inputStyle,
  containerStyle,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyles = [
    styles.container,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
    containerStyle
  ];

  const inputStyles = [
    styles.input,
    styles[`${size}Input`],
    multiline && styles.multilineInput,
    inputStyle
  ];

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = () => {
    if (secureTextEntry) {
      return showPassword ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[
          styles.label,
          error && styles.errorLabel,
          disabled && styles.disabledLabel
        ]}>
          {label}
        </Text>
      )}
      
      <View style={containerStyles}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={getColor(isFocused ? 'primary.500' : 'gray.400')}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={getColor('gray.400')}
          style={inputStyles}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessible={true}
          accessibilityLabel={label || placeholder}
          accessibilityHint={helperText || error}
          {...props}
        />
        
        {getRightIcon() && (
          <Pressable 
            onPress={handleRightIconPress}
            style={styles.rightIconButton}
            accessibilityLabel={secureTextEntry ? 'Toggle password visibility' : 'Right icon'}
          >
            <Ionicons 
              name={getRightIcon()} 
              size={20} 
              color={getColor(isFocused ? 'primary.500' : 'gray.400')}
            />
          </Pressable>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error && styles.errorText
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: responsive.spacing('md')
  },
  
  label: {
    fontSize: responsive.fontSize('sm'),
    fontWeight: designSystem.typography.weights.medium,
    color: getColor('gray.700'),
    marginBottom: responsive.spacing('xs')
  },
  
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: 'white'
  },
  
  // Variants
  default: {
    borderColor: getColor('gray.300')
  },
  
  filled: {
    borderColor: 'transparent',
    backgroundColor: getColor('gray.100')
  },
  
  outline: {
    borderColor: getColor('gray.300'),
    backgroundColor: 'transparent'
  },
  
  // Sizes
  sm: {
    minHeight: 36,
    paddingHorizontal: responsive.spacing('sm')
  },
  
  md: {
    minHeight: responsive.inputHeight(),
    paddingHorizontal: responsive.spacing('md')
  },
  
  lg: {
    minHeight: 52,
    paddingHorizontal: responsive.spacing('lg')
  },
  
  // Input styles
  input: {
    flex: 1,
    fontSize: responsive.fontSize('base'),
    color: getColor('gray.900'),
    paddingVertical: 0 // Remove default padding
  },
  
  smInput: {
    fontSize: responsive.fontSize('sm')
  },
  
  mdInput: {
    fontSize: responsive.fontSize('base')
  },
  
  lgInput: {
    fontSize: responsive.fontSize('lg')
  },
  
  multilineInput: {
    paddingVertical: responsive.spacing('sm'),
    textAlignVertical: 'top'
  },
  
  // States
  focused: {
    borderColor: getColor('primary.500'),
    borderWidth: 2
  },
  
  error: {
    borderColor: getColor('error.500')
  },
  
  disabled: {
    backgroundColor: getColor('gray.100'),
    opacity: 0.6
  },
  
  // Icons
  leftIcon: {
    marginRight: responsive.spacing('sm')
  },
  
  rightIconButton: {
    padding: responsive.spacing('xs'),
    marginLeft: responsive.spacing('sm')
  },
  
  // Text styles
  errorLabel: {
    color: getColor('error.500')
  },
  
  disabledLabel: {
    color: getColor('gray.400')
  },
  
  helperText: {
    fontSize: responsive.fontSize('xs'),
    color: getColor('gray.500'),
    marginTop: responsive.spacing('xs')
  },
  
  errorText: {
    color: getColor('error.500')
  }
});

export default Input;