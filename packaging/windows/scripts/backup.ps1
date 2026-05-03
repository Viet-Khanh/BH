param(
  [string]$AppDir = "C:\Program Files\BanHang",
  [string]$BackupDir = "",
  [int]$BackupKeep = 3,
  [int]$MinIntervalHours = 20
)

$ErrorActionPreference = "Stop"

$backendDir = Join-Path $AppDir "backend"
$nodeExe = Join-Path $backendDir "node.exe"

if (-not (Test-Path $nodeExe)) {
  throw "Khong tim thay node.exe: $nodeExe"
}

function Get-GoogleDriveBackupDir {
  if ($BackupDir) {
    return $BackupDir
  }

  if ($env:BANHANG_BACKUP_DIR) {
    return $env:BANHANG_BACKUP_DIR
  }

  $roots = @()
  if ($env:USERPROFILE) {
    $roots += Join-Path $env:USERPROFILE "My Drive"
    $roots += Join-Path $env:USERPROFILE "Google Drive"
    $roots += Join-Path $env:USERPROFILE "Google Drive\My Drive"
  }

  Get-PSDrive -PSProvider FileSystem | ForEach-Object {
    $roots += Join-Path $_.Root "My Drive"
    $roots += Join-Path $_.Root "Google Drive"
    $roots += Join-Path $_.Root "Google Drive\My Drive"
  }

  $driveRoot = $roots |
    Where-Object { $_ -and (Test-Path $_) } |
    Select-Object -First 1

  if (-not $driveRoot) {
    throw "Khong tim thay thu muc Google Drive Desktop. Hay chay voi -BackupDir hoac dat bien moi truong BANHANG_BACKUP_DIR."
  }

  return Join-Path $driveRoot "BanHang Backups"
}

function Get-BackupFiles {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return @()
  }

  return @(Get-ChildItem -Path $Path -Filter "backup-*.json" -File |
    Sort-Object LastWriteTime -Descending)
}

function Test-ShouldRunBackup {
  param([string]$Path, [int]$IntervalHours)
  if ($IntervalHours -le 0) {
    return $true
  }

  $latest = Get-BackupFiles -Path $Path | Select-Object -First 1
  if (-not $latest) {
    return $true
  }

  $age = (Get-Date) - $latest.LastWriteTime
  return $age.TotalHours -ge $IntervalHours
}

function Remove-OldBackups {
  param([string]$Path, [int]$Keep)
  if ($Keep -le 0) {
    return
  }

  $backups = Get-BackupFiles -Path $Path
  if ($backups.Count -le $Keep) {
    return
  }

  $backups[$Keep..($backups.Count - 1)] | Remove-Item -Force
}

$resolvedBackupDir = Get-GoogleDriveBackupDir
New-Item -ItemType Directory -Path $resolvedBackupDir -Force | Out-Null

if (-not (Test-ShouldRunBackup -Path $resolvedBackupDir -IntervalHours $MinIntervalHours)) {
  Write-Output "Skip backup: latest backup is within $MinIntervalHours hour(s)."
  exit 0
}

$mongo = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongo -and $mongo.Status -ne "Running") {
  Start-Service -Name "MongoDB"
  $mongo.WaitForStatus("Running", "00:00:30")
}

$env:MONGODB_URI = "mongodb://127.0.0.1:27017/banhang"
$env:BACKUP_DIR = $resolvedBackupDir

Push-Location $backendDir
try {
  & $nodeExe "scripts\backup-mongo.js"
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

Remove-OldBackups -Path $resolvedBackupDir -Keep $BackupKeep
Write-Output "Backup directory: $resolvedBackupDir"
