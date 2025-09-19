# AWS Domain Setup Guide for bvester.com

This guide provides a complete AWS infrastructure setup for hosting bvester.com with HTTPS support for both www.bvester.com and bvester.com.

## Architecture Overview

- **Route 53**: DNS management and domain hosting
- **CloudFront**: CDN and HTTPS termination
- **S3**: Static website hosting
- **ACM**: SSL/TLS certificate management
- **IAM**: Access control and deployment permissions

## Prerequisites

1. AWS CLI installed and configured
2. Domain bvester.com registered (can be registered through Route 53 or external registrar)
3. AWS account with appropriate permissions
4. Node.js and npm (for deployment scripts)

## Setup Steps

### 1. Route 53 Configuration
### 2. SSL Certificate Setup with ACM
### 3. S3 Bucket Configuration
### 4. CloudFront Distribution Setup
### 5. DNS Records Configuration
### 6. Automated Deployment

## Quick Start

```bash
# 1. Clone and navigate to aws-domain-setup directory
cd aws-domain-setup

# 2. Configure AWS credentials
aws configure

# 3. Run the automated setup script
./setup-infrastructure.sh

# 4. Deploy your website
./deploy-website.sh
```

## File Structure

```
aws-domain-setup/
├── README.md                          # This guide
├── cloudformation/
│   ├── route53-setup.yaml            # Route 53 hosted zone
│   ├── s3-buckets.yaml               # S3 buckets for hosting
│   ├── cloudfront-distribution.yaml  # CloudFront configuration
│   └── ssl-certificate.yaml         # ACM certificate
├── scripts/
│   ├── setup-infrastructure.sh       # Main setup script
│   ├── deploy-website.sh            # Website deployment
│   ├── update-dns.sh                # DNS record management
│   └── cleanup.sh                   # Cleanup resources
├── configs/
│   ├── cloudfront-config.json       # CloudFront settings
│   ├── s3-bucket-policy.json        # S3 bucket policies
│   └── route53-records.json         # DNS record definitions
└── docs/
    ├── manual-setup-guide.md         # Step-by-step manual setup
    ├── troubleshooting.md            # Common issues and solutions
    └── ssl-certificate-guide.md      # SSL certificate management
```

## Domain Support

This setup supports:
- ✅ https://bvester.com
- ✅ https://www.bvester.com
- ✅ http://bvester.com (redirects to HTTPS)
- ✅ http://www.bvester.com (redirects to HTTPS)

## Cost Estimation

| Service | Monthly Cost (approx.) |
|---------|------------------------|
| Route 53 Hosted Zone | $0.50 |
| CloudFront | $0.085/GB + requests |
| S3 Storage | $0.023/GB |
| ACM Certificate | Free |
| **Total (low traffic)** | **~$1-5/month** |

## Security Features

- SSL/TLS encryption (A+ rating)
- HTTPS redirect
- Security headers
- Origin access control
- Custom error pages

## Next Steps

1. Review the configuration files in the `configs/` directory
2. Run the setup script: `./scripts/setup-infrastructure.sh`
3. Deploy your website: `./scripts/deploy-website.sh`
4. Verify DNS propagation and HTTPS
5. Set up monitoring and alerts

For detailed instructions, see `docs/manual-setup-guide.md`.