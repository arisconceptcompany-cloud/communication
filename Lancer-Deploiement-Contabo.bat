@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo  Deploiement intranet VALUE-IT
echo  VPS : 167.86.118.96 (root)
echo ========================================
echo.
echo Utilisez le mot de passe ROOT du VPS
echo (email Contabo apres installation Ubuntu, PAS le mot de passe du site my.contabo.com).
echo.
set /p CONTABO_ROOT_PASSWORD=Mot de passe root : 
set CONTABO_HOST=167.86.118.96
python "%~dp0scripts\deploy-contabo-remote.py"
echo.
pause
