// Test Firebase authentication state
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, onAuthStateChanged } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.firebasestorage.app",
  messagingSenderId: "19849690024",
  appId: "1:19849690024:web:134ceb9fc20fec428a3b9d",
  measurementId: "G-3M77VNP2YC"
};

async function testAuthState() {
  console.log('🔐 Testing Firebase Authentication State...');
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ User is signed in:');
      console.log('  - UID:', user.uid);
      console.log('  - Email:', user.email);
      console.log('  - Email Verified:', user.emailVerified);
      console.log('  - Token Available:', !!user.accessToken);
    } else {
      console.log('❌ No user is signed in');
    }
  });
  
  // Try to sign in with test account
  try {
    console.log('🔑 Attempting to sign in with test account...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@bizinvesthub.com', 'testpassword123');
    console.log('✅ Sign in successful!');
    console.log('  - User ID:', userCredential.user.uid);
    console.log('  - Access Token:', !!userCredential.user.accessToken);
    
    // Wait a moment then exit
    setTimeout(() => {
      console.log('✅ Authentication test completed successfully');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Sign in failed:');
    console.error('  - Error:', error.message);
    console.error('  - Code:', error.code);
    process.exit(1);
  }
}

testAuthState();