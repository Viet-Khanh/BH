param(
  [string]$AppDir = "C:\Program Files\BanHang"
)

$ErrorActionPreference = "Stop"

$backendDir = Join-Path $AppDir "backend"
$nodeExe = Join-Path $backendDir "node.exe"
$backupDir = Join-Path $env:ProgramData "BanHang\backups"

if (-not (Test-Path $nodeExe)) {
  throw "Khong tim thay node.exe: $nodeExe"
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$env:MONGODB_URI = "mongodb://127.0.0.1:27017/banhang"
$env:BACKUP_DIR = $backupDir

Push-Location $backendDir
try {
  & $nodeExe "scripts\backup-mongo.js"
}
finally {
  Pop-Location
}
