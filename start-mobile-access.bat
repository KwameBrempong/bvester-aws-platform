@echo off
echo 📱 Starting Mobile Access Servers...
echo.
echo ✅ Starting HTML Server (Port 9002)...
start "Mobile HTML Server" node mobile-server.js
timeout /t 3 >nul

echo.
echo ✅ Starting React Native with Tunnel...
echo.
echo 📱 YOUR MOBILE ACCESS URLS:
echo    HTML Version:    http://192.168.8.101:9002
echo    Alternative IP:  http://172.23.16.1:9002
echo.
echo 🔥 Try the HTML version first - it should work on your phone!
echo.
npx expo start --web --tunnel --port 8087