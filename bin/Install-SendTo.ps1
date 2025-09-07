# Run-once as admin → adds Send-To for every user
$sendTo = [Environment]::GetFolderPath('SendTo')
$scriptPath = Join-Path $PSScriptRoot "Encrypt-PolymorphicDualLayer.ps1"
$bat = Join-Path $sendTo "Encrypt-PolymorphicDualLayer.bat"

$batContent = @"
@echo off
powershell -ExecutionPolicy Bypass -File "$scriptPath" %*
"@

$batContent | Set-Content $bat -Encoding ASCII
Write-Host "Send-To shortcut installed: $bat" -ForegroundColor Green