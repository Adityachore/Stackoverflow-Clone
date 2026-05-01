@echo off
echo =========================================
echo    Starting Stack Overflow Clone Server
echo =========================================
cd /d "%~dp0server"
echo Working directory: %CD%
echo.
echo Starting server on port 5000...
npm start
pause
