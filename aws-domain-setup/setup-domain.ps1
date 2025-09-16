# Bvester.com AWS Domain Setup Script for Windows
# Run this script to set up your custom domain on AWS

Write-Host "🚀 Bvester Domain Setup Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DOMAIN = "bvester.com"
$WWW_DOMAIN = "www.bvester.com"
$API_DOMAIN = "api.bvester.com"
$BUCKET_NAME = "bvester-website-public"
$WWW_BUCKET_NAME = "www-bvester-website-public"
$REGION = "us-east-1"

# Check AWS CLI
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS CLI configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured" -ForegroundColor Red
    Write-Host "Please run 'aws configure' first"
    exit 1
}

# Function for user confirmation
function Confirm-Action {
    param($Message)
    $response = Read-Host "$Message (y/n)"
    return $response -eq 'y'
}

# Step 1: Create Hosted Zone
Write-Host ""
Write-Host "Step 1: Creating Route 53 Hosted Zone" -ForegroundColor Yellow
if (Confirm-Action "Create hosted zone for $DOMAIN?") {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $zoneOutput = aws route53 create-hosted-zone `
        --name $DOMAIN `
        --caller-reference "bvester-$timestamp" `
        --hosted-zone-config Comment="Bvester Platform Production Domain" `
        --output json | ConvertFrom-Json
    
    $ZONE_ID = $zoneOutput.HostedZone.Id.Split('/')[-1]
    Write-Host "✅ Hosted zone created: $ZONE_ID" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update your domain nameservers:" -ForegroundColor Yellow
    $zoneOutput.DelegationSet.NameServers | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Read-Host "Update these at your domain registrar. Press Enter when done"
} else {
    $ZONE_ID = Read-Host "Enter existing Hosted Zone ID"
}

# Step 2: Request SSL Certificate
Write-Host ""
Write-Host "Step 2: Requesting SSL Certificate" -ForegroundColor Yellow
if (Confirm-Action "Request SSL certificate for $DOMAIN and $WWW_DOMAIN?") {
    $certOutput = aws acm request-certificate `
        --domain-name $DOMAIN `
        --subject-alternative-names $WWW_DOMAIN,$API_DOMAIN `
        --validation-method DNS `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    $CERT_ARN = $certOutput.CertificateArn
    Write-Host "✅ Certificate requested: $CERT_ARN" -ForegroundColor Green
    
    Write-Host "Waiting for certificate details..."
    Start-Sleep -Seconds 10
    
    # Get validation records
    $certDetails = aws acm describe-certificate `
        --certificate-arn $CERT_ARN `
        --region $REGION `
        --output json | ConvertFrom-Json
    
    # Add validation records
    foreach ($option in $certDetails.Certificate.DomainValidationOptions) {
        if ($option.ResourceRecord) {
            $changeSet = @{
                Changes = @(
                    @{
                        Action = "UPSERT"
                        ResourceRecordSet = @{
                            Name = $option.ResourceRecord.Name
                            Type = $option.ResourceRecord.Type
                            TTL = 300
                            ResourceRecords = @(
                                @{ Value = $option.ResourceRecord.Value }
                            )
                        }
                    }
                )
            } | ConvertTo-Json -Depth 10
            
            $changeSet | aws route53 change-resource-record-sets `
                --hosted-zone-id $ZONE_ID `
                --change-batch file://-
        }
    }
    
    Write-Host "✅ Validation records added" -ForegroundColor Green
    Write-Host "Waiting for certificate validation (5-30 minutes)..."
    
    aws acm wait certificate-validated `
        --certificate-arn $CERT_ARN `
        --region $REGION
    
    Write-Host "✅ Certificate validated!" -ForegroundColor Green
} else {
    $CERT_ARN = Read-Host "Enter existing Certificate ARN"
}

# Step 3: Create S3 Buckets
Write-Host ""
Write-Host "Step 3: Creating S3 Buckets" -ForegroundColor Yellow
if (Confirm-Action "Create S3 buckets for website hosting?") {
    # Main bucket
    aws s3api create-bucket `
        --bucket $BUCKET_NAME `
        --region $REGION `
        --acl public-read
    
    Write-Host "✅ Main bucket created: $BUCKET_NAME" -ForegroundColor Green
    
    # Configure static website hosting
    aws s3api put-bucket-website `
        --bucket $BUCKET_NAME `
        --website-configuration file://s3-website-config.json
    
    # Set bucket policy
    aws s3api put-bucket-policy `
        --bucket $BUCKET_NAME `
        --policy file://s3-bucket-policy.json
    
    # WWW redirect bucket
    aws s3api create-bucket `
        --bucket $WWW_BUCKET_NAME `
        --region $REGION `
        --acl public-read
    
    aws s3api put-bucket-website `
        --bucket $WWW_BUCKET_NAME `
        --website-configuration file://s3-redirect-config.json
    
    Write-Host "✅ S3 buckets configured" -ForegroundColor Green
}

# Step 4: Create CloudFront Distribution
Write-Host ""
Write-Host "Step 4: Creating CloudFront Distribution" -ForegroundColor Yellow
if (Confirm-Action "Create CloudFront distribution?") {
    # Update certificate ARN in config
    $config = Get-Content -Path "cloudfront-config.json" -Raw
    $config = $config.Replace("CERTIFICATE_ARN_HERE", $CERT_ARN)
    $config | Set-Content -Path "cloudfront-config-temp.json"
    
    $cfOutput = aws cloudfront create-distribution `
        --distribution-config file://cloudfront-config-temp.json `
        --output json | ConvertFrom-Json
    
    $CF_ID = $cfOutput.Distribution.Id
    $CF_DOMAIN = $cfOutput.Distribution.DomainName
    
    Write-Host "✅ CloudFront distribution created" -ForegroundColor Green
    Write-Host "Distribution ID: $CF_ID"
    Write-Host "Distribution Domain: $CF_DOMAIN"
    
    Write-Host "Waiting for distribution to deploy (15-30 minutes)..."
    aws cloudfront wait distribution-deployed --id $CF_ID
    
    Write-Host "✅ CloudFront distribution deployed!" -ForegroundColor Green
    
    # Clean up temp file
    Remove-Item "cloudfront-config-temp.json"
} else {
    $CF_DOMAIN = Read-Host "Enter CloudFront Distribution Domain"
}

# Step 5: Create Route 53 Records
Write-Host ""
Write-Host "Step 5: Creating Route 53 Records" -ForegroundColor Yellow
if (Confirm-Action "Create DNS records?") {
    # Create apex domain record
    $apexRecord = Get-Content -Path "route53-apex-record.json" -Raw
    $apexRecord = $apexRecord.Replace("CLOUDFRONT_DISTRIBUTION_DOMAIN", $CF_DOMAIN.Replace(".cloudfront.net", ""))
    $apexRecord | aws route53 change-resource-record-sets `
        --hosted-zone-id $ZONE_ID `
        --change-batch file://-
    
    # Create www record
    Get-Content -Path "route53-www-record.json" -Raw | 
        aws route53 change-resource-record-sets `
        --hosted-zone-id $ZONE_ID `
        --change-batch file://-
    
    # Create api record
    Get-Content -Path "route53-api-record.json" -Raw | 
        aws route53 change-resource-record-sets `
        --hosted-zone-id $ZONE_ID `
        --change-batch file://-
    
    Write-Host "✅ DNS records created" -ForegroundColor Green
}

# Step 6: Deploy Website
Write-Host ""
Write-Host "Step 6: Deploying Website" -ForegroundColor Yellow
if (Confirm-Action "Deploy website files to S3?") {
    Set-Location ../web-app
    if (Test-Path "package.json") {
        npm install
        npm run build
        
        # Sync to S3
        aws s3 sync ./build s3://$BUCKET_NAME `
            --delete `
            --cache-control "max-age=31536000,public" `
            --exclude "index.html" `
            --exclude "service-worker.js"
        
        # Upload index.html with no-cache
        aws s3 cp ./build/index.html s3://$BUCKET_NAME/ `
            --cache-control "no-cache,no-store,must-revalidate"
        
        Write-Host "✅ Website deployed to S3" -ForegroundColor Green
        
        # Invalidate CloudFront cache
        if ($CF_ID) {
            aws cloudfront create-invalidation `
                --distribution-id $CF_ID `
                --paths "/*"
            Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  No package.json found, skipping build" -ForegroundColor Yellow
    }
    Set-Location ../aws-domain-setup
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "🎉 Domain Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your domain configuration:"
Write-Host "- Main domain: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "- WWW domain: https://$WWW_DOMAIN" -ForegroundColor Cyan
Write-Host "- API domain: https://$API_DOMAIN" -ForegroundColor Cyan
Write-Host ""
Write-Host "DNS propagation may take up to 48 hours."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test your domain: curl -I https://$DOMAIN"
Write-Host "2. Configure your backend API at https://$API_DOMAIN"
Write-Host "3. Set up monitoring and alerts in CloudWatch"
Write-Host "4. Configure WAF for additional security"
Write-Host ""
Write-Host "✨ Your Bvester platform is now live!" -ForegroundColor Green