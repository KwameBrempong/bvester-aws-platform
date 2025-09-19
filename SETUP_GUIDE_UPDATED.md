# BizInvest Hub - Complete Setup Guide

**Updated MVP Setup with Firebase, Stripe, and African Market Features**

## 🚀 Prerequisites

### Required Software
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase account (free tier sufficient for MVP)
- Stripe account (test mode for MVP)

### Development Tools
- VS Code with React Native extensions
- Android Studio (for Android testing)
- Xcode (for iOS testing - Mac only)
- Firebase CLI (`npm install -g firebase-tools`)

## 📦 Step 1: Project Initialization

```bash
# Create new Expo project (user runs this first)
expo init bizinvest-hub --template blank
cd bizinvest-hub

# Install all required dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install firebase @stripe/stripe-react-native
npm install expo-notifications expo-local-authentication expo-secure-store
npm install @react-native-async-storage/async-storage @react-native-picker/picker
npm install redux react-redux @reduxjs/toolkit
npm install react-native-reanimated

# For web support (optional)
npx expo install react-dom react-native-web

# Verify installation
expo doctor
```

## 🔥 Step 2: Firebase Configuration

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" → Name: `bizinvest-hub-dev`
3. Enable Google Analytics (optional)
4. Wait for project creation

### 2.2 Enable Firebase Services
```bash
# In Firebase Console:
# 1. Authentication → Get Started → Sign-in method → Email/Password (Enable)
# 2. Firestore Database → Create database → Start in test mode
# 3. Storage → Get Started (for future file uploads)
```

### 2.3 Get Firebase Config
1. Project Settings → General → Your apps
2. Click Web icon (</>) → Register app: `bizinvest-hub-web`
3. Copy the `firebaseConfig` object
4. Replace placeholder in `src/config/firebase.js`

```javascript
// Replace in src/config/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "bizinvest-hub-dev.firebaseapp.com", 
  projectId: "bizinvest-hub-dev",
  storageBucket: "bizinvest-hub-dev.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2.4 Firestore Security Rules (Development)
```javascript
// In Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 💳 Step 3: Stripe Configuration

### 3.1 Create Stripe Account
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Activate your account (use test mode for MVP)
3. Get your API keys

### 3.2 Configure Stripe Keys
1. Dashboard → Developers → API keys
2. Copy Publishable key (pk_test_...) and Secret key (sk_test_...)
3. Replace placeholders in `src/config/stripe.js`

```javascript
// Replace in src/config/stripe.js
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
export const STRIPE_SECRET_KEY = 'sk_test_YOUR_SECRET_KEY_HERE'; // Server-side only
```

### 3.3 Create Subscription Products (Optional for MVP)
```bash
# In Stripe Dashboard:
# 1. Products → Create product → "BizInvest Premium" → $9.99/month
# 2. Products → Create product → "BizInvest Enterprise" → $49.99/month  
# 3. Copy price IDs and update SUBSCRIPTION_PLANS in stripe.js
```

## 📱 Step 4: Project Structure Setup

### 4.1 Copy Updated Codebase
```bash
# Copy all files from the generated codebase into your project:
# src/ folder structure:
src/
├── navigation/AppNavigator.js          # ✅ Already created
├── screens/                           # ✅ All screens created
├── components/AfricaInsights/         # ✅ New unique widget
├── context/                           # ✅ Auth + App contexts
├── config/                            # ✅ Firebase + Stripe configs
├── utils/currency.js                  # ✅ Multi-currency utilities
└── services/                          # 🚧 Coming in Phase 2
```

### 4.2 Update App.js
```javascript
// Replace your App.js with the generated version that includes:
// - Firebase app initialization
// - Navigation setup
// - Context providers
// - Error boundaries
```

## 🧪 Step 5: Testing Setup

### 5.1 Local Testing
```bash
# Start development server
npm start

# Run on different platforms
npm run android    # Android device/emulator
npm run ios        # iOS device/simulator (Mac only)
npm run web        # Web browser
```

### 5.2 Test User Accounts
Create test accounts for development:
```javascript
// Test SME Owner
Email: sme@test.com
Password: test123
Role: SME_OWNER

// Test Investor  
Email: investor@test.com
Password: test123
Role: INVESTOR
```

### 5.3 Firebase Emulator (Optional)
```bash
# Install Firebase emulators
firebase init emulators
# Select: Authentication, Firestore, Functions (if needed)

# Start emulators
firebase emulators:start

# Update firebase.js to use emulators in development
```

## 🌍 Step 6: African Market Features

### 6.1 Currency Configuration
The app supports these African currencies out of the box:
- 🇳🇬 Nigerian Naira (NGN)
- 🇿🇦 South African Rand (ZAR)  
- 🇰🇪 Kenyan Shilling (KES)
- 🇬🇭 Ghanaian Cedi (GHS)
- 🇺🇬 Ugandan Shilling (UGX)

Exchange rates are mocked for MVP. Update `src/utils/currency.js` for production.

### 6.2 Africa Insights Widget
Unique feature providing:
- Country-specific business trends
- Mobile money adoption data
- Trade corridor opportunities
- Climate finance insights
- Government policy updates

### 6.3 Regional Payment Methods (Placeholders)
```javascript
// Future integrations ready:
// Nigeria: Paystack, Flutterwave
// Kenya: M-Pesa API
// South Africa: PayFast, Ozow
// Ghana: MTN Mobile Money
```

## 🔒 Step 7: Security & Performance

### 7.1 Authentication Flow
```javascript
// Test the complete auth flow:
// 1. Welcome → Register → Choose role
// 2. Email verification (Firebase handles this)
// 3. Role-based navigation
// 4. Secure data access
```

### 7.2 Offline Support
Firebase offline persistence is enabled by default:
```javascript
// Users can:
// - View cached data offline
// - Create transactions offline  
// - Sync when online
```

### 7.3 Security Rules Validation
```bash
# Test Firestore security:
# 1. Try accessing data without auth (should fail)
# 2. Login and access own data (should work)
# 3. Try accessing other user's data (should fail)
```

## 🚀 Step 8: Deployment Preparation

### 8.1 Environment Variables
```bash
# Create .env file for sensitive config:
FIREBASE_API_KEY=your_firebase_api_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
CURRENCY_API_KEY=your_currency_api_key # For production
```

### 8.2 Build for Production
```bash
# Test production build
expo build:web
expo build:android --type=apk  # Android APK
expo build:ios                 # iOS (requires Apple Developer account)

# Or use EAS Build (recommended)
npm install -g @expo/eas-cli
eas build --platform android
eas build --platform ios
```

### 8.3 Production Checklist
- [ ] Replace all placeholder API keys
- [ ] Update Firestore security rules for production
- [ ] Configure real payment processing
- [ ] Add real exchange rate API
- [ ] Set up monitoring and analytics
- [ ] Configure push notifications
- [ ] Add legal terms and privacy policy

## 🧪 Step 9: MVP Testing Scenarios

### 9.1 SME Owner Flow
1. **Registration**: Register as SME Owner with business name
2. **Dashboard**: View readiness score (should show 75/100)
3. **Records**: Add financial transaction → Check Firestore
4. **Analysis**: View business metrics and Africa insights
5. **Currency**: Switch currency → Values update correctly

### 9.2 Investor Flow  
1. **Registration**: Register as Investor
2. **Search**: Browse investment opportunities
3. **Filtering**: Filter by amount, location, returns
4. **Pledge**: Make mock investment pledge (no real money)
5. **Portfolio**: View mock portfolio data

### 9.3 Cross-Platform Testing
- [ ] iOS: All features work in iOS Simulator
- [ ] Android: All features work in Android Emulator  
- [ ] Web: Core features work in browser
- [ ] Offline: App functions without internet
- [ ] Real device: Test on physical devices

## 🛠️ Troubleshooting

### Common Issues
```bash
# Metro bundler issues
npm start -- --reset-cache

# iOS build issues  
cd ios && pod install && cd ..

# Android build issues
cd android && ./gradlew clean && cd ..

# Firebase connection issues
# Check firebase.js config and internet connection

# Stripe issues
# Verify test keys are correct and test mode is enabled
```

### Debug Console Commands
```javascript
// In app console:
// Check Firebase connection: 
console.log('Firebase app:', app);

// Check auth state:
console.log('Current user:', auth.currentUser);

// Test currency conversion:
import { convertCurrency } from './src/utils/currency';
console.log(convertCurrency(100, 'USD', 'NGN'));
```

## 📈 Next Steps After MVP

1. **Phase 2**: Real Firebase integration and CRUD operations
2. **Phase 3**: Advanced financial metrics and Recharts visualization  
3. **Phase 4**: AI-powered investment matching
4. **Phase 5**: Real payment processing and escrow
5. **Phase 6**: Claude Code SDK integration
6. **Production**: Real API keys, legal compliance, app store deployment

---

**🎉 MVP Status**: Ready for development and testing  
**Timeline**: 7 days for full MVP implementation  
**Next**: Begin Phase 2 - Firebase services and real data integration