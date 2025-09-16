# Bvester Dashboard & Login System Deployment Script
# This script deploys all dashboard and authentication pages to S3

Write-Host "🚀 Deploying Bvester Dashboard & Login System" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$BUCKET_NAME = "bvester-website-public"
$WEB_APP_PATH = "C:\Users\BREMPONG\Desktop\dev\bvester\web-app"

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Deploying Core Pages..." -ForegroundColor Yellow

# Deploy authentication pages
Write-Host "`n1️⃣ Deploying Authentication System..." -ForegroundColor Cyan
aws s3 cp "$WEB_APP_PATH\login.html" "s3://$BUCKET_NAME/login.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\signup.html" "s3://$BUCKET_NAME/signup.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\auth.html" "s3://$BUCKET_NAME/auth.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\password-reset.html" "s3://$BUCKET_NAME/password-reset.html" --cache-control "max-age=3600"
Write-Host "✅ Authentication pages deployed" -ForegroundColor Green

# Deploy dashboards
Write-Host "`n2️⃣ Deploying Dashboard Pages..." -ForegroundColor Cyan
aws s3 cp "$WEB_APP_PATH\premium-dashboard.html" "s3://$BUCKET_NAME/dashboard.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\investor-dashboard.html" "s3://$BUCKET_NAME/investor-dashboard.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\sme-dashboard.html" "s3://$BUCKET_NAME/sme-dashboard.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\startup-dashboard.html" "s3://$BUCKET_NAME/startup-dashboard.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\ai-advisor-dashboard.html" "s3://$BUCKET_NAME/ai-advisor.html" --cache-control "max-age=3600"
Write-Host "✅ Dashboard pages deployed" -ForegroundColor Green

# Deploy business features
Write-Host "`n3️⃣ Deploying Business Features..." -ForegroundColor Cyan
aws s3 cp "$WEB_APP_PATH\business-profile.html" "s3://$BUCKET_NAME/business-profile.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\business-analytics.html" "s3://$BUCKET_NAME/analytics.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\financial-records.html" "s3://$BUCKET_NAME/financial-records.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\kyc-verification.html" "s3://$BUCKET_NAME/kyc.html" --cache-control "max-age=3600"
Write-Host "✅ Business features deployed" -ForegroundColor Green

# Deploy investor features
Write-Host "`n4️⃣ Deploying Investor Features..." -ForegroundColor Cyan
aws s3 cp "$WEB_APP_PATH\investment-opportunities.html" "s3://$BUCKET_NAME/opportunities.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\portfolio-management.html" "s3://$BUCKET_NAME/portfolio.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\investor-profile.html" "s3://$BUCKET_NAME/investor-profile.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\ai-matchmaking.html" "s3://$BUCKET_NAME/ai-matchmaking.html" --cache-control "max-age=3600"
Write-Host "✅ Investor features deployed" -ForegroundColor Green

# Deploy static assets
Write-Host "`n5️⃣ Deploying Static Assets..." -ForegroundColor Cyan

# CSS files
aws s3 sync "$WEB_APP_PATH\css" "s3://$BUCKET_NAME/css" --delete --cache-control "max-age=31536000"
Write-Host "✅ CSS files deployed" -ForegroundColor Green

# JavaScript files
aws s3 sync "$WEB_APP_PATH\js" "s3://$BUCKET_NAME/js" --delete --cache-control "max-age=31536000"
aws s3 cp "$WEB_APP_PATH\components.js" "s3://$BUCKET_NAME/components.js" --cache-control "max-age=31536000"
aws s3 cp "$WEB_APP_PATH\sw.js" "s3://$BUCKET_NAME/sw.js" --cache-control "max-age=86400"
Write-Host "✅ JavaScript files deployed" -ForegroundColor Green

# Logo and images
aws s3 cp "$WEB_APP_PATH\bvester-logo.png" "s3://$BUCKET_NAME/bvester-logo.png" --cache-control "max-age=31536000"
aws s3 cp "$WEB_APP_PATH\bvester-logo.svg" "s3://$BUCKET_NAME/bvester-logo.svg" --cache-control "max-age=31536000"
aws s3 cp "$WEB_APP_PATH\bvester-logo-splash.png" "s3://$BUCKET_NAME/bvester-logo-splash.png" --cache-control "max-age=31536000"
aws s3 cp "$WEB_APP_PATH\logo-icon.png" "s3://$BUCKET_NAME/logo-icon.png" --cache-control "max-age=31536000"
Write-Host "✅ Images deployed" -ForegroundColor Green

# Deploy additional pages
Write-Host "`n6️⃣ Deploying Additional Pages..." -ForegroundColor Cyan
aws s3 cp "$WEB_APP_PATH\about.html" "s3://$BUCKET_NAME/about.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\for-businesses.html" "s3://$BUCKET_NAME/for-businesses.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\for-investors.html" "s3://$BUCKET_NAME/for-investors.html" --cache-control "max-age=3600"
aws s3 cp "$WEB_APP_PATH\growth-hub.html" "s3://$BUCKET_NAME/growth-hub.html" --cache-control "max-age=3600"
Write-Host "✅ Additional pages deployed" -ForegroundColor Green

# Check if CloudFront distribution exists
Write-Host "`n7️⃣ Invalidating CloudFront Cache..." -ForegroundColor Cyan
$CF_DISTRIBUTIONS = aws cloudfront list-distributions --output json 2>$null | ConvertFrom-Json
$CF_DIST_ID = $null
if ($CF_DISTRIBUTIONS) {
    $CF_DIST_ID = $CF_DISTRIBUTIONS.DistributionList.Items | Where-Object { $_.Aliases.Items -contains 'bvester.com' } | Select-Object -First 1 -ExpandProperty Id
}

if ($CF_DIST_ID) {
    Write-Host "Invalidating distribution: $CF_DIST_ID" -ForegroundColor Yellow
    aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*" | Out-Null
    Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "⚠️  No CloudFront distribution found - cache not invalidated" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "✨ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`n📍 Your deployed pages are now live at:" -ForegroundColor Cyan
Write-Host "   Login: https://bvester.com/login.html" -ForegroundColor White
Write-Host "   Signup: https://bvester.com/signup.html" -ForegroundColor White
Write-Host "   Dashboard: https://bvester.com/dashboard.html" -ForegroundColor White
Write-Host "   SME Dashboard: https://bvester.com/sme-dashboard.html" -ForegroundColor White
Write-Host "   Investor Dashboard: https://bvester.com/investor-dashboard.html" -ForegroundColor White
Write-Host "   AI Advisor: https://bvester.com/ai-advisor.html" -ForegroundColor White
Write-Host "   KYC: https://bvester.com/kyc.html" -ForegroundColor White
Write-Host "   Portfolio: https://bvester.com/portfolio.html" -ForegroundColor White
Write-Host "   Opportunities: https://bvester.com/opportunities.html" -ForegroundColor White

Write-Host "`n⚠️  Note: Pages may take 5-10 minutes to be accessible due to CDN propagation" -ForegroundColor Yellow
Write-Host "`n✅ Next step: Run deploy-backend.ps1 to connect the API" -ForegroundColor Green