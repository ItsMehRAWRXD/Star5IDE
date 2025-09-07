# Compile calc.exe.stub.cs to executable
try {
    Add-Type -AssemblyName Microsoft.CSharp
    $provider = New-Object Microsoft.CSharp.CSharpCodeProvider
    $params = New-Object System.CodeDom.Compiler.CompilerParameters
    $params.GenerateExecutable = $true
    $params.OutputAssembly = "calc_stub_openssl.exe"
    $params.TreatWarningsAsErrors = $false
    $params.CompilerOptions = "/optimize- /unsafe"

    Write-Host "Reading calc.exe.stub.cs..." -ForegroundColor Yellow
    $code = [IO.File]::ReadAllText("calc.exe.stub.cs")
    
    Write-Host "Compiling..." -ForegroundColor Yellow
    $result = $provider.CompileAssemblyFromSource($params, $code)
    
    if ($result.Errors.Count -gt 0) {
        Write-Host "Compilation failed with errors:" -ForegroundColor Red
        foreach ($err in $result.Errors) {
            Write-Host "  $($err.ErrorText)" -ForegroundColor Red
        }
    } else {
        Write-Host "SUCCESS: calc_stub_openssl.exe generated!" -ForegroundColor Green
        if (Test-Path "calc_stub_openssl.exe") {
            $size = (Get-Item "calc_stub_openssl.exe").Length
            Write-Host "File size: $size bytes" -ForegroundColor Green
            Write-Host "Ready for scanning!" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
