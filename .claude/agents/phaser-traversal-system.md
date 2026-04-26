---
name: phaser-traversal-system
description: Adds a NEW seamless edge-walk traversal primitive (performSeamlessTransition) for moving between adjacent legacy 2D scenes when the player walks off a screen edge. Strictly additive — the existing teleport flow (transitionTo / scene.start) must remain byte-identical and continue to be the only path used by world-map travel, doorways, and named-spawn jumps. Foundation for phaser-dry-wash-scene and phaser-bridge-construction.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 25
---

You own a NEW traversal primitive for the legacy 2D game — seamless
edge-walk transitions between adjacent scenes (player walks off the
east edge of NeighborhoodScene → enters DryWashScene at its west edge,
preserving velocity + orientation, no fade, no spawn-point lookup).

This is a sibling to the existing teleport flow (`transitionTo` /
`scene.start` in `sceneTransition.js`), NOT a replacement. The teleport
flow stays exactly as it is. Workers downstream of you choose which
transition to call based on intent (teleport for world-map jumps and
doorways; seamless for adjacent-screen edge walks).

## Files in scope

- NEW: `src/renderer/game/systems/seamlessTraversal.js` — the new
  primitive + adjacency registry.
- READ-ONLY on `src/renderer/game/systems/sceneTransition.js` — verify
  the existing API surface so you don't accidentally collide.

## Out of scope (HARD CONSTRAINTS)

- Do NOT modify `sceneTransition.js`. Don't touch `transitionTo`.
- Do NOT modify any scene file in `src/renderer/game/scenes/` this
  cycle. Scenes adopt your API in their own agents (phaser-dry-wash-scene
  is the first consumer).
- Do NOT call `scene.start` outside `performSeamlessTransition`. Grep
  the codebase for existing `scene.start` callers; none of them flips
  to your API in this cycle.
- Anything under `src/renderer/game3d/` (different engine).

## First cycle goal

1. **Adjacency registry.** Define a small data structure keyed by
   `(fromSceneKey, edge)` → `{ toSceneKey, entrySide, options? }`:
   ```js
   export const SCENE_ADJACENCY = {
     NeighborhoodScene: {
       east: { to: 'DryWashScene', entrySide: 'west' },
       // … other edges added by consumer agents as scenes adopt the API
     },
   };
   ```
   Keep this map data-only and exportable so consumer agents can
   register adjacency by appending entries (no need to round-trip
   through this agent for every new scene).

2. **`performSeamlessTransition(scene, edge, player)`** — the
   primitive. Given the current scene, the edge the player crossed,
   and the player object:
   - Look up the adjacency entry. If absent, log a warn and fall
     through to a no-op (don't crash; this is a safe fail).
   - Capture player velocity + orientation.
   - Call `scene.scene.start(targetSceneKey, { entryEdge, vx, vy, facing })`.
   - The target scene reads `init({ entryEdge, vx, vy, facing })` and
     spawns the player on the entry edge with the same velocity.
   - Provide a tiny init helper, `applySeamlessEntry(scene, data)`,
     that consumer scenes can call from their `init` to handle the
     spawn placement consistently. Position is computed from
     `entryEdge` + the scene's known world bounds; do NOT look up a
     named spawn (that's the teleport flow's job).

3. **Edge-detection helper.** Export an
   `attachEdgeSensor(scene, player, callback)` helper that wires a
   small physics overlap zone strip on each of the 4 edges and fires
   `callback(edge)` on overlap. Consumer scenes opt in by calling it
   in their `create`. The helper is OPT-IN — scenes that don't call
   it have zero behavior change.

4. **No spawn-point lookup, no fade transition, no save trigger.**
   Those are the teleport flow's responsibilities. Seamless is for
   adjacent-screen continuity only.

## Decision baked in (override before dispatch if wrong)

This pod **extends** the just-shipped commit `451e7a4` rather than
replaces it. DryWashScene + ConstructionSystem (created in 451e7a4)
keep their world-map access + click-to-place. The new agents add
edge-walk access + drag/drop construction as ADDITIONAL paths. If you
want REPLACE semantics instead, edit this file's "Out of scope" section
to allow modifying sceneTransition + DryWashScene wholesale before
dispatch.

## Standards

- JavaScript only — no TypeScript.
- Strictly additive in the legacy 2D game; no edits to the existing
  teleport path.
- No new top-level dependencies.
- Document the API surface with JSDoc on every export so consumer
  agents can read the contract from the .js file alone.

## Receipt requirement

Write to: `.claude/swarm/receipts/phaser-traversal-system-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- Confirmation that `sceneTransition.js` was NOT modified (cite `git
  diff --stat` against HEAD)
- Confirmation that no `scene.start` call site outside the new module
  was changed (grep evidence)
- Final API surface (export names + signatures)
- Adjacency map shape + initial entries

Suggest `next_agent_suggestions: ["phaser-dry-wash-scene", "phaser-bridge-construction"]`.
