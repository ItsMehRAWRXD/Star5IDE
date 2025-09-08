# RawrZ Security Platform - Direct Droplet Deployment (Git Bypass)
param(
    [string]$DropletIP = "167.71.102.248",
    [string]$Username = "root"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAWRZ SECURITY PLATFORM - DROPLET DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Deploying directly to droplet: $DropletIP" -ForegroundColor Yellow
Write-Host ""

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
try {
    Compress-Archive -Path 'src', 'public', 'scripts', 'package*.json', 'Dockerfile*', '*.md' -DestinationPath 'rawrz-deployment-bypass.zip' -Force
    Write-Host "✅ Package created: rawrz-deployment-bypass.zip" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Uploading to droplet..." -ForegroundColor Yellow

# Upload to droplet using SCP
try {
    scp rawrz-deployment-bypass.zip ${Username}@${DropletIP}:/tmp/
    Write-Host "✅ Package uploaded to droplet" -ForegroundColor Green
} catch {
    Write-Host "❌ Error uploading: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure you have SSH access to the droplet" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Deploying on droplet..." -ForegroundColor Yellow

# Deploy on droplet
$deployCommands = @"
cd /tmp
unzip -o rawrz-deployment-bypass.zip -d /opt/rawrz/
cd /opt/rawrz/
npm install --production
pm2 stop rawrz-security-platform; if ($?) { echo "Stopped" } else { echo "Not running" }
pm2 start src/app.js --name rawrz-security-platform
pm2 save
pm2 startup
"@

try {
    ssh ${Username}@${DropletIP} $deployCommands
    Write-Host "Deployment complete!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error deploying: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 RawrZ Security Platform deployed to: http://$DropletIP" -ForegroundColor Green
Write-Host "🎯 Domain will be: https://creenpilot.dev (once DNS propagates)" -ForegroundColor Green
Write-Host ""
Write-Host "Git bypass deployment complete!" -ForegroundColor Cyan
