@echo off
echo 🔄 Restarting Mobile Development Server...
echo.

echo 🛑 Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🧹 Clearing Metro cache...
npx expo r -c
timeout /t 2 >nul

echo 🌐 Starting fresh web server...
echo 📱 Your mobile fixes should now be visible!
echo.
echo 🔗 Access your app at: http://localhost:8081
echo.
npx expo start --web --reset-cache