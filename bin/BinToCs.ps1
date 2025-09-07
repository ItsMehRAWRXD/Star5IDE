<#
.SYNOPSIS
  Converts a binary file to a C# byte array for embedding in a .NET application.
.PARAMETER InputFile
  Path to the binary file to convert.
.PARAMETER OutputFile
  Path to the output C# source file.
.PARAMETER VariableName
  Name of the C# variable to hold the byte array.
.PARAMETER Namespace
  Namespace for the generated C# class.
.PARAMETER ClassName
  Name of the generated C# class.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    [Parameter(Mandatory=$true)]
    [string]$OutputFile,
    [Parameter(Mandatory=$false)]
    [string]$VariableName = "EmbeddedPayload",
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "PolymorphicRig.Embedded",
    [Parameter(Mandatory=$false)]
    [string]$ClassName = "PayloadData"
)

# Check if the input file exists
if (-not (Test-Path -Path $InputFile)) {
    Write-Error "Input file does not exist: $InputFile"
    exit 1
}

Write-Host "Converting binary file to C# source..." -ForegroundColor Green
Write-Host "Input: $InputFile" -ForegroundColor Gray
Write-Host "Output: $OutputFile" -ForegroundColor Gray

# Read the binary file
$bytes = [System.IO.File]::ReadAllBytes($InputFile)
Write-Host "Binary size: $($bytes.Length) bytes" -ForegroundColor Gray

# Convert the byte array to a C# byte array string with proper formatting
$byteArrayLines = @()
$currentLine = "            "
$bytesPerLine = 16

for ($i = 0; $i -lt $bytes.Length; $i++) {
    $currentLine += "0x{0:X2}" -f $bytes[$i]
    
    if ($i -lt $bytes.Length - 1) {
        $currentLine += ", "
    }
    
    # Break line every $bytesPerLine bytes or at the end
    if (($i + 1) % $bytesPerLine -eq 0 -or $i -eq $bytes.Length - 1) {
        $byteArrayLines += $currentLine
        $currentLine = "            "
    }
}

$byteArrayString = $byteArrayLines -join "`n"

# Generate additional metadata
$fileInfo = Get-Item $InputFile
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$hash = (Get-FileHash $InputFile -Algorithm SHA256).Hash

# Create the C# source content
$csContent = @"
using System;
using System.Security.Cryptography;

namespace $Namespace
{
    /// <summary>
    /// Embedded binary data generated from: $($fileInfo.Name)
    /// Original size: $($bytes.Length) bytes
    /// SHA256: $hash
    /// Generated: $timestamp
    /// </summary>
    public static class $ClassName
    {
        /// <summary>
        /// The embedded binary payload
        /// </summary>
        public static readonly byte[] $VariableName = new byte[]
        {
$byteArrayString
        };

        /// <summary>
        /// Gets the size of the embedded payload
        /// </summary>
        public static int Size => $VariableName.Length;

        /// <summary>
        /// Gets the SHA256 hash of the original file
        /// </summary>
        public static string OriginalHash => "$hash";

        /// <summary>
        /// Gets the generation timestamp
        /// </summary>
        public static string GeneratedAt => "$timestamp";

        /// <summary>
        /// Verifies the integrity of the embedded data
        /// </summary>
        public static bool VerifyIntegrity()
        {
            using (var sha256 = SHA256.Create())
            {
                var computedHash = BitConverter.ToString(sha256.ComputeHash($VariableName)).Replace("-", "");
                return string.Equals(computedHash, OriginalHash, StringComparison.OrdinalIgnoreCase);
            }
        }

        /// <summary>
        /// Creates a copy of the embedded data
        /// </summary>
        public static byte[] GetCopy()
        {
            var copy = new byte[$VariableName.Length];
            Array.Copy($VariableName, copy, $VariableName.Length);
            return copy;
        }
    }
}
"@

# Ensure output directory exists
$outputDir = Split-Path $OutputFile -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Write the C# source file
$csContent | Set-Content -Path $OutputFile -Encoding UTF8

Write-Host "C# source file created successfully!" -ForegroundColor Green
Write-Host "Class: $Namespace.$ClassName" -ForegroundColor Gray
Write-Host "Variable: $VariableName" -ForegroundColor Gray
Write-Host "Methods: Size, OriginalHash, GeneratedAt, VerifyIntegrity(), GetCopy()" -ForegroundColor Gray