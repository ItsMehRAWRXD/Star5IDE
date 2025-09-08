# PowerShell Script to Create Clean Deployment Package
# Excludes .netlify and other bloat

Write-Host "[START] Creating clean deployment package..." -ForegroundColor Green

# Set paths
$sourcePath = "C:\Users\Garre\Desktop\Source"
$deployPath = "C:\Users\Garre\Desktop\RawrZ-Clean"

# Create deployment directory
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force

Write-Host "[FOLDER] Created: $deployPath" -ForegroundColor Cyan

# Copy essential items, excluding bloat
$items = @("src", "public", "package.json", "Dockerfile", ".github")

foreach ($item in $items) {
    $sourceItem = Join-Path $sourcePath $item
    $destItem = Join-Path $deployPath $item
    
    if (Test-Path $sourceItem) {
        Copy-Item $sourceItem $destItem -Recurse -Force
        Write-Host "[OK] Copied: $item" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Missing: $item" -ForegroundColor Red
    }
}

# Show results
$size = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$files = (Get-ChildItem $deployPath -Recurse -File).Count

Write-Host "[OK] Clean deployment created!" -ForegroundColor Green
Write-Host "[STATUS] Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green
Write-Host "[CHAR][CHAR] Files: $files" -ForegroundColor Green
Write-Host "[CHAR][CHAR] Excluded: .netlify (54,000 files!)" -ForegroundColor Red

Read-Host "Press Enter..."
