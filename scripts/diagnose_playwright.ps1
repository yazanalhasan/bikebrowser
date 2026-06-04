param(
  [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = "Continue"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$OutDir = Join-Path $Root "artifacts\playwright_audit"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Invoke-WithWatchdog {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$StdoutPath,
    [Parameter(Mandatory = $true)][string]$StderrPath,
    [int]$Timeout = 300
  )

  $process = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList @("/c", $Command) `
    -WorkingDirectory $Root `
    -NoNewWindow `
    -RedirectStandardOutput $StdoutPath `
    -RedirectStandardError $StderrPath `
    -PassThru

  if (-not $process.WaitForExit($Timeout * 1000)) {
    try {
      taskkill /PID $process.Id /T /F | Out-Null
    } catch {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    try {
      $process.WaitForExit(5000) | Out-Null
      Start-Sleep -Milliseconds 300
      "TIMEOUT after ${Timeout}s: $Command" | Add-Content -Path $StdoutPath
    } catch {
      "TIMEOUT after ${Timeout}s: $Command" | Set-Content -Path "$StdoutPath.timeout.txt"
    }
    return 124
  }

  if ($null -eq $process.ExitCode) {
    return 1
  }
  return $process.ExitCode
}

$listOut = Join-Path $OutDir "test_list.txt"
$listErr = Join-Path $OutDir "test_list_error.txt"
$lineOut = Join-Path $OutDir "full_run_line_output.txt"
$lineErr = Join-Path $OutDir "full_run_line_error.txt"
$jsonOut = Join-Path $OutDir "full_run_results.json"
$jsonErr = Join-Path $OutDir "full_run_json_error.txt"
$report = Join-Path $OutDir "hanging_test_report.md"

$listExit = Invoke-WithWatchdog "npx playwright test --list" $listOut $listErr 90
if ($listExit -ne 0 -and (Test-Path $listOut) -and (Select-String -Path $listOut -Pattern "^Total:" -Quiet)) {
  $listExit = 0
}
$lineExit = Invoke-WithWatchdog "npx playwright test --reporter=line" $lineOut $lineErr $TimeoutSeconds
$jsonExit = Invoke-WithWatchdog "npx playwright test --reporter=json" $jsonOut $jsonErr $TimeoutSeconds

$lineTail = ""
if (Test-Path $lineOut) {
  $lineTail = (Get-Content -Path $lineOut -Tail 80) -join "`n"
}

$body = @"
# Playwright Diagnostic Report

Generated: $(Get-Date -Format o)

## Commands

| Command | Exit |
| --- | ---: |
| npx playwright test --list | $listExit |
| npx playwright test --reporter=line | $lineExit |
| npx playwright test --reporter=json | $jsonExit |

## Interpretation

- Exit code 124 means the watchdog killed the command after the configured timeout.
- Targeted BikeBrowser validation should use explicit spec paths rather than broad `npx playwright test`.
- Full-suite diagnostics are useful for triage, but they should not block TARGETED execution packages.

## Recent Full-Run Output

````text
$lineTail
````

## Artifacts

- test_list.txt
- full_run_line_output.txt
- full_run_line_error.txt
- full_run_results.json
- full_run_json_error.txt
"@

Set-Content -Path $report -Value $body
Write-Output "Playwright diagnostic artifacts written to $OutDir"
Write-Output "list=$listExit line=$lineExit json=$jsonExit"

if ($lineExit -eq 124 -or $jsonExit -eq 124) {
  exit 124
}

if ($listExit -ne 0 -or $lineExit -ne 0 -or $jsonExit -ne 0) {
  exit 1
}

exit 0
