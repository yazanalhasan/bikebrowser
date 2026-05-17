# Neighborhood Depth Report

Date: 2026-05-15

## Summary

Foundation Environment Pass 2 focused on making the neighborhood feel spatial and integrated instead of merely textured. The pass adds transparent depth, grounding, and lighting overlays on top of the pass-1 foundation assets. The result should read as a warmer, more believable street with clearer curbs, grounded houses, embedded props, and softer dusk cohesion.

## Curb Improvements

Added `curb_depth_integration_overlay.png` with:

- Soft blue-purple shadows falling down-right from curb edges.
- Warm highlight lines on sidewalk bevels.
- Small asymmetric curb wear and dusty edge marks.
- Blended road/sidewalk transitions.

Why it matters:

The curb now carries the main depth cue between sidewalk and road. This helps the neighborhood read as a physical street rather than a top-down color band.

## House Grounding Improvements

Added `house_grounding_integration_overlay.png` with:

- Foundation shadows behind the house bases.
- Porch step shadows.
- Roof overhang shadow cues.
- Warm window/porch light pools.
- Garage light spill that fades into the driveway.

Why it matters:

The facades now feel more attached to yard and driveway surfaces, reducing the "sprite placed on top" effect.

## Prop Grounding Improvements

Added `prop_grounding_contact_overlay.png` with contact shading beneath:

- Fence runs.
- Mailbox.
- Street sign.
- Fire hydrant.
- Lamps.
- Bike by fence.
- Workbench/tools.
- Desert plants and rock clusters.

It also adds restrained dirt buildup near curb and yard edges.

Why it matters:

Existing props now share common contact shadows and dust blending, which helps the whole scene feel physically assembled in one world.

## Road And Driveway Believability

Enhanced existing panels:

- Road panel: added light tire scuffs, softer lane wear, curb dust, and warm dusk variation.
- Driveway panel: added garage threshold shadow, stronger light spill, and subtle tire wear.
- Sidewalk panels: added seam variation and curb dirt so repeated panel logic is less visible.

Why it matters:

The road is still clean and safe, but now feels used by bikes and neighbors.

## Atmospheric Depth

Added `warm_dusk_light_flow_overlay.png` with:

- Subtle upper-left warm light wash.
- Very soft lower-right blue-purple grounding.
- Horizon softness over the mountain panel.
- Warm focus near the garage/driveway.

Why it matters:

The scene breathes more, but without heavy fog, particle noise, or cinematic overstatement.

## Visual Flow

The pass strengthens natural attention paths:

- Curb lines lead across the street.
- Driveway light points toward the garage/workshop.
- Porch and window glows create warm background anchors.
- NPC/player silhouettes remain above ground overlays.
- Travel bands remain visually clear.

## Screenshot / Preview

Headless viewport screenshots are still unreliable in this environment, so the pass includes a generated preview contact sheet:

- `project_audit/foundation_environment_pass_2_preview.png`

## Remaining Risks

- Some small storytelling detail nodes are still `Polygon2D`; they are not foundation blockers but may still read as primitive on close inspection.
- Persistent label nodes remain a flattening UI/world issue.
- A native editor playthrough is still recommended to judge visual subtlety, because headless checks prove loadability but not emotional feel.

## Validation Evidence

- `godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit`
  - RuntimeValidator: 0 errors, 1 warning.
- `godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2`
  - Scene loads with no missing texture or parse errors.
- `godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd`
  - `runtime_repair_smoke: PASS`.
- Static checks:
  - Layout JSON parses.
  - Pass-2 PNGs exist.
  - Pass-2 overlay nodes are referenced in scene and layout.

