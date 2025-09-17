@echo off
REM 🚀 BVESTER AWS DEPLOYMENT SCRIPT (Windows)
REM Deploys the complete Bvester platform to AWS

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=prod

set REGION=us-east-1
set STACK_NAME=bvester-%ENVIRONMENT%
set BUCKET_NAME=bvester-web-%ENVIRONMENT%

echo 🚀 Starting Bvester deployment to AWS...
echo Environment: %ENVIRONMENT%
echo Region: %REGION%
echo Stack: %STACK_NAME%

REM Check AWS CLI
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS CLI not found. Please install AWS CLI.
    pause
    exit /b 1
)

REM Check AWS credentials
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS credentials not configured. Please run 'aws configure'
    pause
    exit /b 1
)

echo ✅ AWS CLI configured

REM Build the application
echo 📦 Building application...
call npm run build:web

if not exist "dist" (
    echo ❌ Build failed - dist directory not found
    pause
    exit /b 1
)

echo ✅ Application built successfully

REM Create S3 bucket for web hosting
echo 🪣 Creating S3 bucket...
aws s3 mb s3://%BUCKET_NAME% --region %REGION% 2>nul || echo Bucket %BUCKET_NAME% already exists

REM Configure bucket for static website hosting
aws s3 website s3://%BUCKET_NAME% --index-document index.html --error-document index.html

REM Upload built files to S3
echo ⬆️  Uploading files to S3...
aws s3 sync ./dist s3://%BUCKET_NAME% --delete --cache-control max-age=31536000,public

REM Make bucket public for website hosting
echo {^
  "Version": "2012-10-17",^
  "Statement": [^
    {^
      "Sid": "PublicReadGetObject",^
      "Effect": "Allow",^
      "Principal": "*",^
      "Action": "s3:GetObject",^
      "Resource": "arn:aws:s3:::%BUCKET_NAME%/*"^
    }^
  ]^
} > bucket-policy.json

aws s3api put-bucket-policy --bucket %BUCKET_NAME% --policy file://bucket-policy.json
del bucket-policy.json

echo ✅ S3 bucket configured and files uploaded

REM Get website URL
for /f "delims=" %%i in ('aws s3api get-bucket-location --bucket %BUCKET_NAME% --query LocationConstraint --output text') do set BUCKET_REGION=%%i
if "%BUCKET_REGION%"=="None" set BUCKET_REGION=us-east-1

set WEBSITE_URL=http://%BUCKET_NAME%.s3-website-%BUCKET_REGION%.amazonaws.com

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Deployment Summary:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🌐 Website URL: %WEBSITE_URL%
echo 🪣 S3 Bucket: %BUCKET_NAME%
echo.
echo 🔧 Next Steps:
echo 1. Configure custom domain (bvester.com) to point to S3 bucket
echo 2. Set up CloudFront distribution for better performance
echo 3. Configure SSL certificate for HTTPS
echo 4. Set up Route 53 for DNS management
echo.
echo ✅ Bvester is now live on AWS!

pause