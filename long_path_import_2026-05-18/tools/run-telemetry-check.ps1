$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$reporter = Join-Path $repoRoot 'tools\send-openclaw-report.ps1'
$godot = Get-Command godot -ErrorAction SilentlyContinue
if (-not $godot) {
    throw 'Godot executable not found on PATH.'
}

$env:BIKEBROWSER_PLAYTEST = '1'

try {
    & $godot.Source --headless --path (Join-Path $repoRoot 'BikeBrowserWorld') --script 'res://tests/chain_hotspot_embodied_check.gd'
    if ($LASTEXITCODE -ne 0) {
        throw 'Telemetry capture script failed.'
    }

    if (Test-Path $reporter) {
        & $reporter -NotificationType 'telemetry_summary' -Title 'BikeBrowser Telemetry' -Status 'Telemetry capture complete.' -Details @('Playtest telemetry was written successfully.')
    }
}
catch {
    if (Test-Path $reporter) {
        & $reporter -NotificationType 'critical_runtime_failure' -Title 'BikeBrowser Telemetry' -Status 'Telemetry capture failed.' -Details @($_.Exception.Message)
    }
    throw
}
