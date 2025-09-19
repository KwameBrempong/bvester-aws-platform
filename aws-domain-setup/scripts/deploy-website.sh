#!/bin/bash

# Website Deployment Script for bvester.com
# This script builds and deploys the website to S3 and invalidates CloudFront cache

set -euo pipefail

# Configuration
DOMAIN_NAME="bvester.com"
AWS_REGION="us-east-1"
STACK_PREFIX="bvester"
PROFILE_NAME="default"
SOURCE_DIR="../web-app"  # Adjust to your web app directory
BUILD_DIR="dist"         # Adjust to your build output directory

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
        --output text
}

# Check if infrastructure exists
check_infrastructure() {
    log "Checking if infrastructure exists..."
    
    # Check if S3 stack exists
    if ! aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-s3" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" &> /dev/null; then
        error "Infrastructure not found. Run setup-infrastructure.sh first."
        exit 1
    fi
    
    # Check if CloudFront stack exists
    if ! aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-cloudfront" \
        --region "$AWS_REGION" \
        --profile "$PROFILE_NAME" &> /dev/null; then
        error "CloudFront infrastructure not found. Run setup-infrastructure.sh first."
        exit 1
    fi
    
    success "Infrastructure check completed"
}

# Build website
build_website() {
    log "Building website..."
    
    # Check if source directory exists
    if [ ! -d "$SOURCE_DIR" ]; then
        error "Source directory '$SOURCE_DIR' not found."
        echo "Please update SOURCE_DIR in the script or create the directory."
        exit 1
    fi
    
    cd "$SOURCE_DIR"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        log "Installing dependencies..."
        if command -v npm &> /dev/null; then
            npm install
            npm run build
        elif command -v yarn &> /dev/null; then
            yarn install
            yarn build
        else
            error "npm or yarn not found. Please install Node.js and npm."
            exit 1
        fi
    else
        warning "No package.json found. Assuming static files are ready."
        BUILD_DIR="."  # Use current directory as build output
    fi
    
    # Check if build directory exists
    if [ ! -d "$BUILD_DIR" ]; then
        error "Build directory '$BUILD_DIR' not found after build."
        exit 1
    fi
    
    cd - > /dev/null
    success "Website build completed"
}

# Create default files if they don't exist
create_default_files() {
    local build_path="$SOURCE_DIR/$BUILD_DIR"
    
    # Create index.html if it doesn't exist
    if [ ! -f "$build_path/index.html" ]; then
        log "Creating default index.html..."
        cat > "$build_path/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to BVester.com</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 10px; 
            backdrop-filter: blur(10px);
            text-align: center;
        }
        h1 { color: #fff; margin-bottom: 30px; }
        .feature { 
            background: rgba(255,255,255,0.1); 
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 5px; 
        }
        .status { 
            background: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 20px; 
            display: inline-block; 
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to BVester.com</h1>
        <div class="status">✅ Website Successfully Deployed</div>
        
        <div class="feature">
            <h3>🔒 Secure HTTPS</h3>
            <p>Your website is now served over HTTPS with SSL/TLS encryption</p>
        </div>
        
        <div class="feature">
            <h3>🌐 Global CDN</h3>
            <p>Powered by Amazon CloudFront for fast global delivery</p>
        </div>
        
        <div class="feature">
            <h3>📱 Mobile Optimized</h3>
            <p>Responsive design that works on all devices</p>
        </div>
        
        <div class="feature">
            <h3>⚡ High Performance</h3>
            <p>Optimized for speed and performance</p>
        </div>
        
        <p><strong>Domain:</strong> ${DOMAIN_NAME}</p>
        <p><strong>Deployment Time:</strong> $(date)</p>
        
        <p style="margin-top: 40px; opacity: 0.8;">
            Replace this file with your website content to get started!
        </p>
    </div>
</body>
</html>
EOF
        success "Default index.html created"
    fi
    
    # Create 404.html if it doesn't exist
    if [ ! -f "$build_path/404.html" ]; then
        log "Creating default 404.html..."
        cat > "$build_path/404.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - BVester.com</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 100px auto; 
            padding: 20px; 
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 80vh;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 10px; 
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 4em; margin: 0; }
        h2 { margin: 20px 0; }
        a { color: #fff; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 5px; }
        a:hover { background: rgba(255,255,255,0.3); }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go Home</a>
    </div>
</body>
</html>
EOF
        success "Default 404.html created"
    fi
}

# Deploy to S3
deploy_to_s3() {
    local bucket_name=$1
    local source_path="$SOURCE_DIR/$BUILD_DIR"
    
    log "Deploying website to S3 bucket: $bucket_name"
    
    # Create default files if needed
    create_default_files
    
    # Sync files to S3
    aws s3 sync "$source_path" "s3://$bucket_name" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --metadata-directive REPLACE \
        --profile "$PROFILE_NAME" \
        --region "$AWS_REGION"
    
    # Set specific cache control for HTML files
    aws s3 cp "s3://$bucket_name" "s3://$bucket_name" \
        --recursive \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=300" \
        --metadata-directive REPLACE \
        --profile "$PROFILE_NAME" \
        --region "$AWS_REGION"
    
    success "Files deployed to S3"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    local distribution_id=$1
    
    log "Invalidating CloudFront cache..."
    
    # Create invalidation
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$distribution_id" \
        --paths "/*" \
        --profile "$PROFILE_NAME" \
        --query 'Invalidation.Id' \
        --output text)
    
    log "Invalidation created with ID: $INVALIDATION_ID"
    
    # Wait for invalidation to complete (optional)
    read -p "Wait for invalidation to complete? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Waiting for invalidation to complete..."
        aws cloudfront wait invalidation-completed \
            --distribution-id "$distribution_id" \
            --id "$INVALIDATION_ID" \
            --profile "$PROFILE_NAME"
        success "CloudFront cache invalidation completed"
    else
        log "Invalidation is running in background. It may take 5-15 minutes to complete."
    fi
}

# Main deployment function
main() {
    log "Starting website deployment for $DOMAIN_NAME"
    
    # Check infrastructure
    check_infrastructure
    
    # Get infrastructure details
    WEBSITE_BUCKET=$(get_stack_output "${STACK_PREFIX}-s3" "WebsiteBucketName")
    DISTRIBUTION_ID=$(get_stack_output "${STACK_PREFIX}-cloudfront" "DistributionId")
    
    log "Website Bucket: $WEBSITE_BUCKET"
    log "Distribution ID: $DISTRIBUTION_ID"
    
    # Build website
    build_website
    
    # Deploy to S3
    deploy_to_s3 "$WEBSITE_BUCKET"
    
    # Invalidate CloudFront
    invalidate_cloudfront "$DISTRIBUTION_ID"
    
    # Summary
    log "=== Deployment Complete ==="
    echo ""
    echo "Website URL: https://$DOMAIN_NAME"
    echo "Alternative URL: https://www.$DOMAIN_NAME"
    echo "S3 Bucket: $WEBSITE_BUCKET"
    echo "CloudFront Distribution: $DISTRIBUTION_ID"
    echo ""
    echo "Your website is now live!"
    echo ""
    warning "Note: Changes may take 5-15 minutes to propagate globally due to CloudFront caching."
    
    success "Website deployment completed successfully!"
}

# Run main function
main "$@"