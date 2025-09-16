# Create api.bvester.com subdomain
Write-Host "🚀 Creating api.bvester.com subdomain" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Create the DNS record
Write-Host "`nCreating DNS record for api.bvester.com..." -ForegroundColor Yellow

# Create temp JSON file
$jsonPath = "$env:TEMP\api-dns-record.json"

@"
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.bvester.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [
        {"Value": "bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com"}
      ]
    }
  }]
}
"@ | Out-File -FilePath $jsonPath -Encoding UTF8

# Execute the AWS command
try {
    $result = aws route53 change-resource-record-sets --hosted-zone-id Z0536316PULNXWJJQ1U8 --change-batch file://$jsonPath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! DNS record created!" -ForegroundColor Green
        Write-Host "`nYour API will be available at:" -ForegroundColor Cyan
        Write-Host "   https://api.bvester.com" -ForegroundColor White
        Write-Host "`nDNS propagation may take 5-30 minutes" -ForegroundColor Yellow
        
        Write-Host "`nTest your API endpoints:" -ForegroundColor Cyan
        Write-Host "   https://api.bvester.com/health" -ForegroundColor White
        Write-Host "   https://api.bvester.com/api/auth/login" -ForegroundColor White
        Write-Host "   https://api.bvester.com/api/businesses" -ForegroundColor White
    } else {
        Write-Host "Error creating DNS record:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Clean up
Remove-Item $jsonPath -ErrorAction SilentlyContinue

Write-Host "`nDone!" -ForegroundColor Green