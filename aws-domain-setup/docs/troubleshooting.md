# Troubleshooting Guide for bvester.com AWS Setup

This guide covers common issues and solutions when setting up AWS infrastructure for bvester.com.

## Table of Contents

1. [DNS Issues](#dns-issues)
2. [SSL Certificate Problems](#ssl-certificate-problems)
3. [CloudFront Issues](#cloudfront-issues)
4. [S3 Bucket Problems](#s3-bucket-problems)
5. [Route 53 Issues](#route-53-issues)
6. [WAF and Security Issues](#waf-and-security-issues)
7. [Performance Issues](#performance-issues)
8. [Cost and Billing Issues](#cost-and-billing-issues)

## DNS Issues

### Problem: Domain not resolving

**Symptoms:**
- `dig bvester.com` returns no results
- Website shows "This site can't be reached"
- DNS lookup failures

**Solutions:**

1. **Check name server propagation:**
   ```bash
   # Check current name servers
   dig NS bvester.com
   
   # Check from different locations
   dig @8.8.8.8 bvester.com
   dig @1.1.1.1 bvester.com
   ```

2. **Verify Route 53 configuration:**
   ```bash
   # List all hosted zones
   aws route53 list-hosted-zones
   
   # Check records in hosted zone
   aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID
   ```

3. **Update registrar settings:**
   - Ensure domain registrar points to Route 53 name servers
   - Wait 24-48 hours for full propagation

### Problem: Partial DNS resolution

**Symptoms:**
- `bvester.com` resolves but `www.bvester.com` doesn't (or vice versa)
- Some DNS servers resolve, others don't

**Solutions:**

1. **Check all A/AAAA records exist:**
   ```bash
   # Verify both apex and www records
   dig A bvester.com
   dig A www.bvester.com
   dig AAAA bvester.com
   dig AAAA www.bvester.com
   ```

2. **Recreate missing records:**
   ```bash
   # Add missing A record
   aws route53 change-resource-record-sets \
       --hosted-zone-id YOUR_ZONE_ID \
       --change-batch file://missing-record.json
   ```

## SSL Certificate Problems

### Problem: Certificate validation stuck

**Symptoms:**
- ACM shows certificate as "Pending validation"
- HTTPS doesn't work
- Browser shows certificate errors

**Solutions:**

1. **Check DNS validation records:**
   ```bash
   # Get certificate details
   aws acm describe-certificate --certificate-arn YOUR_CERT_ARN
   
   # Verify CNAME records exist
   dig CNAME _validation_record_name.bvester.com
   ```

2. **Recreate validation records:**
   ```bash
   # Create the DNS validation record
   aws route53 change-resource-record-sets \
       --hosted-zone-id YOUR_ZONE_ID \
       --change-batch '{
           "Changes": [{
               "Action": "UPSERT",
               "ResourceRecordSet": {
                   "Name": "VALIDATION_NAME",
                   "Type": "CNAME",
                   "TTL": 300,
                   "ResourceRecords": [{"Value": "VALIDATION_VALUE"}]
               }
           }]
       }'
   ```

3. **Request new certificate if validation fails:**
   ```bash
   # Delete old certificate
   aws acm delete-certificate --certificate-arn OLD_CERT_ARN
   
   # Request new certificate
   aws acm request-certificate \
       --domain-name bvester.com \
       --subject-alternative-names www.bvester.com \
       --validation-method DNS
   ```

### Problem: Certificate not attached to CloudFront

**Symptoms:**
- Certificate shows as issued
- CloudFront still shows default certificate
- HTTPS works but shows wrong certificate

**Solutions:**

1. **Update CloudFront distribution:**
   ```bash
   # Get current distribution config
   aws cloudfront get-distribution-config --id YOUR_DIST_ID
   
   # Update with correct certificate ARN
   aws cloudfront update-distribution \
       --id YOUR_DIST_ID \
       --distribution-config file://updated-config.json \
       --if-match ETAG_VALUE
   ```

## CloudFront Issues

### Problem: 403 Forbidden errors

**Symptoms:**
- All requests return 403
- "Access Denied" errors
- Can't access any files

**Solutions:**

1. **Check Origin Access Control:**
   ```bash
   # Verify OAC exists and is attached
   aws cloudfront list-origin-access-controls
   
   # Check distribution origin configuration
   aws cloudfront get-distribution --id YOUR_DIST_ID
   ```

2. **Update S3 bucket policy:**
   ```bash
   # Apply correct bucket policy
   aws s3api put-bucket-policy \
       --bucket bvester.com \
       --policy file://s3-bucket-policy.json
   ```

3. **Verify bucket permissions:**
   ```bash
   # Check bucket policy
   aws s3api get-bucket-policy --bucket bvester.com
   
   # Check public access block
   aws s3api get-public-access-block --bucket bvester.com
   ```

### Problem: CloudFront not serving updated content

**Symptoms:**
- Old content still showing
- Changes not reflecting
- Cache not updating

**Solutions:**

1. **Create invalidation:**
   ```bash
   # Invalidate all content
   aws cloudfront create-invalidation \
       --distribution-id YOUR_DIST_ID \
       --paths "/*"
   
   # Check invalidation status
   aws cloudfront list-invalidations --distribution-id YOUR_DIST_ID
   ```

2. **Check cache behaviors:**
   ```bash
   # Review cache policies
   aws cloudfront get-distribution-config --id YOUR_DIST_ID \
       | jq '.DistributionConfig.DefaultCacheBehavior'
   ```

3. **Force refresh:**
   ```bash
   # Test with cache-busting
   curl -H "Cache-Control: no-cache" https://bvester.com
   ```

## S3 Bucket Problems

### Problem: S3 bucket access denied

**Symptoms:**
- Can't upload files to S3
- 403 errors when accessing bucket
- Permission denied errors

**Solutions:**

1. **Check IAM permissions:**
   ```bash
   # Verify current user permissions
   aws sts get-caller-identity
   
   # Check IAM policy
   aws iam get-user-policy --user-name YOUR_USERNAME --policy-name S3Policy
   ```

2. **Update bucket policy:**
   ```bash
   # Apply deployment role policy
   aws s3api put-bucket-policy \
       --bucket bvester.com \
       --policy file://deployment-bucket-policy.json
   ```

3. **Check bucket exists and region:**
   ```bash
   # List buckets
   aws s3 ls
   
   # Check bucket region
   aws s3api get-bucket-location --bucket bvester.com
   ```

### Problem: Website files not displaying correctly

**Symptoms:**
- Files upload but show errors
- Wrong MIME types
- CSS/JS not loading

**Solutions:**

1. **Set correct content types:**
   ```bash
   # Upload with specific content types
   aws s3 cp index.html s3://bvester.com/ --content-type "text/html"
   aws s3 cp style.css s3://bvester.com/ --content-type "text/css"
   aws s3 cp script.js s3://bvester.com/ --content-type "application/javascript"
   ```

2. **Use sync with metadata:**
   ```bash
   # Sync with proper metadata
   aws s3 sync ./website s3://bvester.com \
       --exclude "*" \
       --include "*.html" \
       --content-type "text/html" \
       --cache-control "public, max-age=300"
   ```

## Route 53 Issues

### Problem: Health check failures

**Symptoms:**
- Health check shows "Failure"
- Monitoring alerts triggered
- Route 53 health check failures

**Solutions:**

1. **Test health check endpoint:**
   ```bash
   # Test the health check URL
   curl -I https://bvester.com/
   
   # Check response time
   curl -w "@curl-format.txt" -o /dev/null -s https://bvester.com/
   ```

2. **Update health check configuration:**
   ```bash
   # Get health check details
   aws route53 get-health-check --health-check-id YOUR_HC_ID
   
   # Update health check
   aws route53 update-health-check \
       --health-check-id YOUR_HC_ID \
       --resource-path "/" \
       --failure-threshold 3
   ```

3. **Check firewall/security groups:**
   - Ensure health check IPs are not blocked
   - Verify WAF rules don't block health checks

## WAF and Security Issues

### Problem: Legitimate traffic blocked

**Symptoms:**
- Users can't access website
- 403 errors from WAF
- Traffic from certain regions blocked

**Solutions:**

1. **Check WAF logs:**
   ```bash
   # Enable WAF logging
   aws wafv2 put-logging-configuration \
       --resource-arn YOUR_WEBACL_ARN \
       --log-destination-configs "arn:aws:logs:us-east-1:ACCOUNT:log-group:aws-waf-logs-bvester"
   ```

2. **Review blocked requests:**
   ```bash
   # Check CloudWatch logs
   aws logs filter-log-events \
       --log-group-name aws-waf-logs-bvester \
       --filter-pattern "BLOCK"
   ```

3. **Adjust WAF rules:**
   ```bash
   # Update rate limit rule
   aws wafv2 update-rule-group \
       --scope CLOUDFRONT \
       --id YOUR_RULE_GROUP_ID \
       --rules file://updated-waf-rules.json
   ```

### Problem: Security headers not working

**Symptoms:**
- Security scanners show missing headers
- Headers not appearing in browser
- Security score is low

**Solutions:**

1. **Check response headers policy:**
   ```bash
   # Verify headers policy exists
   aws cloudfront list-response-headers-policies
   
   # Check policy attachment
   aws cloudfront get-distribution-config --id YOUR_DIST_ID \
       | jq '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId'
   ```

2. **Test headers:**
   ```bash
   # Check security headers
   curl -I https://bvester.com | grep -E "(Strict-Transport-Security|X-Frame-Options)"
   ```

## Performance Issues

### Problem: Slow website loading

**Symptoms:**
- High Time to First Byte (TTFB)
- Slow page loads
- Poor performance scores

**Solutions:**

1. **Check CloudFront cache hit ratio:**
   ```bash
   # Monitor CloudFront metrics
   aws cloudwatch get-metric-statistics \
       --namespace AWS/CloudFront \
       --metric-name CacheHitRate \
       --dimensions Name=DistributionId,Value=YOUR_DIST_ID \
       --start-time 2023-01-01T00:00:00Z \
       --end-time 2023-01-02T00:00:00Z \
       --period 3600 \
       --statistics Average
   ```

2. **Optimize cache behaviors:**
   ```bash
   # Review cache policies
   aws cloudfront list-cache-policies
   
   # Update cache behavior
   aws cloudfront update-distribution \
       --id YOUR_DIST_ID \
       --distribution-config file://optimized-config.json
   ```

3. **Enable compression:**
   ```bash
   # Verify compression is enabled
   curl -H "Accept-Encoding: gzip" -I https://bvester.com
   ```

### Problem: High data transfer costs

**Symptoms:**
- Unexpected CloudFront costs
- High bandwidth usage
- Large bills

**Solutions:**

1. **Check price class:**
   ```bash
   # Verify price class is PriceClass_100
   aws cloudfront get-distribution-config --id YOUR_DIST_ID \
       | jq '.DistributionConfig.PriceClass'
   ```

2. **Monitor data transfer:**
   ```bash
   # Check data transfer metrics
   aws cloudwatch get-metric-statistics \
       --namespace AWS/CloudFront \
       --metric-name BytesDownloaded \
       --dimensions Name=DistributionId,Value=YOUR_DIST_ID \
       --start-time 2023-01-01T00:00:00Z \
       --end-time 2023-01-02T00:00:00Z \
       --period 86400 \
       --statistics Sum
   ```

## Cost and Billing Issues

### Problem: Unexpected charges

**Symptoms:**
- Higher than expected AWS bill
- Charges for unknown services
- Cost allocation issues

**Solutions:**

1. **Check Cost Explorer:**
   ```bash
   # Get cost and usage
   aws ce get-cost-and-usage \
       --time-period Start=2023-01-01,End=2023-02-01 \
       --granularity MONTHLY \
       --metrics BlendedCost \
       --group-by Type=DIMENSION,Key=SERVICE
   ```

2. **Review resource usage:**
   ```bash
   # Check CloudFront usage
   aws cloudfront get-distribution-config --id YOUR_DIST_ID
   
   # Check S3 storage
   aws s3 ls s3://bvester.com --recursive --summarize
   ```

3. **Set up billing alerts:**
   ```bash
   # Create billing alarm
   aws cloudwatch put-metric-alarm \
       --alarm-name "bvester-billing-alert" \
       --alarm-description "Alert when monthly charges exceed threshold" \
       --metric-name EstimatedCharges \
       --namespace AWS/Billing \
       --statistic Maximum \
       --period 86400 \
       --evaluation-periods 1 \
       --threshold 50 \
       --comparison-operator GreaterThanThreshold
   ```

## Emergency Procedures

### Complete Service Outage

1. **Check AWS Service Health:**
   ```bash
   # Check AWS status
   curl -s "https://status.aws.amazon.com/"
   ```

2. **Enable emergency maintenance page:**
   ```bash
   # Upload maintenance page
   aws s3 cp maintenance.html s3://bvester.com/index.html
   
   # Invalidate cache
   aws cloudfront create-invalidation \
       --distribution-id YOUR_DIST_ID \
       --paths "/index.html"
   ```

### Security Incident

1. **Immediately block suspicious traffic:**
   ```bash
   # Add IP blocking rule to WAF
   aws wafv2 update-ip-set \
       --scope CLOUDFRONT \
       --id YOUR_IP_SET_ID \
       --addresses "MALICIOUS_IP/32"
   ```

2. **Review access logs:**
   ```bash
   # Download CloudFront logs
   aws s3 sync s3://bvester.com-logs/cloudfront-logs/ ./logs/
   
   # Analyze for suspicious activity
   grep "SUSPICIOUS_PATTERN" ./logs/*.gz
   ```

## Monitoring and Alerting

### Set up comprehensive monitoring:

```bash
# CloudWatch alarms for key metrics
aws cloudwatch put-metric-alarm \
    --alarm-name "bvester-4xx-errors" \
    --alarm-description "High 4xx error rate" \
    --metric-name 4xxErrorRate \
    --namespace AWS/CloudFront \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold

# SNS topic for alerts
aws sns create-topic --name bvester-alerts

# Subscribe to alerts
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:bvester-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com
```

## Getting Help

### AWS Support Resources

1. **AWS Documentation**: https://docs.aws.amazon.com/
2. **AWS Forums**: https://forums.aws.amazon.com/
3. **Stack Overflow**: Tag questions with `amazon-web-services`
4. **AWS Support Center**: For customers with support plans

### Diagnostic Commands

```bash
# Complete system check
./scripts/update-dns.sh status

# Infrastructure health check
aws cloudformation describe-stacks --stack-name bvester-cloudfront
aws cloudformation describe-stacks --stack-name bvester-s3
aws cloudformation describe-stacks --stack-name bvester-route53

# Network diagnostics
dig +trace bvester.com
mtr bvester.com
curl -I -v https://bvester.com
```

Remember to always test changes in a development environment first and maintain backups of all configurations.