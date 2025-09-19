# 🚀 BVester Local Development & AWS Deployment Guide

This guide provides comprehensive instructions for running the BVester application locally and deploying to AWS from Firebase.

## 📋 Project Overview

**BVester** is a fintech investment platform connecting African SMEs with global investors. The application consists of:

- **Frontend**: React Native/Expo app with web support
- **Backend**: Node.js/Express API server
- **Web App**: React-based web interface
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting with AWS deployment options

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **Git**
- **Firebase CLI**
- **Expo CLI** (for mobile development)
- **AWS CLI** (for AWS deployment)

### Quick Installation Commands:

```bash
# Install Node.js (use NVM for version management)
# Windows: Download from nodejs.org or use Chocolatey
choco install nodejs

# Install global packages
npm install -g firebase-tools expo-cli @aws-cdk/cli

# Verify installations
node --version
npm --version
firebase --version
expo --version
```

## 🔧 Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd bvester

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Create Environment Files

Copy the example environment files and configure them:

```bash
# Root environment (for mobile/web app)
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env
```

#### Configure Environment Variables

**Root `.env` file:**
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Development Configuration
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true

# Payment (use test keys for development)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-key
```

**Backend `.env` file:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# Payment Secrets (test keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-key

# Database
DATABASE_URL=mongodb://localhost:27017/bvester
```

### 3. Firebase Setup

#### Initialize Firebase

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Start Firebase emulators for local development
firebase emulators:start
```

The emulators will start on:
- **Firestore**: http://localhost:8080
- **Authentication**: http://localhost:9099
- **Hosting**: http://localhost:5000
- **Functions**: http://localhost:5001
- **Emulator UI**: http://localhost:4000

### 4. Start Development Servers

Open 3 terminal windows/tabs:

#### Terminal 1: Backend Server
```bash
cd backend
npm run dev
# Server will start on http://localhost:3000
```

#### Terminal 2: Mobile/Web App
```bash
# For web development
npm run web

# For mobile development (requires Expo Go app)
npm start
# Then scan QR code with Expo Go app
```

#### Terminal 3: Firebase Emulators
```bash
firebase emulators:start
```

### 5. Access the Application

- **Web App**: http://localhost:19006 (Expo web)
- **Mobile**: Scan QR code in Expo Go app
- **Backend API**: http://localhost:3000
- **Firebase Emulator UI**: http://localhost:4000

## 📱 Mobile Development

### Running on Physical Device

1. Install **Expo Go** app on your mobile device
2. Ensure device and computer are on the same network
3. Run `npm start` and scan the QR code

### Running on Simulator/Emulator

```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android
```

## 🌐 Web Development

The web version is available through Expo's web support:

```bash
# Start web development server
npm run web
# Access at http://localhost:19006
```

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

### Manual Testing Checklist

- [ ] User registration/login
- [ ] Business profile creation
- [ ] Investment opportunity browsing
- [ ] Payment flow (use test cards)
- [ ] File uploads
- [ ] Real-time notifications

## 🚀 AWS Deployment Guide

### Method 1: Deploy from Firebase to AWS

#### Prerequisites for AWS Deployment

```bash
# Install AWS CLI
# Windows: Download from aws.amazon.com/cli
# Or use package manager

# Configure AWS credentials
aws configure
# Enter your Access Key ID, Secret Access Key, Region, and Output format
```

#### Step 1: Build for Production

```bash
# Build web app for production
npm run build:web

# Build backend for production
cd backend
npm run build  # If you have a build script
```

#### Step 2: Deploy to AWS S3 + CloudFront

```bash
# Create S3 bucket for web hosting
aws s3 mb s3://bvester-web-app --region us-east-1

# Build and upload web app
npm run web:build
aws s3 sync ./web-build s3://bvester-web-app --delete

# Create CloudFront distribution (optional, for CDN)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### Step 3: Deploy Backend to AWS Lambda/EC2

**Option A: AWS Lambda (Serverless)**

```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml in backend directory
# Deploy to Lambda
cd backend
serverless deploy
```

**Option B: AWS EC2**

```bash
# Create EC2 instance
aws ec2 run-instances --image-id ami-0c55b159cbfafe1d0 --count 1 --instance-type t2.micro

# Deploy using Docker or direct deployment
# See detailed AWS EC2 deployment guide below
```

### Method 2: Firebase to AWS Migration

#### Step 1: Export Firebase Data

```bash
# Export Firestore data
firebase firestore:delete --all-collections
firebase firestore:export gs://your-bucket/firestore-export

# Download the export
gsutil -m cp -r gs://your-bucket/firestore-export ./firestore-backup
```

#### Step 2: Setup AWS Services

```bash
# Create DynamoDB tables (alternative to Firestore)
aws dynamodb create-table --table-name Users --cli-input-json file://users-table.json
aws dynamodb create-table --table-name Businesses --cli-input-json file://businesses-table.json
aws dynamodb create-table --table-name Investments --cli-input-json file://investments-table.json
```

#### Step 3: Migrate Authentication

```bash
# Export Firebase users
firebase auth:export users.json

# Import to AWS Cognito
aws cognito-idp admin-create-user --user-pool-id us-east-1_XXXXXXXXX --username user@example.com
```

### AWS Infrastructure Setup

#### Create AWS Resources

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create Application Load Balancer
aws elbv2 create-load-balancer --name bvester-alb --subnets subnet-12345 subnet-67890

# Create RDS instance (if using SQL database)
aws rds create-db-instance --db-instance-identifier bvester-db --db-instance-class db.t3.micro --engine mysql
```

#### Environment Variables for AWS

Update your production environment variables:

```env
# AWS Production Environment
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.bvester.com
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false

# AWS Specific
AWS_REGION=us-east-1
AWS_S3_BUCKET=bvester-uploads
AWS_CLOUDFRONT_DOMAIN=d123456abcdef8.cloudfront.net

# Database (if using RDS)
DATABASE_URL=mysql://user:password@bvester-db.cluster-xyz.us-east-1.rds.amazonaws.com/bvester
```

## 🔐 Security Considerations

### Development Security

- Use Firebase emulators for local development
- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Test with sandbox payment keys only

### Production Security

- Enable Firebase Security Rules
- Use HTTPS for all API endpoints
- Implement proper CORS policies
- Enable AWS WAF for DDoS protection
- Use AWS Secrets Manager for sensitive data

## 📊 Monitoring and Analytics

### AWS CloudWatch Setup

```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm --alarm-name "High-CPU" --alarm-description "Alarm when CPU exceeds 70%" --metric-name CPUUtilization
```

### Application Monitoring

```javascript
// Add to your app for monitoring
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
});
```

## 🚨 Troubleshooting

### Common Issues

#### Firebase Emulator Issues
```bash
# Clear emulator data
firebase emulators:export ./emulator-backup
firebase emulators:start --import=./emulator-backup
```

#### Build Issues
```bash
# Clear React Native cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Clear Expo cache
expo r -c
```

#### AWS Deployment Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify S3 bucket permissions
aws s3api get-bucket-policy --bucket bvester-web-app
```

### Getting Help

- **Firebase Issues**: Check Firebase Console and logs
- **AWS Issues**: Check CloudWatch logs
- **Expo Issues**: Check Expo DevTools
- **General Issues**: Check application logs in respective environments

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

## 🔄 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Security rules updated
- [ ] API endpoints tested
- [ ] Payment flow tested (sandbox)
- [ ] Mobile app tested on devices
- [ ] Web app tested on browsers

### Deployment
- [ ] Build production assets
- [ ] Deploy backend services
- [ ] Deploy web application
- [ ] Configure CDN/DNS
- [ ] Test production environment
- [ ] Monitor deployment logs

### Post-deployment
- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] Update documentation
- [ ] Notify stakeholders

---

## 🎯 Quick Start Commands

```bash
# Complete local setup
git clone <repo-url>
cd bvester
npm install
cd backend && npm install && cd ..
cp .env.example .env
cp backend/.env.example backend/.env
# Edit .env files with your configuration
firebase emulators:start &
cd backend && npm run dev &
npm run web

# Quick AWS deployment
npm run build:web
aws s3 sync ./web-build s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

This guide should get you up and running with BVester locally and provide a clear path for AWS deployment. Adjust the configurations based on your specific requirements and AWS setup preferences.