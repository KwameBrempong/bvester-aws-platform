@echo off
echo ========================================
echo Testing Cloudflare DNS Setup
echo ========================================
echo.

echo 1. Checking Nameservers...
echo ----------------------------------------
nslookup -type=NS bvester.com 1.1.1.1
echo.

echo 2. Checking Domain Resolution...
echo ----------------------------------------
nslookup bvester.com 1.1.1.1
echo.

echo 3. Testing HTTPS Connection...
echo ----------------------------------------
curl -I https://bvester.com
echo.

echo ========================================
echo If nameservers show cloudflare.com,
echo your migration is complete!
echo ========================================
pause