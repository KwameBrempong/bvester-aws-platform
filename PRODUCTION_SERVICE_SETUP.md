# 🔧 Production Service Setup Guide

## 📋 Required Services for Production

Replace the demo credentials in your `.env` file with real production services:

### 1. 🔥 Firebase Setup

**Create Production Firebase Project:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project" → Name: "bvester-production"
3. Enable Google Analytics (recommended)
4. Wait for project creation

**Enable Required Services:**
1. **Authentication**: Go to Authentication → Get started → Enable Email/Password
2. **Firestore**: Go to Firestore Database → Create database → Production mode
3. **Storage**: Go to Storage → Get started → Production mode

**Generate Service Account:**
1. Go to Project Settings (gear icon) → Service accounts
2. Click "Generate new private key" 
3. Download the JSON file (keep secure!)
4. Copy these values to your `.env`:
   ```env
   FIREBASE_PROJECT_ID=bvester-production
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[paste from JSON]\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=[paste client_email from JSON]
   FIREBASE_ADMIN_CLIENT_ID=[paste client_id from JSON] 
   FIREBASE_ADMIN_PRIVATE_KEY_ID=[paste private_key_id from JSON]
   ```

### 2. 💳 Stripe Setup (Global Payments)

**Create Stripe Account:**
1. Go to [Stripe.com](https://stripe.com) → Sign up
2. Complete business verification (required for live keys)
3. Activate your account

**Get Live API Keys:**
1. Go to Stripe Dashboard → Developers → API keys
2. Toggle to "Live data" (not Test data)
3. Copy these values:
   ```env
   STRIPE_SECRET_KEY=sk_live_[your-actual-live-key]
   ```

**Setup Webhooks (after deployment):**
1. Go to Webhooks → Add endpoint
2. URL: `https://your-api-url.com/api/webhooks/stripe`
3. Events: `payment_intent.succeeded`, `invoice.payment_succeeded`
4. Copy webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
   ```

### 3. 🌍 Flutterwave Setup (African Payments)

**Create Flutterwave Account:**
1. Go to [Flutterwave.com](https://flutterwave.com) → Sign up
2. Complete business verification
3. Submit required documents for African markets

**Get Live API Keys:**
1. Go to Dashboard → Settings → API Keys
2. Switch to "Live" environment
3. Copy these values:
   ```env
   FLUTTERWAVE_SECRET_KEY=FLWSECK-[your-live-key]
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-[your-live-key]
   ```

**Enable Payment Methods:**
1. Go to Payment Methods
2. Enable: Cards, Bank transfers, Mobile money (MTN, Airtel, M-Pesa)
3. Set up settlement accounts for different countries

### 4. 📧 SendGrid Setup (Email Notifications)

**Create SendGrid Account:**
1. Go to [SendGrid.com](https://sendgrid.com) → Try for free
2. Verify your email address
3. Complete account setup

**Create API Key:**
1. Go to Settings → API Keys
2. Click "Create API Key" → Name: "Bvester Production"
3. Permissions: "Full Access" or Mail Send permissions
4. Copy the key:
   ```env
   SENDGRID_API_KEY=SG.[your-api-key]
   ```

**Verify Sender Domain:**
1. Go to Settings → Sender Authentication
2. Authenticate Your Domain → Add your domain (e.g., bvester.com)
3. Add DNS records as instructed
4. Wait for verification (24-48 hours)

### 5. 📱 Twilio Setup (SMS Notifications)

**Create Twilio Account:**
1. Go to [Twilio.com](https://twilio.com) → Sign up
2. Verify your phone number
3. Complete account setup

**Get Credentials:**
1. Go to Twilio Console Dashboard
2. Find "Account Info" section
3. Copy these values:
   ```env
   TWILIO_ACCOUNT_SID=AC[your-account-sid]
   TWILIO_AUTH_TOKEN=[your-auth-token]
   ```

**Get Phone Number (Optional):**
1. Go to Phone Numbers → Manage → Buy a number
2. Choose a number for your region

### 6. 🤖 OpenAI Setup (Optional - for enhanced AI)

**Create OpenAI Account:**
1. Go to [OpenAI.com](https://openai.com) → Sign up
2. Go to API → API Keys
3. Create new secret key:
   ```env
   OPENAI_API_KEY=sk-[your-openai-key]
   ```

### 7. 📊 Sentry Setup (Optional - Error Monitoring)

**Create Sentry Account:**
1. Go to [Sentry.io](https://sentry.io) → Sign up
2. Create new project → Node.js
3. Copy DSN:
   ```env
   SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]
   ```

## 🔄 Updated .env File

Replace your current `.env` with real production values:

```env
# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
NODE_ENV=production
PORT=5000
APP_BASE_URL=https://your-deployed-api-url.com

# ============================================================================
# FIREBASE CONFIGURATION (REQUIRED)
# ============================================================================
FIREBASE_PROJECT_ID=bvester-production
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_REAL_KEY]\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bvester-production.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=[YOUR_CLIENT_ID]
FIREBASE_ADMIN_PRIVATE_KEY_ID=[YOUR_KEY_ID]
FIREBASE_DATABASE_URL=https://bvester-production-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=bvester-production.appspot.com

# ============================================================================
# PAYMENT PROCESSORS (REQUIRED)
# ============================================================================
STRIPE_SECRET_KEY=sk_live_[YOUR_LIVE_STRIPE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]
FLUTTERWAVE_SECRET_KEY=FLWSECK-[YOUR_LIVE_FLUTTERWAVE_KEY]
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-[YOUR_LIVE_FLUTTERWAVE_KEY]

# ============================================================================
# NOTIFICATION SERVICES (REQUIRED)
# ============================================================================
SENDGRID_API_KEY=SG.[YOUR_SENDGRID_KEY]
EMAIL_FROM=noreply@bvester.com
TWILIO_ACCOUNT_SID=AC[YOUR_TWILIO_SID]
TWILIO_AUTH_TOKEN=[YOUR_TWILIO_TOKEN]

# ============================================================================
# SECURITY (ALREADY GENERATED)
# ============================================================================
JWT_SECRET=de58d5108737ca37748806925f302e9de801f01947cbfae733924819d72e1231a03191580aae2f63aa721bafaf23cd8842a245889a58890f2fcc32ce8f65d006
ENCRYPTION_KEY=307c3fc86aceed9fde5e354ef4e95241da0790cc0fe0604c059a17d0023308c0

# ============================================================================
# OPTIONAL SERVICES
# ============================================================================
OPENAI_API_KEY=sk-[YOUR_OPENAI_KEY]
SENTRY_DSN=https://[YOUR_SENTRY_DSN]@sentry.io/[PROJECT_ID]
CORS_ORIGIN=https://your-frontend-domain.com,https://app.bvester.com
```

## 📝 Service Configuration Checklist

- [ ] **Firebase**: Project created, services enabled, service account downloaded
- [ ] **Stripe**: Account verified, live keys obtained, webhooks configured
- [ ] **Flutterwave**: Account verified, live keys obtained, payment methods enabled
- [ ] **SendGrid**: Account created, API key generated, domain verified
- [ ] **Twilio**: Account created, credentials obtained, phone number purchased
- [ ] **OpenAI**: API key generated (optional)
- [ ] **Sentry**: Project created, DSN obtained (optional)

## 🚀 After Service Setup

1. **Update .env** with all real production values
2. **Test locally** to ensure all services work
3. **Deploy to cloud** using your chosen platform
4. **Configure webhooks** with the deployed URL
5. **Test production** deployment end-to-end

## 💰 Cost Estimates (Monthly)

- **Firebase**: Free tier covers most small-medium usage
- **Stripe**: 2.9% + $0.30 per transaction
- **Flutterwave**: 1.4% - 3.8% per transaction (varies by country)
- **SendGrid**: Free tier: 100 emails/day, Paid: $15/month for 40K emails
- **Twilio**: $0.0075 per SMS (varies by country)
- **OpenAI**: $0.002 per 1K tokens (optional)
- **Sentry**: Free tier: 5K errors/month, Paid: $26/month

**Total estimated cost for 1000 active users**: $50-200/month

Your Bvester platform will be production-ready with real services! 🌟