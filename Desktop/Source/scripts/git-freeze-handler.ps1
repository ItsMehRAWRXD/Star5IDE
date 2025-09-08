# Simplified Git Freeze Handler - Quick recovery from frozen git commands
param(
    [string]$Command = "log --oneline -3"
)

Write-Host "🔧 Git Freeze Handler - Quick Recovery" -ForegroundColor Cyan

# Kill any hanging git processes immediately
Write-Host "  - Killing hanging git processes..." -ForegroundColor Yellow
Get-Process -Name "git" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Remove lock files
Write-Host "  - Removing git locks..." -ForegroundColor Yellow
if (Test-Path ".git\index.lock") { Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue }
if (Test-Path ".git\refs\heads\*.lock") { Remove-Item ".git\refs\heads\*.lock" -Force -ErrorAction SilentlyContinue }

# Try simple git command with timeout
Write-Host "  - Testing git with timeout..." -ForegroundColor Yellow
try {
    $job = Start-Job -ScriptBlock { param($cmd) git $cmd } -ArgumentList $Command
    $result = Wait-Job $job -Timeout 5
    
    if ($result) {
        $output = Receive-Job $job
        Remove-Job $job
        Write-Host "✅ Git working: $output" -ForegroundColor Green
    } else {
        Write-Host "⏰ Git still frozen, killing job..." -ForegroundColor Red
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "❌ Git test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get repository info without git log
Write-Host "  - Getting repository info..." -ForegroundColor Yellow
try {
    $remoteUrl = git config --get remote.origin.url 2>$null
    if ($remoteUrl) {
        Write-Host "📁 Repository: $remoteUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not get repository URL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to get repository info" -ForegroundColor Red
}

Write-Host "✅ Freeze handler completed" -ForegroundColor Green
