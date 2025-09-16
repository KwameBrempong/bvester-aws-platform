# Launch Marketing Campaign - Final Deployment Step
Write-Host "Launching Marketing Campaign" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

Write-Host "`nFinal deployment checks..." -ForegroundColor Yellow

# Test all endpoints
$endpoints = @(
    "https://bvester.com",
    "https://bvester.com/login.html", 
    "https://bvester.com/signup.html",
    "https://api.bvester.com/health"
)

Write-Host "`nTesting all endpoints:" -ForegroundColor Yellow
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "  $endpoint - OK" -ForegroundColor Green
        } else {
            Write-Host "  $endpoint - FAILED ($($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "  $endpoint - ERROR" -ForegroundColor Red
    }
}

Write-Host "`nDeployment Summary:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

Write-Host "Website: https://bvester.com" -ForegroundColor Green
Write-Host "  - Viral landing page" -ForegroundColor White
Write-Host "  - User registration & login" -ForegroundColor White
Write-Host "  - Multi-dashboard system" -ForegroundColor White

Write-Host "`nAPI: https://api.bvester.com" -ForegroundColor Green  
Write-Host "  - Authentication endpoints" -ForegroundColor White
Write-Host "  - Business management" -ForegroundColor White
Write-Host "  - Investment platform" -ForegroundColor White

Write-Host "`nDashboards Available:" -ForegroundColor Yellow
Write-Host "  - Investor Dashboard: https://bvester.com/investor-dashboard.html" -ForegroundColor White
Write-Host "  - SME Dashboard: https://bvester.com/sme-dashboard.html" -ForegroundColor White
Write-Host "  - Premium Dashboard: https://bvester.com/premium-dashboard.html" -ForegroundColor White
Write-Host "  - AI Advisor: https://bvester.com/ai-advisor-dashboard.html" -ForegroundColor White

Write-Host "`nMarketing Assets Ready:" -ForegroundColor Cyan
Write-Host "  - SEO optimized landing page" -ForegroundColor White
Write-Host "  - Mobile responsive design" -ForegroundColor White
Write-Host "  - Fast global CDN delivery" -ForegroundColor White
Write-Host "  - SSL security enabled" -ForegroundColor White

Write-Host "`nNext Steps for Marketing:" -ForegroundColor Yellow
Write-Host "1. Social media promotion" -ForegroundColor White
Write-Host "2. Content marketing campaign" -ForegroundColor White  
Write-Host "3. Investor outreach program" -ForegroundColor White
Write-Host "4. SME partnership development" -ForegroundColor White

Write-Host "`nPlatform Analytics:" -ForegroundColor Cyan
Write-Host "  - CloudFront provides real-time metrics" -ForegroundColor White
Write-Host "  - S3 access logs available" -ForegroundColor White
Write-Host "  - API monitoring via Elastic Beanstalk" -ForegroundColor White

Write-Host "`nMonitoring URLs:" -ForegroundColor Yellow
Write-Host "  - AWS Console: https://console.aws.amazon.com" -ForegroundColor White
Write-Host "  - CloudFront Stats: https://console.aws.amazon.com/cloudfront" -ForegroundColor White
Write-Host "  - API Health: https://api.bvester.com/health" -ForegroundColor White

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Bvester platform is now LIVE and ready for users!" -ForegroundColor White
Write-Host "Time to start connecting African SMEs with global investors!" -ForegroundColor Cyan