# 🚀 Bvester: Local Development to AWS Deployment

## Complete workflow for cloud engineers to test locally and deploy to AWS

---

# 📋 Phase 1: Local Testing & Development

## Step 1: Get Project Files

```bash
# Option A: Git clone (if GitHub push succeeds)
git clone https://github.com/KwameBrempong/bvesteroriginal.git
cd bvesteroriginal

# Option B: Copy files manually
# Get these files from the project:
# - docker-compose.cloud.yml
# - backend/Dockerfile
# - Dockerfile.web.vercel
# - All source code
```

## Step 2: Local Environment Setup

```bash
# Create environment file
cat > .env << EOF
# Firebase Configuration
FIREBASE_PROJECT_ID=bizinvest-hub-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@bizinvest-hub-prod.iam.gserviceaccount.com

# API Keys (use test keys for local)
STRIPE_SECRET_KEY=sk_test_your_test_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_test_key
JWT_SECRET=your-local-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Services
SENDGRID_API_KEY=SG.your_sendgrid_key
TWILIO_ACCOUNT_SID=AC_your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Redis
REDIS_PASSWORD=local_redis_password
EOF
```

## Step 3: Test Locally

```bash
# Start all services
docker-compose -f docker-compose.cloud.yml up -d

# Verify services
docker-compose ps
docker-compose logs -f bvester-backend

# Test API
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"..."}

# Test Redis
docker exec bvester-cache redis-cli ping
# Expected: PONG

# Frontend (already on Vercel)
# Visit: https://web-cs14pus7u-kwame-brempongs-projects.vercel.app
```

## Step 4: Local Development (Optional)

```bash
# For development with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Access services:
# - Backend API: http://localhost:3000
# - Frontend Dev: http://localhost:19006
# - Firebase Emulator: http://localhost:4000
# - Redis Admin: http://localhost:8081
```

---

# ☁️ Phase 2: AWS Deployment Options

## Option A: Simple EC2 Deployment (Easiest)

### Step 1: Launch EC2 Instance

```bash
# Launch Ubuntu instance (adjust region/keys as needed)
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.medium \
    --key-name YOUR-KEY-PAIR \
    --security-group-ids sg-xxxxxxxxx \
    --subnet-id subnet-xxxxxxxxx \
    --associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bvester-prod}]'
```

### Step 2: Setup Instance

```bash
# SSH to instance
ssh -i your-key.pem ubuntu@YOUR-EC2-IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for Docker permissions
exit
ssh -i your-key.pem ubuntu@YOUR-EC2-IP
```

### Step 3: Deploy Application

```bash
# Create app directory
mkdir ~/bvester && cd ~/bvester

# Copy your files to the instance (use scp, git, or manual copy)
# Upload: docker-compose.cloud.yml, .env (with production values)

# Production environment file
cat > .env << EOF
# Production Firebase Configuration
FIREBASE_PROJECT_ID=bizinvest-hub-prod
FIREBASE_PRIVATE_KEY="YOUR_PRODUCTION_PRIVATE_KEY"
FIREBASE_CLIENT_EMAIL=your-production-service-account@bizinvest-hub-prod.iam.gserviceaccount.com

# Production API Keys
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_live_flutterwave_key
JWT_SECRET=your-super-secure-production-jwt-key
ENCRYPTION_KEY=your-32-char-production-encryption-key

# Production Services
SENDGRID_API_KEY=SG.your_production_sendgrid_key
TWILIO_ACCOUNT_SID=AC_your_production_twilio_sid
TWILIO_AUTH_TOKEN=your_production_twilio_token

# Redis
REDIS_PASSWORD=your_very_secure_redis_password
EOF

# Start application
docker-compose -f docker-compose.cloud.yml up -d

# Verify deployment
docker-compose ps
curl http://localhost:3000/health
```

### Step 4: Configure Security & Access

```bash
# Install nginx for reverse proxy with SSL
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

# Configure nginx
sudo nano /etc/nginx/sites-available/bvester

# Nginx config:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/bvester /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Option B: ECS Fargate (Production-Ready)

### Step 1: Build and Push Images

```bash
# Create ECR repositories
aws ecr create-repository --repository-name bvester-backend --region us-east-1

# Get ECR URI (replace with your account ID and region)
ECR_URI="123456789012.dkr.ecr.us-east-1.amazonaws.com"

# Build and push backend
docker build -f backend/Dockerfile -t bvester-backend ./backend
docker tag bvester-backend:latest $ECR_URI/bvester-backend:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# Push image
docker push $ECR_URI/bvester-backend:latest
```

### Step 2: Create ECS Resources

```bash
# Create cluster
aws ecs create-cluster --cluster-name bvester-production

# Register task definition (use the aws-ecs-backend-task.json file)
# Update ACCOUNT_ID, REGION, and ECR URIs in the JSON file first
aws ecs register-task-definition --cli-input-json file://aws-ecs-backend-task.json

# Create service
aws ecs create-service \
    --cluster bvester-production \
    --service-name bvester-backend \
    --task-definition bvester-backend:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx,subnet-yyyyyyyyy],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}"
```

---

# 🔧 Production Configuration

## Environment Variables for Production

```env
# Use production Firebase project
FIREBASE_PROJECT_ID=bizinvest-hub-prod

# Use live payment keys
STRIPE_SECRET_KEY=sk_live_...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...

# Strong security keys
JWT_SECRET=super-long-random-string-min-32-chars
ENCRYPTION_KEY=exactly-32-character-key-here

# Production communication services
SENDGRID_API_KEY=SG.production_key
TWILIO_ACCOUNT_SID=AC_production_sid

# Secure Redis password
REDIS_PASSWORD=very-strong-redis-password-123
```

## Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (only ports 80, 443, 22)
- [ ] Use AWS Secrets Manager for sensitive data
- [ ] Enable CloudWatch logging and monitoring
- [ ] Set up backup strategy for Redis data
- [ ] Configure auto-scaling based on demand

## Monitoring & Maintenance

```bash
# Check application health
curl https://your-domain.com/health

# Monitor Docker containers
docker-compose logs -f --tail=100

# Check resource usage
docker stats

# Update application
docker-compose pull
docker-compose up -d --no-deps bvester-backend

# Backup Redis data
docker exec bvester-cache redis-cli --rdb /data/backup-$(date +%Y%m%d).rdb
```

---

# 💰 Cost Estimates

## EC2 Deployment (Monthly)
- **t3.medium instance**: $30
- **20GB EBS storage**: $2
- **Elastic IP**: $4
- **Data transfer**: $5
- **Total**: ~$40/month

## ECS Fargate (Monthly)
- **2x Backend tasks (0.5 vCPU, 1GB)**: $30
- **1x Redis task (0.25 vCPU, 0.5GB)**: $10
- **Application Load Balancer**: $18
- **Data transfer**: $10
- **Total**: ~$68/month

---

# 🎯 Quick Start Commands

## Test Locally (5 minutes)
```bash
git clone YOUR-REPO
cd bvester
cp .env.example .env  # Edit with your credentials
docker-compose -f docker-compose.cloud.yml up -d
curl http://localhost:3000/health
```

## Deploy to AWS EC2 (15 minutes)
```bash
# Launch EC2, install Docker, copy files
docker-compose -f docker-compose.cloud.yml up -d
# Configure nginx + SSL
```

## Deploy to AWS ECS (30 minutes)
```bash
# Build images, push to ECR
# Create ECS cluster and services
# Configure load balancer
```

**The same Docker files work everywhere!** 🚀