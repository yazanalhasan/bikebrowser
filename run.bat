@echo off
cd /d "%~dp0"
echo ========================================
echo BikeBrowser - Quick Setup and Run
echo ========================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This might take a few minutes on first run...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo.
        echo If you see errors about 'better-sqlite3', you may need build tools.
        echo Run this command as Administrator:
        echo   npm install --global windows-build-tools
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Installation complete!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo Starting BikeBrowser...
echo.
echo The app will open automatically.
echo Developer Tools will be visible for debugging.
echo.
echo To stop the app, press Ctrl+C in this window.
echo ========================================
echo.

call npm run dev
