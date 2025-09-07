# RawrZ Universal Build System (PowerShell)
# This script automatically detects available compilers and builds the project

param(
    [switch]$Verbose,
    [switch]$Clean,
    [string]$Target = "RawrZ_Simple"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Info { param([string]$Message) Write-ColorOutput "[INFO] $Message" "Info" }
function Write-Success { param([string]$Message) Write-ColorOutput "[SUCCESS] $Message" "Success" }
function Write-Warning { param([string]$Message) Write-ColorOutput "[WARNING] $Message" "Warning" }
function Write-Error { param([string]$Message) Write-ColorOutput "[ERROR] $Message" "Error" }

Write-Host "========================================" -ForegroundColor White
Write-Host "RawrZ Universal Build System" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host ""

# Clean build if requested
if ($Clean) {
    Write-Info "Cleaning previous build artifacts..."
    $filesToClean = @("*.exe", "*.o", "*.obj", "*.pdb", "*.ilk")
    foreach ($pattern in $filesToClean) {
        Get-ChildItem -Path . -Filter $pattern | Remove-Item -Force -ErrorAction SilentlyContinue
    }
    Write-Success "Clean completed"
    Write-Host ""
}

# Initialize variables
$BuildSuccess = $false
$CompilerFound = $false
$CompilerName = ""
$CompilerPath = ""

Write-Info "Detecting available compilers..."
Write-Host ""

# Function to find MSVC
function Find-MSVCompiler {
    Write-Info "Checking for MSVC..."
    
    $vsPaths = @(
        "C:\Program Files\Microsoft Visual Studio",
        "C:\Program Files (x86)\Microsoft Visual Studio"
    )
    
    $vsVersions = @("2022", "2019", "2017")
    $vsEditions = @("Enterprise", "Professional", "Community", "BuildTools")
    
    foreach ($basePath in $vsPaths) {
        if (Test-Path $basePath) {
            foreach ($version in $vsVersions) {
                foreach ($edition in $vsEditions) {
                    $vcPath = Join-Path $basePath "$version\$edition\VC\Tools\MSVC"
                    if (Test-Path $vcPath) {
                        $msvcDirs = Get-ChildItem $vcPath -Directory | Sort-Object Name -Descending
                        foreach ($msvcDir in $msvcDirs) {
                            $clPath = Join-Path $msvcDir "bin\Hostx64\x64\cl.exe"
                            if (Test-Path $clPath) {
                                $script:CompilerPath = $clPath
                                $script:CompilerName = "MSVC"
                                $script:CompilerFound = $true
                                Write-Success "Found MSVC: $clPath"
                                return $true
                            }
                        }
                    }
                }
            }
        }
    }
    
    Write-Info "MSVC not found"
    return $false
}

# Function to find MinGW-w64
function Find-MinGWCompiler {
    Write-Info "Checking for MinGW-w64..."
    
    # Check PATH first
    try {
        $gppPath = Get-Command g++.exe -ErrorAction Stop
        $script:CompilerPath = $gppPath.Source
        $script:CompilerName = "MinGW-w64"
        $script:CompilerFound = $true
        Write-Success "Found MinGW-w64 in PATH: $($gppPath.Source)"
        return $true
    }
    catch {
        # Check common installation paths
        $mingwPaths = @(
            "C:\mingw64\bin\g++.exe",
            "C:\msys64\mingw64\bin\g++.exe",
            "C:\Program Files\mingw-w64\x86_64-8.1.0-posix-seh-rt_v6-rev0\mingw64\bin\g++.exe"
        )
        
        foreach ($path in $mingwPaths) {
            if (Test-Path $path) {
                $script:CompilerPath = $path
                $script:CompilerName = "MinGW-w64"
                $script:CompilerFound = $true
                Write-Success "Found MinGW-w64: $path"
                return $true
            }
        }
    }
    
    Write-Info "MinGW-w64 not found"
    return $false
}

# Function to find GCC
function Find-GCCCompiler {
    Write-Info "Checking for GCC..."
    
    try {
        $gccPath = Get-Command gcc.exe -ErrorAction Stop
        $script:CompilerPath = $gccPath.Source
        $script:CompilerName = "GCC"
        $script:CompilerFound = $true
        Write-Success "Found GCC: $($gccPath.Source)"
        return $true
    }
    catch {
        Write-Info "GCC not found"
        return $false
    }
}

# Try to find a compiler
if (-not (Find-MSVCompiler)) {
    if (-not (Find-MinGWCompiler)) {
        if (-not (Find-GCCCompiler)) {
            Write-Error "No suitable compiler found!"
            Write-Host ""
            Write-Host "Please install one of the following:" -ForegroundColor Yellow
            Write-Host "1. Visual Studio Build Tools (recommended)" -ForegroundColor Yellow
            Write-Host "2. MinGW-w64" -ForegroundColor Yellow
            Write-Host "3. GCC for Windows" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Or ensure one of these is in your PATH." -ForegroundColor Yellow
            Read-Host "Press Enter to continue"
            exit 1
        }
    }
}

# Build functions
function Build-WithMSVC {
    Write-Info "Building with MSVC..."
    Write-Host ""
    
    $clPath = Get-Command cl.exe -ErrorAction Stop
    $linkPath = Get-Command link.exe -ErrorAction Stop
    
    Write-Info "Using MSVC compiler: $($clPath.Source)"
    Write-Info "Using MSVC linker: $($linkPath.Source)"
    
    $args = @(
        "/std:c++17",
        "/EHsc",
        "/O2",
        "/D_WIN32_WINNT=0x0601",
        "$Target.cpp",
        "/Fe:$Target.exe"
    )
    
    Write-Info "Running: $($clPath.Source) $($args -join ' ')"
    & $clPath.Source @args
    
    if ($LASTEXITCODE -eq 0) {
        $script:BuildSuccess = $true
        Write-Success "MSVC build completed successfully!"
    } else {
        Write-Error "MSVC build failed with exit code: $LASTEXITCODE"
    }
}

function Build-WithMinGW {
    Write-Info "Building with MinGW-w64..."
    Write-Host ""
    
    $args = @(
        "-std=c++17",
        "-O2",
        "-static-libgcc",
        "-static-libstdc++",
        "-D_WIN32_WINNT=0x0601",
        "$Target.cpp",
        "-o",
        "$Target.exe"
    )
    
    Write-Info "Running: $CompilerPath $($args -join ' ')"
    & $CompilerPath @args
    
    if ($LASTEXITCODE -eq 0) {
        $script:BuildSuccess = $true
        Write-Success "MinGW-w64 build completed successfully!"
    } else {
        Write-Error "MinGW-w64 build failed with exit code: $LASTEXITCODE"
    }
}

function Build-WithGCC {
    Write-Info "Building with GCC..."
    Write-Host ""
    
    $args = @(
        "-std=c++17",
        "-O2",
        "-static-libgcc",
        "-static-libstdc++",
        "-D_WIN32_WINNT=0x0601",
        "$Target.cpp",
        "-o",
        "$Target.exe"
    )
    
    Write-Info "Running: $CompilerPath $($args -join ' ')"
    & $CompilerPath @args
    
    if ($LASTEXITCODE -eq 0) {
        $script:BuildSuccess = $true
        Write-Success "GCC build completed successfully!"
    } else {
        Write-Error "GCC build failed with exit code: $LASTEXITCODE"
    }
}

# Build based on found compiler
switch ($CompilerName) {
    "MSVC" { Build-WithMSVC }
    "MinGW-w64" { Build-WithMinGW }
    "GCC" { Build-WithGCC }
}

# Build results
Write-Host ""
if ($BuildSuccess) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "$Target.exe has been created successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "Available features:" -ForegroundColor White
    Write-Host "- Advanced Encryption Methods" -ForegroundColor White
    Write-Host "- Stub Generation" -ForegroundColor White
    Write-Host "- File Operations" -ForegroundColor White
    Write-Host "- Plugin System" -ForegroundColor White
    Write-Host "- Anti-Analysis Features" -ForegroundColor White
    Write-Host ""
    Write-Host "Run: .\$Target.exe" -ForegroundColor Green
    Write-Host ""
    
    # Check executable size
    if (Test-Path "$Target.exe") {
        $fileInfo = Get-Item "$Target.exe"
        Write-Info "Executable size: $($fileInfo.Length) bytes"
    }
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Missing C++17 support" -ForegroundColor Yellow
    Write-Host "2. Missing Windows headers" -ForegroundColor Yellow
    Write-Host "3. Compiler not properly configured" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to continue"
exit [int](-not $BuildSuccess)
