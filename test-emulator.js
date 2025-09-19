const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, addDoc, getDocs, doc, setDoc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

console.log('🧪 Testing Firebase Emulators...\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com", 
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
try {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firebase emulators');
} catch (error) {
  console.log('❌ Failed to connect to emulators:', error.message);
  process.exit(1);
}

async function testFirebaseEmulators() {
  try {
    console.log('\n🔐 Testing Authentication...');
    
    // Test user creation with random email
    const testEmail = `test${Date.now()}@bizinvest.com`;
    const testPassword = 'testpassword123';
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User created:', userCredential.user.email);
    
    // Test sign in
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User signed in successfully');
    
    console.log('\n📊 Testing Firestore...');
    
    // Test user profile creation (matches security rules)
    const userId = userCredential.user.uid;
    await setDoc(doc(db, 'users', userId), {
      email: testEmail,
      name: 'Test User',
      role: 'sme',
      createdAt: new Date(),
      testField: 'Firebase emulators working!'
    });
    console.log('✅ User profile created with ID:', userId);
    
    // Test transaction creation (user-owned)
    const transactionDoc = await addDoc(collection(db, 'transactions'), {
      userId: userId,
      amount: 1000,
      type: 'income',
      description: 'Test transaction',
      date: new Date()
    });
    console.log('✅ Transaction created with ID:', transactionDoc.id);
    
    // Test document reading
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log('✅ User documents read:', querySnapshot.size);
    
    console.log('\n🎉 All Firebase emulator tests passed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Keep Firebase emulators running (in the other terminal)');
    console.log('2. You can now work on your app features while Node.js compatibility is resolved');
    console.log('3. Switch to Node.js 18 LTS when ready for full development');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFirebaseEmulators();