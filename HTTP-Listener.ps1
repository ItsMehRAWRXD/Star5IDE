<#
.SYNOPSIS
  HTTP Listener for PowerShell integration with the polymorphic encryptor
.DESCRIPTION
  This script provides a simple HTTP listener that integrates with the web frontend
  and calls the PowerShell encryption script for file processing.
#>

param(
    [string]$Port = "8080",
    [string]$ScriptPath = "Encrypt-PolymorphicDualLayer.ps1"
)

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$encryptScript = Join-Path $scriptDir $ScriptPath

if (-not (Test-Path $encryptScript)) {
    Write-Error "Encryption script not found: $encryptScript"
    exit 1
}

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "=== Polymorphic Encryption HTTP Listener ===" -ForegroundColor Cyan
Write-Host "Listening on: http://localhost:$Port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $url = $request.Url
            $method = $request.HttpMethod

            Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $method $($url.PathAndQuery)" -ForegroundColor Cyan

            if ($method -eq "POST" -and $url.AbsolutePath -eq "/generate") {
                # Parse query parameters
                $query = [System.Web.HttpUtility]::ParseQueryString($url.Query)
                $pass = $query["pass"]
                $cipher = $query["cipher"]
                $poly = $query["poly"]
                $ext = $query["ext"]

                # Read uploaded file
                $inputStream = $request.InputStream
                $buffer = New-Object byte[] $request.ContentLength64
                $inputStream.Read($buffer, 0, $request.ContentLength64) | Out-Null

                # Create temporary input file
                $tempInput = [System.IO.Path]::GetTempFileName()
                [System.IO.File]::WriteAllBytes($tempInput, $buffer)

                try {
                    # Create temporary output file
                    $tempOutput = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), $ext)

                    # Call the encryption script
                    $arguments = @(
                        "-ExecutionPolicy", "Bypass",
                        "-File", "`"$encryptScript`"",
                        "-InputFile", "`"$tempInput`"",
                        "-OutputFile", "`"$tempOutput`"",
                        "-Cipher", "`"$cipher`"",
                        "-PolyMode", "`"$poly`""
                    )

                    $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -NoNewWindow -Wait -PassThru

                    if ($process.ExitCode -eq 0 -and (Test-Path $tempOutput)) {
                        # Read the encrypted file
                        $outputBytes = [System.IO.File]::ReadAllBytes($tempOutput)

                        # Set response headers
                        $response.ContentType = "application/octet-stream"
                        $response.Headers.Add("Content-Disposition", "attachment; filename=encrypted$ext")

                        # Write response
                        $response.OutputStream.Write($outputBytes, 0, $outputBytes.Length)
                        $response.StatusCode = 200

                        Write-Host "  ✓ Encryption successful ($($outputBytes.Length) bytes)" -ForegroundColor Green
                    } else {
                        $response.StatusCode = 500
                        $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Encryption failed")
                        $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
                        Write-Host "  ✗ Encryption failed" -ForegroundColor Red
                    }
                } finally {
                    # Clean up temporary files
                    if (Test-Path $tempInput) { Remove-Item $tempInput -Force }
                    if (Test-Path $tempOutput) { Remove-Item $tempOutput -Force }
                }
            }
            elseif ($method -eq "POST" -and $url.AbsolutePath -eq "/decrypt") {
                # Handle decryption (placeholder)
                $response.StatusCode = 501
                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Decryption not implemented yet")
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
                Write-Host "  ! Decryption not implemented" -ForegroundColor Yellow
            }
            else {
                # Serve the web frontend
                $filePath = Join-Path $scriptDir "WebFrontend\index.html"
                if (Test-Path $filePath) {
                    $content = [System.IO.File]::ReadAllText($filePath)
                    $response.ContentType = "text/html"
                    $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                    $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
                    $response.StatusCode = 200
                    Write-Host "  ✓ Served web frontend" -ForegroundColor Green
                } else {
                    $response.StatusCode = 404
                    $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                    $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
                    Write-Host "  ✗ Web frontend not found" -ForegroundColor Red
                }
            }
        } catch {
            $response.StatusCode = 500
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error: $($_.Exception.Message)")
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            $response.Close()
        }
    }
} catch {
    Write-Host "`nListener stopped: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "HTTP listener stopped." -ForegroundColor Yellow
}