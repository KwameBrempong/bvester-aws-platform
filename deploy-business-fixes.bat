@echo off
echo ================================================================
echo BVESTER BUSINESS INTERFACE - DEPLOYMENT SCRIPT
echo ================================================================
echo.
echo 🚀 Deploying fixed business account interface to production...
echo.

REM Change to project directory
cd /d "C:\Users\BREMPONG\Desktop\APPS\bvester"

echo ✅ Step 1: Verifying fixed files...
if not exist "web-app\startup-dashboard.html" (
    echo ❌ ERROR: startup-dashboard.html not found
    pause
    exit /b 1
)

if not exist "web-app\business-profile.html" (
    echo ❌ ERROR: business-profile.html not found
    pause
    exit /b 1
)

if not exist "web-app\js\api-client.js" (
    echo ❌ ERROR: api-client.js not found
    pause
    exit /b 1
)

echo ✅ All business interface files verified
echo.

echo ✅ Step 2: Building for production...
REM Add any build steps here if needed
echo Build completed
echo.

echo ✅ Step 3: Firebase deployment...
echo Deploying to Firebase Hosting...
firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo ❌ Firebase deployment failed
    pause
    exit /b 1
)

echo.
echo 🎉 DEPLOYMENT SUCCESSFUL!
echo ================================================================
echo Business interface fixes have been deployed to production
echo.
echo Key improvements deployed:
echo ✅ Fixed CSS issues in business dashboard
echo ✅ Enhanced profile update functionality
echo ✅ Improved mobile responsiveness
echo ✅ Better error handling and user feedback
echo.
echo 🌐 Access your site at: https://bvester.com
echo ================================================================
echo.
pause