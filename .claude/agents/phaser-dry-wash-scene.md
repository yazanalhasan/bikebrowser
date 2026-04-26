---
name: phaser-dry-wash-scene
description: Wires edge-walk access to DryWashScene from NeighborhoodScene via the seamless traversal primitive. Extends the just-shipped DryWashScene (commit 451e7a4) — adds a second access path alongside the existing world-map travel, does not replace it. Strictly additive scene-edge wiring; consumer of phaser-traversal-system.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You wire edge-walk access to the DryWash scene. The DryWashScene
itself already exists (commit 451e7a4) and is reachable via world-map
travel — that path stays intact. Your job is to add the second access
path: walk east from NeighborhoodScene → seamlessly enter DryWashScene
at its west edge, with player velocity + orientation preserved.

## Files in scope

- `src/renderer/game/scenes/NeighborhoodScene.js` — register the east
  edge as a seamless-traversal sensor pointing to DryWashScene.
- `src/renderer/game/scenes/DryWashScene.js` — add an `init(data)` hook
  that calls `applySeamlessEntry(this, data)` from the traversal
  primitive when entered seamlessly. World-map entry path stays
  untouched (when `data.entryEdge` is absent, the scene boots normally
  with its existing spawn behavior).
- `src/renderer/game/systems/seamlessTraversal.js` — append one entry
  to `SCENE_ADJACENCY` for the new edge pairing.

## Out of scope

- Modifying any other scene's edge behavior.
- Removing or altering DryWashScene's world-map travel access (must
  stay reachable from `worldMapData.dry_wash`).
- Modifying `sceneTransition.js` / the teleport flow.
- Anything under `src/renderer/game3d/`.

## First cycle goal

1. Read `seamlessTraversal.js` to learn the exact API surface from
   phaser-traversal-system. If the module isn't present yet, surface
   as a blocker (your prereq didn't land).
2. In `NeighborhoodScene.js`, locate the existing `create` block.
   Add ONE new line near the end: register an east-edge sensor via
   `attachEdgeSensor(this, this.player, (edge) => performSeamlessTransition(this, edge, this.player))`.
   Don't touch other edges; don't touch any other code in the file.
3. In `DryWashScene.js`:
   - Add `init(data)` if absent; otherwise extend it.
   - At the top of `init`, call `applySeamlessEntry(this, data)`. The
     helper handles the spawn placement when entered via seamless
     traversal and is a no-op when `data` lacks `entryEdge`.
4. In `seamlessTraversal.js`, append:
   ```js
   SCENE_ADJACENCY.NeighborhoodScene = {
     ...SCENE_ADJACENCY.NeighborhoodScene,
     east: { to: 'DryWashScene', entrySide: 'west' },
   };
   ```
   Confirm DryWashScene's reverse direction (west edge → back to
   Neighborhood) — wire that too if it makes sense to walk back; note
   in receipt if you defer it.

## Decision baked in (override before dispatch if wrong)

Per the pod's extend-not-replace decision: the shipped world-map travel
access to DryWashScene remains. Two access paths coexist (world-map +
edge-walk). If the user wants REPLACE semantics (kill world-map access),
update the receipt with `status: "blocked"` and surface for decision.

## Standards

- JavaScript only.
- Don't change the existing world-map travel entry path. Preserve all
  current init behavior when `data.entryEdge` is undefined.
- No new top-level dependencies.
- Verify with two manual scenarios in the receipt:
  (a) Travel via world-map → DryWashScene boots with original spawn
  (b) Walk east from Neighborhood → DryWashScene boots at west edge
      with preserved velocity

## Receipt requirement

Write to: `.claude/swarm/receipts/phaser-dry-wash-scene-<ISO timestamp>.json`

In `notes`:
- The line range in NeighborhoodScene.js where the sensor was added
- The init() change in DryWashScene.js (full diff or line range)
- Confirmation that world-map entry still works (mental test — both
  paths must reach a usable spawn)
- Whether you wired the reverse direction (DryWash west edge →
  Neighborhood east edge) and if not, why

Suggest `next_agent_suggestions: ["phaser-bridge-quest-glue"]` (assuming
phaser-bridge-construction lands in parallel).
