param(
  [string]$AppDir = "C:\Program Files\BanHang",
  [string]$ServiceName = "BanHangBackend",
  [switch]$RemoveData
)

$ErrorActionPreference = "Stop"

$serviceExe = Join-Path $AppDir "service\BanHangBackend.exe"
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($existing) {
  if ($existing.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }

  if (Test-Path $serviceExe) {
    & $serviceExe uninstall | Out-Null
  } else {
    sc.exe delete $ServiceName | Out-Null
  }
}

if ($RemoveData) {
  $programData = Join-Path $env:ProgramData "BanHang"
  if (Test-Path $programData) {
    Remove-Item $programData -Recurse -Force
  }
}
