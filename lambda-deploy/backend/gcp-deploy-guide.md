# ☁️ Google Cloud Run Deployment Guide

## Step 1: Prepare Google Cloud

### 1.1 Install Google Cloud CLI
- Windows: Download from [cloud.google.com/sdk](https://cloud.google.com/sdk)
- Mac: `brew install google-cloud-sdk`
- Linux: `curl https://sdk.cloud.google.com | bash`

### 1.2 Setup Project
```bash
# Login to Google Cloud
gcloud auth login

# Create project (or use existing)
gcloud projects create bvester-production
gcloud config set project bvester-production

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 2: Deploy with Source

### 2.1 Direct Source Deploy (Easiest)
```bash
# Deploy directly from source
gcloud run deploy bvester-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

### 2.2 Docker Deploy (Advanced)
```bash
# Build and deploy with Docker
gcloud run deploy bvester-backend \
  --image gcr.io/bvester-production/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Step 3: Set Environment Variables

```bash
# Set environment variables
gcloud run services update bvester-backend \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id \
  --set-env-vars STRIPE_SECRET_KEY=your-stripe-key \
  --region us-central1
```

Or use the Cloud Console:
1. Go to Cloud Run in Google Cloud Console
2. Click your service → Edit & Deploy New Revision
3. Add environment variables in Variables & Secrets tab

## Step 4: Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service bvester-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

## Your URL will be:
`https://bvester-backend-[hash]-uc.a.run.app`

## Pros:
- ✅ Auto-scaling from 0 to 1000+ instances
- ✅ Pay only for requests
- ✅ Google's global infrastructure
- ✅ Built-in SSL and load balancing

## Estimated Cost:
- **Free**: 2 million requests/month
- **Paid**: $0.40 per million requests
- Very cheap for startups!