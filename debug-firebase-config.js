// Debug Firebase configuration in mobile app context
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth'); 
const { getFirestore } = require('firebase/firestore');

// Exact production configuration from eas.json
const firebaseConfig = {
  apiKey: "AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.firebasestorage.app",
  messagingSenderId: "19849690024",
  appId: "1:19849690024:web:134ceb9fc20fec428a3b9d",
  measurementId: "G-3M77VNP2YC"
};

console.log('🔧 Debugging Firebase Configuration...');
console.log('');

// Print configuration
console.log('📋 Configuration being used:');
Object.entries(firebaseConfig).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
console.log('');

// Test initialization
try {
  console.log('🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  console.log('App name:', app.name);
  console.log('App options:', JSON.stringify(app.options, null, 2));
  
  // Test Auth
  console.log('');
  console.log('🔐 Initializing Firebase Auth...');
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
  console.log('Auth app name:', auth.app.name);
  console.log('Auth config:', auth.config);
  
  // Test Firestore
  console.log('');
  console.log('📄 Initializing Firestore...');
  const db = getFirestore(app);
  console.log('✅ Firestore initialized');
  console.log('Firestore app name:', db.app.name);
  
  console.log('');
  console.log('🎉 All Firebase services initialized successfully!');
  console.log('');
  console.log('⚠️  If you\'re still getting API key errors in the mobile app, the issue might be:');
  console.log('1. Mobile app is using a different configuration');
  console.log('2. Firebase project has domain restrictions');
  console.log('3. App Bundle ID doesn\'t match Firebase app configuration');
  console.log('4. Authentication methods still not enabled in Firebase Console');
  
} catch (error) {
  console.error('❌ Firebase initialization error:');
  console.error('Error:', error.message);
  console.error('Code:', error.code);
}

// Additional diagnostics
console.log('');
console.log('🔍 Additional Diagnostics:');
console.log('- Node.js version:', process.version);
console.log('- Platform:', process.platform);
console.log('- Current directory:', process.cwd());

// Check if environment variables are set
console.log('');
console.log('🌍 Environment Variables Check:');
const envVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});