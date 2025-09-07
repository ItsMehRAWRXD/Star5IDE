<#
.SYNOPSIS
  Build script for the Polymorphic Rig toolkit
.DESCRIPTION
  Compiles all components and creates the plugin architecture
#>

Write-Host "=== Building Polymorphic Rig Toolkit ===" -ForegroundColor Green

# Create directories
$dirs = @("bin", "plugins", "tools", "output")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

# Build main CLI
Write-Host "Building main CLI..." -ForegroundColor Yellow
try {
    dotnet build PolymorphicRig.csproj -c Release -o bin
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Main CLI built successfully" -ForegroundColor Green
    } else {
        throw "Build failed"
    }
} catch {
    Write-Host "✗ Main CLI build failed: $_" -ForegroundColor Red
}

# Build .NET backend
Write-Host "Building .NET backend..." -ForegroundColor Yellow
try {
    dotnet build DotNetBackend/DotNetBackend.csproj -c Release -o bin/backend
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ .NET backend built successfully" -ForegroundColor Green
    } else {
        throw "Build failed"
    }
} catch {
    Write-Host "✗ .NET backend build failed: $_" -ForegroundColor Red
}

# Build plugins
Write-Host "Building plugins..." -ForegroundColor Yellow
try {
    # Create plugin project file
    $pluginProj = @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <OutputType>Library</OutputType>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="../Plugins/*.cs" />
  </ItemGroup>
</Project>
"@
    
    $pluginProj | Set-Content "plugins/Plugins.csproj" -Encoding UTF8
    
    dotnet build plugins/Plugins.csproj -c Release -o plugins
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Plugins built successfully" -ForegroundColor Green
    } else {
        throw "Build failed"
    }
} catch {
    Write-Host "✗ Plugin build failed: $_" -ForegroundColor Red
}

# Copy PowerShell tools
Write-Host "Copying PowerShell tools..." -ForegroundColor Yellow
$psTools = @(
    "Encrypt-PolymorphicDualLayer.ps1",
    "Install-SendTo.ps1",
    "Tools/BinToCs.ps1"
)

foreach ($tool in $psTools) {
    if (Test-Path $tool) {
        Copy-Item $tool "bin/" -Force
        Write-Host "✓ Copied $tool" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing $tool" -ForegroundColor Red
    }
}

# Create launcher script
$launcher = @"
@echo off
cd /d "%~dp0"
if "%1"=="" (
    echo Polymorphic Rig Toolkit
    echo.
    echo Usage: rig ^<command^> [options]
    echo.
    echo Available commands:
    echo   list                  List plugins
    echo   polymorphicloader     Run polymorphic loader
    echo   hotpatcher           Run hot patcher
    echo   interactive          Interactive mode
    echo.
    echo Examples:
    echo   rig list
    echo   rig polymorphicloader --payload payload.bin
    echo   rig interactive
    pause
    exit /b
)
rig.exe %*
"@

$launcher | Set-Content "bin/rig.bat" -Encoding ASCII

# Create readme
$readme = @"
# Polymorphic Rig Toolkit

Advanced polymorphic encryption and hot patching toolkit with dual-layer encryption.

## Components

1. **PowerShell Encryptor** - Dual-layer polymorphic encryption with drag-and-drop support
2. **.NET Backend** - Compiles C# to executable with polymorphic wrapping
3. **Plugin System** - Modular architecture with hot patcher and loader plugins
4. **Web Interface** - Browser-based encryption/decryption panel

## Quick Start

### PowerShell Encryptor
```powershell
.\Encrypt-PolymorphicDualLayer.ps1 file.exe
```

### CLI Tool
```cmd
rig list
rig polymorphicloader --payload payload.bin --reverse-wrapper
rig hotpatcher --template advanced
```

### Web Interface
```cmd
cd server
node encrypt_server.js
```
Then open http://localhost:8088

## Features

- **Dual-Layer Encryption**: OpenSSL cipher + polymorphic keystream
- **Hot Patching**: Runtime code modification with car() markers  
- **Reverse PE Wrapper**: Environment diagnostics and analysis
- **Plugin Architecture**: Extensible modular system
- **Cross-Platform**: Works on Windows, Linux, macOS

## Installation

1. Install dependencies:
   - .NET 8.0 SDK
   - Node.js 18+
   - OpenSSL
   - PowerShell 7+

2. Build the toolkit:
   ```powershell
   .\build.ps1
   ```

3. Install Send-To integration (Windows):
   ```powershell
   .\Install-SendTo.ps1
   ```

## Usage Examples

### Generate Polymorphic EXE
```powershell
# Drag and drop any file onto Encrypt-PolymorphicDualLayer.ps1
# Or run directly:
.\Encrypt-PolymorphicDualLayer.ps1 payload.bin
```

### Convert Binary to C# Source
```powershell
.\Tools\BinToCs.ps1 -InputFile payload.bin -OutputFile EmbeddedPayload.cs
```

### Interactive Plugin Management
```cmd
rig interactive
rig> list
rig> polymorphicloader --payload test.bin --hot-patcher
rig> hotpatcher --template car --target loader.exe
```

## Architecture

- **Polymorphic Loader**: Decrypts and executes payloads with reverse PE wrapping
- **Hot Patcher**: Generates fresh templates and applies runtime patches
- **CLI Manager**: Plugin management and execution interface
- **Web Backend**: HTTP API for encryption/compilation services

Built with security research and penetration testing in mind.
"@

$readme | Set-Content "bin/README.md" -Encoding UTF8

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host "Output directory: bin/" -ForegroundColor Gray
Write-Host "Run 'bin/rig.bat' or 'bin/rig.exe' to start" -ForegroundColor Gray