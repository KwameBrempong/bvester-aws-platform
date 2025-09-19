#!/bin/bash

# 🚀 BVESTER BACKEND - DEPLOYMENT SCRIPT
# Automated deployment script for various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bvester-backend"
VERSION="1.0.0"
REGISTRY="gcr.io/your-project-id"

echo -e "${BLUE}🚀 Bvester Backend Deployment Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}💡 Copy .env.example to .env and configure your environment variables${NC}"
    exit 1
fi

# Load environment variables
source .env

# Function to check required environment variables
check_env_vars() {
    local required_vars=(
        "NODE_ENV"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_ADMIN_CLIENT_EMAIL"
        "STRIPE_SECRET_KEY"
        "FLUTTERWAVE_SECRET_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm test
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Function to build Docker image
build_docker() {
    echo -e "${BLUE}🏗️  Building Docker image...${NC}"
    docker build -t $APP_NAME:$VERSION .
    docker tag $APP_NAME:$VERSION $APP_NAME:latest
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Function to deploy to Google Cloud Platform
deploy_gcp() {
    echo -e "${BLUE}☁️  Deploying to Google Cloud Platform...${NC}"
    
    # Authenticate with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${YELLOW}🔐 Please authenticate with Google Cloud${NC}"
        gcloud auth login
    fi
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker
    
    # Tag and push image to Google Container Registry
    docker tag $APP_NAME:latest $REGISTRY/$APP_NAME:latest
    docker push $REGISTRY/$APP_NAME:latest
    
    # Deploy to Cloud Run
    gcloud run deploy $APP_NAME \
        --image $REGISTRY/$APP_NAME:latest \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --set-env-vars NODE_ENV=$NODE_ENV \
        --set-env-vars FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
        --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL" \
        --set-env-vars STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
        --set-env-vars FLUTTERWAVE_SECRET_KEY=$FLUTTERWAVE_SECRET_KEY
    
    echo -e "${GREEN}✅ Deployed to Google Cloud Run${NC}"
}

# Function to deploy to AWS
deploy_aws() {
    echo -e "${BLUE}☁️  Deploying to AWS...${NC}"
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure'${NC}"
        exit 1
    fi
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names $APP_NAME > /dev/null 2>&1 || \
        aws ecr create-repository --repository-name $APP_NAME
    
    # Get ECR login token
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
    
    # Tag and push image to ECR
    docker tag $APP_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$APP_NAME:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$APP_NAME:latest
    
    echo -e "${GREEN}✅ Image pushed to AWS ECR${NC}"
    echo -e "${YELLOW}💡 Deploy to ECS or Elastic Beanstalk using the AWS Console${NC}"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo -e "${BLUE}☁️  Deploying to Heroku...${NC}"
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo -e "${RED}❌ Heroku CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check if user is logged in to Heroku
    if ! heroku auth:whoami > /dev/null 2>&1; then
        echo -e "${YELLOW}🔐 Please login to Heroku${NC}"
        heroku login
    fi
    
    # Create Heroku app if it doesn't exist
    if ! heroku apps:info $APP_NAME > /dev/null 2>&1; then
        heroku create $APP_NAME
    fi
    
    # Set environment variables
    heroku config:set NODE_ENV=$NODE_ENV --app $APP_NAME
    heroku config:set FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID --app $APP_NAME
    heroku config:set FIREBASE_ADMIN_CLIENT_EMAIL="$FIREBASE_ADMIN_CLIENT_EMAIL" --app $APP_NAME
    heroku config:set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY --app $APP_NAME
    heroku config:set FLUTTERWAVE_SECRET_KEY=$FLUTTERWAVE_SECRET_KEY --app $APP_NAME
    
    # Deploy using Heroku Container Registry
    heroku container:login
    heroku container:push web --app $APP_NAME
    heroku container:release web --app $APP_NAME
    
    echo -e "${GREEN}✅ Deployed to Heroku${NC}"
    echo -e "${BLUE}🌐 App URL: https://$APP_NAME.herokuapp.com${NC}"
}

# Function to deploy locally with Docker Compose
deploy_local() {
    echo -e "${BLUE}🏠 Starting local deployment with Docker Compose...${NC}"
    
    # Stop existing containers
    docker-compose down
    
    # Build and start containers
    docker-compose up -d --build
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check if API is responding
    if curl -f http://localhost:${PORT:-5000}/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Local deployment successful${NC}"
        echo -e "${BLUE}🌐 API URL: http://localhost:${PORT:-5000}${NC}"
        echo -e "${BLUE}📊 Grafana: http://localhost:3001${NC}"
    else
        echo -e "${RED}❌ Local deployment failed${NC}"
        docker-compose logs
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    # Add your migration commands here
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Check environment variables
    check_env_vars
    
    # Run tests
    if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        run_tests
    fi
    
    # Build Docker image
    build_docker
    
    # Run migrations if needed
    if [[ "${RUN_MIGRATIONS:-false}" == "true" ]]; then
        run_migrations
    fi
    
    # Deploy based on target platform
    case "${DEPLOY_TARGET:-local}" in
        "gcp")
            deploy_gcp
            ;;
        "aws")
            deploy_aws
            ;;
        "heroku")
            deploy_heroku
            ;;
        "local")
            deploy_local
            ;;
        *)
            echo -e "${RED}❌ Unknown deployment target: ${DEPLOY_TARGET}${NC}"
            echo -e "${YELLOW}💡 Supported targets: gcp, aws, heroku, local${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            DEPLOY_TARGET="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --run-migrations)
            RUN_MIGRATIONS="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --target TARGET       Deployment target (gcp, aws, heroku, local)"
            echo "  --skip-tests          Skip running tests"
            echo "  --run-migrations      Run database migrations"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Run main function
main