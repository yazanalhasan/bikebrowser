# Launcher for OpenClaw with DirectML-accelerated PyTorch via the project venv.
# Run from the project root:
#   .\run_openclaw_fast.ps1
#
# All env vars below are set with $env: so they are session-scoped to THIS
# PowerShell process. They do NOT leak to other projects, other terminals,
# or future sessions. Contrast with `setx`, which writes to the user
# environment in the registry and persists globally.

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# --- CPU / NUMPY / MKL THREADING ---
# 8 = physical core count on this machine (Ryzen 7 5700: 8 physical / 16 logical).
# MKL / OpenBLAS / OMP typically perform best when matched to physical cores;
# using the logical count (16) risks SMT oversubscription on dense linear algebra.
# Override per-run by setting $env:OMP_NUM_THREADS before calling this script.
$env:OMP_NUM_THREADS      = "8"
$env:MKL_NUM_THREADS      = "8"
$env:OPENBLAS_NUM_THREADS = "8"
$env:NUMEXPR_NUM_THREADS  = "8"

# --- PERFORMANCE / IO ---
$env:OPENCLAW_BUFFER_SIZE = "104857600"   # 100 MiB IO buffer
$env:OPENCLAW_AUTO_SCAN   = "0"

# --- OPENCLAW PARALLELISM / DEVICE ---
$env:OPENCLAW_ASYNC             = "1"
$env:OPENCLAW_WORKERS           = "6"
$env:OPENCLAW_PIPELINE_PARALLEL = "1"
$env:OPENCLAW_MMAP              = "1"
$env:OPENCLAW_LAZY_LOAD         = "1"
$env:OPENCLAW_LOG_LEVEL         = "ERROR"
$env:OPENCLAW_DEVICE            = "directml"

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Error "venv python not found at $venvPython. Recreate the venv from Python 3.12."
    exit 1
}

# Sanity check: prove we are on the venv interpreter and DirectML is reachable.
# Fast-fail if the env is broken before we try to launch anything heavier.
& $venvPython -c "import sys, torch, torch_directml; print('Using Python:', sys.executable); print('torch:', torch.__version__); print('directml device:', torch_directml.device(), '-', torch_directml.device_name(0))"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- LAUNCH (High priority, PS 5.1-compatible) ---
# Windows PowerShell 5.1's Start-Process has NO -Priority parameter; that lives
# in PowerShell 7+. The 5.1-compatible pattern is: launch with -PassThru, then
# set PriorityClass on the returned process object.
#
# TEMP test command: runs a one-liner that imports torch_directml to prove the
# env is wired up. Replace $script with the real OpenClaw entry point when it
# exists in this repo (OpenClaw is NOT currently present in bikebrowser/).
# Examples once it lands:
#   $script = "-m openclaw <args>"
#   $script = ".\path\to\openclaw_main.py <args>"
$script = "-c `"import torch_directml; print('DirectML OK')`""

$p = Start-Process -FilePath $venvPython -ArgumentList $script -PassThru

# Set priority AFTER launch (PS 5.1 has no -Priority on Start-Process).
(Get-Process -Id $p.Id).PriorityClass = 'High'
