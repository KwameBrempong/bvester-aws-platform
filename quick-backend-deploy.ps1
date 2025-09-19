# Quick Backend API Deployment to EC2
Write-Host "🚀 Quick Backend Deployment Guide" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`n📦 Option 1: Deploy to existing Elastic Beanstalk" -ForegroundColor Yellow
Write-Host "Your backend is already at:" -ForegroundColor Green
Write-Host "https://bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com" -ForegroundColor White

Write-Host "`n📝 To update your existing deployment:" -ForegroundColor Yellow
Write-Host "1. ZIP your backend folder"
Write-Host "2. Go to: https://eu-west-2.console.aws.amazon.com/elasticbeanstalk"
Write-Host "3. Click on 'bvester-backend-env'"
Write-Host "4. Click 'Upload and Deploy'"
Write-Host "5. Upload your ZIP file"

Write-Host "`n📦 Option 2: Create API subdomain" -ForegroundColor Yellow
$createSubdomain = Read-Host "Create api.bvester.com pointing to your backend? (y/n)"

if ($createSubdomain -eq 'y') {
    Write-Host "Creating DNS record..." -ForegroundColor Yellow
    
    # Create temporary JSON file
    $jsonContent = @{
        Changes = @(
            @{
                Action = "UPSERT"
                ResourceRecordSet = @{
                    Name = "api.bvester.com"
                    Type = "CNAME"
                    TTL = 300
                    ResourceRecords = @(
                        @{ Value = "bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com" }
                    )
                }
            }
        )
    } | ConvertTo-Json -Depth 10
    
    # Save to temp file and execute
    $tempFile = "$env:TEMP\route53-change.json"
    $jsonContent | Out-File -FilePath $tempFile -Encoding UTF8
    
    aws route53 change-resource-record-sets --hosted-zone-id Z0536316PULNXWJJQ1U8 --change-batch file://$tempFile
    
    # Clean up temp file
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    Write-Host "✅ DNS record created! api.bvester.com will be live in 5-10 minutes" -ForegroundColor Green
}

Write-Host "`n📦 Option 3: Update frontend to use API" -ForegroundColor Yellow
Write-Host "Update your frontend files to use:" -ForegroundColor Yellow
Write-Host "API URL: https://api.bvester.com" -ForegroundColor White
Write-Host "or" -ForegroundColor Gray
Write-Host "API URL: https://bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com" -ForegroundColor White

Write-Host "`n✅ Your backend endpoints:" -ForegroundColor Green
Write-Host "   Health: https://api.bvester.com/health" -ForegroundColor White
Write-Host "   Login: https://api.bvester.com/api/auth/login" -ForegroundColor White
Write-Host "   Register: https://api.bvester.com/api/auth/register" -ForegroundColor White
Write-Host "   Businesses: https://api.bvester.com/api/businesses" -ForegroundColor White

Write-Host "`n🎉 Backend deployment complete!" -ForegroundColor Green