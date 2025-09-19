# 🚂 Railway Deployment Guide

## Step 1: Prepare Your Code

### 1.1 Create Railway-specific files

Create `railway.toml` in your backend folder:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node demo-server.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 1.2 Update package.json scripts
Ensure your package.json has:
```json
{
  "scripts": {
    "start": "node demo-server.js",
    "build": "echo 'No build needed'"
  }
}
```

## Step 2: Deploy to Railway

### 2.1 GitHub Method (Recommended)
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Go to Railway**:
   - Visit [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Connect your GitHub account
   - Select your repository

3. **Configure Environment Variables**:
   - Click your deployed service
   - Go to "Variables" tab
   - Add all your .env variables one by one

### 2.2 CLI Method (Alternative)
1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables

Add these to Railway dashboard:
```
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email
STRIPE_SECRET_KEY=sk_live_your-key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-key
SENDGRID_API_KEY=SG.your-key
TWILIO_ACCOUNT_SID=ACyour-sid
TWILIO_AUTH_TOKEN=your-token
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

## Step 4: Get Your Production URL

After deployment, Railway will give you a URL like:
`https://bvester-backend-production.up.railway.app`

## Step 5: Test Your Deployment

Visit your URL and verify:
- ✅ Homepage loads with API documentation
- ✅ `/health` endpoint returns healthy status
- ✅ All test buttons work in the interface

## Estimated Cost:
- **Free**: 500 hours/month, 1GB RAM
- **Pro**: $5/month, unlimited hours, more resources