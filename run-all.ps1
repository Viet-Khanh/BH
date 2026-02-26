$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$backendDir = Join-Path $rootDir "banhang-backend"
$startScript = Join-Path $rootDir "start-backend.ps1"

if (-not (Test-Path $startScript)) {
  Write-Error "Missing $startScript"
  exit 1
}

$port = $null
$envFile = Join-Path $backendDir ".env"
if (Test-Path $envFile) {
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -Last 1
  if ($portLine) {
    $port = ($portLine -replace '^\s*PORT\s*=\s*', '').Trim('"', "'")
  }
}
if (-not $port) { $port = "5000" }

$url = "http://localhost:$port"

function Test-BackendRunning {
  param([string]$Port)
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

$taskName = "BanHangBackend"
$psExe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$taskCommand = "`"$psExe`" -NoProfile -ExecutionPolicy Bypass -File `"$startScript`""

$taskExists = $false
try {
  $queryCmd = "schtasks /Query /TN `"$taskName`" >nul 2>&1"
  & cmd /c $queryCmd | Out-Null
  $taskExists = $LASTEXITCODE -eq 0
} catch {
  $taskExists = $false
}

if (-not $taskExists) {
  schtasks /Create /TN $taskName /SC ONLOGON /RL LIMITED /F /TR $taskCommand | Out-Null
}

if (-not (Test-BackendRunning $port)) {
  schtasks /Run /TN $taskName | Out-Null

  for ($i = 0; $i -lt 20; $i++) {
    if (Test-BackendRunning $port) { break }
    Start-Sleep -Seconds 1
  }
}

Start-Process $url
