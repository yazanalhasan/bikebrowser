---
name: world-discovery-state
description: Creates the discovery state system — a new module that tracks which world-map tiles the player has explored, persisted via the existing save system. Civilization-style fog of war, but data-only. Rendering is owned by other agents (world-fog-overlay, world-node-gating) that consume this module's API.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the discovery state module — a new system file that tracks
what the player has explored on the world map. No rendering this
cycle; only data, persistence, and a clean public API.

## Files in scope

- NEW: `src/renderer/game/systems/discoverySystem.js`
- `src/renderer/game/systems/saveSystem.js` — additive only: extend
  the save schema with a `discovery` field (default: empty), and add
  load/save integration. Do NOT bump the schema version unless the
  shape change requires it; prefer additive merging.

## Out of scope

- Any rendering or visual change (different agents).
- Anything under `src/renderer/game3d/` (different engine).
- The 3D `save-bridge` agent's v4→v5 work (different scope).

## First cycle goal

1. Read `saveSystem.js` to understand the current save shape and
   defaults. Note its current schema version.
2. Create `discoverySystem.js` exporting:
   ```js
   // Public API:
   export function initDiscovery(width, height)        // create grid
   export function revealArea(px, py, radius)          // reveal tiles
   export function isDiscovered(x, y)                  // bool query
   export function getDiscoveryState()                 // serialize for save
   export function loadDiscoveryState(payload)         // hydrate from save
   export function resetDiscovery()                    // clear
   export const DISCOVERY_TILE_SIZE = 32              // grid cell size in world px
   ```
3. Internally, store discovery as a sparse `Set<string>` keyed by
   `${gx}_${gy}` rather than a dense 2D array — most of the world will
   be undiscovered most of the time, so the sparse representation
   saves memory and makes save payloads small.
4. Wire `getDiscoveryState()` into `saveSystem.js`'s save path; wire
   `loadDiscoveryState(...)` into the load path. Default to empty
   set when loading older saves that don't have the field.
5. Do NOT trigger renderer redraws this cycle — that's the fog-overlay
   agent's job. This module just owns the data.

## Standards

- JavaScript only — no TypeScript.
- Sparse `Set` storage — not a 2D array.
- No new top-level dependencies.
- Don't modify any scene file. Don't modify saveSystem beyond the
  additive `discovery` field + load/save hooks.
- Backwards compat: any save without a `discovery` field loads cleanly
  into an empty discovery state.

## Receipt requirement

Write to: `.claude/swarm/receipts/world-discovery-state-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- The exact shape of the persisted `discovery` payload
- Whether saveSystem's schema version was bumped (and why or why not)
- Backwards-compat verification: an old save loads with empty discovery
- Memory budget estimate for a fully-discovered map (sparse Set size)

Include `next_agent_suggestions: ["world-fog-overlay", "world-node-gating", "world-discovery-quests"]`.
