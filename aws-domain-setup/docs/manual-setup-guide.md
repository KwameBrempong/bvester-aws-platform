# Manual AWS Domain Setup Guide for bvester.com

This guide provides step-by-step instructions for manually setting up AWS infrastructure for bvester.com domain hosting.

## Prerequisites

Before starting, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Domain name** bvester.com (registered)
4. **Administrative access** to domain registrar (if domain is not registered with Route 53)

## Step 1: Route 53 Setup

### 1.1 Create Hosted Zone

```bash
# Create hosted zone for bvester.com
aws route53 create-hosted-zone \
    --name bvester.com \
    --caller-reference "bvester-$(date +%s)" \
    --hosted-zone-config Comment="Hosted zone for bvester.com"
```

### 1.2 Note the Name Servers

After creating the hosted zone, note the name servers:

```bash
# Get name servers
aws route53 get-hosted-zone --id /hostedzone/YOUR_HOSTED_ZONE_ID
```

### 1.3 Update Domain Registrar

If your domain is registered elsewhere, update the name servers at your registrar to point to the Route 53 name servers.

## Step 2: SSL Certificate Setup

### 2.1 Request Certificate

```bash
# Request SSL certificate with DNS validation
aws acm request-certificate \
    --domain-name bvester.com \
    --subject-alternative-names www.bvester.com *.bvester.com \
    --validation-method DNS \
    --region us-east-1
```

### 2.2 Create DNS Validation Records

The certificate will provide DNS validation records. Create these records in Route 53:

```bash
# Create CNAME record for certificate validation
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "VALIDATION_DOMAIN_FROM_ACM",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "VALIDATION_VALUE_FROM_ACM"}]
            }
        }]
    }'
```

## Step 3: S3 Bucket Setup

### 3.1 Create Website Bucket

```bash
# Create main website bucket
aws s3 mb s3://bvester.com --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket bvester.com \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket bvester.com \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Block public access
aws s3api put-public-access-block \
    --bucket bvester.com \
    --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 3.2 Create WWW Redirect Bucket

```bash
# Create www redirect bucket
aws s3 mb s3://www.bvester.com --region us-east-1

# Configure website redirect
aws s3api put-bucket-website \
    --bucket www.bvester.com \
    --website-configuration '{
        "RedirectAllRequestsTo": {
            "HostName": "bvester.com",
            "Protocol": "https"
        }
    }'
```

### 3.3 Create Deployment Bucket

```bash
# Create deployment bucket for CI/CD
aws s3 mb s3://bvester.com-deployment --region us-east-1

# Configure lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket bvester.com-deployment \
    --lifecycle-configuration file://lifecycle-config.json
```

Create `lifecycle-config.json`:

```json
{
    "Rules": [{
        "ID": "DeleteOldDeployments",
        "Status": "Enabled",
        "Expiration": {
            "Days": 30
        },
        "NoncurrentVersionExpiration": {
            "NoncurrentDays": 7
        }
    }]
}
```

## Step 4: CloudFront Setup

### 4.1 Create Origin Access Control

```bash
# Create Origin Access Control
aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
        "Name": "bvester.com-oac",
        "Description": "Origin Access Control for bvester.com",
        "SigningBehavior": "always",
        "SigningProtocol": "sigv4",
        "OriginAccessControlOriginType": "s3"
    }'
```

### 4.2 Create CloudFront Distribution

```bash
# Create distribution (see cloudfront-config.json for full configuration)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 4.3 Update S3 Bucket Policy

After creating CloudFront distribution, update the S3 bucket policy:

```bash
# Update bucket policy to allow CloudFront access
aws s3api put-bucket-policy \
    --bucket bvester.com \
    --policy file://s3-bucket-policy.json
```

## Step 5: WAF Setup

### 5.1 Create Web ACL

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
    --scope CLOUDFRONT \
    --default-action Allow={} \
    --name bvester.com-web-acl \
    --description "Web ACL for bvester.com" \
    --rules file://waf-rules.json
```

### 5.2 Associate with CloudFront

```bash
# Associate WAF with CloudFront distribution
aws wafv2 associate-web-acl \
    --web-acl-arn WAF_ACL_ARN \
    --resource-arn CLOUDFRONT_DISTRIBUTION_ARN
```

## Step 6: DNS Records Setup

### 6.1 Create A Records

```bash
# Create A record for apex domain
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "bvester.com",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "CLOUDFRONT_DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false
                }
            }
        }]
    }'

# Create A record for www subdomain
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "www.bvester.com",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "CLOUDFRONT_DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false
                }
            }
        }]
    }'
```

### 6.2 Create AAAA Records (IPv6)

```bash
# Create AAAA record for apex domain
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "bvester.com",
                "Type": "AAAA",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "CLOUDFRONT_DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false
                }
            }
        }]
    }'
```

## Step 7: Health Check Setup

### 7.1 Create Health Check

```bash
# Create health check
aws route53 create-health-check \
    --caller-reference "bvester-health-$(date +%s)" \
    --health-check-config '{
        "Type": "HTTPS",
        "ResourcePath": "/",
        "FullyQualifiedDomainName": "bvester.com",
        "Port": 443,
        "RequestInterval": 30,
        "FailureThreshold": 3
    }'
```

## Step 8: Upload Website Content

### 8.1 Prepare Content

Create basic website files:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to BVester.com</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Welcome to BVester.com</h1>
    <p>Your website is now live with HTTPS!</p>
</body>
</html>
```

```html
<!-- 404.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - BVester.com</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
</body>
</html>
```

### 8.2 Upload to S3

```bash
# Upload files to S3
aws s3 sync ./website-files s3://bvester.com --delete

# Set cache control for HTML files
aws s3 cp s3://bvester.com s3://bvester.com \
    --recursive \
    --exclude "*" \
    --include "*.html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE
```

## Step 9: CloudFront Cache Invalidation

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"
```

## Step 10: Verification

### 10.1 DNS Verification

```bash
# Check DNS resolution
dig bvester.com
dig www.bvester.com

# Check from different DNS servers
dig @8.8.8.8 bvester.com
dig @1.1.1.1 bvester.com
```

### 10.2 HTTPS Verification

```bash
# Test HTTPS
curl -I https://bvester.com
curl -I https://www.bvester.com

# Test SSL certificate
openssl s_client -connect bvester.com:443 -servername bvester.com
```

### 10.3 Security Headers Check

```bash
# Check security headers
curl -I https://bvester.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
```

## Step 11: Monitoring Setup

### 11.1 CloudWatch Alarms

```bash
# Create CloudWatch alarm for health check
aws cloudwatch put-metric-alarm \
    --alarm-name "bvester-com-health-check-failure" \
    --alarm-description "Health check failure for bvester.com" \
    --metric-name HealthCheckStatus \
    --namespace AWS/Route53 \
    --statistic Minimum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --alarm-actions "arn:aws:sns:us-east-1:ACCOUNT_ID:alerts"
```

## Troubleshooting

### Common Issues

1. **Certificate validation stuck**: Check DNS records are correct
2. **403 errors**: Verify S3 bucket policy and CloudFront OAC
3. **DNS not resolving**: Wait for propagation (up to 48 hours)
4. **HTTPS not working**: Ensure certificate is validated and attached to CloudFront

### Verification Commands

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID
```

## Cost Optimization

1. Use **PriceClass_100** for CloudFront (North America and Europe only)
2. Enable **S3 Intelligent Tiering** for infrequently accessed content
3. Set up **lifecycle policies** for old deployments
4. Monitor usage with **AWS Cost Explorer**

## Security Best Practices

1. Enable **CloudTrail** for API logging
2. Use **IAM roles** with minimal permissions
3. Enable **GuardDuty** for threat detection
4. Regular security audits with **AWS Config**
5. Keep software and dependencies updated

## Next Steps

1. Set up CI/CD pipeline for automated deployments
2. Configure backup and disaster recovery
3. Implement monitoring and alerting
4. Add additional security measures (WAF rules, DDoS protection)
5. Optimize performance (compression, caching strategies)

## Support

For issues or questions:
1. Check AWS documentation
2. Review CloudWatch logs
3. Use AWS Support if you have a support plan
4. Community forums and Stack Overflow