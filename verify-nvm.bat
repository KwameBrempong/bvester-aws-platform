@echo off
echo 🔧 BizInvest Hub - nvm-windows Verification
echo ==========================================
echo.

echo 📋 Step 1: Checking nvm installation...
nvm version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ nvm not found! Please install nvm-windows first.
    echo 📖 Run: download-nvm.bat
    pause
    exit /b 1
)
echo ✅ nvm is installed!
echo.

echo 📋 Step 2: Installing Node.js 18.20.4 LTS...
nvm install 18.20.4
echo.

echo 📋 Step 3: Switching to Node.js 18.20.4...
nvm use 18.20.4
echo.

echo 📋 Step 4: Verifying Node.js version...
node --version
npm --version
echo.

echo 📋 Step 5: Testing in BizInvest Hub project...
cd /d "C:\Users\BREMPONG\Desktop\APPS\bvester"
echo Current directory: %CD%
echo.

echo 📋 Step 6: Installing npm dependencies...
npm install
echo.

echo 📋 Step 7: Testing Firebase connection...
node firebase-test.js
echo.

echo 🎉 If you see all ✅ above, nvm-windows setup is complete!
echo.
echo 📋 Next steps:
echo 1. Run: expo start --clear
echo 2. Begin testing your BizInvest Hub app
echo 3. Follow PRODUCTION_TESTING_CHECKLIST.md
echo.
pause