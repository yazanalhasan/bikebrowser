param(
    [string]$ProjectRoot = "C:\Users\yazan\bikebrowser",
    [string]$Scene = "",
    [string]$Quest = "",
    [string]$Npc = "",
    [string]$Interaction = "",
    [string]$Severity = "",
    [string]$Reproducibility = ""
)

$ErrorActionPreference = "Stop"

$playtestRoot = Join-Path $ProjectRoot "playtest"
$issueDir = Join-Path $playtestRoot "issue_reports"
$screenshotDir = Join-Path $playtestRoot "screenshots"
$logDir = Join-Path $playtestRoot "logs"
$sessionPath = Join-Path $playtestRoot "active_session\session_state.json"

New-Item -ItemType Directory -Force -Path $issueDir, $screenshotDir, $logDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportId = "issue_$timestamp"
$screenshotPath = Join-Path $screenshotDir "$reportId.png"
$reportPath = Join-Path $issueDir "$reportId.md"
$jsonPath = Join-Path $issueDir "$reportId.json"

function Read-SessionState {
    param([string]$Path)
    if (Test-Path $Path) {
        try {
            return Get-Content $Path -Raw | ConvertFrom-Json
        } catch {
            return $null
        }
    }
    return $null
}

function Capture-DesktopScreenshot {
    param([string]$Path)
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

function Read-Tail {
    param([string]$Path, [int]$Count = 80)
    if (Test-Path $Path) {
        return (Get-Content $Path -Tail $Count) -join "`n"
    }
    return ""
}

$session = Read-SessionState -Path $sessionPath

if ([string]::IsNullOrWhiteSpace($Scene) -and $session) { $Scene = [string]$session.currentScene }
if ([string]::IsNullOrWhiteSpace($Quest) -and $session) { $Quest = [string]$session.currentQuest }
if ([string]::IsNullOrWhiteSpace($Npc) -and $session) { $Npc = [string]$session.recentNpc }
if ([string]::IsNullOrWhiteSpace($Interaction) -and $session) { $Interaction = [string]$session.recentInteraction }

if ([string]::IsNullOrWhiteSpace($Severity)) {
    $Severity = Read-Host "Severity (P0/P1/P2/P3)"
}
if ([string]::IsNullOrWhiteSpace($Reproducibility)) {
    $Reproducibility = Read-Host "Reproducibility (always/sometimes/once/unknown)"
}
$emotionalNote = Read-Host "Emotional reaction (warmth/confusion/overwork/prototype/etc.)"
$bugDescription = Read-Host "Bug or observation description"
$likelyLane = Read-Host "Likely lane ownership (lane1-bike/lane3-garage/etc., or unknown)"

try {
    Capture-DesktopScreenshot -Path $screenshotPath
} catch {
    $screenshotPath = ""
    Write-Warning "Desktop screenshot capture failed: $($_.Exception.Message)"
}

$runtimeLogPath = Join-Path $logDir "runtime_live.log"
$consoleLogCandidates = @(
    (Join-Path $ProjectRoot "dev.log"),
    (Join-Path $ProjectRoot ".codex-vite.log"),
    (Join-Path $ProjectRoot ".codex-vite.err.log"),
    $runtimeLogPath
)

$consoleExcerpt = ""
foreach ($candidate in $consoleLogCandidates) {
    $tail = Read-Tail -Path $candidate -Count 60
    if (-not [string]::IsNullOrWhiteSpace($tail)) {
        $consoleExcerpt += "`n--- $candidate ---`n$tail`n"
    }
}

$runtimeTail = Read-Tail -Path $runtimeLogPath -Count 120

$report = [ordered]@{
    id = $reportId
    timestamp = (Get-Date).ToString("o")
    screenshotPath = $screenshotPath
    currentScene = $Scene
    currentQuest = $Quest
    currentNpc = $Npc
    currentInteraction = $Interaction
    severity = $Severity
    reproducibility = $Reproducibility
    emotionalNote = $emotionalNote
    bugDescription = $bugDescription
    likelyLaneOwnership = $likelyLane
    sessionStatePath = $sessionPath
    runtimeLogTail = $runtimeTail
    consoleExcerpt = $consoleExcerpt
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

$markdown = @"
# Playtest Issue Report - $reportId

## Context

- Timestamp: $($report.timestamp)
- Screenshot: $screenshotPath
- Current scene: $Scene
- Current quest: $Quest
- Current NPC: $Npc
- Current interaction: $Interaction
- Severity: $Severity
- Reproducibility: $Reproducibility
- Likely lane ownership: $likelyLane

## Emotional Note

$emotionalNote

## Bug / Observation

$bugDescription

## Runtime Log Tail

````text
$runtimeTail
````

## Console Excerpt

````text
$consoleExcerpt
````

## Session State

````json
$(if ($session) { $session | ConvertTo-Json -Depth 8 } else { "{}" })
````
"@

$markdown | Set-Content -Path $reportPath -Encoding UTF8

if (Test-Path $sessionPath) {
    try {
        $state = Get-Content $sessionPath -Raw | ConvertFrom-Json
        $state.lastBugReportPath = $reportPath
        $state.lastScreenshotPath = $screenshotPath
        $state.runtimeTimestamp = (Get-Date).ToString("o")
        $state | ConvertTo-Json -Depth 8 | Set-Content -Path $sessionPath -Encoding UTF8
    } catch {
        Write-Warning "Could not update session state: $($_.Exception.Message)"
    }
}

Write-Output "Issue report saved: $reportPath"
Write-Output "Structured JSON saved: $jsonPath"
if (-not [string]::IsNullOrWhiteSpace($screenshotPath)) {
    Write-Output "Screenshot saved: $screenshotPath"
}
