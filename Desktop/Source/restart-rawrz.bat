@echo off
echo 🔄 RawrZ Security Platform Restart Script
echo =========================================

echo 🛑 Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo ⏳ Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo 🚀 Starting RawrZ Security Platform...
if exist "src\app.js" (
    echo ✅ Found application files
    start "RawrZ Security Platform" node src/app.js
    echo ✅ Application started!
    echo 🌐 Available at: http://localhost:3000
) else (
    echo ❌ Application files not found
    echo Please run this script from the project root directory
)

echo 🎉 Restart completed!
pause
