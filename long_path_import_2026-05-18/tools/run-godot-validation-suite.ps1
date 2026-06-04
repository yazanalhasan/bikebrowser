$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$reporter = Join-Path $repoRoot 'tools\send-openclaw-report.ps1'
$godot = Get-Command godot -ErrorAction SilentlyContinue
if (-not $godot) {
    throw 'Godot executable not found on PATH.'
}

$checks = @(
    'res://project_audit/runtime_repair_smoke.gd',
    'res://tests/vertical_slice_check.gd',
    'res://tests/brake_rig_state_check.gd',
    'res://tests/chain_rig_state_check.gd',
    'res://tests/chain_hotspot_embodied_check.gd',
    'res://tests/interaction_overlap_check.gd'
)

$passed = @()

try {
    foreach ($check in $checks) {
        & $godot.Source --headless --path (Join-Path $repoRoot 'BikeBrowserWorld') --script $check
        if ($LASTEXITCODE -ne 0) {
            throw "Validation failed: $check"
        }
        $passed += $check
    }

    if (Test-Path $reporter) {
        & $reporter -NotificationType 'validation_summary' -Title 'BikeBrowser Validation Suite' -Status 'Validation suite passed.' -Details @('All scheduled Godot validation checks completed successfully.') -Metrics @{ checks_passed = $passed.Count }
    }
}
catch {
    if (Test-Path $reporter) {
        & $reporter -NotificationType 'critical_runtime_failure' -Title 'BikeBrowser Validation Suite' -Status 'Validation suite failed.' -Details @($_.Exception.Message) -Metrics @{ checks_passed = $passed.Count }
    }
    throw
}
