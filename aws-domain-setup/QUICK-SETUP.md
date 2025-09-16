# Quick Setup Checklist for bvester.com

## Prerequisites ✅
- [ ] AWS Account with billing enabled
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Domain ownership or ability to purchase
- [ ] Credit card for AWS services

## Manual Setup Steps

### 1️⃣ Domain Setup (10 minutes)
1. **Go to Route 53 Console**: https://console.aws.amazon.com/route53
2. **Register Domain** (if new):
   - Click "Register Domain"
   - Search for "bvester.com"
   - Add to cart ($12/year)
   - Complete purchase

### 2️⃣ SSL Certificate (5 minutes)
1. **Go to Certificate Manager**: https://console.aws.amazon.com/acm (US East 1)
2. **Request Certificate**:
   - Click "Request a certificate"
   - Choose "Request a public certificate"
   - Add domain names:
     - `bvester.com`
     - `www.bvester.com`
     - `api.bvester.com`
   - Choose DNS validation
   - Click "Request"
3. **Validate**:
   - Click on certificate
   - Click "Create records in Route 53"
   - Wait 5-30 minutes for validation

### 3️⃣ S3 Setup (10 minutes)
1. **Go to S3 Console**: https://console.aws.amazon.com/s3
2. **Create Main Bucket**:
   - Name: `bvester-website-public`
   - Region: US East 1
   - Uncheck "Block all public access"
   - Enable "Static website hosting"
   - Index document: `index.html`
   - Error document: `error.html`
3. **Create Redirect Bucket**:
   - Name: `www-bvester-website-public`
   - Enable redirect to `bvester.com`

### 4️⃣ CloudFront Setup (15 minutes)
1. **Go to CloudFront Console**: https://console.aws.amazon.com/cloudfront
2. **Create Distribution**:
   - Origin Domain: `bvester-website-public.s3-website-us-east-1.amazonaws.com`
   - Viewer Protocol: Redirect HTTP to HTTPS
   - Alternate Domain Names:
     - `bvester.com`
     - `www.bvester.com`
   - SSL Certificate: Select your ACM certificate
   - Default Root Object: `index.html`
3. **Wait for deployment** (15-30 minutes)

### 5️⃣ Route 53 DNS (5 minutes)
1. **Go to Route 53 Hosted Zones**
2. **Create Records**:
   - **A Record** (apex):
     - Name: (leave blank)
     - Type: A
     - Alias: Yes
     - Target: CloudFront distribution
   - **CNAME** (www):
     - Name: www
     - Type: CNAME
     - Value: `bvester.com`
   - **CNAME** (api):
     - Name: api
     - Type: CNAME
     - Value: `bvester-backend-env.eba-iym3cqmz.eu-west-2.elasticbeanstalk.com`

## Automated Setup 🚀

### Windows (PowerShell):
```powershell
cd aws-domain-setup
.\setup-domain.ps1
```

### Mac/Linux:
```bash
cd aws-domain-setup
chmod +x setup-domain.sh
./setup-domain.sh
```

## Verification Checklist ✔️
- [ ] HTTPS works: `https://bvester.com`
- [ ] WWW redirects: `https://www.bvester.com` → `https://bvester.com`
- [ ] API accessible: `https://api.bvester.com/health`
- [ ] SSL certificate valid (green padlock)
- [ ] Content loads correctly

## Deployment Commands

### Deploy Frontend:
```bash
cd web-app
npm run build
aws s3 sync ./build s3://bvester-website-public --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Deploy Backend:
```bash
cd backend
eb deploy
```

## Cost Breakdown 💰
| Service | Monthly Cost |
|---------|-------------|
| Route 53 | $0.50 |
| S3 Storage | ~$1 |
| CloudFront | ~$5-10 |
| Certificate | Free |
| **Total** | **~$7-12/month** |

Plus: $12/year for domain

## Troubleshooting 🔧

### Domain not working?
- Check nameservers are updated
- Wait up to 48 hours for DNS propagation
- Use `nslookup bvester.com`

### SSL not working?
- Ensure certificate is in US-East-1
- Check certificate is validated
- Verify CloudFront uses the certificate

### Content not updating?
- Invalidate CloudFront cache
- Check S3 sync completed
- Clear browser cache

## Support Resources
- [AWS Route 53 Docs](https://docs.aws.amazon.com/route53/)
- [CloudFront Best Practices](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Hosting Guide](https://docs.aws.amazon.com/s3/static-website-hosting)

---

**Ready to go live? Run the setup script! 🚀**