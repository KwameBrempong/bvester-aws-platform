// Currency utilities for BizInvest Hub
// Mock exchange rates - TODO: Integrate with real forex API

// Supported African currencies plus USD
export const SUPPORTED_CURRENCIES = {
  USD: { 
    symbol: '$', 
    name: 'US Dollar', 
    flag: '🇺🇸',
    region: 'International',
    type: 'international'
  },
  EUR: { 
    symbol: '€', 
    name: 'Euro', 
    flag: '🇪🇺',
    region: 'Europe',
    type: 'international'
  },
  GBP: { 
    symbol: '£', 
    name: 'British Pound', 
    flag: '🇬🇧',
    region: 'United Kingdom',
    type: 'international'
  },
  NGN: { 
    symbol: '₦', 
    name: 'Nigerian Naira', 
    flag: '🇳🇬',
    region: 'Nigeria',
    type: 'african'
  },
  ZAR: { 
    symbol: 'R', 
    name: 'South African Rand', 
    flag: '🇿🇦',
    region: 'South Africa',
    type: 'african'
  },
  KES: { 
    symbol: 'KSh', 
    name: 'Kenyan Shilling', 
    flag: '🇰🇪',
    region: 'Kenya',
    type: 'african'
  },
  GHS: { 
    symbol: '₵', 
    name: 'Ghanaian Cedi', 
    flag: '🇬🇭',
    region: 'Ghana',
    type: 'african'
  },
  UGX: { 
    symbol: 'USh', 
    name: 'Ugandan Shilling', 
    flag: '🇺🇬',
    region: 'Uganda',
    type: 'african'
  },
  EGP: { 
    symbol: 'E£', 
    name: 'Egyptian Pound', 
    flag: '🇪🇬',
    region: 'Egypt',
    type: 'african'
  },
  MAD: { 
    symbol: 'د.م.', 
    name: 'Moroccan Dirham', 
    flag: '🇲🇦',
    region: 'Morocco',
    type: 'african'
  },
  TZS: { 
    symbol: 'TSh', 
    name: 'Tanzanian Shilling', 
    flag: '🇹🇿',
    region: 'Tanzania',
    type: 'african'
  }
};

// Mock exchange rates (base: USD)
// TODO: Replace with real-time data from Alpha Vantage, Fixer.io, or Central Bank APIs
export const MOCK_EXCHANGE_RATES = {
  USD: 1.0,
  NGN: 1500.0,    // Nigerian Naira (updated as per requirements)
  ZAR: 18.0,      // South African Rand
  KES: 140.0,     // Kenyan Shilling  
  GHS: 12.0,      // Ghanaian Cedi
  UGX: 3720.0,    // Ugandan Shilling
  EGP: 31.0,      // Egyptian Pound
  MAD: 10.0,      // Moroccan Dirham
  TZS: 2300.0,    // Tanzanian Shilling
  EUR: 0.85,      // Euro
  GBP: 0.73       // British Pound
};

// Historical volatility data for hedging alerts
export const CURRENCY_VOLATILITY = {
  NGN: { daily: 0.025, weekly: 0.08, monthly: 0.15 }, // High volatility
  ZAR: { daily: 0.015, weekly: 0.05, monthly: 0.12 },
  KES: { daily: 0.012, weekly: 0.04, monthly: 0.08 },
  GHS: { daily: 0.018, weekly: 0.06, monthly: 0.10 },
  UGX: { daily: 0.010, weekly: 0.03, monthly: 0.06 },
  EGP: { daily: 0.020, weekly: 0.07, monthly: 0.13 },
  MAD: { daily: 0.008, weekly: 0.02, monthly: 0.05 },
  TZS: { daily: 0.015, weekly: 0.04, monthly: 0.09 }
};

// Currency conversion utilities
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = MOCK_EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = MOCK_EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
  console.log(`Currency conversion: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
  return convertedAmount;
};

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) return `${amount.toFixed(2)}`;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales
    return `${currencyInfo.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
};

// Calculate currency risk score (0-100, higher = more risky)
export const calculateCurrencyRisk = (baseCurrency, exposureCurrencies) => {
  if (baseCurrency === 'USD') return 0; // USD as stable base
  
  let totalRisk = 0;
  exposureCurrencies.forEach(currency => {
    const volatility = CURRENCY_VOLATILITY[currency];
    if (volatility) {
      totalRisk += volatility.monthly * 100;
    }
  });
  
  return Math.min(totalRisk / exposureCurrencies.length, 100);
};

// Generate hedging recommendations
export const getHedgingRecommendations = (baseCurrency, exposureAmount) => {
  const volatility = CURRENCY_VOLATILITY[baseCurrency];
  if (!volatility) return [];
  
  const recommendations = [];
  
  if (volatility.monthly > 0.10) {
    recommendations.push({
      type: 'HIGH_RISK',
      message: `${baseCurrency} shows high volatility (${(volatility.monthly * 100).toFixed(1)}% monthly). Consider USD hedging for amounts > $10,000.`,
      action: 'hedge',
      threshold: 10000
    });
  }
  
  if (exposureAmount > 50000) {
    recommendations.push({
      type: 'LARGE_EXPOSURE', 
      message: `Large ${baseCurrency} exposure detected. Consider diversifying across multiple currencies.`,
      action: 'diversify',
      suggestion: ['USD', 'ZAR'] // Suggest more stable alternatives
    });
  }
  
  return recommendations;
};

// Mock real-time rate updates (simulates API calls)
export const mockRateUpdate = () => {
  const currencies = Object.keys(MOCK_EXCHANGE_RATES);
  const updatedRates = { ...MOCK_EXCHANGE_RATES };
  
  currencies.forEach(currency => {
    if (currency !== 'USD') {
      const volatility = CURRENCY_VOLATILITY[currency]?.daily || 0.01;
      const change = (Math.random() - 0.5) * 2 * volatility;
      updatedRates[currency] *= (1 + change);
    }
  });
  
  console.log('Mock exchange rates updated:', updatedRates);
  return updatedRates;
};

// Regional payment method suggestions
export const getRegionalPaymentMethods = (currency) => {
  const methods = {
    NGN: ['Paystack', 'Flutterwave', 'Bank Transfer', 'USSD'],
    ZAR: ['PayFast', 'Ozow', 'EFT', 'SnapScan'],
    KES: ['M-Pesa', 'Airtel Money', 'Equity Bank', 'KCB Bank'],
    GHS: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
    UGX: ['MTN Mobile Money', 'Airtel Money', 'Stanbic Bank'],
    EGP: ['Fawry', 'Vodafone Cash', 'Orange Money', 'Bank Transfer'],
    MAD: ['CIH Bank', 'Attijariwafa Bank', 'BMCE Bank', 'Credit Card'],
    TZS: ['M-Pesa Tanzania', 'Airtel Money', 'Tigo Pesa', 'CRDB Bank']
  };
  
  return methods[currency] || ['Credit Card', 'Bank Transfer'];
};

// Get grouped currencies for display
export const getGroupedCurrencies = () => {
  const grouped = {
    international: [],
    african: []
  };
  
  Object.entries(SUPPORTED_CURRENCIES).forEach(([code, info]) => {
    grouped[info.type].push({ code, ...info });
  });
  
  return grouped;
};

// Format currency with proper symbol placement and locale
export const formatCurrencyDetailed = (amount, currency = 'USD', options = {}) => {
  const {
    showSymbol = true,
    showCode = false,
    precision = 2,
    locale = 'en-US'
  } = options;
  
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) return `${amount.toFixed(precision)}`;
  
  let formatted;
  
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales or currencies
    const formattedNumber = amount.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    if (showSymbol) {
      formatted = `${currencyInfo.symbol}${formattedNumber}`;
    } else {
      formatted = formattedNumber;
    }
  }
  
  if (showCode) {
    formatted += ` ${currency}`;
  }
  
  return formatted;
};

// Convert and format currency display
export const formatCurrencyWithConversion = (amount, fromCurrency, toCurrency, showBoth = false) => {
  if (fromCurrency === toCurrency) {
    return formatCurrencyDetailed(amount, fromCurrency);
  }
  
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  
  if (showBoth) {
    return {
      original: formatCurrencyDetailed(amount, fromCurrency),
      converted: formatCurrencyDetailed(convertedAmount, toCurrency),
      rate: (convertedAmount / amount).toFixed(4)
    };
  }
  
  return formatCurrencyDetailed(convertedAmount, toCurrency);
};

// Get currency preference based on country
export const getCurrencyByCountry = (country) => {
  const countryToCurrency = {
    'Nigeria': 'NGN',
    'South Africa': 'ZAR',
    'Kenya': 'KES',
    'Ghana': 'GHS',
    'Uganda': 'UGX',
    'Egypt': 'EGP',
    'Morocco': 'MAD',
    'Tanzania': 'TZS',
    'United States': 'USD',
    'United Kingdom': 'GBP'
  };
  
  return countryToCurrency[country] || 'USD';
};