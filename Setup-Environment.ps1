<#
.SYNOPSIS
  Setup the complete polymorphic encryption environment
.DESCRIPTION
  This script sets up the complete environment including:
  - Installing Send-To integration
  - Building all .NET projects
  - Setting up the web server
  - Creating necessary directories
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipSendTo,
    [switch]$SkipWebServer,
    [switch]$Force
)

Write-Host "=== Polymorphic Encryption Environment Setup ===" -ForegroundColor Cyan
Write-Host "Setting up the complete polymorphic encryption system..." -ForegroundColor Green

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Create necessary directories
$directories = @(
    "bin",
    "logs",
    "temp",
    "plugins",
    "patches"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "✓ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✓ Directory exists: $dir" -ForegroundColor Yellow
    }
}

# Build .NET projects
if (-not $SkipBuild) {
    Write-Host "`n=== Building .NET Projects ===" -ForegroundColor Cyan
    
    $projects = @(
        "PolymorphicBackend",
        "PolymorphicLoader", 
        "HotPatcher",
        "PluginSystem"
    )
    
    foreach ($project in $projects) {
        $projectPath = Join-Path $scriptDir $project
        if (Test-Path $projectPath) {
            Write-Host "Building $project..." -ForegroundColor Yellow
            Set-Location $projectPath
            
            try {
                dotnet build --configuration Release
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ $project built successfully" -ForegroundColor Green
                } else {
                    Write-Error "Failed to build $project"
                }
            } catch {
                Write-Error "Error building $project: $_"
            }
            
            Set-Location $scriptDir
        } else {
            Write-Warning "Project directory not found: $project"
        }
    }
}

# Install Send-To integration
if (-not $SkipSendTo) {
    Write-Host "`n=== Installing Send-To Integration ===" -ForegroundColor Cyan
    
    try {
        & "$scriptDir\Install-SendTo.ps1"
        Write-Host "✓ Send-To integration installed" -ForegroundColor Green
    } catch {
        Write-Error "Failed to install Send-To integration: $_"
    }
}

# Setup web server
if (-not $SkipWebServer) {
    Write-Host "`n=== Setting up Web Server ===" -ForegroundColor Cyan
    
    # Copy web frontend to backend wwwroot
    $webSource = Join-Path $scriptDir "WebFrontend"
    $webDest = Join-Path $scriptDir "PolymorphicBackend\wwwroot"
    
    if (Test-Path $webSource) {
        if (Test-Path $webDest) {
            Remove-Item -Path $webDest -Recurse -Force
        }
        Copy-Item -Path $webSource -Destination $webDest -Recurse -Force
        Write-Host "✓ Web frontend copied to backend" -ForegroundColor Green
    } else {
        Write-Warning "Web frontend directory not found: $webSource"
    }
}

# Create startup scripts
Write-Host "`n=== Creating Startup Scripts ===" -ForegroundColor Cyan

# Backend startup script
$backendStartScript = @"
@echo off
echo Starting Polymorphic Backend...
cd /d "$scriptDir\PolymorphicBackend"
dotnet run --urls "http://localhost:5000"
pause
"@

$backendStartFile = Join-Path $scriptDir "Start-Backend.bat"
Set-Content -Path $backendStartFile -Value $backendStartScript -Encoding ASCII
Write-Host "✓ Created backend startup script" -ForegroundColor Green

# Plugin system startup script
$pluginStartScript = @"
@echo off
echo Starting Plugin System...
cd /d "$scriptDir\PluginSystem"
dotnet run
pause
"@

$pluginStartFile = Join-Path $scriptDir "Start-PluginSystem.bat"
Set-Content -Path $pluginStartFile -Value $pluginStartScript -Encoding ASCII
Write-Host "✓ Created plugin system startup script" -ForegroundColor Green

# Hot patcher startup script
$patcherStartScript = @"
@echo off
echo Starting Hot Patcher...
cd /d "$scriptDir\HotPatcher"
dotnet run
pause
"@

$patcherStartFile = Join-Path $scriptDir "Start-HotPatcher.bat"
Set-Content -Path $patcherStartFile -Value $patcherStartScript -Encoding ASCII
Write-Host "✓ Created hot patcher startup script" -ForegroundColor Green

# Create README
$readmeContent = @"
# Polymorphic Encryption System

## Overview
This is a comprehensive polymorphic encryption system with dual-layer encryption, hot patching, and modular plugin architecture.

## Components

### 1. Dual-Layer Encryption (Encrypt-PolymorphicDualLayer.ps1)
- Layer 1: OpenSSL cipher (Camellia-256-CBC, AES-256-CBC, ChaCha20)
- Layer 2: Cipher-specific polymorphic keystream + evolving XOR
- Generates position-independent executables

### 2. .NET Backend (PolymorphicBackend)
- REST API for compilation and encryption services
- Web frontend integration
- Runs on http://localhost:5000

### 3. Polymorphic Loader (PolymorphicLoader)
- Self-decrypting stub with reverse PE wrapper
- Hot patching support with car() markers
- Environment capture and diagnosis

### 4. Hot Patcher (HotPatcher)
- Dynamic code patching with car() markers
- Template generation for fresh code
- Interactive command interface

### 5. Plugin System (PluginSystem)
- Modular architecture for extensibility
- Built-in encryption and loader plugins
- Dynamic plugin loading and management

## Quick Start

1. **Setup Environment**:
   ```powershell
   .\Setup-Environment.ps1
   ```

2. **Start Backend**:
   ```powershell
   .\Start-Backend.bat
   ```

3. **Access Web Interface**:
   Open http://localhost:5000 in your browser

4. **Use Send-To Integration**:
   Right-click any file → Send to → Encrypt-PolymorphicDualLayer

## Usage Examples

### Command Line
```powershell
# Encrypt a file
.\Encrypt-PolymorphicDualLayer.ps1 "C:\path\to\file.exe"

# Use plugin system
.\Start-PluginSystem.bat
# Then: encrypt aes-256-cbc "C:\path\to\file.exe"
```

### Web Interface
1. Open http://localhost:5000
2. Select cipher and polymorphic mode
3. Choose file and click "Encrypt & Download"

## Features

- ✅ Dual-layer polymorphic encryption
- ✅ Multiple cipher support (AES, Camellia, ChaCha20)
- ✅ Position-independent executables
- ✅ Hot patching with car() markers
- ✅ Reverse PE wrapper for environment capture
- ✅ Modular plugin architecture
- ✅ Web-based user interface
- ✅ Send-To integration
- ✅ Real-time compilation service

## Requirements

- Windows 10/11
- .NET 8.0 SDK
- OpenSSL
- PowerShell 5.1+
- Visual Studio Build Tools (for C compilation)

## Security Notice

This system is designed for educational and research purposes. Use responsibly and in accordance with applicable laws and regulations.
"@

$readmeFile = Join-Path $scriptDir "README.md"
Set-Content -Path $readmeFile -Value $readmeContent -Encoding UTF8
Write-Host "✓ Created README.md" -ForegroundColor Green

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run '.\Start-Backend.bat' to start the web server" -ForegroundColor White
Write-Host "2. Open http://localhost:5000 in your browser" -ForegroundColor White
Write-Host "3. Try the Send-To integration by right-clicking any file" -ForegroundColor White
Write-Host "4. Use '.\Start-PluginSystem.bat' for command-line interface" -ForegroundColor White