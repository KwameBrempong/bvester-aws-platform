/**
 * BizInvest Hub Design System
 * Modern fintech design tokens and utilities
 */

const designSystem = {
  // Color palette optimized for fintech/investment platforms
  colors: {
    // Primary brand colors - Professional blue gradient
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand color
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },

    // Secondary - Investment green
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Success/profit color
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },

    // Success colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },

    // Warning colors for risk indicators
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },

    // Error/Loss colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },

    // Neutral grays - Modern palette
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
      900: '#0f172a'
    },

    // Gradient combinations for cards and backgrounds
    gradients: {
      primary: ['#667eea', '#764ba2'],
      success: ['#56ab2f', '#a8e6cf'],
      warning: ['#f093fb', '#f5576c'],
      investment: ['#4facfe', '#00f2fe'],
      premium: ['#667eea', '#764ba2', '#f093fb'],
      dark: ['#1a1a2e', '#16213e', '#0f3460']
    }
  },

  // Typography system
  typography: {
    fonts: {
      heading: 'System', // Will fallback to system font
      body: 'System',
      mono: 'Courier New'
    },
    
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48
    },
    
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    },
    
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing system (base-8 grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96
  },

  // Border radius system
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999
  },

  // Shadow system for depth
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 12
    }
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 320,
    md: 768,
    lg: 1024,
    xl: 1280
  }
};

// Helper functions for design system
const getColor = (colorPath) => {
  const keys = colorPath.split('.');
  let color = designSystem.colors;
  
  for (const key of keys) {
    color = color[key];
    if (!color) return designSystem.colors.gray[500]; // fallback
  }
  
  return color;
};

const getSpacing = (size) => {
  return designSystem.spacing[size] || size;
};

const getRadius = (size) => {
  return designSystem.borderRadius[size] || size;
};

const getShadow = (size) => {
  return designSystem.shadows[size] || designSystem.shadows.md;
};

// Theme variants
const lightTheme = {
  ...designSystem,
  name: 'light',
  colors: {
    ...designSystem.colors,
    background: designSystem.colors.gray[50],
    surface: '#ffffff',
    text: designSystem.colors.gray[900],
    textSecondary: designSystem.colors.gray[600],
    border: designSystem.colors.gray[200]
  }
};

const darkTheme = {
  ...designSystem,
  name: 'dark',
  colors: {
    ...designSystem.colors,
    background: designSystem.colors.gray[900],
    surface: designSystem.colors.gray[800],
    text: designSystem.colors.gray[100],
    textSecondary: designSystem.colors.gray[400],
    border: designSystem.colors.gray[700]
  }
};

// Export everything
export {
  designSystem,
  getColor,
  getSpacing,
  getRadius,
  getShadow,
  lightTheme,
  darkTheme
};

export default designSystem;