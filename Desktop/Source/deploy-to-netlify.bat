@echo off
echo ========================================
echo    Netlify Deployment Script
echo ========================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [3/5] Checking Netlify CLI...
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Netlify CLI globally...
    call npm install -g netlify-cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Netlify CLI
        pause
        exit /b 1
    )
)
echo ✓ Netlify CLI is available

echo.
echo [4/5] Testing local build...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Build successful

echo.
echo [5/5] Ready for deployment!
echo.
echo Next steps:
echo 1. Run: netlify login
echo 2. Run: netlify init
echo 3. Run: netlify deploy --prod
echo.
echo Or deploy via Git:
echo 1. Push to GitHub/GitLab
echo 2. Connect repository in Netlify dashboard
echo 3. Set build settings and deploy
echo.
echo See NETLIFY_DEPLOYMENT.md for detailed instructions
echo.
pause
