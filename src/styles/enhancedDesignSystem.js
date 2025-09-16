/**
 * Enhanced Design System for BizInvest Hub
 * Premium financial platform design tokens with accessibility and modern aesthetics
 */

import { Platform } from 'react-native';

const enhancedDesignSystem = {
  // Enhanced color palette for financial trust and professionalism
  colors: {
    // Primary - Trust & Reliability (Financial Blue)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#0ea5e9', // Main brand - more trustworthy
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    },

    // Success - Growth & Profit (Premium Green)
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Premium green
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    },

    // Warning - Caution (Sophisticated Amber)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },

    // Error - Loss & Risk (Sophisticated Red)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Neutral - Professional Grays
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },

    // Premium gradients for enhanced visual hierarchy
    gradients: {
      primary: ['#0ea5e9', '#0284c7'],
      primaryDark: ['#0284c7', '#0369a1'],
      success: ['#10b981', '#059669'],
      warning: ['#f59e0b', '#d97706'],
      error: ['#ef4444', '#dc2626'],
      
      // Sophisticated combinations
      premium: ['#6366f1', '#8b5cf6', '#ec4899'],
      financial: ['#0ea5e9', '#10b981'],
      sunset: ['#f59e0b', '#ef4444'],
      ocean: ['#0ea5e9', '#06b6d4', '#10b981'],
      
      // Glass morphism backgrounds
      glass: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)'],
      glassBlue: ['rgba(14, 165, 233, 0.2)', 'rgba(2, 132, 199, 0.1)'],
      glassDark: ['rgba(15, 23, 42, 0.8)', 'rgba(30, 41, 59, 0.6)']
    },

    // Semantic colors for financial contexts
    semantic: {
      profit: '#10b981',
      loss: '#ef4444',
      neutral: '#64748b',
      investment: '#0ea5e9',
      revenue: '#059669',
      expense: '#dc2626',
      cash: '#6366f1',
      debt: '#f59e0b'
    }
  },

  // Professional typography system
  typography: {
    fonts: {
      // Premium font stack with fallbacks
      heading: Platform.select({
        ios: 'Inter-Bold',
        android: 'Inter-Bold',
        default: 'System'
      }),
      body: Platform.select({
        ios: 'Inter-Regular',
        android: 'Inter-Regular', 
        default: 'System'
      }),
      mono: Platform.select({
        ios: 'JetBrainsMono-Regular',
        android: 'JetBrainsMono-Regular',
        default: 'Courier New'
      }),
      
      // Specialized financial fonts
      financial: Platform.select({
        ios: 'SF-Pro-Display',
        android: 'Roboto',
        default: 'System'
      })
    },
    
    // Enhanced type scale for financial hierarchy
    sizes: {
      xs: 11,
      sm: 13,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      
      // Display sizes for hero numbers
      display: 72,
      hero: 96
    },
    
    // Professional font weights
    weights: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    
    // Optimized line heights
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },

    // Letter spacing for premium feel
    letterSpacing: {
      tighter: -0.8,
      tight: -0.4,
      normal: 0,
      wide: 0.4,
      wider: 0.8,
      widest: 1.6
    }
  },

  // Consistent spacing system (8pt grid)
  spacing: {
    px: 1,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
    
    // Semantic spacing
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96
  },

  // Enhanced border radius system
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    base: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
    
    // Component-specific radii
    button: 12,
    card: 16,
    modal: 20,
    input: 8
  },

  // Professional shadow system for depth
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
      elevation: 16
    },
    
    // Colored shadows for premium effects
    primaryShadow: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8
    },
    successShadow: {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8
    }
  },

  // Smooth animation system
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 400,
      slower: 600,
      slowest: 1000
    },
    
    easing: {
      linear: [0, 0, 1, 1],
      ease: [0.25, 0.1, 0.25, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOut: [0, 0, 0.58, 1],
      easeInOut: [0.42, 0, 0.58, 1],
      
      // Premium easings
      spring: [0.68, -0.55, 0.265, 1.55],
      bounce: [0.68, -0.6, 0.32, 1.6]
    }
  },

  // Responsive breakpoints
  breakpoints: {
    xs: 320,
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },

  // Component sizing standards
  sizes: {
    // Touch targets (minimum 44px for accessibility)
    touchTarget: 44,
    
    // Button heights
    buttonSm: 36,
    buttonMd: 44,
    buttonLg: 52,
    
    // Input heights
    inputSm: 36,
    inputMd: 44,
    inputLg: 52,
    
    // Icon sizes
    iconXs: 12,
    iconSm: 16,
    iconMd: 20,
    iconLg: 24,
    iconXl: 32,
    
    // Avatar sizes
    avatarSm: 32,
    avatarMd: 48,
    avatarLg: 64,
    avatarXl: 96
  },

  // Z-index system
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Helper functions for enhanced design system
const getEnhancedColor = (colorPath) => {
  const keys = colorPath.split('.');
  let color = enhancedDesignSystem.colors;
  
  for (const key of keys) {
    color = color[key];
    if (!color) return enhancedDesignSystem.colors.gray[500];
  }
  
  return color;
};

const getSpacing = (size) => {
  return enhancedDesignSystem.spacing[size] || size;
};

const getBorderRadius = (size) => {
  return enhancedDesignSystem.borderRadius[size] || size;
};

const getShadow = (size) => {
  return enhancedDesignSystem.shadows[size] || enhancedDesignSystem.shadows.md;
};

const getFontSize = (size) => {
  return enhancedDesignSystem.typography.sizes[size] || size;
};

// Theme variants for enhanced theming
const enhancedLightTheme = {
  ...enhancedDesignSystem,
  name: 'light',
  colors: {
    ...enhancedDesignSystem.colors,
    background: enhancedDesignSystem.colors.gray[50],
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    text: enhancedDesignSystem.colors.gray[900],
    textSecondary: enhancedDesignSystem.colors.gray[600],
    textTertiary: enhancedDesignSystem.colors.gray[500],
    border: enhancedDesignSystem.colors.gray[200],
    borderLight: enhancedDesignSystem.colors.gray[100],
    overlay: 'rgba(0, 0, 0, 0.5)'
  }
};

const enhancedDarkTheme = {
  ...enhancedDesignSystem,
  name: 'dark',
  colors: {
    ...enhancedDesignSystem.colors,
    background: enhancedDesignSystem.colors.gray[950],
    backgroundSecondary: enhancedDesignSystem.colors.gray[900],
    surface: enhancedDesignSystem.colors.gray[800],
    text: enhancedDesignSystem.colors.gray[50],
    textSecondary: enhancedDesignSystem.colors.gray[400],
    textTertiary: enhancedDesignSystem.colors.gray[500],
    border: enhancedDesignSystem.colors.gray[700],
    borderLight: enhancedDesignSystem.colors.gray[800],
    overlay: 'rgba(0, 0, 0, 0.8)'
  }
};

export {
  enhancedDesignSystem,
  getEnhancedColor,
  getSpacing,
  getBorderRadius,
  getShadow,
  getFontSize,
  enhancedLightTheme,
  enhancedDarkTheme
};

export default enhancedDesignSystem;