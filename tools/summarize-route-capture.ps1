[CmdletBinding()]
param(
    [string]$InputPath = "telemetry/route_capture_report.json",
    [string]$OutputPath = "telemetry/route_capture_summary.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputPath -PathType Leaf)) {
    throw "Route capture report not found at $InputPath. Run screenshot capture first."
}

$report = Get-Content -LiteralPath $InputPath -Raw | ConvertFrom-Json
$results = @($report.results)
$failing = @(
    $results | Where-Object {
        $_.status -ne 'ok' -or
        @($_.errors).Count -gt 0 -or
        @($_.failedRequests).Count -gt 0 -or
        @($_.consoleFailures).Count -gt 0
    }
)

$summary = [ordered]@{
    startedAt = $report.startedAt
    finishedAt = $report.finishedAt
    outputDir = $report.outputDir
    screenshotCount = $report.screenshotCount
    routeCount = $report.routeCount
    viewportCount = $report.viewportCount
    repeatCount = $report.repeatCount
    concurrency = $report.concurrency
    failingCaptureCount = $failing.Count
    failingRoutes = @(
        $failing | ForEach-Object {
            [ordered]@{
                viewport = $_.viewport
                route = $_.route
                iteration = $_.iteration
                status = $_.status
                errorCount = @($_.errors).Count
                requestFailureCount = @($_.failedRequests).Count
                consoleFailureCount = @($_.consoleFailures).Count
            }
        }
    )
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Wrote route capture summary to $OutputPath"
