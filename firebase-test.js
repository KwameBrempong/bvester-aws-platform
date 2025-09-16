// Firebase Connection Test for BizInvest Hub
// This tests Firebase without Expo to verify your configuration

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Firebase setup
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 BizInvest Hub - Firebase Connection Test');
console.log('===========================================\n');

// Initialize Firebase
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}\n`);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

// Test Firebase Authentication
async function testAuthentication() {
  console.log('🔐 Testing Firebase Authentication...');
  
  const testEmail = 'test@bizinvesthub.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // Try to create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User registration successful');
    console.log(`👤 User ID: ${userCredential.user.uid}`);
    
    // Sign out
    await auth.signOut();
    console.log('✅ Sign out successful');
    
    // Try to sign in
    const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User login successful');
    console.log(`👤 Logged in as: ${signInCredential.user.email}`);
    
    return signInCredential.user;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ User already exists, trying login...');
      try {
        const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('✅ User login successful');
        return signInCredential.user;
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.message);
        return null;
      }
    } else {
      console.error('❌ Authentication failed:', error.message);
      return null;
    }
  }
}

// Test Firestore Database
async function testFirestore(user) {
  console.log('\n📊 Testing Firestore Database...');
  
  try {
    // Test creating a document
    const testTransaction = {
      userId: user.uid,
      type: 'income',
      category: 'Product Sales',
      amount: 15000,
      currency: 'USD',
      description: 'Firebase connection test transaction',
      timestamp: new Date().toISOString(),
      testRecord: true
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), testTransaction);
    console.log('✅ Document created successfully');
    console.log(`📄 Document ID: ${docRef.id}`);
    
    // Test reading documents
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    console.log(`✅ Read ${querySnapshot.size} documents from Firestore`);
    
    let testDoc = null;
    querySnapshot.forEach((doc) => {
      if (doc.data().testRecord) {
        testDoc = doc;
      }
    });
    
    if (testDoc) {
      console.log(`📋 Test document data:`, {
        id: testDoc.id,
        ...testDoc.data()
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    const user = await testAuthentication();
    
    if (user) {
      const firestoreSuccess = await testFirestore(user);
      
      console.log('\n🎯 Test Results Summary:');
      console.log('========================');
      console.log('✅ Firebase Configuration: Valid');
      console.log('✅ Authentication: Working');
      console.log(`${firestoreSuccess ? '✅' : '❌'} Firestore Database: ${firestoreSuccess ? 'Working' : 'Failed'}`);
      
      if (firestoreSuccess) {
        console.log('\n🎉 All Firebase services are working correctly!');
        console.log('📱 Your BizInvest Hub app is ready for production testing.');
        console.log('\n💡 Next steps:');
        console.log('1. Fix Node.js v24 compatibility for Expo');
        console.log('2. Start the React Native app');
        console.log('3. Run comprehensive testing');
      } else {
        console.log('\n⚠️ Some issues found. Check Firestore security rules.');
      }
      
    } else {
      console.log('\n❌ Authentication failed. Check your Firebase configuration.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

// Start the tests
runTests();