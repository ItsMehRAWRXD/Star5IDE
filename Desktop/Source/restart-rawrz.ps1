# RawrZ Security Platform Restart Script
# This script restarts the RawrZ Security Platform services

Write-Host "[INFO] RawrZ Security Platform Restart Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Function to check if a process is running
function Test-ProcessRunning {
    param($ProcessName)
    $process = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    return $process -ne $null
}

# Function to stop a process
function Stop-ProcessSafely {
    param($ProcessName)
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "[CHAR][CHAR] Stopping $ProcessName processes..." -ForegroundColor Yellow
            $processes | Stop-Process -Force
            Start-Sleep -Seconds 2
            Write-Host "[OK] $ProcessName stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "[CHAR][CHAR]  No $ProcessName processes found" -ForegroundColor Blue
        }
    } catch {
        Write-Host "[ERROR] Error stopping $ProcessName : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to start the application
function Start-RawrzApplication {
    Write-Host "[START] Starting RawrZ Security Platform..." -ForegroundColor Green
    
    # Check if we're in the right directory
    if (Test-Path "src/app.js") {
        Write-Host "[FOLDER] Found application files" -ForegroundColor Green
        
        # Start the application
        try {
            Write-Host "[INFO] Starting Node.js application..." -ForegroundColor Yellow
            Start-Process -FilePath "node" -ArgumentList "src/app.js" -WindowStyle Normal
            Start-Sleep -Seconds 3
            
            # Check if it started successfully
            if (Test-ProcessRunning "node") {
                Write-Host "[OK] RawrZ Security Platform started successfully!" -ForegroundColor Green
                Write-Host "[WEB] Application should be available at: http://localhost:3000" -ForegroundColor Cyan
            } else {
                Write-Host "[ERROR] Failed to start the application" -ForegroundColor Red
            }
        } catch {
            Write-Host "[ERROR] Error starting application: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Application files not found. Please run this script from the project root directory." -ForegroundColor Red
    }
}

# Main restart process
Write-Host "[INFO] Starting restart process..." -ForegroundColor Yellow

# Stop existing processes
Stop-ProcessSafely "node"
Stop-ProcessSafely "npm"

# Wait a moment
Start-Sleep -Seconds 2

# Start the application
Start-RawrzApplication

Write-Host "`n[SUCCESS] Restart process completed!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
