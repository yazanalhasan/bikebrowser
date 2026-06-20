# Phase 2A — Role-Based Material Logic: Implementation + Fresh Audit

Approved scope: **role-based material logic only.** No rotation mechanics, no new
structural complexity, no new UI systems. Goal: the player learns *why* steel is a
good deck, *why* cables need tension strength, *why* foundations need compression
strength — not "memorize the green check."

## What changed
| File | Change |
|---|---|
| `src/game/data/act1/bridgeRoles.js` | **new** — `ROLE_REQUIREMENTS` (one named property per role) + `roleFit()` |
| `src/game/phaser/systems/ConstructionSystem.js` | solver now gates each role on its **role-relevant property**, not the single `bridgeSafe` flag; reasoned, plain-language verdicts |
| `src/game/phaser/scenes/BridgeDesignScene.js` | per-slot coaching: the empty slot names the property it needs; the held preview judges the material against that role and says why; placement + verdict feedback are role-aware (no new UI elements) |
| `tests/e2e/game-rebuild.bridge-roles.spec.js` | **new** — regression guard for the role inversion |

## The logic (child-nameable, one property per role)
| Role | Needs | Property used (already on each material) | Plain reason |
|---|---|---|---|
| deck | stiffness | `elasticity` ≥ 0.40 | "must be STIFF so it does not sag" |
| support | compression | `compressiveStrength` ≥ 0.50 | "a column — carries the load straight DOWN" |
| brace | strength | `strength/10` ≥ 0.50 | "the triangle's diagonal must be strong" |
| cable | tension | `tensileStrength` ≥ 0.50 | "holds the deck up by PULLING" |
| foundation | compression | `compressiveStrength` ≥ 0.50 | "SQUEEZED into the ground" |

Materials must still be **UTM-tested first** (Observe → Test preserved). Thresholds
are generous — several materials satisfy each role, so it is never a dead end.

## Fresh audit (live playthrough, captured on-screen text)
The same material, judged by the JOB — the "one number can't tell the whole story"
lesson, made explicit:
- Concrete on **SUPPORT** → `✓ strong when squeezed`
- Concrete on **FOUNDATION** → `✓ strong when squeezed`
- Concrete on **CABLE** → `⚠ tears apart when pulled`

Empty-slot prompt teaches before the player even picks:
> `Slot: DECK — the roadway you ride across.  Needs stiffness.  Pick a material: ◀ ▶ …`

Sound build verdict (`08_2a_sound_result.png`):
> ✅ The bridge holds! Every part fits its job — a stiff deck, compression-strong
> supports and foundation, and a tension-strong cable. The load has a safe path to
> the ground.

Failing teaching build — concrete in the cable (`09_2a_cable_fail.png`):
> 💥 The cable used Concrete, which **tears apart when pulled**. Cables hold the
> deck up by PULLING — they need tension strength. Hard things like concrete are
> weak when pulled.

## The required question: *Can a player explain why their bridge succeeded?*
**Yes.** At three separate moments the game states the reasoning in the player's own
terms:
1. **Before choosing** — the slot names the property it needs ("DECK needs stiffness").
2. **While holding** — the material is judged against that property with a reason
   ("CABLE needs tension strength. Concrete: ⚠ tears apart when pulled").
3. **At the verdict** — success/failure restates the load path in plain language.

A child can now answer: *"It held because the deck was stiff, the supports and
foundation were strong when squeezed, and the cable was strong when pulled."* That is
an explanation of a load path, not a memorized green check. **No further refining
needed for the 2A goal.**

Observe → Predict → Test → Trust Evidence is preserved: the player still **tests**
each material at the UTM (evidence), now **predicts** which role each property suits,
and the build **tests** that prediction with a reasoned outcome.

## Validation (all green)
- `npm run build` clean.
- Playwright **smoke**, **bridge-reachability** (2), **anti-clickthrough** (2),
  **phase1-engineering** — pass (weak balsa-deck still rejected; steel/steel/carbon
  still safe — backward compatible).
- **bridge-roles** (new): concrete→cable fails (names cable, "tension"); concrete→
  foundation holds; balsa→deck fails (names deck); a role-appropriate design holds.

## Scope honored
Role logic only. **No rotation change** (truss `R` left as-is for a future,
separately-approved sub-phase). No new UI systems — all coaching reuses the existing
subtitle/verdict text objects. No new physics or structural simulation. Backward
compatible (3-role debug designs and existing tests unaffected). Tray `✓/✗` stamps
(answer-leakage, proposal §4 / sub-phase 2b) intentionally **left for a separate
approval** — out of 2A scope.
