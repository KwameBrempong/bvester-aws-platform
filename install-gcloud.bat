@echo off
echo 🚀 Installing Google Cloud CLI for Bvester Deployment
echo =====================================================

echo.
echo 📥 Downloading Google Cloud CLI installer...
echo.

REM Download the Google Cloud CLI installer
powershell -Command "& {Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'GoogleCloudSDKInstaller.exe'}"

echo.
echo ✅ Download complete! Running installer...
echo.

REM Run the installer
start /wait GoogleCloudSDKInstaller.exe

echo.
echo 🎯 Installation complete!
echo.
echo 📋 Next steps:
echo 1. Restart your command prompt/terminal
echo 2. Run: gcloud --version
echo 3. Run: gcloud auth login
echo 4. Continue with deployment
echo.

pause