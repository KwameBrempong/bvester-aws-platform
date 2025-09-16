# Deploy Live to bvester.com
Write-Host "Deploying Bvester Platform Live" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Create production versions with live API endpoint
$PRODUCTION_API = "https://bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com"

Write-Host "`nCreating production versions with live API..." -ForegroundColor Yellow

# Update login.html for production
Write-Host "Updating login.html for production..." -ForegroundColor Yellow
$loginContent = Get-Content -Path "login.html" -Raw
$loginContentProd = $loginContent -replace "http://localhost:8080", $PRODUCTION_API
$loginContentProd | Out-File -FilePath "login-prod.html" -Encoding UTF8

# Update signup.html for production  
Write-Host "Updating signup.html for production..." -ForegroundColor Yellow
$signupContent = Get-Content -Path "signup.html" -Raw
$signupContentProd = $signupContent -replace "http://localhost:8080", $PRODUCTION_API
$signupContentProd | Out-File -FilePath "signup-prod.html" -Encoding UTF8

# Upload all files to S3
Write-Host "`nUploading files to S3..." -ForegroundColor Yellow

$files = @(
    "index.html",
    "login-prod.html",
    "signup-prod.html", 
    "investor-dashboard.html",
    "sme-dashboard.html",
    "premium-dashboard.html"
)

foreach ($file in $files) {
    $targetName = $file -replace "-prod", ""
    Write-Host "Uploading $file as $targetName..." -ForegroundColor White
    aws s3 cp $file s3://bvester-website-public/$targetName --content-type "text/html"
}

# Invalidate CloudFront cache
Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E2QJJZQZQZQZQZ --paths "/*"

# Test the live deployment
Write-Host "`nTesting live deployment..." -ForegroundColor Yellow
try {
    $siteTest = Invoke-WebRequest -Uri "https://bvester.com" -Method GET -TimeoutSec 10
    if ($siteTest.StatusCode -eq 200) {
        Write-Host "Website: LIVE" -ForegroundColor Green
    }
} catch {
    Write-Host "Website test failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $apiTest = Invoke-RestMethod -Uri "$PRODUCTION_API/" -Method GET -TimeoutSec 10
    Write-Host "API: $($apiTest.status)" -ForegroundColor Green
} catch {
    Write-Host "API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Live URLs:" -ForegroundColor Cyan
Write-Host "  Website: https://bvester.com" -ForegroundColor White
Write-Host "  Login: https://bvester.com/login.html" -ForegroundColor White  
Write-Host "  Signup: https://bvester.com/signup.html" -ForegroundColor White
Write-Host "  API: $PRODUCTION_API" -ForegroundColor White

Write-Host "`nDemo Accounts:" -ForegroundColor Yellow
Write-Host "  SME: sme@demo.com / Demo123!" -ForegroundColor White
Write-Host "  Investor: investor@demo.com / Demo123!" -ForegroundColor White

Write-Host "`nUsers can now register and login on the live site!" -ForegroundColor Green