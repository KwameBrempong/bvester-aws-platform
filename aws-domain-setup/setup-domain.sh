#!/bin/bash

# Bvester.com AWS Domain Setup Script
# Run this script to set up your custom domain on AWS

set -e

echo "🚀 Bvester Domain Setup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="bvester.com"
WWW_DOMAIN="www.bvester.com"
API_DOMAIN="api.bvester.com"
BUCKET_NAME="bvester-website-public"
WWW_BUCKET_NAME="www-bvester-website-public"
REGION="us-east-1"

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to wait for user confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping..."
        return 1
    fi
    return 0
}

# Step 1: Create Hosted Zone
echo ""
echo -e "${YELLOW}Step 1: Creating Route 53 Hosted Zone${NC}"
if confirm "Create hosted zone for $DOMAIN?"; then
    ZONE_OUTPUT=$(aws route53 create-hosted-zone \
        --name $DOMAIN \
        --caller-reference "bvester-$(date +%s)" \
        --hosted-zone-config Comment="Bvester Platform Production Domain" \
        --output json)
    
    ZONE_ID=$(echo $ZONE_OUTPUT | jq -r '.HostedZone.Id' | cut -d'/' -f3)
    echo -e "${GREEN}✅ Hosted zone created: $ZONE_ID${NC}"
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Update your domain nameservers:${NC}"
    echo $ZONE_OUTPUT | jq -r '.DelegationSet.NameServers[]'
    echo ""
    echo "Update these at your domain registrar before continuing!"
    read -p "Press enter when nameservers are updated..."
else
    read -p "Enter existing Hosted Zone ID: " ZONE_ID
fi

# Step 2: Request SSL Certificate
echo ""
echo -e "${YELLOW}Step 2: Requesting SSL Certificate${NC}"
if confirm "Request SSL certificate for $DOMAIN and $WWW_DOMAIN?"; then
    CERT_OUTPUT=$(aws acm request-certificate \
        --domain-name $DOMAIN \
        --subject-alternative-names $WWW_DOMAIN $API_DOMAIN \
        --validation-method DNS \
        --region $REGION \
        --output json)
    
    CERT_ARN=$(echo $CERT_OUTPUT | jq -r '.CertificateArn')
    echo -e "${GREEN}✅ Certificate requested: $CERT_ARN${NC}"
    
    echo "Waiting for certificate details to be available..."
    sleep 10
    
    # Add validation records to Route 53
    echo "Adding validation records to Route 53..."
    aws acm describe-certificate \
        --certificate-arn $CERT_ARN \
        --region $REGION \
        --output json | \
        jq -r '.Certificate.DomainValidationOptions[].ResourceRecord | 
        {
            "Changes": [{
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": .Name,
                    "Type": .Type,
                    "TTL": 300,
                    "ResourceRecords": [{"Value": .Value}]
                }
            }]
        }' | \
        aws route53 change-resource-record-sets \
            --hosted-zone-id $ZONE_ID \
            --change-batch file:///dev/stdin
    
    echo -e "${GREEN}✅ Validation records added${NC}"
    echo "Waiting for certificate validation (this may take 5-30 minutes)..."
    
    aws acm wait certificate-validated \
        --certificate-arn $CERT_ARN \
        --region $REGION
    
    echo -e "${GREEN}✅ Certificate validated!${NC}"
else
    read -p "Enter existing Certificate ARN: " CERT_ARN
fi

# Step 3: Create S3 Buckets
echo ""
echo -e "${YELLOW}Step 3: Creating S3 Buckets${NC}"
if confirm "Create S3 buckets for website hosting?"; then
    # Main bucket
    aws s3api create-bucket \
        --bucket $BUCKET_NAME \
        --region $REGION \
        --acl public-read
    
    echo -e "${GREEN}✅ Main bucket created: $BUCKET_NAME${NC}"
    
    # Configure static website hosting
    aws s3api put-bucket-website \
        --bucket $BUCKET_NAME \
        --website-configuration file://s3-website-config.json
    
    # Set bucket policy
    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file://s3-bucket-policy.json
    
    # WWW redirect bucket
    aws s3api create-bucket \
        --bucket $WWW_BUCKET_NAME \
        --region $REGION \
        --acl public-read
    
    aws s3api put-bucket-website \
        --bucket $WWW_BUCKET_NAME \
        --website-configuration file://s3-redirect-config.json
    
    echo -e "${GREEN}✅ S3 buckets configured${NC}"
fi

# Step 4: Create CloudFront Distribution
echo ""
echo -e "${YELLOW}Step 4: Creating CloudFront Distribution${NC}"
if confirm "Create CloudFront distribution?"; then
    # Update certificate ARN in config
    sed -i "s|CERTIFICATE_ARN_HERE|$CERT_ARN|g" cloudfront-config.json
    
    CF_OUTPUT=$(aws cloudfront create-distribution \
        --distribution-config file://cloudfront-config.json \
        --output json)
    
    CF_ID=$(echo $CF_OUTPUT | jq -r '.Distribution.Id')
    CF_DOMAIN=$(echo $CF_OUTPUT | jq -r '.Distribution.DomainName')
    
    echo -e "${GREEN}✅ CloudFront distribution created${NC}"
    echo "Distribution ID: $CF_ID"
    echo "Distribution Domain: $CF_DOMAIN"
    
    echo "Waiting for distribution to deploy (this may take 15-30 minutes)..."
    aws cloudfront wait distribution-deployed --id $CF_ID
    
    echo -e "${GREEN}✅ CloudFront distribution deployed!${NC}"
else
    read -p "Enter CloudFront Distribution Domain: " CF_DOMAIN
fi

# Step 5: Create Route 53 Records
echo ""
echo -e "${YELLOW}Step 5: Creating Route 53 Records${NC}"
if confirm "Create DNS records?"; then
    # Update CloudFront domain in config
    sed -i "s|CLOUDFRONT_DISTRIBUTION_DOMAIN|$CF_DOMAIN|g" route53-apex-record.json
    
    # Create A record for apex domain
    aws route53 change-resource-record-sets \
        --hosted-zone-id $ZONE_ID \
        --change-batch file://route53-apex-record.json
    
    # Create CNAME for www
    aws route53 change-resource-record-sets \
        --hosted-zone-id $ZONE_ID \
        --change-batch file://route53-www-record.json
    
    # Create CNAME for api
    aws route53 change-resource-record-sets \
        --hosted-zone-id $ZONE_ID \
        --change-batch file://route53-api-record.json
    
    echo -e "${GREEN}✅ DNS records created${NC}"
fi

# Step 6: Deploy Website Files
echo ""
echo -e "${YELLOW}Step 6: Deploying Website${NC}"
if confirm "Deploy website files to S3?"; then
    # Build the frontend
    cd ../web-app
    if [ -f "package.json" ]; then
        npm install
        npm run build
        
        # Sync to S3
        aws s3 sync ./build s3://$BUCKET_NAME \
            --delete \
            --cache-control "max-age=31536000,public" \
            --exclude "index.html" \
            --exclude "service-worker.js"
        
        # Upload index.html with no-cache
        aws s3 cp ./build/index.html s3://$BUCKET_NAME/ \
            --cache-control "no-cache,no-store,must-revalidate"
        
        echo -e "${GREEN}✅ Website deployed to S3${NC}"
        
        # Invalidate CloudFront cache
        if [ ! -z "$CF_ID" ]; then
            aws cloudfront create-invalidation \
                --distribution-id $CF_ID \
                --paths "/*"
            echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No package.json found, skipping build${NC}"
    fi
    cd ../aws-domain-setup
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Domain Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Your domain configuration:"
echo "- Main domain: https://$DOMAIN"
echo "- WWW domain: https://$WWW_DOMAIN"
echo "- API domain: https://$API_DOMAIN"
echo ""
echo "DNS propagation may take up to 48 hours."
echo ""
echo "Next steps:"
echo "1. Test your domain: curl -I https://$DOMAIN"
echo "2. Configure your backend API at https://$API_DOMAIN"
echo "3. Set up monitoring and alerts in CloudWatch"
echo "4. Configure WAF for additional security"
echo ""
echo -e "${GREEN}✨ Your Bvester platform is now live!${NC}"