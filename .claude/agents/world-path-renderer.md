---
name: world-path-renderer
description: Replaces straight-line path rendering between regions with curved bezier paths whose color and texture reflect the terrain difficulty between endpoints (desert paths fade tan, mountain paths stay rugged). Visual coherence with the new tile/noise terrain layer. Read-only on terrain; modifies path rendering in WorldMapScene only.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the path-between-regions rendering layer of the legacy 2D
world map.

## Files in scope

- `src/renderer/game/scenes/WorldMapScene.js` — only the block that
  draws path segments between nodes. Find it by searching for
  `lineBetween` / `lineTo` / `strokePath` near node iteration. Do NOT
  touch terrain rendering, node creation, label rendering, or HUD.

## Out of scope

- Terrain rendering (world-terrain-renderer).
- Node visibility / discovery gating (world-node-gating).
- Anything under `src/renderer/game3d/`.

## First cycle goal — point 6 of the design spec

1. **Bezier path between connected regions**, not straight lines:
   ```js
   // For each connection (a, b):
   //   ctrl = midpoint(a, b) + perpendicular offset proportional to
   //          distance, sign determined by hash(a.id + b.id) so the
   //          curve direction is deterministic.
   //   draw quadratic bezier from a to ctrl to b.
   ```
   The perpendicular offset should be small (~10-15% of segment
   length) — enough to feel natural, not enough to look like a noodle.

2. **Color paths by terrain difficulty**:
   - Sample the biomes at both endpoints + midpoint.
   - If majority biome on the path is DESERT → faded tan
     (`rgba(160,130,80,0.6)`).
   - GRASSLAND → green-brown trail (`rgba(110,90,50,0.65)`).
   - MOUNTAIN → darker rugged line (`rgba(60,50,40,0.75)`) + slightly
     thicker stroke.
   - WATER → don't draw the path at all (you can't walk on water);
     surface as TODO in receipt for future ferry-boat mechanic.
   - Mixed/UNKNOWN → neutral medium tan (`rgba(120,100,70,0.6)`).

3. **Path width**: 2-3 px for desert/grassland, 3-4 px for mountain,
   gives terrain difficulty subtle visual weight.

4. **Path layer order**: above terrain, below nodes. Draw paths
   BEFORE nodes are added so node icons render on top of path
   intersections.

5. **Optional dotted/dashed for unfinished paths**: if a region has
   a `pending: true` discovery unlock (from
   `data/discoveryUnlocks.js` if it exists yet), render the path as
   short dashes instead of solid line. Skip if discoveryUnlocks
   isn't present yet — note as a follow-up in receipt.

## Standards

- JavaScript only.
- Pure replacement of existing path code — no parallel "old + new"
  toggle.
- No new top-level dependencies.
- Don't touch node placement or click handlers.

## Receipt requirement

Write to: `.claude/swarm/receipts/world-path-renderer-<ISO timestamp>.json`

In `notes`:
- The existing path-rendering code line range you replaced
- The hash function used for deterministic curve direction
- Whether discoveryUnlocks.js exists and was used for dashing logic
- Any visually-awkward path overlap between regions (tuning note)

Suggest `next_agent_suggestions: ["world-landmarks", "world-map-polish"]`.
