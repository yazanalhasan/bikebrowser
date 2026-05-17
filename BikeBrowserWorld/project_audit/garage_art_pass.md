# Garage Art Cohesion Pass

Generated: 2026-05-15

## Scope

This pass was limited to `res://Regions/Garage/ZuzuGarage.tscn` and `res://Data/layouts/garage.json`.

No runtime architecture, quest registry, dialogue manager, save service, reward bridge, or autoload logic was changed.

## Foundation Audit

The garage already had a partial art replacement pass in progress, but it still mixed several visual families:

- Hidden legacy SVG kit sprites for the original garage floor, wall, workbench, pegboard, rug, repair stand, and lamp glow.
- Visible and hidden `Polygon2D` primitive clusters for floor shadows, grease marks, workbench clutter, chain guide marks, tape, and light spill.
- Real PNG props for the workbench, pegboard, tools, rug, tires, shelves, poster, and repair objects.
- A complete slipped-chain BMX repair sprite, with aligned and seated-chain states available but not staged in the scene.

## Placeholder Elements Replaced Or Suppressed

The following primitive/detail clusters are now suppressed so the garage reads more like a cohesive pixel-art workshop:

- `ShadowLayer/StoryFloorDetails`
- `PropLayer/StoryWorkbenchDetails`
- `InteractableLayer/StoryRepairDetails`
- `LightingLayer/LampGlowArt`
- `LightingLayer/StoryLightSpill`

Legacy scaffold nodes remain in the scene only as hidden rollback references. The visible garage read is now carried by PNG props, the derived floor/wall plates, PointLight2D ambience, and the BMX repair sprites.

## New Garage Props Integrated

The pass added a `PropLayer/WorkbenchCohesionDetails` cluster using existing generated PNG assets:

- Rear derailleur close-up
- Cassette / gear cluster
- Chain lube bottle
- Multi-tool
- Parts bin
- Hex key set
- Chain breaker tool
- Tire lever set
- Patch with glue tube

It also added `PropLayer/FloorCohesionDetails/OilStainNearStand` so the repair area has tactile floor storytelling without primitive grease polygons.

## Repair Stand Improvements

The chain repair station now stages all three required BMX repair states:

- `RepairBike` uses `garage_repair_stand_bmx_slipped_chain.png`
- `RepairBikeAligning` uses `garage_repair_stand_bmx_aligning_chain.png`
- `RepairBikeSeated` uses `garage_repair_stand_bmx_seated_chain.png`

Only the slipped-chain state is visible by default, preserving current gameplay behavior. The aligned and seated states are present and positioned for future quest-state switching without needing another scene assembly pass.

## Lighting Improvements

The old SVG lamp glow and polygon light-spill blocks were hidden to reduce visual-family conflict. The active lighting language is now:

- Warm workbench PointLight2D
- Soft ceiling PointLight2D
- Warm repair stand PointLight2D
- String light PNG prop
- Warm/cool contrast from the existing derived wall/floor plates

This keeps the garage bright and readable while placing the strongest visual focus near the repair object.

## Layout Discipline

All new static placements were added to:

`res://Data/layouts/garage.json`

The scene file only defines the nodes/resources. The layout JSON owns positions, scale, and z-index.

## Validation

- `garage.json` parses as valid JSON.
- `project_audit/runtime_repair_smoke.gd` passed.
- RuntimeValidator reported 0 errors and 1 warning during the smoke run.
- `res://Regions/Garage/ZuzuGarage.tscn` loaded headlessly without missing-texture or scene parse errors.
- `tests/vertical_slice_check.gd` still fails reward-intent assertions for `chain_repair` and `flat_tire_repair`; this pass did not modify quest/reward/autoload logic per scope.

## Remaining Garage Immersion Breakers

- The full wall/floor plate is still a derived background rather than a final authored Aseprite/Godot tile scene.
- Several hidden primitive rollback nodes still exist in `ZuzuGarage.tscn`; they are no longer part of the visible art read but can be removed after a full editor review.
- The aligned/seated BMX sprites are staged but not yet wired to quest progression visuals.
- The reward completion moment still needs visual state switching, wheel spin, and a warmer success flash.
- The tire repair station scene still needs its own replacement pass.
- The vertical slice reward-intent test failure should be handled in a separate gameplay/bridge workstream.
