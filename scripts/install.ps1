# Installation Portail Intranet VALUE-IT (Windows)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js/npm requis : https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path .env)) { Copy-Item .env.example .env }
New-Item -ItemType Directory -Path data -Force | Out-Null

npm install
npx prisma db push
npm run db:seed

Write-Host "`nInstallation terminée. Lancez : npm run dev" -ForegroundColor Green
Write-Host "Comptes démo : rh@value-it.mg / ValueIT2026!" -ForegroundColor Cyan
