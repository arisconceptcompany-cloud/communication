@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Portail VALUE-IT

echo ========================================
echo   Portail Intranet VALUE-IT
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Node.js / npm introuvable.
  echo Installez Node.js : https://nodejs.org/
  pause
  exit /b 1
)

if not exist .env (
  echo Creation du fichier .env depuis .env.example...
  copy /Y .env.example .env >nul
)

if not exist data mkdir data

if not exist node_modules (
  echo Installation des dependances...
  call npm install
)

echo Preparation de la base de donnees...
call npx prisma generate
call npm run db:push
call npm run db:seed

echo.
echo Demarrage du serveur sur http://localhost:3000
echo Comptes demo : employe@value-it.mg / ValueIT2026!
echo.

start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000/login"

call npm run dev
