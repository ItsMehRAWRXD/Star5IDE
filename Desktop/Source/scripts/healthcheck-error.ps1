# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [bool]$ShouldFail = $false
)

if ($ShouldFail) {
    throw "Intentional test error for RawrZ security platform validation"
}

$result = @{
    Success = $true
    Message = "No error occurred - RawrZ platform operational"
    Platform = "RawrZ Security Platform"
    Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="
