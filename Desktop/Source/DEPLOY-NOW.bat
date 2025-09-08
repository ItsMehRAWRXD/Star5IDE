@echo off
echo ========================================
echo   RawrZ Security Platform Deployment
echo ========================================
echo.

echo Step 1: Creating deployment package...
powershell -Command "Compress-Archive -Path 'src', 'public', 'package.json', 'Dockerfile', 'Dockerfile.prod' -DestinationPath 'rawrz-deployment.zip' -Force"
echo [OK] Deployment package created: rawrz-deployment.zip

echo.
echo Step 2: Deployment Options:
echo.
echo Option A: Upload to DigitalOcean App Platform
echo   1. Go to: https://cloud.digitalocean.com/apps
echo   2. Click "Create App"
echo   3. Choose "Upload Source Code"
echo   4. Upload: rawrz-deployment.zip
echo   5. Use Dockerfile.prod
echo.
echo Option B: Deploy to existing droplet
echo   1. Use SCP to upload files to 167.71.102.248
echo   2. SSH into droplet and run docker-compose
echo.
echo Option C: Use existing lionfish app
echo   1. Go to: https://cloud.digitalocean.com/apps/60e7a755-da24-45f0-9f71-01bc5144d6e7
echo   2. Update source code
echo.

echo [RECOMMENDED] Option A - Create new app
echo.
echo Press any key to open DigitalOcean...
pause >nul
start https://cloud.digitalocean.com/apps
