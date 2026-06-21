# Skate Park — Phase 0 Audit (Executive Brain)

Read-only audit of whether existing systems can support the Skate Park, per the
directive. **Stops and surfaces architectural conflicts before any code** (the
directive's own Phase 0 rule). Verdict up front: the *data, materials, unlock, and
layout* substrate reuses cleanly; the *riding model* and the *target tree* are real
conflicts that must be decided before implementation.

## Reuse-feasibility answers (the directive's questions)
| Capability | Reusable today? | Detail |
|---|---|---|
| **place / move / rotate / delete** for park objects | **Partially** | `BridgeDesignScene` already does drag-place + `R` rotate + `⌫` remove — but only into 5 *fixed, named* bridge role-zones. Free-form placement onto an open park surface is new (no existing free-placement editor). The drag/rotate *patterns* port; the grid/surface does not. |
| **save / load** layouts | **Load: yes. Save: no (player-facing).** | `loadLayout()` reads `public/layouts/*.json` (data-driven ✓). But arc.md's Layout Editor is explicitly **developer-facing, not player-facing** — there is no in-game player save flow. A legacy `saveSystem.js` exists in the dead renderer tree. Player save/load is **new work**. |
| materials: **wood / concrete / steel / composite** | **Identity: yes. Friction/surface: no.** | act1Materials has pine/balsa (wood), concrete, steel, carbon_fiber (composite), brick, iron, bamboo — with `strength/stiffness/elasticity/density/compressive/tensile`. **There is NO `friction`/`grip`/`surface` field** — which the skate park needs. → add surface-friction as a *carry-forward extension* of the material schema, do not fork materials. |
| layouts: **modular park construction** | **Yes (loading)** | The data-first `public/layouts/` + `loadLayout` pattern fully supports modular, data-driven obstacle layouts. |
| **BMX riding** reuses player movement | **NO — fundamental mismatch** | Live movement is **top-down 8-direction walking** (`InputSystem` + a top-down arcade body in `NeighborhoodScene`). Skate riding is **side-view momentum physics** (gravity, ramps, air time, landing angle, trajectory). These are different physics models. Riding needs a **new side-view scene**, not the walking controller. |
| **post-bridge unlock** reuses quest progression | **Yes — clean** | `constructionSystem.bridgeReconnected` already gates the wash + `wider_gate`; `act1Locations` uses a `locked` flag → `unlockedDestinations`. A `skate_park` location locked until `bridgeReconnected` reuses this exactly. |

## Architectural conflicts (must decide before Phase 2/3)

### 🔴 C1 — Target tree: the directive points at the DEAD tree
The directive says implement in `src/renderer/game/systems/skatepark/`. But the
**live game is the Phaser rebuild** (`src/game/phaser/`, route `/game-rebuild`); the
`src/renderer/game/` React-three tree was **quarantined as abandoned** earlier in this
project. Everything I'd reuse (ConstructionSystem, MaterialsLabSystem, loadLayout,
NeighborhoodScene, quest/unlock) lives in `src/game/phaser/`. **Building in
`src/renderer/` would be invisible in the shipped game.**
→ **Recommend:** `src/game/phaser/systems/skatepark/` + a new `src/game/phaser/scenes/SkateScene.js`.

### 🔴 C2 — Riding is side-view physics, not top-down walking
(see table) The core "does riding feel fun?" loop needs a dedicated **side-view
arcade-physics scene** (gravity, ramp launch, air, landing quality). It cannot reuse
the NeighborhoodScene walking controller.
→ **Recommend:** a modal `SkateScene` entered from the park location (the same
`*:start` event pattern as Prediction/Bridge/Crossing scenes), with Phaser arcade
gravity. The neighborhood stays top-down; the park *ride* is its own scene.

### 🟠 C3 — Act-1 scope freeze
Decision #20 froze Act 1 to bug-fixes/polish until playtest feedback. The Skate Park
is a major new feature. **This directive is the owner explicitly overriding the
freeze** — recorded as such. Mitigation: the park is **gated behind the post-bridge
unlock**, so it sits *off* the frozen critical path (an optional destination), keeping
playtest risk low. Recommend building it gated/dark so it can't regress the Act-1 slice.

### 🟠 C4 — No player-facing construction editor / save
Player place/save/load is new (C above). Recommend phasing: **ship riding on authored
layouts first** (data-driven, no player editor), add the player build+save editor in a
later phase reusing the BridgeDesignScene drag patterns + a save system.

### 🟡 C5 — "Visual Truth Agent" = human review
This box has **no local multimodal art critique** (standing governance: art quality =
Human). The Visual-Truth gate is therefore a **human visual review** of the Visual
Bible + concepts. I can produce the bible and *procedural placeholder* park art now;
**iconic production assets remain human-gated** (consistent with all prior art rules).

## What reuses cleanly (the good news)
- **Material identity + schema** (add a `surfaceFriction`/`grip` field; reuse
  steel/concrete/wood/composite and their existing properties — the carry-forward
  contract from arc.md §4 holds).
- **Data-driven layouts** (`public/layouts/skatepark.*.json` + `loadLayout`).
- **Unlock gating** (`bridgeReconnected` → `act1Locations` `locked` flag → world-map
  destination + a `skate_park` interaction in the neighborhood).
- **Modal-scene entry pattern** (`registry.events.emit('skate:start')` ↔ a SkateScene
  listener — exactly how Prediction/Bridge/Load-test scenes mount).
- **The trigger-graph audit** (`npm run audit:triggers`) to keep the new events wired.

## Recommended build order (smallest-useful-first; matches "do not build everything at once")
1. **P2 (data + unlock, low-risk):** obstacle data model + initial 6 obstacles + one
   authored `public/layouts/skatepark.level1.json` + a `skate_park` location locked
   until `bridgeReconnected` + world-map destination. Validate: locked before repair,
   unlocked after. *(No physics yet — testable immediately.)*
2. **P3 (BMX prototype):** `SkateScene` side-view arcade physics — ride/accelerate/
   brake/jump/land/fail-safe — riding the authored layout. + **Physics Goggles**
   overlay (speed/velocity/trajectory/landing prediction/friction). Validate fun + the
   physics readouts.
3. **P4+:** flow_score + park metrics, community sim, ≥3 reasoning quests, then the
   player placement editor + save/load.

## Decision gate (blocking — surfaced to the owner)
Before Phase 2/3 code I need confirmation on **C1 (tree)**, **C2 (new SkateScene /
side-view physics)**, and **C3 (freeze override, build gated)**. C4/C5 are sequencing/
art-governance and have safe defaults (phase the editor; human art gate). Phase 1
(Visual Bible) is produced now regardless, since it's mandatory and doc-only.
