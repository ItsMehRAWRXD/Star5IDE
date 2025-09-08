# RawrZ Security Platform - Production Package Creator
# Creates clean deployment packages for different security levels

Write-Host "[TARGET] RawrZ Security Platform - Production Package Creator" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Define security levels and their components
$securityLevels = @{
    "basic" = @{
        "name" = "RawrZ-Basic-Security"
        "components" = @("express", "cors", "helmet", "compression", "winston", "dotenv")
        "features" = @("Basic encryption", "CORS protection", "Compression", "Logging")
    }
    "standard" = @{
        "name" = "RawrZ-Standard-Security" 
        "components" = @("express", "cors", "helmet", "compression", "winston", "dotenv", "express-rate-limit", "bcryptjs", "jsonwebtoken")
        "features" = @("Basic encryption", "CORS protection", "Compression", "Logging", "Rate limiting", "Authentication", "Password hashing")
    }
    "advanced" = @{
        "name" = "RawrZ-Advanced-Security"
        "components" = @("express", "cors", "helmet", "compression", "winston", "dotenv", "express-rate-limit", "bcryptjs", "jsonwebtoken", "mongoose", "multer", "sharp")
        "features" = @("All standard features", "Database integration", "File processing", "Image processing", "Advanced logging")
    }
    "enterprise" = @{
        "name" = "RawrZ-Enterprise-Security"
        "components" = @("express", "cors", "helmet", "compression", "winston", "dotenv", "express-rate-limit", "bcryptjs", "jsonwebtoken", "mongoose", "multer", "sharp", "socket.io", "stripe", "nodemailer", "uuid")
        "features" = @("All advanced features", "Real-time communication", "Payment processing", "Email services", "UUID generation", "Full RawrZ Engine")
    }
}

# Core files needed for all packages
$coreFiles = @(
    "src/app.js",
    "src/engines/rawrz-engine.js", 
    "src/utils/logger.js",
    "src/middleware/",
    "src/routes/",
    "src/controllers/",
    "src/models/",
    "src/services/",
    "public/advanced-ui.html",
    "config.js",
    "package.json"
)

# Create packages for each security level
foreach ($level in $securityLevels.Keys) {
    $config = $securityLevels[$level]
    $packageName = $config.name
    $packageDir = "packages/$packageName"
    
    Write-Host "`n[DEBUG] Creating $packageName package..." -ForegroundColor Yellow
    
    # Create package directory
    if (Test-Path $packageDir) {
        Remove-Item $packageDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $packageDir -Force | Out-Null
    
    # Copy core files
    foreach ($file in $coreFiles) {
        if (Test-Path $file) {
            $destPath = Join-Path $packageDir $file
            $destDir = Split-Path $destPath -Parent
            if (!(Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $file $destPath -Recurse -Force
            Write-Host "  [OK] Copied $file" -ForegroundColor Green
        }
    }
    
    # Create package.json for this security level
    $packageJson = @{
        name = $packageName.ToLower()
        version = "1.0.0"
        description = "RawrZ Security Platform - $level Security Level"
        main = "src/app.js"
        scripts = @{
            start = "node src/app.js"
        }
        dependencies = @{}
    }
    
    # Add only required dependencies for this security level
    foreach ($component in $config.components) {
        $packageJson.dependencies[$component] = "latest"
    }
    
    $packageJsonPath = Join-Path $packageDir "package.json"
    $packageJson | ConvertTo-Json -Depth 3 | Set-Content $packageJsonPath
    
    # Create deployment instructions
    $deployInstructions = @"
# $packageName - Deployment Instructions

## Security Level: $level
## Features Included:
$(($config.features | ForEach-Object { "- $_" }) -join "`n")

## Quick Deploy:
1. Upload this package to your server
2. Run: npm install
3. Run: npm start
4. Access: http://localhost:8088

## Environment Variables:
- PORT=8088
- NODE_ENV=production
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret

## Security Features:
$(($config.features | ForEach-Object { "- $_" }) -join "`n")

## API Endpoints:
- GET /health - Health check
- GET /api - API status
- POST /api/engine/encrypt - Encryption
- POST /api/engine/compress - Compression
- POST /api/engine/stealth - Stealth mode
- And 15+ more advanced endpoints

Ready for production deployment!
"@
    
    $instructionsPath = Join-Path $packageDir "DEPLOYMENT.md"
    $deployInstructions | Set-Content $instructionsPath
    
    # Create zip package
    $zipPath = "packages/$packageName.zip"
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path "$packageDir/*" -DestinationPath $zipPath -Force
    Write-Host "  [DEBUG] Created $zipPath" -ForegroundColor Cyan
    
    # Clean up temp directory
    Remove-Item $packageDir -Recurse -Force
}

Write-Host "`n[SUCCESS] Production packages created successfully!" -ForegroundColor Green
Write-Host "[FOLDER] Check the 'packages' directory for your deployment zips" -ForegroundColor Yellow

# List created packages
Write-Host "`n[LIST] Available packages:" -ForegroundColor Cyan
Get-ChildItem "packages/*.zip" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  [DEBUG] $($_.Name) - $size MB" -ForegroundColor White
}

Write-Host "`n[START] Ready for deployment!" -ForegroundColor Green
