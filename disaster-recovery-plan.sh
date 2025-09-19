#!/bin/bash

# Bvester Disaster Recovery Plan
# Emergency procedures for system recovery and business continuity

set -e

# Configuration
AWS_REGION="eu-west-2"
BACKUP_REGION="us-east-1"
EMERGENCY_CONTACT="arn:aws:sns:eu-west-2:565871520457:bvester-critical"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    aws sns publish --topic-arn "$EMERGENCY_CONTACT" --message "$1" --subject "CRITICAL: Disaster Recovery Activated" 2>/dev/null || true
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Disaster assessment
assess_disaster() {
    echo ""
    echo "======================================"
    echo "   DISASTER ASSESSMENT IN PROGRESS"
    echo "======================================"
    echo ""

    local SEVERITY="LOW"
    local ISSUES=()

    # Check API Gateway
    log_info "Checking API Gateway..."
    if ! curl -s -f -m 5 "https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod/api/auth/login" -X OPTIONS > /dev/null 2>&1; then
        ISSUES+=("API Gateway is DOWN")
        SEVERITY="HIGH"
    else
        log_success "API Gateway is operational"
    fi

    # Check Lambda functions
    log_info "Checking Lambda functions..."
    LAMBDA_STATUS=$(aws lambda get-function --function-name bvester-backend-api --query 'Configuration.State' --output text 2>/dev/null || echo "FAILED")
    if [ "$LAMBDA_STATUS" != "Active" ]; then
        ISSUES+=("Lambda function is not active")
        SEVERITY="HIGH"
    else
        log_success "Lambda function is active"
    fi

    # Check DynamoDB
    log_info "Checking DynamoDB tables..."
    TABLES=("bvester-users" "bvester-investments" "bvester-documents" "bvester-transactions")
    for table in "${TABLES[@]}"; do
        STATUS=$(aws dynamodb describe-table --table-name "$table" --query 'Table.TableStatus' --output text 2>/dev/null || echo "FAILED")
        if [ "$STATUS" != "ACTIVE" ]; then
            ISSUES+=("DynamoDB table $table is not accessible")
            SEVERITY="CRITICAL"
        fi
    done

    # Check S3 and CloudFront
    log_info "Checking website availability..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "https://bvester.com/index.html")
    if [ "$HTTP_CODE" != "200" ]; then
        ISSUES+=("Website is not accessible (HTTP $HTTP_CODE)")
        if [ "$SEVERITY" == "LOW" ]; then
            SEVERITY="MEDIUM"
        fi
    else
        log_success "Website is accessible"
    fi

    # Report assessment
    echo ""
    echo "Assessment Complete:"
    echo "===================="
    echo "Severity Level: $SEVERITY"

    if [ ${#ISSUES[@]} -gt 0 ]; then
        echo "Issues Found:"
        for issue in "${ISSUES[@]}"; do
            echo "  - $issue"
        done
    else
        echo "No critical issues found"
    fi

    echo ""

    # Return severity code
    case $SEVERITY in
        CRITICAL) return 3 ;;
        HIGH) return 2 ;;
        MEDIUM) return 1 ;;
        LOW) return 0 ;;
    esac
}

# Recovery procedures by component
recover_api_gateway() {
    log_info "Recovering API Gateway..."

    # Check if API exists
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='bvester-api'].id" --output text)

    if [ -z "$API_ID" ]; then
        log_warning "API Gateway not found, recreating..."
        # Recreate API Gateway from backup configuration
        aws apigateway import-rest-api --body file://api-gateway-backup.json
    else
        # Redeploy API
        aws apigateway create-deployment --rest-api-id "$API_ID" --stage-name prod
    fi

    log_success "API Gateway recovery complete"
}

recover_lambda() {
    log_info "Recovering Lambda functions..."

    # Update function from backup
    if [ -f "lambda-backup.zip" ]; then
        aws lambda update-function-code \
            --function-name bvester-backend-api \
            --zip-file fileb://lambda-backup.zip
    fi

    # Reset concurrency
    aws lambda put-function-concurrency \
        --function-name bvester-backend-api \
        --reserved-concurrent-executions 100

    # Update environment variables
    aws lambda update-function-configuration \
        --function-name bvester-backend-api \
        --environment Variables="{
            NODE_ENV=production,
            API_GATEWAY_URL=https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod
        }"

    log_success "Lambda recovery complete"
}

recover_dynamodb() {
    local TABLE_NAME="$1"
    log_info "Recovering DynamoDB table: $TABLE_NAME"

    # Check if table exists
    if ! aws dynamodb describe-table --table-name "$TABLE_NAME" > /dev/null 2>&1; then
        log_warning "Table $TABLE_NAME not found, restoring from backup..."

        # Find latest backup
        BACKUP_ARN=$(aws dynamodb list-backups \
            --table-name "$TABLE_NAME" \
            --backup-type USER \
            --query 'BackupSummaries[0].BackupArn' \
            --output text)

        if [ "$BACKUP_ARN" != "None" ] && [ -n "$BACKUP_ARN" ]; then
            aws dynamodb restore-table-from-backup \
                --target-table-name "$TABLE_NAME" \
                --backup-arn "$BACKUP_ARN"

            # Wait for restore
            log_info "Waiting for table restoration..."
            aws dynamodb wait table-exists --table-name "$TABLE_NAME"
        else
            log_critical "No backup found for $TABLE_NAME!"
            return 1
        fi
    fi

    # Update table settings
    aws dynamodb update-table \
        --table-name "$TABLE_NAME" \
        --billing-mode PAY_PER_REQUEST 2>/dev/null || true

    log_success "DynamoDB table $TABLE_NAME recovered"
}

recover_s3_website() {
    log_info "Recovering S3 website..."

    # Check bucket versioning
    VERSIONING=$(aws s3api get-bucket-versioning \
        --bucket bvester-website-public \
        --query 'Status' \
        --output text 2>/dev/null || echo "DISABLED")

    if [ "$VERSIONING" == "Enabled" ]; then
        log_info "Restoring from S3 versions..."

        # List and restore previous versions
        aws s3api list-object-versions \
            --bucket bvester-website-public \
            --prefix "" | jq -r '.Versions[] | select(.IsLatest == false) | .Key' | while read -r key; do

            # Restore previous version
            aws s3api copy-object \
                --bucket bvester-website-public \
                --copy-source "bvester-website-public/$key" \
                --key "$key" \
                --metadata-directive COPY
        done
    else
        # Restore from backup bucket
        log_info "Restoring from backup..."
        aws s3 sync s3://bvester-backups/latest/ s3://bvester-website-public/ --delete
    fi

    # Invalidate CloudFront
    aws cloudfront create-invalidation \
        --distribution-id E290B7QN3BBXCA \
        --paths "/*"

    log_success "S3 website recovery complete"
}

# Failover to backup region
failover_to_backup_region() {
    log_critical "Initiating failover to backup region: $BACKUP_REGION"

    # Update Route53 to point to backup region
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='bvester.com.'].Id" --output text | cut -d'/' -f3)

    if [ -n "$HOSTED_ZONE_ID" ]; then
        cat > /tmp/route53-change.json << EOF
{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "bvester.com",
            "Type": "A",
            "AliasTarget": {
                "HostedZoneId": "Z2FDTNDATAQYW2",
                "DNSName": "backup.bvester.com",
                "EvaluateTargetHealth": false
            }
        }
    }]
}
EOF

        aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch file:///tmp/route53-change.json

        log_success "DNS failover complete"
    fi
}

# Full disaster recovery
full_disaster_recovery() {
    log_critical "FULL DISASTER RECOVERY INITIATED"

    # Create recovery checkpoint
    RECOVERY_ID="recovery-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "/tmp/$RECOVERY_ID"

    # Phase 1: Immediate stabilization
    log_info "Phase 1: Immediate Stabilization"
    recover_api_gateway
    recover_lambda

    # Phase 2: Data recovery
    log_info "Phase 2: Data Recovery"
    TABLES=("bvester-users" "bvester-investments" "bvester-documents" "bvester-transactions")
    for table in "${TABLES[@]}"; do
        recover_dynamodb "$table"
    done

    # Phase 3: Frontend recovery
    log_info "Phase 3: Frontend Recovery"
    recover_s3_website

    # Phase 4: Validation
    log_info "Phase 4: Validation"
    sleep 30
    if assess_disaster; then
        log_success "DISASTER RECOVERY SUCCESSFUL"
    else
        log_critical "DISASTER RECOVERY INCOMPLETE - Manual intervention required"
        failover_to_backup_region
    fi
}

# Quick recovery for specific components
quick_recovery() {
    local COMPONENT="$1"

    case $COMPONENT in
        api)
            recover_api_gateway
            ;;
        lambda)
            recover_lambda
            ;;
        database)
            for table in bvester-users bvester-investments bvester-documents bvester-transactions; do
                recover_dynamodb "$table"
            done
            ;;
        website)
            recover_s3_website
            ;;
        *)
            echo "Usage: $0 quick {api|lambda|database|website}"
            exit 1
            ;;
    esac
}

# Emergency contacts notification
notify_team() {
    local MESSAGE="$1"

    # Send to multiple channels
    aws sns publish \
        --topic-arn "arn:aws:sns:eu-west-2:565871520457:bvester-critical" \
        --message "$MESSAGE" \
        --subject "Disaster Recovery Alert"

    # Log to CloudWatch
    aws logs put-log-events \
        --log-group-name "/aws/disaster-recovery" \
        --log-stream-name "bvester" \
        --log-events timestamp=$(date +%s000),message="$MESSAGE"
}

# Main execution
main() {
    local ACTION="${1:-assess}"

    echo ""
    echo "========================================="
    echo "   BVESTER DISASTER RECOVERY SYSTEM"
    echo "========================================="
    echo "Time: $(date)"
    echo "Action: $ACTION"
    echo ""

    # Verify AWS credentials
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        log_critical "AWS credentials not configured!"
        exit 1
    fi

    case $ACTION in
        assess)
            assess_disaster
            RESULT=$?
            if [ $RESULT -gt 1 ]; then
                echo ""
                log_warning "Critical issues detected. Run '$0 recover' to initiate recovery."
            fi
            ;;

        recover)
            notify_team "Disaster recovery initiated by $(whoami)"
            full_disaster_recovery
            ;;

        quick)
            if [ $# -lt 2 ]; then
                echo "Usage: $0 quick {api|lambda|database|website}"
                exit 1
            fi
            quick_recovery "$2"
            ;;

        failover)
            failover_to_backup_region
            ;;

        test)
            log_info "Running disaster recovery drill..."
            assess_disaster
            log_success "Drill completed"
            ;;

        *)
            echo "Usage: $0 {assess|recover|quick|failover|test}"
            echo ""
            echo "Commands:"
            echo "  assess   - Assess current system status"
            echo "  recover  - Full disaster recovery"
            echo "  quick    - Quick recovery for specific component"
            echo "  failover - Failover to backup region"
            echo "  test     - Run disaster recovery drill"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"