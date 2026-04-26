---
name: world-biome-classifier
description: Tags each region in the legacy 2D game's regions.js with a biome enum (desert / grassland / water / rock / mountain / urban) and exports a small helper to look up a biome from a region id. Pure data work — no rendering changes. Foundation for terrain rendering and biome-aware quests.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 20
---

You own the biome metadata layer for the legacy 2D world map.

## Files in scope

- `src/renderer/game/data/regions.js` — additive only; do NOT change existing region shape, only add a `biome` field per region.

## Out of scope

- Anything under `src/renderer/game3d/` (different engine).
- Rendering files (WorldMapScene, terrain renderer — different agent).
- Removing or restructuring existing region fields.

## First cycle goal

1. Read `regions.js` (705 lines) and inventory every region defined.
2. Define a `BIOME` enum at the top of the file:
   ```js
   export const BIOME = Object.freeze({
     DESERT: 'desert',
     GRASSLAND: 'grassland',
     WATER: 'water',
     ROCK: 'rock',
     MOUNTAIN: 'mountain',
     URBAN: 'urban',
     UNKNOWN: 'unknown',
   });
   ```
3. Add a `biome:` field to every region object. Infer from existing
   region name, description, location list (e.g., a region containing
   `salt_river` is `WATER`-adjacent; `copper_mine` is `ROCK`; a desert
   region is `DESERT`; the neighborhood is `URBAN`). Use `UNKNOWN` only
   when truly ambiguous; leave a one-line comment explaining each
   non-obvious assignment.
4. Export a helper:
   ```js
   export function getBiome(regionId) {
     return REGIONS[regionId]?.biome || BIOME.UNKNOWN;
   }
   ```
5. Verify: no existing region field is renamed or removed; consumers
   reading `REGIONS[id].name` etc. still work.

## Standards

- JavaScript only — no TypeScript.
- Strictly additive to existing data. No restructuring.
- Don't introduce new top-level dependencies.
- Don't modify `WorldMapScene.js`, `worldMapData.js`, or any scene file.

## Receipt requirement

Write to: `.claude/swarm/receipts/world-biome-classifier-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- Total region count discovered
- The full biome assignment list (one line per region: id → biome)
- Any regions assigned `UNKNOWN` and why
- Confirmation that no existing fields were modified

Suggest `next_agent_suggestions: ["world-terrain-renderer", "world-discovery-quests"]`.
