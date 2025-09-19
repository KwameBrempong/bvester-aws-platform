#!/bin/bash

# Bvester DynamoDB Automated Backup System
# Provides continuous backup, point-in-time recovery, and disaster recovery

set -e

# Configuration
AWS_REGION="eu-west-2"
TABLES=("bvester-users" "bvester-investments" "bvester-documents" "bvester-transactions")
BACKUP_BUCKET="bvester-db-backups"
RETENTION_DAYS=30
SNS_TOPIC="arn:aws:sns:eu-west-2:565871520457:bvester-backup-alerts"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    aws sns publish --topic-arn "$SNS_TOPIC" --message "Backup Error: $1" --subject "DynamoDB Backup Failed"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Enable point-in-time recovery
enable_pitr() {
    echo "Enabling Point-in-Time Recovery..."

    for table in "${TABLES[@]}"; do
        echo -n "  Configuring $table... "

        # Check if PITR is already enabled
        PITR_STATUS=$(aws dynamodb describe-continuous-backups \
            --table-name "$table" \
            --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' \
            --output text 2>/dev/null || echo "DISABLED")

        if [ "$PITR_STATUS" != "ENABLED" ]; then
            aws dynamodb update-continuous-backups \
                --table-name "$table" \
                --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
                --region "$AWS_REGION" > /dev/null 2>&1
            log_success "PITR enabled"
        else
            log_success "PITR already enabled"
        fi
    done
}

# Create on-demand backup
create_ondemand_backup() {
    local BACKUP_NAME_PREFIX="$1"
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    echo "Creating on-demand backups..."

    for table in "${TABLES[@]}"; do
        local BACKUP_NAME="${BACKUP_NAME_PREFIX}-${table}-${TIMESTAMP}"
        echo -n "  Backing up $table... "

        BACKUP_ARN=$(aws dynamodb create-backup \
            --table-name "$table" \
            --backup-name "$BACKUP_NAME" \
            --region "$AWS_REGION" \
            --query 'BackupDetails.BackupArn' \
            --output text 2>/dev/null)

        if [ $? -eq 0 ]; then
            log_success "Created backup: $BACKUP_NAME"

            # Tag the backup
            aws dynamodb tag-resource \
                --resource-arn "$BACKUP_ARN" \
                --tags Key=Environment,Value=Production Key=AutoBackup,Value=true \
                --region "$AWS_REGION" 2>/dev/null
        else
            log_error "Failed to backup $table"
        fi
    done
}

# Export table to S3
export_to_s3() {
    local TABLE_NAME="$1"
    local EXPORT_TIME=$(date +%Y%m%d_%H%M%S)
    local S3_PREFIX="exports/${TABLE_NAME}/${EXPORT_TIME}"

    echo -n "  Exporting $TABLE_NAME to S3... "

    EXPORT_ARN=$(aws dynamodb export-table-to-point-in-time \
        --table-arn "arn:aws:dynamodb:${AWS_REGION}:565871520457:table/${TABLE_NAME}" \
        --s3-bucket "$BACKUP_BUCKET" \
        --s3-prefix "$S3_PREFIX" \
        --export-format DYNAMODB_JSON \
        --region "$AWS_REGION" \
        --query 'ExportDescription.ExportArn' \
        --output text 2>/dev/null)

    if [ $? -eq 0 ]; then
        log_success "Export initiated: $S3_PREFIX"
    else
        log_error "Failed to export $TABLE_NAME"
    fi
}

# Cross-region replication setup
setup_cross_region_replication() {
    local SOURCE_REGION="$AWS_REGION"
    local TARGET_REGION="us-east-1"

    echo "Setting up cross-region replication to $TARGET_REGION..."

    for table in "${TABLES[@]}"; do
        echo -n "  Replicating $table... "

        # Check if global table already exists
        GLOBAL_TABLE_STATUS=$(aws dynamodb describe-table \
            --table-name "$table" \
            --region "$TARGET_REGION" \
            --query 'Table.TableStatus' \
            --output text 2>/dev/null || echo "NOT_FOUND")

        if [ "$GLOBAL_TABLE_STATUS" == "NOT_FOUND" ]; then
            # Create global table
            aws dynamodb create-global-table \
                --global-table-name "$table" \
                --replication-group RegionName="$SOURCE_REGION" RegionName="$TARGET_REGION" \
                --region "$SOURCE_REGION" > /dev/null 2>&1

            if [ $? -eq 0 ]; then
                log_success "Global table created"
            else
                log_warning "Could not create global table (may need manual setup)"
            fi
        else
            log_success "Already replicated"
        fi
    done
}

# Clean up old backups
cleanup_old_backups() {
    echo "Cleaning up old backups (>$RETENTION_DAYS days)..."

    local CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%s)

    for table in "${TABLES[@]}"; do
        # List all backups for the table
        aws dynamodb list-backups \
            --table-name "$table" \
            --region "$AWS_REGION" \
            --query 'BackupSummaries[?BackupType==`USER`].[BackupArn,BackupCreationDateTime]' \
            --output text | while read -r BACKUP_ARN BACKUP_TIME; do

            # Convert backup time to timestamp
            BACKUP_TIMESTAMP=$(date -d "$BACKUP_TIME" +%s 2>/dev/null || echo 0)

            if [ $BACKUP_TIMESTAMP -lt $CUTOFF_DATE ] && [ $BACKUP_TIMESTAMP -gt 0 ]; then
                echo -n "  Deleting old backup: $(basename $BACKUP_ARN)... "
                aws dynamodb delete-backup \
                    --backup-arn "$BACKUP_ARN" \
                    --region "$AWS_REGION" 2>/dev/null

                if [ $? -eq 0 ]; then
                    log_success "Deleted"
                else
                    log_warning "Failed to delete"
                fi
            fi
        done
    done
}

# Monitor backup health
monitor_backup_health() {
    echo "Checking backup health..."

    local ISSUES=0

    for table in "${TABLES[@]}"; do
        # Check if table has recent backup
        LATEST_BACKUP=$(aws dynamodb list-backups \
            --table-name "$table" \
            --region "$AWS_REGION" \
            --max-items 1 \
            --query 'BackupSummaries[0].BackupCreationDateTime' \
            --output text 2>/dev/null || echo "")

        if [ -z "$LATEST_BACKUP" ]; then
            log_error "No backups found for $table"
            ((ISSUES++))
        else
            BACKUP_AGE=$(( ($(date +%s) - $(date -d "$LATEST_BACKUP" +%s)) / 3600 ))
            if [ $BACKUP_AGE -gt 24 ]; then
                log_warning "$table backup is $BACKUP_AGE hours old"
                ((ISSUES++))
            else
                log_success "$table has recent backup ($BACKUP_AGE hours old)"
            fi
        fi

        # Check PITR status
        PITR_STATUS=$(aws dynamodb describe-continuous-backups \
            --table-name "$table" \
            --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' \
            --output text 2>/dev/null || echo "ERROR")

        if [ "$PITR_STATUS" != "ENABLED" ]; then
            log_error "PITR not enabled for $table"
            ((ISSUES++))
        fi
    done

    if [ $ISSUES -gt 0 ]; then
        aws sns publish \
            --topic-arn "$SNS_TOPIC" \
            --message "Backup health check found $ISSUES issues. Please review." \
            --subject "DynamoDB Backup Health Alert"
    fi

    return $ISSUES
}

# Restore from backup
restore_from_backup() {
    local BACKUP_ARN="$1"
    local TARGET_TABLE="$2"

    echo "Restoring from backup..."
    echo "  Source: $BACKUP_ARN"
    echo "  Target: $TARGET_TABLE"

    aws dynamodb restore-table-from-backup \
        --target-table-name "$TARGET_TABLE" \
        --backup-arn "$BACKUP_ARN" \
        --region "$AWS_REGION"

    if [ $? -eq 0 ]; then
        log_success "Restore initiated for $TARGET_TABLE"

        # Wait for restore to complete
        echo -n "  Waiting for restore to complete... "
        aws dynamodb wait table-exists \
            --table-name "$TARGET_TABLE" \
            --region "$AWS_REGION"
        log_success "Restore completed"
    else
        log_error "Restore failed"
        exit 1
    fi
}

# Main execution
main() {
    local ACTION="${1:-backup}"

    echo "====================================="
    echo "  Bvester DynamoDB Backup System"
    echo "====================================="
    echo ""

    case "$ACTION" in
        setup)
            enable_pitr
            setup_cross_region_replication
            create_ondemand_backup "initial"
            ;;

        backup)
            create_ondemand_backup "scheduled"
            cleanup_old_backups
            ;;

        export)
            echo "Exporting all tables to S3..."
            for table in "${TABLES[@]}"; do
                export_to_s3 "$table"
            done
            ;;

        monitor)
            monitor_backup_health
            ;;

        restore)
            if [ $# -lt 3 ]; then
                echo "Usage: $0 restore <backup-arn> <target-table-name>"
                exit 1
            fi
            restore_from_backup "$2" "$3"
            ;;

        continuous)
            # Run continuous backup every hour
            while true; do
                create_ondemand_backup "auto"
                monitor_backup_health
                echo "Next backup in 1 hour..."
                sleep 3600
            done
            ;;

        *)
            echo "Usage: $0 {setup|backup|export|monitor|restore|continuous}"
            exit 1
            ;;
    esac

    echo ""
    log_success "Operation completed successfully!"
}

# Check AWS CLI availability
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Please install AWS CLI."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    log_error "AWS credentials not configured!"
    exit 1
fi

# Run main function
main "$@"