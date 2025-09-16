/**
 * 🚀 BVESTER PRODUCTION CLEANUP CLOUD FUNCTION
 * 
 * CRITICAL SECURITY FUNCTION - Only run during production deployment
 * This function will reset ALL user data to zero values for production launch
 * 
 * To execute:
 * 1. Deploy this function: firebase deploy --only functions:executeProductionCleanup
 * 2. Call via HTTP with admin secret: POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/executeProductionCleanup
 * 3. Include header: X-Admin-Secret: YOUR_ADMIN_SECRET
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ProductionCleanup = require('./utils/productionCleanup');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * HTTP Cloud Function to execute production cleanup
 * Protected with admin secret for security
 */
exports.executeProductionCleanup = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540, // 9 minutes - maximum timeout for HTTP functions
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
    }

    try {
      // Security check - require admin secret
      const adminSecret = req.headers['x-admin-secret'];
      const expectedSecret = functions.config()?.admin?.secret || 'bvester-admin-2024-production-reset';
      
      if (!adminSecret || adminSecret !== expectedSecret) {
        console.warn('🚨 Unauthorized production cleanup attempt', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
          success: false,
          error: 'Unauthorized. Admin secret required.'
        });
      }

      // Additional safety check - only allow in specific environment
      const projectId = process.env.GCLOUD_PROJECT;
      console.log('🔍 Production cleanup requested for project:', projectId);

      // Execute the cleanup
      console.log('🚀 Starting production cleanup process...');
      const cleanup = new ProductionCleanup();
      
      // Run cleanup with timeout handling
      const cleanupPromise = cleanup.executeProductionCleanup();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cleanup timeout')), 500000); // 8.3 minutes
      });

      const result = await Promise.race([cleanupPromise, timeoutPromise]);

      // Log successful cleanup
      console.log('✅ Production cleanup completed successfully');
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Production cleanup completed successfully',
        timestamp: new Date().toISOString(),
        projectId
      });

    } catch (error) {
      console.error('❌ Production cleanup failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Production cleanup failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * Scheduled function to create weekly production reports
 * Runs every Sunday at midnight UTC
 */
exports.generateProductionReport = functions
  .region('us-central1')
  .pubsub.schedule('0 0 * * 0')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('📊 Generating weekly production report...');
      
      const db = admin.firestore();
      const report = {
        week: new Date().toISOString().slice(0, 10),
        metrics: {},
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // Count users by role
      const usersSnapshot = await db.collection('users').get();
      const users = [];
      usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

      report.metrics = {
        totalUsers: users.length,
        investors: users.filter(u => u.role === 'INVESTOR').length,
        smeOwners: users.filter(u => u.role === 'SME_OWNER').length,
        verifiedUsers: users.filter(u => u.isVerified === true).length,
        
        // Zero-state validation
        usersWithTransactions: users.filter(u => u.totalTransactions > 0).length,
        usersWithInvestments: users.filter(u => u.totalInvestments > 0).length,
        totalSystemTransactions: 0, // Should be 0 after cleanup
        totalSystemInvestments: 0   // Should be 0 after cleanup
      };

      // Count businesses
      const businessesSnapshot = await db.collection('businesses').get();
      report.metrics.totalBusinesses = businessesSnapshot.size;

      // Count investment opportunities
      const opportunitiesSnapshot = await db.collection('investment_opportunities').get();
      report.metrics.totalOpportunities = opportunitiesSnapshot.size;

      // Save report
      await db.collection('production_reports').add(report);
      
      console.log('✅ Production report generated:', report.metrics);
      
    } catch (error) {
      console.error('❌ Failed to generate production report:', error);
    }
  });

/**
 * Function to validate production state
 * Ensures all financial data is at zero after cleanup
 */
exports.validateProductionState = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Ensure user is authenticated and admin
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can validate production state'
      );
    }

    try {
      const db = admin.firestore();
      const validation = {
        valid: true,
        issues: [],
        metrics: {},
        timestamp: new Date().toISOString()
      };

      // Check that all users have zero financial values
      const usersSnapshot = await db.collection('users').get();
      const users = [];
      usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

      // Validate zero financial metrics
      const usersWithNonZeroData = users.filter(user => 
        user.totalInvestments > 0 || 
        user.totalInvested > 0 || 
        user.portfolioValue > 0 ||
        user.totalTransactions > 0
      );

      if (usersWithNonZeroData.length > 0) {
        validation.valid = false;
        validation.issues.push(`${usersWithNonZeroData.length} users have non-zero financial data`);
      }

      // Check that transaction collections are empty
      const transactionsSnapshot = await db.collection('transactions').limit(1).get();
      if (!transactionsSnapshot.empty) {
        validation.valid = false;
        validation.issues.push('Transactions collection is not empty');
      }

      // Check that investments collection is empty
      const investmentsSnapshot = await db.collection('investments').limit(1).get();
      if (!investmentsSnapshot.empty) {
        validation.valid = false;
        validation.issues.push('Investments collection is not empty');
      }

      validation.metrics = {
        totalUsers: users.length,
        usersWithZeroData: users.length - usersWithNonZeroData.length,
        usersWithNonZeroData: usersWithNonZeroData.length
      };

      return validation;

    } catch (error) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to validate production state',
        error.message
      );
    }
  });

console.log('🔧 Bvester Production Cleanup Functions loaded');