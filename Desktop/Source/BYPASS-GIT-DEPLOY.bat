@echo off
echo ========================================
echo   RAWRZ SECURITY PLATFORM - GIT BYPASS
echo ========================================
echo.
echo Creating deployment package without git...
echo.

REM Create deployment package
powershell -Command "Compress-Archive -Path 'src', 'public', 'scripts', 'package*.json', 'Dockerfile*', '*.md' -DestinationPath 'rawrz-deployment-bypass.zip' -Force"

echo.
echo ✅ Deployment package created: rawrz-deployment-bypass.zip
echo.
echo 🚀 Opening DigitalOcean App Platform...
echo.
echo 📋 DEPLOYMENT INSTRUCTIONS:
echo 1. Click "Create App" 
echo 2. Choose "Upload Source Code"
echo 3. Upload: rawrz-deployment-bypass.zip
echo 4. Set Source Directory: . (root)
echo 5. Set Dockerfile Path: Dockerfile.prod
echo 6. Set Run Command: node src/app.js
echo 7. Set Port: 3000
echo 8. Deploy!
echo.
echo This bypasses git completely! 🎯
echo.

start https://cloud.digitalocean.com/apps/new

echo.
echo Press any key to continue...
pause >nul
