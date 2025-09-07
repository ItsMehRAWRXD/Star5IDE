<#
.SYNOPSIS
  Build all components of the polymorphic encryption system
.DESCRIPTION
  This script builds all .NET projects and creates the final distribution
#>

param(
    [string]$Configuration = "Release",
    [switch]$Clean,
    [switch]$Publish
)

Write-Host "=== Building Polymorphic Encryption System ===" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Clean if requested
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    Get-ChildItem -Path . -Recurse -Directory -Name "bin", "obj" | ForEach-Object {
        Remove-Item -Path $_ -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Build projects
$projects = @(
    @{ Name = "PolymorphicBackend"; Path = "PolymorphicBackend" },
    @{ Name = "PolymorphicLoader"; Path = "PolymorphicLoader" },
    @{ Name = "HotPatcher"; Path = "HotPatcher" },
    @{ Name = "PluginSystem"; Path = "PluginSystem" }
)

foreach ($project in $projects) {
    $projectPath = Join-Path $scriptDir $project.Path
    if (Test-Path $projectPath) {
        Write-Host "Building $($project.Name)..." -ForegroundColor Yellow
        Set-Location $projectPath
        
        try {
            if ($Publish) {
                dotnet publish --configuration $Configuration --self-contained false
            } else {
                dotnet build --configuration $Configuration
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ $($project.Name) built successfully" -ForegroundColor Green
            } else {
                Write-Error "Failed to build $($project.Name)"
            }
        } catch {
            Write-Error "Error building $($project.Name): $_"
        }
        
        Set-Location $scriptDir
    } else {
        Write-Warning "Project directory not found: $($project.Path)"
    }
}

# Create distribution directory
$distDir = Join-Path $scriptDir "dist"
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -Path $distDir -ItemType Directory -Force | Out-Null

# Copy built executables
$binDirs = Get-ChildItem -Path . -Recurse -Directory -Name "bin" | Where-Object { $_ -like "*$Configuration*" }
foreach ($binDir in $binDirs) {
    $sourcePath = Join-Path $scriptDir $binDir
    $projectName = Split-Path (Split-Path $sourcePath -Parent) -Leaf
    
    $destPath = Join-Path $distDir $projectName
    Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    Write-Host "✓ Copied $projectName to distribution" -ForegroundColor Green
}

# Copy scripts and documentation
$filesToCopy = @(
    "Encrypt-PolymorphicDualLayer.ps1",
    "Install-SendTo.ps1",
    "Uninstall-SendTo.ps1",
    "Setup-Environment.ps1",
    "HTTP-Listener.ps1",
    "README.md"
)

foreach ($file in $filesToCopy) {
    $sourceFile = Join-Path $scriptDir $file
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $distDir -Force
        Write-Host "✓ Copied $file to distribution" -ForegroundColor Green
    }
}

# Copy web frontend
$webSource = Join-Path $scriptDir "WebFrontend"
$webDest = Join-Path $distDir "WebFrontend"
if (Test-Path $webSource) {
    Copy-Item -Path $webSource -Destination $webDest -Recurse -Force
    Write-Host "✓ Copied WebFrontend to distribution" -ForegroundColor Green
}

Write-Host "`n=== Build Complete! ===" -ForegroundColor Green
Write-Host "Distribution created in: $distDir" -ForegroundColor Yellow
Write-Host "`nTo deploy:" -ForegroundColor Cyan
Write-Host "1. Copy the 'dist' folder to your target system" -ForegroundColor White
Write-Host "2. Run 'Setup-Environment.ps1' to configure the system" -ForegroundColor White
Write-Host "3. Use 'Start-Backend.bat' to start the web server" -ForegroundColor White