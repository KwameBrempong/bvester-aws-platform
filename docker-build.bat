@echo off
echo Building Bvester Docker Images...

REM Set your Docker Hub username (CHANGE THIS!)
set DOCKER_USER=kwamebrempong

echo.
echo ==============================================
echo Building Backend Image...
echo ==============================================
docker build -f backend/Dockerfile -t %DOCKER_USER%/bvester-backend:latest ./backend
docker tag %DOCKER_USER%/bvester-backend:latest %DOCKER_USER%/bvester-backend:v1.0.0

echo.
echo ==============================================
echo Building Web App Image...
echo ==============================================
docker build -f Dockerfile.web -t %DOCKER_USER%/bvester-web:latest .
docker tag %DOCKER_USER%/bvester-web:latest %DOCKER_USER%/bvester-web:v1.0.0

echo.
echo ==============================================
echo Building Development Backend Image...
echo ==============================================
docker build -f backend/Dockerfile.dev -t %DOCKER_USER%/bvester-backend-dev:latest ./backend
docker tag %DOCKER_USER%/bvester-backend-dev:latest %DOCKER_USER%/bvester-backend-dev:v1.0.0

echo.
echo ==============================================
echo Building Development Web Image...
echo ==============================================
docker build -f Dockerfile.web.dev -t %DOCKER_USER%/bvester-web-dev:latest .
docker tag %DOCKER_USER%/bvester-web-dev:latest %DOCKER_USER%/bvester-web-dev:v1.0.0

echo.
echo ==============================================
echo Images built successfully!
echo ==============================================
docker images | findstr bvester

echo.
echo Next step: Run docker-push.bat to push to Docker Hub
pause