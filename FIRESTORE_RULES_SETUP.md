# 🔒 Firestore Security Rules - Final Setup Step

## **🚨 Critical Step: Publish Security Rules**

Your Firebase authentication is working perfectly, but Firestore needs security rules published.

### **Quick Setup (2 minutes):**

1. **Go to**: https://console.firebase.google.com
2. **Select**: `bizinvest-hub-prod` project  
3. **Click**: Firestore Database → Rules
4. **Replace all content** with this:

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

5. **Click "Publish"**

### **✅ Verify Setup:**
```bash
node firebase-test.js
```

Should now show:
```
✅ Firebase Configuration: Valid
✅ Authentication: Working  
✅ Firestore Database: Working
```

---

## **🚀 Then We'll Move to Production Build**

After Firestore rules are published, next steps:

1. **✅ Complete Firebase setup** (security rules)
2. **📱 Create Expo production build**
3. **🧪 Execute comprehensive testing**
4. **🚀 Deploy to Expo Go/EAS**
5. **📊 Prepare for app store submission**

**This is the final Firebase configuration step before production deployment!**