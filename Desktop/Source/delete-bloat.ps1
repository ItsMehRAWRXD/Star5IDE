# PowerShell Script to Delete Bloated Folders
# Removes the massive folders causing 65,000 files

Write-Host "[CHAR][CHAR][CHAR] Deleting bloated folders..." -ForegroundColor Red

# Set source path
$sourcePath = "C:\Users\Garre\Desktop\Source"

# Folders to delete (the massive ones)
$foldersToDelete = @(
    "rawraw-site",
    "RawrZ_Dev", 
    "netlify-backup"
)

Write-Host "[FOLDER] Source path: $sourcePath" -ForegroundColor Cyan

foreach ($folder in $foldersToDelete) {
    $folderPath = Join-Path $sourcePath $folder
    
    if (Test-Path $folderPath) {
        # Count files before deletion
        $fileCount = (Get-ChildItem $folderPath -Recurse -File -ErrorAction SilentlyContinue).Count
        Write-Host "[CHAR][CHAR][CHAR] Deleting: $folder ($fileCount files)" -ForegroundColor Red
        
        # Delete the folder
        Remove-Item $folderPath -Recurse -Force -ErrorAction SilentlyContinue
        
        if (-not (Test-Path $folderPath)) {
            Write-Host "   [OK] Deleted successfully!" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Failed to delete!" -ForegroundColor Red
        }
    } else {
        Write-Host "   [WARN] Not found: $folder" -ForegroundColor Yellow
    }
}

# Show final results
Write-Host "[STATUS] Final file count:" -ForegroundColor Cyan
$totalFiles = (Get-ChildItem $sourcePath -Recurse -File).Count
$totalSize = (Get-ChildItem $sourcePath -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Host "   Files: $totalFiles" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($totalSize, 2)) GB" -ForegroundColor Green

if ($totalFiles -lt 100) {
    Write-Host "[TARGET] Perfect! Project is now clean and ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Still some files remaining, but much better!" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue..."
