---
name: world-fog-overlay
description: Renders the discovery fog overlay on the legacy 2D WorldMapScene — black for never-seen tiles, dim translucent for previously-seen-not-currently-visible tiles. Sits ABOVE terrain but BELOW nodes/labels so the player can still see node icons in fog as silhouettes if you choose. Consumes world-discovery-state's API.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the fog rendering layer of the legacy 2D world map.

## Files in scope

- `src/renderer/game/scenes/WorldMapScene.js` — add a fog graphics
  layer that re-renders when discovery state changes. Layer order:
  terrain → fog → paths → nodes → labels.

## Out of scope

- Discovery state itself (owned by world-discovery-state).
- Terrain rendering (owned by world-terrain-renderer).
- Hiding/showing node objects (owned by world-node-gating — different
  concern: this agent paints fog over the map; that agent decides
  whether the node is interactive/visible).
- Anything under `src/renderer/game3d/` (different engine).

## First cycle goal

1. Read `WorldMapScene.js` (now with terrain layer in place from the
   previous agent). Confirm `_terrainContainer` exists; add
   `_fogContainer` at the next layer up.
2. Import the discovery API from `discoverySystem.js`:
   ```js
   import { isDiscovered, DISCOVERY_TILE_SIZE } from '../systems/discoverySystem.js';
   ```
3. On scene create, render the fog layer. For each tile in the world
   map's render bounds:
   - Never discovered → solid black `#000000` at alpha 1.0
   - Discovered (but the world map is a static overview, no "currently
     visible" concept here — that's local-scene fog if we ever add it)
     → fully transparent (no fog)
   Use `Phaser.GameObjects.Graphics` with `fillRect` per tile. Skip
   rendering transparent tiles (perf).
4. Expose a method on the scene: `redrawFog()` that clears + redraws
   the fog graphics. Call it from any code that grants discovery (e.g.,
   world-node-gating's reveal animation will call it).
5. Verify the fog does NOT block node click handlers — Graphics with
   `setInteractive(false)` so input passes through to nodes underneath.

## Standards

- JavaScript only — no TypeScript.
- Render fog ONCE at scene create + on `redrawFog()` calls. Do NOT
  redraw every frame.
- Don't move existing layers (paths, nodes, labels) — terrain is
  bottom; fog goes above terrain, below paths.
- No new top-level dependencies.
- Performance: cap fog redraw to <16 ms on a 1024×768 map. If the
  per-tile rect approach is too slow, batch into a single Graphics
  with multiple `fillRect` calls (one beginPath, many rects).

## Receipt requirement

Write to: `.claude/swarm/receipts/world-fog-overlay-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- Confirmation that the layer order is preserved (terrain/fog/paths/nodes/labels)
- Confirmation that fog does not block node click handlers
- Tile size used (should match DISCOVERY_TILE_SIZE)
- Frame-time estimate for redrawFog() on a fresh save (everything fogged)

Include `next_agent_suggestions: ["world-node-gating"]`.
