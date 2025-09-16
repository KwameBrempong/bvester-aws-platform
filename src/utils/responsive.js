/**
 * Responsive utilities for BizInvest Hub
 * Handles device sizes, typography scaling, and layout adaptations
 */

import { Dimensions, PixelRatio } from 'react-native';
import { designSystem } from '../styles/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 350,
  isMediumDevice: SCREEN_WIDTH >= 350 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH > 768,
  pixelRatio: PixelRatio.get(),
  isHighRes: PixelRatio.get() >= 2
};

// Responsive width/height functions
const responsive = {
  // Convert percentage to actual pixels
  width: (percentage) => (SCREEN_WIDTH * percentage) / 100,
  height: (percentage) => (SCREEN_HEIGHT * percentage) / 100,
  
  // Responsive font sizes based on device
  fontSize: (size) => {
    const baseSize = designSystem.typography.sizes[size] || size;
    
    if (deviceInfo.isSmallDevice) {
      return Math.round(baseSize * 0.9);
    } else if (deviceInfo.isLargeDevice) {
      return Math.round(baseSize * 1.1);
    }
    return baseSize;
  },
  
  // Responsive spacing
  spacing: (size) => {
    const baseSpacing = designSystem.spacing[size] || size;
    
    if (deviceInfo.isSmallDevice) {
      return Math.round(baseSpacing * 0.8);
    } else if (deviceInfo.isTablet) {
      return Math.round(baseSpacing * 1.2);
    }
    return baseSpacing;
  },
  
  // Responsive padding for containers
  containerPadding: () => {
    if (deviceInfo.isSmallDevice) return designSystem.spacing.sm;
    if (deviceInfo.isTablet) return designSystem.spacing.xl;
    return designSystem.spacing.md;
  },
  
  // Card dimensions based on screen size
  cardWidth: (columns = 1, margin = designSystem.spacing.md) => {
    const totalMargin = margin * 2; // left and right
    const gaps = (columns - 1) * designSystem.spacing.sm;
    return (SCREEN_WIDTH - totalMargin - gaps) / columns;
  },
  
  // Safe area calculations
  safeWidth: (padding = designSystem.spacing.md) => SCREEN_WIDTH - (padding * 2),
  
  // Button sizing
  buttonHeight: () => {
    if (deviceInfo.isSmallDevice) return 44;
    if (deviceInfo.isTablet) return 56;
    return 48;
  },
  
  // Input field sizing
  inputHeight: () => {
    if (deviceInfo.isSmallDevice) return 40;
    if (deviceInfo.isTablet) return 52;
    return 44;
  }
};

// Responsive style generator
const createResponsiveStyle = (styles) => {
  const responsiveStyles = {};
  
  Object.keys(styles).forEach(key => {
    const style = styles[key];
    responsiveStyles[key] = {};
    
    Object.keys(style).forEach(property => {
      const value = style[property];
      
      // Handle responsive font sizes
      if (property === 'fontSize' && typeof value === 'string') {
        responsiveStyles[key][property] = responsive.fontSize(value);
      }
      // Handle responsive spacing
      else if (['padding', 'paddingHorizontal', 'paddingVertical', 'margin', 'marginHorizontal', 'marginVertical'].includes(property) && typeof value === 'string') {
        responsiveStyles[key][property] = responsive.spacing(value);
      }
      // Handle responsive widths/heights
      else if (['width', 'height'].includes(property) && typeof value === 'string' && value.includes('%')) {
        const percentage = parseFloat(value.replace('%', ''));
        responsiveStyles[key][property] = property === 'width' 
          ? responsive.width(percentage) 
          : responsive.height(percentage);
      }
      else {
        responsiveStyles[key][property] = value;
      }
    });
  });
  
  return responsiveStyles;
};

// Breakpoint utilities
const breakpoints = {
  up: (breakpoint) => SCREEN_WIDTH >= designSystem.breakpoints[breakpoint],
  down: (breakpoint) => SCREEN_WIDTH < designSystem.breakpoints[breakpoint],
  only: (breakpoint) => {
    const breakpointKeys = Object.keys(designSystem.breakpoints);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    
    return SCREEN_WIDTH >= designSystem.breakpoints[breakpoint] && 
           (!nextBreakpoint || SCREEN_WIDTH < designSystem.breakpoints[nextBreakpoint]);
  }
};

// Common responsive layouts
const layouts = {
  // Full screen with safe padding
  container: {
    flex: 1,
    paddingHorizontal: responsive.containerPadding(),
    backgroundColor: designSystem.colors.gray[50]
  },
  
  // Card grid layouts
  cardGrid: (columns = 2) => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.containerPadding()
  }),
  
  // Form layouts
  formContainer: {
    paddingHorizontal: responsive.containerPadding(),
    paddingVertical: responsive.spacing('lg')
  },
  
  // Header layouts
  header: {
    paddingHorizontal: responsive.containerPadding(),
    paddingVertical: responsive.spacing('md'),
    backgroundColor: 'white'
  }
};

// Animation helpers for responsive transitions
export const animations = {
  slideIn: (duration = designSystem.animation.normal) => ({
    duration,
    useNativeDriver: true
  }),
  
  fadeIn: (duration = designSystem.animation.normal) => ({
    duration,
    useNativeDriver: true
  }),
  
  scale: (duration = designSystem.animation.normal) => ({
    duration,
    useNativeDriver: true
  })
};

export default responsive;