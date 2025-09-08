# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$Name,
    [int]$Age,
    [string]$Mode = 'Echo'
)

$result = @{
    Name = $Name
    Age = $Age
    Mode = $Mode
    Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Success = $true
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="