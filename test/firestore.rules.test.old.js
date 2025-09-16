const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Project ID should match your Firebase project
const PROJECT_ID = 'bizinvest-hub-prod';

// Load your actual rules file
const rulesFile = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');

let testEnv;

describe('Firestore Security Rules Tests', function() {
  // Increase timeout for all tests
  this.timeout(15000);

  // Setup before all tests
  before(async function() {
    // Initialize the test environment
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rulesFile,
        host: 'localhost',
        port: 8080
      }
    });
  });

  // Clear data after each test
  afterEach(async function() {
    await testEnv.clearFirestore();
  });

  // Cleanup after all tests
  after(async function() {
    await testEnv.cleanup();
  });

  describe('Users Collection Rules', function() {
    it('allows authenticated users to read business listings', async function() {
  const userId = 'testuser123';
  const db = testEnv.authenticatedContext(userId).firestore();
  
  // Create test business listing
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'businessListings', 'biz123'), {
      name: 'Test Business',
      ownerId: 'owner123'
    });
  });

  // Test: Authenticated users can read business listings
  const bizDoc = doc(db, 'businessListings', 'biz123');
  await assertSucceeds(getDoc(bizDoc));
});

it('denies unauthenticated users from reading business listings', async function() {
  const db = testEnv.unauthenticatedContext().firestore();
  
  // Test: Unauthenticated users cannot read business listings
  const bizDoc = doc(db, 'businessListings', 'biz123');
  await assertFails(getDoc(bizDoc));
});
      const userId = 'testuser123';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Create test data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', userId), {
          name: 'Test User',
          email: 'test@example.com'
        });
      });

      // Test: User can read their own profile
      const userDoc = doc(db, 'users', userId);
      await assertSucceeds(getDoc(userDoc));
    });

    it('denies users from reading other user profiles', async function() {
      const userId = 'testuser123';
      const otherUserId = 'otheruser456';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Test: User cannot read another user's profile
      const otherUserDoc = doc(db, 'users', otherUserId);
      await assertFails(getDoc(otherUserDoc));
    });

    it('denies unauthenticated users from reading any profiles', async function() {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Test: Unauthenticated user cannot read profiles
      const userDoc = doc(db, 'users', 'anyuserid');
      await assertFails(getDoc(userDoc));
    });
  });

  describe('Transactions Collection Rules', function() {
    it('allows users to read their own transactions', async function() {
      const userId = 'testuser123';
      const docId = 'trans123';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Create test transaction with matching userId
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'transactions', docId), {
          userId: userId,
          amount: 100,
          date: new Date()
        });
      });

      // Test: User can read their own transaction
      const transDoc = doc(db, 'transactions', docId);
      await assertSucceeds(getDoc(transDoc));
    });

    it('allows users to create their own transactions', async function() {
      const userId = 'testuser123';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Test: User can create a transaction with their userId
      const newTransDoc = doc(db, 'transactions', 'newtrans');
      await assertSucceeds(setDoc(newTransDoc, {
        userId: userId,
        amount: 200,
        date: new Date()
      }));
    });

    it('denies users from creating transactions for other users', async function() {
      const userId = 'testuser123';
      const otherUserId = 'otheruser456';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Test: User cannot create transaction with different userId
      const newTransDoc = doc(db, 'transactions', 'badtrans');
      await assertFails(setDoc(newTransDoc, {
        userId: otherUserId,
        amount: 200,
        date: new Date()
      }));
    });
  });

  describe('Business Listings Rules', function() {
    it('allows authenticated users to read business listings', async function() {
      const userId = 'testuser123';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Create test business listing
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'businessListings', 'biz123'), {
          name: 'Test Business',
          ownerId: 'owner123'
        });
      });

      // Test: Authenticated users can read business listings
      const bizDoc = doc(db, 'businessListings', 'biz123');
      await assertSucceeds(getDoc(bizDoc));
    });

    it('denies unauthenticated users from reading business listings', async function() {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create test business listing
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'businessListings', 'biz123'), {
          name: 'Test Business',
          ownerId: 'owner123'
        });
      });
      
      // Test: Unauthenticated users cannot read business listings
      const bizDoc = doc(db, 'businessListings', 'biz123');
      await assertFails(getDoc(bizDoc));
    });

    it('allows users to create business listings with their own ownerId', async function() {
      const ownerId = 'owner123';
      const db = testEnv.authenticatedContext(ownerId).firestore();
      
      // Test: User can create listing with matching ownerId
      const bizDoc = doc(db, 'businessListings', 'newbiz');
      await assertSucceeds(setDoc(bizDoc, {
        name: 'New Business',
        ownerId: ownerId,
        description: 'A new business listing'
      }));
    });

    it('denies users from creating business listings with different ownerId', async function() {
      const userId = 'user123';
      const differentOwnerId = 'differentowner456';
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Test: User cannot create listing with different ownerId
      const bizDoc = doc(db, 'businessListings', 'badbiz');
      await assertFails(setDoc(bizDoc, {
        name: 'Bad Business',
        ownerId: differentOwnerId
      }));
    });

    it('allows only owners to update their business listings', async function() {
      const ownerId = 'owner123';
      const db = testEnv.authenticatedContext(ownerId).firestore();
      
      // Create test business listing
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'businessListings', 'biz123'), {
          name: 'Test Business',
          ownerId: ownerId
        });
      });

      // Test: Owner can update their listing
      const bizDoc = doc(db, 'businessListings', 'biz123');
      await assertSucceeds(updateDoc(bizDoc, { name: 'Updated Business' }));
    });

    it('denies non-owners from updating business listings', async function() {
      const ownerId = 'owner123';
      const otherUserId = 'otheruser456';
      const db = testEnv.authenticatedContext(otherUserId).firestore();
      
      // Create test business listing
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'businessListings', 'biz123'), {
          name: 'Test Business',
          ownerId: ownerId
        });
      });

      // Test: Non-owner cannot update listing
      const bizDoc = doc(db, 'businessListings', 'biz123');
      await assertFails(updateDoc(bizDoc, { name: 'Hacked Business' }));
    });
  });
});