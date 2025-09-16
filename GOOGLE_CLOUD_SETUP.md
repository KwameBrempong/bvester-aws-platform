# ☁️ Google Cloud CLI Installation & Setup

## Step 1: Install Google Cloud CLI

### Windows Installation:
1. **Go to**: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. **Click**: "Windows" tab
3. **Download**: `GoogleCloudSDKInstaller.exe`
4. **Run**: The installer and follow the wizard
5. **Select**: 
   - ✅ Install Google Cloud CLI
   - ✅ Install beta commands
   - ✅ Add gcloud to PATH
6. **Restart**: Your terminal/command prompt

## Step 2: Verify Installation
Open a new command prompt and run:
```bash
gcloud --version
```
You should see something like:
```
Google Cloud SDK 456.0.0
bq 2.0.89
core 2023.01.20
gke-gcloud-auth-plugin 0.4.0
gsutil 5.17
```

## Step 3: Login to Google Cloud
```bash
# Login with your Google account
gcloud auth login

# This opens your browser to login
# Choose your Google account
# Grant permissions to Google Cloud SDK
```

## Step 4: Create/Select Project
```bash
# Create a new project for Bvester
gcloud projects create bvester-production --name="Bvester Production"

# Set the project as default
gcloud config set project bvester-production

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
# Link your project to a billing account
```

## Step 5: Enable Required APIs
```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com
```

## Step 6: Verify Setup
```bash
# Check your configuration
gcloud config list

# Should show:
# [core]
# account = your-email@gmail.com
# project = bvester-production
```

## 🎯 Once installed, come back and we'll deploy!

After completing these steps, return to me and I'll guide you through the actual deployment to Cloud Run.

## ⚡ Quick Alternative (if installation issues):

If you have trouble with the CLI installation, we can also deploy using:
1. The Google Cloud Console (web interface)
2. GitHub Actions (automated deployment)
3. Alternative platforms like Railway or Vercel

Let me know when you've completed the installation!