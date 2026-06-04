# One-shot setup for DigitalOcean Postgres (run on your PC)
# Usage:
#   $env:DO_ADMIN_DATABASE_URL = 'postgresql://...'
#   $env:DO_APP_DATABASE_URL   = 'postgresql://...'
#   .\scripts\do-setup-database.ps1

param(
  [string]$AdminUrl = $env:DO_ADMIN_DATABASE_URL,
  [string]$AppUrl = $env:DO_APP_DATABASE_URL
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$schema = "prisma/schema.prisma"

function Get-DbUser([string]$Url) {
  if ($Url -match "postgresql://([^:]+):") { return $Matches[1] }
  throw "Could not parse username from connection URL"
}

function Get-DbName([string]$Url) {
  if ($Url -match "postgresql://[^/]+/([^?]+)") { return $Matches[1] }
  throw "Could not parse database name from connection URL"
}

function Invoke-DbSql([string]$Url, [string]$Sql) {
  $Sql = $Sql.Trim()
  if (-not $Sql) { return }
  Write-Host "  -> $Sql"
  $Sql | npx prisma db execute --stdin --url $Url --schema $schema
  if ($LASTEXITCODE -ne 0) { throw "SQL failed (exit $LASTEXITCODE): $Sql" }
}

if (-not $AdminUrl) {
  Write-Host "Set DO_ADMIN_DATABASE_URL with single quotes:"
  Write-Host "  `$env:DO_ADMIN_DATABASE_URL = 'postgresql://...'"
  exit 1
}
if (-not $AppUrl) {
  Write-Host "Set DO_APP_DATABASE_URL (or same as admin):"
  Write-Host "  `$env:DO_APP_DATABASE_URL = `$env:DO_ADMIN_DATABASE_URL"
  exit 1
}

$appUser = Get-DbUser $AppUrl
$dbName = Get-DbName $AppUrl

Write-Host "App user: $appUser"
Write-Host "Database: $dbName"
Write-Host "Running FULL GRANT (one statement at a time)..."

$grantStatements = @(
  "GRANT CONNECT ON DATABASE `"$dbName`" TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON DATABASE `"$dbName`" TO `"$appUser`";"
  "GRANT USAGE ON SCHEMA public TO `"$appUser`";"
  "GRANT CREATE ON SCHEMA public TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON SCHEMA public TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO `"$appUser`";"
  "GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO `"$appUser`";"
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO `"$appUser`";"
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO `"$appUser`";"
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO `"$appUser`";"
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO `"$appUser`";"
  "ALTER SCHEMA public OWNER TO `"$appUser`";"
)

foreach ($stmt in $grantStatements) {
  try {
    Invoke-DbSql -Url $AdminUrl -Sql $stmt
  } catch {
    Write-Host "WARN: $($_.Exception.Message)"
    Write-Host "      (continuing — some grants need doadmin)"
  }
}

Write-Host "Running prisma db push + seed as app user..."
npx prisma db push --url $AppUrl --schema $schema
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "db push failed. If permission denied:"
  Write-Host "  1. Convert dbs-db to Managed Database on DigitalOcean"
  Write-Host "  2. Set DO_ADMIN_DATABASE_URL to doadmin connection string"
  Write-Host "  3. Run this script again"
  exit 1
}

$env:DATABASE_URL = $AppUrl
npx prisma db seed --schema $schema
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done. Next on DigitalOcean:"
Write-Host "  1. Web + db-setup: DATABASE_URL = app connection string (Build+Run on web)"
Write-Host "  2. AUTH_SECRET on web"
Write-Host "  3. Force Rebuild and Deploy"
Write-Host "  4. Check https://seal-app-kcq9n.ondigitalocean.app/api/health"
