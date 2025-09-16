# Bvester.com Custom Domain Setup Guide

## Current Status ✅
Your Bvester application with the new hexagonal logo is now deployed and ready for custom domain connection.

- **Staging URL**: https://bvester-com.web.app
- **Target Domain**: bvester.com
- **Firebase Project**: bizinvest-hub-prod
- **Hosting Target**: bvester-com

## Deployment Commands

### Quick Deploy
```bash
npm run deploy
# or
firebase deploy --only hosting:bvester-com
```

### Using Deployment Scripts
```bash
# Windows
./deploy-to-bvester.bat

# Linux/Mac
./deploy-to-bvester.sh
```

## Custom Domain Setup Steps

### Step 1: Access Firebase Console
1. Go to: https://console.firebase.google.com/project/bizinvest-hub-prod/hosting
2. Click on the **"bvester-com"** site (not the default one)

### Step 2: Add Custom Domain
1. Click **"Add custom domain"**
2. Enter: `bvester.com`
3. Click **"Continue"**

### Step 3: Domain Verification
Firebase will provide you with a TXT record for domain verification:

```
Record Type: TXT
Name: bvester.com (or @)
Value: [Firebase-provided verification code]
```

Add this TXT record to your domain registrar's DNS settings.

### Step 4: DNS Configuration
After verification, Firebase will provide A records or allow CNAME setup:

#### Option A: A Records (Recommended)
```
Record Type: A
Name: bvester.com (or @)
Value: 151.101.1.195

Record Type: A  
Name: bvester.com (or @)
Value: 151.101.65.195
```

#### Option B: CNAME Record (Alternative)
```
Record Type: CNAME
Name: bvester.com (or www)
Value: bvester-com.web.app
```

### Step 5: SSL Certificate
Firebase automatically provisions SSL certificates for custom domains. This process may take up to 24 hours.

## DNS Propagation
- DNS changes can take 4-48 hours to propagate globally
- You can check propagation status using tools like:
  - https://dnschecker.org
  - https://whatsmydns.net

## Verification Commands

### Check Current Deployment
```bash
curl -s -o /dev/null -w "%{http_code}" https://bvester-com.web.app
# Should return: 200
```

### Check Custom Domain (after setup)
```bash
curl -s -o /dev/null -w "%{http_code}" https://bvester.com
# Should return: 200
```

## Configuration Files Updated

### firebase.json
- Configured hosting target for `bvester-com`
- Added caching headers for optimal performance
- Maintained API rewrites for backend functionality

### .firebaserc
- Added `bvester-com` target mapping
- Ensures deployments go to correct hosting site

### package.json
- Added deployment scripts:
  - `npm run deploy`
  - `npm run deploy:production`
  - `npm run deploy:bvester`

## Features Confirmed ✅
- ✅ Hexagonal logo with golden Africa continent
- ✅ Mobile-optimized responsive design
- ✅ Cache control headers for performance
- ✅ API routing for backend integration
- ✅ Single Page Application (SPA) routing

## Post-Domain Setup
Once bvester.com is live:

1. **Update all marketing materials** to use bvester.com
2. **Set up redirects** from old URLs if needed
3. **Update social media links** and business cards
4. **Configure analytics** for the new domain
5. **Test all functionality** on the live domain

## Troubleshooting

### Domain Not Working
- Verify DNS records are correctly set
- Wait for DNS propagation (up to 48 hours)
- Check for typos in DNS configuration
- Ensure domain registrar supports the record types

### SSL Certificate Issues
- SSL certificates are auto-provisioned by Firebase
- May take up to 24 hours after DNS verification
- Contact Firebase support if issues persist beyond 48 hours

### Deployment Issues
```bash
# Clear Firebase cache and redeploy
firebase deploy --only hosting:bvester-com --force
```

## Support Resources
- Firebase Hosting Documentation: https://firebase.google.com/docs/hosting
- Custom Domain Setup: https://firebase.google.com/docs/hosting/custom-domain
- Firebase Console: https://console.firebase.google.com/project/bizinvest-hub-prod

---

**Next Steps**: Add the TXT record to your domain registrar to begin the verification process.