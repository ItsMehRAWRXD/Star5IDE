<#
.SYNOPSIS
  Install Send-To integration for Polymorphic Encryptor
.DESCRIPTION
  This script adds a Send-To menu item for the polymorphic encryptor,
  allowing users to right-click any file and encrypt it directly.
.PARAMETER InstallForAllUsers
  Install for all users (requires admin privileges)
#>
param(
    [switch]$InstallForAllUsers
)

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($InstallForAllUsers -and -not $isAdmin) {
    Write-Error "Administrator privileges required for system-wide installation"
    exit 1
}

# Get the Send-To directory
if ($InstallForAllUsers) {
    $sendToPath = [Environment]::GetFolderPath('CommonSendTo')
} else {
    $sendToPath = [Environment]::GetFolderPath('SendTo')
}

Write-Host "Installing to: $sendToPath" -ForegroundColor Green

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$encryptScript = Join-Path $scriptDir "Encrypt-PolymorphicDualLayer.ps1"

if (-not (Test-Path $encryptScript)) {
    Write-Error "Encrypt-PolymorphicDualLayer.ps1 not found in script directory"
    exit 1
}

# Create the batch file for Send-To
$batFile = Join-Path $sendToPath "Encrypt-PolymorphicDualLayer.bat"
$batContent = @"
@echo off
powershell -ExecutionPolicy Bypass -File "$encryptScript" "%*"
"@

Set-Content -Path $batFile -Value $batContent -Encoding ASCII

# Create a PowerShell script version as well
$psFile = Join-Path $sendToPath "Encrypt-PolymorphicDualLayer.ps1"
Copy-Item -Path $encryptScript -Destination $psFile -Force

Write-Host "Send-To integration installed successfully!" -ForegroundColor Green
Write-Host "You can now right-click any file and select 'Send to > Encrypt-PolymorphicDualLayer'" -ForegroundColor Yellow

# Test the installation
if (Test-Path $batFile) {
    Write-Host "✓ Batch file created: $batFile" -ForegroundColor Green
} else {
    Write-Error "Failed to create batch file"
}

if (Test-Path $psFile) {
    Write-Host "✓ PowerShell script copied: $psFile" -ForegroundColor Green
} else {
    Write-Error "Failed to copy PowerShell script"
}

Write-Host "`nInstallation complete!" -ForegroundColor Green