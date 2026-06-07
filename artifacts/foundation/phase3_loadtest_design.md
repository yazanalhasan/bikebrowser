# Phase 3 — Load Testing & Stress Visualization (design note)

Reference study: **chiguire/puente** (Unity mass-spring bridge sim). We reuse its *loop*, not its
code (Unity C#/PhysX, no license). We implement in our **Phaser 3 / JS** stack; the build already
bundles **rapier** (`vendor-rapier`) for real rigid-body + joint physics. The big upgrade over
puente: puente uses ONE fixed break-force per joint; **we drive failure from Phase-1 material
properties** (strength/stiffness/weight/failureMode/curve) and teach **compression vs tension**.

## What puente gives us (mechanics → our mapping)
- Design vs test mode switch: beams kinematic while building, become dynamic on test
  (`BridgeBeam.SetToPlay`/`ResetToSetup`). → our **design (Phase 2) → load-test (Phase 3)** toggle.
- Break-force failure: hinge joints with a `breakForce` threshold (terrain anchors 5.0 vs beam 2.55),
  `OnJointBreak` removes the member. → our **failure model**, threshold = material strength.
- Stress→color: `Color.Lerp(blue, red, force)` per beam. → our **green→yellow→red** stress zones.
- Load actor: `TrainController.AddForce` drives a train across; survive or collapse. → our
  **progressive load scenarios**.
- Budget: cost/budget meters, over-budget block. → already in Phase 2.

## Recommended model — HYBRID (deterministic lesson + physics drama)
A fully free rapier mass-spring is jittery and hard to *read* as a lesson. Use:

1. **Deterministic force solve (the teaching layer)** — on each load scenario, compute a per-member
   force from a simplified static model (treat the deck as a loaded beam over supports; distribute the
   scenario load to members by span/position). For each member:
   - `axialForce` and a sign (**compression** if pushed inward, **tension** if pulled apart).
   - `capacity = material.strength` adjusted by mode: use the material's **compression vs tension**
     asymmetry (e.g. Concrete: high compression capacity, low tension capacity — the Phase-1 outlier).
   - `stressRatio = |axialForce| / capacity` → clamp [0,1].
   - color: green (<0.6) → yellow (<0.9) → red (<1.0) → **fail** (≥1.0), failure styled by
     `material.failureMode` (brittle = snap, ductile = bend-then-yield, buckling = bow out).
   - deflection ∝ load / `material.stiffness` (stiffer = less sag).
2. **Physics payoff (the drama layer, rapier)** — when a member hits stressRatio ≥ 1, convert the
   structure to dynamic rapier bodies and let the failed member's joint release so the bridge visibly
   sags/collapses at the failure point (puente's design→dynamic switch, done with rapier impulse
   joints). On success, a small settle + the load crosses.

This keeps the *numbers* legible and curriculum-driven while still delivering puente's satisfying
collapse.

## Load scenarios (progressive)
person → handcart → loaded wagon → herd → **monsoon flood** (lateral + buoyant load on low members).
Each raises total load and changes distribution; flood adds horizontal force (tests bracing/anchors).

## Stress visualization (read-at-a-glance)
- Per-member color by stressRatio (3-zone), with a thin **compression (→←) vs tension (←→) arrow**
  overlay so the player SEES which members push vs pull (the core lesson).
- Deflection animation (sag) scaled by 1/stiffness.
- On failure: highlight the failed member, show `failureMode` label, and which material would have held.

## Data contract (reuse Phase 1 — do NOT duplicate)
Read from `act1Materials.js`: `strength, stiffness, weight, failureMode, curve, notes.compression,
notes.tension`. Add (if missing) explicit `compressionStrength` / `tensionStrength` (fall back to
`strength` when absent) so the asymmetry lesson is data-driven, not hardcoded.

## Suggested files (src/game/, match existing conventions)
- `src/game/phaser/systems/LoadTestSystem.js` — scenario runner + deterministic force solve + verdict.
- `src/game/phaser/systems/StructuralModel.js` — per-member force/stress/deflection from the bridge
  design (consumes Phase-2 component→material assignments + Phase-1 properties).
- `src/game/phaser/scenes/LoadTestScene.js` (or extend the bridge scene) — stress colors, arrows,
  deflection, failure FX; rapier only for the collapse payoff.
- Wire into the quest after Phase 2 design; pass on "structure survives the target scenario".

## Acceptance (runtime-verifiable, Playwright)
- Each scenario runs; members color by stress; compression/tension arrows render.
- A correctly-designed bridge (right materials per member) **survives** the target scenario; a wrong
  one (e.g. weak-tension material in a tension member) **fails at the predicted member**.
- Concrete-in-tension visibly fails where steel-in-tension holds (the teaching moment).
- `npm run build` green; existing e2e stay green.

## Non-goals
No free-physics sandbox as the primary mechanic (legibility first). No real engineering units —
relative 1–10 values, consistent with Phase 1.
