[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [string]$Status,

    [Parameter(Mandatory = $false)]
    [string[]]$Details = @(),

    [Parameter(Mandatory = $false)]
    [string]$Project = "BikeBrowser",

    [Parameter(Mandatory = $false)]
    [string]$NotificationType = "openclaw_governance_summary",

    [Parameter(Mandatory = $false)]
    [string]$Source = "bikebrowser-openclaw-report",

    [Parameter(Mandatory = $false)]
    [string]$OpenClawRoot = "C:\OpenClaw"
)

$ErrorActionPreference = "Stop"

$notifier = Join-Path $OpenClawRoot "integrations\telegram\telegram_notifier.py"
$envPath = Join-Path $OpenClawRoot ".env.telegram"

if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw "Telegram environment file was not found at the expected path."
}

if (-not (Test-Path -LiteralPath $notifier -PathType Leaf)) {
    throw "Telegram notifier script was not found at the expected path."
}

$summary = [ordered]@{
    notification_type = $NotificationType
    title = $Title
    project = $Project
    status = $Status
    details = @($Details)
    metrics = [ordered]@{
        timestamp_utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        report_only = "true"
        commands_enabled = "false"
        mutations_enabled = "false"
    }
    source = $Source
}

$summaryPath = Join-Path ([System.IO.Path]::GetTempPath()) ("openclaw-telegram-report-{0}.json" -f ([guid]::NewGuid().ToString("N")))

try {
    $summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $summaryPath -Encoding UTF8
    & python $notifier --env $envPath --summary-json $summaryPath
    exit $LASTEXITCODE
}
finally {
    if (Test-Path -LiteralPath $summaryPath) {
        Remove-Item -LiteralPath $summaryPath -Force
    }
}
