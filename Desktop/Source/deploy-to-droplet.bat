@echo off
echo ========================================
echo   Deploy to DigitalOcean Droplet
echo ========================================
echo.

echo [START] Deploying RawrZ Security Platform to droplet...
echo IP: 167.71.102.248
echo.

echo Step 1: Uploading files to droplet...
scp -r src/ public/ package.json Dockerfile.prod root@167.71.102.248:/root/rawrz/

echo Step 2: Deploying on droplet...
ssh root@167.71.102.248 "cd /root/rawrz && docker build -f Dockerfile.prod -t rawrz-platform . && docker run -d -p 3000:3000 --name rawrz-app rawrz-platform"

echo.
echo [OK] Deployment complete!
echo [WEB] Your app should be available at: http://167.71.102.248:3000
echo.
pause
