/**
 * Wellfound.com Exact Design System
 * Pixel-perfect replication of Wellfound's design tokens
 */

import { Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Exact Wellfound breakpoints
export const BREAKPOINTS = {
  mobile: 520,
  tablet: 960,
  desktop: 1200,
  large: 2000
};

// Exact Wellfound colors
export const WELLFOUND_COLORS = {
  // Primary palette
  black: '#000000',
  white: '#ffffff',
  
  // Gray scale (exact Tailwind grays)
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827'
};

// Exact Wellfound typography scale
export const WELLFOUND_TYPOGRAPHY = {
  // Hero text - exact font sizes
  hero: {
    fontSize: Platform.select({ web: 72, default: 48 }),
    lineHeight: Platform.select({ web: 80, default: 56 }),
    fontWeight: '800',
    letterSpacing: Platform.select({ web: -2, default: -1 })
  },
  
  // Heading hierarchy
  h1: {
    fontSize: Platform.select({ web: 48, default: 36 }),
    lineHeight: Platform.select({ web: 56, default: 44 }),
    fontWeight: '700',
    letterSpacing: Platform.select({ web: -1, default: -0.5 })
  },
  
  h2: {
    fontSize: Platform.select({ web: 36, default: 28 }),
    lineHeight: Platform.select({ web: 44, default: 36 }),
    fontWeight: '600',
    letterSpacing: Platform.select({ web: -0.5, default: 0 })
  },
  
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: 0
  },
  
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0
  },
  
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0
  },
  
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0
  }
};

// Exact Wellfound spacing system (8px grid)
export const WELLFOUND_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  '8xl': 120
};

// Exact Wellfound animation timings
export const WELLFOUND_ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  stagger: 200,
  
  // Easing functions
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// Wellfound button styles
export const WELLFOUND_BUTTONS = {
  primary: {
    backgroundColor: WELLFOUND_COLORS.black,
    color: WELLFOUND_COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    fontSize: 16,
    fontWeight: '600',
    
    // Hover state
    hover: {
      backgroundColor: WELLFOUND_COLORS.white,
      color: WELLFOUND_COLORS.black,
      borderWidth: 1,
      borderColor: WELLFOUND_COLORS.black
    }
  },
  
  secondary: {
    backgroundColor: 'transparent',
    color: WELLFOUND_COLORS.gray700,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: WELLFOUND_COLORS.gray300,
    fontSize: 16,
    fontWeight: '600',
    
    // Hover state
    hover: {
      backgroundColor: WELLFOUND_COLORS.gray50,
      color: WELLFOUND_COLORS.black,
      borderColor: WELLFOUND_COLORS.gray400
    }
  },
  
  nav: {
    backgroundColor: 'transparent',
    color: WELLFOUND_COLORS.gray700,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 15,
    fontWeight: '500',
    
    // Hover state
    hover: {
      backgroundColor: WELLFOUND_COLORS.gray50,
      color: WELLFOUND_COLORS.black
    }
  }
};

// Wellfound shadow system
export const WELLFOUND_SHADOWS = {
  xs: {
    shadowColor: WELLFOUND_COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  
  sm: {
    shadowColor: WELLFOUND_COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  
  md: {
    shadowColor: WELLFOUND_COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  
  lg: {
    shadowColor: WELLFOUND_COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8
  }
};

// Responsive utilities
export const getResponsiveValue = (mobile, tablet, desktop) => {
  if (screenWidth < BREAKPOINTS.tablet) return mobile;
  if (screenWidth < BREAKPOINTS.desktop) return tablet || mobile;
  return desktop || tablet || mobile;
};

export const isMobile = screenWidth < BREAKPOINTS.tablet;
export const isTablet = screenWidth >= BREAKPOINTS.tablet && screenWidth < BREAKPOINTS.desktop;
export const isDesktop = screenWidth >= BREAKPOINTS.desktop;

// Container max-widths (exact Wellfound values)
export const CONTAINER_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1200,
  '2xl': 1400
};

// Helper functions
export const getContainerStyle = (maxWidth = 'xl') => ({
  maxWidth: CONTAINER_WIDTHS[maxWidth],
  width: '100%',
  alignSelf: 'center',
  paddingHorizontal: WELLFOUND_SPACING['2xl']
});

export const getTextStyle = (variant) => {
  const style = WELLFOUND_TYPOGRAPHY[variant];
  return {
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'System',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'System'
    })
  };
};

export const getButtonStyle = (variant, isHovered = false) => {
  const buttonConfig = WELLFOUND_BUTTONS[variant];
  const baseStyle = {
    backgroundColor: buttonConfig.backgroundColor,
    paddingHorizontal: buttonConfig.paddingHorizontal,
    paddingVertical: buttonConfig.paddingVertical,
    borderRadius: buttonConfig.borderRadius,
    borderWidth: buttonConfig.borderWidth || 0,
    borderColor: buttonConfig.borderColor || 'transparent',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined })
  };
  
  if (isHovered && buttonConfig.hover) {
    return {
      ...baseStyle,
      ...buttonConfig.hover
    };
  }
  
  return baseStyle;
};

export const getButtonTextStyle = (variant, isHovered = false) => {
  const buttonConfig = WELLFOUND_BUTTONS[variant];
  const baseStyle = {
    fontSize: buttonConfig.fontSize,
    fontWeight: buttonConfig.fontWeight,
    color: buttonConfig.color,
    textAlign: 'center',
    transition: Platform.select({ web: 'color 150ms ease', default: undefined })
  };
  
  if (isHovered && buttonConfig.hover) {
    return {
      ...baseStyle,
      color: buttonConfig.hover.color
    };
  }
  
  return baseStyle;
};

export default {
  BREAKPOINTS,
  WELLFOUND_COLORS,
  WELLFOUND_TYPOGRAPHY,
  WELLFOUND_SPACING,
  WELLFOUND_ANIMATIONS,
  WELLFOUND_BUTTONS,
  WELLFOUND_SHADOWS,
  CONTAINER_WIDTHS,
  getResponsiveValue,
  getContainerStyle,
  getTextStyle,
  getButtonStyle,
  getButtonTextStyle,
  isMobile,
  isTablet,
  isDesktop
};