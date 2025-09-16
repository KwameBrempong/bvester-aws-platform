/**
 * BVESTER PLATFORM - FIREBASE ADMIN CONFIGURATION
 * Server-side Firebase Admin SDK setup
 * Generated: January 28, 2025
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let adminApp;

try {
  // Production configuration (using environment variables)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    const serviceAccount = {
      type: process.env.FIREBASE_ADMIN_TYPE,
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    };

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}-default-rtdb.firebaseio.com`,
      storageBucket: `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`
    });
    
    console.log('✅ Firebase Admin initialized with service account');
    
  } else if (process.env.NODE_ENV === 'development') {
    // Development configuration (using service account file)
    const serviceAccountPath = path.join(__dirname, '../config/service-account-key.json');
    
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        projectId: process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod',
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod'}-default-rtdb.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod'}.appspot.com`
      });
      
      console.log('✅ Firebase Admin initialized with service account file');
    } catch (fileError) {
      console.log('⚠️ Service account file not found, using default credentials');
      
      // Fallback to default credentials (for local development)
      adminApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod'
      });
    }
  } else {
    // Fallback for other environments
    adminApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod'
    });
    
    console.log('✅ Firebase Admin initialized with default credentials');
  }
  
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  
  // Initialize with minimal configuration for basic functionality
  try {
    adminApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'bizinvest-hub-prod'
    });
    console.log('⚠️ Firebase Admin initialized with minimal configuration');
  } catch (fallbackError) {
    console.error('💥 Firebase Admin complete initialization failure:', fallbackError.message);
    process.exit(1);
  }
}

// Get Firebase Admin services
const adminAuth = admin.auth();
const adminFirestore = admin.firestore();
const adminStorage = admin.storage();
const adminMessaging = admin.messaging();

// Admin-only operations
class FirebaseAdmin {
  
  // ============================================================================
  // USER MANAGEMENT (Admin Operations)
  // ============================================================================
  
  /**
   * Create custom token for user authentication
   */
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await adminAuth.createCustomToken(uid, additionalClaims);
      return { success: true, token: customToken };
    } catch (error) {
      console.error('Error creating custom token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Verify ID token from client
   */
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return { success: true, token: decodedToken };
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user by UID (Admin operation)
   */
  async getUserByUid(uid) {
    try {
      const userRecord = await adminAuth.getUser(uid);
      return { success: true, user: userRecord };
    } catch (error) {
      console.error('Error getting user by UID:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user claims (for role-based access)
   */
  async setCustomClaims(uid, claims) {
    try {
      await adminAuth.setCustomUserClaims(uid, claims);
      return { success: true };
    } catch (error) {
      console.error('Error setting custom claims:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete user account (Admin operation)
   */
  async deleteUser(uid) {
    try {
      await adminAuth.deleteUser(uid);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send email verification (Admin)
   */
  async sendEmailVerification(email) {
    try {
      const link = await adminAuth.generateEmailVerificationLink(email);
      return { success: true, link };
    } catch (error) {
      console.error('Error generating email verification link:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // FIRESTORE ADMIN OPERATIONS
  // ============================================================================
  
  /**
   * Get document with admin privileges
   */
  async getDocument(collection, documentId) {
    try {
      const doc = await adminFirestore.collection(collection).doc(documentId).get();
      if (doc.exists) {
        return { success: true, data: doc.data() };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      console.error('Error getting document:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Set document with admin privileges
   */
  async setDocument(collection, documentId, data) {
    try {
      await adminFirestore.collection(collection).doc(documentId).set(data);
      return { success: true };
    } catch (error) {
      console.error('Error setting document:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Batch write operations
   */
  async batchWrite(operations) {
    try {
      const batch = adminFirestore.batch();
      
      operations.forEach(operation => {
        const { type, collection, documentId, data } = operation;
        const docRef = adminFirestore.collection(collection).doc(documentId);
        
        switch (type) {
          case 'set':
            batch.set(docRef, data);
            break;
          case 'update':
            batch.update(docRef, data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error in batch write:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // CLOUD MESSAGING
  // ============================================================================
  
  /**
   * Send push notification to user
   */
  async sendNotification(userId, notification) {
    try {
      // Get user's FCM tokens from Firestore
      const tokensDoc = await adminFirestore
        .collection('userTokens')
        .doc(userId)
        .get();
      
      if (!tokensDoc.exists) {
        return { success: false, error: 'No FCM tokens found for user' };
      }
      
      const tokens = tokensDoc.data().tokens || [];
      
      if (tokens.length === 0) {
        return { success: false, error: 'No valid FCM tokens' };
      }
      
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data || {},
        tokens: tokens
      };
      
      const response = await adminMessaging.sendMulticast(message);
      
      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const validTokens = [];
        response.responses.forEach((resp, idx) => {
          if (resp.success) {
            validTokens.push(tokens[idx]);
          }
        });
        
        // Update valid tokens
        await adminFirestore
          .collection('userTokens')
          .doc(userId)
          .update({ tokens: validTokens });
      }
      
      return { 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount 
      };
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send notification to topic
   */
  async sendTopicNotification(topic, notification) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        topic: topic
      };
      
      const response = await adminMessaging.send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // SYSTEM OPERATIONS
  // ============================================================================
  
  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const stats = {
        totalUsers: 0,
        totalBusinesses: 0,
        totalInvestors: 0,
        totalInvestments: 0,
        totalRevenue: 0
      };
      
      // Get user count
      const usersSnapshot = await adminFirestore.collection('users').count().get();
      stats.totalUsers = usersSnapshot.data().count;
      
      // Get business count
      const businessesSnapshot = await adminFirestore
        .collection('businesses')
        .where('status.isActive', '==', true)
        .count()
        .get();
      stats.totalBusinesses = businessesSnapshot.data().count;
      
      // Get investor count
      const investorsSnapshot = await adminFirestore.collection('investors').count().get();
      stats.totalInvestors = investorsSnapshot.data().count;
      
      // Get investment count
      const investmentsSnapshot = await adminFirestore.collection('investments').count().get();
      stats.totalInvestments = investmentsSnapshot.data().count;
      
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Backup critical data
   */
  async backupCriticalData() {
    try {
      const timestamp = new Date().toISOString();
      const backupPath = `backups/${timestamp}`;
      
      // Define critical collections
      const criticalCollections = [
        'users',
        'businesses', 
        'investments',
        'financialRecords'
      ];
      
      const backupPromises = criticalCollections.map(async (collection) => {
        const snapshot = await adminFirestore.collection(collection).get();
        const data = [];
        
        snapshot.forEach(doc => {
          data.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Store backup in Firestore or Cloud Storage
        await adminFirestore
          .collection('systemBackups')
          .doc(`${collection}_${timestamp}`)
          .set({
            collection,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            dataCount: data.length,
            data: data
          });
          
        return { collection, count: data.length };
      });
      
      const results = await Promise.all(backupPromises);
      
      return { success: true, backups: results, timestamp };
    } catch (error) {
      console.error('Error backing up data:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  adminApp,
  adminAuth,
  adminFirestore,
  adminStorage,
  adminMessaging,
  FirebaseAdmin: new FirebaseAdmin()
};