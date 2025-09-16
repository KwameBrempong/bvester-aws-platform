/**
 * 💳 BVESTER PAYMENT CONFIGURATION
 * Production-ready payment processor setup for Stripe and Flutterwave
 */

// Environment validation
const requiredPaymentEnvVars = [
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY'
];

const missingPaymentEnvVars = requiredPaymentEnvVars.filter(envVar => !process.env[envVar]);

if (missingPaymentEnvVars.length > 0 && process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
  console.error('❌ Missing required payment environment variables:', missingPaymentEnvVars);
  console.error('💳 Please set up your payment processors:');
  console.error('🔵 Stripe: https://dashboard.stripe.com/apikeys');
  console.error('🟢 Flutterwave: https://dashboard.flutterwave.com/settings/api-keys');
}

export const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    isLive: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_'),
    currency: 'USD',
    supportedCountries: [
      'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'BE', 'CH', 'AT', 
      'IE', 'IT', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'LU'
    ]
  },
  
  flutterwave: {
    publicKey: process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    isLive: process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.startsWith('FLWPUBK-'),
    supportedCountries: [
      'NG', 'GH', 'KE', 'UG', 'TZ', 'ZA', 'RW', 'ZM', 'CM', 'SN',
      'CI', 'BF', 'ML', 'BJ', 'TG', 'NE', 'GN', 'SL', 'LR', 'MR'
    ],
    supportedCurrencies: [
      'NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF', 'ZMW', 
      'XAF', 'XOF', 'USD', 'EUR', 'GBP'
    ]
  },

  // Investment limits and settings
  limits: {
    minInvestment: 100, // $100 minimum
    maxInvestment: 100000, // $100K maximum per transaction
    dailyLimit: 500000, // $500K daily limit per user
    fees: {
      stripe: 0.029, // 2.9% + $0.30
      flutterwave: 0.014, // 1.4% for local cards, varies by country
      platform: 0.02 // 2% platform fee
    }
  },

  // Supported payment methods by region
  paymentMethods: {
    global: ['card', 'bank_transfer'],
    africa: ['card', 'bank_transfer', 'mobile_money', 'ussd'],
    diaspora: ['card', 'bank_transfer', 'apple_pay', 'google_pay']
  }
};

export const getPaymentProcessor = (country, currency = 'USD') => {
  // Use Flutterwave for African countries
  if (PAYMENT_CONFIG.flutterwave.supportedCountries.includes(country)) {
    return 'flutterwave';
  }
  
  // Use Stripe for other countries
  if (PAYMENT_CONFIG.stripe.supportedCountries.includes(country)) {
    return 'stripe';
  }
  
  // Default to Stripe for unsupported countries (with limitations)
  return 'stripe';
};

export const getPaymentMethods = (country) => {
  if (PAYMENT_CONFIG.flutterwave.supportedCountries.includes(country)) {
    return PAYMENT_CONFIG.paymentMethods.africa;
  }
  
  return PAYMENT_CONFIG.paymentMethods.diaspora;
};

export const calculateFees = (amount, processor = 'stripe') => {
  const platformFee = amount * PAYMENT_CONFIG.limits.fees.platform;
  const processorFee = amount * PAYMENT_CONFIG.limits.fees[processor];
  const stripeFlatFee = processor === 'stripe' ? 0.30 : 0;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    processorFee: Math.round((processorFee + stripeFlatFee) * 100) / 100,
    totalFees: Math.round((platformFee + processorFee + stripeFlatFee) * 100) / 100,
    netAmount: Math.round((amount - platformFee - processorFee - stripeFlatFee) * 100) / 100
  };
};

export const validatePaymentAmount = (amount, currency = 'USD') => {
  if (amount < PAYMENT_CONFIG.limits.minInvestment) {
    throw new Error(`Minimum investment amount is $${PAYMENT_CONFIG.limits.minInvestment}`);
  }
  
  if (amount > PAYMENT_CONFIG.limits.maxInvestment) {
    throw new Error(`Maximum investment amount is $${PAYMENT_CONFIG.limits.maxInvestment}`);
  }
  
  return true;
};

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Investment types
export const INVESTMENT_TYPES = {
  EQUITY: 'equity',
  LOAN: 'loan',
  REVENUE_SHARE: 'revenue_share',
  CONVERTIBLE: 'convertible'
};

export default PAYMENT_CONFIG;