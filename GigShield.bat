@echo off
cd /d "%~dp0"
echo Starting GigShield Architecture...
start "GigShield Frontend" cmd /k "frontend.bat"
start "GigShield Backend" cmd /k "backend.bat"
echo Both services are booting up! Check the two new command windows.
pause
