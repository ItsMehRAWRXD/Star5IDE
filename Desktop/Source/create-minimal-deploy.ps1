# PowerShell Script to Create Minimal Deployment Package
# Creates a clean, deployable version without the bloat

Write-Host "[START] Creating minimal deployment package..." -ForegroundColor Green

# Set paths
$sourcePath = "C:\Users\Garre\Desktop\Source"
$deployPath = "C:\Users\Garre\Desktop\RawrZ-Deploy"

# Create deployment directory
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force

Write-Host "[FOLDER] Created deployment directory: $deployPath" -ForegroundColor Cyan

# Essential files and folders to copy
$essentialItems = @(
    "src",
    "public", 
    "package.json",
    "Dockerfile",
    "scripts",
    "nginx",
    "DEPLOYMENT.md"
)

Write-Host "[DEBUG] Copying essential files..." -ForegroundColor Yellow

foreach ($item in $essentialItems) {
    $sourceItem = Join-Path $sourcePath $item
    $destItem = Join-Path $deployPath $item
    
    if (Test-Path $sourceItem) {
        if (Test-Path $sourceItem -PathType Container) {
            # Copy folder
            Copy-Item $sourceItem $destItem -Recurse -Force
            Write-Host "   [OK] Copied folder: $item" -ForegroundColor Green
        } else {
            # Copy file
            Copy-Item $sourceItem $destItem -Force
            Write-Host "   [OK] Copied file: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "   [WARN] Not found: $item" -ForegroundColor Yellow
    }
}

# Create a clean package.json for deployment
$cleanPackageJson = @{
    name = "rawrz-security-platform"
    version = "1.0.0"
    description = "RawrZ Advanced Security Platform - Production Build"
    main = "src/app.js"
    scripts = @{
        start = "node src/app.js"
    }
    dependencies = @{
        bcryptjs = "^2.4.3"
        compression = "^1.7.4"
        cors = "^2.8.5"
        dotenv = "^16.3.1"
        express = "^4.18.2"
        express-rate-limit = "^6.8.1"
        express-validator = "^7.0.1"
        helmet = "^7.0.0"
        jsonwebtoken = "^9.0.2"
        mongoose = "^7.5.0"
        multer = "^1.4.5-lts.1"
        nodemailer = "^6.9.4"
        serverless-http = "^3.2.0"
        sharp = "^0.32.6"
        socket.io = "^4.7.2"
        stripe = "^12.18.0"
        uuid = "^9.0.0"
        winston = "^3.10.0"
    }
}

$cleanPackageJson | ConvertTo-Json -Depth 3 | Out-File -FilePath "$deployPath\package.json" -Encoding UTF8

Write-Host "[STATUS] Deployment package created!" -ForegroundColor Green

# Show size comparison
$sourceSize = (Get-ChildItem $sourcePath -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
$deploySize = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "[CHAR][CHAR] Size comparison:" -ForegroundColor Cyan
Write-Host "   Original: $([math]::Round($sourceSize, 2)) GB" -ForegroundColor Red
Write-Host "   Deploy: $([math]::Round($deploySize, 2)) MB" -ForegroundColor Green

Write-Host "[OK] Minimal deployment package ready!" -ForegroundColor Green
Write-Host "[FOLDER] Location: $deployPath" -ForegroundColor Cyan
Write-Host "[START] Ready to zip and upload to DigitalOcean!" -ForegroundColor Green

# Wait for user input
Read-Host "Press Enter to continue..."
