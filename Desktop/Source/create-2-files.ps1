# PowerShell Script to Create 2 Essential Files for Deployment
# Just the core files needed

Write-Host "[START] Creating 2 essential files..." -ForegroundColor Green

# Set paths
$sourcePath = "C:\Users\Garre\Desktop\Source"
$deployPath = "C:\Users\Garre\Desktop\RawrZ-2Files"

# Create deployment directory
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force

Write-Host "[FOLDER] Created: $deployPath" -ForegroundColor Cyan

# Copy only 2 essential items
$items = @("src", "package.json")

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

Write-Host "[OK] Done!" -ForegroundColor Green
Write-Host "[STATUS] Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green
Write-Host "[CHAR][CHAR] Files: $files" -ForegroundColor Green

Read-Host "Press Enter..."
