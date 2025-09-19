# ⚡ Vercel Deployment Guide

## Step 1: Prepare for Vercel

### 1.1 Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "demo-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/demo-server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 1.2 Update package.json
```json
{
  "scripts": {
    "start": "node demo-server.js",
    "vercel-build": "echo 'No build needed'"
  }
}
```

## Step 2: Deploy to Vercel

### Method 1: GitHub Integration
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your repository

### Method 2: Vercel CLI
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add all your production environment variables
3. Redeploy after adding variables

## Your URL will be:
`https://bvester-backend.vercel.app`

## Pros:
- ✅ Instant global deployment
- ✅ Automatic HTTPS
- ✅ Great performance
- ✅ Easy custom domains

## Estimated Cost:
- **Hobby**: Free for personal projects
- **Pro**: $20/month for teams