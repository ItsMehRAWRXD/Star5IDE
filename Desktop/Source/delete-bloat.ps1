# PowerShell Script to Delete Bloated Folders
# Removes the massive folders causing 65,000 files

Write-Host "🗑️ Deleting bloated folders..." -ForegroundColor Red

# Set source path
$sourcePath = "C:\Users\Garre\Desktop\Source"

# Folders to delete (the massive ones)
$foldersToDelete = @(
    "rawraw-site",
    "RawrZ_Dev", 
    "netlify-backup"
)

Write-Host "📁 Source path: $sourcePath" -ForegroundColor Cyan

foreach ($folder in $foldersToDelete) {
    $folderPath = Join-Path $sourcePath $folder
    
    if (Test-Path $folderPath) {
        # Count files before deletion
        $fileCount = (Get-ChildItem $folderPath -Recurse -File -ErrorAction SilentlyContinue).Count
        Write-Host "🗑️ Deleting: $folder ($fileCount files)" -ForegroundColor Red
        
        # Delete the folder
        Remove-Item $folderPath -Recurse -Force -ErrorAction SilentlyContinue
        
        if (-not (Test-Path $folderPath)) {
            Write-Host "   ✅ Deleted successfully!" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to delete!" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⚠️ Not found: $folder" -ForegroundColor Yellow
    }
}

# Show final results
Write-Host "📊 Final file count:" -ForegroundColor Cyan
$totalFiles = (Get-ChildItem $sourcePath -Recurse -File).Count
$totalSize = (Get-ChildItem $sourcePath -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Host "   Files: $totalFiles" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($totalSize, 2)) GB" -ForegroundColor Green

if ($totalFiles -lt 100) {
    Write-Host "🎯 Perfect! Project is now clean and ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Still some files remaining, but much better!" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue..."
