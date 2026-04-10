@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ================================================
echo   BikeBrowser - Complete Environment Setup
echo ================================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [Step 1/10] Checking for NVM...
where nvm >nul 2>&1
if %errorLevel% neq 0 (
    echo   NVM not found. Please install NVM first:
    echo   1. Download from: https://github.com/coreybutler/nvm-windows/releases
    echo   2. Run nvm-setup.exe as Administrator
    echo   3. Accept all defaults
    echo   4. Close this window and rerun this script
    pause
    exit /b 1
)
echo   ✓ NVM found

echo.
echo [Step 2/10] Installing Node.js 20...
call nvm install 20
call nvm use 20
echo   ✓ Node 20 activated

echo.
echo [Step 3/10] Verifying Node installation...
node -v >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Node not found after NVM install
    echo   Please close this window, open a new Command Prompt as Admin, and try again
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo   ✓ Node: %NODE_VER%
echo   ✓ npm: %NPM_VER%

echo.
echo [Step 4/10] Navigating to project...
cd /d "%~dp0"
echo   ✓ In: %CD%

echo.
echo [Step 5/10] Cleaning node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules" 2>nul
    echo   ✓ Deleted node_modules
) else (
    echo   ✓ Already clean
)

echo.
echo [Step 6/10] Cleaning package-lock.json...
if exist "package-lock.json" (
    del /f /q "package-lock.json"
    echo   ✓ Deleted package-lock.json
) else (
    echo   ✓ Already clean
)

echo.
echo [Step 7/10] Cleaning npm cache...
call npm cache clean --force >nul 2>&1
echo   ✓ Cache cleaned

echo.
echo [Step 8/10] Installing dependencies...
echo   This will take 2-3 minutes...
call npm install
if %errorLevel% neq 0 (
    echo   ERROR: npm install failed
    pause
    exit /b 1
)
echo   ✓ Dependencies installed

echo.
echo [Step 9/10] Verifying better-sqlite3...
node -e "require('better-sqlite3'); console.log('OK')" >nul 2>&1
if %errorLevel% equ 0 (
    echo   ✓ better-sqlite3 works
) else (
    echo   ⚠ better-sqlite3 may have issues
)

echo.
echo [Step 10/10] Verifying Electron...
if exist "node_modules\electron\dist\electron.exe" (
    echo   ✓ Electron binary present
) else (
    echo   ⚠ Electron binary missing
)

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo To start the app:
echo   npm run dev
echo.
pause
