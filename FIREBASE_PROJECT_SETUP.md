# Firebase Project Setup for BizInvest Hub

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Click "Add project"**
3. **Project Name**: `BizInvest Hub` or `bizinvest-hub-prod`
4. **Enable Google Analytics**: Recommended for user insights
5. **Choose Analytics account**: Default or create new

## Step 2: Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Email verification** (recommended)
4. Optionally enable **Google Sign-in** for easier onboarding

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll update rules later)
4. Select location: **us-central1** (or closest to your users)

## Step 4: Get Configuration Keys

1. Go to **Project Settings** (gear icon)
2. Click **Add app** > **Web app** (`</>`))
3. App name: `BizInvest Hub Web`
4. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-ABCDEF123"
};
```

## Step 5: Create Environment Variables

Create a `.env` file in your project root:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF123

# App Configuration
NODE_ENV=development
```

## Step 6: Update Firestore Security Rules

Replace the default rules with production-ready rules:

```javascript
// Copy this to Firestore Rules in Firebase Console
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Business owners can manage their business
    match /businesses/{businessId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
    
    // Investment data access control
    match /investments/{investmentId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.investorId || 
         request.auth.uid == resource.data.businessOwnerId);
    }
    
    // Users can read/write their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Step 7: Test Setup

After completing the above steps:

1. Run `npm start` to start the development server
2. Try registering a new user
3. Try logging in/out
4. Check Firebase Console to see if data is being stored

## Step 8: Next Steps After Firebase Setup

Once Firebase is working:
- [ ] Test user registration flow
- [ ] Test business creation
- [ ] Test transaction management
- [ ] Implement business analytics calculations
- [ ] Add investment matching features

## Security Notes

- **Never commit `.env` files** to version control
- Add `.env` to your `.gitignore` file
- Use different projects for development/production
- Enable App Check for production (prevents unauthorized access)
- Set up billing alerts in Firebase Console

## Troubleshooting

**If you get "Firebase not configured" errors:**
1. Check that all environment variables are set
2. Restart the development server
3. Clear Metro cache: `npx expo start --clear`

**If authentication fails:**
1. Verify Firebase Auth is enabled
2. Check security rules allow user creation
3. Look at browser/app console for error messages

Ready to proceed with Firebase setup?