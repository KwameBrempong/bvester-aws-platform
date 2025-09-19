#!/usr/bin/env node

/**
 * 🔍 BVESTER PRODUCTION VALIDATION SCRIPT
 * 
 * Validates that the app is production-ready with proper zero states
 * and empty data handling across all components.
 */

const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validations = 0;
  }

  /**
   * Run all production validations
   */
  async validate() {
    console.log('🔍 BVESTER PRODUCTION VALIDATION');
    console.log('===============================\n');

    // Validate code components
    this.validateUserDataService();
    this.validateAuthContext();
    this.validateDashboardScreen();
    this.validateFirebaseRules();
    this.validateCleanupFunctions();

    // Output results
    this.outputResults();
  }

  /**
   * Validate UserDataService has proper zero defaults
   */
  validateUserDataService() {
    console.log('📊 Validating UserDataService...');
    const filePath = 'src/services/firebase/UserDataService.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for zero defaults in getDefaultStats
      if (content.includes('monthlyNetIncome: 0') && 
          content.includes('totalInvestments: 0') &&
          content.includes('businessHealthScore: 0')) {
        console.log('  ✅ Zero defaults properly configured');
      } else {
        this.errors.push('UserDataService: Missing zero defaults in getDefaultStats()');
      }

      // Check for production flag
      if (content.includes('isProductionAccount: true')) {
        console.log('  ✅ Production account flagging enabled');
      } else {
        this.warnings.push('UserDataService: Consider adding production account flagging');
      }

      this.validations += 2;
    } else {
      this.errors.push('UserDataService: File not found');
    }
  }

  /**
   * Validate AuthContext creates users with zero defaults
   */
  validateAuthContext() {
    console.log('🔐 Validating AuthContext...');
    const filePath = 'src/context/AuthContext.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for zero financial defaults in registration
      if (content.includes('totalInvestments: 0') && 
          content.includes('monthlyIncome: 0') &&
          content.includes('portfolioValue: 0')) {
        console.log('  ✅ New user registration includes zero defaults');
      } else {
        this.errors.push('AuthContext: Missing zero defaults in user registration');
      }

      // Check for verification status
      if (content.includes('isVerified: false')) {
        console.log('  ✅ New users start unverified (production appropriate)');
      } else {
        this.warnings.push('AuthContext: New users should start unverified');
      }

      this.validations += 2;
    } else {
      this.errors.push('AuthContext: File not found');
    }
  }

  /**
   * Validate DashboardScreen handles zero states properly
   */
  validateDashboardScreen() {
    console.log('📱 Validating DashboardScreen...');
    const filePath = 'src/screens/dashboard/DashboardScreen.js';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for null-safe access
      if (content.includes('userStats?.') || content.includes('userStats &&')) {
        console.log('  ✅ Null-safe data access implemented');
      } else {
        this.warnings.push('DashboardScreen: Consider adding null-safe data access');
      }

      // Check for empty state handling
      if (content.includes('No data yet') || content.includes('Start investing')) {
        console.log('  ✅ Empty state messaging present');
      } else {
        this.warnings.push('DashboardScreen: Consider adding empty state messaging');
      }

      // Check for zero value handling
      if (content.includes('|| 0') && content.includes('> 0')) {
        console.log('  ✅ Zero value handling implemented');
      } else {
        this.errors.push('DashboardScreen: Missing proper zero value handling');
      }

      this.validations += 3;
    } else {
      this.errors.push('DashboardScreen: File not found');
    }
  }

  /**
   * Validate Firestore security rules are production-ready
   */
  validateFirebaseRules() {
    console.log('🛡️  Validating Firestore Rules...');
    const filePath = 'firestore.rules';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for proper authentication requirements
      if (content.includes('isAuthenticated()') && content.includes('isOwner(userId)')) {
        console.log('  ✅ Authentication and ownership checks present');
      } else {
        this.errors.push('Firestore Rules: Missing authentication/ownership checks');
      }

      // Check for admin role restrictions
      if (content.includes('isAdmin()') && content.includes('admin')) {
        console.log('  ✅ Admin role restrictions configured');
      } else {
        this.warnings.push('Firestore Rules: Consider adding admin role restrictions');
      }

      // Check for default deny rule
      if (content.includes('allow read, write: if false')) {
        console.log('  ✅ Default deny rule configured (security best practice)');
      } else {
        this.errors.push('Firestore Rules: Missing default deny rule');
      }

      this.validations += 3;
    } else {
      this.errors.push('Firestore Rules: File not found');
    }
  }

  /**
   * Validate cleanup functions are properly implemented
   */
  validateCleanupFunctions() {
    console.log('🧹 Validating Cleanup Functions...');
    
    // Check cleanup utility
    const utilPath = 'functions/utils/productionCleanup.js';
    if (fs.existsSync(utilPath)) {
      const content = fs.readFileSync(utilPath, 'utf8');
      
      if (content.includes('ProductionCleanup') && content.includes('executeProductionCleanup')) {
        console.log('  ✅ Production cleanup utility present');
      } else {
        this.errors.push('Cleanup Functions: Invalid cleanup utility structure');
      }
    } else {
      this.errors.push('Cleanup Functions: Production cleanup utility not found');
    }

    // Check Cloud Function wrapper
    const functionPath = 'functions/productionCleanupFunction.js';
    if (fs.existsSync(functionPath)) {
      const content = fs.readFileSync(functionPath, 'utf8');
      
      if (content.includes('executeProductionCleanup') && content.includes('X-Admin-Secret')) {
        console.log('  ✅ Secured Cloud Function wrapper present');
      } else {
        this.errors.push('Cleanup Functions: Invalid or unsecured function wrapper');
      }
    } else {
      this.errors.push('Cleanup Functions: Cloud Function wrapper not found');
    }

    this.validations += 2;
  }

  /**
   * Additional file structure validation
   */
  validateFileStructure() {
    console.log('📁 Validating File Structure...');
    
    const requiredFiles = [
      'src/config/firebase.js',
      'src/services/firebase/FirebaseService.js',
      'firestore.rules',
      'firebase.json',
      'package.json'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
      }
    });

    this.validations += requiredFiles.length;
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment() {
    console.log('🌍 Validating Environment...');
    
    // Check for .env.example
    if (fs.existsSync('.env.example')) {
      console.log('  ✅ Environment example file present');
    } else {
      this.warnings.push('Missing .env.example file for environment configuration');
    }

    // Check firebase.json configuration
    if (fs.existsSync('firebase.json')) {
      const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
      
      if (firebaseConfig.hosting && firebaseConfig.functions) {
        console.log('  ✅ Firebase hosting and functions configured');
      } else {
        this.warnings.push('Firebase configuration may be incomplete');
      }
    }

    this.validations += 2;
  }

  /**
   * Output validation results
   */
  outputResults() {
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Total Validations: ${this.validations}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS (Must Fix):');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Should Consider):');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('\n🎯 PRODUCTION READINESS STATUS:');
    if (this.errors.length === 0) {
      console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
      console.log('   All critical validations passed');
      
      if (this.warnings.length > 0) {
        console.log('   Consider addressing warnings for optimal production experience');
      }
      
      console.log('\n🚀 Next Steps:');
      console.log('   1. Run: node scripts/deploy-production.js');
      console.log('   2. Execute production cleanup');
      console.log('   3. Verify zero states in production');
      console.log('   4. Launch to users! 🎉');
      
    } else {
      console.log('❌ NOT READY FOR PRODUCTION');
      console.log(`   ${this.errors.length} critical errors must be fixed first`);
      console.log('\n🔧 Fix the errors above, then re-run this validation');
    }

    // Generate validation report
    const report = {
      timestamp: new Date().toISOString(),
      validations: this.validations,
      errors: this.errors,
      warnings: this.warnings,
      status: this.errors.length === 0 ? 'READY' : 'NOT_READY'
    };

    fs.writeFileSync('production-validation-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: production-validation-report.json');
  }
}

// Execute validation
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;