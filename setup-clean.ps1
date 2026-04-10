# Clean Environment Setup Script
Write-Host "=== Node.js Environment Setup ===" -ForegroundColor Cyan

# Step 1: Verify Node is installed
Write-Host "`n[1/6] Checking Node.js..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

try {
    $nodeVersion = & node --version 2>&1
    $npmVersion = & npm --version 2>&1
    Write-Host "  ✓ Node: $nodeVersion" -ForegroundColor Green
    Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
    
    if ($nodeVersion -notlike "v20.*") {
        Write-Host "  ⚠ WARNING: Node version is not v20.x!" -ForegroundColor Red
        Write-Host "  Please install Node 20 from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please complete Node.js v20 installation first" -ForegroundColor Red
    exit 1
}

# Step 2: Clean node_modules
Write-Host "`n[2/6] Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    try {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        Write-Host "  ✓ Deleted node_modules" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Failed to delete node_modules: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ node_modules already clean" -ForegroundColor Green
}

# Step 3: Clean package-lock.json
Write-Host "`n[3/6] Cleaning package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "  ✓ Deleted package-lock.json" -ForegroundColor Green
} else {
    Write-Host "  ✓ package-lock.json already clean" -ForegroundColor Green
}

# Step 4: Clean npm cache
Write-Host "`n[4/6] Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "  ✓ Cache cleaned" -ForegroundColor Green

# Step 5: Install dependencies
Write-Host "`n[5/6] Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "  Watching for build tools warnings..." -ForegroundColor Cyan

$installOutput = npm install 2>&1 | Tee-Object -Variable output

# Check if node-gyp tried to build
if ($output -match "node-gyp" -and $output -match "rebuild") {
    Write-Host "`n  ⚠ WARNING: node-gyp attempted to build from source!" -ForegroundColor Red
    Write-Host "  This should use prebuilt binaries with Node 20" -ForegroundColor Red
}

if ($output -match "added \d+ packages") {
    Write-Host "  ✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Installation may have issues - check output above" -ForegroundColor Yellow
}

# Step 6: Verify critical modules
Write-Host "`n[6/6] Verifying critical modules..." -ForegroundColor Yellow

# Check better-sqlite3
try {
    node -e "require('better-sqlite3'); console.log('OK')" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ better-sqlite3 loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ better-sqlite3 failed to load" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ better-sqlite3 test failed" -ForegroundColor Red
}

# Check Electron
if (Test-Path "node_modules\electron\dist\electron.exe") {
    Write-Host "  ✓ Electron binary present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Electron binary missing" -ForegroundColor Red
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "`nTo start the app, run:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow

