# Envoie le projet sur le VPS Contabo (OpenSSH scp)
param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIP,
    [string]$User = "root",
    [string]$RemoteDir = "/opt/valueit-intranet"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Zip = Join-Path $Root "dist\valueit-intranet-contabo.zip"
$EnvFile = Join-Path $Root ".env.contabo"

if (-not (Test-Path $Zip)) {
    Write-Host "Archive absente. Exécutez d'abord :" -ForegroundColor Yellow
    Write-Host "  .\scripts\prepare-contabo-deploy.ps1 -VpsIp $ServerIP"
    & (Join-Path $PSScriptRoot "prepare-contabo-deploy.ps1") -VpsIp $ServerIP
}

Write-Host "=== Upload vers $User@${ServerIP} ===" -ForegroundColor Cyan
ssh "${User}@${ServerIP}" "mkdir -p $RemoteDir"
scp $Zip "${User}@${ServerIP}:/tmp/valueit-intranet.zip"
if (Test-Path $EnvFile) {
    scp $EnvFile "${User}@${ServerIP}:${RemoteDir}/.env"
}

$remoteScript = @"
set -e
apt-get update -qq && apt-get install -y -qq unzip
rm -rf ${RemoteDir}/*
unzip -o /tmp/valueit-intranet.zip -d ${RemoteDir}
chmod +x ${RemoteDir}/scripts/deploy-contabo.sh
bash ${RemoteDir}/scripts/deploy-contabo.sh
"@

Write-Host "Installation sur le serveur (Docker + démarrage)..." -ForegroundColor Cyan
ssh "${User}@${ServerIP}" $remoteScript

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Green
Write-Host "Test : http://${ServerIP}:3000/login"
Write-Host "Comptes démo : admin@value-it.mg / ValueIT2026! (à changer)"
