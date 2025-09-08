# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$InputData,
    [string]$Mode = 'Echo'
)

$inputBytes = [System.Convert]::FromBase64String($InputData)
$result = @{
    OriginalSize = $inputBytes.Length
    Mode = $Mode
    Success = $true
}

if ($Mode -eq 'Hash') {
    $hash = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $hash.ComputeHash($inputBytes)
    $result.Hash = [System.Convert]::ToBase64String($hashBytes)
} elseif ($Mode -eq 'Upper') {
    $text = [System.Text.Encoding]::UTF8.GetString($inputBytes)
    $upperText = $text.ToUpper()
    $result.ProcessedData = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($upperText))
} else {
    $result.ProcessedData = $InputData
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="

if ($Mode -eq 'Hash') {
    $hashBytes | Set-Content -Path $env:TEMP\e2e-output.dat -AsByteStream
} elseif ($Mode -eq 'Upper') {
    $upperBytes = [System.Text.Encoding]::UTF8.GetBytes($upperText)
    $upperBytes | Set-Content -Path $env:TEMP\e2e-output.dat -AsByteStream
} else {
    $inputBytes | Set-Content -Path $env:TEMP\e2e-output.dat -AsByteStream
}
