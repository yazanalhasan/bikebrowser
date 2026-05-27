# Tire Patch Art Fix

Date: 2026-05-26

## Applied Patch Policy

The applied repair patch must be a single patch placed over the leak. `patch_with_glue_tube.png` is a supply object only and must not be used as the applied patch.

## Current Runtime Art

| Node | Texture | Status |
| --- | --- | --- |
| `Wheel/TireShape/Patch` | `Assets/Props/BikeRepair/single_tube_patch.png` | Correct applied patch |
| `Wheel/TireShape/PreparedPatchZone` | `Assets/Props/BikeRepair/prepared_patch_zone.png` | Correct prep zone |
| `Wheel/TireShape/LeakMarker/AirEscapeTrace` | `Assets/Props/BikeRepair/air_escape_trace.png` | Correct leak effect |
| `GlueTubeSupply` | `Assets/Props/BikeRepair/patch_with_glue_tube.png` | Correct supply-only prop |
| `PatchKitProp` | `Assets/Props/Repair/tire_patch_kit.png` | Correct supply-only prop |

## Guardrail

`tests/tire_patch_alignment_check.gd` now fails if the applied patch is not `single_tube_patch.png` or if the patch drifts away from the leak marker during the repair flow.
