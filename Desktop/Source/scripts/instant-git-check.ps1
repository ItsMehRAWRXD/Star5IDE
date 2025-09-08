# Instant Git Check - If not instant, it's frozen
param(
    [string]$Command = "config --get remote.origin.url"
)

Write-Host "[CHAR] Instant Git Check - Zero Tolerance for Freezes" -ForegroundColor Cyan

# Kill all git processes first
Get-Process -Name "git" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove all possible lock files
$lockFiles = @(
    ".git\index.lock",
    ".git\refs\heads\*.lock",
    ".git\config.lock"
)

foreach ($lock in $lockFiles) {
    if (Test-Path $lock) {
        Remove-Item $lock -Force -ErrorAction SilentlyContinue
        Write-Host "  - Removed: $lock" -ForegroundColor Yellow
    }
}

# Try git command with 1 second timeout - if it takes longer, it's frozen
Write-Host "  - Testing git command (1 second max)..." -ForegroundColor Yellow

try {
    $process = Start-Process -FilePath "git" -ArgumentList $Command -RedirectStandardOutput -RedirectStandardError -NoNewWindow -PassThru
    
    # Wait maximum 1 second
    $completed = $process.WaitForExit(1000)
    
    if ($completed) {
        $output = $process.StandardOutput.ReadToEnd()
        $error = $process.StandardError.ReadToEnd()
        
        if ($process.ExitCode -eq 0) {
            Write-Host "[OK] Git responded instantly: $output" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Git failed: $error" -ForegroundColor Red
        }
    } else {
        Write-Host "[CHAR] Git frozen (took >1 second) - killing immediately" -ForegroundColor Red
        $process.Kill($true)
    }
    
    $process.Close()
    
} catch {
    Write-Host "[ERROR] Git command failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Alternative: Read git config directly from file
Write-Host "  - Reading git config directly from file..." -ForegroundColor Yellow
try {
    $configPath = ".git\config"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw
        if ($config -match 'url = (.+)') {
            $repoUrl = $matches[1]
            Write-Host "[FOLDER] Repository URL: $repoUrl" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "[ERROR] Could not read git config file" -ForegroundColor Red
}

Write-Host "[OK] Instant check completed" -ForegroundColor Green
