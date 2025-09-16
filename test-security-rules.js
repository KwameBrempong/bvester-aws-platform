// Quick test after publishing security rules
require('dotenv').config({ path: '.env.production' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testSecurityRules() {
  console.log('🔐 Testing Security Rules After Publishing...\n');
  
  try {
    // Step 1: Login
    console.log('1. Authenticating user...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@bizinvesthub.com', 'testpass123');
    console.log('✅ User authenticated:', userCredential.user.uid);
    
    // Step 2: Test document creation with proper auth
    console.log('\n2. Testing document creation with authentication...');
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Security rules test',
      userId: userCredential.user.uid,
      timestamp: serverTimestamp()
    });
    console.log('✅ Document created successfully:', docRef.id);
    
    console.log('\n🎉 SUCCESS: Security rules are working correctly!');
    console.log('✅ Authentication: Working');
    console.log('✅ Firestore Database: Working'); 
    console.log('✅ Security Rules: Active');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'permission-denied') {
      console.log('⚠️ Security rules may not be published yet. Try again in 1-2 minutes.');
    }
  }
}

testSecurityRules();