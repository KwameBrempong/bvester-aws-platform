@echo off
REM Bvester Emergency Rollback Script (Windows)
echo 🚨 EMERGENCY ROLLBACK INITIATED

echo ⚠️  WARNING: This will rollback production to staging version
echo Are you sure you want to proceed? (y/N)
set /p confirmation=
if /i not "%confirmation%"=="y" (
    echo ❌ Rollback cancelled.
    exit /b 1
)

echo 🔄 Rolling back production to staging version...

REM Copy from staging to production
aws s3 cp s3://bvester-staging/index.html s3://bvester-website-public/index.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp s3://bvester-staging/login-final.html s3://bvester-website-public/login-final.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp s3://bvester-staging/signup-final.html s3://bvester-website-public/signup-final.html --content-type "text/html" --cache-control "no-cache" || exit /b 1
aws s3 cp s3://bvester-staging/investment-assessment.html s3://bvester-website-public/investment-assessment.html --content-type "text/html" --cache-control "no-cache" || exit /b 1

echo 🔄 Invalidating CloudFront cache...

REM Generate timestamp for cache invalidation
for /f "tokens=* USEBACKQ" %%i in (`powershell -command "& {Get-Date -UFormat '%%s'}"`) do set timestamp=%%i

REM Invalidate cache immediately
aws cloudfront create-invalidation --distribution-id E2ZOWJPDCAC1Z9 --invalidation-batch "{\"Paths\":{\"Quantity\":1,\"Items\":[\"/*\"]},\"CallerReference\":\"emergency-%timestamp%\"}" || exit /b 1

echo ✅ Emergency rollback complete!
echo 🌐 Please verify: https://bvester.com
echo.
echo 📝 Next steps:
echo 1. Investigate the issue that caused the rollback
echo 2. Fix the problem in development
echo 3. Test thoroughly in staging
echo 4. Deploy the fix using normal deployment process
pause