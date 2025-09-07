param(
    [Parameter(Mandatory=$true)]
    [string]$In,
    
    [Parameter(Mandatory=$true)]
    [string]$Out
)

# ZenCrypto PowerShell Payload Extractor
# Works on any Windows box without installing anything

Write-Host "ZenCrypto PowerShell Payload Extractor" -ForegroundColor Green
Write-Host "Input: $In" -ForegroundColor Yellow
Write-Host "Output: $Out" -ForegroundColor Yellow
Write-Host ("-" * 50) -ForegroundColor Gray

try {
    # Read the entire file
    $bytes = [System.IO.File]::ReadAllBytes($In)
    Write-Host "Read $($bytes.Length) bytes from $In" -ForegroundColor Green
    
    # Define markers
    $marker = [Text.Encoding]::ASCII.GetBytes("ZEN_RESOURCES")
    $endMarker = [Text.Encoding]::ASCII.GetBytes("END_ZEN_RESOURCES")
    
    # Find start marker
    $start = [Array]::IndexOf($bytes, $marker[0])
    if ($start -lt 0) {
        throw "ZEN_RESOURCES marker not found"
    }
    
    # Verify full marker
    for ($i = 0; $i -lt $marker.Length; $i++) {
        if ($bytes[$start + $i] -ne $marker[$i]) {
            throw "ZEN_RESOURCES marker mismatch at position $i"
        }
    }
    
    Write-Host "Found marker at offset: $start" -ForegroundColor Green
    $start += $marker.Length
    
    # Extract encrypted data length and data
    if ($start + 4 -gt $bytes.Length) {
        throw "File truncated - cannot read data length"
    }
    
    $dataLen = [BitConverter]::ToUInt32($bytes, $start)
    $start += 4
    Write-Host "Encrypted data size: $dataLen bytes" -ForegroundColor Green
    
    if ($start + $dataLen -gt $bytes.Length) {
        throw "File truncated - cannot read encrypted data"
    }
    
    $encryptedData = $bytes[$start..($start + $dataLen - 1)]
    $start += $dataLen
    
    # Skip key (length + data)
    if ($start + 4 -gt $bytes.Length) {
        throw "File truncated - cannot read key length"
    }
    
    $keyLen = [BitConverter]::ToUInt32($bytes, $start)
    $start += 4
    Write-Host "Key size: $keyLen bytes" -ForegroundColor Green
    
    if ($start + $keyLen -gt $bytes.Length) {
        throw "File truncated - cannot read key"
    }
    
    $key = $bytes[$start..($start + $keyLen - 1)]
    $start += $keyLen
    
    # Skip IV (length + data)
    if ($start + 4 -gt $bytes.Length) {
        throw "File truncated - cannot read IV length"
    }
    
    $ivLen = [BitConverter]::ToUInt32($bytes, $start)
    $start += 4
    Write-Host "IV size: $ivLen bytes" -ForegroundColor Green
    
    if ($start + $ivLen -gt $bytes.Length) {
        throw "File truncated - cannot read IV"
    }
    
    $iv = $bytes[$start..($start + $ivLen - 1)]
    $start += $ivLen
    
    # Verify end marker
    if ($start + $endMarker.Length -gt $bytes.Length) {
        throw "File truncated - cannot read end marker"
    }
    
    for ($i = 0; $i -lt $endMarker.Length; $i++) {
        if ($bytes[$start + $i] -ne $endMarker[$i]) {
            throw "END_ZEN_RESOURCES marker mismatch at position $i"
        }
    }
    
    Write-Host "End marker verified successfully" -ForegroundColor Green
    
    # Write the encrypted data to output file
    [System.IO.File]::WriteAllBytes($Out, $encryptedData)
    
    Write-Host "Successfully extracted $($encryptedData.Length) bytes to: $Out" -ForegroundColor Green
    Write-Host "Key: $([System.Convert]::ToHexString($key))" -ForegroundColor Cyan
    Write-Host "IV: $([System.Convert]::ToHexString($iv))" -ForegroundColor Cyan
    Write-Host "Note: This is encrypted data. Decrypt with AES-256-CBC using the key/IV above." -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Extraction completed successfully!" -ForegroundColor Green
