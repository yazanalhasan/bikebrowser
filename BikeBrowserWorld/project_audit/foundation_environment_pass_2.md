# Foundation Environment Pass 2

Date: 2026-05-15

Scope: `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

This pass refines the successful foundation replacement from pass 1. It does not replace the new road, sidewalk, driveway, house, yard, or mountain assets wholesale. It adds subtle integration layers and small in-place surface refinements so the neighborhood reads less like assembled panels and more like a believable dusk street.

## Goals

- Improve curb depth and road edge shadows.
- Ground houses into yards, porches, and driveway approaches.
- Make props feel physically placed without adding clutter.
- Reduce modular/tile repetition through asymmetric wear and light variation.
- Preserve traversal readability and NPC visibility.

## New Integration Assets

Added transparent overlay assets:

- `Assets/Backgrounds/Derived/NeighborhoodFoundation/curb_depth_integration_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/house_grounding_integration_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/prop_grounding_contact_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/warm_dusk_light_flow_overlay.png`

Updated existing pass-1 panels in place:

- `Assets/Backgrounds/Derived/neighborhood_road_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_top_sidewalk_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_bottom_sidewalk_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_driveway_panel_v2.png`

Preview:

- `project_audit/foundation_environment_pass_2_preview.png`

## Scene Integration

Added the following `Sprite2D` nodes under `GroundArtLayer`:

- `CurbDepthOverlay`
- `HouseGroundingOverlay`
- `PropGroundingOverlay`
- `WarmLightFlowOverlay`

Placement and z-index are controlled by:

- `Data/layouts/neighborhood_street.json`

No quest, dialogue, save, event, audio, or autoload logic was modified.

## Depth Improvements

- Added blue-purple curb shadows below sidewalk-road transitions.
- Added warm curb bevel highlights on the upper edge of sidewalk bands.
- Added small, asymmetric curb nicks and dust accumulations to avoid perfect modular edges.
- Added driveway threshold shadow and garage-side light fade.
- Added house base shadows, porch step shadows, and roof-overhang shadows.

## House Integration

The facades now receive scene-level grounding support:

- Wall base shadows sit behind each facade.
- Porch step shadows make the door areas feel attached to ground.
- Warm light pools extend subtly into the yard/driveway space.
- Garage light spill leads the eye from driveway to workshop entrance.

The goal is physical embedding, not extra architectural detail.

## Curb And Sidewalk Polish

- Sidewalk seams are now less evenly repeated.
- Curb edges have dust buildup and small wear streaks.
- Road/curb transitions use soft shadow falloff instead of a single hard edge.
- Top and bottom sidewalks retain clear traversal readability.

## Yard Transition And Prop Grounding

Added restrained contact shadows for:

- Fence segments.
- Mailbox.
- Street sign.
- Fire hydrant.
- Street lamps.
- Bike by fence.
- Workbench/tools near garage.
- Desert plants and rock clusters.

Added subtle dirt accumulation near curb, fence, mailbox, and plant bases. This is baked into one transparent prop-grounding overlay rather than many new prop nodes.

## Road Believability

The road remains cozy suburban, not grungy:

- Added nonuniform bike/tire scuffs.
- Softened lane dashes with mild wear.
- Added curb-edge dust and warm upper-left dusk wash.
- Preserved a clean, readable travel band.

## Atmospheric Depth

- Added a low-opacity warm upper-left lighting wash.
- Added faint cool lower-right grounding to support the dusk light direction.
- Added a subtle horizon blend over the mountain panel.
- Emphasized garage/driveway focus with a warm light ellipse.

No fog system, particle system, or parallax system was added.

## Remaining Modular-Looking Areas

- Some existing `StoryGroundDetails` and `StoryYardDetails` are still polygon-based. They are small and outside this pass, but a later micro-prop polish pass could replace them with tiny sprites.
- Persistent world labels still flatten the environment and should become diegetic signs or contextual nameplates in a UI/signage pass.
- `BikeRamp` remains polygon-based and should be handled by a prop-specific pass.
- Headless validation cannot replace a human visual walk-through in the editor, especially for judging subtle z-index aesthetics.

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
- Static checks: `neighborhood_street.json` parses, all pass-2 PNG references exist, and all pass-2 overlay nodes are present in both scene and layout.

Known caveat:

- Godot still emits the previously documented headless shutdown ObjectDB/resource warning.

