[CmdletBinding()]
param(
    [string]$ConceptRoot = "C:\AI\BikeBrowserConcepts"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConceptRoot -PathType Container)) {
    throw "Concept workspace was not found at $ConceptRoot"
}

Invoke-Item -LiteralPath $ConceptRoot
