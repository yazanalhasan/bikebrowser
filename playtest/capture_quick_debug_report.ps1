param(
    [string]$ProjectRoot = "C:\Users\yazan\bikebrowser"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$playtestRoot = Join-Path $ProjectRoot "playtest"
$issueDir = Join-Path $playtestRoot "issue_reports"
$screenshotDir = Join-Path $playtestRoot "screenshots"
$logDir = Join-Path $playtestRoot "logs"
$sessionPath = Join-Path $playtestRoot "active_session\session_state.json"

New-Item -ItemType Directory -Force -Path $issueDir, $screenshotDir, $logDir | Out-Null

function Show-DescriptionPrompt {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Quick Debug Note"
    $form.Width = 520
    $form.Height = 260
    $form.StartPosition = "CenterScreen"
    $form.TopMost = $true

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Tell me what feels wrong. I will infer severity, ownership, and similar-risk areas."
    $label.Left = 16
    $label.Top = 14
    $label.Width = 470
    $label.Height = 36
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Left = 16
    $textBox.Top = 56
    $textBox.Width = 470
    $textBox.Height = 105
    $textBox.Multiline = $true
    $textBox.ScrollBars = "Vertical"
    $form.Controls.Add($textBox)

    $ok = New-Object System.Windows.Forms.Button
    $ok.Text = "Save Debug Note"
    $ok.Left = 276
    $ok.Top = 174
    $ok.Width = 130
    $ok.Height = 32
    $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.AcceptButton = $ok
    $form.Controls.Add($ok)

    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = "Cancel"
    $cancel.Left = 414
    $cancel.Top = 174
    $cancel.Width = 72
    $cancel.Height = 32
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.CancelButton = $cancel
    $form.Controls.Add($cancel)

    $result = $form.ShowDialog()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        return ""
    }
    return $textBox.Text.Trim()
}

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

function Infer-Severity {
    param([string]$Description)
    $text = $Description.ToLowerInvariant()
    if ($text -match "crash|stuck|can't continue|cannot continue|blocked|freeze|softlock|teleport") { return "p1" }
    if ($text -match "quest|dialogue|voice|can't hear|wrong|broken|confusing|covers|missing") { return "p2" }
    return "p3"
}

function Infer-Lane {
    param([string]$Description)
    $text = $Description.ToLowerInvariant()
    if ($text -match "voice|audio|hear|volume|music|sound") { return "lane7-audio" }
    if ($text -match "dialogue|npc|mrs|chen|ramirez|character") { return "lane8-npcs" }
    if ($text -match "garage|rug|workbench|repair") { return "lane3-garage" }
    if ($text -match "bike|wheel|chain|tire") { return "lane1-bike" }
    if ($text -match "hud|ui|button|prompt|overlay") { return "lane5-ui" }
    if ($text -match "camera|movement|feel|control|space") { return "lane6-gamefeel" }
    if ($text -match "story|prop|clutter|detail") { return "lane4-storytelling" }
    if ($text -match "street|neighborhood|environment|lighting") { return "lane2-foundation" }
    return "lane9-integration"
}

$description = Show-DescriptionPrompt
if ([string]::IsNullOrWhiteSpace($description)) {
    Write-Output "Quick debug note cancelled."
    exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportId = "quick_debug_$timestamp"
$screenshotPath = Join-Path $screenshotDir "$reportId.png"
$reportPath = Join-Path $issueDir "$reportId.md"
$jsonPath = Join-Path $issueDir "$reportId.json"
$session = Read-SessionState -Path $sessionPath

try {
    Capture-DesktopScreenshot -Path $screenshotPath
} catch {
    $screenshotPath = ""
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
    $tail = Read-Tail -Path $candidate -Count 50
    if (-not [string]::IsNullOrWhiteSpace($tail)) {
        $consoleExcerpt += "`n--- $candidate ---`n$tail`n"
    }
}

$runtimeTail = Read-Tail -Path $runtimeLogPath -Count 120
$severity = Infer-Severity -Description $description
$likelyLane = Infer-Lane -Description $description
$scene = if ($session) { [string]$session.currentScene } else { "unknown" }
$quest = if ($session) { [string]$session.currentQuest } else { "unknown" }
$npc = if ($session) { [string]$session.recentNpc } else { "unknown" }
$interaction = if ($session) { [string]$session.recentInteraction } else { "unknown" }

$report = [ordered]@{
    id = $reportId
    timestamp = (Get-Date).ToString("o")
    screenshotPath = $screenshotPath
    currentScene = $scene
    currentQuest = $quest
    currentNpc = $npc
    currentInteraction = $interaction
    severity = $severity
    reproducibility = "unknown"
    emotionalNote = "quick_debug"
    bugDescription = $description
    likelyLaneOwnership = $likelyLane
    sessionStatePath = $sessionPath
    runtimeLogTail = $runtimeTail
    consoleExcerpt = $consoleExcerpt
    triageInstruction = "Codex should infer root cause, severity, ownership, similar bugs, and follow-up questions only if absolutely necessary."
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

$markdown = @"
# Quick Debug Report - $reportId

## Context

- Timestamp: $($report.timestamp)
- Screenshot: $screenshotPath
- Current scene: $scene
- Current quest: $quest
- Current NPC: $npc
- Current interaction: $interaction
- Inferred severity: $severity
- Inferred lane ownership: $likelyLane

## User Description

$description

## Codex Triage Instruction

Infer the nature of the problem, severity, ownership, similar-risk areas, and likely fix path. Ask follow-up questions only if the issue cannot be investigated from captured context.

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
    } catch {}
}

[System.Windows.Forms.MessageBox]::Show("Quick debug note saved:`n$reportPath", "BikeBrowser Live Playtest") | Out-Null
Write-Output "Quick debug report saved: $reportPath"
