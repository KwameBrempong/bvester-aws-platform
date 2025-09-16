@echo off
echo Starting BizInvest Hub test server...
echo.
echo Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting fresh development server...
cd /d "C:\Users\BREMPONG\Desktop\APPS\bvester"
npx expo start --web --clear --port 3003

pause