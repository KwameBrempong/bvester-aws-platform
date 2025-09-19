# Custom Domain Setup: bvester.com

## Current Status
✅ **Code Committed**: All code is committed to GitHub  
✅ **Firebase Hosting**: Live at https://bvester-com.web.app  
🔄 **Custom Domain**: Need to configure bvester.com

## Steps to Configure bvester.com

### 1. Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **bizinvest-hub-prod**
3. Navigate to **Hosting** section
4. Click on your site: **bvester-com**
5. Click **Add custom domain**
6. Enter domain: `bvester.com`
7. Click **Continue**

### 2. Configure DNS Records

Firebase will provide you with DNS records to configure. You'll need to add these to your domain registrar:

**Typical DNS Records (Firebase will provide exact values):**
```
Type: A
Name: @
Value: [Firebase IP addresses]

Type: CNAME  
Name: www
Value: bvester-com.web.app
```

### 3. Verify Domain Ownership

1. Firebase will provide a TXT record for verification
2. Add the TXT record to your DNS settings
3. Wait for DNS propagation (can take 24-48 hours)
4. Click **Verify** in Firebase Console

### 4. SSL Certificate

- Firebase automatically provisions SSL certificates
- HTTPS will be enforced once setup is complete
- Certificate renewal is automatic

## Alternative: Using Firebase CLI

If Firebase CLI is working, you can also configure domains via command line:

```bash
# Add custom domain
firebase hosting:sites:create bvester-com

# Configure domain (requires manual DNS setup)
firebase hosting:channel:deploy preview --site bvester-com
```

## DNS Configuration Examples

### For Namecheap:
1. Go to Domain List → Manage → Advanced DNS
2. Add A records pointing to Firebase IPs
3. Add CNAME record for www subdomain

### For GoDaddy:
1. Go to DNS Management
2. Add A records with Firebase IPs
3. Add CNAME for www subdomain

### For Cloudflare:
1. Add A records (set proxy to DNS only initially)
2. Add CNAME records
3. Enable proxy after domain is verified

## Testing Domain Setup

Once DNS is configured and propagated:

```bash
# Test domain resolution
nslookup bvester.com

# Test HTTPS
curl -I https://bvester.com

# Verify certificate
openssl s_client -connect bvester.com:443 -servername bvester.com
```

## Troubleshooting

- **DNS Propagation**: Can take 24-48 hours
- **Certificate Issues**: Wait for full DNS propagation before troubleshooting
- **CNAME Conflicts**: Remove any existing CNAME records for @ record
- **Subdomain Issues**: Ensure www CNAME points to your Firebase subdomain

## Update Firebase Configuration

After domain is active, you may want to update your Firebase config:

```javascript
// Update firebaseConfig in your app if needed
const firebaseConfig = {
  apiKey: "AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80",
  authDomain: "bvester.com", // Update to custom domain
  projectId: "bizinvest-hub-prod",
  // ... other config
};
```

## Expected Timeline
- **Domain Setup**: 5-10 minutes in Firebase Console
- **DNS Configuration**: 5-15 minutes with registrar
- **DNS Propagation**: 1-48 hours
- **SSL Certificate**: Automatic after DNS propagation
- **Total Time**: 1-48 hours for full setup