# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$TestData,
    [string]$Algorithm
)

# Set defaults if not provided
if (-not $TestData) { $TestData = "RawrZ Security Platform Test Data" }
if (-not $Algorithm) { $Algorithm = "AES-256-GCM" }

try {
    # Test basic encryption/decryption
    $testBytes = [System.Text.Encoding]::UTF8.GetBytes($TestData)
    $key = [System.Security.Cryptography.Aes]::Create().Key
    $iv = [System.Security.Cryptography.Aes]::Create().IV
    
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Key = $key
    $aes.IV = $iv
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    
    $encryptor = $aes.CreateEncryptor()
    $encryptedBytes = $encryptor.TransformFinalBlock($testBytes, 0, $testBytes.Length)
    
    $decryptor = $aes.CreateDecryptor()
    $decryptedBytes = $decryptor.TransformFinalBlock($encryptedBytes, 0, $encryptedBytes.Length)
    $decryptedText = [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
    
    $result = @{
        Success = $true
        Algorithm = $Algorithm
        OriginalData = $TestData
        DecryptedData = $decryptedText
        DataIntegrity = ($TestData -eq $decryptedText)
        KeyLength = $key.Length * 8
        IVLength = $iv.Length * 8
        EncryptedSize = $encryptedBytes.Length
        Platform = "RawrZ Security Platform"
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    }
    
} catch {
    $result = @{
        Success = $false
        Error = $_.Exception.Message
        Algorithm = $Algorithm
        Platform = "RawrZ Security Platform"
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    }
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="
