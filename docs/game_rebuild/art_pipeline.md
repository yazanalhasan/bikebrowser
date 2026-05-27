# Art Pipeline

Date: 2026-05-27

## Folder Contract

The rebuilt Phaser game reserves these art folders:

- `src/game/art/placeholder`
- `src/game/art/generated`
- `src/game/art/curated`
- `src/game/art/final`

Current placeholder assets are generated at runtime through Phaser graphics in `AssetRegistry`. Future file-based placeholders may live under `placeholder`.

## Pipeline

```text
design source of truth
  -> prompt/concept brief
  -> generated candidates
  -> curation pass
  -> authored/cleaned final sprite
  -> AssetRegistry key
  -> scene integration
  -> screenshot test
```

## Generated Art

Use ComfyUI or similar tools for:

- composition
- mood
- silhouette exploration
- object grouping
- color direction

Generated art belongs in:

- `src/game/art/generated`

Generated art must not become runtime art by default.

## Curated Art

Curated concepts are selected references. They belong in:

- `src/game/art/curated`

Each curated image should have notes:

- source prompt
- model/tool
- what to preserve
- what to reject
- target scene/object

## Final Art

Final art belongs in:

- `src/game/art/final`

Final art should be authored or cleaned through Aseprite/Photoshop-equivalent discipline. It must be:

- readable at gameplay scale
- consistent with the visual bible
- named through stable asset keys
- tested in scene screenshots

## Naming

Use:

```text
domain_object_state_variant.ext
```

Examples:

- `character_zuzu_idle_down_v001.png`
- `vehicle_bike_side_v001.png`
- `environment_bridge_damaged_v001.png`
- `ui_quest_marker_v001.png`

## Resolution Guidelines

- Base tile: 32x32.
- Zuzu gameplay sprite: 40-56 px tall.
- NPC gameplay sprite: 40-56 px tall.
- Bike: 72-112 px wide.
- Small props/tools: 24-64 px.
- Large buildings: modular chunks on 32 px multiples.

## Sprite Sheet Guidelines

- Keep a consistent anchor.
- Keep direction/state names explicit.
- Prefer small focused sheets over giant mixed atlases at first.
- Avoid packing unrelated concepts until final asset categories stabilize.

## What Not To Accept

Reject assets with:

- malformed bikes or impossible mechanics
- random/unreadable generated text
- mismatched perspective
- cluttered prop scatter
- poor contrast on mobile
- dashboard UI energy in the world
- visual style copied from the old bad foundation

## ComfyUI / Aseprite / Photoshop Integration

ComfyUI:

- generate concept batches
- explore staging and palette
- never define final runtime truth

Aseprite:

- create final pixel/sprite sources
- export spritesheets and PNGs
- preserve editable source files

Photoshop or equivalent:

- background/layout paintover
- palette and texture cleanup
- final production polish

All production art should enter Phaser through `AssetRegistry`, not direct scene file paths.
