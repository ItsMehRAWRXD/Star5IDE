# PowerShell Script to Create 2 Essential Files for Deployment
# Just the core files needed

Write-Host "🚀 Creating 2 essential files..." -ForegroundColor Green

# Set paths
$sourcePath = "C:\Users\Garre\Desktop\Source"
$deployPath = "C:\Users\Garre\Desktop\RawrZ-2Files"

# Create deployment directory
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force

Write-Host "📁 Created: $deployPath" -ForegroundColor Cyan

# Copy only 2 essential items
$items = @("src", "package.json")

foreach ($item in $items) {
    $sourceItem = Join-Path $sourcePath $item
    $destItem = Join-Path $deployPath $item
    
    if (Test-Path $sourceItem) {
        Copy-Item $sourceItem $destItem -Recurse -Force
        Write-Host "✅ Copied: $item" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $item" -ForegroundColor Red
    }
}

# Show results
$size = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$files = (Get-ChildItem $deployPath -Recurse -File).Count

Write-Host "✅ Done!" -ForegroundColor Green
Write-Host "📊 Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green
Write-Host "📄 Files: $files" -ForegroundColor Green

Read-Host "Press Enter..."
