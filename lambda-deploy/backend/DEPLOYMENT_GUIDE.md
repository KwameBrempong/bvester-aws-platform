# 🚀 BVESTER BACKEND - DEPLOYMENT GUIDE

Complete deployment guide for the Bvester platform backend API.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** (v20.0.0 or higher)
- **Docker Compose** (v2.0.0 or higher)

### Required Accounts & Services
- **Firebase Project** with Admin SDK enabled
- **Stripe Account** for global payments
- **Flutterwave Account** for African payments
- **SendGrid Account** for email notifications
- **Twilio Account** for SMS notifications
- **Cloud Provider Account** (Google Cloud, AWS, or Heroku)

## ⚙️ Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

#### 🔥 Firebase Configuration
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### 💳 Payment Configuration
```env
# Stripe (Global)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Flutterwave (Africa)
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
```

#### 📧 Notification Configuration
```env
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@bvester.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 Deployment Options

### Option 1: Local Development
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Or start with Docker Compose
docker-compose up -d
```

### Option 2: Google Cloud Platform
```bash
# Set deployment target
export DEPLOY_TARGET=gcp

# Run deployment script
./deploy.sh

# Or manually:
gcloud run deploy bvester-backend \
  --image gcr.io/your-project/bvester-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: AWS Deployment
```bash
# Set deployment target
export DEPLOY_TARGET=aws

# Run deployment script
./deploy.sh

# Or deploy to Elastic Beanstalk:
eb init bvester-backend
eb create production
eb deploy
```

### Option 4: Heroku Deployment
```bash
# Set deployment target
export DEPLOY_TARGET=heroku

# Run deployment script
./deploy.sh

# Or manually:
heroku create bvester-backend
heroku container:push web
heroku container:release web
```

### Option 5: Digital Ocean / Linode
```bash
# Build and push Docker image
docker build -t bvester-backend .
docker tag bvester-backend your-registry/bvester-backend
docker push your-registry/bvester-backend

# Deploy using your cloud provider's container service
```

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t bvester-backend .
```

### Run with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Compose
```bash
# For production with monitoring
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ☁️ Cloud-Specific Instructions

### Google Cloud Platform (Recommended)

1. **Setup GCP Project**
   ```bash
   gcloud projects create bvester-backend
   gcloud config set project bvester-backend
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy bvester-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 1Gi \
     --cpu 1
   ```

### AWS Deployment

1. **Setup ECR Repository**
   ```bash
   aws ecr create-repository --repository-name bvester-backend
   ```

2. **Push Image to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   docker tag bvester-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/bvester-backend:latest
   docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/bvester-backend:latest
   ```

3. **Deploy to ECS or Elastic Beanstalk**

### Heroku Deployment

1. **Create Heroku App**
   ```bash
   heroku create bvester-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FIREBASE_PROJECT_ID=your-project-id
   heroku config:set STRIPE_SECRET_KEY=your-stripe-key
   ```

3. **Deploy using Container Registry**
   ```bash
   heroku container:push web
   heroku container:release web
   ```

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-api-url.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-29T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Test API Endpoints
```bash
# Test authentication
curl -X POST https://your-api-url.com/api/auth/status

# Test business listings
curl https://your-api-url.com/api/businesses

# Test payment methods
curl https://your-api-url.com/api/payments/methods/supported
```

### 3. Configure Webhooks

#### Stripe Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-api-url.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `invoice.payment_succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### Flutterwave Webhooks
1. Go to Flutterwave Dashboard → Settings → Webhooks
2. Add endpoint: `https://your-api-url.com/api/webhooks/flutterwave`
3. Copy secret hash to `FLUTTERWAVE_WEBHOOK_SECRET`

### 4. Configure DNS (Optional)
```bash
# Point your domain to the deployed API
# Example for Google Cloud Run:
gcloud run domain-mappings create --service bvester-backend --domain api.bvester.com
```

## 📊 Monitoring & Logging

### Application Logs
```bash
# Docker logs
docker-compose logs -f bvester-api

# Cloud platform logs
gcloud logs tail bvester-backend  # GCP
aws logs tail /aws/lambda/bvester-backend  # AWS
heroku logs --tail --app bvester-backend  # Heroku
```

### Health Monitoring
- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (if enabled)
- Status page: Consider using StatusPage.io

### Error Tracking
- Configure Sentry DSN in environment variables
- Monitor error rates and performance

## 🔒 Security Checklist

- [ ] Environment variables are secured
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] CORS origins are restricted
- [ ] Webhook signatures are verified
- [ ] Database access is restricted
- [ ] API keys are rotated regularly
- [ ] Security headers are enabled

## 🚨 Troubleshooting

### Common Issues

#### 1. Firebase Authentication Errors
```bash
# Check Firebase configuration
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_ADMIN_CLIENT_EMAIL

# Verify service account permissions
```

#### 2. Payment Processing Errors
```bash
# Test Stripe connection
curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/charges

# Test Flutterwave connection
curl -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY" https://api.flutterwave.com/v3/banks/NG
```

#### 3. Database Connection Issues
```bash
# Check Firestore rules
# Verify network connectivity
# Review IAM permissions
```

#### 4. Docker Build Issues
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t bvester-backend .
```

### Getting Help

1. **Check Logs**: Always check application logs first
2. **Health Endpoint**: Verify `/health` returns 200
3. **Environment**: Confirm all required environment variables are set
4. **Dependencies**: Ensure all external services are accessible
5. **GitHub Issues**: Create an issue with logs and error details

## 📈 Scaling Considerations

### Horizontal Scaling
- Configure load balancer
- Use Redis for session storage
- Enable horizontal pod autoscaling

### Database Optimization
- Configure Firestore indexes
- Implement connection pooling
- Monitor query performance

### Caching Strategy
- Redis for API responses
- CDN for static assets
- Browser caching headers

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Bvester Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: ./deploy.sh --target gcp
```

### Deployment Automation
- Automated testing on PRs
- Staging environment deployment
- Production deployment approval
- Rollback procedures

---

## 📞 Support

For deployment support:
- 📧 Email: dev@bvester.com
- 📱 Slack: #bvester-dev
- 🐛 Issues: GitHub Issues
- 📖 Docs: https://docs.bvester.com

**🎉 Your Bvester backend is now ready for deployment!**