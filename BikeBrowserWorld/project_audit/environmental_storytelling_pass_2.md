# Environmental Storytelling Pass 2

Generated: 2026-05-15

## Scope

This pass refined ambient emotional life and world memory in the already-improved neighborhood and garage. It stayed within visual storytelling only.

Changed surfaces:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`
- `res://Regions/Garage/ZuzuGarage.tscn`
- `res://Data/layouts/neighborhood_street.json`
- `res://Data/layouts/garage.json`
- `res://Regions/Shared/SubtleAmbientLife.gd`

No quest, save, dialogue, registry, event bus, interaction, or region-expansion systems were modified.

## Ambient Life Additions

Added `SubtleAmbientLife.gd`, a tiny scene-local visual helper. It only:

- softly flickers selected light/glow nodes,
- gently sways selected paper/sign/string-light details,
- slowly breathes dust/chalk alpha.

The motion is deliberately minimal and does not move colliders, gameplay nodes, NPCs, player, prompts, or transitions.

Neighborhood ambient targets:

- warm house/window glow,
- porch light pool,
- small bent yard sign,
- ocotillo canes,
- faded chalk/threshold lettering.

Garage ambient targets:

- warm garage door spill,
- workbench amber spill,
- tiny folded repair note,
- hanging string lights,
- three dust motes in the warm light.

## World Memory Additions

Neighborhood:

- worn hopscotch corner,
- jump-distance chalk marks,
- faded practice arrow,
- older feathered skid mark,
- dusty curb buildup,
- porch glow memory ring,
- tire-lean dust spot near the bike,
- sticker residue near the fence sticker.

Garage:

- worn threshold mark,
- coffee mug ring,
- old tape residue,
- small workbench scratch,
- grease handprint/smear,
- race-number tape residue,
- worn grip mark,
- small chain grease dot,
- bent valve cap.

These are intended to imply repeated use rather than a single staged setup.

## Childhood Energy Additions

- The ramp area now has more believable practice history: jump marks, old skid feathering, faded arrows, and hopscotch wear.
- Chalk remains quiet and small; it should read as neighborhood play, not UI graffiti.
- The tire/scuff language leads toward the ramp and curb without adding debug arrows.

## BMX Culture Additions

- Sticker layering and residue near the fence/toolbox area.
- Old race number memory reinforced with tape residue.
- Worn grip and chain-grease details near the repair bike.
- Bent valve cap and small part wear around the repair zone.

The tone remains backyard BMX and repair culture, not extreme-sports branding.

## Sonoran Atmosphere Additions

- More dusty curb buildup.
- Dry soil variation.
- Warm rock edging.
- Sun-faded planter/sign surface marks.
- Subtle porch glow and dry dusk light memory.

The neighborhood remains suburban desert rather than wilderness.

## Visual Attention Improvements

- The ramp now has a soft pattern of tire marks, jump marks, and chalk arrows that naturally guides attention.
- The garage repair area has chain grease, a sparkle, a master link, worn grip marks, and warm light pull.
- The garage threshold has wear and light spill to make the exit/entry feel physically used.
- The bench area now has tape, notes, scratches, and coffee-ring relationships that feel causally connected.

## Screenshots

No screenshots were captured in this pass. Previous project audit notes indicated headless screenshot capture can return null viewport textures under the dummy renderer. Validation therefore used scene loading, RuntimeValidator output, JSON parsing, and static resource checks.

