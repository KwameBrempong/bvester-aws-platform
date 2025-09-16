# Automatic Deployment Setup Guide

## Current Status
✅ GitHub repository: https://github.com/KwameBrempong/bvesteroriginal  
✅ Firebase project: bizinvest-hub-prod  
✅ Website live: https://bvester-com.web.app  
✅ GitHub Actions workflow created: `.github/workflows/firebase-deploy.yml`

## Steps to Complete Automatic Deployment

### 1. Create Firebase Service Account

Since Firebase CLI has module issues, use the Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `bizinvest-hub-prod`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Fill in:
   - Name: `github-actions-deploy`
   - Description: `Service account for GitHub Actions deployment`
6. Click **Create and Continue**
7. Add roles:
   - `Firebase Hosting Admin`
   - `Cloud Build Editor` (if using Cloud Build)
8. Click **Continue** and **Done**

### 2. Generate Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Download the JSON key file

### 3. Add GitHub Secret

1. Go to your GitHub repository: https://github.com/KwameBrempong/bvesteroriginal
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_SERVICE_ACCOUNT_BIZINVEST_HUB_PROD`
5. Value: Copy the entire content of the JSON key file
6. Click **Add secret**

### 4. Test Automatic Deployment

1. Make any small change to your code (e.g., update a comment in `App.js`)
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Go to **Actions** tab in your GitHub repository
4. You should see the deployment workflow running
5. Once completed, check https://bvester-com.web.app for changes

## Alternative: Manual Deployment Command

If you prefer manual deployment, use:
```bash
npm run build:web
firebase deploy --only hosting:bvester-com --project bizinvest-hub-prod
```

## Troubleshooting

- **Firebase CLI issues**: Use Google Cloud Console instead
- **Workflow fails**: Check GitHub Actions logs
- **Permission errors**: Verify service account has correct roles
- **Build fails**: Check if all dependencies are in package.json