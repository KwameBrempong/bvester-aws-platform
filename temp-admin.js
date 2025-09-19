// Temporary Admin Setup Script for Bvester CMS
// Run this with: node temp-admin.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "bizinvest-hub-prod",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@bizinvest-hub-prod.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs/firebase-adminsdk-xxxxx%40bizinvest-hub-prod.iam.gserviceaccount.com"
};

// ALTERNATIVE: Direct Firebase Web Console Approach
console.log(`
🚀 QUICK CMS ACCESS GUIDE

Since the app has dependency issues, here's how to access your CMS directly:

METHOD 1: Firebase Console (RECOMMENDED)
1. Go to: https://console.firebase.google.com
2. Select project: bizinvest-hub-prod
3. Navigate to Firestore Database
4. Look for the 'users' collection
5. Find your user document (search by email)
6. Add/edit field: role = "admin"

METHOD 2: Create Test Account via Console
1. Go to Authentication → Users in Firebase Console
2. Add a new user with email/password
3. Note the UID
4. Go to Firestore → users collection
5. Create new document with that UID:
   {
     "email": "admin@bvester.com",
     "name": "Admin User",
     "role": "admin",
     "userType": "SME_OWNER",
     "createdAt": firestore.Timestamp.now(),
     "isActive": true
   }

METHOD 3: Direct Web App (if running)
If you can get the web version running:
- Use login: admin@bvester.com
- Password: admin123
- Or any credentials you create in Firebase Auth

Your Firebase project: bizinvest-hub-prod
Auth Domain: bizinvest-hub-prod.firebaseapp.com
`);

// Test CMS Content Structure
const sampleContent = {
  title: "Sample Business Tool",
  description: "A sample business tool for testing CMS",
  content: "This is detailed content for the business tool...",
  type: "business_tool",
  category: "financial_management", 
  tags: ["finance", "tools", "business"],
  status: "published",
  isFeatured: true,
  authorId: "your-user-id",
  authorName: "Admin User",
  fileUrls: [],
  imageUrls: [],
  views: 0,
  likes: 0,
  downloads: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('Sample CMS content structure:', JSON.stringify(sampleContent, null, 2));