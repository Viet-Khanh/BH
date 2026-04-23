param(
  [string]$AppDir = "C:\Program Files\BanHang",
  [string]$ServiceName = "BanHangBackend"
)

$ErrorActionPreference = "Stop"

$programData = Join-Path $env:ProgramData "BanHang"
$backupDir = Join-Path $programData "backups"
$logDir = Join-Path $programData "logs"
$backendDir = Join-Path $AppDir "backend"
$serviceExe = Join-Path $AppDir "service\BanHangBackend.exe"
$envFile = Join-Path $backendDir ".env"

New-Item -ItemType Directory -Path $programData, $backupDir, $logDir -Force | Out-Null

@"
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/banhang
BACKUP_DIR=$backupDir
"@ | Set-Content -Path $envFile -Encoding ASCII

if (-not (Test-Path $serviceExe)) {
  throw "Khong tim thay service executable: $serviceExe"
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  if ($existing.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }

  & $serviceExe uninstall | Out-Null
  Start-Sleep -Seconds 1
}

$mongo = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongo -and $mongo.Status -ne "Running") {
  Start-Service -Name "MongoDB"
  Start-Sleep -Seconds 5
}

& $serviceExe install | Out-Null

sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
sc.exe failureflag $ServiceName 1 | Out-Null

Start-Service -Name $ServiceName
