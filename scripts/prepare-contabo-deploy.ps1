# Prépare le déploiement Contabo (archive + .env production)
param(
    [string]$VpsIp = "",
    [string]$Domain = "intranet.value-it.mg"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Dist = Join-Path $Root "dist"
$ZipPath = Join-Path $Dist "valueit-intranet-contabo.zip"

Write-Host "=== Préparation déploiement Contabo ===" -ForegroundColor Cyan

# Secret JWT production
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes) -replace '[+/=]', ''

$appUrl = if ($VpsIp) { "http://$VpsIp`:3000" } else { "https://$Domain" }

$envContabo = @"
# Copier sur le VPS : /opt/valueit-intranet/.env
DATABASE_URL="file:/app/data/intranet.db"
AUTH_SECRET="$secret"
ALLOWED_EMAIL_DOMAINS="value-it.mg,outsourcia-group.com"
IDEA_BOX_RECIPIENTS="rh@value-it.mg,direction@value-it.mg"
SMTP_HOST="smtp.votre-serveur.local"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="intranet@value-it.mg"
APP_URL="$appUrl"
INTRANET_HOST="$Domain"
PORT=3000
"@

$envPath = Join-Path $Root ".env.contabo"
$envContabo | Set-Content -Path $envPath -Encoding UTF8
Write-Host "OK  .env.contabo (secret production généré)" -ForegroundColor Green

# Archive (sans node_modules / .next)
New-Item -ItemType Directory -Force -Path $Dist | Out-Null
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$exclude = @('node_modules', '.next', 'dist', '.git', 'data\intranet.db', 'prisma\data', '.env', '.env.local')
$files = Get-ChildItem -Path $Root -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($Root.Length + 1)
    $skip = $false
    foreach ($e in $exclude) {
        if ($rel -like "$e*" -or $rel -like "*\$e\*") { $skip = $true; break }
    }
  -not $skip
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')
foreach ($f in $files) {
    $entry = $f.FullName.Substring($Root.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entry)
}
$zip.Dispose()

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "OK  Archive : $ZipPath ($sizeMb Mo)" -ForegroundColor Green

Write-Host ""
Write-Host "--- Prochaines étapes ---" -ForegroundColor Yellow
Write-Host "1. Commander Cloud VPS 10 + Ubuntu 22.04 sur https://contabo.com/en/vps/"
Write-Host "2. Noter l'IP du VPS depuis https://my.contabo.com/"
Write-Host "3. Upload :"
Write-Host "   .\scripts\upload-to-contabo.ps1 -ServerIP VOTRE_IP"
Write-Host "4. Sur le VPS : bash /opt/valueit-intranet/scripts/deploy-contabo.sh"
