# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$TestString
)

# Set default if not provided
if (-not $TestString) { $TestString = "Hello [CHAR][CHAR] [CHAR][CHAR] [CHAR]o[CHAR]l" }

$result = @{
    OriginalString = $TestString
    IsValid = $true
    Encoding = [System.Text.Encoding]::UTF8.EncodingName
    SpecialChars = @{
        HasUnicode = $TestString -match '[\u0080-\uFFFF]'
        HasEmoji = $TestString -match '[\u1F600-\u1F64F]|[\u1F300-\u1F5FF]|[\u1F680-\u1F6FF]|[\u1F1E0-\u1F1FF]|[\u2600-\u26FF]|[\u2700-\u27BF]'
        Length = $TestString.Length
        ByteLength = [System.Text.Encoding]::UTF8.GetByteCount($TestString)
    }
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="
