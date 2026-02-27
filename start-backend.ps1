$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$frontendDir = Join-Path $rootDir "banhang"
$backendDir = Join-Path $rootDir "banhang-backend"
$distDir = Join-Path $frontendDir "dist"
$indexFile = Join-Path $distDir "index.html"
$envFile = Join-Path $backendDir ".env"

$port = $null
if (Test-Path $envFile) {
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -Last 1
  if ($portLine) {
    $port = ($portLine -replace '^\s*PORT\s*=\s*', '').Trim('"', "'")
  }
}
if (-not $port) { $port = "5000" }

function Test-BackendRunning {
  param([string]$Port)
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (Test-BackendRunning $port) {
  exit 0
}

if (-not (Test-Path $indexFile)) {
  Push-Location $frontendDir
  try {
    & yarn build
  } finally {
    Pop-Location
  }
}

if (Test-BackendRunning $port) {
  exit 0
}

$logDir = Join-Path $rootDir "logs"
if (-not (Test-Path $logDir)) {
  New-Item -Path $logDir -ItemType Directory | Out-Null
}

$stdoutLog = Join-Path $logDir "backend.stdout.log"
$stderrLog = Join-Path $logDir "backend.stderr.log"
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) {
  $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
}
if (-not $npmCmd) {
  Write-Error "npm command not found in PATH."
  exit 1
}

$env:NODE_ENV = "production"
Start-Process `
  -FilePath $npmCmd.Source `
  -ArgumentList "start" `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog | Out-Null

for ($i = 0; $i -lt 20; $i++) {
  if (Test-BackendRunning $port) {
    exit 0
  }
  Start-Sleep -Seconds 1
}

Write-Error "Backend process did not become healthy on port $port. Check logs at $stdoutLog and $stderrLog."
exit 1
