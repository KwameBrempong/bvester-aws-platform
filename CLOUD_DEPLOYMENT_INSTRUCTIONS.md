# 🚀 Bvester Cloud Deployment Instructions

## For Cloud Engineers

This guide provides everything needed to deploy the Bvester platform in any cloud environment.

## Architecture Overview

- **Frontend**: Deployed on Vercel → https://web-cs14pus7u-kwame-brempongs-projects.vercel.app
- **Backend API**: Containerized (Docker Hub: `kwamebrempong/bvester-backend:latest`)
- **Database**: Firebase Firestore (serverless)
- **Cache**: Redis (containerized)

## Quick Deployment (5 minutes)

### 1. Download Docker Compose

```bash
# Create deployment directory
mkdir bvester-deployment && cd bvester-deployment

# Download the cloud-ready compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/KwameBrempong/bvesteroriginal/main/docker-compose.cloud.yml

# Or manually copy the docker-compose.cloud.yml file
```

### 2. Configure Environment

Create `.env` file with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=bizinvest-hub-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@bizinvest-hub-prod.iam.gserviceaccount.com

# Payment Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_flutterwave_key

# Security Keys
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Communication Services
SENDGRID_API_KEY=SG.your_sendgrid_key
TWILIO_ACCOUNT_SID=AC_your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password
REDIS_ADMIN_USER=admin
REDIS_ADMIN_PASS=your_admin_password
```

### 3. Deploy

```bash
# Start core services (API + Redis)
docker-compose up -d

# Or start with Redis admin interface
docker-compose --profile admin up -d

# Or include local web server (optional)
docker-compose --profile web-local --profile admin up -d
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test API health
curl http://localhost:3000/health

# Test Redis
docker exec bvester-cache redis-cli ping

# View logs
docker-compose logs -f bvester-backend
```

## Service URLs

After deployment, access services at:

- **API**: http://localhost:3000
- **Redis**: localhost:6379
- **Redis Admin**: http://localhost:8081 (with --profile admin)
- **Web (Local)**: http://localhost:8080 (with --profile web-local)
- **Frontend (Live)**: https://web-cs14pus7u-kwame-brempongs-projects.vercel.app

## Docker Images Available

| Service | Image | Description |
|---------|-------|-------------|
| Backend API | `kwamebrempong/bvester-backend:latest` | Production API server |
| Backend (Dev) | `kwamebrempong/bvester-backend-dev:latest` | Development version |
| Web App | `kwamebrempong/bvester-web-vercel:latest` | Static frontend files |
| Redis | `redis:7-alpine` | Cache and sessions |

## Production Deployment

### AWS ECS Deployment

```bash
# Create ECS task definition using the docker-compose.cloud.yml
# Configure load balancer for port 3000
# Set environment variables in ECS task
# Use RDS or ElastiCache for managed Redis
```

### Google Cloud Run

```bash
# Deploy backend container
gcloud run deploy bvester-backend \
  --image kwamebrempong/bvester-backend:latest \
  --port 3000 \
  --set-env-vars FIREBASE_PROJECT_ID=bizinvest-hub-prod

# Use Cloud Memorystore for Redis
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bvester-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bvester-backend
  template:
    metadata:
      labels:
        app: bvester-backend
    spec:
      containers:
      - name: api
        image: kwamebrempong/bvester-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: bvester-secrets
```

## Scaling & Monitoring

### Horizontal Scaling

```bash
# Scale API instances
docker-compose up -d --scale bvester-backend=3

# Use load balancer (nginx, traefik, etc.)
```

### Monitoring

```bash
# Resource usage
docker stats

# Application logs
docker-compose logs -f --tail=100 bvester-backend

# Health checks
curl -f http://localhost:3000/health || echo "API Down"
```

## Security Considerations

1. **Firewall**: Only expose ports 3000 (API) and 443 (HTTPS)
2. **Secrets**: Use secrets management (AWS Secrets Manager, etc.)
3. **SSL**: Configure reverse proxy with SSL certificates
4. **Redis**: Password-protect Redis, disable dangerous commands
5. **API**: Rate limiting is built-in, configure as needed

## Maintenance

### Updating

```bash
# Pull latest images
docker-compose pull

# Restart with zero downtime
docker-compose up -d --no-deps bvester-backend
```

### Backups

```bash
# Backup Redis data
docker exec bvester-cache redis-cli --rdb /data/backup.rdb

# Firestore backups are handled automatically by Firebase
```

## Troubleshooting

### Common Issues

**API won't start:**
- Check Firebase credentials in environment variables
- Verify all required environment variables are set
- Check logs: `docker logs bvester-api`

**Redis connection failed:**
- Verify Redis container is running: `docker ps`
- Check Redis password configuration
- Test connection: `docker exec bvester-cache redis-cli ping`

**Frontend shows old version:**
- Frontend is deployed separately on Vercel
- Check latest deployment: https://web-cs14pus7u-kwame-brempongs-projects.vercel.app
- Frontend updates automatically on Git push

### Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Test individual services
4. Contact development team with error details

---

**Ready to deploy?** Just run `docker-compose up -d` and you're live! 🚀