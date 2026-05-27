# Tire Repair Staging Fix

Date: 2026-05-26

## Layout Truth

The canonical tire repair station is staged as a single close-up repair mat:

- wheel/tire centered on the mat
- tube pulled partly from the tire
- visible leak marker on the tube/tire area
- prepared patch zone at the leak
- applied single patch over the leak
- patch kit and glue tube nearby as supplies
- tire levers near rim
- floor pump with hose and in-world gauge
- inflation changes pressure/deformation
- final spin verifies readiness

## Implementation State

`Prototypes/EmbodiedMechanics/TireRig.tscn` already uses sprite assets for the wheel, tube, pump, patch kit, tire levers, air trace, prepared patch zone, and single patch. The applied `Patch` node uses `single_tube_patch.png`; `patch_with_glue_tube.png` remains only as the nearby supply prop.

## Validation Added

Added `tests/tire_patch_alignment_check.gd`, which verifies:

- polished wheel/tire sprite is present
- applied patch uses `single_tube_patch.png`
- glue/patch kit art remains supply-only
- patch starts and remains aligned to the leak marker
- leak hides after patch closure
- pump hose and pressure behavior are visible
- inflation reduces deformation and reaches safe pressure

## Remaining Visual QA

Automated checks verify structure and state. Final screenshot review should still confirm the repair mat reads cleanly at actual browser scale after export.
