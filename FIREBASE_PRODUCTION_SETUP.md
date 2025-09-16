# 🔥 Firebase Production Setup Guide - Step by Step

## **STEP 1: Create Firebase Production Project**

### **1.1 Firebase Console Setup**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. **Project name**: `bizinvest-hub-prod`
4. **Enable Google Analytics**: ✅ Yes (recommended for user insights)
5. **Analytics account**: Create new or use existing Google Analytics account
6. Click **"Create project"** and wait for setup to complete

### **1.2 Enable Required Services**

**🔐 Authentication Setup:**
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **"Email/Password"** provider
3. ✅ **Enable**: Email/Password
4. ✅ **Optional**: Enable Google sign-in for easier user access
5. **Authorized domains**: Will be configured when deploying to production

**📊 Firestore Database Setup:**
1. Go to **Firestore Database**
2. Click **"Create database"**
3. **Security rules**: Choose **"Start in production mode"** (we'll add custom rules)
4. **Location**: Choose **us-central1** (or region closer to African users like europe-west1)
5. Click **"Done"**

---

## **STEP 2: Configure Security Rules**

### **2.1 Firestore Security Rules**
Go to **Firestore Database** → **Rules** and replace with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions: users can only access their own
    match /transactions/{docId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Business listings: public read, owner-only write
    match /businessListings/{listingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Investment interests: authenticated users
    match /investmentInterests/{interestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.investorId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        (resource.data.investorId == request.auth.uid || 
         resource.data.businessOwnerId == request.auth.uid);
    }
    
    // Investment pledges: involved parties only
    match /investmentPledges/{pledgeId} {
      allow read: if request.auth != null && 
        (resource.data.investorId == request.auth.uid || 
         resource.data.businessOwnerId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.investorId == request.auth.uid;
      allow update: if request.auth != null && 
        (resource.data.investorId == request.auth.uid || 
         resource.data.businessOwnerId == request.auth.uid);
    }
    
    // Investor profiles: owner-only
    match /investorProfiles/{profileId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Bookmarks: owner-only
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **"Publish"** to deploy the security rules.

---

## **STEP 3: Get Firebase Configuration**

### **3.1 Add Web App to Project**
1. In Firebase Console, go to **Project Settings** (⚙️ gear icon)
2. Scroll down to **"Your apps"** section
3. Click **"Add app"** → **Web app** (</> icon)
4. **App nickname**: `BizInvest Hub Production`
5. ✅ **Check**: "Also set up Firebase Hosting" (for web deployment option)
6. Click **"Register app"**

### **3.2 Copy Firebase Config**
You'll see a configuration object like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXX"
};
```

**COPY THIS - YOU'LL NEED IT IN STEP 4**

---

## **STEP 4: Update App Configuration**

### **4.1 Create Environment File**
Create `.env.production` in your project root:

```bash
# Production Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD... # Your actual API key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXX
```

### **4.2 Update Firebase Config File**
Replace the content of `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence for better UX
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.log('The current browser does not support all features required for persistence.');
  }
});

export default app;
```

### **4.3 Add Environment File to .gitignore**
Add this line to your `.gitignore` file:
```
.env.production
.env.local
.env.*.local
```

---

## **STEP 5: Production Testing Checklist**

### **5.1 Before Testing - Replace Configuration**
1. ✅ Replace Firebase config with production credentials
2. ✅ Verify environment variables are loaded correctly
3. ✅ Ensure security rules are published
4. ✅ Confirm all Firebase services are enabled

### **5.2 User Authentication Testing**
- [ ] **User Registration**: Test SME Owner registration
- [ ] **User Registration**: Test Investor registration  
- [ ] **Login/Logout**: Test email/password authentication
- [ ] **Profile Creation**: Verify user profiles are created properly
- [ ] **Role Assignment**: Confirm SME_OWNER vs INVESTOR roles work

### **5.3 SME Owner Flow Testing**
- [ ] **Transaction CRUD**: Add, edit, delete financial transactions
- [ ] **Real-time Updates**: Verify Firestore real-time sync
- [ ] **Financial Analysis**: Test readiness score calculation
- [ ] **Business Listing**: Create and update business listing
- [ ] **Dashboard**: Verify SME dashboard loads with real data

### **5.4 Investor Flow Testing**
- [ ] **Investment Search**: Search and filter business opportunities
- [ ] **Business Discovery**: View business details and readiness scores
- [ ] **Express Interest**: Send interest to business owners
- [ ] **Investment Pledge**: Create mock investment pledges
- [ ] **Dashboard**: Verify investor dashboard functionality

### **5.5 Cross-User Testing**
- [ ] **Real-time Matching**: Investor sees new business listings instantly
- [ ] **Notifications**: SME owners receive interest notifications
- [ ] **Data Isolation**: Users can only see their own data
- [ ] **Security**: Unauthorized access is properly blocked

---

## **STEP 6: Performance & Security Verification**

### **6.1 Security Testing**
- [ ] **Authentication Required**: All screens require login
- [ ] **Data Privacy**: Users can't access others' data
- [ ] **Input Validation**: Forms reject invalid data
- [ ] **Error Handling**: Graceful error messages (no system details exposed)

### **6.2 Performance Testing**
- [ ] **Load Speed**: App loads within 3 seconds
- [ ] **Real-time Sync**: Data updates appear instantly
- [ ] **Offline Mode**: App works when internet is disconnected
- [ ] **Memory Usage**: No memory leaks during extended use

---

## **🚨 IMPORTANT PRODUCTION NOTES**

### **Security Reminders:**
- ✅ **No Real Money**: All investment features are mock/demonstration only
- ✅ **Mock Disclaimers**: Prominent warnings about no real funds
- ✅ **Data Protection**: User data is encrypted and access-controlled
- ✅ **API Key Security**: Production keys are environment variables only

### **Performance Optimizations:**
- ✅ **Offline Persistence**: Firestore offline mode enabled
- ✅ **Real-time Updates**: Optimized for African mobile networks
- ✅ **Multi-currency**: Handles USD, NGN, ZAR, KES properly
- ✅ **Image Optimization**: All assets optimized for mobile

---

## **NEXT STEPS AFTER PRODUCTION SETUP:**

1. **🧪 Complete Full App Testing** (Step 7)
2. **📱 Create Expo Production Build** (Step 8)  
3. **🚀 Deploy to App Stores** (Step 9)
4. **📊 Setup Analytics & Monitoring** (Step 10)

---

**🎯 You're now ready to test BizInvest Hub in production environment!**

Run the app with production Firebase and verify all features work correctly before proceeding to deployment.