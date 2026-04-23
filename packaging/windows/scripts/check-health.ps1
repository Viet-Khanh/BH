param(
  [string]$Url = "http://localhost:5000/api/health",
  [int]$Retries = 30,
  [int]$DelaySeconds = 2
)

$ErrorActionPreference = "Stop"

for ($i = 1; $i -le $Retries; $i++) {
  try {
    $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 3
    if ($response.ok -eq $true) {
      Write-Host "BanHang API OK"
      exit 0
    }
  } catch {
    Start-Sleep -Seconds $DelaySeconds
  }
}

throw "BanHang API chua san sang: $Url"
