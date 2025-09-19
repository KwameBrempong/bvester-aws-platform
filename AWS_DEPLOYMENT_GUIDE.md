# 🚀 Bvester AWS Deployment Guide

## Overview

Deploy the Bvester platform to AWS using multiple service options. This guide provides complete instructions for cloud engineers.

## Architecture Options

### Option 1: ECS Fargate (Recommended) 🏆
- **Serverless containers** - No server management
- **Auto-scaling** - Scales based on demand
- **Cost-effective** - Pay only for what you use
- **Best for**: Production deployments

### Option 2: EC2 with Docker Compose
- **Traditional VMs** - Full control over infrastructure  
- **Simple deployment** - Use existing docker-compose files
- **Best for**: Development/testing environments

### Option 3: AWS App Runner
- **Fully managed** - Simplest deployment option
- **Auto-scaling** - Built-in scaling and load balancing
- **Best for**: Quick deployments

---

# 🎯 Option 1: ECS Fargate Deployment (Recommended)

## Prerequisites

- AWS CLI installed and configured
- Docker images available (we'll build from your code)
- Domain name (optional)

## Step 1: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name bvester-cluster

# Create VPC and subnets (if needed)
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=bvester-vpc}]'
```

## Step 2: Build and Push Docker Images

```bash
# Build backend image
docker build -f backend/Dockerfile -t bvester-backend ./backend

# Tag for ECR
docker tag bvester-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/bvester-backend:latest

# Push to ECR
aws ecr create-repository --repository-name bvester-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/bvester-backend:latest
```

## Step 3: Create Task Definitions

### Backend API Task Definition

```json
{
  "family": "bvester-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "bvester-backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/bvester-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "FIREBASE_PROJECT_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:bvester/firebase-project-id"
        },
        {
          "name": "FIREBASE_PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:bvester/firebase-private-key"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:bvester/jwt-secret"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bvester-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Redis Task Definition

```json
{
  "family": "bvester-redis",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "bvester-redis",
      "image": "redis:7-alpine",
      "portMappings": [
        {
          "containerPort": 6379,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "command": ["redis-server", "--appendonly", "yes", "--requirepass", "bvestersecure"],
      "mountPoints": [
        {
          "sourceVolume": "redis-data",
          "containerPath": "/data"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bvester-redis",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "redis-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-12345678",
        "rootDirectory": "/redis"
      }
    }
  ]
}
```

## Step 4: Create ECS Services

```bash
# Register task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
aws ecs register-task-definition --cli-input-json file://redis-task-def.json

# Create services
aws ecs create-service \
    --cluster bvester-cluster \
    --service-name bvester-backend-service \
    --task-definition bvester-backend \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/bvester-backend-tg/1234567890123456,containerName=bvester-backend,containerPort=3000

aws ecs create-service \
    --cluster bvester-cluster \
    --service-name bvester-redis-service \
    --task-definition bvester-redis \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=DISABLED}"
```

---

# 🖥️ Option 2: EC2 with Docker Compose

## Step 1: Launch EC2 Instance

```bash
# Launch Ubuntu instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-12345678 \
    --subnet-id subnet-12345678 \
    --user-data file://install-docker.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bvester-server}]'
```

## Step 2: Install Docker (install-docker.sh)

```bash
#!/bin/bash
# Update system
apt-get update -y
apt-get install -y curl wget

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/bvester
cd /opt/bvester

# Download deployment files
curl -o docker-compose.yml https://raw.githubusercontent.com/KwameBrempong/bvesteroriginal/main/docker-compose.cloud.yml

# Create environment file template
cat > .env << EOF
FIREBASE_PROJECT_ID=bizinvest-hub-prod
FIREBASE_PRIVATE_KEY="YOUR_FIREBASE_PRIVATE_KEY"
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_CLIENT_EMAIL
STRIPE_SECRET_KEY=YOUR_STRIPE_KEY
JWT_SECRET=YOUR_JWT_SECRET
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY
REDIS_PASSWORD=your_secure_redis_password
EOF

# Set permissions
chown -R ubuntu:ubuntu /opt/bvester
```

## Step 3: Deploy Application

```bash
# SSH to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to app directory
cd /opt/bvester

# Edit environment variables
sudo nano .env

# Start application
docker-compose up -d

# Check status
docker-compose ps
```

---

# 🏃 Option 3: AWS App Runner

## Step 1: Create apprunner.yaml

```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building Bvester Backend"
run:
  runtime-version: latest
  command: node server.js
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: FIREBASE_PROJECT_ID
      value: bizinvest-hub-prod
```

## Step 2: Deploy with App Runner

```bash
# Create App Runner service
aws apprunner create-service \
    --service-name bvester-backend \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "kwamebrempong/bvester-backend:latest",
            "ImageConfiguration": {
                "Port": "3000",
                "RuntimeEnvironmentVariables": {
                    "NODE_ENV": "production",
                    "FIREBASE_PROJECT_ID": "bizinvest-hub-prod"
                }
            },
            "ImageRepositoryType": "ECR_PUBLIC"
        },
        "AutoDeploymentsEnabled": true
    }' \
    --instance-configuration '{
        "Cpu": "0.25 vCPU",
        "Memory": "0.5 GB"
    }'
```

---

# 🛠️ Supporting AWS Resources

## Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name bvester-alb \
    --subnets subnet-12345678 subnet-87654321 \
    --security-groups sg-12345678

# Create target group
aws elbv2 create-target-group \
    --name bvester-backend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-12345678 \
    --target-type ip \
    --health-check-path /health
```

## Set up ElastiCache for Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id bvester-redis \
    --engine redis \
    --cache-node-type cache.t3.micro \
    --num-cache-nodes 1 \
    --port 6379
```

## Configure AWS Secrets Manager

```bash
# Store Firebase credentials
aws secretsmanager create-secret \
    --name bvester/firebase-project-id \
    --description "Firebase Project ID" \
    --secret-string "bizinvest-hub-prod"

aws secretsmanager create-secret \
    --name bvester/firebase-private-key \
    --description "Firebase Private Key" \
    --secret-string "YOUR_FIREBASE_PRIVATE_KEY"

aws secretsmanager create-secret \
    --name bvester/jwt-secret \
    --description "JWT Secret Key" \
    --secret-string "YOUR_JWT_SECRET"
```

---

# 📋 Complete Deployment Checklist

## Pre-Deployment
- [ ] AWS account with appropriate permissions
- [ ] Domain name registered (optional)
- [ ] SSL certificate (for HTTPS)
- [ ] Firebase credentials ready
- [ ] Stripe/Flutterwave API keys

## Deployment Steps
- [ ] Choose deployment option (ECS/EC2/App Runner)
- [ ] Create AWS resources (VPC, subnets, security groups)
- [ ] Build and push Docker images
- [ ] Configure secrets in AWS Secrets Manager
- [ ] Deploy application services
- [ ] Set up load balancer and auto-scaling
- [ ] Configure monitoring and logging

## Post-Deployment
- [ ] Test API endpoints
- [ ] Verify frontend connectivity
- [ ] Set up CloudWatch alarms
- [ ] Configure backup strategy
- [ ] Document access credentials

## Estimated Costs (Monthly)

### ECS Fargate (Recommended)
- **2 Backend tasks (0.5 vCPU, 1GB)**: ~$30/month
- **1 Redis task (0.25 vCPU, 0.5GB)**: ~$10/month  
- **Application Load Balancer**: ~$20/month
- **Data transfer**: ~$10/month
- **Total**: ~$70/month

### EC2 (Alternative)
- **t3.medium instance**: ~$30/month
- **EBS storage (20GB)**: ~$2/month
- **Elastic IP**: ~$4/month
- **Total**: ~$36/month

## Support

For AWS deployment assistance:
1. Follow the step-by-step instructions above
2. Check AWS CloudWatch logs for troubleshooting
3. Verify security group and network configurations
4. Contact AWS support for infrastructure issues

---

**Ready to deploy to AWS?** Choose your preferred option and follow the detailed instructions above! 🚀