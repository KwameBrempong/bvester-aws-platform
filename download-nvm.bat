@echo off
echo 🔧 BizInvest Hub - nvm-windows Installer Helper
echo ================================================
echo.
echo This script will help you download nvm-windows installer.
echo.
echo 📋 Manual Steps Required:
echo 1. Go to: https://github.com/coreybutler/nvm-windows/releases
echo 2. Download the latest nvm-setup.exe file
echo 3. Run nvm-setup.exe as Administrator
echo 4. Follow the installation wizard
echo.
echo 🌐 Opening the download page in your browser...
echo.
start https://github.com/coreybutler/nvm-windows/releases
echo.
echo ✅ Browser opened! Download nvm-setup.exe and run it as Administrator.
echo.
echo 📋 After installation:
echo 1. Close this window
echo 2. Open NEW Command Prompt as Administrator  
echo 3. Run: nvm install 18.20.4
echo 4. Run: nvm use 18.20.4
echo 5. Run: node --version (should show v18.20.4)
echo.
pause