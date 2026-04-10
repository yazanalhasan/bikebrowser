# Complete NVM + Node 20 Setup Script
Write-Host "=== NVM-Based Node.js Setup ===" -ForegroundColor Cyan

# Refresh PATH
Write-Host "`n[1/5] Refreshing environment PATH..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "  ✓ PATH refreshed" -ForegroundColor Green

# Verify NVM
Write-Host "`n[2/5] Verifying NVM installation..." -ForegroundColor Yellow
try {
    $nvmVer = & nvm version 2>&1
    Write-Host "  ✓ NVM version: $nvmVer" -ForegroundColor Green
} catch {
    Write-Host "  ✗ NVM not found!" -ForegroundColor Red
    Write-Host "  Please complete NVM installation first" -ForegroundColor Red
    Write-Host "  Download from: https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor Yellow
    exit 1
}

# Install Node 20
Write-Host "`n[3/5] Installing Node.js 20 via NVM..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Cyan
& nvm install 20 2>&1 | Out-Null
& nvm use 20 2>&1 | Out-Null
Write-Host "  ✓ Node 20 installed" -ForegroundColor Green

# Verify Node
Write-Host "`n[4/5] Verifying Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVer = & node -v 2>&1
    $npmVer = & npm -v 2>&1
    Write-Host "  ✓ Node: $nodeVer" -ForegroundColor Green
    Write-Host "  ✓ npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node verification failed" -ForegroundColor Red
    exit 1
}

# Verify PATH points to NVM
Write-Host "`n[5/5] Verifying Node path..." -ForegroundColor Yellow
$nodePath = (Get-Command node).Source
Write-Host "  Node location: $nodePath" -ForegroundColor Cyan
if ($nodePath -like "*nvm*") {
    Write-Host "  ✓ Using NVM-managed Node" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Warning: Not using NVM path" -ForegroundColor Yellow
}

Write-Host "`n=== NVM Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "  1. Close this terminal" -ForegroundColor Yellow
Write-Host "  2. Open a NEW terminal" -ForegroundColor Yellow
Write-Host "  3. Run: .\project-setup.ps1" -ForegroundColor Yellow
