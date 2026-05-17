param(
    [string]$ProjectRoot = "C:\Users\yazan\bikebrowser"
)

$ErrorActionPreference = "Stop"

$scenePath = Join-Path $ProjectRoot "BikeBrowserWorld\Regions\Garage\TireRepairStation.tscn"
if (-not (Test-Path $scenePath)) {
    throw "Missing TireRepairStation scene: $scenePath"
}

$scene = Get-Content $scenePath -Raw

if ($scene -match 'parent="Wheel"\]\s*polygon = PackedVector2Array\(-54, -54, 54, -54, 54, 54, -54, 54\)') {
    throw "TireRepairStation wheel still uses a square tire polygon"
}

if ($scene -match 'parent="Wheel"\]\s*polygon = PackedVector2Array\(-38, -38, 38, -38, 38, 38, -38, 38\)') {
    throw "TireRepairStation wheel still uses a square rim polygon"
}

if ($scene -notmatch 'res://Assets/Props/Repair/bike_wheel.png') {
    throw "TireRepairStation wheel does not reference the round bike wheel asset"
}

if ($scene -notmatch '\[node name="WheelVisual" type="Sprite2D" parent="Wheel"\]') {
    throw "TireRepairStation is missing WheelVisual Sprite2D"
}

Write-Output "tire repair wheel visual test passed"
