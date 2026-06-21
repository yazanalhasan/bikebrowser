# Skate Park — Architecture (Executive Brain)

How the Skate Park is built in the **live Phaser tree** (`src/game/phaser/`),
reusing existing systems per arc.md. Confirmed decisions: build in Phaser (not the
dead `src/renderer/` tree); riding is a new side-view scene (cannot reuse top-down
walking); ship gated/dark behind the post-bridge unlock; smallest-useful-first.

## System map (what reuses, what's new)
| Concern | Reuses | New |
|---|---|---|
| Obstacle definitions | act1 data pattern (like materials) | `src/game/data/act1/skateparkObstacles.js` (catalog) |
| Material behavior | `act1Materials` ids + schema | `surfaceFriction` per-obstacle field (carry-forward extension) |
| Park state/metrics | Portability Principle (player-owned system) | `src/game/phaser/systems/skatepark/SkateParkSystem.js` |
| Layouts | `public/layouts/` + `loadLayout` + PreloadScene registry | `public/layouts/skatepark.level1.json` |
| Unlock | `bridgeReconnected` + `act1Locations` + world-map points | `lockedUntilBridge` flag (handled in `getWorldMapLocations`) |
| Scene entry | `registry.events.emit('*:start')` modal pattern | **Phase 3:** `skate:start` ↔ `SkateScene` |
| Riding physics | — (top-down walking does NOT transfer) | **Phase 3:** side-view arcade physics in `SkateScene` |
| Construction editor | BridgeDesignScene drag/rotate patterns | **Phase 4:** player place/move/rotate/save/load |

## Obstacle data model (shipped)
`id, type, displayName, width, height, radius, angle, material, surfaceFriction,
difficulty, educationalTags, connectionPoints, spriteKey`. `material` is an
act1Materials id (steel/concrete/pine=wood/carbon_fiber=composite) so a rail's steel
is *the same steel* the UTM tests; `surfaceFriction` is the new grip field;
`educationalTags` target the arc.md ladder (distance/speed → angles → systems/
trajectories) so reasoning quests select by concept. Initial set (6): launch_ramp_s,
quarter_pipe, low_rail, grind_box, manual_pad, pump_segment.

## Layout format (shipped, data-driven)
`public/layouts/skatepark.level<N>.json`: `{ scene, version, level, state, ground,
obstacles:[{ obstacle, x, y, angle, condition }] }`. `condition`
(ok/temporary/cracked/missing) drives the **visual evolution** (L1 = partially
damaged). Generic enough to later power BMX parks / tracks / testing grounds (arc.md).

## Unlock mechanism (shipped)
`world_map_hud.points.skate_park` carries `lockedUntilBridge: true`;
`getWorldMapLocations` now computes `locked` from
`lockedUntilBridge && !state.bridge.bridgeReconnected`. So the park is a known-but-
locked destination before the repair and reachable after — reusing the exact pattern
`wider_gate` uses for `lockedByWiderMap`. `revealedWhenLocked` keeps it visible on the
mini-map as a draw (visual identity goal: "want to visit even with no quest").

## Phase 3 plan — `SkateScene` (side-view BMX prototype)
- Modal scene mounted via `skate:start` (mirrors Prediction/Bridge/Crossing).
- Phaser **arcade physics with gravity**; the player is a side-view BMX body.
- Reads the preloaded `skateparkLevel1` layout → builds obstacle bodies from the
  catalog (ramps = angled platforms/slopes; rails/boxes = thin platforms; quarter =
  curved transition; pump = wave). Each body's friction = obstacle `surfaceFriction`.
- Loop: ride / accelerate / brake / jump / land / fail-safe (bail, no death).
- **Physics Goggles** overlay (toggle): velocity vector, momentum, predicted
  trajectory arc, landing marker, friction loss — "see the concept before reading it."
- `SkateParkSystem.flowScore` computed from the ride (momentum preserved across a
  chained line); feeds Phase 4 metrics/community/reasoning quests.
- Entry: a `skate_park` neighborhood interaction marker (gated on `bridgeReconnected`)
  that emits `skate:start` — added WITH the scene so there is no orphaned event
  (verified by `npm run audit:triggers`).

## Phase 4+ roadmap
Flow/safety/creativity/popularity metrics → NPC community simulation (preferences) →
≥3 reasoning quests (prediction/optimization/experimental-design/systems) → player
construction editor + save/load (reusing BridgeDesignScene drag patterns + a save
system) → visual evolution L2–L5 (human-gated production art per the Visual Bible).

## Guardrails honored
Data-driven (no hardcoded layouts/behavior); player-owned system, not scene-owned
state (Portability Principle); material schema reused not forked; built behind the
unlock so the frozen Act-1 critical path is unaffected; new events will be wired +
audited; production art human-gated.
