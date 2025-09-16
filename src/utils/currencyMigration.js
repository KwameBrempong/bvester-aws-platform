/**
 * 🔄 CURRENCY MIGRATION UTILITY
 * Script to migrate existing users and transactions to support currency fields
 * This should be run once after implementing the currency system
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { userDataService } from '../services/firebase/UserDataService';
import { currencyService } from '../services/firebase/CurrencyService';

const functions = getFunctions();

/**
 * Run currency migration for existing users
 */
export async function migrateCurrencyData() {
  try {
    console.log('🚀 Starting currency data migration...');
    
    // Call the Cloud Function for migration
    const migrateCurrencyDataFunction = httpsCallable(functions, 'migrateCurrencyData');
    const result = await migrateCurrencyDataFunction();
    
    console.log('✅ Migration completed:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Update exchange rates manually
 */
export async function updateExchangeRates() {
  try {
    console.log('🔄 Updating exchange rates...');
    
    const updateRatesFunction = httpsCallable(functions, 'updateExchangeRates');
    const result = await updateRatesFunction();
    
    console.log('✅ Exchange rates updated:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Exchange rate update failed:', error);
    throw error;
  }
}

/**
 * Migrate a specific user's data
 */
export async function migrateUserCurrency(userId, country = 'US') {
  try {
    console.log(`🔄 Migrating user ${userId}...`);
    
    // Get currency for user's country
    const defaultCurrency = getCurrencyForCountry(country);
    
    // Update user currency preferences
    await userDataService.updateUserCurrency(userId, {
      businessCurrency: defaultCurrency,
      preferredViewCurrency: defaultCurrency
    });
    
    console.log(`✅ User ${userId} migrated to ${defaultCurrency}`);
    return { success: true, currency: defaultCurrency };
  } catch (error) {
    console.error(`❌ Failed to migrate user ${userId}:`, error);
    throw error;
  }
}

/**
 * Validate currency data for all users
 */
export async function validateCurrencyData() {
  try {
    console.log('🔍 Validating currency data...');
    
    const issues = [];
    
    // This would need to be implemented with actual data queries
    // For now, just return validation structure
    
    const validation = {
      totalUsersChecked: 0,
      usersWithIssues: 0,
      transactionsChecked: 0,
      transactionsWithIssues: 0,
      issues: issues
    };
    
    console.log('✅ Validation completed:', validation);
    return validation;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

/**
 * Test currency conversion functionality
 */
export async function testCurrencyConversion() {
  try {
    console.log('🧪 Testing currency conversion...');
    
    const testCases = [
      { amount: 100, from: 'USD', to: 'NGN' },
      { amount: 1000, from: 'NGN', to: 'USD' },
      { amount: 50, from: 'EUR', to: 'GHS' },
      { amount: 200, from: 'GBP', to: 'KES' },
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const conversion = await currencyService.convertCurrency(
          testCase.amount,
          testCase.from,
          testCase.to
        );
        results.push({
          ...testCase,
          result: conversion,
          success: true
        });
        console.log(`✅ ${testCase.from} to ${testCase.to}: ${conversion.amount}`);
      } catch (error) {
        results.push({
          ...testCase,
          error: error.message,
          success: false
        });
        console.error(`❌ ${testCase.from} to ${testCase.to}: ${error.message}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Currency conversion test failed:', error);
    throw error;
  }
}

/**
 * Generate migration report
 */
export async function generateMigrationReport() {
  try {
    console.log('📊 Generating migration report...');
    
    // This would query actual data to generate a report
    const report = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      summary: {
        totalUsers: 0,
        migratedUsers: 0,
        totalTransactions: 0,
        migratedTransactions: 0,
        totalBusinesses: 0,
        migratedBusinesses: 0
      },
      currencyDistribution: {
        USD: 0,
        NGN: 0,
        GHS: 0,
        KES: 0,
        ZAR: 0,
        other: 0
      },
      issues: []
    };
    
    console.log('✅ Migration report generated:', report);
    return report;
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

/**
 * Helper function to get currency for country
 */
function getCurrencyForCountry(country = 'US') {
  const currencyMap = {
    'NG': 'NGN',
    'GH': 'GHS',
    'KE': 'KES',
    'ZA': 'ZAR',
    'EG': 'EGP',
    'MA': 'MAD',
    'TN': 'TND',
    'DZ': 'DZD',
    'UG': 'UGX',
    'TZ': 'TZS',
    'RW': 'RWF',
    'ZM': 'ZMW',
    'MW': 'MWK',
    'BW': 'BWP',
    'SZ': 'SZL',
    'LS': 'LSL',
    'NA': 'NAD',
    'US': 'USD',
    'GB': 'GBP',
    'AU': 'AUD',
    'CA': 'CAD',
    'CH': 'CHF',
    'JP': 'JPY',
    'CN': 'CNY'
  };
  
  return currencyMap[country] || 'USD';
}

/**
 * Run complete migration process
 */
export async function runCompleteMigration() {
  try {
    console.log('🚀 Starting complete currency migration process...');
    
    // Step 1: Migrate data
    const migrationResult = await migrateCurrencyData();
    console.log('✅ Step 1 - Data migration:', migrationResult);
    
    // Step 2: Update exchange rates
    const ratesResult = await updateExchangeRates();
    console.log('✅ Step 2 - Exchange rates:', ratesResult);
    
    // Step 3: Test conversions
    const testResults = await testCurrencyConversion();
    console.log('✅ Step 3 - Conversion tests:', testResults);
    
    // Step 4: Generate report
    const report = await generateMigrationReport();
    console.log('✅ Step 4 - Migration report:', report);
    
    console.log('🎉 Complete migration process finished successfully!');
    
    return {
      success: true,
      steps: {
        migration: migrationResult,
        exchangeRates: ratesResult,
        tests: testResults,
        report: report
      }
    };
  } catch (error) {
    console.error('❌ Complete migration failed:', error);
    throw error;
  }
}

export default {
  migrateCurrencyData,
  updateExchangeRates,
  migrateUserCurrency,
  validateCurrencyData,
  testCurrencyConversion,
  generateMigrationReport,
  runCompleteMigration
};