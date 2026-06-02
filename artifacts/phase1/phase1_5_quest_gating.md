# Phase 1.5 — Quest Gating

Enforce the engineering loop's real prerequisites and surface progress, so there
is no skipping, no accidental completion, no hidden objectives, and clear
incomplete-state feedback.

## Runtime-grounded design decision (divergence documented)
The quest **chain** in data (`find_materials → test → plan → reconnect →
desert_helper → mix_dry_test`) does **not** match the natural playable order
(ecology/chemistry are explored before the bridge). A rigid linear chain-gate
would **harm** the player experience. Per "runtime reality > docs; prefer best
player experience; document divergence": Phase 1.5 gates the **genuine
dependencies** of the engineering loop and leaves exploration (ecology,
chemistry, NPC dialogue) free-order. Design intent (a guided loop) is preserved;
the obsolete rigid-sequence reading is not implemented.

## What was already gated (verified)
- `ConstructionSystem`: bridge **plan** requires tested materials (`missing_tests`),
  rejects weak-scrap-only; **repair** requires a plan (`missing_plan`); **cross**
  requires repair. Build/Verify are evidence-gated.

## Changes (one scoped slice)
1. `Act1RuntimeSystem.testMaterial` — **gated on collection**: a material not in
   inventory returns `{ok:false, reason:'not_collected'}` with feedback
   ("Collect Steel before you can test it in the UTM."). Closes the "test without
   collecting" skip.
2. `getEngineeringLoop()` + `engineeringLoop` in `getAct1State` — exposes the
   five steps (`observe/predict/test/build/verify`), `complete`, and `nextStep`,
   so progress is visible and incomplete states are explicit (no hidden
   objectives).
3. `acceptance spec`:
   - asserts **test-before-collect is blocked** (`testMaterial('steel')` right
     after reset → `not_collected`, 0 tests).
   - asserts the **full loop completes in order** end-to-end (`observe/predict/
     test/build/verify/complete` all true). Coverage strengthened.

## Validation (runtime + state + UI + test + acceptance agree)
- `npm run build`: ✓ (8.2s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.6m)**.
- Engineering loop (live, end of walkthrough): `{observe, predict, test, build,
  verify, complete}` all **true**, `nextStep: 'complete'`.
- Gating proven: testing steel before collecting → blocked, 0 tests recorded.
- Console errors: none.

## Result — the loop is now enforced and legible
- The player cannot skip Collect→Test; Build/Verify remain evidence-gated; and
  the current step / next step is always visible. The Act-1 spine is a coherent,
  gated **Observe → Predict → Test → Build → Verify** loop.

## Governance
- Free local; acceptance-protected; small reversible commit; divergence from the
  rigid quest-chain documented; design intent preserved.

## Next
Phase 1.6 — Bridge Construction V1 (player selects materials / support design;
outcome depends on the choice). Then arc_alignment_report.md updated.
