# 🚀 BVESTER BACKEND - DOCKER CONFIGURATION
# Multi-stage build for optimized production image

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Remove development files (optional build step)
RUN rm -rf tests/ *.test.js *.spec.js

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:18-alpine AS production

# Install production dependencies and security tools
RUN apk add --no-cache \
    ca-certificates \
    tini \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S bvester -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code with proper ownership
COPY --chown=bvester:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R bvester:nodejs logs uploads temp

# Remove sensitive files
RUN rm -rf .env* *.md tests/ docker-compose* Dockerfile* .git*

# Switch to non-root user
USER bvester

# Expose port (match the port from server.js)
EXPOSE 3000

# Add comprehensive healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || \
        node -e "const http=require('http'); \
        const options = {hostname: 'localhost', port: 3000, path: '/health', timeout: 8000}; \
        const req = http.request(options, (res) => { \
            if (res.statusCode === 200) process.exit(0); else process.exit(1); \
        }); \
        req.on('error', () => process.exit(1)); \
        req.on('timeout', () => process.exit(1)); \
        req.end();"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server.js"]

# ============================================================================
# LABELS for container metadata
# ============================================================================
LABEL maintainer="Bvester Team <dev@bvester.com>"
LABEL version="1.0.0"
LABEL description="Bvester Platform Backend API - African SME Investment Platform"
LABEL com.bvester.component="backend-api"
LABEL com.bvester.build-date="${BUILD_DATE}"
LABEL com.bvester.vcs-ref="${VCS_REF}"