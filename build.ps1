<#
.SYNOPSIS
  Build script for the Polymorphic Encryption Rig
  Compiles all components and sets up the environment
#>

param(
    [switch]$Clean,
    [switch]$Release,
    [switch]$RunTests
)

$ErrorActionPreference = "Stop"

function Write-Status($msg) {
    Write-Host "[*] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[+] $msg" -ForegroundColor Green
}

function Write-Error($msg) {
    Write-Host "[!] $msg" -ForegroundColor Red
}

# Clean build artifacts
if ($Clean) {
    Write-Status "Cleaning build artifacts..."
    Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "*/bin" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "*/obj" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Success "Clean complete"
}

# Create output directories
Write-Status "Creating output directories..."
New-Item -Path "bin" -ItemType Directory -Force | Out-Null
New-Item -Path "bin/plugins" -ItemType Directory -Force | Out-Null
New-Item -Path "bin/tools" -ItemType Directory -Force | Out-Null

# Build configuration
$config = if ($Release) { "Release" } else { "Debug" }
Write-Status "Building in $config mode..."

# Build .NET components
Write-Status "Building .NET Backend..."
Push-Location PolymorphicBackend
dotnet build -c $config
if ($LASTEXITCODE -ne 0) { throw ".NET Backend build failed" }
Pop-Location

# Build Plugin System
Write-Status "Building Plugin System..."
Push-Location PluginSystem
if (Test-Path "PluginSystem.csproj") {
    dotnet build -c $config
} else {
    # Create project file if it doesn't exist
    @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <OutputType>Library</OutputType>
  </PropertyGroup>
</Project>
"@ | Set-Content "PluginSystem.csproj"
    dotnet build -c $config
}
if ($LASTEXITCODE -ne 0) { throw "Plugin System build failed" }

# Build plugins
Write-Status "Building plugins..."
foreach ($plugin in Get-ChildItem "Plugins/*.cs") {
    $name = [IO.Path]::GetFileNameWithoutExtension($plugin)
    csc /target:library /reference:../bin/PluginSystem.dll /out:../../bin/plugins/$name.dll $plugin.FullName
    Write-Success "Built plugin: $name"
}
Pop-Location

# Build CLI
Write-Status "Building CLI..."
Push-Location PolymorphicRig
if (Test-Path "PolymorphicRig.csproj") {
    dotnet build -c $config
} else {
    # Create project file if it doesn't exist
    @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../PluginSystem/PluginSystem.csproj" />
  </ItemGroup>
</Project>
"@ | Set-Content "PolymorphicRig.csproj"
    dotnet build -c $config
}
if ($LASTEXITCODE -ne 0) { throw "CLI build failed" }
Pop-Location

# Build C components
Write-Status "Building C components..."

# Build Polymorphic Loader
if (Get-Command cl -ErrorAction SilentlyContinue) {
    Write-Status "Building Polymorphic Loader with MSVC..."
    cl /Fe:bin/PolymorphicLoader.exe /O2 /MT PolymorphicLoader/PolymorphicLoader.c
} elseif (Get-Command gcc -ErrorAction SilentlyContinue) {
    Write-Status "Building Polymorphic Loader with GCC..."
    gcc -O2 -s -o bin/PolymorphicLoader.exe PolymorphicLoader/PolymorphicLoader.c
} elseif (Get-Command clang -ErrorAction SilentlyContinue) {
    Write-Status "Building Polymorphic Loader with Clang..."
    clang -O2 -o bin/PolymorphicLoader.exe PolymorphicLoader/PolymorphicLoader.c
} else {
    Write-Error "No C compiler found for Polymorphic Loader"
}

# Build Hot Patcher
if (Get-Command cl -ErrorAction SilentlyContinue) {
    Write-Status "Building Hot Patcher with MSVC..."
    cl /Fe:bin/HotPatcher.exe /O2 /MT HotPatcher/HotPatcher.c
} elseif (Get-Command gcc -ErrorAction SilentlyContinue) {
    Write-Status "Building Hot Patcher with GCC..."
    gcc -O2 -s -o bin/HotPatcher.exe HotPatcher/HotPatcher.c -lpsapi
} elseif (Get-Command clang -ErrorAction SilentlyContinue) {
    Write-Status "Building Hot Patcher with Clang..."
    clang -O2 -o bin/HotPatcher.exe HotPatcher/HotPatcher.c -lpsapi
} else {
    Write-Error "No C compiler found for Hot Patcher"
}

# Copy PowerShell scripts
Write-Status "Copying PowerShell scripts..."
Copy-Item "tools/Encrypt-PolymorphicDualLayer.ps1" "bin/tools/" -Force

# Copy additional tools
if (Test-Path "tools/carmilla-openssl.js") {
    Copy-Item "tools/carmilla-openssl.js" "bin/tools/" -Force
}
if (Test-Path "tools/camellia-cli.js") {
    Copy-Item "tools/camellia-cli.js" "bin/tools/" -Force
}

# Run tests if requested
if ($RunTests) {
    Write-Status "Running tests..."
    
    # Test encryption script
    Write-Status "Testing PowerShell encryption..."
    $testFile = New-TemporaryFile
    "Test data" | Set-Content $testFile
    & "bin/tools/Encrypt-PolymorphicDualLayer.ps1" $testFile
    if (Test-Path "$testFile.exe") {
        Write-Success "Encryption test passed"
        Remove-Item "$testFile.exe"
    } else {
        Write-Error "Encryption test failed"
    }
    Remove-Item $testFile
    
    # Test CLI
    Write-Status "Testing CLI..."
    Push-Location bin
    if (Test-Path "PolymorphicRig.exe") {
        & ./PolymorphicRig.exe help | Out-Null
        Write-Success "CLI test passed"
    }
    Pop-Location
}

Write-Success "Build complete!"
Write-Status "Output directory: $(Resolve-Path bin)"

# Create launcher script
@"
@echo off
cd /d "%~dp0\bin"
echo Starting Polymorphic Rig...
start "" "PolymorphicRig.exe"
"@ | Set-Content "launch.bat"

Write-Success "Created launcher: launch.bat"

# Create Send-To installer
@"
`$sendTo = [Environment]::GetFolderPath('SendTo')
`$bat = Join-Path `$sendTo "Encrypt-PolymorphicDualLayer.bat"
"@echo off`npowershell -ExecutionPolicy Bypass -File `"`$(Resolve-Path bin/tools/Encrypt-PolymorphicDualLayer.ps1)`" %*" | Set-Content `$bat
Write-Host "Send-To shortcut installed" -ForegroundColor Green
"@ | Set-Content "install-sendto.ps1"

Write-Success "Created Send-To installer: install-sendto.ps1"
Write-Status "Run .\install-sendto.ps1 as admin to add Send-To menu"