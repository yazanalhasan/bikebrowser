$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logsDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$startupLog = Join-Path $logsDir 'startup.log'
$apiLog = Join-Path $logsDir 'api.log'
$devLog = Join-Path $logsDir 'dev.log'
$tunnelOutLog = Join-Path $logsDir 'tunnel.out.log'
$tunnelErrLog = Join-Path $logsDir 'tunnel.err.log'

function Write-StartupLog {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  $line = "$(Get-Date -Format o) $Message"
  $line | Out-File -FilePath $startupLog -Append -Encoding utf8
  Write-Host $Message
}

function Wait-ForHttp($url, $timeoutSec = 30) {
  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($timeoutSec)) {
    try {
      Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null
      return $true
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  return $false
}

function Get-HttpStatusCode {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [hashtable]$Headers
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -Headers $Headers -TimeoutSec 2 -ErrorAction Stop
    return [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      return [int]$_.Exception.Response.StatusCode
    }

    return $null
  }
}

function Is-ApiStatusHealthy {
  param(
    [int]$StatusCode
  )

  # API health routes are auth-protected; 401 still proves the API is running.
  return $StatusCode -eq 200 -or $StatusCode -eq 401
}

function Wait-ForApiHealth($timeoutSec = 30) {
  $keys = @()
  if ($env:API_KEY) {
    $keys += $env:API_KEY
  }

  $envFile = Join-Path $repoRoot '.env'
  if (Test-Path $envFile) {
    $apiKeyLine = Select-String -Path $envFile -Pattern '^API_KEY=' | Select-Object -First 1
    if ($apiKeyLine) {
      $parsedKey = ($apiKeyLine.Line -replace '^API_KEY=', '').Trim().Trim('"')
      if ($parsedKey) {
        $keys += $parsedKey
      }
    }
  }

  $keys += 'dev-local-key'
  $keys = $keys | Select-Object -Unique

  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($timeoutSec)) {
    $status = Get-HttpStatusCode -Url 'http://localhost:3001/health'
    if (Is-ApiStatusHealthy $status) {
      return $true
    }

    foreach ($candidateKey in $keys) {
      $status = Get-HttpStatusCode -Url 'http://localhost:3001/api/health' -Headers @{ 'x-api-key' = $candidateKey }
      if (Is-ApiStatusHealthy $status) {
        return $true
      }
    }

    Start-Sleep -Seconds 1
  }

  return $false
}

Write-StartupLog '[BOOT] Starting BikeBrowser stack'

$apiPort = 3001
$portLines = netstat -ano |
  Select-String ":$apiPort" |
  Where-Object { $_.Line -match 'LISTENING' }
$skipApiStart = $false

if ($portLines) {
  Write-StartupLog "[BOOT] Port $apiPort already in use"
  if (Wait-ForApiHealth 8) {
    Write-StartupLog '[API] Existing API instance is healthy - reusing'
    $skipApiStart = $true
  } else {
    $stalePids = $portLines |
      ForEach-Object { ($_ -split '\s+')[-1] } |
      Where-Object { $_ -match '^\d+$' -and $_ -ne '0' } |
      Select-Object -Unique

    foreach ($stalePid in $stalePids) {
      try {
        taskkill /PID $stalePid /F | Out-Null
        Write-StartupLog "[API] Killed stale process on port $apiPort (PID $stalePid)"
      } catch {
        Write-StartupLog "[WARN] Could not kill PID ${stalePid}: $($_.Exception.Message)"
      }
    }
  }
}

if (-not $skipApiStart) {
  Write-StartupLog '[API] Starting API server process'
  Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    "Set-Location '$repoRoot'; npm run server *> '$apiLog'"
  )
}

if (-not (Wait-ForApiHealth 90)) {
  Write-StartupLog '[ERROR] API not ready'
  exit 1
}
Write-StartupLog '[OK] API healthy'

Write-StartupLog '[WEB] Starting Vite frontend'
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "Set-Location '$repoRoot'; npm run dev:react *> '$devLog'"
)

if (-not (Wait-ForHttp 'http://localhost:5173' 45)) {
  Write-StartupLog '[ERROR] Frontend not ready'
  exit 1
}
Write-StartupLog '[OK] Frontend healthy'

Write-StartupLog '[TUNNEL] Cleaning stale cloudflared processes'
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$tunnelExe = 'C:\Program Files\Cloudflare\cloudflared.exe'
if (-not (Test-Path $tunnelExe)) {
  $tunnelExe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
}
if (-not (Test-Path $tunnelExe)) {
  $commandCloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($commandCloudflared) {
    $tunnelExe = $commandCloudflared.Source
  }
}

if (-not (Test-Path $tunnelExe)) {
  Write-StartupLog '[WARN] cloudflared.exe not found - skipping tunnel (app will work on local network only)'
} else {
  $tunnelStarted = $false
  for ($i = 0; $i -lt 3; $i++) {
    $attempt = $i + 1
    Write-StartupLog "[TUNNEL] Starting cloudflared (attempt $attempt/3)"

    try {
      $proc = Start-Process -FilePath $tunnelExe `
        -ArgumentList 'tunnel run bikebrowser' `
        -NoNewWindow `
        -RedirectStandardOutput $tunnelOutLog `
        -RedirectStandardError $tunnelErrLog `
        -PassThru

      Write-StartupLog "[TUNNEL] Launch command sent (PID $($proc.Id))"
    } catch {
      Write-StartupLog "[WARN] Tunnel launch command failed on attempt ${attempt}: $($_.Exception.Message)"
      Start-Sleep -Seconds 2
      continue
    }

    Start-Sleep -Seconds 5

    if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) {
      Write-StartupLog "[OK] Tunnel running (PID $($proc.Id))"
      $tunnelStarted = $true
      break
    }

    Write-StartupLog '[WARN] Tunnel failed, retrying...'
  }

  if (-not $tunnelStarted) {
    Write-StartupLog '[WARN] Tunnel failed to start - app will work on local network only'
  }
}

Write-StartupLog '[OK] BikeBrowser stack launched'
