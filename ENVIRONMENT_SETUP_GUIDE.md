# 🚀 Environment Variables Setup Guide

## **Quick Setup Options**

### **Option 1: Automated Setup (Recommended)**
Run the setup script and follow the prompts:
```bash
node setup-firebase.js
```

### **Option 2: Manual Setup**
Follow the detailed instructions below.

---

## **Manual Setup Steps**

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create Project**: 
   - Name: `bizinvest-hub-prod`
   - Enable Google Analytics: ✅ Yes
3. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
4. **Create Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Location: us-central1
5. **Add Web App**:
   - Go to Project Settings
   - Add Web app
   - Name: "BizInvest Hub Production"

### **Step 2: Get Firebase Configuration**

After adding the web app, you'll see configuration values like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBd_EXAMPLE_KEY_123",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXX"
};
```

### **Step 3: Create Environment File**

Create a file called `.env.production` in your project root with this content:

```bash
# Production Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBd_EXAMPLE_KEY_123
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXX
```

**⚠️ Replace all values with your actual Firebase configuration values!**

### **Step 4: Configure Security Rules**

In Firebase Console → Firestore Database → Rules, replace with:

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

Click **"Publish"** to save the rules.

---

## **Step 5: Test Configuration**

### **Start the App**
```bash
expo start --clear
```

### **Check Console Output**
You should see these messages:
```
🔥 Firebase Configuration Check:
================================
apiKey: ✅ Valid
authDomain: ✅ Valid
projectId: ✅ Valid
storageBucket: ✅ Valid
messagingSenderId: ✅ Valid
appId: ✅ Valid
measurementId: ✅ Valid
================================
🎉 All required Firebase configuration values are set!
📊 Project ID: bizinvest-hub-prod
🌐 Auth Domain: bizinvest-hub-prod.firebaseapp.com
```

### **If You See Errors**
- ❌ Check your .env.production file for typos
- ❌ Ensure no extra spaces around the = sign
- ❌ Restart Expo after creating the environment file
- ❌ Verify all values are copied correctly from Firebase Console

---

## **Environment File Examples**

### **Development Environment (.env.development)**
```bash
# Development Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDev_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
EXPO_PUBLIC_FIREBASE_APP_ID=1:987654321:web:dev123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DEV123
```

### **Production Environment (.env.production)**
```bash
# Production Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyProd_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:prod123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-PROD123
```

---

## **Security Checklist**

- [ ] ✅ `.env.production` is in .gitignore
- [ ] ✅ Firebase security rules are published
- [ ] ✅ Environment variables start with `EXPO_PUBLIC_`
- [ ] ✅ No spaces around = in environment file
- [ ] ✅ All required values are set (not placeholder)
- [ ] ✅ App starts without Firebase errors

---

## **Troubleshooting**

### **Common Issues**

1. **"Process.env variables are undefined"**
   - Restart Expo: `expo start --clear`
   - Check environment file name: must be `.env.production`
   - Verify all variables start with `EXPO_PUBLIC_`

2. **"Firebase project not found"**
   - Check PROJECT_ID in environment file
   - Verify project exists in Firebase Console

3. **"Permission denied"**
   - Check Firestore security rules are published
   - Verify user is authenticated

4. **"Network error"**
   - Check internet connection
   - Verify Firebase API key is correct

### **Getting Help**

If you're still having issues:
1. Check the console logs for specific error messages
2. Verify your Firebase project settings
3. Ensure all environment variables are correctly set
4. Try the automated setup script: `node setup-firebase.js`

---

## **Next Steps**

Once your environment is configured:

1. ✅ **Test Authentication**: Register and login
2. ✅ **Test Firestore**: Add transactions, create business listings
3. ✅ **Test Real-time Updates**: Verify data syncs across screens
4. ✅ **Run Full Testing**: Follow `PRODUCTION_TESTING_CHECKLIST.md`

**Your Firebase environment is ready for production testing!** 🚀