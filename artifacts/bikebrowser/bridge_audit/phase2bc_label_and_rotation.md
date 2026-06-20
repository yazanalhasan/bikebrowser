# Phase 2B + 2C — Label De-Leak & Brace Rotation (Executive Brain)

Both approved sub-phases, completed together. Still no new engine, no new UI
systems, no structural simulation. Child-understandable throughout.

## 2B — reduce answer leakage from tray labels
**Before:** every tray part was stamped `✓ held` / `✗ snapped` — the bridge answer
was printed on the piece, so the "puzzle" was "match green to slot."

**After:** the stamp is replaced with the **evidence the player's UTM test found**,
which they must interpret and map to a role. No pass/fail verdict on the tray.

Rendered tags (verified live):
| Material | Tag | What the player infers |
|---|---|---|
| Steel / Carbon fibre / Iron | `strong all-round` | works in most roles (honest — not one-trick) |
| Concrete / Brick | `strong: squeezing` | compression → support / foundation (NOT cable) |
| Bamboo | `ok: squeezing` | a fair, light all-purpose wood |
| Pine | `weak under load` | limited |
| Balsa | `very light, weak` | too weak for load-bearing |

Honesty fix during implementation: a naive "dominant property" tag labelled steel
*"strong: squeezing"* (hiding that it's also great in tension). Now any material
strong in all three reads `strong all-round`, so the tray never misleads. The
*precise* per-role truth still comes from the 2A held-preview ("CABLE needs tension.
Concrete: ⚠ tears apart when pulled") — tray = rough evidence, preview = role truth.
Tray legend added: *"the label is what your UTM test found."*

## 2C — make brace rotation meaningful (the triangle lesson)
**Before:** truss `R` was cosmetic; the solver ignored angle.

**After:** the **brace** now teaches the truss family's own concept — *"triangles
resist, rectangles deform."* A diagonal brace (45°/135°) is a triangle; a flat (0°)
or upright (90°) brace is a rectangle that racks and fails.

Design choices that keep it kid-safe and non-punishing:
- **Each slot defaults to its ideal orientation** (deck flat, support upright, brace
  a diagonal triangle). So the straightforward player who never touches `R` builds a
  triangle brace that works — the geometry gate only fires if they *deliberately*
  rotate the brace flat. (This is also why every existing keyboard test stays green.)
- The brace slot shows its shape live: `Shape: triangle ✓ (R to change)` or
  `⚠ Shape: rectangle — R to angle a triangle`.
- A flat brace fails **before** the material solver (UI owns geometry, mirroring the
  Da Vinci gate) with a reasoned verdict: *"A flat brace makes a rectangle, and
  rectangles rack and deform. Angle the brace into a diagonal triangle (press R) —
  triangles resist the load."*
- Rotation stays cosmetic on the other four roles; the `R` hint now reads
  `R angle (brace = triangle)` so it doesn't imply meaning elsewhere.

## Does the player still learn (and can they explain)?
Yes — 2C adds the geometry half of the lesson to 2A's material half. A child can now
explain a success on two axes: *"the deck was stiff, the supports and foundation were
strong when squeezed, the cable was strong when pulled — and the brace was a triangle,
so it didn't fold."* Observe → Predict → Test → Trust Evidence is intact (the brace
shape is a visible variable the player sets and the load test adjudicates).

## Scope honored
- No new UI systems — 2B reuses the existing tray text; 2C reuses the subtitle/verdict
  and the existing `R` control + per-zone `ideal` angles already in the data.
- No structural complexity — geometry is a single boolean (diagonal? ) gate, like the
  existing Da Vinci interlock check; no physics.
- Difficulty stays gentle — the default brace is already a triangle; nothing new is
  forced on the straightforward player.
- Backward compatible — the runtime solver (`designBridge`) is unchanged; geometry is
  UI-owned, so API/debug callers and `phase1-engineering` are unaffected.

## Validation (all green)
- `npm run build` clean.
- Playwright: **smoke**, **bridge-reachability** (2), **anti-clickthrough** (2),
  **bridge-roles** (2A), **phase1-engineering**, and **new bridge-geometry** (2C) —
  all pass.
  - new `game-rebuild.bridge-geometry.spec.js`: a deliberately-flattened brace
    (`braceIsTriangle=false`) fails the load test with a "triangle" verdict; the same
    sound materials with the default triangle brace hold.
- Tray evidence tags verified live (table above).
- Screenshots: `10_2b_tray_evidence.png`, `11_2c_brace_rectangle.png`.

This completes the bridge gameplay-depth track (Phase 1, 2A, 2B, 2C). No items from
the original proposal remain open.
