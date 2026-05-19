param(
    [string]$Preset = $(if ($env:BIKEBROWSER_DEV_EDITOR -eq '1') { 'Web Dev Editor' } else { 'Web Single Threaded' }),
    [string]$OutputDir = ''
)

# Re-export BikeBrowserWorld HTML5 build into public/godot/BikeBrowserWorld/.
# Reversible: only writes inside public/godot/BikeBrowserWorld/.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $repoRoot 'BikeBrowserWorld'
$outDir = if ($OutputDir) { [System.IO.Path]::GetFullPath($OutputDir) } else { Join-Path $repoRoot 'public\godot\BikeBrowserWorld' }
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

$editorAddon = Join-Path $projectPath 'addons\level_editor'
$editorAddonHold = Join-Path $repoRoot 'tmp\level_editor_export_hold'
$hideEditorAddon = ($Preset -ne 'Web Dev Editor')

if ($hideEditorAddon -and (Test-Path $editorAddon)) {
    Write-Host "Temporarily hiding level editor addon for production export."
    $resolvedProject = [System.IO.Path]::GetFullPath($projectPath)
    $resolvedAddon = [System.IO.Path]::GetFullPath($editorAddon)
    $resolvedHold = [System.IO.Path]::GetFullPath($editorAddonHold)
    if (-not $resolvedAddon.StartsWith($resolvedProject, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to move addon outside project tree: $resolvedAddon"
    }
    if (Test-Path $editorAddonHold) { Remove-Item -LiteralPath $editorAddonHold -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $editorAddonHold) | Out-Null
    Move-Item -LiteralPath $editorAddon -Destination $editorAddonHold
    Remove-Item -LiteralPath (Join-Path $projectPath '.godot\exported') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $projectPath '.godot\editor') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $projectPath '.godot\global_script_class_cache.cfg') -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $projectPath '.godot\uid_cache.bin') -Force -ErrorAction SilentlyContinue
}

try {
    # Preset names come from BikeBrowserWorld/export_presets.cfg.
    & $godot --headless --path "$projectPath" --export-release "$Preset" "$outIndex"
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        Write-Error "Godot export failed (exit $exitCode)"
        exit $exitCode
    }
    $pckPath = [System.IO.Path]::ChangeExtension($outIndex, '.pck')
    $deadline = (Get-Date).AddSeconds(30)
    while ((-not (Test-Path $outIndex) -or -not (Test-Path $pckPath)) -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 250
    }
    if (-not (Test-Path $outIndex) -or -not (Test-Path $pckPath)) {
        Write-Error "Godot export did not create expected web files."
        exit 1
    }
}
finally {
    if ($hideEditorAddon -and (Test-Path $editorAddonHold)) {
        if (Test-Path $editorAddon) { Remove-Item -LiteralPath $editorAddon -Recurse -Force }
        Move-Item -LiteralPath $editorAddonHold -Destination $editorAddon
    }
}

$sha = (& git -C "$repoRoot" rev-parse HEAD).Trim()
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$version = [ordered]@{
    git_sha       = $sha
    exported_at   = $timestamp
    godot_exe     = $godot
    project_path  = 'BikeBrowserWorld'
    preset        = $Preset
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $outDir 'version.json') -Value $version -Encoding utf8

Write-Host "Done. version.json: $sha @ $timestamp"
