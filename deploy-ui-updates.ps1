# Deploy UI Updates to bvester.com
# Deploys the new black/gold/white theme and dashboard improvements
Write-Host "Deploying Bvester UI Updates" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$S3_BUCKET = "bvester-web-prod-eu"
$CLOUDFRONT_ID = "E1FKHA2UF8CJ5A"
$REGION = "eu-west-2"

# Navigate to web-app directory
Set-Location "C:\Users\BREMPONG\Desktop\dev\bvester\web-app"

Write-Host "Deploying updated files to AWS S3..." -ForegroundColor Yellow
Write-Host ""

# List of files to deploy
$filesToDeploy = @(
    # Core pages with new theme
    "index.html",
    "index-premium.html",

    # Dashboard files
    "sme-dashboard-enhanced.html",
    "investment-assessment.html",

    # CSS files
    "css/global-design-system.css",

    # Authentication pages (if they exist)
    "login.html",
    "signup.html",
    "auth.html"
)

# Check AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✓ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    aws sts get-caller-identity --region $REGION | Out-Null
    Write-Host "✓ AWS credentials configured" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ AWS credentials not configured. Please run 'aws configure'" -ForegroundColor Red
    exit 1
}

# Deploy each file
foreach ($file in $filesToDeploy) {
    if (Test-Path $file) {
        # Determine content type
        $contentType = "text/html"
        if ($file -like "*.css") {
            $contentType = "text/css"
        } elseif ($file -like "*.js") {
            $contentType = "application/javascript"
        }

        # For dashboard files, upload with standard naming
        $targetFile = $file
        if ($file -eq "sme-dashboard-enhanced.html") {
            # Upload both as enhanced version and replace the old one
            Write-Host "Uploading $file as sme-dashboard-enhanced.html..." -ForegroundColor White
            aws s3 cp $file s3://$S3_BUCKET/sme-dashboard-enhanced.html `
                --content-type $contentType `
                --cache-control "max-age=3600" `
                --region $REGION

            Write-Host "Uploading $file as sme-dashboard.html (replacing old)..." -ForegroundColor White
            aws s3 cp $file s3://$S3_BUCKET/sme-dashboard.html `
                --content-type $contentType `
                --cache-control "max-age=3600" `
                --region $REGION
        }
        elseif ($file -eq "index-premium.html") {
            # Upload the premium version
            Write-Host "Uploading $file..." -ForegroundColor White
            aws s3 cp $file s3://$S3_BUCKET/$file `
                --content-type $contentType `
                --cache-control "max-age=3600" `
                --region $REGION
        }
        else {
            Write-Host "Uploading $file..." -ForegroundColor White
            aws s3 cp $file s3://$S3_BUCKET/$targetFile `
                --content-type $contentType `
                --cache-control "max-age=3600" `
                --region $REGION
        }

        Write-Host "✓ Uploaded $file" -ForegroundColor Green
    } else {
        Write-Host "⚠ File not found: $file (skipping)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Creating CloudFront invalidation..." -ForegroundColor Yellow

# Invalidate CloudFront cache
try {
    $invalidation = aws cloudfront create-invalidation `
        --distribution-id $CLOUDFRONT_ID `
        --paths "/*" `
        --region us-east-1 `
        --output json | ConvertFrom-Json

    Write-Host "✓ CloudFront invalidation created: $($invalidation.Invalidation.Id)" -ForegroundColor Green
} catch {
    Write-Host "⚠ CloudFront invalidation failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "You may need to manually clear the cache from AWS Console" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Updated URLs:" -ForegroundColor Cyan
Write-Host "  Homepage: https://bvester.com" -ForegroundColor White
Write-Host "  Premium Homepage: https://bvester.com/index-premium.html" -ForegroundColor White
Write-Host "  SME Dashboard: https://bvester.com/sme-dashboard.html" -ForegroundColor White
Write-Host "  Enhanced Dashboard: https://bvester.com/sme-dashboard-enhanced.html" -ForegroundColor White
Write-Host "  Investment Assessment: https://bvester.com/investment-assessment.html" -ForegroundColor White
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor Yellow
Write-Host "  ✓ New black/gold/white premium theme" -ForegroundColor White
Write-Host "  ✓ Enhanced dashboard with design system integration" -ForegroundColor White
Write-Host "  ✓ Improved accessibility features" -ForegroundColor White
Write-Host "  ✓ Mobile responsive design" -ForegroundColor White
Write-Host "  ✓ Standardized visual hierarchy" -ForegroundColor White
Write-Host ""
Write-Host "Note: CloudFront cache invalidation may take 5-10 minutes to propagate." -ForegroundColor Yellow
Write-Host "If you do not see changes immediately, try clearing your browser cache." -ForegroundColor Yellow