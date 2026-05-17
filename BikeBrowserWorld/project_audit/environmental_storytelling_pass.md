# Environmental Storytelling Pass

Generated: 2026-05-15

## Scope

This pass only changed visual scene details and layout placement for:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`
- `res://Regions/Garage/ZuzuGarage.tscn`
- `res://Data/layouts/neighborhood_street.json`
- `res://Data/layouts/garage.json`

No runtime architecture, registries, dialogue services, save services, event buses, quest systems, or interaction logic were modified.

## Art Direction Constraints Followed

- Warm dusk palette: porch/window glows use amber `#ffd27a` / `#ffd98a` ranges.
- Blue-purple grounding shadows: new grounding patches use translucent `#203247`.
- Prop density restraint: details are clustered around lived-in areas rather than filling every empty space.
- Readable silhouettes: large gameplay objects remain clear; new details stay small and low-contrast.
- Environmental layering: ground marks, wall/house details, props, light spill, and guide glints use existing visual layers.

## Neighborhood Additions

Added a new `StoryGroundDetails` cluster under `GroundPropLayer`:

- Small `BEST JUMP` chalk note near the ramp.
- Chalk arrow pointing toward the ramp.
- Faded chalk smudges near existing hopscotch art.
- Two subtle tire scuffs across the road/curb approach.
- Two curb-wear strips.
- A worn dusty path leading toward the garage entrance.

Added a new `StoryWarmWindows` cluster under `BehindPropLayer`:

- Warm window glow for Zuzu's house.
- Warm window glow for Ramirez house.
- Warm window glow for the workshop house.
- Soft porch light pool.

Added a new `StoryYardDetails` cluster under `MidPropLayer`:

- Two agave planter silhouettes.
- Ocotillo cane silhouette.
- Cholla pot silhouette.
- Desert stone border.
- Dust patch by the mailbox.

Added a new `StoryForegroundDetails` cluster under `ForegroundPropLayer`:

- Mailbox name tape.
- Slightly bent small yard sign.
- Missing fence slat and patch board.
- Bike pump by the fence.
- Tiny hidden BMX sticker.
- Garage threshold mat reading `FIX IT`.

## Garage Additions

Added a new `StoryFloorDetails` cluster under `ShadowLayer`:

- Soft shadow under workbench zone.
- Soft shadow under repair stand zone.
- Two chain-grease smudges.
- Two spare chain-link marks.
- Worn path from bench toward repair station.

Added a new `StoryWorkbenchDetails` cluster under `PropLayer`:

- Coffee mug.
- Half-used tape roll.
- Spare tube box label.
- Open notebook with chain notes.
- Kid sketch note.
- Old race number tag.
- BMX sticker.
- Handwritten taped checklist.
- Hanging hex keys.
- Toolbox wear patch.

Added a new `StoryRepairDetails` cluster under `InteractableLayer`:

- Chain sparkle guide near the repair bike.
- Loose master link.
- Wheel grounding guide shadow.
- Half-used tape near repair supplies.

Added a new `StoryLightSpill` cluster under `LightingLayer`:

- Warm garage door spill.
- Workbench amber spill.

## Diegetic Guidance Improvements

- The garage is now guided by a warm threshold mat, worn path, light spill, and repair glint rather than only prompt text.
- The safety/ramp area now has chalk language and tire marks that imply kids practiced there.
- The chain repair zone has a sparkle and loose master link to naturally pull the eye toward the drivetrain.
- The tire repair area is supported by nearby tape, tube packaging, and wheel grounding shadow.

## Sonoran Identity Improvements

- Added agave, ocotillo, cholla, desert stones, dusty soil patches, and warm dry curb wear.
- Kept the setting suburban: details remain in yards, planters, curb edges, and fence areas rather than turning the street into wilderness.
- Existing saguaro, prickly pear, creosote, rock clusters, fence, mailbox, porch light, and street lamps were preserved.

## Micro Discoveries

- Hidden tiny BMX sticker on the fence.
- `BEST JUMP` chalk note near the ramp.
- Old `#27` race number in the garage.
- Open chain notebook and taped checklist.
- Small `slow bikes` yard sign.

## Screenshots

No screenshots were added in this pass. The prior audit notes indicate headless Godot screenshot capture can return a null viewport texture under the dummy renderer. Validation focused on scene load and resource checks instead.

