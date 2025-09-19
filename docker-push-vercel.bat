@echo off
echo Pushing Bvester Images to Docker Hub - Vercel Architecture...

REM Set your Docker Hub username (CHANGE THIS!)
set DOCKER_USER=kwamebrempong

echo.
echo ==============================================
echo Logging into Docker Hub...
echo ==============================================
docker login

echo.
echo ==============================================
echo Pushing Backend API Images...
echo ==============================================
docker push %DOCKER_USER%/bvester-backend:latest
docker push %DOCKER_USER%/bvester-backend:v2.0.0-vercel

echo.
echo ==============================================
echo Pushing Vercel-Ready Web App Images...
echo ==============================================
docker push %DOCKER_USER%/bvester-web-vercel:latest
docker push %DOCKER_USER%/bvester-web-vercel:v2.0.0

echo.
echo ==============================================
echo Pushing Development Backend Images...
echo ==============================================
docker push %DOCKER_USER%/bvester-backend-dev:latest
docker push %DOCKER_USER%/bvester-backend-dev:v2.0.0-vercel

echo.
echo ==============================================
echo All images pushed successfully!
echo ==============================================

echo.
echo ==============================================
echo CLOUD ENGINEER INSTRUCTIONS:
echo ==============================================
echo 1. Pull backend image: 
echo    docker pull %DOCKER_USER%/bvester-backend:latest
echo.
echo 2. Run with docker-compose:
echo    docker-compose -f docker-compose.vercel.yml up -d
echo.
echo 3. Frontend is auto-deployed on Vercel at:
echo    https://web-cs14pus7u-kwame-brempongs-projects.vercel.app
echo.
echo 4. Backend will be available at: http://localhost:3000
echo    Redis will be available at: http://localhost:6379
echo ==============================================

pause