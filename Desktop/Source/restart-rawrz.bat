@echo off
echo [INFO] RawrZ Security Platform Restart Script
echo =========================================

echo [CHAR][CHAR] Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo [CHAR] Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo [START] Starting RawrZ Security Platform...
if exist "src\app.js" (
    echo [OK] Found application files
    start "RawrZ Security Platform" node src/app.js
    echo [OK] Application started!
    echo [WEB] Available at: http://localhost:3000
) else (
    echo [ERROR] Application files not found
    echo Please run this script from the project root directory
)

echo [SUCCESS] Restart completed!
pause
