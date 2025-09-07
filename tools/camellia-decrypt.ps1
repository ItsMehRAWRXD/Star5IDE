param(
  [Parameter(Mandatory=$true)][string]$In,
  [Parameter(Mandatory=$true)][string]$Pass,
  [Parameter(Mandatory=$false)][string]$Out,
  [Parameter(Mandatory=$false)][string]$Cipher
)

if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, '.bin') }

$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) { Write-Error "Node.js not found in PATH"; exit 1 }

$tool = Join-Path $PSScriptRoot 'camellia-cli.js'
if (-not (Test-Path $tool)) { Write-Error "CLI not found: $tool"; exit 1 }

$args = @('decrypt', '--pass', $Pass, '--in', $In, '--out', $Out)
if ($Cipher) { $args += @('--cipher', $Cipher) }

& node $tool @args
exit $LASTEXITCODE

