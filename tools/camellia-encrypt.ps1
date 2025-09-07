param(
  [Parameter(Mandatory=$true)][string]$In,
  [Parameter(Mandatory=$true)][string]$Pass,
  [Parameter(Mandatory=$false)][string]$Out,
  [Parameter(Mandatory=$false)][string]$Cipher = "camellia-256-cbc",
  [Parameter(Mandatory=$false)][string]$Hint
)

if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, '.pkg.b64') }

$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) { Write-Error "Node.js not found in PATH"; exit 1 }

$tool = Join-Path $PSScriptRoot 'camellia-cli.js'
if (-not (Test-Path $tool)) { Write-Error "CLI not found: $tool"; exit 1 }

$args = @('encrypt', '--pass', $Pass, '--cipher', $Cipher, '--in', $In, '--out', $Out)
if ($Hint) { $args += @('--hint', $Hint) }

& node $tool @args
exit $LASTEXITCODE

