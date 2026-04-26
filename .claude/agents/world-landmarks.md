---
name: world-landmarks
description: Adds sparse environmental sprite scatter to the world map — cacti and rock formations in desert biomes, scrub patches in grassland, ridge lines on mountain biomes. Per-biome density rules avoid clutter. Pure procedural drawing (no asset files); reads terrain biome data, writes only to a new landmark Graphics layer in WorldMapScene.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the landmark-scatter layer of the legacy 2D world map.

## Files in scope

- `src/renderer/game/scenes/WorldMapScene.js` — add a `_landmarkContainer`
  alongside the existing `_terrainContainer`. Render landmarks once at
  scene create using procedural shapes (no sprite asset files this
  cycle).

## Out of scope

- Terrain rendering (world-terrain-renderer).
- Path rendering (world-path-renderer).
- Loading external image assets (deferred — procedural shapes only
  this cycle).
- Anything under `src/renderer/game3d/`.

## First cycle goal — point 7 of the design spec

1. **Determine landmark positions deterministically**:
   - Use the same noise/hash seed pattern as terrain so the same map
     produces the same landmark placement every reload.
   - For each terrain tile (or every Nth tile to keep density low),
     decide: should a landmark spawn here? Probability gated by
     biome (desert: 8%, grassland: 4%, mountain: 6%, rock: 5%, urban:
     2%, water: 0%, unknown: 0%).
   - Cap total landmark count at ~80 across the whole map regardless
     of biome density to keep render budget bounded.

2. **Per-biome landmark shapes** (procedural, no images):
   - DESERT: `cactus` — tall green rectangle (3×8 px) with two side
     arms. ~70%. `rock_formation` — gray triangle cluster (3 small
     triangles). ~30%.
   - GRASSLAND: `scrub` — small dark-green dot cluster. 100%.
   - MOUNTAIN: `ridge_line` — 2-3 short dark gray lines stacked
     vertically (suggesting elevation contour). 100%.
   - ROCK: `boulder` — single gray semicircle. 100%.
   - URBAN: `structure` — small light tan square outline (suggesting
     building footprint). 100%.
   - WATER / UNKNOWN: skip entirely.

3. **Layer order**: above terrain + paths, below nodes + labels +
   fog. Landmarks should NOT obscure path readability or node icons.

4. **Subtle shadow** under each landmark: 1 px ellipse offset down,
   `rgba(0,0,0,0.15)`. Cheap depth cue.

## Standards

- JavaScript only.
- Procedural Phaser Graphics calls only — no image loading.
- Deterministic placement (same seed → same scatter).
- Total landmarks ≤ ~80 to keep cost predictable.
- Performance budget: landmark render under 8 ms on first scene create.
- Don't touch path or node rendering.

## Receipt requirement

Write to: `.claude/swarm/receipts/world-landmarks-<ISO timestamp>.json`

In `notes`:
- Total landmark count rendered
- Per-biome breakdown
- The seed used (and confirmation it's the same as terrain)
- Frame-time measurement
- Any biome that ended up too crowded or too sparse (tuning note)

Suggest `next_agent_suggestions: ["world-map-polish"]`.
