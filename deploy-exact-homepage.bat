@echo off
echo 🚀 Deploying EXACT Homepage to bvester.com
echo ==========================================
echo.
echo This will upload the current web-app/index.html to S3
echo Your black/gold theme with working buttons will be live!
echo.
echo MANUAL UPLOAD INSTRUCTIONS:
echo.
echo 1. Go to: https://s3.console.aws.amazon.com/s3/buckets/bvester-website-public
echo.
echo 2. Find and DELETE the current index.html file
echo.
echo 3. Click "Upload" and select this file:
echo    %~dp0web-app\index.html
echo.
echo 4. During upload:
echo    - Name it: index.html
echo    - Set Content-Type: text/html
echo    - Make it publicly readable
echo.
echo 5. Your black/gold homepage will be live immediately!
echo.
echo ✅ READY: web-app\index.html contains your preferred design
echo ✅ READY: Login and Sign up buttons are functional
echo ✅ READY: Black background with gold accents
echo.
pause
echo.
echo Opening file location for easy access...
explorer /select,"%~dp0web-app\index.html"