// Bvester Automated DynamoDB Backup Lambda Function
// Runs on schedule to create backups and monitor health

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS();

const TABLES = [
    'bvester-users',
    'bvester-investments',
    'bvester-documents',
    'bvester-transactions'
];

const SNS_TOPIC = 'arn:aws:sns:eu-west-2:565871520457:bvester-backup-alerts';
const BACKUP_RETENTION_DAYS = 30;

exports.handler = async (event) => {
    console.log('Starting automated DynamoDB backup process...');

    const results = {
        successful: [],
        failed: [],
        cleaned: []
    };

    try {
        // Create backups for all tables
        for (const tableName of TABLES) {
            try {
                const backupName = `auto-${tableName}-${Date.now()}`;

                const backupResult = await dynamodb.createBackup({
                    TableName: tableName,
                    BackupName: backupName
                }).promise();

                console.log(`✓ Created backup for ${tableName}: ${backupResult.BackupDetails.BackupArn}`);
                results.successful.push({
                    table: tableName,
                    backupArn: backupResult.BackupDetails.BackupArn,
                    status: backupResult.BackupDetails.BackupStatus
                });

                // Tag the backup
                await dynamodb.tagResource({
                    ResourceArn: backupResult.BackupDetails.BackupArn,
                    Tags: [
                        { Key: 'Environment', Value: 'Production' },
                        { Key: 'AutoBackup', Value: 'true' },
                        { Key: 'CreatedBy', Value: 'Lambda' }
                    ]
                }).promise();

            } catch (error) {
                console.error(`✗ Failed to backup ${tableName}:`, error);
                results.failed.push({
                    table: tableName,
                    error: error.message
                });
            }
        }

        // Clean up old backups
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

        for (const tableName of TABLES) {
            try {
                const backups = await dynamodb.listBackups({
                    TableName: tableName,
                    BackupType: 'USER'
                }).promise();

                for (const backup of backups.BackupSummaries) {
                    const backupDate = new Date(backup.BackupCreationDateTime);

                    if (backupDate < cutoffDate) {
                        await dynamodb.deleteBackup({
                            BackupArn: backup.BackupArn
                        }).promise();

                        console.log(`Deleted old backup: ${backup.BackupName}`);
                        results.cleaned.push(backup.BackupName);
                    }
                }
            } catch (error) {
                console.error(`Error cleaning backups for ${tableName}:`, error);
            }
        }

        // Check backup health
        const healthIssues = [];

        for (const tableName of TABLES) {
            try {
                // Check PITR status
                const continuousBackups = await dynamodb.describeContinuousBackups({
                    TableName: tableName
                }).promise();

                if (continuousBackups.ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus !== 'ENABLED') {
                    healthIssues.push(`PITR not enabled for ${tableName}`);

                    // Try to enable it
                    await dynamodb.updateContinuousBackups({
                        TableName: tableName,
                        PointInTimeRecoverySpecification: {
                            PointInTimeRecoveryEnabled: true
                        }
                    }).promise();

                    console.log(`Enabled PITR for ${tableName}`);
                }

                // Check for recent backups
                const recentBackups = await dynamodb.listBackups({
                    TableName: tableName,
                    TimeRangeLowerBound: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
                }).promise();

                if (recentBackups.BackupSummaries.length === 0) {
                    healthIssues.push(`No recent backups for ${tableName}`);
                }

            } catch (error) {
                healthIssues.push(`Health check failed for ${tableName}: ${error.message}`);
            }
        }

        // Send notification if there are issues
        if (results.failed.length > 0 || healthIssues.length > 0) {
            const message = {
                timestamp: new Date().toISOString(),
                failedBackups: results.failed,
                healthIssues: healthIssues,
                successfulBackups: results.successful.length
            };

            await sns.publish({
                TopicArn: SNS_TOPIC,
                Subject: 'DynamoDB Backup Alert',
                Message: JSON.stringify(message, null, 2)
            }).promise();
        }

        // Return summary
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Backup process completed',
                timestamp: new Date().toISOString(),
                summary: {
                    successful: results.successful.length,
                    failed: results.failed.length,
                    cleaned: results.cleaned.length,
                    healthIssues: healthIssues.length
                },
                details: results
            })
        };

        console.log('Backup process completed:', response);
        return response;

    } catch (error) {
        console.error('Backup process failed:', error);

        // Send critical alert
        await sns.publish({
            TopicArn: SNS_TOPIC,
            Subject: 'CRITICAL: DynamoDB Backup System Failure',
            Message: `The automated backup system has failed.\n\nError: ${error.message}\n\nPlease investigate immediately.`
        }).promise();

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Backup process failed',
                message: error.message
            })
        };
    }
};

// Export function for testing
module.exports.restoreFromBackup = async (backupArn, targetTableName) => {
    try {
        const result = await dynamodb.restoreTableFromBackup({
            TargetTableName: targetTableName,
            BackupArn: backupArn
        }).promise();

        console.log(`Restore initiated: ${targetTableName}`);

        // Wait for table to be active
        await dynamodb.waitFor('tableExists', {
            TableName: targetTableName
        }).promise();

        return {
            success: true,
            tableDescription: result.TableDescription
        };

    } catch (error) {
        console.error('Restore failed:', error);
        throw error;
    }
};

// Point-in-time recovery function
module.exports.restoreToPointInTime = async (sourceTableName, targetTableName, restoreDateTime) => {
    try {
        const result = await dynamodb.restoreTableToPointInTime({
            SourceTableName: sourceTableName,
            TargetTableName: targetTableName,
            RestoreDateTime: restoreDateTime
        }).promise();

        console.log(`Point-in-time restore initiated: ${targetTableName}`);

        return {
            success: true,
            tableDescription: result.TableDescription
        };

    } catch (error) {
        console.error('Point-in-time restore failed:', error);
        throw error;
    }
};