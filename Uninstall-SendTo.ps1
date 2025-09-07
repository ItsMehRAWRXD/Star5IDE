<#
.SYNOPSIS
  Uninstall Send-To integration for Polymorphic Encryptor
.DESCRIPTION
  This script removes the Send-To menu items for the polymorphic encryptor.
.PARAMETER UninstallFromAllUsers
  Uninstall from all users (requires admin privileges)
#>
param(
    [switch]$UninstallFromAllUsers
)

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($UninstallFromAllUsers -and -not $isAdmin) {
    Write-Error "Administrator privileges required for system-wide uninstallation"
    exit 1
}

# Get the Send-To directory
if ($UninstallFromAllUsers) {
    $sendToPath = [Environment]::GetFolderPath('CommonSendTo')
} else {
    $sendToPath = [Environment]::GetFolderPath('SendTo')
}

Write-Host "Uninstalling from: $sendToPath" -ForegroundColor Yellow

# Remove the batch file
$batFile = Join-Path $sendToPath "Encrypt-PolymorphicDualLayer.bat"
if (Test-Path $batFile) {
    Remove-Item -Path $batFile -Force
    Write-Host "✓ Removed batch file: $batFile" -ForegroundColor Green
} else {
    Write-Host "Batch file not found: $batFile" -ForegroundColor Yellow
}

# Remove the PowerShell script
$psFile = Join-Path $sendToPath "Encrypt-PolymorphicDualLayer.ps1"
if (Test-Path $psFile) {
    Remove-Item -Path $psFile -Force
    Write-Host "✓ Removed PowerShell script: $psFile" -ForegroundColor Green
} else {
    Write-Host "PowerShell script not found: $psFile" -ForegroundColor Yellow
}

Write-Host "`nUninstallation complete!" -ForegroundColor Green