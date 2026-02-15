$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
Set-Location $rootDir

$backupDir = $env:BACKUP_DIR
if (-not $backupDir) { $backupDir = Join-Path $rootDir "backups" }

$backupKeep = $env:BACKUP_KEEP
if (-not $backupKeep) { $backupKeep = 3 }

$backupIntervalDays = $env:BACKUP_INTERVAL_DAYS
if (-not $backupIntervalDays) { $backupIntervalDays = 3 }

$mongoDb = $env:MONGO_DB
if (-not $mongoDb) { $mongoDb = "banhang" }

if ($backupKeep -notmatch '^\d+$') {
  Write-Error "BACKUP_KEEP must be a number"
  exit 1
}
$backupKeep = [int]$backupKeep

if ($backupIntervalDays -notmatch '^\d+$') {
  Write-Error "BACKUP_INTERVAL_DAYS must be a number"
  exit 1
}
$backupIntervalDays = [int]$backupIntervalDays

$useLegacy = $false

function Invoke-Compose {
  param([string[]]$Args)
  if ($useLegacy) {
    & docker-compose @Args
  } else {
    & docker compose @Args
  }
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

function Should-RunBackup {
  param([string]$Path, [int]$IntervalDays)
  if ($IntervalDays -le 0) { return $true }

  $latest = Get-ChildItem -Path $Path -Filter "banhang-*.archive.gz" |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { return $true }

  $age = (Get-Date) - $latest.LastWriteTime
  return $age.TotalDays -ge $IntervalDays
}

if (-not (Should-RunBackup -Path $backupDir -IntervalDays $backupIntervalDays)) {
  Write-Output "Skip backup: last backup is within $backupIntervalDays day(s)."
  exit 0
}

$useLegacy = $false
& docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $useLegacy = $true
  } else {
    Write-Error "docker compose not found"
    exit 1
  }
}

$containerId = (Invoke-Compose @("ps","-q","mongo")).Trim()
if (-not $containerId) {
  Write-Error "Mongo container not running"
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "banhang-$stamp.archive.gz"
$backupPath = Join-Path $backupDir $backupName
$tmpFile = "/tmp/banhang.archive.gz"

Invoke-Compose @("exec","-T","mongo","mongodump","--db",$mongoDb,"--archive=$tmpFile","--gzip")
if ($LASTEXITCODE -ne 0) { exit 1 }

& docker cp "$containerId:$tmpFile" "$backupPath"
if ($LASTEXITCODE -ne 0) { exit 1 }

Invoke-Compose @("exec","-T","mongo","rm","-f",$tmpFile)

if ($backupKeep -gt 0) {
  $backups = Get-ChildItem -Path $backupDir -Filter "banhang-*.archive.gz" |
    Sort-Object LastWriteTime -Descending
  if ($backups.Count -gt $backupKeep) {
    $backups[$backupKeep..($backups.Count - 1)] | Remove-Item -Force
  }
}

Write-Output "Backup saved to $backupPath"
