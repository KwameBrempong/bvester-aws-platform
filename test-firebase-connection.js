// Test Firebase connection with production credentials
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth'); 
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.firebasestorage.app",
  messagingSenderId: "19849690024",
  appId: "1:19849690024:web:134ceb9fc20fec428a3b9d",
  measurementId: "G-3M77VNP2YC"
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    // Test Authentication
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    // Test anonymous sign-in
    console.log('🔐 Testing anonymous authentication...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous authentication successful:', userCredential.user.uid);
    
    // Test Firestore
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    // Test write operation
    console.log('📝 Testing Firestore write...');
    await setDoc(doc(db, 'test', 'connection'), {
      timestamp: new Date(),
      test: 'Firebase connection test',
      status: 'success'
    });
    console.log('✅ Firestore write successful');
    
    console.log('🎉 All Firebase services working correctly!');
    
  } catch (error) {
    console.error('❌ Firebase connection error:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testFirebaseConnection();