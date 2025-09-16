// Configuration verification utility for BizInvest Hub
import { Platform } from 'react-native';

export const checkFirebaseConfig = () => {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log('🔥 Firebase Configuration Check:');
  console.log('================================');
  
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  let allValid = true;

  requiredFields.forEach(field => {
    const value = config[field];
    const isValid = value && value !== '' && !value.includes('PLACEHOLDER');
    
    console.log(`${field}: ${isValid ? '✅' : '❌'} ${isValid ? 'Valid' : 'Missing or placeholder'}`);
    
    if (!isValid) {
      allValid = false;
    }
  });

  // Optional field
  const measurementIdValid = config.measurementId && !config.measurementId.includes('PLACEHOLDER');
  console.log(`measurementId: ${measurementIdValid ? '✅' : '⚠️'} ${measurementIdValid ? 'Valid' : 'Optional - Analytics disabled'}`);

  console.log('================================');
  
  if (allValid) {
    console.log('🎉 All required Firebase configuration values are set!');
    console.log(`📊 Project ID: ${config.projectId}`);
    console.log(`🌐 Auth Domain: ${config.authDomain}`);
  } else {
    console.log('❌ Some Firebase configuration values are missing.');
    console.log('📝 Please check your .env.production file and ensure all values are set correctly.');
  }

  return { config, isValid: allValid };
};

export const checkEnvironment = () => {
  console.log('🌍 Environment Check:');
  console.log('====================');
  
  // Check if we're in development mode
  const isDev = __DEV__;
  console.log(`Development Mode: ${isDev ? '✅ Yes' : '❌ No (Production)'}`);
  
  // Check platform
  console.log(`Platform: ${Platform.OS}`);
  
  // Check for environment file loading
  const hasEnvVars = !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  console.log(`Environment Variables Loaded: ${hasEnvVars ? '✅ Yes' : '❌ No'}`);
  
  if (!hasEnvVars) {
    console.log('💡 Make sure you have either .env.development or .env.production file in your project root');
  }
  
  return {
    isDev,
    hasEnvVars,
    platform: Platform.OS
  };
};

export const runFullConfigCheck = () => {
  console.log('\n🔧 BizInvest Hub Configuration Verification\n');
  
  const envCheck = checkEnvironment();
  console.log('\n');
  const firebaseCheck = checkFirebaseConfig();
  
  console.log('\n📋 Summary:');
  console.log('===========');
  
  if (envCheck.hasEnvVars && firebaseCheck.isValid) {
    console.log('🎉 Configuration is ready for production!');
    return true;
  } else {
    console.log('⚠️ Configuration needs attention before proceeding.');
    console.log('📖 Please follow FIREBASE_SETUP_INSTRUCTIONS.md');
    return false;
  }
};

// Auto-run config check in development
if (__DEV__) {
  setTimeout(runFullConfigCheck, 1000);
}

export default {
  checkFirebaseConfig,
  checkEnvironment,
  runFullConfigCheck
};