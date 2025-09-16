/**
 * UI Components Index
 * Centralized export for all reusable UI components
 */

export { default as Card } from './Card';
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as MetricCard } from './MetricCard';

// Enhanced components
export { default as EnhancedMetricCard } from './EnhancedMetricCard';
export { default as ProfessionalHeader } from './ProfessionalHeader';

// Re-export enhanced design system for easy access
export { 
  enhancedDesignSystem,
  getEnhancedColor, 
  getSpacing, 
  getBorderRadius, 
  getShadow,
  getFontSize,
  enhancedLightTheme,
  enhancedDarkTheme
} from '../../styles/enhancedDesignSystem';

// Legacy design system support (for gradual migration)
export { 
  designSystem, 
  getColor, 
  getRadius,
  lightTheme,
  darkTheme
} from '../../styles/designSystem';

// Re-export responsive utilities
export { 
  responsive, 
  deviceInfo, 
  breakpoints, 
  layouts, 
  animations
} from '../../utils/responsive';

// Re-export theme context and font utilities
export { 
  useTheme, 
  useColors, 
  useTypography,
  ThemeProvider 
} from '../../context/ThemeContext';

export { 
  getFont, 
  fontConfig,
  loadFonts 
} from '../../config/fonts';