# 🔥 Firebase Setup Instructions for BizInvest Hub

## **STEP 1: Create Firebase Project**

### **1.1 Go to Firebase Console**
1. Open your browser and go to: https://console.firebase.google.com
2. Sign in with your Google account
3. Click **"Create a project"**

### **1.2 Configure Project**
1. **Project name**: `bizinvest-hub-prod`
2. **Continue** → **Enable Google Analytics**: ✅ Yes (recommended)
3. **Continue** → Select your Google Analytics account or create new
4. **Create project** and wait for setup to complete

---

## **STEP 2: Enable Firebase Services**

### **2.1 Enable Authentication**
1. In Firebase Console sidebar, click **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Click **"Email/Password"**
5. **Enable** the toggle switch
6. Click **"Save"**

### **2.2 Create Firestore Database**
1. In Firebase Console sidebar, click **Firestore Database**
2. Click **"Create database"**
3. **Security rules**: Select **"Start in production mode"**
4. **Location**: Choose **us-central1** (or europe-west1 for African users)
5. Click **"Done"**

### **2.3 Configure Security Rules**
1. In Firestore Database, go to **Rules** tab
2. **Replace all content** with this:

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

3. Click **"Publish"**

---

## **STEP 3: Get Firebase Configuration**

### **3.1 Add Web App**
1. In Firebase Console, click the **Settings gear icon** (⚙️)
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click **"Add app"** → Select **Web (</> icon)**
5. **App nickname**: `BizInvest Hub Production`
6. **Optional**: Check "Also set up Firebase Hosting"
7. Click **"Register app"**

### **3.2 Copy Your Firebase Config**
You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBd...",
  authDomain: "bizinvest-hub-prod.firebaseapp.com",
  projectId: "bizinvest-hub-prod",
  storageBucket: "bizinvest-hub-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXX"
};
```

**📋 COPY THESE VALUES - YOU'LL NEED THEM IN THE NEXT STEP**

---

## **STEP 4: Configure Environment Variables**

### **4.1 Create Production Environment File**
1. In your project folder, create a file called `.env.production`
2. Copy and paste this template:

```bash
# Production Firebase Configuration - Replace with your actual values
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBd...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXX
```

### **4.2 Replace with Your Actual Values**
Replace each value with the ones from your Firebase config:

- `EXPO_PUBLIC_FIREBASE_API_KEY` = Your `apiKey`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` = Your `authDomain`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` = Your `projectId`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` = Your `storageBucket`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = Your `messagingSenderId`
- `EXPO_PUBLIC_FIREBASE_APP_ID` = Your `appId`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` = Your `measurementId`

### **4.3 Save the File**
Make sure the file is saved as `.env.production` in your project root folder.

---

## **STEP 5: Test the Configuration**

### **5.1 Start the App**
```bash
# Open terminal in your project folder
expo start --clear
```

### **5.2 Verify Configuration**
Check the console logs. You should see:
```
Firebase offline persistence enabled
Firebase project: bizinvest-hub-prod
```

If you see errors, double-check your environment variables.

---

## **🚨 IMPORTANT SECURITY NOTES**

1. **Never commit `.env.production` to git** - It's already in your .gitignore
2. **Keep your API keys secure** - Don't share them publicly
3. **Use production mode** - Security rules will protect your data
4. **Test thoroughly** - Verify all features work with production Firebase

---

## **✅ Verification Checklist**

- [ ] Firebase project created: `bizinvest-hub-prod`
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules published
- [ ] Web app added to project
- [ ] Firebase config values copied
- [ ] `.env.production` file created
- [ ] All environment variables set correctly
- [ ] App starts without errors
- [ ] Console shows correct Firebase project

**When all items are checked, you're ready for production testing!**

---

## **Need Help?**

If you encounter any issues:
1. Double-check your environment variable names
2. Ensure no extra spaces in your .env file
3. Restart Expo after creating the .env file
4. Check Firebase Console for any security rule errors

**Next step**: Run comprehensive testing using `PRODUCTION_TESTING_CHECKLIST.md`