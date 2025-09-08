@echo off
echo [TARGET] RawrZ Security Platform - Creating Production Packages
echo ========================================================

REM Create packages directory
if not exist "packages" mkdir packages

REM Create Basic Security Package
echo.
echo [PACKAGE] Creating Basic Security Package...
mkdir "packages\RawrZ-Basic-Security" 2>nul
xcopy "src" "packages\RawrZ-Basic-Security\src" /E /I /Q
xcopy "public" "packages\RawrZ-Basic-Security\public" /E /I /Q
copy "config.js" "packages\RawrZ-Basic-Security\" >nul
copy "package.json" "packages\RawrZ-Basic-Security\" >nul

REM Create Basic package.json
echo {> "packages\RawrZ-Basic-Security\package.json"
echo   "name": "rawrz-basic-security",>> "packages\RawrZ-Basic-Security\package.json"
echo   "version": "1.0.0",>> "packages\RawrZ-Basic-Security\package.json"
echo   "description": "RawrZ Security Platform - Basic Security Level",>> "packages\RawrZ-Basic-Security\package.json"
echo   "main": "src/app.js",>> "packages\RawrZ-Basic-Security\package.json"
echo   "scripts": {>> "packages\RawrZ-Basic-Security\package.json"
echo     "start": "node src/app.js">> "packages\RawrZ-Basic-Security\package.json"
echo   },>> "packages\RawrZ-Basic-Security\package.json"
echo   "dependencies": {>> "packages\RawrZ-Basic-Security\package.json"
echo     "express": "^4.18.2",>> "packages\RawrZ-Basic-Security\package.json"
echo     "cors": "^2.8.5",>> "packages\RawrZ-Basic-Security\package.json"
echo     "helmet": "^7.0.0",>> "packages\RawrZ-Basic-Security\package.json"
echo     "compression": "^1.7.4",>> "packages\RawrZ-Basic-Security\package.json"
echo     "winston": "^3.10.0",>> "packages\RawrZ-Basic-Security\package.json"
echo     "dotenv": "^16.3.1">> "packages\RawrZ-Basic-Security\package.json"
echo   }>> "packages\RawrZ-Basic-Security\package.json"
echo }>> "packages\RawrZ-Basic-Security\package.json"

REM Create Enterprise Security Package
echo.
echo [PACKAGE] Creating Enterprise Security Package...
mkdir "packages\RawrZ-Enterprise-Security" 2>nul
xcopy "src" "packages\RawrZ-Enterprise-Security\src" /E /I /Q
xcopy "public" "packages\RawrZ-Enterprise-Security\public" /E /I /Q
copy "config.js" "packages\RawrZ-Enterprise-Security\" >nul
copy "package.json" "packages\RawrZ-Enterprise-Security\" >nul

REM Create deployment instructions
echo # RawrZ Security Platform - Deployment Instructions> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo.>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo ## Quick Deploy:>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo 1. Upload this package to your server>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo 2. Run: npm install>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo 3. Run: npm start>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo 4. Access: http://localhost:8088>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo.>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo ## Environment Variables:>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo - PORT=8088>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo - NODE_ENV=production>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo - MONGODB_URI=your_mongodb_connection_string>> "packages\RawrZ-Basic-Security\DEPLOY.md"
echo - JWT_SECRET=your_jwt_secret>> "packages\RawrZ-Basic-Security\DEPLOY.md"

echo # RawrZ Security Platform - Enterprise Deployment Instructions> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo.>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo ## Full Enterprise Features:>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - All 17+ API endpoints>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Advanced encryption algorithms>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Anti-analysis protection>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Memory optimization>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Polymorphic code generation>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Digital forensics tools>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Malware analysis>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Network analysis>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Mobile security tools>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Real-time communication>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Payment processing>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo - Email services>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo.>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo ## Quick Deploy:>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo 1. Upload this package to your server>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo 2. Run: npm install>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo 3. Run: npm start>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"
echo 4. Access: http://localhost:8088>> "packages\RawrZ-Enterprise-Security\DEPLOY.md"

echo.
echo [SUCCESS] Production packages created successfully!
echo [FOLDER] Check the 'packages' directory for your deployment folders
echo.
echo [LIST] Available packages:
dir packages /B
echo.
echo [READY] Ready for deployment!
pause
