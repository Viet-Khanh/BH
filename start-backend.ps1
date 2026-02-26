$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$frontendDir = Join-Path $rootDir "banhang"
$backendDir = Join-Path $rootDir "banhang-backend"
$distDir = Join-Path $frontendDir "dist"
$indexFile = Join-Path $distDir "index.html"

if (-not (Test-Path $indexFile)) {
  Push-Location $frontendDir
  try {
    & yarn build
  } finally {
    Pop-Location
  }
}

Push-Location $backendDir
try {
  $env:NODE_ENV = "production"
  & npm start
} finally {
  Pop-Location
}
