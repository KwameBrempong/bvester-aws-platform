@echo off
echo Deploying Bvester UI Updates to AWS
echo ====================================
echo.

cd /d "C:\Users\BREMPONG\Desktop\dev\bvester\web-app"

echo Checking AWS CLI...
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo AWS CLI not found. Please install AWS CLI first.
    exit /b 1
)

echo AWS CLI is available
echo.

echo Deploying files to S3...
echo.

REM Deploy index.html
echo Uploading index.html...
aws s3 cp index.html s3://bvester-web-prod-eu/index.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2

REM Deploy index-premium.html
if exist index-premium.html (
    echo Uploading index-premium.html...
    aws s3 cp index-premium.html s3://bvester-web-prod-eu/index-premium.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

REM Deploy enhanced dashboard
if exist sme-dashboard-enhanced.html (
    echo Uploading sme-dashboard-enhanced.html...
    aws s3 cp sme-dashboard-enhanced.html s3://bvester-web-prod-eu/sme-dashboard-enhanced.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2

    echo Replacing sme-dashboard.html with enhanced version...
    aws s3 cp sme-dashboard-enhanced.html s3://bvester-web-prod-eu/sme-dashboard.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

REM Deploy investment assessment
if exist investment-assessment.html (
    echo Uploading investment-assessment.html...
    aws s3 cp investment-assessment.html s3://bvester-web-prod-eu/investment-assessment.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

REM Deploy global CSS
if exist css\global-design-system.css (
    echo Uploading css/global-design-system.css...
    aws s3 cp css/global-design-system.css s3://bvester-web-prod-eu/css/global-design-system.css --content-type "text/css" --cache-control "max-age=3600" --region eu-west-2
)

REM Deploy auth pages if they exist
if exist login.html (
    echo Uploading login.html...
    aws s3 cp login.html s3://bvester-web-prod-eu/login.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

if exist signup.html (
    echo Uploading signup.html...
    aws s3 cp signup.html s3://bvester-web-prod-eu/signup.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

if exist auth.html (
    echo Uploading auth.html...
    aws s3 cp auth.html s3://bvester-web-prod-eu/auth.html --content-type "text/html" --cache-control "max-age=3600" --region eu-west-2
)

echo.
echo Creating CloudFront invalidation...
aws cloudfront create-invalidation --distribution-id E1FKHA2UF8CJ5A --paths "/*" --region us-east-1

echo.
echo ====================================
echo Deployment Complete!
echo ====================================
echo.
echo Updated URLs:
echo   Homepage: https://bvester.com
echo   Premium Homepage: https://bvester.com/index-premium.html
echo   SME Dashboard: https://bvester.com/sme-dashboard.html
echo   Enhanced Dashboard: https://bvester.com/sme-dashboard-enhanced.html
echo   Investment Assessment: https://bvester.com/investment-assessment.html
echo.
echo Changes deployed:
echo   - New black/gold/white premium theme
echo   - Enhanced dashboard with design system integration
echo   - Improved accessibility features
echo   - Mobile responsive design
echo   - Standardized visual hierarchy
echo.
echo Note: CloudFront cache invalidation may take 5-10 minutes to propagate.
pause