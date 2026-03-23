@echo off
TITLE Utility Studio Local Server
SET PORT=8080

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [SYSTEM] Starting Utility Studio local server...
echo [SYSTEM] Serving Master Hub and all nested Projects.
echo [SYSTEM] Access your Studio at http://localhost:%PORT%
echo [SYSTEM] Security Headers: COOP and COEP are ACTIVE (Required for Media Studio).
echo.
echo Press Ctrl+C to shut down the server.
echo.

:: Run the server and automatically open your browser to the Master Hub
start http://localhost:%PORT%
node server.js %PORT%

pause