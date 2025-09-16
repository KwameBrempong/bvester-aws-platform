const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com"],
      connectSrc: ["'self'", "https://bizinvest-hub-prod.firebaseapp.com", "https://identitytoolkit.googleapis.com", "https://firestore.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: [
    'https://bizinvest-hub-prod.web.app',
    'https://bizinvest-hub-prod.firebaseapp.com',
    'https://bvester.com',
    'https://www.bvester.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bvester Firebase API',
    version: '1.0.0',
    environment: 'production'
  });
});

// Import and use route modules
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const kycRoutes = require('./routes/kycRoutes');
const currencyRoutes = require('./routes/currencyRoutes');

app.use('/auth', authRoutes);
app.use('/investments', investmentRoutes);
app.use('/payments', paymentRoutes);
app.use('/kyc', kycRoutes);
app.use('/currency', currencyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Firebase API Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Export the Express app as a Firebase Function
exports.api = functions.region('us-central1').https.onRequest(app);

// Additional Firebase Functions for specific tasks
exports.processPaymentWebhook = functions.https.onRequest(require('./webhooks/paymentWebhooks'));

// Firestore triggers for real-time features
exports.onInvestmentCreated = functions.firestore
  .document('investments/{investmentId}')
  .onCreate(async (snap, context) => {
    const investment = snap.data();
    console.log('New investment created:', context.params.investmentId);
    
    // Send notification to SME owner
    // Update portfolio calculations
    // Trigger matching algorithms
    
    return null;
  });

exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    const userId = context.params.userId;
    console.log('New user created:', userId);
    
    try {
      // Set up default currency preferences based on country
      const defaultCurrency = getCurrencyForCountry(user.country);
      const currencyPreferences = {
        currency: defaultCurrency,
        businessCurrency: defaultCurrency,
        preferredViewCurrency: defaultCurrency,
        language: 'en',
        timezone: getTimezoneForCountry(user.country),
        notifications: {
          email: true,
          push: true,
          sms: false,
          investmentUpdates: true,
          transactionAlerts: true
        }
      };

      // Initialize user preferences with currency settings
      await db.collection('userPreferences').doc(userId).set({
        ...currencyPreferences,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update user profile with currency fields if not already set
      const userUpdates = {};
      if (!user.businessCurrency) userUpdates.businessCurrency = defaultCurrency;
      if (!user.preferredViewCurrency) userUpdates.preferredViewCurrency = defaultCurrency;
      
      if (Object.keys(userUpdates).length > 0) {
        await snap.ref.update({
          ...userUpdates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Send welcome email
      // Initialize user analytics
      
      console.log('User setup completed with currency preferences:', {
        userId,
        currency: defaultCurrency,
        country: user.country
      });
      
    } catch (error) {
      console.error('Error setting up new user:', error);
    }
    
    return null;
  });

// Scheduled functions for maintenance
exports.dailyPortfolioUpdate = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running daily portfolio updates...');
    
    // Update all portfolio values
    // Calculate returns
    // Send performance summaries
    
    return null;
  });

exports.weeklyComplianceCheck = functions.pubsub
  .schedule('0 0 * * 0') // Weekly on Sundays
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running weekly compliance checks...');
    
    // Check KYC status
    // Verify transaction limits
    // Generate compliance reports
    
    return null;
  });

// Import production cleanup functions
const {
  executeProductionCleanup,
  generateProductionReport,
  validateProductionState
} = require('./productionCleanupFunction');

// Export production cleanup functions
exports.executeProductionCleanup = executeProductionCleanup;
exports.generateProductionReport = generateProductionReport;
exports.validateProductionState = validateProductionState;

// ============================================================================
// CURRENCY AND LOCALE HELPER FUNCTIONS
// ============================================================================

/**
 * Get default currency for country
 */
function getCurrencyForCountry(country = 'US') {
  const currencyMap = {
    'NG': 'NGN',  // Nigeria
    'GH': 'GHS',  // Ghana
    'KE': 'KES',  // Kenya
    'ZA': 'ZAR',  // South Africa
    'EG': 'EGP',  // Egypt
    'MA': 'MAD',  // Morocco
    'TN': 'TND',  // Tunisia
    'DZ': 'DZD',  // Algeria
    'UG': 'UGX',  // Uganda
    'TZ': 'TZS',  // Tanzania
    'RW': 'RWF',  // Rwanda
    'ZM': 'ZMW',  // Zambia
    'MW': 'MWK',  // Malawi
    'BW': 'BWP',  // Botswana
    'SZ': 'SZL',  // Eswatini
    'LS': 'LSL',  // Lesotho
    'NA': 'NAD',  // Namibia
    'US': 'USD',  // United States
    'GB': 'GBP',  // United Kingdom
    'AU': 'AUD',  // Australia
    'CA': 'CAD',  // Canada
    'CH': 'CHF',  // Switzerland
    'JP': 'JPY',  // Japan
    'CN': 'CNY'   // China
  };
  
  return currencyMap[country] || 'USD';
}

/**
 * Get default timezone for country
 */
function getTimezoneForCountry(country = 'US') {
  const timezoneMap = {
    'NG': 'Africa/Lagos',
    'GH': 'Africa/Accra',
    'KE': 'Africa/Nairobi',
    'ZA': 'Africa/Johannesburg',
    'EG': 'Africa/Cairo',
    'MA': 'Africa/Casablanca',
    'TN': 'Africa/Tunis',
    'DZ': 'Africa/Algiers',
    'UG': 'Africa/Kampala',
    'TZ': 'Africa/Dar_es_Salaam',
    'RW': 'Africa/Kigali',
    'ZM': 'Africa/Lusaka',
    'MW': 'Africa/Blantyre',
    'BW': 'Africa/Gaborone',
    'SZ': 'Africa/Mbabane',
    'LS': 'Africa/Maseru',
    'NA': 'Africa/Windhoek',
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'AU': 'Australia/Sydney',
    'CA': 'America/Toronto',
    'CH': 'Europe/Zurich',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai'
  };
  
  return timezoneMap[country] || 'UTC';
}

// Currency conversion Cloud Function
exports.convertCurrency = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, fromCurrency, toCurrency } = data;

  // Validate input
  if (!amount || !fromCurrency || !toCurrency) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount, fromCurrency, and toCurrency are required');
  }

  if (amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive');
  }

  try {
    // Get exchange rate (this would typically call an external API)
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;

    // Log the conversion
    await db.collection('currencyConversions').add({
      userId: context.auth.uid,
      amount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      convertedAmount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      amount: Math.round(convertedAmount * 100) / 100,
      rate: exchangeRate,
      fromCurrency,
      toCurrency,
      convertedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to convert currency');
  }
});

/**
 * Get exchange rate between currencies
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1.0;

  // Check cache first
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cachedRate = await db.collection('exchangeRates').doc(cacheKey).get();
  
  if (cachedRate.exists) {
    const data = cachedRate.data();
    const isRecent = (Date.now() - data.updatedAt.toDate().getTime()) < (60 * 60 * 1000); // 1 hour
    if (isRecent) {
      return data.rate;
    }
  }

  // Fallback to static rates (in production, use real API)
  const staticRates = await getStaticExchangeRate(fromCurrency, toCurrency);
  
  // Cache the rate
  await db.collection('exchangeRates').doc(cacheKey).set({
    rate: staticRates,
    fromCurrency,
    toCurrency,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'static'
  });

  return staticRates;
}

/**
 * Static exchange rates (fallback)
 */
function getStaticExchangeRate(fromCurrency, toCurrency) {
  const usdRates = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'NGN': 1640.0,
    'GHS': 16.8,
    'KES': 154.0,
    'ZAR': 18.5,
    'EGP': 49.0,
    'MAD': 10.1,
    'TND': 3.1,
    'DZD': 135.0,
    'XAF': 600.0,
    'XOF': 600.0,
    'UGX': 3750.0,
    'TZS': 2520.0,
    'RWF': 1360.0,
    'ZMW': 27.0,
    'MWK': 1730.0,
    'BWP': 13.8,
    'SZL': 18.5,
    'LSL': 18.5,
    'NAD': 18.5,
    'AUD': 1.55,
    'CAD': 1.41,
    'CHF': 0.88,
    'JPY': 150.0,
    'CNY': 7.3
  };

  const fromRate = usdRates[fromCurrency];
  const toRate = usdRates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`Unsupported currency pair: ${fromCurrency} to ${toCurrency}`);
    return 1.0;
  }

  return toRate / fromRate;
}

// ============================================================================
// DATA MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate existing users to include currency fields
 * This should be run once to update existing users
 */
exports.migrateCurrencyData = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  console.log('Starting currency data migration...');
  
  try {
    const batch = db.batch();
    let updateCount = 0;

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const updates = {};
      
      // Set default currency fields if missing
      if (!user.businessCurrency) {
        updates.businessCurrency = getCurrencyForCountry(user.country || 'US');
      }
      
      if (!user.preferredViewCurrency) {
        updates.preferredViewCurrency = user.currency || getCurrencyForCountry(user.country || 'US');
      }
      
      if (!user.currency) {
        updates.currency = getCurrencyForCountry(user.country || 'US');
      }
      
      if (Object.keys(updates).length > 0) {
        updates.migratedAt = admin.firestore.FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });

    // Get all transactions and add currency fields
    const transactionsSnapshot = await db.collection('transactions').get();
    
    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      const updates = {};
      
      if (!transaction.currency) {
        updates.currency = 'USD';
        updates.originalCurrency = 'USD';
        updates.usdEquivalent = transaction.amount || 0;
        updates.exchangeRate = 1.0;
        updates.migratedAt = admin.firestore.FieldValue.serverTimestamp();
        
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });

    // Get all businesses and add currency fields  
    const businessesSnapshot = await db.collection('businesses').get();
    
    businessesSnapshot.forEach((doc) => {
      const business = doc.data();
      const updates = {};
      
      if (!business.currency) {
        updates.currency = 'USD';
        updates.operatingCurrency = 'USD';
        updates.acceptedCurrencies = ['USD'];
        updates.migratedAt = admin.firestore.FieldValue.serverTimestamp();
        
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });

    // Execute batch update
    await batch.commit();
    
    console.log(`Currency migration completed. Updated ${updateCount} documents.`);
    
    return {
      success: true,
      message: `Migration completed. Updated ${updateCount} documents.`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Currency migration error:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed');
  }
});

/**
 * Update exchange rates (can be called manually or scheduled)
 */
exports.updateExchangeRates = functions.https.onCall(async (data, context) => {
  // Verify admin access  
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  console.log('Updating exchange rates...');
  
  try {
    const baseCurrency = 'USD';
    const targetCurrencies = [
      'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD',
      'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 'BWP', 'SZL', 'LSL',
      'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
    ];
    
    const batch = db.batch();
    let updateCount = 0;
    
    for (const targetCurrency of targetCurrencies) {
      const rate = getStaticExchangeRate(baseCurrency, targetCurrency);
      
      const rateDoc = db.collection('exchangeRates').doc(`${baseCurrency}_${targetCurrency}`);
      batch.set(rateDoc, {
        rate,
        fromCurrency: baseCurrency,
        toCurrency: targetCurrency,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'manual_update'
      });
      
      // Also create inverse rate
      const inverseRateDoc = db.collection('exchangeRates').doc(`${targetCurrency}_${baseCurrency}`);
      batch.set(inverseRateDoc, {
        rate: 1 / rate,
        fromCurrency: targetCurrency,
        toCurrency: baseCurrency,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'calculated'
      });
      
      updateCount += 2;
    }
    
    await batch.commit();
    
    console.log(`Exchange rates updated. Updated ${updateCount} rates.`);
    
    return {
      success: true,
      message: `Updated ${updateCount} exchange rates`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Exchange rate update error:', error);
    throw new functions.https.HttpsError('internal', 'Exchange rate update failed');
  }
});

console.log('Bvester Firebase Functions initialized successfully');