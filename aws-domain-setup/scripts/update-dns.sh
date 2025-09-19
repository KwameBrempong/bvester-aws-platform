#!/bin/bash

# DNS Management Script for bvester.com
# This script manages DNS records for the domain

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
        --output text
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list           List all DNS records"
    echo "  add            Add a new DNS record"
    echo "  update         Update an existing DNS record"
    echo "  delete         Delete a DNS record"
    echo "  verify         Verify DNS propagation"
    echo "  status         Show DNS status"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 add api A 192.0.2.1"
    echo "  $0 add mail MX '10 mail.example.com'"
    echo "  $0 update www A 192.0.2.2"
    echo "  $0 delete api A"
    echo "  $0 verify"
    echo ""
}

# List DNS records
list_records() {
    log "Listing DNS records for $DOMAIN_NAME..."
    
    local hosted_zone_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    
    aws route53 list-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --profile "$PROFILE_NAME" \
        --query 'ResourceRecordSets[?Type!=`NS` && Type!=`SOA`].[Name,Type,TTL,ResourceRecords[0].Value]' \
        --output table
}

# Add DNS record
add_record() {
    local name=$1
    local type=$2
    local value=$3
    local ttl=${4:-300}
    
    log "Adding DNS record: $name.$DOMAIN_NAME $type $value"
    
    local hosted_zone_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    local full_name="$name.$DOMAIN_NAME"
    
    if [ "$name" = "@" ]; then
        full_name="$DOMAIN_NAME"
    fi
    
    local change_batch
    if [ "$type" = "MX" ] || [ "$type" = "TXT" ]; then
        change_batch="{
            \"Changes\": [{
                \"Action\": \"CREATE\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$full_name\",
                    \"Type\": \"$type\",
                    \"TTL\": $ttl,
                    \"ResourceRecords\": [{\"Value\": \"\\\"$value\\\"\"}]
                }
            }]
        }"
    else
        change_batch="{
            \"Changes\": [{
                \"Action\": \"CREATE\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$full_name\",
                    \"Type\": \"$type\",
                    \"TTL\": $ttl,
                    \"ResourceRecords\": [{\"Value\": \"$value\"}]
                }
            }]
        }"
    fi
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --change-batch "$change_batch" \
        --profile "$PROFILE_NAME" > /dev/null
    
    success "DNS record added successfully"
}

# Update DNS record
update_record() {
    local name=$1
    local type=$2
    local value=$3
    local ttl=${4:-300}
    
    log "Updating DNS record: $name.$DOMAIN_NAME $type $value"
    
    local hosted_zone_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    local full_name="$name.$DOMAIN_NAME"
    
    if [ "$name" = "@" ]; then
        full_name="$DOMAIN_NAME"
    fi
    
    local change_batch
    if [ "$type" = "MX" ] || [ "$type" = "TXT" ]; then
        change_batch="{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$full_name\",
                    \"Type\": \"$type\",
                    \"TTL\": $ttl,
                    \"ResourceRecords\": [{\"Value\": \"\\\"$value\\\"\"}]
                }
            }]
        }"
    else
        change_batch="{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$full_name\",
                    \"Type\": \"$type\",
                    \"TTL\": $ttl,
                    \"ResourceRecords\": [{\"Value\": \"$value\"}]
                }
            }]
        }"
    fi
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --change-batch "$change_batch" \
        --profile "$PROFILE_NAME" > /dev/null
    
    success "DNS record updated successfully"
}

# Delete DNS record
delete_record() {
    local name=$1
    local type=$2
    
    log "Deleting DNS record: $name.$DOMAIN_NAME $type"
    
    local hosted_zone_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    local full_name="$name.$DOMAIN_NAME"
    
    if [ "$name" = "@" ]; then
        full_name="$DOMAIN_NAME"
    fi
    
    # First, get the current record to delete
    local current_record=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --profile "$PROFILE_NAME" \
        --query "ResourceRecordSets[?Name=='$full_name.' && Type=='$type']" \
        --output json)
    
    if [ "$current_record" = "[]" ]; then
        error "DNS record not found: $full_name $type"
        exit 1
    fi
    
    # Extract TTL and value from current record
    local ttl=$(echo "$current_record" | jq -r '.[0].TTL // 300')
    local value=$(echo "$current_record" | jq -r '.[0].ResourceRecords[0].Value')
    
    local change_batch="{
        \"Changes\": [{
            \"Action\": \"DELETE\",
            \"ResourceRecordSet\": {
                \"Name\": \"$full_name\",
                \"Type\": \"$type\",
                \"TTL\": $ttl,
                \"ResourceRecords\": [{\"Value\": \"$value\"}]
            }
        }]
    }"
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --change-batch "$change_batch" \
        --profile "$PROFILE_NAME" > /dev/null
    
    success "DNS record deleted successfully"
}

# Verify DNS propagation
verify_dns() {
    log "Verifying DNS propagation for $DOMAIN_NAME..."
    
    # Check apex domain
    echo ""
    echo "Checking apex domain ($DOMAIN_NAME):"
    if command -v dig &> /dev/null; then
        dig +short A "$DOMAIN_NAME"
        dig +short AAAA "$DOMAIN_NAME"
    elif command -v nslookup &> /dev/null; then
        nslookup "$DOMAIN_NAME"
    else
        warning "dig or nslookup not found. Cannot verify DNS."
        return 1
    fi
    
    # Check www subdomain
    echo ""
    echo "Checking www subdomain (www.$DOMAIN_NAME):"
    if command -v dig &> /dev/null; then
        dig +short A "www.$DOMAIN_NAME"
        dig +short AAAA "www.$DOMAIN_NAME"
    elif command -v nslookup &> /dev/null; then
        nslookup "www.$DOMAIN_NAME"
    fi
    
    # Check from multiple DNS servers
    echo ""
    echo "Checking from different DNS servers:"
    local dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
    
    for dns in "${dns_servers[@]}"; do
        echo "Checking via $dns:"
        if command -v dig &> /dev/null; then
            dig @"$dns" +short A "$DOMAIN_NAME"
        fi
    done
    
    success "DNS verification completed"
}

# Show DNS status
show_status() {
    log "DNS Status for $DOMAIN_NAME"
    echo ""
    
    # Get infrastructure details
    local hosted_zone_id=$(get_stack_output "${STACK_PREFIX}-route53" "HostedZoneId")
    local distribution_domain=$(get_stack_output "${STACK_PREFIX}-cloudfront" "DistributionDomainName")
    
    echo "Hosted Zone ID: $hosted_zone_id"
    echo "CloudFront Domain: $distribution_domain"
    echo ""
    
    # Check if domains resolve correctly
    echo "DNS Resolution Check:"
    if command -v dig &> /dev/null; then
        local apex_ip=$(dig +short A "$DOMAIN_NAME" | head -1)
        local www_ip=$(dig +short A "www.$DOMAIN_NAME" | head -1)
        
        echo "  $DOMAIN_NAME → $apex_ip"
        echo "  www.$DOMAIN_NAME → $www_ip"
        
        if [ -n "$apex_ip" ] && [ -n "$www_ip" ]; then
            success "DNS is configured correctly"
        else
            warning "DNS may not be fully propagated yet"
        fi
    else
        warning "dig not available for DNS checking"
    fi
    
    # Check HTTPS
    echo ""
    echo "HTTPS Check:"
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" | grep -q "200\|301\|302"; then
            success "HTTPS is working for $DOMAIN_NAME"
        else
            warning "HTTPS may not be working for $DOMAIN_NAME"
        fi
        
        if curl -s -o /dev/null -w "%{http_code}" "https://www.$DOMAIN_NAME" | grep -q "200\|301\|302"; then
            success "HTTPS is working for www.$DOMAIN_NAME"
        else
            warning "HTTPS may not be working for www.$DOMAIN_NAME"
        fi
    else
        warning "curl not available for HTTPS checking"
    fi
}

# Main function
main() {
    local command=${1:-}
    
    case "$command" in
        "list")
            list_records
            ;;
        "add")
            if [ $# -lt 4 ]; then
                error "Usage: $0 add <name> <type> <value> [ttl]"
                exit 1
            fi
            add_record "$2" "$3" "$4" "${5:-300}"
            ;;
        "update")
            if [ $# -lt 4 ]; then
                error "Usage: $0 update <name> <type> <value> [ttl]"
                exit 1
            fi
            update_record "$2" "$3" "$4" "${5:-300}"
            ;;
        "delete")
            if [ $# -lt 3 ]; then
                error "Usage: $0 delete <name> <type>"
                exit 1
            fi
            delete_record "$2" "$3"
            ;;
        "verify")
            verify_dns
            ;;
        "status")
            show_status
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"