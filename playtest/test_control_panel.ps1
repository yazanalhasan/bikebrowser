param(
    [string]$ProjectRoot = "C:\Users\yazan\bikebrowser"
)

$ErrorActionPreference = "Stop"

$panelPath = Join-Path $ProjectRoot "playtest\open_playtest_control_panel.ps1"
$launcherPath = Join-Path $ProjectRoot "playtest\Open Playtest Control Panel.bat"

if (-not (Test-Path $panelPath)) {
    throw "Missing playtest control panel script: $panelPath"
}

if (-not (Test-Path $launcherPath)) {
    throw "Missing playtest control panel launcher: $launcherPath"
}

$panelSource = Get-Content $panelPath -Raw
$null = [scriptblock]::Create($panelSource)

$requiredLabels = @(
    "Capture Bug Report",
    "Open Live Notes",
    "Open Issue Reports",
    "Open Screenshots",
    "Open Runtime Logs",
    "Open Session State"
)

foreach ($label in $requiredLabels) {
    if ($panelSource -notmatch [regex]::Escape($label)) {
        throw "Control panel is missing button label: $label"
    }
}

Write-Output "playtest control panel test passed"
