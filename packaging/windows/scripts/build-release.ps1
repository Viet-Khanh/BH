param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path,
  [string]$StageDir = "",
  [string]$WinSW = "",
  [string]$MongoMsi = "",
  [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

if (-not $StageDir) {
  $StageDir = Join-Path $Root "release\windows\stage"
}

if (-not $WinSW) {
  $WinSW = Join-Path $Root "packaging\windows\prerequisites\WinSW-x64.exe"
}

if (-not $MongoMsi) {
  $MongoMsi = Join-Path $Root "packaging\windows\prerequisites\mongodb.msi"
}

$frontendDir = Join-Path $Root "banhang"
$backendDir = Join-Path $Root "banhang-backend"
$appStage = Join-Path $StageDir "app"
$backendStage = Join-Path $StageDir "backend"
$serviceStage = Join-Path $StageDir "service"
$prereqStage = Join-Path $StageDir "prerequisites"

if (-not (Test-Path $frontendDir)) {
  throw "Khong tim thay frontend: $frontendDir"
}

if (-not (Test-Path $backendDir)) {
  throw "Khong tim thay backend: $backendDir"
}

if (-not (Test-Path $WinSW)) {
  throw "Thieu WinSW. Hay dat file tai: $WinSW"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "Khong tim thay node.exe trong PATH."
}

if (Test-Path $StageDir) {
  Remove-Item $StageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $appStage, $backendStage, $serviceStage, $prereqStage | Out-Null

Write-Host "== Build Electron app =="
Push-Location $frontendDir
try {
  if (-not $SkipNpmInstall) {
    npm ci
  }

  $env:ELECTRON = "true"
  npm run build
  npx electron-builder --win --dir
}
finally {
  Pop-Location
}

$electronUnpacked = Join-Path $frontendDir "dist\win-unpacked"
if (-not (Test-Path $electronUnpacked)) {
  throw "Khong tim thay Electron output: $electronUnpacked"
}

Copy-Item (Join-Path $electronUnpacked "*") $appStage -Recurse -Force

Write-Host "== Stage backend =="
Copy-Item (Join-Path $backendDir "package.json") $backendStage -Force
Copy-Item (Join-Path $backendDir "package-lock.json") $backendStage -Force
Copy-Item (Join-Path $backendDir "src") $backendStage -Recurse -Force
Copy-Item (Join-Path $backendDir "scripts") $backendStage -Recurse -Force

Copy-Item $nodeCommand.Source (Join-Path $backendStage "node.exe") -Force

Push-Location $backendStage
try {
  npm ci --omit=dev
}
finally {
  Pop-Location
}

@"
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/banhang
BACKUP_DIR=C:\ProgramData\BanHang\backups
"@ | Set-Content -Path (Join-Path $backendStage ".env") -Encoding ASCII

Write-Host "== Stage service runtime =="
Copy-Item $WinSW (Join-Path $serviceStage "BanHangBackend.exe") -Force

if (Test-Path $MongoMsi) {
  Copy-Item $MongoMsi (Join-Path $prereqStage "mongodb.msi") -Force
} else {
  Write-Warning "Khong tim thay MongoDB MSI: $MongoMsi"
  Write-Warning "Inno Setup se khong compile neu thieu release\windows\stage\prerequisites\mongodb.msi"
}

Write-Host ""
Write-Host "Stage da san sang:"
Write-Host $StageDir
Write-Host ""
Write-Host "Buoc tiep theo: compile packaging\windows\installer\BanHang.iss bang Inno Setup."
