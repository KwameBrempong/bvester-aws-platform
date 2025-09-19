# SSL Certificate Management Guide for bvester.com

This guide covers SSL/TLS certificate setup, management, and renewal using AWS Certificate Manager (ACM) for bvester.com.

## Table of Contents

1. [Overview](#overview)
2. [Certificate Request](#certificate-request)
3. [DNS Validation](#dns-validation)
4. [Certificate Deployment](#certificate-deployment)
5. [Renewal and Maintenance](#renewal-and-maintenance)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring](#monitoring)

## Overview

### What is AWS Certificate Manager (ACM)?

AWS Certificate Manager (ACM) is a service that provisions, manages, and deploys SSL/TLS certificates for use with AWS services. It handles certificate renewal automatically and integrates seamlessly with CloudFront, Application Load Balancer, and API Gateway.

### Benefits for bvester.com

- **Free SSL certificates** for AWS services
- **Automatic renewal** (no manual intervention required)
- **Domain validation** via DNS
- **Wildcard certificate support**
- **Integration** with CloudFront and other AWS services

## Certificate Request

### 1. Request SSL Certificate

```bash
# Request certificate for bvester.com with subdomains
aws acm request-certificate \
    --domain-name bvester.com \
    --subject-alternative-names www.bvester.com *.bvester.com \
    --validation-method DNS \
    --region us-east-1 \
    --tags Key=Name,Value=bvester.com-ssl Key=Environment,Value=Production
```

### 2. Certificate Details

The certificate will include:
- **Primary domain**: bvester.com
- **Subject Alternative Names**:
  - www.bvester.com
  - *.bvester.com (wildcard for all subdomains)

### 3. Get Certificate ARN

```bash
# List certificates to get ARN
aws acm list-certificates --region us-east-1

# Get specific certificate details
aws acm describe-certificate \
    --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
    --region us-east-1
```

## DNS Validation

### 1. Understanding DNS Validation

DNS validation proves domain ownership by creating specific CNAME records. ACM provides validation records that must be added to your DNS configuration.

### 2. Get Validation Records

```bash
# Get validation records from certificate details
aws acm describe-certificate \
    --certificate-arn YOUR_CERTIFICATE_ARN \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]' \
    --output table
```

### 3. Create DNS Validation Records

For each domain in the certificate, create a CNAME record:

```bash
# Example validation record creation
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "_acme-challenge.bvester.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{
                    "Value": "validation-string.acm-validations.aws."
                }]
            }
        }]
    }'
```

### 4. Automated Validation with CloudFormation

The CloudFormation template automatically handles DNS validation:

```yaml
SSLCertificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: !Ref DomainName
    SubjectAlternativeNames:
      - !Sub 'www.${DomainName}'
      - !Sub '*.${DomainName}'
    ValidationMethod: DNS
    DomainValidationOptions:
      - DomainName: !Ref DomainName
        HostedZoneId: !Ref HostedZoneId
      - DomainName: !Sub 'www.${DomainName}'
        HostedZoneId: !Ref HostedZoneId
      - DomainName: !Sub '*.${DomainName}'
        HostedZoneId: !Ref HostedZoneId
```

### 5. Verify Validation

```bash
# Check certificate status
aws acm describe-certificate \
    --certificate-arn YOUR_CERTIFICATE_ARN \
    --region us-east-1 \
    --query 'Certificate.Status'

# Check validation status for each domain
aws acm describe-certificate \
    --certificate-arn YOUR_CERTIFICATE_ARN \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[*].[DomainName,ValidationStatus]' \
    --output table
```

## Certificate Deployment

### 1. CloudFront Integration

```bash
# Update CloudFront distribution with certificate
aws cloudfront update-distribution \
    --id YOUR_DISTRIBUTION_ID \
    --distribution-config '{
        "ViewerCertificate": {
            "ACMCertificateArn": "YOUR_CERTIFICATE_ARN",
            "SSLSupportMethod": "sni-only",
            "MinimumProtocolVersion": "TLSv1.2_2021",
            "CertificateSource": "acm"
        }
    }'
```

### 2. Verify HTTPS Configuration

```bash
# Test HTTPS connection
curl -I https://bvester.com
curl -I https://www.bvester.com

# Check SSL certificate details
openssl s_client -connect bvester.com:443 -servername bvester.com < /dev/null 2>/dev/null | openssl x509 -noout -text

# Test SSL rating
curl -s "https://api.ssllabs.com/api/v3/analyze?host=bvester.com" | jq '.endpoints[0].grade'
```

### 3. Configure Security Settings

```bash
# Check TLS configuration
nmap --script ssl-enum-ciphers -p 443 bvester.com

# Test specific TLS versions
openssl s_client -connect bvester.com:443 -tls1_2 < /dev/null
openssl s_client -connect bvester.com:443 -tls1_3 < /dev/null
```

## Renewal and Maintenance

### 1. Automatic Renewal

ACM automatically renews certificates before expiration if:
- Certificate is in use by an AWS service
- DNS validation records remain in place
- Domain ownership can be verified

### 2. Monitor Certificate Expiration

```bash
# Check certificate expiration
aws acm describe-certificate \
    --certificate-arn YOUR_CERTIFICATE_ARN \
    --region us-east-1 \
    --query 'Certificate.[DomainName,NotAfter,Status]' \
    --output table
```

### 3. Set Up Expiration Alerts

```bash
# Create CloudWatch alarm for certificate expiration
aws cloudwatch put-metric-alarm \
    --alarm-name "bvester-ssl-certificate-expiration" \
    --alarm-description "SSL certificate approaching expiration" \
    --metric-name DaysToExpiry \
    --namespace AWS/CertificateManager \
    --statistic Minimum \
    --period 86400 \
    --evaluation-periods 1 \
    --threshold 30 \
    --comparison-operator LessThanThreshold \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:bvester-alerts
```

### 4. Manual Renewal Process

If automatic renewal fails:

```bash
# 1. Request new certificate
aws acm request-certificate \
    --domain-name bvester.com \
    --subject-alternative-names www.bvester.com *.bvester.com \
    --validation-method DNS \
    --region us-east-1

# 2. Complete DNS validation (same process as initial setup)

# 3. Update CloudFront distribution with new certificate ARN

# 4. Delete old certificate
aws acm delete-certificate --certificate-arn OLD_CERTIFICATE_ARN --region us-east-1
```

## Security Best Practices

### 1. TLS Configuration

**Recommended settings:**
- **Minimum TLS version**: 1.2
- **Preferred version**: 1.3
- **Cipher suites**: Strong ciphers only
- **Perfect Forward Secrecy**: Enabled

### 2. Certificate Transparency

```bash
# Check certificate transparency logs
curl -s "https://crt.sh/?q=bvester.com&output=json" | jq '.[0]'
```

### 3. HSTS (HTTP Strict Transport Security)

Ensure HSTS headers are configured in CloudFront:

```json
{
  "strictTransportSecurity": {
    "accessControlMaxAgeSec": 31536000,
    "includeSubdomains": true,
    "preload": true,
    "override": true
  }
}
```

### 4. Certificate Pinning (Optional)

For enhanced security, consider certificate pinning:

```bash
# Get certificate fingerprint
openssl s_client -connect bvester.com:443 < /dev/null 2>/dev/null | \
openssl x509 -fingerprint -noout -sha256
```

### 5. Regular Security Audits

```bash
# SSL Labs test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=bvester.com&all=done" | \
jq '.endpoints[0].grade'

# Mozilla Observatory
curl -X POST "https://http-observatory.security.mozilla.org/api/v1/analyze?host=bvester.com"
```

## Troubleshooting

### Common Issues

#### 1. Certificate Validation Stuck

**Problem**: Certificate remains in "Pending validation" status

**Solutions**:
```bash
# Check DNS validation records exist
dig CNAME _acme-challenge.bvester.com

# Verify correct Route 53 hosted zone
aws route53 list-resource-record-sets \
    --hosted-zone-id YOUR_ZONE_ID \
    --query 'ResourceRecordSets[?Type==`CNAME`]'

# Recreate validation records if needed
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_ZONE_ID \
    --change-batch file://validation-record.json
```

#### 2. Certificate Not Appearing in CloudFront

**Problem**: Certificate doesn't show in CloudFront dropdown

**Solutions**:
```bash
# Ensure certificate is in us-east-1 region
aws acm list-certificates --region us-east-1

# Check certificate status is "ISSUED"
aws acm describe-certificate \
    --certificate-arn YOUR_CERT_ARN \
    --region us-east-1 \
    --query 'Certificate.Status'
```

#### 3. Mixed Content Warnings

**Problem**: HTTPS pages loading HTTP resources

**Solutions**:
- Update all resource URLs to HTTPS
- Use protocol-relative URLs (//)
- Configure Content Security Policy headers

#### 4. Certificate Renewal Failures

**Problem**: ACM fails to renew certificate automatically

**Solutions**:
```bash
# Check DNS validation records still exist
dig CNAME _acme-challenge.bvester.com

# Verify domain ownership
whois bvester.com

# Check if certificate is in use
aws acm describe-certificate \
    --certificate-arn YOUR_CERT_ARN \
    --region us-east-1 \
    --query 'Certificate.InUseBy'
```

### Debugging Commands

```bash
# Complete SSL test suite
echo "Testing SSL configuration for bvester.com..."

# Basic connectivity
curl -I https://bvester.com

# Certificate details
openssl s_client -connect bvester.com:443 -servername bvester.com < /dev/null 2>/dev/null | \
openssl x509 -noout -text | grep -E "(Subject:|Issuer:|Not After)"

# Cipher suites
nmap --script ssl-enum-ciphers -p 443 bvester.com

# TLS versions
for version in tls1 tls1_1 tls1_2 tls1_3; do
    echo "Testing $version:"
    openssl s_client -connect bvester.com:443 -$version < /dev/null 2>/dev/null | grep "Protocol"
done

# OCSP stapling
openssl s_client -connect bvester.com:443 -status < /dev/null 2>/dev/null | grep -A5 "OCSP"
```

## Monitoring

### 1. Certificate Monitoring Script

Create a monitoring script:

```bash
#!/bin/bash
# ssl-monitor.sh

DOMAIN="bvester.com"
CERT_ARN="YOUR_CERTIFICATE_ARN"

# Check certificate expiration
EXPIRY_DATE=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region us-east-1 \
    --query 'Certificate.NotAfter' \
    --output text)

EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_TO_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

echo "Certificate expires in $DAYS_TO_EXPIRY days"

if [ $DAYS_TO_EXPIRY -lt 30 ]; then
    echo "WARNING: Certificate expires soon!"
    # Send alert
fi

# Test HTTPS connectivity
if curl -f -s https://$DOMAIN > /dev/null; then
    echo "HTTPS connectivity: OK"
else
    echo "HTTPS connectivity: FAILED"
fi
```

### 2. CloudWatch Metrics

Monitor key metrics:
- Certificate expiration days
- TLS handshake errors
- SSL Labs grade changes

### 3. Automated Testing

Set up automated SSL testing:

```bash
# Daily SSL check script
#!/bin/bash
# daily-ssl-check.sh

DOMAIN="bvester.com"
LOG_FILE="/var/log/ssl-check.log"

echo "$(date): Starting SSL check for $DOMAIN" >> $LOG_FILE

# Test SSL Labs grade
GRADE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&all=done" | jq -r '.endpoints[0].grade')
echo "$(date): SSL Labs grade: $GRADE" >> $LOG_FILE

# Test certificate validity
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "$(date): Certificate validation: PASSED" >> $LOG_FILE
else
    echo "$(date): Certificate validation: FAILED" >> $LOG_FILE
fi
```

## Emergency Procedures

### Certificate Compromise

If your certificate is compromised:

1. **Immediately revoke the certificate:**
   ```bash
   aws acm delete-certificate --certificate-arn COMPROMISED_CERT_ARN --region us-east-1
   ```

2. **Request new certificate:**
   ```bash
   aws acm request-certificate \
       --domain-name bvester.com \
       --subject-alternative-names www.bvester.com *.bvester.com \
       --validation-method DNS \
       --region us-east-1
   ```

3. **Update all services** with new certificate ARN

4. **Monitor certificate transparency logs** for unauthorized certificates

### Service Outage Due to SSL

1. **Temporarily disable HTTPS redirect** (if needed)
2. **Check certificate status and validation**
3. **Verify DNS records are intact**
4. **Contact AWS Support** if ACM service issues

## Best Practices Summary

1. **Always use DNS validation** for automated renewal
2. **Keep validation records** in Route 53 permanently
3. **Monitor certificate expiration** with CloudWatch alarms
4. **Use strong TLS configuration** (1.2+ only)
5. **Enable HSTS** with preload
6. **Regular security audits** with SSL Labs
7. **Document certificate ARNs** and renewal procedures
8. **Test certificate changes** in staging first
9. **Automate certificate deployment** with CloudFormation
10. **Monitor certificate transparency** logs for security

## Resources

- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Certificate Transparency Logs](https://crt.sh/)
- [OWASP Transport Layer Protection](https://owasp.org/www-project-cheat-sheets/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)