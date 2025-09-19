@echo off
REM Simple deployment using Firebase Hosting API

echo 🚀 Firebase Direct Deployment Script
echo =====================================
echo.
echo This script will help you deploy to Firebase when CLI is broken.
echo.
echo STEPS TO DEPLOY:
echo.
echo 1. Go to Firebase Console: https://console.firebase.google.com/project/bizinvest-hub-prod/hosting
echo.
echo 2. Look for these options in the UI:
echo    - "Release" button
echo    - "Deploy" button  
echo    - "Upload files" option
echo    - Three-dot menu (...) next to current release
echo.
echo 3. If you see "View full history", click it and look for:
echo    - "Create new release"
echo    - "Deploy new version"
echo.
echo 4. Alternative: Try the Releases tab at the top of the Hosting page
echo.
echo 5. If none of these work, try:
echo    a. Go to: https://console.firebase.google.com/project/bizinvest-hub-prod/hosting/sites/bvester-com
echo    b. Look for "Release" or "Deploy" button there
echo.
echo FILES TO UPLOAD:
echo -----------------
echo Upload ALL contents from: C:\Users\BREMPONG\Desktop\dev\bvester\web-app\
echo.
echo The revolutionary homepage is ready with:
echo - Title: "Turn Your Business Into an Investment Magnet"
echo - Cache-buster: MANUAL-DEPLOY-1757808070
echo.
pause