import json
import boto3
import urllib3
from datetime import datetime

http = urllib3.PoolManager()
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'services': {}
    }

    # Check API Gateway
    try:
        resp = http.request('GET', 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod/health')
        health_status['services']['api_gateway'] = 'healthy' if resp.status == 200 else 'degraded'
    except:
        health_status['services']['api_gateway'] = 'unhealthy'

    # Check DynamoDB
    dynamodb = boto3.client('dynamodb')
    try:
        dynamodb.describe_table(TableName='bvester-users')
        health_status['services']['dynamodb'] = 'healthy'
    except:
        health_status['services']['dynamodb'] = 'unhealthy'

    # Send metrics to CloudWatch
    for service, status in health_status['services'].items():
        cloudwatch.put_metric_data(
            Namespace='Bvester/Health',
            MetricData=[{
                'MetricName': f'{service}_health',
                'Value': 1 if status == 'healthy' else 0,
                'Unit': 'None',
                'Timestamp': datetime.now()
            }]
        )

    return {
        'statusCode': 200,
        'body': json.dumps(health_status)
    }
