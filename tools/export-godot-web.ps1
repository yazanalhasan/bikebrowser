# Re-export BikeBrowserWorld HTML5 build into public/godot/BikeBrowserWorld/.
# Reversible: only writes inside public/godot/BikeBrowserWorld/.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $repoRoot 'BikeBrowserWorld'
$outDir = Join-Path $repoRoot 'public\godot\BikeBrowserWorld'
$outIndex = Join-Path $outDir 'index.html'

$godot = $null
$candidates = @(
    'godot',
    "$env:USERPROFILE\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe",
    "$env:USERPROFILE\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64.exe"
)
foreach ($c in $candidates) {
    $resolved = Get-Command $c -ErrorAction SilentlyContinue
    if ($resolved) { $godot = $resolved.Source; break }
}
if (-not $godot) {
    Write-Error "Godot 4.6 not found. Tried: $($candidates -join ', ')"
    exit 1
}

Write-Host "Using Godot: $godot"
Write-Host "Exporting BikeBrowserWorld -> $outIndex"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Preset name "Web Single Threaded" comes from BikeBrowserWorld/export_presets.cfg.
& $godot --headless --path "$projectPath" --export-release "Web Single Threaded" "$outIndex"
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Error "Godot export failed (exit $exitCode)"
    exit $exitCode
}

$sha = (& git -C "$repoRoot" rev-parse HEAD).Trim()
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$version = [ordered]@{
    git_sha       = $sha
    exported_at   = $timestamp
    godot_exe     = $godot
    project_path  = 'BikeBrowserWorld'
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $outDir 'version.json') -Value $version -Encoding utf8

Write-Host "Done. version.json: $sha @ $timestamp"
