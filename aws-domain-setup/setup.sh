#!/bin/bash

# Main Setup Script for bvester.com AWS Infrastructure
# This is the entry point for setting up the complete AWS infrastructure

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="bvester.com"
AWS_REGION="us-east-1"

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

info() {
    echo -e "${CYAN}[INFO] $1${NC}"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                        AWS Domain Setup for bvester.com                     ║
║                                                                              ║
║  This script will set up a complete AWS infrastructure for hosting          ║
║  bvester.com with HTTPS support, CloudFront CDN, and security features.     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Show menu
show_menu() {
    echo ""
    echo "Available Actions:"
    echo "1. 🚀 Complete Infrastructure Setup (Recommended)"
    echo "2. 📋 Setup AWS Infrastructure Only"
    echo "3. 🌐 Deploy Website Only"
    echo "4. 🔧 Update DNS Records"
    echo "5. 📊 Check System Status"
    echo "6. 🧹 Cleanup All Resources"
    echo "7. 📖 View Documentation"
    echo "8. ❌ Exit"
    echo ""
}

# Prerequisites check
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws-cli")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    # Check optional tools
    if ! command -v jq &> /dev/null; then
        warning "jq not found - some features may not work optimally"
    fi
    
    if ! command -v dig &> /dev/null; then
        warning "dig not found - DNS verification will be limited"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install the missing tools:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                "aws-cli")
                    echo "  - AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
                    ;;
                "git")
                    echo "  - Git: https://git-scm.com/downloads"
                    ;;
                "curl")
                    echo "  - curl: Usually pre-installed or available via package manager"
                    ;;
            esac
        done
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured or invalid"
        echo ""
        echo "Please configure AWS credentials using one of:"
        echo "  - aws configure"
        echo "  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
        echo "  - IAM role (if running on EC2)"
        exit 1
    fi
    
    success "Prerequisites check completed"
}

# Show AWS account info
show_aws_info() {
    log "AWS Account Information:"
    
    local account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "Unknown")
    local user_arn=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null || echo "Unknown")
    local region=$(aws configure get region || echo "$AWS_REGION")
    
    echo "  Account ID: $account_id"
    echo "  User/Role: $user_arn"
    echo "  Region: $region"
    echo "  Domain: $DOMAIN_NAME"
    echo ""
}

# Complete setup
complete_setup() {
    log "Starting complete infrastructure setup for $DOMAIN_NAME"
    
    echo ""
    warning "This will create AWS resources that may incur charges."
    warning "Estimated monthly cost: $1-10 USD (depending on traffic)"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Setup cancelled"
        return 0
    fi
    
    # Run infrastructure setup
    if ./scripts/setup-infrastructure.sh; then
        success "Infrastructure setup completed successfully"
        
        echo ""
        read -p "Do you want to deploy a sample website now? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./scripts/deploy-website.sh
        else
            info "You can deploy your website later using: ./scripts/deploy-website.sh"
        fi
    else
        error "Infrastructure setup failed"
        return 1
    fi
}

# Infrastructure only
setup_infrastructure() {
    log "Setting up AWS infrastructure only..."
    ./scripts/setup-infrastructure.sh
}

# Deploy website only
deploy_website() {
    log "Deploying website..."
    ./scripts/deploy-website.sh
}

# Update DNS
update_dns() {
    log "DNS management menu..."
    echo ""
    echo "DNS Actions:"
    echo "1. List all DNS records"
    echo "2. Check DNS status"
    echo "3. Verify DNS propagation"
    echo "4. Add custom DNS record"
    echo "5. Back to main menu"
    echo ""
    read -p "Select action (1-5): " -n 1 -r
    echo
    
    case $REPLY in
        1) ./scripts/update-dns.sh list ;;
        2) ./scripts/update-dns.sh status ;;
        3) ./scripts/update-dns.sh verify ;;
        4) 
            read -p "Enter record name (e.g., api): " name
            read -p "Enter record type (A, CNAME, etc.): " type
            read -p "Enter record value: " value
            ./scripts/update-dns.sh add "$name" "$type" "$value"
            ;;
        5) return 0 ;;
        *) error "Invalid selection" ;;
    esac
}

# Check status
check_status() {
    log "Checking system status..."
    ./scripts/update-dns.sh status
    
    echo ""
    echo "Additional checks:"
    
    # Check if website is accessible
    if command -v curl &> /dev/null; then
        echo -n "Website accessibility: "
        if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ Working${NC}"
        else
            echo -e "${RED}✗ Not accessible${NC}"
        fi
    fi
    
    # Check SSL certificate
    if command -v openssl &> /dev/null; then
        echo -n "SSL certificate: "
        if echo | openssl s_client -connect "$DOMAIN_NAME:443" -servername "$DOMAIN_NAME" 2>/dev/null | grep -q "Verify return code: 0"; then
            echo -e "${GREEN}✓ Valid${NC}"
        else
            echo -e "${RED}✗ Invalid or not found${NC}"
        fi
    fi
}

# Cleanup resources
cleanup_resources() {
    warning "This will DELETE ALL AWS resources for $DOMAIN_NAME"
    warning "This action cannot be undone!"
    echo ""
    read -p "Are you absolutely sure? (type 'DELETE' to confirm): " -r
    
    if [ "$REPLY" = "DELETE" ]; then
        ./scripts/cleanup.sh
    else
        info "Cleanup cancelled"
    fi
}

# Show documentation
show_documentation() {
    log "Available documentation:"
    echo ""
    echo "1. 📖 Manual Setup Guide"
    echo "2. 🔧 Troubleshooting Guide"
    echo "3. 🔒 SSL Certificate Guide"
    echo "4. 📄 Configuration Files"
    echo "5. 🏠 Back to main menu"
    echo ""
    read -p "Select documentation (1-5): " -n 1 -r
    echo
    
    case $REPLY in
        1) 
            if command -v less &> /dev/null; then
                less docs/manual-setup-guide.md
            else
                cat docs/manual-setup-guide.md
            fi
            ;;
        2) 
            if command -v less &> /dev/null; then
                less docs/troubleshooting.md
            else
                cat docs/troubleshooting.md
            fi
            ;;
        3) 
            if command -v less &> /dev/null; then
                less docs/ssl-certificate-guide.md
            else
                cat docs/ssl-certificate-guide.md
            fi
            ;;
        4)
            log "Configuration files are located in:"
            echo "  - configs/cloudfront-config.json"
            echo "  - configs/s3-bucket-policy.json"
            echo "  - configs/route53-records.json"
            echo "  - configs/security-headers.json"
            echo "  - configs/deployment-config.json"
            ;;
        5) return 0 ;;
        *) error "Invalid selection" ;;
    esac
}

# Main function
main() {
    show_banner
    check_prerequisites
    show_aws_info
    
    while true; do
        show_menu
        read -p "Select an option (1-8): " -n 1 -r
        echo
        
        case $REPLY in
            1) complete_setup ;;
            2) setup_infrastructure ;;
            3) deploy_website ;;
            4) update_dns ;;
            5) check_status ;;
            6) cleanup_resources ;;
            7) show_documentation ;;
            8) 
                info "Goodbye!"
                exit 0 
                ;;
            *) 
                error "Invalid option. Please select 1-8."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..." -r
    done
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Run main function
main "$@"