@echo off
echo Building Bvester Docker Images - Vercel Architecture...

REM Set your Docker Hub username (CHANGE THIS!)
set DOCKER_USER=kwamebrempong

echo.
echo ==============================================
echo Building Backend API Image...
echo ==============================================
docker build -f backend/Dockerfile -t %DOCKER_USER%/bvester-backend:latest ./backend
docker tag %DOCKER_USER%/bvester-backend:latest %DOCKER_USER%/bvester-backend:v2.0.0-vercel

echo.
echo ==============================================
echo Building Vercel-Ready Web App Image...
echo ==============================================
docker build -f Dockerfile.web.vercel -t %DOCKER_USER%/bvester-web-vercel:latest .
docker tag %DOCKER_USER%/bvester-web-vercel:latest %DOCKER_USER%/bvester-web-vercel:v2.0.0

echo.
echo ==============================================
echo Building Development Backend Image...
echo ==============================================
docker build -f backend/Dockerfile.dev -t %DOCKER_USER%/bvester-backend-dev:latest ./backend
docker tag %DOCKER_USER%/bvester-backend-dev:latest %DOCKER_USER%/bvester-backend-dev:v2.0.0-vercel

echo.
echo ==============================================
echo Images built successfully!
echo ==============================================
docker images | findstr bvester

echo.
echo ==============================================
echo DEPLOYMENT ARCHITECTURE:
echo - Frontend: Deployed to Vercel (Auto from Git)
echo - Backend: Docker containerized for cloud deployment
echo - Database: Firestore (serverless)
echo - Cache: Redis (containerized)
echo ==============================================

echo.
echo Next step: Run docker-push-vercel.bat to push to Docker Hub
pause