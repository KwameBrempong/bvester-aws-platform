# 💳 BVESTER PAYMENT SETUP GUIDE

## **STEP 1: STRIPE SETUP (Primary Global Processor)**

### **1.1 Create Stripe Account**
🔗 **Go to**: https://dashboard.stripe.com/register

**Business Information Required:**
- Business name: Bvester Ltd (or your company name)
- Business type: Financial Services / Investment Platform
- Country: Your country of incorporation
- Website: bvester.com
- Business description: "Investment platform connecting African SMEs with global investors"

### **1.2 Complete Business Verification**
**Documents needed:**
- Business registration certificate
- Tax identification number
- Bank account details
- Director identification documents
- Proof of business address

**Verification timeline: 2-7 business days**

### **1.3 Go Live Process**
1. **Complete all verification steps**
2. **Activate your account** (Stripe will email when ready)
3. **Switch to Live Mode** in dashboard (top-left toggle)
4. **Review and accept** terms of service

### **1.4 Get Live API Keys**
1. **Go to**: Dashboard → Developers → API keys
2. **Reveal Live Keys** (must be in Live mode)
3. **Copy these keys**:

```bash
# Add these to your .env file:
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxx
```

**⚠️ CRITICAL**: Never expose secret keys in client-side code!

### **1.5 Configure Webhooks**
1. **Go to**: Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
3. **Events to send**:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.dispute.created
   - invoice.payment_succeeded

4. **Copy webhook signing secret** to .env:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## **STEP 2: FLUTTERWAVE SETUP (African Payments)**

### **2.1 Create Flutterwave Account**
🔗 **Go to**: https://dashboard.flutterwave.com/signup

**Choose Account Type**: Business Account

**Business Information Required:**
- Business name: Bvester Ltd
- Business type: Fintech/Financial Services
- Country: Your primary African market (Nigeria recommended)
- Website: bvester.com
- Business category: Investment Platform

### **2.2 Complete KYC Verification**
**Documents Required:**
- Certificate of incorporation
- Tax identification number (TIN)
- Bank account verification
- Director's identification (International passport/National ID)
- Utility bill (proof of address)
- Business permit (if applicable)

**Processing Time: 3-10 business days**

### **2.3 Go Live Approval**
1. **Submit Go-Live Request** in dashboard
2. **Complete compliance review**
3. **Wait for approval** (can take 2-4 weeks)
4. **Activate live mode** once approved

### **2.4 Get Live API Keys**
1. **Go to**: Settings → API Keys
2. **Switch to Live Environment**
3. **Copy API Keys**:

```bash
# Add these to your .env file:
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxx-X
```

### **2.5 Configure Webhooks**
1. **Go to**: Settings → Webhooks
2. **Add webhook URL**: `https://your-domain.com/api/flutterwave/webhook`
3. **Select events**:
   - charge.completed
   - transfer.completed
   - charge.failed

4. **Copy webhook hash** to .env:
```bash
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash
```

---

## **STEP 3: ENVIRONMENT CONFIGURATION**

### **3.1 Update Your .env File**
```bash
# Payment Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_key
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_actual_flutterwave_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_actual_flutterwave_secret
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash

# Payment Settings
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_PAYMENT_CURRENCY=USD
EXPO_PUBLIC_MIN_INVESTMENT=100
EXPO_PUBLIC_MAX_INVESTMENT=100000
```

### **3.2 Verify Configuration**
```bash
# Test your configuration
npm run test:payments
```

---

## **STEP 4: TESTING PAYMENT INTEGRATION**

### **4.1 Test Mode Setup (Do This First)**
Before going live, test with sandbox/test credentials:

**Stripe Test Mode:**
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

**Flutterwave Test Mode:**
```bash
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-test-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-test-xxxxx
```

### **4.2 Test Scenarios**
1. **Successful Payment**: Test with valid test card
2. **Failed Payment**: Test with declined test card
3. **Refund Process**: Test refund functionality
4. **Webhook Handling**: Verify webhook processing
5. **Mobile Money**: Test African mobile payment methods

### **4.3 Test Cards**

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Fraud: 4100 0000 0000 0019
```

**Flutterwave Test Cards:**
```
Success: 5531 8866 5214 2950
Decline: 5061 4604 0000 0000 19
```

---

## **STEP 5: MOBILE MONEY INTEGRATION (African Markets)**

### **5.1 Supported Mobile Money Providers**
- **Nigeria**: MTN, Airtel, 9mobile, Glo
- **Ghana**: MTN, Vodafone, AirtelTigo
- **Kenya**: M-Pesa, Airtel Money
- **Uganda**: MTN, Airtel Money
- **Tanzania**: M-Pesa, Airtel Money, Tigo Pesa

### **5.2 Mobile Money Configuration**
```javascript
// Add to payment configuration
const MOBILE_MONEY_PROVIDERS = {
  NG: ['mtn', 'airtel', '9mobile', 'glo'],
  GH: ['mtn', 'vodafone', 'airteltigo'],
  KE: ['mpesa', 'airtel'],
  UG: ['mtn', 'airtel'],
  TZ: ['mpesa', 'airtel', 'tigo']
};
```

---

## **STEP 6: COMPLIANCE AND LEGAL**

### **6.1 Investment Platform Compliance**
- **SEC Registration**: May be required in some jurisdictions
- **AML/KYC Compliance**: Implement user verification
- **Data Protection**: GDPR, CCPA, local data laws
- **Financial Services License**: Check requirements per country

### **6.2 Payment Compliance**
- **PCI DSS Compliance**: Level 1 certification required
- **Strong Customer Authentication**: 3D Secure implementation
- **Anti-Fraud Measures**: Implement fraud detection
- **Transaction Monitoring**: Monitor suspicious activity

---

## **STEP 7: PRODUCTION DEPLOYMENT**

### **7.1 Pre-Launch Checklist**
- [ ] Stripe live mode activated
- [ ] Flutterwave live mode approved
- [ ] All API keys configured
- [ ] Webhooks configured and tested
- [ ] Payment flows tested end-to-end
- [ ] Refund process tested
- [ ] Error handling implemented
- [ ] Security measures active

### **7.2 Launch Monitoring**
```bash
# Monitor key metrics:
- Payment success rates
- Failed transaction reasons
- Processing times
- Fraud detection alerts
- Webhook delivery status
```

### **7.3 User Communication**
**Supported Payment Methods by Region:**
- **Global**: Credit/Debit Cards, Bank Transfers
- **Africa**: Cards, Bank Transfer, Mobile Money, USSD
- **Diaspora**: Cards, Bank Transfer, Apple Pay, Google Pay

---

## **STEP 8: ONGOING MAINTENANCE**

### **8.1 Regular Tasks**
- **Monthly**: Review transaction reports
- **Weekly**: Check for failed webhooks
- **Daily**: Monitor fraud alerts
- **Real-time**: Transaction monitoring dashboard

### **8.2 Support and Troubleshooting**
**Stripe Support**: https://support.stripe.com
**Flutterwave Support**: https://support.flutterwave.com

**Common Issues:**
- Webhook failures → Check endpoint URL and SSL
- Payment declines → Review fraud rules
- Mobile money failures → Check country availability

---

## **🚀 IMMEDIATE ACTION REQUIRED**

### **TODAY: Complete Account Setup**
1. **Create Stripe account** → Submit for verification
2. **Create Flutterwave account** → Submit KYC documents
3. **Test integration** with sandbox credentials
4. **Configure webhooks** for both processors

### **THIS WEEK: Go Live Process**
1. **Complete verification** with both processors
2. **Get live API keys** and update .env
3. **Deploy payment integration** to production
4. **Test live transactions** with small amounts

### **NEXT STEPS: Marketing & Scale**
1. **Launch payment functionality** 
2. **Monitor transaction metrics**
3. **Optimize conversion rates**
4. **Expand to new markets**

**Payment integration is critical for platform success. Complete setup ASAP to start processing real investments!** 💰