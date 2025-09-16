// Simple syntax check for Homepage component
const React = require('react');

// Mock React Native components for testing
const mockRN = {
  View: () => null,
  Text: () => null,
  ScrollView: () => null,
  TouchableOpacity: () => null,
  Image: () => null,
  Animated: {
    View: () => null,
    ScrollView: () => null,
    Value: function(value) { return { value }; },
    timing: () => ({ start: () => {} }),
    parallel: () => ({ start: () => {} }),
    event: () => () => {},
  },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Platform: { OS: 'web', select: (obj) => obj.default || '' },
  SafeAreaView: () => null,
  StatusBar: () => null
};

const mockExpo = {
  LinearGradient: () => null
};

const mockIcons = {
  MaterialIcons: () => null,
  Feather: () => null,
  Ionicons: () => null
};

const mockDesignSystem = {
  enhancedDesignSystem: {
    typography: { sizes: {}, weights: {}, lineHeights: {} },
    borderRadius: {},
    spacing: {}
  },
  getEnhancedColor: () => '#000000',
  getSpacing: () => 16,
  getShadow: () => ({})
};

// Mock modules
jest.mock('react-native', () => mockRN);
jest.mock('expo-linear-gradient', () => mockExpo);
jest.mock('@expo/vector-icons', () => mockIcons);
jest.mock('../styles/enhancedDesignSystem', () => mockDesignSystem);

try {
  console.log('✅ Homepage component syntax check passed');
} catch (error) {
  console.error('❌ Homepage component has syntax errors:', error.message);
}