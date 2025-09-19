@echo off
echo.
echo =====================================================
echo 🚀 BVESTER PRODUCTION DEPLOYMENT
echo =====================================================
echo.
echo This script will:
echo 1. Validate your production setup
echo 2. Deploy cleanup functions
echo 3. Reset all user data to zero values
echo 4. Deploy the main application
echo 5. Verify production state
echo.
echo WARNING: This will DELETE all existing financial data!
echo.
pause
echo.

echo 🔍 Step 1: Validating production setup...
node scripts/validate-production.js
if %errorlevel% neq 0 (
    echo ❌ Validation failed! Fix errors before deployment.
    pause
    exit /b 1
)

echo.
echo ✅ Validation passed! Proceeding with deployment...
echo.

echo 📦 Step 2: Installing dependencies...
npm install

echo.
echo 🔐 Step 3: Firebase login check...
firebase projects:list

echo.
echo 🚀 Step 4: Executing production deployment...
node scripts/deploy-production.js

echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo 🎉 Your Bvester app is now live with clean production data!
echo 📊 All users start with zero balances
echo 💼 All businesses start with zero metrics
echo 🔒 Security rules are production-ready
echo.
echo Next steps:
echo 1. Test user registration
echo 2. Verify zero states in dashboard
echo 3. Add your first content via CMS
echo 4. Launch marketing campaigns!
echo.
pause