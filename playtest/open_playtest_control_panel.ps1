param(
    [string]$ProjectRoot = "C:\Users\yazan\bikebrowser"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$playtestRoot = Join-Path $ProjectRoot "playtest"
$bugScript = Join-Path $playtestRoot "capture_bug_report.ps1"
$quickDebugScript = Join-Path $playtestRoot "capture_quick_debug_report.ps1"
$notesPath = Join-Path $playtestRoot "emotional_notes\live_notes.md"
$issuesPath = Join-Path $playtestRoot "issue_reports"
$screenshotsPath = Join-Path $playtestRoot "screenshots"
$logsPath = Join-Path $playtestRoot "logs"
$sessionPath = Join-Path $playtestRoot "active_session\session_state.json"

New-Item -ItemType Directory -Force -Path $issuesPath, $screenshotsPath, $logsPath, (Split-Path $sessionPath) | Out-Null

function Open-Path {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        [System.Windows.Forms.MessageBox]::Show("Path not found:`n$Path", "Playtest Control Panel") | Out-Null
        return
    }
    Start-Process -FilePath $Path
}

function Run-BugCapture {
    if (-not (Test-Path $bugScript)) {
        [System.Windows.Forms.MessageBox]::Show("Bug capture script not found:`n$bugScript", "Playtest Control Panel") | Out-Null
        return
    }
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "`"$bugScript`"",
        "-ProjectRoot",
        "`"$ProjectRoot`""
    )
}

function Run-QuickDebugCapture {
    if (-not (Test-Path $quickDebugScript)) {
        [System.Windows.Forms.MessageBox]::Show("Quick debug script not found:`n$quickDebugScript", "Playtest Control Panel") | Out-Null
        return
    }
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "`"$quickDebugScript`"",
        "-ProjectRoot",
        "`"$ProjectRoot`""
    )
}

function New-Button {
    param(
        [string]$Text,
        [int]$Top,
        [scriptblock]$OnClick
    )
    $button = New-Object System.Windows.Forms.Button
    $button.Text = $Text
    $button.Left = 20
    $button.Top = $Top
    $button.Width = 300
    $button.Height = 36
    $button.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $button.Add_Click($OnClick)
    return $button
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "BikeBrowser Live Playtest"
$form.Width = 360
$form.Height = 410
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $true

$title = New-Object System.Windows.Forms.Label
$title.Text = "Live Playtest Controls"
$title.Left = 20
$title.Top = 18
$title.Width = 300
$title.Height = 28
$title.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = "Use Quick Debug for one-sentence bug capture."
$hint.Left = 22
$hint.Top = 48
$hint.Width = 300
$hint.Height = 22
$hint.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.Controls.Add($hint)

$form.Controls.Add((New-Button -Text "Quick Debug Note" -Top 82 -OnClick { Run-QuickDebugCapture }))
$form.Controls.Add((New-Button -Text "Full Bug Report" -Top 124 -OnClick { Run-BugCapture }))
$form.Controls.Add((New-Button -Text "Open Live Notes" -Top 166 -OnClick { Open-Path $notesPath }))
$form.Controls.Add((New-Button -Text "Open Issue Reports" -Top 208 -OnClick { Open-Path $issuesPath }))
$form.Controls.Add((New-Button -Text "Open Screenshots" -Top 250 -OnClick { Open-Path $screenshotsPath }))
$form.Controls.Add((New-Button -Text "Open Runtime Logs" -Top 292 -OnClick { Open-Path $logsPath }))
$form.Controls.Add((New-Button -Text "Open Session State" -Top 334 -OnClick { Open-Path $sessionPath }))

[void]$form.ShowDialog()
