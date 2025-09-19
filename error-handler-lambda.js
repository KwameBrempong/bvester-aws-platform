// Bvester Error Handler Lambda
// Receives and processes frontend error reports

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
    console.log('Error report received:', JSON.stringify(event));

    try {
        const method = event.httpMethod || event.requestContext?.http?.method;
        const path = event.path || event.rawPath;

        // Handle OPTIONS for CORS
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: ''
            };
        }

        // Parse the error data
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const errors = Array.isArray(body) ? body : [body];

        // Process each error
        for (const error of errors) {
            // Store in DynamoDB for analysis
            await dynamodb.put({
                TableName: 'bvester-errors',
                Item: {
                    id: `${error.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: error.timestamp || new Date().toISOString(),
                    type: error.type,
                    message: error.message,
                    userId: error.userId,
                    sessionId: error.sessionId,
                    url: error.url,
                    userAgent: error.userAgent,
                    stack: error.stack,
                    occurrences: error.occurrences || 1,
                    ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
                }
            }).promise().catch(err => {
                console.error('Failed to store error in DynamoDB:', err);
            });

            // Send metrics to CloudWatch
            const metricName = error.type === 'network_error' ? 'NetworkErrors' :
                              error.type === 'javascript' ? 'JavaScriptErrors' :
                              error.type === 'console_error' ? 'ConsoleErrors' :
                              'OtherErrors';

            await cloudwatch.putMetricData({
                Namespace: 'Bvester/Frontend',
                MetricData: [{
                    MetricName: metricName,
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: new Date(),
                    Dimensions: [
                        {
                            Name: 'Environment',
                            Value: 'Production'
                        }
                    ]
                }]
            }).promise().catch(err => {
                console.error('Failed to send metric to CloudWatch:', err);
            });

            // If critical error, send alert
            if (error.severity === 'critical' || error.occurrences > 10) {
                const sns = new AWS.SNS();
                await sns.publish({
                    TopicArn: 'arn:aws:sns:eu-west-2:565871520457:bvester-alerts',
                    Subject: 'Frontend Critical Error',
                    Message: JSON.stringify({
                        type: error.type,
                        message: error.message,
                        url: error.url,
                        userId: error.userId,
                        occurrences: error.occurrences
                    }, null, 2)
                }).promise().catch(err => {
                    console.error('Failed to send SNS alert:', err);
                });
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                success: true,
                processed: errors.length
            })
        };

    } catch (error) {
        console.error('Error processing error report:', error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                error: 'Failed to process error report'
            })
        };
    }
};