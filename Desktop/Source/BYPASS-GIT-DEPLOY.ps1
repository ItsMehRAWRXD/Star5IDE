# RawrZ Security Platform - Git Bypass Deployment
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAWRZ SECURITY PLATFORM - GIT BYPASS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating deployment package without git..." -ForegroundColor Yellow
Write-Host ""

# Create deployment package
try {
    Compress-Archive -Path 'src', 'public', 'scripts', 'package*.json', 'Dockerfile*', '*.md' -DestinationPath 'rawrz-deployment-bypass.zip' -Force
    Write-Host "✅ Deployment package created: rawrz-deployment-bypass.zip" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Opening DigitalOcean App Platform..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Click 'Create App'" -ForegroundColor White
Write-Host "2. Choose 'Upload Source Code'" -ForegroundColor White
Write-Host "3. Upload: rawrz-deployment-bypass.zip" -ForegroundColor White
Write-Host "4. Set Source Directory: . (root)" -ForegroundColor White
Write-Host "5. Set Dockerfile Path: Dockerfile.prod" -ForegroundColor White
Write-Host "6. Set Run Command: node src/app.js" -ForegroundColor White
Write-Host "7. Set Port: 3000" -ForegroundColor White
Write-Host "8. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "This bypasses git completely! 🎯" -ForegroundColor Green
Write-Host ""

# Open DigitalOcean
Start-Process "https://cloud.digitalocean.com/apps/new"

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
