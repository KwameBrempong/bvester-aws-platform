# Firebase Production Setup Guide

## 🔥 Firebase Production Environment Configuration

### **Step 1: Create Production Firebase Project**

#### **1.1 Firebase Console Setup**
```bash
# 1. Go to Firebase Console: https://console.firebase.google.com
# 2. Click "Create a project"
# 3. Project name: "bizinvest-hub-prod"
# 4. Enable Google Analytics (recommended)
# 5. Choose or create Analytics account
```

#### **1.2 Enable Required Services**

**Authentication:**
```bash
# 1. Go to Authentication > Sign-in method
# 2. Enable "Email/Password" provider
# 3. Optional: Enable Google sign-in for easier access
# 4. Configure authorized domains (add your domain when deploying)
```

**Firestore Database:**
```bash
# 1. Go to Firestore Database
# 2. Click "Create database"
# 3. Choose "Start in production mode" (we'll add security rules)
# 4. Select location: us-central1 (or closer to your target audience)
```

**Hosting (Optional for Web Version):**
```bash
# 1. Go to Hosting
# 2. Click "Get started"
# 3. Follow setup instructions for web deployment
```

### **Step 2: Security Rules Configuration**

#### **2.1 Firestore Security Rules**
```javascript
// Go to Firestore Database > Rules and paste this:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions: users can only access their own transactions
    match /transactions/{docId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Business listings: public read for authenticated users, owner-only write
    match /businessListings/{listingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Investment interests: public read, authenticated write
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
      allow read, write: if request.auth != null && 
        (resource.data.investorId == request.auth.uid || 
         resource.data.businessOwnerId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.investorId == request.auth.uid;
    }
    
    // Investor profiles: owner-only access
    match /investorProfiles/{profileId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Bookmarks: owner-only access
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

#### **2.2 Firebase Storage Rules (if using file uploads)**
```javascript
// Go to Storage > Rules (if you enable storage later)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Business documents: owner-only access
    match /business-docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile pictures: owner-only write, public read for authenticated users
    match /profile-pics/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### **Step 3: Firebase Configuration**

#### **3.1 Get Firebase Config**
```bash
# 1. Go to Project Settings (gear icon)
# 2. Scroll down to "Your apps"
# 3. Click "Add app" > Web app
# 4. App nickname: "BizInvest Hub Web"
# 5. Check "Also set up Firebase Hosting" if you want web deployment
# 6. Copy the firebaseConfig object
```

#### **3.2 Update Production Config**
```javascript
// Update src/config/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyD...", // Your actual API key
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXX" // If Analytics enabled
};

// For production, also enable persistence
import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence for better UX
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.log('The current browser does not support persistence.');
  }
});
```

### **Step 4: Environment Variables**

#### **4.1 Create Environment Files**
```bash
# Create .env.production file
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Add .env.production to .gitignore
echo ".env.production" >> .gitignore
```

#### **4.2 Update Firebase Config to Use Environment Variables**
```javascript
// src/config/firebase.js
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

### **Step 5: Production Optimizations**

#### **5.1 Error Handling Enhancement**
```javascript
// Add to src/utils/errorHandler.js
export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
```

#### **5.2 Performance Monitoring**
```bash
# 1. Go to Firebase Console > Performance
# 2. Enable Performance Monitoring
# 3. Add to your app (optional for MVP)
```

#### **5.3 Analytics Setup**
```bash
# 1. Go to Firebase Console > Analytics
# 2. Enable Analytics if not already done
# 3. Configure conversion events for key actions:
#    - sign_up (user registration)
#    - business_listing_created
#    - investment_interest_expressed
#    - investment_pledge_made
```

### **Step 6: Testing Production Environment**

#### **6.1 Pre-deployment Testing**
```bash
# 1. Update firebase config with production credentials
# 2. Test user registration and login
# 3. Test transaction creation and real-time updates
# 4. Test business listing creation
# 5. Test investment marketplace functionality
# 6. Verify security rules work correctly
```

#### **6.2 Production Data Seeding (Optional)**
```javascript
// Create sample data for demo purposes
const sampleBusinesses = [
  {
    businessName: "AgriTech Kenya",
    industry: "Agriculture", 
    country: "Kenya",
    seekingAmount: 25000,
    readinessScore: 78,
    description: "IoT solutions for smallholder farmers"
  },
  {
    businessName: "Lagos FinTech",
    industry: "Financial Services",
    country: "Nigeria", 
    seekingAmount: 75000,
    readinessScore: 85,
    description: "Mobile payment solutions for Nigerian SMEs"
  }
];
```

---

## 🚨 Security Checklist

### **Pre-deployment Security Review**
- [ ] ✅ Firestore security rules properly configured
- [ ] ✅ No sensitive data in console logs
- [ ] ✅ Environment variables used for API keys
- [ ] ✅ User authentication required for all operations
- [ ] ✅ Input validation on all forms
- [ ] ✅ Mock investment disclaimers prominent
- [ ] ✅ No real financial transactions possible
- [ ] ✅ User data access properly restricted
- [ ] ✅ Error messages don't expose system details
- [ ] ✅ HTTPS enforced for all connections

---

## 📊 Production Monitoring

### **Key Metrics to Track**
1. **User Engagement**:
   - Daily/Monthly active users
   - User registration conversion rate
   - Session duration and screen views

2. **Business Metrics**:
   - Business listings created per week
   - Investment interests expressed
   - Investment pledges submitted
   - Average investment readiness scores

3. **Technical Metrics**:
   - App crash rate
   - API response times
   - Firestore read/write usage
   - Authentication success rate

4. **African Market Metrics**:
   - User distribution by country
   - Mobile money usage percentage
   - Multi-currency transaction volumes
   - AfCFTA readiness score trends

---

## ✅ Production Readiness Checklist

- [ ] ✅ Firebase production project configured
- [ ] ✅ Security rules implemented and tested
- [ ] ✅ Environment variables configured
- [ ] ✅ Error handling implemented
- [ ] ✅ Performance monitoring enabled
- [ ] ✅ Analytics configured
- [ ] ✅ All features tested end-to-end
- [ ] ✅ Security review completed
- [ ] ✅ Backup and disaster recovery plan
- [ ] ✅ User documentation prepared

**Ready for deployment when all checkboxes are complete!**