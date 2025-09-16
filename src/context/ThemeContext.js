/**
 * Theme Context for BizInvest Hub
 * Manages light/dark theme switching and enhanced design system
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  enhancedLightTheme, 
  enhancedDarkTheme 
} from '../styles/enhancedDesignSystem';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());

  // Load theme preference on startup
  useEffect(() => {
    loadThemePreference();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else {
        // Use system theme as default
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
      setIsDark(systemTheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const setTheme = async (theme) => {
    const isDarkTheme = theme === 'dark';
    setIsDark(isDarkTheme);
    
    try {
      await AsyncStorage.setItem('theme_preference', theme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const resetToSystemTheme = async () => {
    setIsDark(systemTheme === 'dark');
    
    try {
      await AsyncStorage.removeItem('theme_preference');
    } catch (error) {
      console.log('Error resetting theme preference:', error);
    }
  };

  // Get current theme object
  const currentTheme = isDark ? enhancedDarkTheme : enhancedLightTheme;

  const value = {
    isDark,
    systemTheme,
    currentTheme,
    theme: currentTheme, // Alias for easier access
    colors: currentTheme.colors,
    typography: currentTheme.typography,
    spacing: currentTheme.spacing,
    borderRadius: currentTheme.borderRadius,
    shadows: currentTheme.shadows,
    toggleTheme,
    setTheme,
    resetToSystemTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for colors
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

// Helper hook for typography
export const useTypography = () => {
  const { typography } = useTheme();
  return typography;
};

export default ThemeContext;