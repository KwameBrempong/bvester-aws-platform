# AWS Domain Setup Guide for bvester.com

## Overview
This guide will help you set up bvester.com with AWS services including Route 53, CloudFront, S3, and Certificate Manager.

## Prerequisites
- AWS Account with appropriate permissions
- Domain registrar access (if domain not registered with Route 53)
- AWS CLI configured
- Node.js installed

## Step 1: Register or Transfer Domain to Route 53

### Option A: Register New Domain
1. Go to Route 53 Console
2. Click "Register Domain"
3. Search for "bvester.com"
4. Complete registration ($12/year for .com)

### Option B: Transfer Existing Domain
1. Get authorization code from current registrar
2. In Route 53, click "Transfer Domain"
3. Enter domain and auth code
4. Complete transfer process

### Option C: Use External Domain (Keep current registrar)
1. Create hosted zone in Route 53
2. Update nameservers at your registrar

## Step 2: Create Hosted Zone in Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
    --name bvester.com \
    --caller-reference "bvester-$(date +%s)" \
    --hosted-zone-config Comment="Bvester Platform Production Domain"
```

Note the nameservers returned - you'll need these if domain is external.

## Step 3: Request SSL Certificate from AWS Certificate Manager

```bash
# Request certificate for both apex and www
aws acm request-certificate \
    --domain-name bvester.com \
    --subject-alternative-names www.bvester.com \
    --validation-method DNS \
    --region us-east-1
```

**Important**: Certificate MUST be in us-east-1 for CloudFront!

## Step 4: Validate Certificate

1. Go to ACM Console in us-east-1
2. Find pending certificate
3. Click "Create records in Route 53"
4. Wait for validation (5-30 minutes)

## Step 5: Create S3 Buckets

### Create main bucket
```bash
aws s3api create-bucket \
    --bucket bvester-website-public \
    --region us-east-1 \
    --acl public-read
```

### Create redirect bucket for www
```bash
aws s3api create-bucket \
    --bucket www-bvester-website-public \
    --region us-east-1 \
    --acl public-read
```

## Step 6: Configure S3 Static Website Hosting

### Main bucket configuration
```bash
aws s3api put-bucket-website \
    --bucket bvester-website-public \
    --website-configuration file://s3-website-config.json
```

### Redirect bucket configuration
```bash
aws s3api put-bucket-website \
    --bucket www-bvester-website-public \
    --website-configuration file://s3-redirect-config.json
```

## Step 7: Set S3 Bucket Policy

```bash
aws s3api put-bucket-policy \
    --bucket bvester-website-public \
    --policy file://s3-bucket-policy.json
```

## Step 8: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json
```

Note the distribution ID and domain name.

## Step 9: Create Route 53 Records

### A record for apex domain
```bash
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_ZONE_ID \
    --change-batch file://route53-apex-record.json
```

### CNAME for www
```bash
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_ZONE_ID \
    --change-batch file://route53-www-record.json
```

## Step 10: Deploy Your Website

```bash
# Build your frontend
cd web-app
npm run build

# Sync to S3
aws s3 sync ./build s3://bvester-website-public \
    --delete \
    --cache-control max-age=31536000

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"
```

## Step 11: Configure Backend API

### Update Elastic Beanstalk
1. Go to EB Console
2. Select your environment
3. Configuration > Load Balancer
4. Add HTTPS listener with ACM certificate
5. Update security groups

### Add API subdomain
```bash
# Create api.bvester.com record pointing to EB
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_ZONE_ID \
    --change-batch file://route53-api-record.json
```

## Verification Steps

1. **DNS Propagation**: Check with `nslookup bvester.com`
2. **SSL Certificate**: Visit https://bvester.com
3. **Redirect**: Verify www.bvester.com redirects to bvester.com
4. **API**: Test https://api.bvester.com/health

## Troubleshooting

### Certificate Not Working
- Ensure certificate is in us-east-1
- Check certificate validation status
- Verify CloudFront is using correct certificate

### Site Not Loading
- Check S3 bucket permissions
- Verify CloudFront origin settings
- Check Route 53 records

### API Not Accessible
- Verify Elastic Beanstalk security groups
- Check load balancer listeners
- Ensure health checks are passing

## Costs Estimate

- **Route 53 Hosted Zone**: $0.50/month
- **Domain Registration**: $12/year
- **ACM Certificate**: Free
- **CloudFront**: ~$5-10/month (based on traffic)
- **S3 Storage**: ~$1/month
- **Total**: ~$7-12/month + domain

## Security Best Practices

1. Enable CloudFront security headers
2. Use WAF for DDoS protection
3. Enable S3 versioning
4. Set up CloudWatch alarms
5. Enable AWS Shield (free tier)

## Next Steps

1. Set up CI/CD pipeline
2. Configure monitoring
3. Set up backup strategy
4. Enable CloudFront logging
5. Configure custom error pages