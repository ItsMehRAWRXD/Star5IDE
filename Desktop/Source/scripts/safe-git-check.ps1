# Safe Git Check Script - Prevents freezing with timeout and retry logic
param(
    [string]$Command = "log --oneline -5",
    [int]$TimeoutSeconds = 8,
    [int]$MaxRetries = 3,
    [switch]$AutoRecover = $true
)

function Invoke-SafeGitCommand {
    param(
        [string]$GitCommand,
        [int]$TimeoutSec,
        [int]$Retries,
        [bool]$AutoRecover
    )
    
    $attempt = 1
    $success = $false
    $freezeCount = 0
    
    while ($attempt -le $Retries -and -not $success) {
        Write-Host "Attempt $attempt of $Retries - Running: git $GitCommand" -ForegroundColor Yellow
        
        try {
            # Use Start-Process with timeout to prevent hanging
            $processInfo = New-Object System.Diagnostics.ProcessStartInfo
            $processInfo.FileName = "git"
            $processInfo.Arguments = $GitCommand
            $processInfo.RedirectStandardOutput = $true
            $processInfo.RedirectStandardError = $true
            $processInfo.UseShellExecute = $false
            $processInfo.CreateNoWindow = $true
            
            $process = New-Object System.Diagnostics.Process
            $process.StartInfo = $processInfo
            
            # Start the process
            $process.Start() | Out-Null
            
            # Wait for completion with timeout
            $completed = $process.WaitForExit($TimeoutSec * 1000)
            
            if ($completed) {
                $output = $process.StandardOutput.ReadToEnd()
                $error = $process.StandardError.ReadToEnd()
                
                if ($process.ExitCode -eq 0) {
                    Write-Host "✅ Git command completed successfully" -ForegroundColor Green
                    Write-Host $output
                    $success = $true
                } else {
                    Write-Host "❌ Git command failed with exit code: $($process.ExitCode)" -ForegroundColor Red
                    Write-Host "Error: $error" -ForegroundColor Red
                }
            } else {
                $freezeCount++
                Write-Host "⏰ Git command timed out after $TimeoutSec seconds (Freeze #$freezeCount)" -ForegroundColor Red
                
                # Force kill the process
                try {
                    $process.Kill($true)
                    Start-Sleep -Milliseconds 500
                    if (!$process.HasExited) {
                        $process.Kill($true)
                    }
                } catch {
                    Write-Host "⚠️ Process already terminated" -ForegroundColor Yellow
                }
                
                # Auto-recovery actions after 2 freezes
                if ($AutoRecover -and $freezeCount -ge 2) {
                    Write-Host "🔧 Auto-recovery triggered after $freezeCount freezes" -ForegroundColor Cyan
                    Invoke-GitRecoveryActions
                }
            }
            
            $process.Close()
            
        } catch {
            Write-Host "❌ Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        if (-not $success -and $attempt -lt $Retries) {
            $waitTime = if ($freezeCount -ge 2) { 5 } else { 2 }
            Write-Host "⏳ Waiting $waitTime seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds $waitTime
        }
        
        $attempt++
    }
    
    if (-not $success) {
        Write-Host "❌ All attempts failed. Git command may be hanging or repository corrupted." -ForegroundColor Red
        if ($AutoRecover) {
            Write-Host "🔧 Attempting final recovery actions..." -ForegroundColor Cyan
            Invoke-GitRecoveryActions
        }
        return $false
    }
    
    return $true
}

function Invoke-GitRecoveryActions {
    Write-Host "🔄 Performing Git recovery actions..." -ForegroundColor Cyan
    
    try {
        # Kill any hanging git processes
        Write-Host "  - Killing hanging git processes..." -ForegroundColor Yellow
        Get-Process -Name "git" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        
        # Clear git index lock if it exists
        Write-Host "  - Checking for git lock files..." -ForegroundColor Yellow
        $lockFile = ".git\index.lock"
        if (Test-Path $lockFile) {
            Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
            Write-Host "  - Removed git index lock" -ForegroundColor Green
        }
        
        # Try to refresh git status
        Write-Host "  - Refreshing git status..." -ForegroundColor Yellow
        $refreshResult = git status --porcelain 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  - Git status refreshed successfully" -ForegroundColor Green
        } else {
            Write-Host "  - Git status refresh failed" -ForegroundColor Red
        }
        
        # Clear any git cache issues
        Write-Host "  - Clearing git cache..." -ForegroundColor Yellow
        git gc --prune=now 2>$null | Out-Null
        
        Write-Host "✅ Recovery actions completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Recovery actions failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
Write-Host "🔍 Safe Git Check - Preventing Freezes" -ForegroundColor Cyan
Write-Host "Command: git $Command" -ForegroundColor White
Write-Host "Timeout: $TimeoutSeconds seconds" -ForegroundColor White
Write-Host "Max Retries: $MaxRetries" -ForegroundColor White
Write-Host ""

$result = Invoke-SafeGitCommand -GitCommand $Command -TimeoutSec $TimeoutSeconds -Retries $MaxRetries -AutoRecover $AutoRecover

if ($result) {
    Write-Host ""
    Write-Host "✅ Git check completed successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Git check failed after all retries" -ForegroundColor Red
    exit 1
}
