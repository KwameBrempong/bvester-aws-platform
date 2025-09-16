#!/bin/bash

# AWS Infrastructure Setup Script for bvester.com
# This script sets up the complete AWS infrastructure using CloudFormation

set -euo pipefail

# Configuration
DOMAIN_NAME="bvester.com"
AWS_REGION="us-east-1"  # Required for CloudFront certificates
STACK_PREFIX="bvester"
PROFILE_NAME="default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$PROFILE_NAME" &> /dev/null; then
        error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        warning "jq not found. Some features may not work properly."
    fi
    
    success "Prerequisites check completed"
}

# Wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    log "Waiting for stack '$stack_name' to complete $operation..."
    
    aws cloudformation wait stack-${operation}-complete \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME"
    
    if [ $? -eq 0 ]; then
        success "Stack '$stack_name' $operation completed successfully"
    else
        error "Stack '$stack_name' $operation failed"
        exit 1
    fi
}

# Deploy CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters=$3
    
    log "Deploying stack: $stack_name"
    
    # Check if stack exists
    if aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" &> /dev/null; then
        
        log "Stack exists, updating..."
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "$parameters" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION" \
            --profile "$PROFILE_NAME" || {
                # Check if no updates needed
                if aws cloudformation describe-stack-events \
                    --stack-name "$stack_name" \
                    --region "$AWS_REGION" \
                    --profile "$PROFILE_NAME" \
                    --max-items 1 \
                    --query 'StackEvents[0].ResourceStatusReason' \
                    --output text | grep -q "No updates"; then
                    warning "No updates are to be performed for stack $stack_name"
                    return 0
                else
                    error "Failed to update stack $stack_name"
                    return 1
                fi
            }
        wait_for_stack "$stack_name" "update"
    else
        log "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "$parameters" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION" \
            --profile "$PROFILE_NAME"
        wait_for_stack "$stack_name" "create"
    fi
}

# Get stack output
get_stack_output() {
    local stack_name=$1
    local output_key=$2
    
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text
}

# Main setup function
main() {
    log "Starting AWS infrastructure setup for $DOMAIN_NAME"
    
    # Check prerequisites
    check_prerequisites
    
    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    CLOUDFORMATION_DIR="$SCRIPT_DIR/../cloudformation"
    
    # Step 1: Route 53 Setup
    log "Step 1: Setting up Route 53 hosted zone..."
    deploy_stack \
        "${STACK_PREFIX}-route53" \
        "$CLOUDFORMATION_DIR/route53-setup.yaml" \
        "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=CreateHostedZone,ParameterValue=true"
    
    # Get hosted zone ID
    HOSTED_ZONE_ID=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    success "Hosted Zone ID: $HOSTED_ZONE_ID"
    
    # Step 2: SSL Certificate Setup
    log "Step 2: Setting up SSL certificate..."
    deploy_stack \
        "${STACK_PREFIX}-certificate" \
        "$CLOUDFORMATION_DIR/ssl-certificate.yaml" \
        "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=HostedZoneId,ParameterValue=$HOSTED_ZONE_ID"
    
    # Get certificate ARN
    CERTIFICATE_ARN=$(get_stack_output "${STACK_PREFIX}-certificate" "CertificateArn")
    success "Certificate ARN: $CERTIFICATE_ARN"
    
    # Step 3: S3 Buckets Setup
    log "Step 3: Setting up S3 buckets..."
    deploy_stack \
        "${STACK_PREFIX}-s3" \
        "$CLOUDFORMATION_DIR/s3-buckets.yaml" \
        "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
    
    # Get S3 bucket details
    WEBSITE_BUCKET=$(get_stack_output "${STACK_PREFIX}-s3" "WebsiteBucketName")
    WEBSITE_BUCKET_DOMAIN=$(get_stack_output "${STACK_PREFIX}-s3" "WebsiteBucketDomainName")
    OAC_ID=$(get_stack_output "${STACK_PREFIX}-s3" "OriginAccessControlId")
    success "Website Bucket: $WEBSITE_BUCKET"
    
    # Step 4: CloudFront Distribution Setup
    log "Step 4: Setting up CloudFront distribution..."
    deploy_stack \
        "${STACK_PREFIX}-cloudfront" \
        "$CLOUDFORMATION_DIR/cloudfront-distribution.yaml" \
        "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=CertificateArn,ParameterValue=$CERTIFICATE_ARN ParameterKey=WebsiteBucketDomainName,ParameterValue=$WEBSITE_BUCKET_DOMAIN ParameterKey=OriginAccessControlId,ParameterValue=$OAC_ID"
    
    # Get CloudFront details
    DISTRIBUTION_ID=$(get_stack_output "${STACK_PREFIX}-cloudfront" "DistributionId")
    DISTRIBUTION_DOMAIN=$(get_stack_output "${STACK_PREFIX}-cloudfront" "DistributionDomainName")
    success "Distribution ID: $DISTRIBUTION_ID"
    success "Distribution Domain: $DISTRIBUTION_DOMAIN"
    
    # Step 5: Create DNS Records
    log "Step 5: Creating DNS records..."
    
    # Create A record for apex domain
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$DOMAIN_NAME\",
                    \"Type\": \"A\",
                    \"AliasTarget\": {
                        \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                        \"DNSName\": \"$DISTRIBUTION_DOMAIN\",
                        \"EvaluateTargetHealth\": false
                    }
                }
            }]
        }" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME"
    
    # Create AAAA record for apex domain (IPv6)
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$DOMAIN_NAME\",
                    \"Type\": \"AAAA\",
                    \"AliasTarget\": {
                        \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                        \"DNSName\": \"$DISTRIBUTION_DOMAIN\",
                        \"EvaluateTargetHealth\": false
                    }
                }
            }]
        }" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME"
    
    # Create A record for www subdomain
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"www.$DOMAIN_NAME\",
                    \"Type\": \"A\",
                    \"AliasTarget\": {
                        \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                        \"DNSName\": \"$DISTRIBUTION_DOMAIN\",
                        \"EvaluateTargetHealth\": false
                    }
                }
            }]
        }" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME"
    
    success "DNS records created successfully"
    
    # Summary
    log "=== Infrastructure Setup Complete ==="
    echo ""
    echo "Domain: $DOMAIN_NAME"
    echo "Hosted Zone ID: $HOSTED_ZONE_ID"
    echo "Certificate ARN: $CERTIFICATE_ARN"
    echo "S3 Bucket: $WEBSITE_BUCKET"
    echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
    echo "CloudFront Domain: $DISTRIBUTION_DOMAIN"
    echo ""
    echo "Next steps:"
    echo "1. Upload your website content to S3: ./deploy-website.sh"
    echo "2. Wait for DNS propagation (15-30 minutes)"
    echo "3. Test your website at https://$DOMAIN_NAME"
    echo ""
    warning "Note: DNS propagation may take 15-30 minutes. SSL certificate validation may take a few minutes."
    
    success "Infrastructure setup completed successfully!"
}

# Run main function
main "$@"