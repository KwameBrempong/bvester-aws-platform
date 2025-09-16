# Bvester Backend API Deployment Script
# This script deploys the backend API to AWS Elastic Beanstalk or EC2

Write-Host "🚀 Deploying Bvester Backend API" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$BACKEND_PATH = "C:\Users\BREMPONG\Desktop\dev\bvester\backend"
$ZONE_ID = "Z0536316PULNXWJJQ1U8"  # Your Route 53 Hosted Zone ID

# Function to check command availability
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check AWS CLI
if (-not (Test-Command "aws")) {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ AWS CLI found" -ForegroundColor Green

# Option 1: Deploy to Elastic Beanstalk (Recommended)
Write-Host "`n📦 Option 1: Deploy to AWS Elastic Beanstalk" -ForegroundColor Yellow
$useEB = Read-Host "Deploy to Elastic Beanstalk? (y/n)"

if ($useEB -eq 'y') {
    # Check if EB CLI is installed
    if (Test-Command "eb") {
        Write-Host "✅ EB CLI found" -ForegroundColor Green
        
        Set-Location $BACKEND_PATH
        
        # Initialize EB if not already done
        if (-not (Test-Path ".elasticbeanstalk")) {
            Write-Host "Initializing Elastic Beanstalk..." -ForegroundColor Yellow
            eb init -p node.js-18 --region eu-west-2 bvester-backend
        }
        
        # Create environment if doesn't exist
        Write-Host "Creating/Updating EB environment..." -ForegroundColor Yellow
        eb create bvester-api-prod --single --envvars `
            NODE_ENV=production,`
            JWT_SECRET=$env:JWT_SECRET,`
            STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY,`
            SENDGRID_API_KEY=$env:SENDGRID_API_KEY
        
        # Deploy
        Write-Host "Deploying to Elastic Beanstalk..." -ForegroundColor Yellow
        eb deploy
        
        # Get the EB URL
        $EB_URL = eb status | Select-String "CNAME:" | ForEach-Object { $_.ToString().Split(":")[1].Trim() }
        Write-Host "✅ Backend deployed to: $EB_URL" -ForegroundColor Green
        
        # Update Route 53
        Write-Host "`nUpdating DNS record for api.bvester.com..." -ForegroundColor Yellow
        
        $recordSet = @{
            Changes = @(
                @{
                    Action = "UPSERT"
                    ResourceRecordSet = @{
                        Name = "api.bvester.com"
                        Type = "CNAME"
                        TTL = 300
                        ResourceRecords = @(
                            @{ Value = $EB_URL }
                        )
                    }
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $recordSet | aws route53 change-resource-record-sets `
            --hosted-zone-id $ZONE_ID `
            --change-batch file://-
        
        Write-Host "✅ DNS record updated" -ForegroundColor Green
    } else {
        Write-Host "⚠️  EB CLI not found. Installing..." -ForegroundColor Yellow
        Write-Host "Run: pip install awsebcli" -ForegroundColor Cyan
        Write-Host "Then run this script again." -ForegroundColor Cyan
        exit 1
    }
}

# Option 2: Deploy to EC2 (Manual)
else {
    Write-Host "`n📦 Option 2: Manual EC2 Deployment Instructions" -ForegroundColor Yellow
    Write-Host @"

To deploy the backend manually to EC2:

1. Launch an EC2 instance:
   - AMI: Amazon Linux 2 or Ubuntu 22.04
   - Instance type: t3.small (minimum)
   - Security group: Allow ports 22, 80, 443, 3001

2. SSH into your instance and run:
   ``````bash
   # Install Node.js
   curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs git

   # Clone your repository
   git clone https://github.com/YOUR_USERNAME/bvester.git
   cd bvester/backend

   # Install dependencies
   npm install

   # Install PM2
   sudo npm install -g pm2

   # Create .env file
   cat > .env.production << EOF
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your_jwt_secret_here
   STRIPE_SECRET_KEY=your_stripe_key_here
   SENDGRID_API_KEY=your_sendgrid_key_here
   DATABASE_URL=your_database_url_here
   EOF

   # Start with PM2
   pm2 start server-local.js --name bvester-api
   pm2 startup
   pm2 save

   # Install nginx
   sudo yum install -y nginx
   
   # Configure nginx as reverse proxy
   sudo nano /etc/nginx/conf.d/bvester.conf
   ``````

3. Add nginx configuration:
   ``````
   server {
       listen 80;
       server_name api.bvester.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade `$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host `$host;
           proxy_cache_bypass `$http_upgrade;
       }
   }
   ``````

4. Start nginx:
   ``````bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ``````

5. Update Route 53 to point api.bvester.com to your EC2 public IP
"@ -ForegroundColor White
}

# Option 3: Deploy to Lambda (Serverless)
Write-Host "`n📦 Option 3: Deploy as Lambda Function" -ForegroundColor Yellow
$useLambda = Read-Host "Deploy as Lambda function? (y/n)"

if ($useLambda -eq 'y') {
    Set-Location $BACKEND_PATH
    
    # Create serverless configuration
    Write-Host "Creating serverless configuration..." -ForegroundColor Yellow
    
    @"
service: bvester-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    JWT_SECRET: `${env:JWT_SECRET}
    STRIPE_SECRET_KEY: `${env:STRIPE_SECRET_KEY}
    SENDGRID_API_KEY: `${env:SENDGRID_API_KEY}

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
"@ | Set-Content "serverless.yml"

    # Create Lambda handler
    @"
const serverless = require('serverless-http');
const app = require('./server-local.js');

module.exports.handler = serverless(app);
"@ | Set-Content "lambda.js"

    Write-Host "Installing serverless framework..." -ForegroundColor Yellow
    npm install -g serverless
    npm install --save serverless-http
    
    Write-Host "Deploying to AWS Lambda..." -ForegroundColor Yellow
    serverless deploy
}

# Test the API
Write-Host "`n🧪 Testing API Connection..." -ForegroundColor Cyan
$testUrl = "https://api.bvester.com/health"

try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API is live and responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API not yet accessible. It may take a few minutes." -ForegroundColor Yellow
    Write-Host "Test manually at: $testUrl" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "✨ BACKEND DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`n📍 Your API endpoints:" -ForegroundColor Cyan
Write-Host "   Health Check: https://api.bvester.com/health" -ForegroundColor White
Write-Host "   Login: https://api.bvester.com/api/auth/login" -ForegroundColor White
Write-Host "   Register: https://api.bvester.com/api/auth/register" -ForegroundColor White
Write-Host "   Businesses: https://api.bvester.com/api/businesses" -ForegroundColor White
Write-Host "   Investments: https://api.bvester.com/api/investments" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update frontend API URLs to point to api.bvester.com"
Write-Host "   2. Test authentication flow"
Write-Host "   3. Enable CORS for bvester.com"
Write-Host "   4. Set up SSL certificate for API"

Write-Host "`n✅ Run enable-features.ps1 next to wire up interactive features!" -ForegroundColor Green