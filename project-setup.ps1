# Project Clean Install Script
Write-Host "=== BikeBrowser Project Setup ===" -ForegroundColor Cyan

# Verify Node 20
Write-Host "`n[1/7] Verifying Node.js 20..." -ForegroundColor Yellow
try {
    $nodeVer = & node -v 2>&1
    $npmVer = & npm -v 2>&1
    Write-Host "  Node: $nodeVer" -ForegroundColor Cyan
    Write-Host "  npm: $npmVer" -ForegroundColor Cyan
    
    if ($nodeVer -notlike "v20.*") {
        Write-Host "  ✗ ERROR: Node version must be 20.x!" -ForegroundColor Red
        Write-Host "  Run: nvm use 20" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✓ Node 20 confirmed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node not found!" -ForegroundColor Red
    exit 1
}

# Clean node_modules
Write-Host "`n[2/7] Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Deleted node_modules" -ForegroundColor Green
} else {
    Write-Host "  ✓ Already clean" -ForegroundColor Green
}

# Clean package-lock.json
Write-Host "`n[3/7] Cleaning package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Deleted package-lock.json" -ForegroundColor Green
} else {
    Write-Host "  ✓ Already clean" -ForegroundColor Green
}

# Clean npm cache
Write-Host "`n[4/7] Cleaning npm cache..." -ForegroundColor Yellow
& npm cache clean --force 2>&1 | Out-Null
Write-Host "  ✓ Cache cleaned" -ForegroundColor Green

# Install dependencies
Write-Host "`n[5/7] Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This will take 2-3 minutes..." -ForegroundColor Cyan
Write-Host "  Watching for compilation warnings..." -ForegroundColor Cyan

$installStart = Get-Date
$installOutput = & npm install 2>&1 | Tee-Object -Variable npmOutput

$hasGyp = $npmOutput -match "node-gyp.*rebuild"
$hasAdded = $npmOutput -match "added \d+ packages"

if ($hasGyp) {
    Write-Host "  ⚠ WARNING: node-gyp attempted compilation!" -ForegroundColor Red
    Write-Host "  This should use prebuilt binaries" -ForegroundColor Red
}

if ($hasAdded) {
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Install may have issues" -ForegroundColor Yellow
}

$installDuration = ((Get-Date) - $installStart).TotalSeconds
Write-Host "  Time: $([math]::Round($installDuration, 1))s" -ForegroundColor Cyan

# Verify better-sqlite3
Write-Host "`n[6/7] Verifying better-sqlite3..." -ForegroundColor Yellow
$sqliteTest = & node -e "try { require('better-sqlite3'); console.log('OK'); } catch(e) { console.error('FAIL'); process.exit(1); }" 2>&1
if ($sqliteTest -eq "OK") {
    Write-Host "  ✓ better-sqlite3 works" -ForegroundColor Green
} else {
    Write-Host "  ✗ better-sqlite3 failed to load" -ForegroundColor Red
    Write-Host "  Error: $sqliteTest" -ForegroundColor Red
}

# VerifyElectron
Write-Host "`n[7/7] Verifying Electron..." -ForegroundColor Yellow
if (Test-Path "node_modules\electron\dist\electron.exe") {
    Write-Host "  ✓ Electron binary present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Electron binary missing" -ForegroundColor Red
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nTo start the app:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow

Write-Host "`nIf you see errors:" -ForegroundColor White
Write-Host "  - Check that port 5173 is not in use" -ForegroundColor Cyan
Write-Host "  - Look for any CSS/PostCSS warnings (safe to ignore)" -ForegroundColor Cyan
