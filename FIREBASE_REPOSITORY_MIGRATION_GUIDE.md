# 🔥 Firebase Repository Migration Guide

## 🎯 **Objective**
Disconnect the old repository and connect `https://github.com/KwameBrempong/bvesteroriginal.git` to Firebase Hosting.

## 📋 **Current Configuration**
- **Project ID**: `bizinvest-hub-prod`
- **Web API Key**: `AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80`
- **Hosting Sites**: 
  - `bizinvest-hub-prod`
  - `bvester-com`
- **New Repository**: `https://github.com/KwameBrempong/bvesteroriginal.git`

---

## 🔧 **Method 1: Firebase Console (Recommended)**

### **Step 1: Disconnect Current Repository**

1. **Open Firebase Console**: https://console.firebase.google.com
2. **Select Project**: `bizinvest-hub-prod`
3. **Navigate**: Build → Hosting
4. **For each site** (`bizinvest-hub-prod` and `bvester-com`):
   - Click on the site name
   - Go to **"Advanced"** or **"Settings"** tab
   - Look for **"GitHub integration"** section
   - Click **"Disconnect"** or **"Remove integration"**
   - Confirm the disconnection

### **Step 2: Connect New Repository**

1. **Still in Hosting section**
2. **Select the primary site** (recommended: `bvester-com`)
3. **Go to "Settings" or "Advanced" tab**
4. **Click "Connect to GitHub"** or **"Set up GitHub integration"**
5. **Authenticate with GitHub** if prompted
6. **Select Repository**: `KwameBrempong/bvesteroriginal`
7. **Configure Deployment Settings**:
   ```yaml
   Branch: master (or main)
   Build Command: npm run build:web
   Output Directory: web-build
   ```

### **Step 3: Configure Build Settings**

```yaml
# Build configuration
Root Directory: .
Build Command: npm ci && npm run build:web
Output Directory: web-build
Environment Variables:
  - EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80
  - EXPO_PUBLIC_FIREBASE_PROJECT_ID=bizinvest-hub-prod
  - EXPO_PUBLIC_ENVIRONMENT=production
```

---

## 🔧 **Method 2: GitHub Actions (Automated)**

If the console method doesn't work, use this automated approach:

### **Step 1: Create GitHub Secrets**

1. **Go to GitHub**: https://github.com/KwameBrempong/bvesteroriginal
2. **Settings** → **Secrets and variables** → **Actions**
3. **Add Repository Secrets**:
   ```
   FIREBASE_PROJECT_ID: bizinvest-hub-prod
   FIREBASE_WEB_API_KEY: AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80
   FIREBASE_PRIVATE_KEY: [Your Firebase Admin Private Key]
   FIREBASE_CLIENT_EMAIL: [Your Firebase Admin Email]
   ```

### **Step 2: Add Deployment Workflow**

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Create environment file
      run: |
        cat > .env << EOF
        EXPO_PUBLIC_FIREBASE_API_KEY=${{ secrets.FIREBASE_WEB_API_KEY }}
        EXPO_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}
        EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bizinvest-hub-prod.firebaseapp.com
        EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bizinvest-hub-prod.appspot.com
        EXPO_PUBLIC_ENVIRONMENT=production
        EOF
    
    - name: Build web application
      run: |
        npm run build:web || npm run web:build || npx expo export:web
    
    - name: Deploy to Firebase Hosting
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_PRIVATE_KEY }}
        projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
        channelId: live
```

---

## 🔧 **Method 3: Manual CLI Setup**

If you want to use the Firebase CLI locally:

### **Step 1: Fix Firebase CLI**
```bash
# Uninstall current version
npm uninstall -g firebase-tools

# Clear npm cache
npm cache clean --force

# Reinstall latest version
npm install -g firebase-tools@latest

# Login to Firebase
firebase login
```

### **Step 2: Initialize Project**
```bash
cd "C:\Users\BREMPONG\Desktop\dev\bvester"

# Initialize Firebase (choose existing project)
firebase init hosting

# Select: bizinvest-hub-prod
# Public directory: web-build
# Single-page app: Yes
# GitHub integration: Yes
# Repository: KwameBrempong/bvesteroriginal
```

### **Step 3: Deploy**
```bash
# Build the web app
npm run build:web

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 📱 **Build Script Configuration**

Ensure your `package.json` has the correct build scripts:

```json
{
  "scripts": {
    "build:web": "expo export:web",
    "web:build": "expo export:web",
    "deploy": "npm run build:web && firebase deploy --only hosting",
    "deploy:prod": "EXPO_PUBLIC_ENVIRONMENT=production npm run build:web && firebase deploy --only hosting:bvester-com"
  }
}
```

---

## 🔒 **Security Configuration**

### **Firebase Security Rules**

Update Firestore rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow public read of business listings
    match /businesses/{businessId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### **Hosting Security Headers**

Already configured in `firebase.json`:

```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-Content-Type-Options", "value": "nosniff"}
      ]
    }
  ]
}
```

---

## ✅ **Verification Steps**

### **1. Test Local Build**
```bash
cd "C:\Users\BREMPONG\Desktop\dev\bvester"
npm run build:web
# Check if web-build directory is created
```

### **2. Test Firebase Connection**
```bash
firebase projects:list
firebase hosting:sites:list
```

### **3. Test Deployment**
```bash
firebase deploy --only hosting --dry-run
```

### **4. Verify Live Site**
- Visit: https://bvester-com.web.app
- Visit: https://bizinvest-hub-prod.web.app
- Check browser console for errors

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules
npm install

# Try different build commands
npm run build:web
npx expo export:web
```

#### **2. Firebase CLI Errors**
```bash
# Fix permissions (Windows)
npm config set prefix %USERPROFILE%\npm-global
setx PATH "%PATH%;%USERPROFILE%\npm-global\bin"

# Reinstall globally
npm install -g firebase-tools@latest
```

#### **3. GitHub Integration Issues**
- Ensure repository is public or Firebase has access
- Check GitHub App permissions
- Verify branch names match (master vs main)

#### **4. Environment Variables**
- Check all required env vars are set
- Verify Firebase config values
- Test with development environment first

---

## 📞 **Next Steps**

1. **Choose your preferred method** (Console recommended for beginners)
2. **Follow the step-by-step guide**
3. **Test the deployment**
4. **Update DNS settings** if needed
5. **Set up monitoring and analytics**

## 🎯 **Success Criteria**

- ✅ Old repository disconnected from Firebase
- ✅ New repository connected and deploying
- ✅ Live site accessible at your domains
- ✅ All Firebase services working
- ✅ Environment variables properly configured

---

**Need Help?** If you encounter issues, provide the specific error message and which method you're using.