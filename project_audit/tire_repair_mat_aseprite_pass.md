# Tire Repair Mat Aseprite Pass

Date: 2026-05-27

## Goal

Turn the first ComfyUI tire repair concept batch into an authored production pass without treating generated images as runtime art.

## Source Inputs

- Batch report: `C:\dev\bikebrowser\project_audit\tire_repair_concept_batch_001.md`
- Aseprite brief: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\tire_repair_mat_brief_v002.md`
- Selected references: `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5`

## Assets Created

Authored Aseprite-backed assets:

- `BikeBrowserWorld\Assets\Props\BikeRepair\tire_repair_mat_base.aseprite`
- `BikeBrowserWorld\Assets\Props\BikeRepair\tire_repair_mat_base.png`
- `BikeBrowserWorld\Assets\Props\BikeRepair\exposed_inner_tube.aseprite`
- `BikeBrowserWorld\Assets\Props\BikeRepair\exposed_inner_tube.png`
- `BikeBrowserWorld\Assets\Props\BikeRepair\tube_puncture_marker.aseprite`
- `BikeBrowserWorld\Assets\Props\BikeRepair\tube_puncture_marker.png`

Godot import metadata was generated for the PNG exports.

## Scene Changes

Updated:

- `BikeBrowserWorld\Prototypes\EmbodiedMechanics\TireRig.tscn`
- `BikeBrowserWorld\Prototypes\EmbodiedMechanics\TireRig.gd`

Changes:

- Added `RepairMatArt` using the authored repair mat base.
- Kept the interactive wheel as the primary visible wheel.
- Replaced the old tiny inner-tube prop with a dedicated exposed-tube sprite.
- Moved leak marker, prepared patch zone, air trace, and single patch onto the exposed tube layer.
- Left patch kit and glue tube as supply props, visually separate from the applied patch.
- Repositioned levers, patch supplies, and pump hose around one coherent mat.
- Updated patch rotation logic so a patch on the exposed tube does not counter-rotate with the wheel.

## Visual Truth Outcome

Improved:

- The repair now reads as one mat/workbench scene.
- The tube has its own visible repair target.
- The patch is a single patch over the exposed tube area.
- The pump hose remains visually connected into the repair mechanism.
- The selected ComfyUI references informed staging, but no raw generated output was copied into runtime assets.

Still worth playtesting:

- Whether the exposed tube is large enough in the browser camera.
- Whether the wheel/tube relationship reads clearly during motion.
- Whether the pump hose endpoint should snap more exactly to the valve in final polish.

## Validation

Passed:

```text
godot --headless --path C:\dev\bikebrowser\BikeBrowserWorld --script res://tests/tire_rig_state_check.gd
godot --headless --path C:\dev\bikebrowser\BikeBrowserWorld --quit
```

Notes:

- Godot still reports the pre-existing ObjectDB/resource leak warning on exit.
- No missing-resource errors remain for the new tire repair mat assets.
