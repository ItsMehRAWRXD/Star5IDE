# RawrZ Security Platform - Auto Create DigitalOcean App
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAWRZ SECURITY PLATFORM - AUTO DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if doctl is installed
try {
    $doctlVersion = doctl version
    Write-Host "✅ doctl found: $doctlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ doctl not found. Please install doctl CLI first." -ForegroundColor Red
    Write-Host "Download from: https://github.com/digitalocean/doctl/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Creating RawrZ Security Platform app..." -ForegroundColor Yellow

# Create app spec file
$appSpec = @"
name: rawrz-security-platform
services:
- name: rawrz-web
  source_dir: Desktop/Source
  github:
    repo: ItsMehRAWRXD/Star5IDE
    branch: security/cleanup
  run_command: node src/app.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: JWT_SECRET
    value: rawrz-security-platform-jwt-secret-2024-production
  - key: FRONTEND_URL
    value: https://creenpilot.dev
  - key: ALLOWED_ORIGINS
    value: https://creenpilot.dev
  build_command: npm install
"@

# Write app spec to file
$appSpec | Out-File -FilePath "app-spec.yaml" -Encoding UTF8
Write-Host "✅ App spec created: app-spec.yaml" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Creating app on DigitalOcean..." -ForegroundColor Yellow

try {
    # Create the app
    $result = doctl apps create --spec app-spec.yaml --format json
    $appId = ($result | ConvertFrom-Json).app.id
    Write-Host "App created successfully!" -ForegroundColor Green
    Write-Host "App ID: $appId" -ForegroundColor Cyan
    
    # Get app URL
    Start-Sleep -Seconds 5
    $appInfo = doctl apps get $appId --format json
    $appUrl = ($appInfo | ConvertFrom-Json).app.live_url
    Write-Host "App URL: $appUrl" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "RawrZ Security Platform is deploying!" -ForegroundColor Green
    Write-Host "Monitor progress: https://cloud.digitalocean.com/apps/$appId" -ForegroundColor Cyan
    Write-Host "Live URL: $appUrl" -ForegroundColor Green
    Write-Host "Domain: https://creenpilot.dev (once DNS propagates)" -ForegroundColor Green
    
} catch {
    Write-Host "Error creating app: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure you are authenticated with doctl" -ForegroundColor Yellow
    Write-Host "Run: doctl auth init" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
