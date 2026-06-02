# Canonical Hybrid Architecture

The agreed foundation for BikeBrowser going forward. Supersedes the
"two competing trees" ambiguity with one canonical model.

## The model
- **Rebuild (`src/game/`, `/game-rebuild`) = the canonical spine.** All
  shipped gameplay lives here. It owns coherence, polish, performance, and
  the acceptance pipeline.
- **Legacy (`src/renderer/game/`, `/legacy-play`) = the validated
  gameplay/depth library ("parts bin").** It is the source of proven
  mechanics to port — never a parallel shipping target.
- **The acceptance pipeline = the non-negotiable gate.** Nothing enters
  the spine without passing `game-rebuild.act1-acceptance.spec.js` green
  and Brain score ≥ accepted.

## Legacy Preservation Principles
1. **Rebuild remains the canonical architecture.**
2. **Legacy is the proven gameplay/depth library, not trash.**
3. Any legacy feature that demonstrably improves **fun, exploration,
   mastery, reasoning, engineering, or simulation** must be **evaluated
   before replacement** (see `legacy_preservation_registry.md`).
4. **No feature may be removed solely because it lives in the legacy
   tree.**
5. The rebuild **must inherit the best gameplay ideas from legacy** (the
   25 gems).
6. **Legacy is a parts bin, not a trash bin.**
7. **The best legacy systems become rebuild systems, not parallel
   systems** — ported into the spine, gated by acceptance, preserving
   rebuild polish/performance/testability.

## Port order (agreed)
1. **Stress-strain UTM** behind the rebuild UTM UX.
2. **Captured-hypothesis predict-before-test** step (neither tree has it).
3. **Adaptive reasoning grader** (`CognitiveEngine.js`).
4. **Interactive bridge construction** behind the evidence gate.
5. **2–3 real biomes + world-map fast-travel.**
6. **E-bike and economy** later.
Deferred entirely: the design-only spine (biology substrates, Sonoran
dataset, vehicles beyond e-bike, genetics/terraforming) — unbuilt in both
trees.

## Port discipline (every port obeys all)
- Becomes a **rebuild system**, not a parallel one (Principle 7).
- Preserves rebuild **polish, performance (≤ small bundle), testability**.
- Must **pass or extend** the acceptance pipeline before merge.
- Must **not hollow a non-negotiable** (`non_negotiable_legacy_features.md`).
- Acceptance run **after each change** (no big-bang merges).

## Legacy Preservation Score (feeds the Foundation Readiness Report)

| Metric | Value | Basis |
|---|---|---|
| Legacy value catalogued | **100%** | All 25 listed subsystems classified (registry) |
| Value formally PRESERVED/PORT-tracked | **~85%** | 14 PORT + 2 PRESERVE + 4 deferred-port; only design-only/orphaned set to REFERENCE/ARCHIVE |
| Value at RISK of loss | **~0% (locked) / ~15% (latent)** | Locked by this registry; latent risk = the deferred/ARCHIVE set if never revisited |
| Non-negotiables protected | **10/10** | `non_negotiable_legacy_features.md` |
| Discarded so far | **0** | Principle 4 |

**How much of legacy's value is preserved?** ~85% is explicitly on the
PORT/PRESERVE track; the remaining ~15% (vehicle-sim, biology Stage2/3,
factory, mining, design-only substrates) is **ARCHIVE/REFERENCE — held,
not lost.** Nothing is removed.

**How much is at risk?** With this registry in force, **near-zero is at
risk of accidental loss.** The only standing risk is *latent*: deferred
systems that never get a gameplay reason. Mitigation: they stay ARCHIVE
(recoverable), reviewed at each phase boundary.

**Which legacy systems should be integrated FIRST?** Per port order:
(1) stress-strain UTM, (2) predict-before-test, (3) reasoning grader.
These are highest value × proven maturity × medium complexity.

**Which should remain DEFERRED?** E-bike/battery/economy (Phase 3+),
vehicle simulation, biology Stage 2/3, factory, mining-as-metagame, and
all design-only substrates — until the core loop is deep and a gameplay
reason exists.

## Foundation Readiness verdict
Preservation is **LOCKED**. Phase 1 may begin: its five changes extend
non-negotiables #1/#2/#6/#7 and discard none of the ten. Proceed under the
port discipline above, acceptance-green after each change.
