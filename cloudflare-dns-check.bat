@echo off
echo ========================================
echo Cloudflare DNS Verification Script
echo ========================================
echo.

echo Checking nameservers for bvester.com...
nslookup -type=NS bvester.com 8.8.8.8
echo.
echo ----------------------------------------
echo.

echo Checking A/CNAME records...
nslookup bvester.com 8.8.8.8
echo.
echo ----------------------------------------
echo.

echo Checking www subdomain...
nslookup www.bvester.com 8.8.8.8
echo.
echo ----------------------------------------
echo.

echo Testing HTTPS connection...
curl -I https://bvester.com
echo.

echo ========================================
echo If you see Cloudflare nameservers above,
echo the migration is complete!
echo ========================================
pause