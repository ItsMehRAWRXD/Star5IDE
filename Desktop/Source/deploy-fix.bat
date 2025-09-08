@echo off
echo ========================================
echo    DigitalOcean Deployment Fix Script
echo ========================================
echo.

echo [1/4] Checking Git status...
git status
echo.

echo [2/4] Adding all changes...
git add .
echo.

echo [3/4] Committing fixes...
git commit -m "Fix DigitalOcean build failures: MongoDB URI, branch sync, Dockerfile dependencies"
echo.

echo [4/4] Pushing to main branch...
git push origin main
echo.

echo ========================================
echo    Deployment Fixes Applied!
echo ========================================
echo.
echo Next steps:
echo 1. Go to DigitalOcean App Platform dashboard
echo 2. Force a rebuild of your app
echo 3. Monitor the build logs for success
echo.
echo Fixed issues:
echo - MongoDB URI now includes database name
echo - Branch changed from security/cleanup to main
echo - Dockerfile now installs all dependencies
echo - Added missing environment variables
echo.
pause
