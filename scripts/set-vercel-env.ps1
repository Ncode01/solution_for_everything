# Non-interactive Vercel production env setup (requires VERCEL_TOKEN in .env.deploy)
param(
  [string]$ApiUrl = "https://flowcanvas-api-production.up.railway.app",
  [string]$Scope = "nadulanisith10-gmailcoms-projects"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$deploy = @{}
Get-Content (Join-Path $root ".env.deploy") | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') { $deploy[$matches[1]] = $matches[2] }
}
$token = $deploy['VERCEL_TOKEN']
if (-not $token) { throw "VERCEL_TOKEN missing in .env.deploy" }

$local = @{}
Get-Content (Join-Path $root ".env.local") | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') { $local[$matches[1]] = $matches[2] }
}

function Add-VercelEnv($name, $value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Warning "Skip $name (empty)"
    return
  }
  $value | npx vercel env add $name production --token $token --scope $Scope --force 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    $value | npx vercel env add $name production --token $token --scope $Scope 2>&1 | Out-Null
  }
  Write-Host "Set $name"
}

$pairs = @{
  NEXT_PUBLIC_FIREBASE_API_KEY            = $local['NEXT_PUBLIC_FIREBASE_API_KEY']
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        = $local['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']
  NEXT_PUBLIC_FIREBASE_PROJECT_ID         = $local['NEXT_PUBLIC_FIREBASE_PROJECT_ID']
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     = $local['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = $local['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']
  NEXT_PUBLIC_FIREBASE_APP_ID               = $local['NEXT_PUBLIC_FIREBASE_APP_ID']
  NEXT_PUBLIC_API_URL                       = $ApiUrl
  NEXT_PUBLIC_ORG_ID                        = $deploy['PROD_ORG_ID']
  DATABASE_URL                              = $deploy['PROD_DB_URL']
  BETTER_AUTH_SECRET                        = $deploy['PROD_BETTER_AUTH_SECRET']
  BETTER_AUTH_URL                           = "https://PLACEHOLDER.vercel.app"
}

foreach ($k in $pairs.Keys) { Add-VercelEnv $k $pairs[$k] }

Write-Host "Done. Update BETTER_AUTH_URL after first Vercel deploy."
