# Set the path to VS2022's VC compiler (adjust if needed)
$vcvarsall = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

# Get all .cpp files recursively
$cppFiles = Get-ChildItem -Path . -Recurse -Include *.cpp

foreach ($file in $cppFiles) {
    $sourcePath = $file.FullName
    $exePath = [System.IO.Path]::ChangeExtension($sourcePath, ".exe")

    # Skip if .exe already exists
    if (Test-Path $exePath) {
        Write-Host "Skipping $sourcePath (already compiled)"
        continue
    }

    # Compile using cl.exe
    $cmd = "`"$vcvarsall`" && cl.exe /EHsc `"$sourcePath`" /Fe:`"$exePath`""
    Write-Host "Compiling $sourcePath to $exePath"
    cmd.exe /c $cmd
}