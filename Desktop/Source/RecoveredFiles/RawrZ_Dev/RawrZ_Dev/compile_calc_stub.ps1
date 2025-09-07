# Compile calc.exe.stub.cs to executable
Add-Type -AssemblyName Microsoft.CSharp
$provider = New-Object Microsoft.CSharp.CSharpCodeProvider
$params = New-Object System.CodeDom.Compiler.CompilerParameters
$params.GenerateExecutable = $true
$params.OutputAssembly = "calc_stub_openssl.exe"
$params.TreatWarningsAsErrors = $false
$params.CompilerOptions = "/optimize- /unsafe"

try {
    $code = [IO.File]::ReadAllText("calc.exe.stub.cs")
    $result = $provider.CompileAssemblyFromSource($params, $code)
    
    if ($result.Errors.Count -gt 0) {
        Write-Error "Compilation failed with errors:"
        foreach ($err in $result.Errors) {
            Write-Error "  $($err.ErrorText)"
        }
    } else {
        Write-Host "SUCCESS: calc_stub_openssl.exe generated!" -ForegroundColor Green
        Write-Host "File size: $((Get-Item 'calc_stub_openssl.exe').Length) bytes"
    }
} catch {
    Write-Error "An error occurred: $_"
}
