@echo off
:: Clic droit > Executer en tant qu'administrateur
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-intranet.ps1"
pause
