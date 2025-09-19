@echo off
echo =================================
echo  BVESTER WEB-ONLY DEPLOYMENT
echo =================================

echo.
echo [1/6] Temporarily moving Expo files...
if exist app.json.backup del app.json.backup
if exist eas.json.backup del eas.json.backup
if exist app.json move app.json app.json.backup
if exist eas.json move eas.json eas.json.backup
echo ✓ Expo files moved to backup

echo.
echo [2/6] Cleaning previous builds...
if exist web-build rmdir /s /q web-build
if exist .expo rmdir /s /q .expo
echo ✓ Build cache cleared

echo.
echo [3/6] Copying web-app files to web-build...
if not exist web-build mkdir web-build
xcopy web-app\* web-build\ /s /e /y
echo ✓ Web files copied

echo.
echo [4/6] Verifying critical files exist...
if not exist web-build\index.html (
    echo ❌ ERROR: index.html not found in web-build
    goto :error
)
if not exist web-build\login.html (
    echo ❌ ERROR: login.html not found in web-build
    goto :error
)
if not exist web-build\signup.html (
    echo ❌ ERROR: signup.html not found in web-build
    goto :error
)
echo ✓ All critical files verified

echo.
echo [5/6] Deploying to Firebase Hosting...
firebase deploy --only hosting:bvester-com
if errorlevel 1 (
    echo ❌ Firebase deployment failed
    goto :error
)
echo ✓ Firebase deployment completed

echo.
echo [6/6] Restoring Expo files...
if exist app.json.backup move app.json.backup app.json
if exist eas.json.backup move eas.json.backup eas.json
echo ✓ Expo files restored

echo.
echo =================================
echo ✅ WEB-ONLY DEPLOYMENT COMPLETED!
echo =================================
echo.
echo Your Bvester web app is now live at:
echo https://bvester.com
echo https://bizinvest-hub-prod.web.app
echo.
echo Sign In and Sign Up buttons should now work properly!
echo.
goto :end

:error
echo.
echo =================================
echo ❌ DEPLOYMENT FAILED
echo =================================
if exist app.json.backup move app.json.backup app.json
if exist eas.json.backup move eas.json.backup eas.json
echo Expo files restored after error
pause

:end
pause