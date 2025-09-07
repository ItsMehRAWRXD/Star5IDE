param(
    [Parameter(Mandatory=$true)]
    [string]$csFilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$outputPath = ".\Output",
    
    [Parameter(Mandatory=$false)]
    [string]$exeName = "",
    
    [switch]$ToExe
)

try {
    # Validate input file exists
    if (-not (Test-Path $csFilePath -PathType Leaf)) {
        throw "Source C# file not found: $csFilePath"
    }

    # Set default exe name if not provided
    if ([string]::IsNullOrEmpty($exeName)) {
        $exeName = [System.IO.Path]::GetFileNameWithoutExtension($csFilePath) + ".exe"
    }

    # Ensure output folder exists
    if (-not (Test-Path $outputPath)) {
        $null = New-Item -ItemType Directory -Path $outputPath -Force -ErrorAction Stop
    }

    # Locate csc from the .NET SDK
    $dotnetPath = (Get-Command dotnet -ErrorAction Stop).Source
    $dotnetRoot = $dotnetPath | Split-Path -Parent
    $csc = Join-Path $dotnetRoot "Roslyn\bincore\csc.dll"
    
    if (-not (Test-Path $csc)) {
        throw "csc.dll not found at: $csc. Ensure .NET SDK is installed."
    }

    # Build compiler arguments
    $outputExePath = Join-Path $outputPath $exeName
    $arguments = @(
        $csc,
        "/target:exe",
        "/out:`"$outputExePath`"",
        "`"$csFilePath`""
    )

    # Create unique temp files for output
    $stdoutFile = [System.IO.Path]::GetTempFileName()
    $stderrFile = [System.IO.Path]::GetTempFileName()

    # Compile with captured output
    $processInfo = @{
        FilePath = "dotnet"
        ArgumentList = $arguments
        NoNewWindow = $true
        Wait = $true
        PassThru = $true
        RedirectStandardOutput = $stdoutFile
        RedirectStandardError = $stderrFile
    }
    
    $process = Start-Process @processInfo
    $stdout = Get-Content $stdoutFile -Raw -ErrorAction SilentlyContinue
    $stderr = Get-Content $stderrFile -Raw -ErrorAction SilentlyContinue
    
    # Clean up temp files
    Remove-Item $stdoutFile -Force -ErrorAction SilentlyContinue
    Remove-Item $stderrFile -Force -ErrorAction SilentlyContinue

    # Check compilation result
    if ($process.ExitCode -ne 0) {
        $errorMsg = if ($stderr) { $stderr } else { "Compilation failed with exit code $($process.ExitCode)" }
        throw $errorMsg.Trim()
    }

    if (-not (Test-Path $outputExePath -PathType Leaf)) {
        throw "Compilation succeeded but executable was not created at: $outputExePath"
    }

    Write-Output "Successfully compiled: $outputExePath"
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}