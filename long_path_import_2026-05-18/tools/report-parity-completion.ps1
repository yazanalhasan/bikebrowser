param(
    [Parameter(Mandatory = $true)] [ValidateSet('passed', 'failed')] [string]$Result,
    [string[]]$Details = @(),
    [hashtable]$Metrics = @{}
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$reporter = Join-Path $repoRoot 'tools\send-openclaw-report.ps1'
if (-not (Test-Path $reporter)) {
    throw 'BikeBrowser OpenClaw report helper is missing.'
}

$status = if ($Result -eq 'passed') { 'Parity check passed.' } else { 'Parity check failed.' }
& $reporter -NotificationType 'parity_summary' -Title 'BikeBrowser Parity' -Status $status -Details $Details -Metrics $Metrics -Strict
