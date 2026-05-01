@echo off
echo ========================================
echo Stack Overflow Clone - Quick Start
echo ========================================
echo.

REM Check if MongoDB is running
echo [1/3] Checking MongoDB connection...
timeout /t 2 /nobreak >nul

REM Start Backend Server
echo.
echo [2/3] Starting Backend Server...
echo Opening new terminal for backend...
start "Backend Server" cmd /k "cd /d %~dp0server && npm start"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo.
echo [3/3] Starting Frontend...
echo Opening new terminal for frontend...
start "Frontend Server" cmd /k "cd /d %~dp0stack && npm run dev"

echo.
echo ========================================
echo ✅ Servers are starting!
echo ========================================
echo.
echo Backend:  https://stackoverflow-clone-6cll.onrender.com
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
