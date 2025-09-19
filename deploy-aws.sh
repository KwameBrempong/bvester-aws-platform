#!/bin/bash

# 🚀 BVESTER AWS DEPLOYMENT SCRIPT
# Deploys the complete Bvester platform to AWS
# Usage: ./deploy-aws.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-prod}
REGION="us-east-1"
STACK_NAME="bvester-${ENVIRONMENT}"
DOMAIN_NAME="bvester.com"
API_DOMAIN="api.bvester.com"

echo "🚀 Starting Bvester deployment to AWS..."
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo "Stack: ${STACK_NAME}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure AWS CLI."
    exit 1
fi

# Check if user is logged in
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
}

echo "✅ AWS CLI configured"

# Build the application
echo "📦 Building application..."
npm run build:web

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Application built successfully"

# Deploy DynamoDB tables
echo "🗄️  Creating DynamoDB tables..."

# Users table
aws dynamodb create-table \
  --region ${REGION} \
  --table-name bvester-users-${ENVIRONMENT} \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=email-index,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager || echo "Table bvester-users-${ENVIRONMENT} already exists"

# Businesses table
aws dynamodb create-table \
  --region ${REGION} \
  --table-name bvester-businesses-${ENVIRONMENT} \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=ownerId,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=ownerId-index,KeySchema=[{AttributeName=ownerId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager || echo "Table bvester-businesses-${ENVIRONMENT} already exists"

# Transactions table
aws dynamodb create-table \
  --region ${REGION} \
  --table-name bvester-transactions-${ENVIRONMENT} \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=userId-createdAt-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager || echo "Table bvester-transactions-${ENVIRONMENT} already exists"

# Assessments table
aws dynamodb create-table \
  --region ${REGION} \
  --table-name bvester-business-health-assessments-${ENVIRONMENT} \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=completedAt,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=completedAt,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=userId-completedAt-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=completedAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager || echo "Table bvester-business-health-assessments-${ENVIRONMENT} already exists"

# Chat messages table
aws dynamodb create-table \
  --region ${REGION} \
  --table-name bvester-chat-messages-${ENVIRONMENT} \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=userId-createdAt-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager || echo "Table bvester-chat-messages-${ENVIRONMENT} already exists"

echo "✅ DynamoDB tables created"

# Create S3 bucket for web hosting
echo "🪣 Creating S3 bucket..."
BUCKET_NAME="bvester-web-${ENVIRONMENT}"

aws s3 mb s3://${BUCKET_NAME} --region ${REGION} || echo "Bucket ${BUCKET_NAME} already exists"

# Configure bucket for static website hosting
aws s3 website s3://${BUCKET_NAME} \
  --index-document index.html \
  --error-document index.html

# Upload built files to S3
echo "⬆️  Uploading files to S3..."
aws s3 sync ./dist s3://${BUCKET_NAME} --delete --cache-control max-age=31536000,public

# Make bucket public for website hosting
aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'${BUCKET_NAME}'/*"
      }
    ]
  }'

echo "✅ S3 bucket configured and files uploaded"

# Create API Gateway (if not exists)
echo "🌐 Setting up API Gateway..."

# This would typically use CloudFormation or Terraform for complex setups
# For now, we'll create a simple Lambda function URL

# Package and deploy Lambda function
echo "λ Creating Lambda function..."

# Create deployment package
zip -r function.zip api/ src/services/ node_modules/ package.json

# Create or update Lambda function
aws lambda create-function \
  --region ${REGION} \
  --function-name bvester-api-${ENVIRONMENT} \
  --runtime nodejs18.x \
  --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role \
  --handler api/index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables='{NODE_ENV='${ENVIRONMENT}',DYNAMODB_REGION='${REGION}'}' \
  --no-cli-pager || \
aws lambda update-function-code \
  --region ${REGION} \
  --function-name bvester-api-${ENVIRONMENT} \
  --zip-file fileb://function.zip \
  --no-cli-pager

# Create function URL for API access
FUNCTION_URL=$(aws lambda create-function-url-config \
  --region ${REGION} \
  --function-name bvester-api-${ENVIRONMENT} \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["https://bvester.com", "https://www.bvester.com"],
    "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "MaxAge": 300
  }' \
  --query FunctionUrl \
  --output text 2>/dev/null || \
aws lambda get-function-url-config \
  --region ${REGION} \
  --function-name bvester-api-${ENVIRONMENT} \
  --query FunctionUrl \
  --output text)

echo "✅ Lambda function deployed"
echo "📡 API URL: ${FUNCTION_URL}"

# Clean up
rm -f function.zip

# Output deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Website URL: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo "📡 API URL: ${FUNCTION_URL}"
echo "🗄️  DynamoDB Tables: bvester-*-${ENVIRONMENT}"
echo "🪣 S3 Bucket: ${BUCKET_NAME}"
echo "λ Lambda Function: bvester-api-${ENVIRONMENT}"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure custom domain (${DOMAIN_NAME}) to point to S3 bucket"
echo "2. Set up CloudFront distribution for better performance"
echo "3. Configure SSL certificate for HTTPS"
echo "4. Set up Route 53 for DNS management"
echo "5. Update app configuration with API URL: ${FUNCTION_URL}"
echo ""
echo "💡 To configure custom domain, run:"
echo "   ./configure-domain.sh ${DOMAIN_NAME} ${BUCKET_NAME}"
echo ""
echo "✅ Bvester is now live on AWS!"