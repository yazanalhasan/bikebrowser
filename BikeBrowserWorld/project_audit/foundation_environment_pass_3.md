# Foundation Environment Pass 3

Date: 2026-05-15

Scope: `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

This pass focuses on cinematic composition, visual flow, focal hierarchy, and emotional readability. It does not replace the pass-1 or pass-2 foundation assets, add gameplay systems, expand regions, or introduce dense prop clutter.

## Visual Flow Audit

Reviewed the main emotional path:

- Default spawn near the street center.
- Mrs. Ramirez area on the left.
- Garage and Mr. Chen area on the right.
- Driveway and garage entrance path.
- Repair/safety station staging near the street.

Findings:

- The garage already had warmth, but needed a stronger world-art pull from spawn.
- The road and curb were readable, but still fairly even in visual weight across the whole scene.
- Existing always-on house/NPC labels were already hidden in the current scene, which improves cinematic read.
- NPC silhouettes had shadows, but the ground behind them could use very subtle readability pads.
- The bottom sidewalk/road area needed more rhythm so walking across the street feels less uniform.

## New Composition Assets

Added broad transparent overlays:

- `Assets/Backgrounds/Derived/NeighborhoodFoundation/cinematic_focus_flow_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/street_rhythm_composition_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/silhouette_readability_ground_overlay.png`

Preview:

- `project_audit/foundation_environment_pass_3_preview.png`

## Scene Changes

Added `Sprite2D` nodes under `GroundArtLayer`:

- `StreetRhythmOverlay`
- `CinematicFocusFlowOverlay`
- `SilhouetteReadabilityOverlay`

Placement and z-index were added to:

- `Data/layouts/neighborhood_street.json`

No interaction, collision, quest, dialogue, save, audio, or autoload behavior was modified.

## Focal Hierarchy

Primary focal order now reads through ground lighting:

1. Garage/workshop: strongest warm pool and driveway pull.
2. Mr. Chen / repair area: warm readable pool near the garage.
3. Mrs. Ramirez area: softer secondary warm pool.
4. Spawn area: calm readability pad, not a spotlight.
5. Traversal routes: curb and road rhythm guide movement.

The overlays avoid UI arrows and instead use broad, low-opacity light and shadow shapes.

## Garage Visual Magnetism

The garage now receives:

- Warm elliptical focus around the driveway/entrance.
- A subtle diagonal light path from spawn toward the garage.
- Extra readability around Mr. Chen's staging area.
- Support from existing `GarageGlint`, driveway wear, and warm light spill.

The garage should attract attention without reading as a game-highlight marker.

## Street Rhythm

Added `street_rhythm_composition_overlay.png` to reduce uniformity:

- Alternating soft cool pockets across the road.
- Small warm sidewalk rests.
- Low-opacity curb direction sweeps.
- Calm bottom-path breathing room.

This is meant to create a pleasant walking rhythm, not visual noise.

## Silhouette Readability

Added `silhouette_readability_ground_overlay.png` behind:

- Default spawn/player area.
- Mr. Chen.
- Mrs. Ramirez.
- Safety check station.
- Garage approach.

The effect is on the ground plane only, so character sprites remain visually distinct without halos or UI treatment.

## Breathing Room

This pass intentionally avoided adding new object clutter. It uses composition layers instead of more physical props. Persistent house/NPC labels remain hidden, preserving the scene's quieter cinematic read while interaction prompts remain available where needed.

## Remaining Weak Areas

- Some small `StoryGroundDetails`, `StoryYardDetails`, and `StoryForegroundDetails` are still polygon-based and may need future sprite cleanup.
- Headless validation cannot fully judge emotional composition; a native editor/player walkthrough is still recommended.
- The safety check station and bike ramp still have some separate prop-pass concerns, but they were outside this foundation composition scope.

## Validation

Commands run:

```text
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --import
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd
```

Results:

- RuntimeValidator: 0 errors, 1 warning.
- QuestRegistry: 18 missions loaded, 0 quest validation errors, 0 warnings.
- Neighborhood scene: no missing texture or scene parse errors.
- Runtime smoke: PASS.
- Static checks: layout JSON parses, pass-3 PNGs exist, and all pass-3 overlay nodes are referenced in both scene and layout.

Known caveat:

- Godot still emits the previously documented headless shutdown ObjectDB/resource warning.

