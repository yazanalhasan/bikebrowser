[CmdletBinding()]
param(
    [string]$ComfyRoot = "C:\AI\ComfyUI",
    [int]$Port = 8188,
    [switch]$DisableXformers
)

$ErrorActionPreference = "Stop"

$python = Join-Path $ComfyRoot "venv\Scripts\python.exe"
$main = Join-Path $ComfyRoot "main.py"

if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
    throw "ComfyUI Python was not found at $python"
}

if (-not (Test-Path -LiteralPath $main -PathType Leaf)) {
    throw "ComfyUI main.py was not found at $main"
}

$existing = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "ComfyUI already appears to be listening on port $Port."
    exit 0
}

$arguments = @("main.py", "--listen", "127.0.0.1", "--port", "$Port")
if ($DisableXformers) {
    $arguments += "--disable-xformers"
}

Start-Process `
    -FilePath $python `
    -ArgumentList $arguments `
    -WorkingDirectory $ComfyRoot `
    -RedirectStandardOutput (Join-Path $ComfyRoot "bikebrowser-comfyui-run.log") `
    -RedirectStandardError (Join-Path $ComfyRoot "bikebrowser-comfyui-run.err.log") `
    -WindowStyle Hidden

Write-Host "Started ComfyUI at http://127.0.0.1:$Port"
