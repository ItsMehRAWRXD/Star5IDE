# PowerShell Script to Clean Up src Folder
# Removes bloat from src directory

Write-Host "🧹 Cleaning up src folder..." -ForegroundColor Green

# Set source path
$srcPath = "C:\Users\Garre\Desktop\Source\src"

Write-Host "📁 Cleaning: $srcPath" -ForegroundColor Cyan

# Check if src exists
if (-not (Test-Path $srcPath)) {
    Write-Host "❌ src folder not found!" -ForegroundColor Red
    exit
}

# Show current file count
$currentFiles = (Get-ChildItem $srcPath -Recurse -File).Count
Write-Host "📊 Current files in src: $currentFiles" -ForegroundColor Yellow

# Items to remove from src
$itemsToRemove = @(
    "node_modules",
    ".git",
    "*.log",
    "*.tmp",
    "*.cache",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "coverage",
    ".nyc_output",
    "*.map",
    "*.min.js",
    "*.min.css"
)

Write-Host "🗑️ Removing bloat from src..." -ForegroundColor Yellow

foreach ($item in $itemsToRemove) {
    $itemPath = Join-Path $srcPath $item
    
    if (Test-Path $itemPath) {
        Write-Host "   Removing: $item" -ForegroundColor Red
        Remove-Item $itemPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Remove any folders with thousands of files
Get-ChildItem $srcPath -Directory | ForEach-Object {
    $fileCount = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
    if ($fileCount -gt 1000) {
        Write-Host "   Removing large folder: $($_.Name) ($fileCount files)" -ForegroundColor Red
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Show results
$newFiles = (Get-ChildItem $srcPath -Recurse -File).Count
$removed = $currentFiles - $newFiles

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "📊 Files removed: $removed" -ForegroundColor Red
Write-Host "📄 Files remaining: $newFiles" -ForegroundColor Green

if ($newFiles -lt 100) {
    Write-Host "🎯 Perfect! src folder is now clean!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Still too many files. Check what's left." -ForegroundColor Yellow
}

Read-Host "Press Enter to continue..."
