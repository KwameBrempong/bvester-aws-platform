#!/bin/bash

# 🚀 BVESTER PLATFORM - DOCKER DEPLOYMENT SCRIPT
# Automated deployment script for BVester African SME Investment Platform

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================
APP_NAME="bvester"
VERSION="${VERSION:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
REGISTRY="${REGISTRY:-}"
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command_exists docker; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! command_exists docker-compose; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
    fi
    
    success "All prerequisites met"
}

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================
setup_environment() {
    log "Setting up environment..."
    
    # Check if .env file exists
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            warning ".env file not found. Copying from .env.example"
            cp .env.example .env
            warning "Please update .env file with your actual values before proceeding"
            read -p "Press Enter to continue after updating .env file..."
        else
            error ".env file not found and no .env.example available"
        fi
    fi
    
    # Check if backend .env exists
    if [[ ! -f backend/.env ]]; then
        if [[ -f backend/.env.example ]]; then
            warning "Backend .env file not found. Copying from .env.example"
            cp backend/.env.example backend/.env
            warning "Please update backend/.env file with your actual values"
        fi
    fi
    
    success "Environment setup complete"
}

# ============================================================================
# BUILD FUNCTIONS
# ============================================================================
build_backend() {
    log "Building backend container..."
    
    docker build \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --tag "${APP_NAME}-backend:${VERSION}" \
        --tag "${APP_NAME}-backend:latest" \
        --file backend/Dockerfile \
        backend/
    
    success "Backend container built successfully"
}

build_web() {
    log "Building web application container..."
    
    docker build \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --tag "${APP_NAME}-web:${VERSION}" \
        --tag "${APP_NAME}-web:latest" \
        --file Dockerfile.web \
        .
    
    success "Web application container built successfully"
}

# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================
deploy_development() {
    log "Deploying development environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    # Build and start services
    docker-compose -f docker-compose.dev.yml up --build -d
    
    # Wait for services to be healthy
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health "development"
    
    success "Development environment deployed successfully"
    log "Access the application at:"
    log "  - Web App: http://localhost:19006"
    log "  - Backend API: http://localhost:3000"
    log "  - Firebase Emulator UI: http://localhost:4000"
    log "  - Redis Commander: http://localhost:8081 (if enabled)"
}

deploy_production() {
    log "Deploying production environment..."
    
    # Build containers
    build_backend
    build_web
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Start production services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be ready..."
    sleep 60
    
    # Check service health
    check_service_health "production"
    
    success "Production environment deployed successfully"
    log "Access the application at:"
    log "  - Web App: http://localhost"
    log "  - Backend API: http://localhost:3000"
}

# ============================================================================
# HEALTH CHECK
# ============================================================================
check_service_health() {
    local env=$1
    log "Checking service health for ${env} environment..."
    
    # Check backend health
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        success "Backend service is healthy"
    else
        error "Backend service health check failed"
    fi
    
    # Check web service health (production only)
    if [[ "$env" == "production" ]]; then
        if curl -f http://localhost/health >/dev/null 2>&1; then
            success "Web service is healthy"
        else
            error "Web service health check failed"
        fi
    fi
    
    # Check Redis health
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        success "Redis service is healthy"
    else
        warning "Redis service health check failed"
    fi
}

# ============================================================================
# REGISTRY FUNCTIONS
# ============================================================================
push_to_registry() {
    if [[ -z "$REGISTRY" ]]; then
        warning "No registry specified, skipping push"
        return
    fi
    
    log "Pushing images to registry: $REGISTRY"
    
    # Tag images for registry
    docker tag "${APP_NAME}-backend:${VERSION}" "${REGISTRY}/${APP_NAME}-backend:${VERSION}"
    docker tag "${APP_NAME}-web:${VERSION}" "${REGISTRY}/${APP_NAME}-web:${VERSION}"
    
    # Push images
    docker push "${REGISTRY}/${APP_NAME}-backend:${VERSION}"
    docker push "${REGISTRY}/${APP_NAME}-web:${VERSION}"
    
    success "Images pushed to registry successfully"
}

# ============================================================================
# CLEANUP FUNCTIONS
# ============================================================================
cleanup() {
    log "Cleaning up unused Docker resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    success "Cleanup completed"
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================
backup_data() {
    log "Creating data backup..."
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup Redis data
    if docker-compose ps redis | grep -q "Up"; then
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp "$(docker-compose ps -q redis)":/data/dump.rdb "$backup_dir/"
        success "Redis data backed up"
    fi
    
    # Backup uploaded files
    if [[ -d "./uploads" ]]; then
        cp -r ./uploads "$backup_dir/"
        success "Upload files backed up"
    fi
    
    # Backup logs
    if [[ -d "./logs" ]]; then
        cp -r ./logs "$backup_dir/"
        success "Log files backed up"
    fi
    
    success "Backup created at: $backup_dir"
}

# ============================================================================
# MONITORING FUNCTIONS
# ============================================================================
show_logs() {
    local service="${1:-}"
    
    if [[ -n "$service" ]]; then
        log "Showing logs for service: $service"
        docker-compose logs -f "$service"
    else
        log "Showing logs for all services"
        docker-compose logs -f
    fi
}

show_status() {
    log "Showing service status..."
    docker-compose ps
    
    log "Showing container resource usage..."
    docker stats --no-stream
}

# ============================================================================
# MAIN FUNCTION
# ============================================================================
main() {
    echo "🚀 BVester Platform Docker Deployment Script"
    echo "============================================="
    
    case "${1:-help}" in
        "dev"|"development")
            check_prerequisites
            setup_environment
            deploy_development
            ;;
        "prod"|"production")
            check_prerequisites
            setup_environment
            deploy_production
            ;;
        "build")
            check_prerequisites
            build_backend
            build_web
            ;;
        "push")
            check_prerequisites
            push_to_registry
            ;;
        "logs")
            show_logs "${2:-}"
            ;;
        "status")
            show_status
            ;;
        "backup")
            backup_data
            ;;
        "cleanup")
            cleanup
            ;;
        "stop")
            log "Stopping all services..."
            docker-compose down
            success "All services stopped"
            ;;
        "restart")
            log "Restarting all services..."
            docker-compose restart
            success "All services restarted"
            ;;
        "help"|*)
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  dev, development   Deploy development environment"
            echo "  prod, production   Deploy production environment"
            echo "  build             Build all containers"
            echo "  push              Push containers to registry"
            echo "  logs [service]    Show logs (optionally for specific service)"
            echo "  status            Show service status and resource usage"
            echo "  backup            Create data backup"
            echo "  cleanup           Clean up unused Docker resources"
            echo "  stop              Stop all services"
            echo "  restart           Restart all services"
            echo "  help              Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  VERSION           Container version tag (default: latest)"
            echo "  ENVIRONMENT       Environment (default: production)"
            echo "  REGISTRY          Docker registry URL for pushing images"
            echo ""
            echo "Examples:"
            echo "  $0 dev                    Deploy development environment"
            echo "  $0 prod                   Deploy production environment"
            echo "  VERSION=v1.0.0 $0 build   Build containers with v1.0.0 tag"
            echo "  $0 logs backend           Show backend service logs"
            ;;
    esac
}

# Run main function with all arguments
main "$@"