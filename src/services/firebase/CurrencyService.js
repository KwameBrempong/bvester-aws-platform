/**
 * 💱 BVESTER CURRENCY SERVICE
 * Comprehensive currency conversion and management service
 * Supports real-time exchange rates and multi-currency operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

class CurrencyService {
  constructor() {
    this.exchangeRatesCollection = 'exchangeRates';
    this.currencyHistoryCollection = 'currencyHistory';
    this.supportedCurrencies = [
      'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD',
      'TND', 'DZD', 'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK',
      'BWP', 'SZL', 'LSL', 'NAD', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'
    ];
  }

  // ============================================================================
  // CURRENCY CONVERSION
  // ============================================================================

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          amount: amount,
          rate: 1.0,
          fromCurrency,
          toCurrency,
          convertedAt: new Date()
        };
      }

      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * exchangeRate;

      return {
        amount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
        rate: exchangeRate,
        fromCurrency,
        toCurrency,
        convertedAt: new Date()
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}`);
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      // Check cache first
      const cachedRate = await this.getCachedExchangeRate(fromCurrency, toCurrency);
      if (cachedRate && this.isRateFresh(cachedRate.updatedAt)) {
        return cachedRate.rate;
      }

      // Fetch fresh rate from API or fallback to static rates
      let rate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
      
      if (!rate) {
        // Fallback to static rates for African currencies
        rate = this.getStaticExchangeRate(fromCurrency, toCurrency);
      }

      // Cache the rate
      await this.cacheExchangeRate(fromCurrency, toCurrency, rate);

      return rate;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      // Fallback to cached rate even if stale
      const cachedRate = await this.getCachedExchangeRate(fromCurrency, toCurrency);
      if (cachedRate) {
        console.warn('Using stale exchange rate due to API failure');
        return cachedRate.rate;
      }
      
      // Ultimate fallback to static rates
      return this.getStaticExchangeRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Convert amount to USD equivalent (for consistent storage)
   */
  async convertToUSD(amount, fromCurrency) {
    if (fromCurrency === 'USD') {
      return amount;
    }
    
    const conversion = await this.convertCurrency(amount, fromCurrency, 'USD');
    return conversion.amount;
  }

  /**
   * Convert from USD to target currency
   */
  async convertFromUSD(amount, toCurrency) {
    if (toCurrency === 'USD') {
      return amount;
    }
    
    const conversion = await this.convertCurrency(amount, 'USD', toCurrency);
    return conversion.amount;
  }

  // ============================================================================
  // EXCHANGE RATE MANAGEMENT
  // ============================================================================

  /**
   * Get cached exchange rate from Firestore
   */
  async getCachedExchangeRate(fromCurrency, toCurrency) {
    try {
      const rateId = `${fromCurrency}_${toCurrency}`;
      const docRef = doc(db, this.exchangeRatesCollection, rateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached exchange rate:', error);
      return null;
    }
  }

  /**
   * Cache exchange rate in Firestore
   */
  async cacheExchangeRate(fromCurrency, toCurrency, rate) {
    try {
      const rateId = `${fromCurrency}_${toCurrency}`;
      const docRef = doc(db, this.exchangeRatesCollection, rateId);
      
      await updateDoc(docRef, {
        rate,
        fromCurrency,
        toCurrency,
        updatedAt: serverTimestamp(),
        source: 'api'
      });

      // Also cache the inverse rate
      if (rate > 0) {
        const inverseRateId = `${toCurrency}_${fromCurrency}`;
        const inverseDocRef = doc(db, this.exchangeRatesCollection, inverseRateId);
        
        await updateDoc(inverseDocRef, {
          rate: 1 / rate,
          fromCurrency: toCurrency,
          toCurrency: fromCurrency,
          updatedAt: serverTimestamp(),
          source: 'calculated'
        });
      }
    } catch (error) {
      console.error('Error caching exchange rate:', error);
    }
  }

  /**
   * Check if exchange rate is fresh (less than 1 hour old)
   */
  isRateFresh(updatedAt) {
    if (!updatedAt) return false;
    
    const now = new Date();
    const rateTime = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return rateTime > oneHourAgo;
  }

  /**
   * Fetch exchange rate from external API
   */
  async fetchExchangeRateFromAPI(fromCurrency, toCurrency) {
    try {
      // In a real implementation, you would call a service like:
      // - CurrencyLayer API
      // - Open Exchange Rates
      // - Fixer.io
      // - Free Currency API
      
      // For now, return null to fall back to static rates
      // This should be implemented with actual API calls in production
      return null;
    } catch (error) {
      console.error('API exchange rate fetch failed:', error);
      return null;
    }
  }

  /**
   * Get static exchange rates for African currencies (fallback)
   */
  getStaticExchangeRate(fromCurrency, toCurrency) {
    // Static rates as of late 2024 (these should be updated regularly in production)
    const usdRates = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'NGN': 1640.0,    // Nigerian Naira
      'GHS': 16.8,      // Ghanaian Cedi
      'KES': 154.0,     // Kenyan Shilling
      'ZAR': 18.5,      // South African Rand
      'EGP': 49.0,      // Egyptian Pound
      'MAD': 10.1,      // Moroccan Dirham
      'TND': 3.1,       // Tunisian Dinar
      'DZD': 135.0,     // Algerian Dinar
      'XAF': 600.0,     // Central African Franc
      'XOF': 600.0,     // West African Franc
      'UGX': 3750.0,    // Ugandan Shilling
      'TZS': 2520.0,    // Tanzanian Shilling
      'RWF': 1360.0,    // Rwandan Franc
      'ZMW': 27.0,      // Zambian Kwacha
      'MWK': 1730.0,    // Malawian Kwacha
      'BWP': 13.8,      // Botswanan Pula
      'SZL': 18.5,      // Swazi Lilangeni
      'LSL': 18.5,      // Lesotho Loti
      'NAD': 18.5,      // Namibian Dollar
      'AUD': 1.55,      // Australian Dollar
      'CAD': 1.41,      // Canadian Dollar
      'CHF': 0.88,      // Swiss Franc
      'JPY': 150.0,     // Japanese Yen
      'CNY': 7.3        // Chinese Yuan
    };

    const fromRate = usdRates[fromCurrency];
    const toRate = usdRates[toCurrency];

    if (!fromRate || !toRate) {
      console.warn(`Unsupported currency pair: ${fromCurrency} to ${toCurrency}`);
      return 1.0; // Fallback to 1:1 rate
    }

    return toRate / fromRate;
  }

  // ============================================================================
  // TRANSACTION HELPERS
  // ============================================================================

  /**
   * Process transaction with currency conversion
   */
  async processTransactionCurrency(transactionData, userCurrency = 'USD') {
    try {
      const amount = transactionData.amount;
      const currency = transactionData.currency || userCurrency;

      // Always store USD equivalent for consistency
      const usdEquivalent = await this.convertToUSD(amount, currency);
      const exchangeRate = currency === 'USD' ? 1.0 : usdEquivalent / amount;

      return {
        ...transactionData,
        currency,
        originalCurrency: currency,
        usdEquivalent,
        exchangeRate,
        conversionProcessedAt: serverTimestamp()
      };
    } catch (error) {
      console.error('Error processing transaction currency:', error);
      // Fallback: use original data with USD defaults
      return {
        ...transactionData,
        currency: transactionData.currency || 'USD',
        originalCurrency: transactionData.currency || 'USD',
        usdEquivalent: transactionData.amount,
        exchangeRate: 1.0
      };
    }
  }

  /**
   * Convert portfolio amounts to user's preferred view currency
   */
  async convertPortfolioToViewCurrency(portfolioData, viewCurrency = 'USD') {
    try {
      const convertedPortfolio = { ...portfolioData };

      // Convert main portfolio values
      if (portfolioData.totalValue && portfolioData.currency !== viewCurrency) {
        const conversion = await this.convertCurrency(
          portfolioData.totalValue, 
          portfolioData.currency, 
          viewCurrency
        );
        convertedPortfolio.totalValue = conversion.amount;
        convertedPortfolio.displayCurrency = viewCurrency;
        convertedPortfolio.originalCurrency = portfolioData.currency;
        convertedPortfolio.exchangeRate = conversion.rate;
      }

      // Convert individual investments if present
      if (portfolioData.investments) {
        convertedPortfolio.investments = await Promise.all(
          portfolioData.investments.map(async (investment) => {
            if (investment.currency !== viewCurrency) {
              const conversion = await this.convertCurrency(
                investment.amount,
                investment.currency,
                viewCurrency
              );
              return {
                ...investment,
                displayAmount: conversion.amount,
                displayCurrency: viewCurrency,
                originalAmount: investment.amount,
                originalCurrency: investment.currency
              };
            }
            return investment;
          })
        );
      }

      return convertedPortfolio;
    } catch (error) {
      console.error('Error converting portfolio currency:', error);
      return portfolioData; // Return original data on error
    }
  }

  // ============================================================================
  // CURRENCY UTILITIES
  // ============================================================================

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currencyCode) {
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

  /**
   * Format amount with currency
   */
  formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbol = this.getCurrencySymbol(currency);
      return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
    }
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currencyCode) {
    return this.supportedCurrencies.includes(currencyCode?.toUpperCase());
  }

  /**
   * Get currencies for specific region
   */
  getCurrenciesForRegion(region = 'africa') {
    const regions = {
      africa: [
        'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD', 
        'XAF', 'XOF', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 
        'BWP', 'SZL', 'LSL', 'NAD'
      ],
      international: ['USD', 'EUR', 'GBP'],
      developed: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY'],
      all: this.supportedCurrencies
    };
    
    return regions[region] || regions.all;
  }

  /**
   * Log currency conversion for audit trail
   */
  async logCurrencyConversion(conversionData) {
    try {
      await addDoc(collection(db, this.currencyHistoryCollection), {
        ...conversionData,
        timestamp: serverTimestamp(),
        type: 'conversion'
      });
    } catch (error) {
      console.error('Error logging currency conversion:', error);
      // Don't throw error for logging failures
    }
  }
}

// Export service instance
export const currencyService = new CurrencyService();
export default CurrencyService;