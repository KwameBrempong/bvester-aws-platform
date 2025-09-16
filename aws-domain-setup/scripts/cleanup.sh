#!/bin/bash

# Cleanup Script for bvester.com AWS Infrastructure
# This script removes all AWS resources created for the domain

set -euo pipefail

# Configuration
DOMAIN_NAME="bvester.com"
AWS_REGION="us-east-1"
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

# Get stack output
get_stack_output() {
    local stack_name=$1
    local output_key=$2
    
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text 2>/dev/null || echo ""
}

# Check if stack exists
stack_exists() {
    local stack_name=$1
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" &> /dev/null
}

# Empty S3 bucket
empty_s3_bucket() {
    local bucket_name=$1
    
    if aws s3api head-bucket --bucket "$bucket_name" --profile "$PROFILE_NAME" 2>/dev/null; then
        log "Emptying S3 bucket: $bucket_name"
        
        # Delete all objects including versions
        aws s3api delete-objects \
            --bucket "$bucket_name" \
            --delete "$(aws s3api list-object-versions \
                --bucket "$bucket_name" \
                --profile "$PROFILE_NAME" \
                --output json \
                --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" \
            --profile "$PROFILE_NAME" 2>/dev/null || true
        
        # Delete all delete markers
        aws s3api delete-objects \
            --bucket "$bucket_name" \
            --delete "$(aws s3api list-object-versions \
                --bucket "$bucket_name" \
                --profile "$PROFILE_NAME" \
                --output json \
                --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')" \
            --profile "$PROFILE_NAME" 2>/dev/null || true
        
        success "S3 bucket $bucket_name emptied"
    else
        warning "S3 bucket $bucket_name not found or not accessible"
    fi
}

# Wait for stack deletion
wait_for_stack_deletion() {
    local stack_name=$1
    
    log "Waiting for stack '$stack_name' deletion to complete..."
    
    aws cloudformation wait stack-delete-complete \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME"
    
    if [ $? -eq 0 ]; then
        success "Stack '$stack_name' deleted successfully"
    else
        error "Stack '$stack_name' deletion failed"
        return 1
    fi
}

# Delete CloudFormation stack
delete_stack() {
    local stack_name=$1
    
    if stack_exists "$stack_name"; then
        log "Deleting stack: $stack_name"
        
        aws cloudformation delete-stack \
            --stack-name "$stack_name" \
            --region "$AWS_REGION" \
            --profile "$PROFILE_NAME"
        
        wait_for_stack_deletion "$stack_name"
    else
        warning "Stack $stack_name not found"
    fi
}

# Show confirmation prompt
confirm_deletion() {
    echo ""
    warning "⚠️  WARNING: This will delete ALL AWS resources for $DOMAIN_NAME"
    echo ""
    echo "This includes:"
    echo "  - CloudFront distributions"
    echo "  - S3 buckets and all content"
    echo "  - SSL certificates"
    echo "  - Route 53 records (hosted zone will remain)"
    echo "  - WAF rules"
    echo ""
    echo "This action cannot be undone!"
    echo ""
    
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    if [ "$REPLY" != "yes" ]; then
        log "Cleanup cancelled"
        exit 0
    fi
    
    echo ""
    read -p "Please type the domain name '$DOMAIN_NAME' to confirm: " -r
    if [ "$REPLY" != "$DOMAIN_NAME" ]; then
        error "Domain name confirmation failed. Cleanup cancelled."
        exit 1
    fi
}

# Show resources to be deleted
show_resources() {
    log "Checking existing resources for $DOMAIN_NAME..."
    echo ""
    
    # Check CloudFront
    if stack_exists "${STACK_PREFIX}-cloudfront"; then
        local dist_id=$(get_stack_output "${STACK_PREFIX}-cloudfront" "DistributionId")
        echo "✓ CloudFront Distribution: $dist_id"
    fi
    
    # Check S3
    if stack_exists "${STACK_PREFIX}-s3"; then
        local bucket=$(get_stack_output "${STACK_PREFIX}-s3" "WebsiteBucketName")
        local www_bucket=$(get_stack_output "${STACK_PREFIX}-s3" "WWWBucketName")
        local deploy_bucket=$(get_stack_output "${STACK_PREFIX}-s3" "DeploymentBucketName")
        echo "✓ S3 Buckets: $bucket, $www_bucket, $deploy_bucket"
    fi
    
    # Check Certificate
    if stack_exists "${STACK_PREFIX}-certificate"; then
        local cert_arn=$(get_stack_output "${STACK_PREFIX}-certificate" "CertificateArn")
        echo "✓ SSL Certificate: $cert_arn"
    fi
    
    # Check Route 53
    if stack_exists "${STACK_PREFIX}-route53"; then
        local hz_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
        echo "✓ Route 53 Hosted Zone: $hz_id"
    fi
    
    echo ""
}

# Main cleanup function
main() {
    log "Starting cleanup process for $DOMAIN_NAME"
    
    # Show resources
    show_resources
    
    # Confirm deletion
    confirm_deletion
    
    log "Beginning cleanup process..."
    
    # Step 1: Empty S3 buckets first
    if stack_exists "${STACK_PREFIX}-s3"; then
        log "Step 1: Emptying S3 buckets..."
        
        local website_bucket=$(get_stack_output "${STACK_PREFIX}-s3" "WebsiteBucketName")
        local www_bucket=$(get_stack_output "${STACK_PREFIX}-s3" "WWWBucketName")
        local deploy_bucket=$(get_stack_output "${STACK_PREFIX}-s3" "DeploymentBucketName")
        
        if [ -n "$website_bucket" ]; then
            empty_s3_bucket "$website_bucket"
        fi
        
        if [ -n "$www_bucket" ]; then
            empty_s3_bucket "$www_bucket"
        fi
        
        if [ -n "$deploy_bucket" ]; then
            empty_s3_bucket "$deploy_bucket"
        fi
    fi
    
    # Step 2: Delete CloudFront (takes longest)
    log "Step 2: Deleting CloudFront distribution..."
    delete_stack "${STACK_PREFIX}-cloudfront"
    
    # Step 3: Delete S3 buckets
    log "Step 3: Deleting S3 buckets..."
    delete_stack "${STACK_PREFIX}-s3"
    
    # Step 4: Delete SSL certificate
    log "Step 4: Deleting SSL certificate..."
    delete_stack "${STACK_PREFIX}-certificate"
    
    # Step 5: Optionally delete Route 53 hosted zone
    if stack_exists "${STACK_PREFIX}-route53"; then
        echo ""
        read -p "Do you want to delete the Route 53 hosted zone? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Step 5: Deleting Route 53 hosted zone..."
            delete_stack "${STACK_PREFIX}-route53"
            warning "Remember to update your domain's name servers if hosted elsewhere!"
        else
            log "Step 5: Keeping Route 53 hosted zone"
            warning "The hosted zone will continue to incur charges (~$0.50/month)"
        fi
    fi
    
    # Cleanup summary
    log "=== Cleanup Complete ==="
    echo ""
    echo "The following resources have been deleted:"
    echo "  ✓ CloudFront distributions"
    echo "  ✓ S3 buckets and content"
    echo "  ✓ SSL certificates"
    echo "  ✓ WAF rules"
    
    if [[ $REPLY =~ ^[Yy]$ ]] && stack_exists "${STACK_PREFIX}-route53"; then
        echo "  ✓ Route 53 hosted zone"
    else
        echo "  - Route 53 hosted zone (kept)"
    fi
    
    echo ""
    success "Cleanup completed successfully!"
    echo ""
    warning "Note: DNS changes may take time to propagate. Your domain may be unreachable for some time."
}

# Handle script arguments
case "${1:-}" in
    "--force")
        # Skip confirmation (use with caution!)
        warning "Force mode enabled - skipping confirmation"
        ;;
    "--help"|"-h")
        echo "Usage: $0 [--force]"
        echo ""
        echo "Options:"
        echo "  --force    Skip confirmation prompts (dangerous!)"
        echo "  --help     Show this help message"
        exit 0
        ;;
    *)
        # Normal mode with confirmation
        ;;
esac

# Run main function
if [ "${1:-}" = "--force" ]; then
    # Override confirmation function for force mode
    confirm_deletion() {
        warning "Force mode: Skipping confirmation"
    }
fi

main "$@"