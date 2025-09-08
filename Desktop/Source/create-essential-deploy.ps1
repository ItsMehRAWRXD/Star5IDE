# PowerShell Script to Create Essential Deployment Package
# Only the core files needed for RawrZ Security Platform deployment

Write-Host "[START] Creating essential deployment package..." -ForegroundColor Green

# Set paths
$sourcePath = "C:\Users\Garre\Desktop\Source"
$deployPath = "C:\Users\Garre\Desktop\RawrZ-Essential"

# Create deployment directory
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force

Write-Host "[FOLDER] Created deployment directory: $deployPath" -ForegroundColor Cyan

# ESSENTIAL FILES ONLY - Core RawrZ Security Platform
$essentialItems = @(
    "src",
    "public", 
    "package.json",
    "Dockerfile"
)

Write-Host "[DEBUG] Copying essential files only..." -ForegroundColor Yellow

foreach ($item in $essentialItems) {
    $sourceItem = Join-Path $sourcePath $item
    $destItem = Join-Path $deployPath $item
    
    if (Test-Path $sourceItem) {
        if (Test-Path $sourceItem -PathType Container) {
            # Copy folder
            Copy-Item $sourceItem $destItem -Recurse -Force
            Write-Host "   [OK] Copied: $item" -ForegroundColor Green
        } else {
            # Copy file
            Copy-Item $sourceItem $destItem -Force
            Write-Host "   [OK] Copied: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "   [ERROR] Missing: $item" -ForegroundColor Red
    }
}

# Show results
$deploySize = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$fileCount = (Get-ChildItem $deployPath -Recurse -File).Count

Write-Host "[OK] Essential deployment package created!" -ForegroundColor Green
Write-Host "[FOLDER] Location: $deployPath" -ForegroundColor Cyan
Write-Host "[STATUS] Size: $([math]::Round($deploySize, 2)) MB" -ForegroundColor Green
Write-Host "[CHAR][CHAR] Files: $fileCount" -ForegroundColor Green

Write-Host "[START] Ready to zip and upload to DigitalOcean!" -ForegroundColor Green
Write-Host "[LIST] Contains only:" -ForegroundColor Yellow
Write-Host "   [CHAR] src/ (your RawrZ engines)" -ForegroundColor White
Write-Host "   [CHAR] public/ (web files)" -ForegroundColor White
Write-Host "   [CHAR] package.json (dependencies)" -ForegroundColor White
Write-Host "   [CHAR] Dockerfile (container config)" -ForegroundColor White

# Wait for user input
Read-Host "Press Enter to continue..."
