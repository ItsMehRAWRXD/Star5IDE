# RawrZ Security Platform - Direct Upload (No GitHub)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAWRZ SECURITY PLATFORM - DIRECT UPLOAD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Create deployment package
try {
    Compress-Archive -Path 'src', 'public', 'scripts', 'package*.json', 'Dockerfile*', '*.md' -DestinationPath 'rawrz-direct-upload.zip' -Force
    Write-Host "Package created: rawrz-direct-upload.zip" -ForegroundColor Green
} catch {
    Write-Host "Error creating package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Opening DigitalOcean App Platform..." -ForegroundColor Yellow
Write-Host ""
Write-Host "DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Click 'Create App'" -ForegroundColor White
Write-Host "2. Choose 'Upload Source Code'" -ForegroundColor White
Write-Host "3. Upload: rawrz-direct-upload.zip" -ForegroundColor White
Write-Host "4. Set Source Directory: . (root)" -ForegroundColor White
Write-Host "5. Set Run Command: node src/app.js" -ForegroundColor White
Write-Host "6. Set Port: 3000" -ForegroundColor White
Write-Host "7. Add Environment Variables:" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - PORT=3000" -ForegroundColor Gray
Write-Host "   - JWT_SECRET=rawrz-security-platform-jwt-secret-2024-production" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL=https://creenpilot.dev" -ForegroundColor Gray
Write-Host "   - ALLOWED_ORIGINS=https://creenpilot.dev" -ForegroundColor Gray
Write-Host "8. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "This completely bypasses GitHub!" -ForegroundColor Green
Write-Host ""

# Open DigitalOcean
Start-Process "https://cloud.digitalocean.com/apps/new"

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
