# Fix branch structure - move files from Desktop/Source to root
Write-Host "[CHAR][CHAR] Fixing branch structure..." -ForegroundColor Yellow

# Check if we're in the right directory
if (Test-Path "Desktop/Source") {
    Write-Host "[FOLDER] Found Desktop/Source folder" -ForegroundColor Green
    
    # Move all files from Desktop/Source to current directory
    Write-Host "[INFO] Moving files to root..." -ForegroundColor Yellow
    
    # Get all items in Desktop/Source
    $items = Get-ChildItem -Path "Desktop/Source" -Force
    
    foreach ($item in $items) {
        $destination = Join-Path $PWD $item.Name
        if (Test-Path $destination) {
            Write-Host "[WARN]  $($item.Name) already exists, skipping..." -ForegroundColor Yellow
        } else {
            Move-Item -Path $item.FullName -Destination $destination
            Write-Host "[OK] Moved $($item.Name)" -ForegroundColor Green
        }
    }
    
    Write-Host "[SUCCESS] Files moved to root successfully!" -ForegroundColor Green
    Write-Host "[LIST] Next steps:" -ForegroundColor Cyan
    Write-Host "1. git add ." -ForegroundColor White
    Write-Host "2. git commit -m 'Move files to root for deployment'" -ForegroundColor White
    Write-Host "3. git push origin security/cleanup" -ForegroundColor White
    Write-Host "4. Redeploy on DigitalOcean" -ForegroundColor White
    
} else {
    Write-Host "[ERROR] Desktop/Source folder not found" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Gray
    Write-Host "Available folders:" -ForegroundColor Gray
    Get-ChildItem -Directory | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
}
