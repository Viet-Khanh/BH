$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
Set-Location $rootDir

$backupDir = $env:BACKUP_DIR
if (-not $backupDir) { $backupDir = Join-Path $rootDir "backups" }

$backupKeep = $env:BACKUP_KEEP
if (-not $backupKeep) { $backupKeep = 30 }

$mongoDb = $env:MONGO_DB
if (-not $mongoDb) { $mongoDb = "banhang" }

if (-not ($backupKeep -as [int])) {
  Write-Error "BACKUP_KEEP must be a number"
  exit 1
}
$backupKeep = [int]$backupKeep

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

function Invoke-Compose {
  param([string[]]$Args)
  if ($useLegacy) {
    & docker-compose @Args
  } else {
    & docker compose @Args
  }
}

$containerId = (Invoke-Compose @("ps","-q","mongo")).Trim()
if (-not $containerId) {
  Write-Error "Mongo container not running"
  exit 1
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

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
