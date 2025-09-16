// Firebase Functions - Currency Routes
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * 🏦 GET USER CURRENCY SETTINGS
 * Retrieve user's currency preferences
 */
router.get('/user-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userDoc.data();

    // Get user preferences  
    const preferencesDoc = await db.collection('userPreferences').doc(userId).get();
    const preferences = preferencesDoc.exists ? preferencesDoc.data() : {};

    const currencySettings = {
      businessCurrency: user.businessCurrency || preferences.businessCurrency || 'USD',
      preferredViewCurrency: user.preferredViewCurrency || preferences.preferredViewCurrency || 'USD',
      currency: user.currency || preferences.currency || 'USD',
      country: user.country || 'US',
      supportedCurrencies: getSupportedCurrenciesForCountry(user.country || 'US')
    };

    res.json({
      success: true,
      currencySettings
    });

  } catch (error) {
    console.error('Get user currency settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve currency settings'
    });
  }
});

/**
 * 🔄 UPDATE USER CURRENCY SETTINGS
 * Update user's currency preferences
 */
router.put('/user-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { businessCurrency, preferredViewCurrency } = req.body;

    if (!businessCurrency && !preferredViewCurrency) {
      return res.status(400).json({
        success: false,
        error: 'At least one currency field is required'
      });
    }

    // Validate currency codes
    if (businessCurrency && !isValidCurrency(businessCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business currency code'
      });
    }

    if (preferredViewCurrency && !isValidCurrency(preferredViewCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid view currency code'
      });
    }

    const updates = {};
    if (businessCurrency) {
      updates.businessCurrency = businessCurrency;
      updates.currency = businessCurrency; // Keep legacy field in sync
    }
    if (preferredViewCurrency) {
      updates.preferredViewCurrency = preferredViewCurrency;
    }

    // Update user profile
    await db.collection('users').doc(userId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update preferences
    await db.collection('userPreferences').doc(userId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the change
    await db.collection('userActivity').add({
      userId,
      action: 'currency_settings_updated',
      details: { businessCurrency, preferredViewCurrency },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Currency settings updated successfully',
      currencySettings: {
        businessCurrency: businessCurrency || null,
        preferredViewCurrency: preferredViewCurrency || null
      }
    });

  } catch (error) {
    console.error('Update currency settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update currency settings'
    });
  }
});

/**
 * 💱 CONVERT CURRENCY
 * Convert amount between currencies
 */
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Amount, fromCurrency, and toCurrency are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    if (!isValidCurrency(fromCurrency) || !isValidCurrency(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency codes'
      });
    }

    // Get exchange rate
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;

    // Log the conversion
    await db.collection('currencyConversions').add({
      userId: req.user.uid,
      amount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      conversion: {
        originalAmount: amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        fromCurrency,
        toCurrency,
        exchangeRate,
        convertedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert currency'
    });
  }
});

/**
 * 📊 GET EXCHANGE RATES
 * Get current exchange rates for supported currencies
 */
router.get('/rates', authenticateToken, async (req, res) => {
  try {
    const { baseCurrency = 'USD', currencies } = req.query;

    if (!isValidCurrency(baseCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base currency'
      });
    }

    let targetCurrencies = currencies ? currencies.split(',') : [
      'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD',
      'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 'BWP', 'SZL', 'LSL',
      'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
    ];

    // Filter out invalid currencies
    targetCurrencies = targetCurrencies.filter(currency => isValidCurrency(currency));

    const rates = {};
    const promises = targetCurrencies.map(async (currency) => {
      try {
        const rate = await getExchangeRate(baseCurrency, currency);
        rates[currency] = rate;
      } catch (error) {
        console.error(`Error getting rate for ${currency}:`, error);
        rates[currency] = null;
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      baseCurrency,
      rates,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve exchange rates'
    });
  }
});

/**
 * 🌍 GET SUPPORTED CURRENCIES
 * Get list of supported currencies
 */
router.get('/supported', authenticateToken, async (req, res) => {
  try {
    const { country, region } = req.query;

    let currencies;
    if (country) {
      currencies = getSupportedCurrenciesForCountry(country);
    } else if (region) {
      currencies = getSupportedCurrenciesForRegion(region);
    } else {
      currencies = getAllSupportedCurrencies();
    }

    const currencyData = currencies.map(currency => ({
      code: currency,
      name: getCurrencyName(currency),
      symbol: getCurrencySymbol(currency)
    }));

    res.json({
      success: true,
      currencies: currencyData
    });

  } catch (error) {
    console.error('Get supported currencies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supported currencies'
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

  // Fallback to static rates
  const staticRate = getStaticExchangeRate(fromCurrency, toCurrency);
  
  // Cache the rate
  try {
    await db.collection('exchangeRates').doc(cacheKey).set({
      rate: staticRate,
      fromCurrency,
      toCurrency,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'static'
    });
  } catch (error) {
    console.error('Error caching exchange rate:', error);
  }

  return staticRate;
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

/**
 * Validate currency code
 */
function isValidCurrency(currencyCode) {
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD',
    'TND', 'DZD', 'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK',
    'BWP', 'SZL', 'LSL', 'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
  ];
  return validCurrencies.includes(currencyCode?.toUpperCase());
}

/**
 * Get supported currencies for country
 */
function getSupportedCurrenciesForCountry(country) {
  const currencyMap = {
    'NG': ['NGN', 'USD'],
    'GH': ['GHS', 'USD'],
    'KE': ['KES', 'USD'],
    'ZA': ['ZAR', 'USD'],
    'EG': ['EGP', 'USD'],
    'MA': ['MAD', 'USD'],
    'TN': ['TND', 'USD'],
    'DZ': ['DZD', 'USD'],
    'UG': ['UGX', 'USD'],
    'TZ': ['TZS', 'USD'],
    'RW': ['RWF', 'USD'],
    'ZM': ['ZMW', 'USD'],
    'MW': ['MWK', 'USD'],
    'BW': ['BWP', 'USD'],
    'SZ': ['SZL', 'USD'],
    'LS': ['LSL', 'USD'],
    'NA': ['NAD', 'USD'],
    'US': ['USD'],
    'GB': ['GBP', 'USD', 'EUR'],
    'AU': ['AUD', 'USD'],
    'CA': ['CAD', 'USD'],
    'default': ['USD', 'EUR', 'GBP']
  };

  return currencyMap[country] || currencyMap['default'];
}

/**
 * Get supported currencies for region
 */
function getSupportedCurrenciesForRegion(region) {
  const regionMap = {
    'africa': [
      'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD', 
      'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 
      'BWP', 'SZL', 'LSL', 'NAD'
    ],
    'international': ['USD', 'EUR', 'GBP'],
    'developed': ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY'],
    'all': getAllSupportedCurrencies()
  };

  return regionMap[region] || regionMap['all'];
}

/**
 * Get all supported currencies
 */
function getAllSupportedCurrencies() {
  return [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD',
    'TND', 'DZD', 'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK',
    'BWP', 'SZL', 'LSL', 'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
  ];
}

/**
 * Get currency name
 */
function getCurrencyName(currencyCode) {
  const names = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'NGN': 'Nigerian Naira',
    'GHS': 'Ghanaian Cedi',
    'KES': 'Kenyan Shilling',
    'ZAR': 'South African Rand',
    'EGP': 'Egyptian Pound',
    'MAD': 'Moroccan Dirham',
    'TND': 'Tunisian Dinar',
    'DZD': 'Algerian Dinar',
    'XAF': 'Central African Franc',
    'XOF': 'West African Franc',
    'UGX': 'Ugandan Shilling',
    'TZS': 'Tanzanian Shilling',
    'RWF': 'Rwandan Franc',
    'ZMW': 'Zambian Kwacha',
    'MWK': 'Malawian Kwacha',
    'BWP': 'Botswanan Pula',
    'SZL': 'Swazi Lilangeni',
    'LSL': 'Lesotho Loti',
    'NAD': 'Namibian Dollar',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'JPY': 'Japanese Yen',
    'CNY': 'Chinese Yuan'
  };

  return names[currencyCode] || currencyCode;
}

/**
 * Get currency symbol
 */
function getCurrencySymbol(currencyCode) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'GHS': '₵',
    'KES': 'KSh',
    'ZAR': 'R',
    'EGP': 'E£',
    'MAD': 'د.م.',
    'TND': 'د.ت',
    'DZD': 'د.ج',
    'XAF': 'FCFA',
    'XOF': 'CFA',
    'UGX': 'USh',
    'TZS': 'TSh',
    'RWF': 'RF',
    'ZMW': 'ZK',
    'MWK': 'MK',
    'BWP': 'P',
    'SZL': 'L',
    'LSL': 'L',
    'NAD': 'N$',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'Fr',
    'JPY': '¥',
    'CNY': '¥'
  };
  
  return symbols[currencyCode] || currencyCode;
}

module.exports = router;