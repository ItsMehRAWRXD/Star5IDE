<#
.SYNOPSIS
  Start the polymorphic encryption server with all components
#>

Write-Host "=== Starting Polymorphic Rig Server ===" -ForegroundColor Green

# Check dependencies
$deps = @{
    "node" = "Node.js is required for the web server"
    "dotnet" = ".NET SDK is required for compilation"
    "openssl" = "OpenSSL is required for encryption"
}

foreach ($dep in $deps.Keys) {
    try {
        & $dep --version | Out-Null
        Write-Host "✓ $dep found" -ForegroundColor Green
    } catch {
        Write-Host "✗ $dep not found - $($deps[$dep])" -ForegroundColor Red
        exit 1
    }
}

# Start .NET backend
Write-Host "Starting .NET backend..." -ForegroundColor Yellow
$dotnetJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd DotNetBackend
    dotnet run --urls "http://localhost:5000"
}

# Start Node.js server
Write-Host "Starting Node.js server..." -ForegroundColor Yellow
$nodeJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd server
    node encrypt_server.js
}

Write-Host "Servers starting..." -ForegroundColor Gray
Start-Sleep 3

# Check if servers are running
try {
    $nodeHealth = Invoke-RestMethod "http://localhost:8088/health" -ErrorAction Stop
    Write-Host "✓ Node.js server running on http://localhost:8088" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js server failed to start" -ForegroundColor Red
}

try {
    $dotnetHealth = Invoke-RestMethod "http://localhost:5000/health" -ErrorAction SilentlyContinue
    Write-Host "✓ .NET backend running on http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠ .NET backend may not be ready yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Polymorphic Rig Server Ready ===" -ForegroundColor Green
Write-Host "Web Interface: http://localhost:8088" -ForegroundColor Cyan
Write-Host ".NET Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep 1
    }
} finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $nodeJob, $dotnetJob -ErrorAction SilentlyContinue
    Remove-Job $nodeJob, $dotnetJob -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}