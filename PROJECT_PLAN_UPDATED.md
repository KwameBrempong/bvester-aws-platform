# BizInvest Hub - Updated MVP Project Plan

**Connecting African SMEs with Global Investors - Complete Implementation Guide**

## 🚀 Updated Tech Stack & Dependencies

### Core Setup
```bash
# Initial setup (user runs this first)
expo init bizinvest-hub --template blank
cd bizinvest-hub

# Install all dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install firebase @stripe/stripe-react-native recharts
npm install expo-notifications expo-local-authentication expo-secure-store
npm install @react-native-async-storage/async-storage @react-native-picker/picker
npm install redux react-redux @reduxjs/toolkit  # If state gets complex
```

### Project Structure
```
src/
├── navigation/        # React Navigation setup
├── screens/          # All screen components
│   ├── auth/         # Login/Register with Firebase Auth
│   ├── dashboard/    # Role-based dashboards + Africa Insights
│   ├── records/      # SME financial CRUD (Firestore)
│   ├── analysis/     # Health metrics + Recharts viz
│   ├── investment/   # Search/matching + pledge system
│   ├── agent/        # AI suggestions + admin curation
│   ├── wallet/       # Smart Wallet + hedging alerts
│   └── profile/      # Settings + Stripe subscriptions
├── components/       # Reusable UI components
│   ├── SmartWallet/  # Multi-currency component
│   ├── HedgingAlert/ # Currency risk notifications  
│   ├── AfricaInsights/ # Regional business tips widget
│   └── common/       # Buttons, cards, etc.
├── services/         # API layer
│   ├── firebase/     # Firestore CRUD operations
│   ├── stripe/       # Payment processing stubs
│   ├── analytics/    # Business metrics calculations
│   └── notifications/ # Push notifications
├── utils/            # Helper functions
│   ├── calculations/ # Financial formulas
│   ├── currency/     # Exchange rate handling
│   └── constants/    # Mock data & config
└── config/           # Firebase & API configurations
```

## 📋 Updated Implementation Phases

### Phase 1: ✅ Complete - Foundation Ready
- ✅ Expo setup with core navigation
- ✅ Role-based authentication (mock)
- ✅ Multi-currency context
- ✅ Basic UI structure

### Phase 2: Firebase Integration & Smart Wallet
**Priority: High**

#### 2.1 Firebase Setup
```javascript
// config/firebase.js - Placeholder config
const firebaseConfig = {
  apiKey: "AIza...-placeholder-replace-with-real-key",
  authDomain: "bizinvest-hub-dev.firebaseapp.com", 
  projectId: "bizinvest-hub-dev",
  storageBucket: "bizinvest-hub-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:placeholder"
  // TODO: Replace with real Firebase config in production
};
```

#### 2.2 Smart Wallet Component
- Multi-currency support (USD, NGN, ZAR, KES)
- Mock exchange rates with hardcoded values
- Auto-conversion logic for investments
- Transaction history with Firestore

#### 2.3 Hedging Alert System
- Currency risk notifications based on mock fluctuations
- Regional alerts for forex exposure
- Integration with expo-notifications

### Phase 3: SME Records Module
**Priority: High**

#### 3.1 Financial Transaction CRUD
```javascript
// Firestore collections:
// - transactions: { amount, type, date, currency, category, userId }
// - inventory: { item, quantity, cost, location, userId }
// - sales: { amount, customer, date, products, userId }
// - employees: { name, salary, role, startDate, userId }
```

#### 3.2 Forms & Validation
- Transaction input with real-time validation
- Bulk import functionality (CSV placeholder)
- Offline sync with Firebase persistence

### Phase 4: Health Analysis Engine + Africa Insights
**Priority: High**

#### 4.1 Financial Metrics Calculations
```javascript
// utils/calculations/businessMetrics.js
const calculateCashFlow = (transactions) => { /* implementation */ };
const calculateBurnRate = (expenses, timeframe) => { /* implementation */ };
const calculateCAC_LTV = (customers, revenue) => { /* implementation */ };
const calculateForexExposure = (transactions, baseCurrency) => { /* implementation */ };
const calculateReadinessScore = (allMetrics) => { 
  // Africa-specific scoring algorithm
  // Returns 1-100 score based on regional benchmarks
};
```

#### 4.2 Recharts Visualizations
- Cash flow trends
- Profitability ratios dashboard
- Growth trajectory charts
- Risk assessment spider chart

#### 4.3 🌍 Africa Insights Widget (Unique Feature)
```javascript
// components/AfricaInsights/AfricaInsightsWidget.js
const insights = [
  "Mobile money adoption in Kenya grew 15% this quarter - consider M-Pesa integration",
  "Nigeria's fintech sector shows 40% YoY growth - opportunity for partnerships",
  "South African SMEs benefit from 25% tax relief for digital upgrades",
  "Cross-border trade in East Africa up 18% - explore regional expansion"
];
```

### Phase 5: Investment Matching System
**Priority: High**

#### 5.1 Search & Filter Engine
- Firestore compound queries
- Location-based filtering
- Investment amount ranges
- Expected returns calculator

#### 5.2 Mock Pledge System
```javascript
// No real money flow - all dummy state
const mockPledge = {
  type: 'equity', // 'loan', 'revenue-share'
  amount: 50000,
  terms: { equity: 10, duration: 24 },
  status: 'pending', // 'approved', 'funded'
  escrowMock: true // Placeholder for real escrow
};
```

### Phase 6: Central Agent System
**Priority: Medium**

#### 6.1 Rule-Based Suggestions (80% AI Mock)
```javascript
// Simple algorithm: filter businesses with score > 70
const suggestBusinesses = (investorProfile, allBusinesses) => {
  return allBusinesses
    .filter(b => b.readinessScore > 70)
    .filter(b => matchesInvestorCriteria(b, investorProfile))
    .sort((a, b) => b.readinessScore - a.readinessScore);
};
```

#### 6.2 Admin Curation (20% Human)
- Admin dashboard for business approval
- Manual override for AI suggestions
- Comment system for human reviewers

### Phase 7: Stripe Integration & Monetization
**Priority: Medium**

#### 7.1 Stripe Setup
```javascript
// services/stripe/stripeService.js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_dummy_replace_with_real_key';
// TODO: Replace with real Stripe keys in production

const createSubscription = async (planId) => {
  // Mock implementation returning test data
  console.log('Mock subscription created:', planId);
  return { id: 'sub_mock_123', status: 'active' };
};
```

#### 7.2 Subscription Tiers
- Basic (Free): Limited analysis
- Premium ($9.99/month): Advanced metrics + AI insights
- Enterprise ($49.99/month): White-label + API access

#### 7.3 Transaction Cut Logging
```javascript
// Mock transaction fee tracking for marketplace
const logTransactionCut = (investmentAmount, cutPercentage) => {
  console.log(`Transaction cut: ${investmentAmount * cutPercentage}%`);
  // TODO: Implement real commission tracking in production
};
```

### Phase 8: Security & Offline Features
**Priority: Medium**

#### 8.1 Firebase Offline Persistence
```javascript
// Enable offline support
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
```

#### 8.2 Auth Gates
- Protect all sensitive screens
- Role-based route access
- Biometric authentication stubs

### Phase 9: Claude Code SDK Integration
**Priority: High**

#### 9.1 Code Generation Interface
- Automated financial calculation generation
- Business logic automation
- Custom analysis report generation

### Phase 10: Testing & Deployment
**Priority: Medium**

#### 10.1 Expo Go Testing
- Cross-platform testing (iOS/Android/Web)
- Offline functionality validation
- Currency conversion testing

## 🔧 Placeholder Configurations

### Firebase Config Template
```javascript
// Replace all placeholder values in production
const firebaseConfig = {
  apiKey: "AIza-PLACEHOLDER-REPLACE-IN-PRODUCTION",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### Currency Exchange Rates (Mock)
```javascript
const MOCK_EXCHANGE_RATES = {
  USD: 1.0,
  NGN: 775.50,  // Nigerian Naira
  ZAR: 18.45,   // South African Rand  
  KES: 149.25,  // Kenyan Shilling
  // TODO: Integrate with real forex API (Alpha Vantage, Fixer.io)
};
```

## 🌍 Africa-Specific Features

### Mobile Money Integration Placeholders
```javascript
// Future integration comments throughout codebase
// TODO: Integrate M-Pesa API for Kenya market
// TODO: Add MTN Mobile Money for Uganda/Ghana
// TODO: Implement Paystack for Nigerian market
// TODO: Add EcoCash support for Zimbabwe
```

### Regional Business Tips
- Kenya: M-Pesa integration opportunities
- Nigeria: Fintech partnership potential  
- South Africa: Tax incentive awareness
- Ghana: Cocoa export market insights

## 📱 MVP Testing Checklist

### Authentication Flow
- [ ] Register as SME Owner → Firebase user created
- [ ] Login with Firebase Auth → Role-based navigation
- [ ] Logout → Session cleared properly

### SME Features
- [ ] Add financial transaction → Stored in Firestore
- [ ] View analysis dashboard → Metrics calculated correctly
- [ ] See readiness score → Algorithm working
- [ ] Africa Insights widget → Regional tips displayed

### Investor Features  
- [ ] Search businesses → Firestore queries working
- [ ] Filter by criteria → Results accurate
- [ ] Mock pledge → State updated correctly
- [ ] Portfolio view → Aggregated data correct

### Smart Wallet
- [ ] Currency conversion → Math accurate with mock rates
- [ ] Hedging alerts → Notifications triggered
- [ ] Transaction history → Firestore sync working

### Monetization
- [ ] Stripe integration → Test keys working
- [ ] Subscription flow → Mock data returned
- [ ] Transaction cuts → Logged correctly

## 🚀 Scalability Notes

### Production Readiness
```javascript
// Key areas needing real implementation:
// 1. Replace all API keys with production values
// 2. Implement real payment processing with Stripe
// 3. Add Paystack for African market
// 4. Integrate real forex APIs
// 5. Add KYC/compliance for investor verification
// 6. Implement real escrow system
// 7. Add legal document generation
// 8. Implement advanced AI with Claude SDK
```

### Performance Optimizations
- Firestore pagination for large datasets
- Image optimization for business profiles
- Caching strategies for frequently accessed data
- Background sync for offline operations

---

**Updated Status**: Ready for Phase 2 Implementation  
**Timeline**: 7-day MVP → Production-ready in 4-6 weeks  
**Next**: Firebase integration with Smart Wallet and Hedging Alerts