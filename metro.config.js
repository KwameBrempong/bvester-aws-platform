const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize for web builds
config.resolver.alias = {
  'react-native$': 'react-native-web',
};

module.exports = config;