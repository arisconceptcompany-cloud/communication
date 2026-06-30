# Configuration URL interne : http://intranet.value-it.local:3000
# Exécuter en administrateur pour modifier le fichier hosts et le pare-feu.
param(
    [string]$Hostname = "intranet.value-it.local",
    [int]$Port = 3000,
    [switch]$ClientOnly,
    [string]$ServerIP = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$Marker = "# VALUE-IT INTRANET"

function Get-LanIP {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notmatch '^127\.' -and
            $_.PrefixOrigin -ne 'WellKnown'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
    if (-not $ip) { $ip = "127.0.0.1" }
    return $ip
}

function Test-IsAdmin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Update-HostsEntry {
    param([string]$IP, [string]$Name)
    $line = "$IP`t$Name"
    $content = Get-Content $HostsFile -ErrorAction SilentlyContinue
    if ($null -eq $content) { $content = @() }
    $filtered = $content | Where-Object {
        $_ -notmatch [regex]::Escape($Name) -and $_ -notmatch [regex]::Escape($Marker)
    }
    $newContent = @($filtered) + @("$Marker", $line)
    Set-Content -Path $HostsFile -Value $newContent -Encoding UTF8
    Write-Host "  hosts : $line" -ForegroundColor Green
}

Write-Host "`n=== Portail Intranet VALUE-IT ===" -ForegroundColor Cyan
Write-Host "URL cible : http://${Hostname}:${Port}`n"

if ($ClientOnly) {
    if (-not $ServerIP) {
        $ServerIP = Read-Host "IP du serveur intranet (ex. 10.3.87.215)"
    }
    if (-not (Test-IsAdmin)) {
        Write-Host "Relancez PowerShell en Administrateur pour modifier le fichier hosts." -ForegroundColor Red
        exit 1
    }
    Update-HostsEntry -IP $ServerIP -Name $Hostname
    Write-Host "`nSur ce PC, ouvrez : http://${Hostname}:${Port}" -ForegroundColor Yellow
    exit 0
}

# Mode serveur (machine qui héberge le portail)
$lanIp = Get-LanIP
Write-Host "IP réseau local détectée : $lanIp" -ForegroundColor Gray

if (Test-IsAdmin) {
    Update-HostsEntry -IP "127.0.0.1" -Name $Hostname
    try {
        New-NetFirewallRule -DisplayName "VALUE-IT Intranet ($Port)" `
            -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow `
            -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  pare-feu : port $Port autorisé (entrant)" -ForegroundColor Green
    } catch {
        Write-Host "  pare-feu : impossible d'ajouter la règle ($_)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nAstuce : relancez ce script en Administrateur pour :" -ForegroundColor Yellow
    Write-Host "  - enregistrer $Hostname dans le fichier hosts"
    Write-Host "  - ouvrir le port $Port dans le pare-feu Windows"
}

# Mettre à jour .env
$envPath = Join-Path $ProjectRoot ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $appUrl = "http://${Hostname}:${Port}"
    if ($envContent -match 'APP_URL=') {
        $envContent = $envContent -replace 'APP_URL="[^"]*"', "APP_URL=`"$appUrl`""
    } else {
        $envContent += "`nAPP_URL=`"$appUrl`""
    }
    if ($envContent -notmatch 'INTRANET_HOST=') {
        $envContent += "`nINTRANET_HOST=`"$Hostname`""
    }
    Set-Content -Path $envPath -Value $envContent.TrimEnd() -NoNewline
    Add-Content -Path $envPath -Value "`n"
    Write-Host "  .env   : APP_URL=$appUrl" -ForegroundColor Green
}

Write-Host "`n--- Liens à partager ---" -ForegroundColor Cyan
Write-Host "  Sur ce serveur :  http://${Hostname}:${Port}"
Write-Host "  Réseau local   :  http://${lanIp}:${Port}"
Write-Host "`n--- Collègues (autres PC) ---" -ForegroundColor Cyan
Write-Host "  Option 1 — DNS interne (IT) : enregistrement A"
Write-Host "    $Hostname  ->  $lanIp"
Write-Host "  Option 2 — Fichier hosts sur chaque PC (admin) :"
Write-Host "    powershell -ExecutionPolicy Bypass -File `"$PSScriptRoot\setup-intranet.ps1`" -ClientOnly -ServerIP $lanIp"
Write-Host "`n--- Démarrer le portail ---" -ForegroundColor Cyan
Write-Host "  cd `"$ProjectRoot`""
Write-Host "  npm run dev"
Write-Host ""
