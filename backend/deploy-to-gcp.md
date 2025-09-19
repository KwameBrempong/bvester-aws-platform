# 🚀 Deploy Bvester to Google Cloud Run

## Prerequisites Completed ✅
- [x] Google Cloud CLI installed
- [x] Authenticated with `gcloud auth login`
- [x] Project created: `bvester-production`
- [x] APIs enabled: Cloud Run, Cloud Build, Container Registry

## 🎯 Deployment Commands

### Option 1: Direct Source Deploy (Recommended)
```bash
# Navigate to backend directory
cd backend

# Deploy directly from source (easiest method)
gcloud run deploy bvester-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300s \
  --project bvester-production
```

### Option 2: Docker Build Deploy
```bash
# Build and deploy using Docker
gcloud builds submit --tag gcr.io/bvester-production/bvester-backend

# Deploy the built image
gcloud run deploy bvester-backend \
  --image gcr.io/bvester-production/bvester-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Set Environment Variables

After initial deployment, configure your environment variables:

```bash
# Set all environment variables at once
gcloud run services update bvester-backend \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-env-vars FIREBASE_PROJECT_ID=your-actual-project-id \
  --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email \
  --set-env-vars STRIPE_SECRET_KEY=your-stripe-key \
  --set-env-vars FLUTTERWAVE_SECRET_KEY=your-flutterwave-key \
  --set-env-vars SENDGRID_API_KEY=your-sendgrid-key \
  --set-env-vars TWILIO_ACCOUNT_SID=your-twilio-sid \
  --set-env-vars TWILIO_AUTH_TOKEN=your-twilio-token \
  --set-env-vars JWT_SECRET=de58d5108737ca37748806925f302e9de801f01947cbfae733924819d72e1231a03191580aae2f63aa721bafaf23cd8842a245889a58890f2fcc32ce8f65d006 \
  --set-env-vars ENCRYPTION_KEY=307c3fc86aceed9fde5e354ef4e95241da0790cc0fe0604c059a17d0023308c0 \
  --region us-central1
```

## 🌐 Get Your Production URL

After deployment, you'll get a URL like:
```
https://bvester-backend-[random-hash]-uc.a.run.app
```

## 🧪 Test Your Deployment

1. **Visit your URL** to see the API homepage
2. **Test the /health endpoint**: `https://your-url.com/health`
3. **Try the test buttons** in the interface
4. **Verify all endpoints** are working

## 📊 Monitor Your Deployment

View logs and metrics:
```bash
# View logs
gcloud run services logs read bvester-backend --region us-central1

# View service details
gcloud run services describe bvester-backend --region us-central1
```

## 💰 Cost Estimation

Google Cloud Run pricing:
- **Free tier**: 2 million requests/month
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests

**Estimated monthly cost for 10,000 users**: $10-50

## 🔧 Custom Domain (Optional)

To use your own domain:
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service bvester-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

## 🚨 Troubleshooting

**Common issues:**
- **Authentication errors**: Run `gcloud auth login` again
- **Billing not enabled**: Enable billing in Google Cloud Console
- **API not enabled**: Run the enable services commands again
- **Build timeout**: Increase timeout with `--timeout=600s`

## 🎉 Success!

Once deployed, your Bvester backend will be:
- ✅ Auto-scaling from 0 to 1000+ instances
- ✅ Running on Google's global infrastructure
- ✅ Automatically secured with HTTPS
- ✅ Monitored with Cloud Monitoring
- ✅ Ready to serve African SME investment platform globally!