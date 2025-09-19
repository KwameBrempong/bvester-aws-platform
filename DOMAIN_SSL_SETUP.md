# 🌐 Domain & SSL Setup Guide

## 📋 Domain Configuration for Production

### 1. 🏷️ Purchase Domain

**Recommended Domain Registrars:**
- **Namecheap** (budget-friendly, good support)
- **Google Domains** (reliable, easy DNS management)
- **GoDaddy** (popular, many features)
- **Cloudflare Registrar** (at-cost pricing, excellent security)

**Suggested Domains:**
- `bvester.com` (primary recommendation)
- `bvester.africa` (African focus)
- `bizinvest.africa` (descriptive)
- `africaninvest.co` (clear purpose)

### 2. 🔧 DNS Configuration

**DNS Records to Set Up:**

```dns
# Main website
A     @             xxx.xxx.xxx.xxx (your hosting IP)
CNAME www           yourdomain.com

# API subdomain  
CNAME api           your-backend-url.herokuapp.com
CNAME api-staging   your-staging-backend.herokuapp.com

# Email
MX    @             smtp.sendgrid.net (priority 10)
TXT   @             "v=spf1 include:sendgrid.net ~all"

# Security
TXT   _dmarc        "v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com"
```

### 3. 🔒 SSL Certificate Setup

**Option A: Let's Encrypt (Free)**
```bash
# Using Certbot
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Option B: Cloudflare (Free + CDN)**
1. Sign up at [Cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers at your registrar
4. Enable "Full (strict)" SSL mode
5. Set up page rules for API routing

**Option C: Cloud Provider SSL**
- **Heroku**: Automatic SSL with custom domains ($7/month)
- **Google Cloud**: Managed SSL certificates (free)
- **AWS**: Certificate Manager (free)

### 4. 🌐 Subdomain Structure

**Recommended Setup:**
```
yourdomain.com           - Main website/landing page
app.yourdomain.com       - Web application
api.yourdomain.com       - Backend API
admin.yourdomain.com     - Admin dashboard
docs.yourdomain.com      - API documentation
status.yourdomain.com    - System status page
```

### 5. 📱 Mobile App Configuration

**Update your app config:**
```javascript
// In src/config/api.js
const API_CONFIG = {
  production: {
    baseURL: 'https://api.yourdomain.com',
    timeout: 15000,
  }
};
```

**Update CORS settings:**
```env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com
```

### 6. 🔐 Security Headers

**Add to your backend (already included in demo-server.js):**
```javascript
// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 7. 🌐 CDN Setup (Optional but Recommended)

**Cloudflare Setup:**
1. Add domain to Cloudflare
2. Enable "Always Use HTTPS"
3. Set minification (HTML, CSS, JS)
4. Enable Browser Cache TTL
5. Set up page rules:
   ```
   api.yourdomain.com/*     - Cache Level: Bypass
   *.yourdomain.com/static/* - Cache Level: Standard
   ```

**AWS CloudFront Setup:**
```bash
# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 8. 📊 Domain Monitoring

**Setup Domain Monitoring:**
- **UptimeRobot** (free monitoring)
- **Pingdom** (detailed monitoring)
- **StatusPage.io** (public status page)

**Health Check Endpoints:**
```javascript
// Already available in your backend
GET /health                    - Basic health check
GET /api/info                 - API information
GET /api/admin/system-status  - Detailed system status
```

### 9. 🔍 SEO Configuration

**Add to your main website:**
```html
<!-- Meta tags -->
<meta name="description" content="Connect global investors with African SMEs. Secure investment platform for sustainable growth.">
<meta name="keywords" content="African investment, SME funding, startup investment, ESG investing">

<!-- Open Graph -->
<meta property="og:title" content="Bvester - African Investment Platform">
<meta property="og:description" content="Connecting global investors with African SMEs">
<meta property="og:url" content="https://yourdomain.com">
<meta property="og:image" content="https://yourdomain.com/og-image.jpg">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Bvester - African Investment Platform">
<meta name="twitter:description" content="Connecting global investors with African SMEs">
```

### 10. 📧 Email Domain Setup

**For SendGrid:**
```dns
# DNS records for yourdomain.com
CNAME   em123        u123.wl.sendgrid.net
CNAME   s1._domainkey s1.wl.sendgrid.net
CNAME   s2._domainkey s2.wl.sendgrid.net
```

**Update email settings:**
```env
EMAIL_FROM=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

### 11. 🚀 Deployment Commands with Custom Domain

**Heroku with Custom Domain:**
```bash
# Add custom domain
heroku domains:add api.yourdomain.com
heroku domains:add app.yourdomain.com

# Enable SSL
heroku certs:auto:enable
```

**Google Cloud with Custom Domain:**
```bash
# Map domain to Cloud Run
gcloud run domain-mappings create \
  --service bvester-backend \
  --domain api.yourdomain.com
```

### 12. 📱 App Store Configuration

**For mobile app deployment:**
```json
{
  "expo": {
    "name": "Bvester",
    "slug": "bvester",
    "scheme": "bvester",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "ios": {
      "bundleIdentifier": "com.yourdomain.bvester",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourdomain.bvester",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## ✅ Domain Setup Checklist

- [ ] **Domain purchased** from registrar
- [ ] **DNS records configured** (A, CNAME, MX, TXT)
- [ ] **SSL certificate installed** (Let's Encrypt/Cloudflare/Provider)
- [ ] **Subdomains created** (api, app, admin, docs)
- [ ] **CDN configured** (optional but recommended)
- [ ] **Email domain verified** with SendGrid
- [ ] **Security headers enabled** on backend
- [ ] **CORS updated** with production domains
- [ ] **App configuration updated** with production URLs
- [ ] **Monitoring setup** for uptime and performance

## 📞 Final Configuration

**Your production URLs will be:**
- **Main Website**: `https://yourdomain.com`
- **Web App**: `https://app.yourdomain.com`
- **API Backend**: `https://api.yourdomain.com`
- **Admin Panel**: `https://admin.yourdomain.com`
- **Documentation**: `https://docs.yourdomain.com`

**Total setup time**: 2-4 hours  
**Annual cost**: $10-50 for domain + SSL (if not using free options)

Your Bvester platform will have a professional domain with enterprise-grade security! 🌟