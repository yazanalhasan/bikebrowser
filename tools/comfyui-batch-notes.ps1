[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("tire_repair", "chain_repair", "bridge_notebook", "workshop", "npcs", "regional_science", "ui_notebook")]
    [string]$Track,

    [string]$ConceptRoot = "C:\AI\BikeBrowserConcepts"
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$batchDir = Join-Path (Join-Path $ConceptRoot $Track) "batch_$stamp"
New-Item -ItemType Directory -Force -Path $batchDir | Out-Null

$notesPath = Join-Path $batchDir "batch_notes.md"
@"
# $Track Concept Batch $stamp

## Prompt


## Negative Prompt


## Model / Workflow


## Selection Criteria

- Mechanic readability
- Strong silhouette
- Clean object grouping
- Warm BikeBrowser tone
- Aseprite paintover feasibility

## Selected Outputs


## Rejected Outputs


## Aseprite Handoff Notes


"@ | Set-Content -LiteralPath $notesPath -Encoding UTF8

Write-Host $batchDir
