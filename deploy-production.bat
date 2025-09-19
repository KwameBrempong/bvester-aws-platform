@echo off
REM Bvester Production Deployment Script (Windows)
echo 🚀 Deploying to Bvester Production Environment...

REM Warning prompt
echo ⚠️  WARNING: This will deploy to PRODUCTION (bvester.com)
echo Have you tested in staging first? (y/N)
set /p confirmation=
if /i not "%confirmation%"=="y" (
    echo ❌ Deployment cancelled. Please test in staging first.
    exit /b 1
)

REM Check if files exist
if not exist "index.html" (
    echo ❌ index.html not found!
    exit /b 1
)

echo 📂 Deploying HTML files to production...

REM Deploy to production
aws s3 cp index.html s3://bvester-website-public/index.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp login-final.html s3://bvester-website-public/login-final.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp signup-final.html s3://bvester-website-public/signup-final.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp investment-assessment.html s3://bvester-website-public/investment-assessment.html --content-type "text/html" --cache-control "no-cache" || exit /b 1

echo 🔄 Invalidating CloudFront cache...

REM Generate timestamp for cache invalidation
for /f "tokens=* USEBACKQ" %%i in (`powershell -command "& {Get-Date -UFormat '%%s'}"`) do set timestamp=%%i

REM Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2ZOWJPDCAC1Z9 --invalidation-batch "{\"Paths\":{\"Quantity\":4,\"Items\":[\"/index.html\",\"/login-final.html\",\"/signup-final.html\",\"/investment-assessment.html\"]},\"CallerReference\":\"prod-%timestamp%\"}" || exit /b 1

echo ✅ Production deployment complete!
echo 🌐 Production URL: https://bvester.com
echo.
echo 🧪 Please verify production deployment:
echo curl -I https://bvester.com
echo curl -I https://bvester.com/login-final.html
echo curl -I https://bvester.com/signup-final.html
echo curl -I https://bvester.com/investment-assessment.html
pause