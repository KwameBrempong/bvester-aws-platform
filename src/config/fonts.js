/**
 * Font Configuration for BizInvest Hub
 * Professional typography setup with fallbacks
 */

import { Platform } from 'react-native';
import * as Font from 'expo-font';

// Font loading configuration
export const loadFonts = async () => {
  try {
    await Font.loadAsync({
      // Inter font family (when available)
      'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
      'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
      
      // JetBrains Mono for financial data (when available)
      'JetBrainsMono-Regular': require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
      'JetBrainsMono-Bold': require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
    });
    return true;
  } catch (error) {
    console.log('Custom fonts not available, using system fonts:', error.message);
    return false;
  }
};

// Font family configuration with system fallbacks
export const fontConfig = {
  // Heading fonts with professional fallbacks
  heading: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System'
    })
  }),
  
  // Body text fonts
  body: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System'
    })
  }),
  
  // Medium weight fonts
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto-Medium',
      default: 'System'
    })
  }),
  
  // Semibold fonts
  semibold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto-Medium',
      default: 'System'
    })
  }),
  
  // Bold fonts
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto-Bold',
      default: 'System'
    })
  }),
  
  // Monospace for financial data
  mono: Platform.select({
    ios: 'JetBrainsMono-Regular',
    android: 'JetBrainsMono-Regular',
    default: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'Courier New'
    })
  }),
  
  // Monospace bold
  monoBold: Platform.select({
    ios: 'JetBrainsMono-Bold',
    android: 'JetBrainsMono-Bold',
    default: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'Courier New'
    })
  })
};

// Typography helper function
export const getFont = (weight = 'regular') => {
  switch (weight) {
    case 'medium':
      return fontConfig.medium;
    case 'semibold':
      return fontConfig.semibold;
    case 'bold':
      return fontConfig.bold;
    case 'heading':
      return fontConfig.heading;
    case 'mono':
      return fontConfig.mono;
    case 'monoBold':
      return fontConfig.monoBold;
    default:
      return fontConfig.body;
  }
};

export default fontConfig;