# Phase 1.1 — Ecology Observation Completion

Wire the full desert ecology observation path (mesquite + creosote + saguaro) so
the `desert_helper` quest completes and each observation is a visible field note.

## Runtime-grounded scope correction
The roadmap framed this as "notebook 13→16 via creosote/saguaro." Code reality
(verified): the 16 notebook entries had **no** creosote/saguaro; the 13/16
walkthrough gap is the **language/trust** path (`spanish_interaction`,
`arabic_interaction`, `trust_milestone`) — deferred to Phase 2. The genuine
ecology gap was that the `ecology_patch` interaction observed **mesquite only**,
leaving `observe_creosote`/`observe_saguaro` objectives unreachable. This
sub-phase fixes the ecology path and adds the two missing ecology notebook
entries (per the ecology-first decision in `current_source_of_truth.md`).

## Changes (one scoped slice)
1. `src/game/data/act1/act1NotebookEntries.js` — added two **Ecology** entries:
   `creosote` and `saguaro` (bodies grounded in `act1Ecology.js` data). Notebook
   total 16 → 18.
2. `src/game/phaser/systems/Act1RuntimeSystem.js`:
   - `ecology_patch` handler now observes **all three** desert plants
     (`['mesquite','creosote','saguaro'].forEach(observeEcology)`), completing
     `observe_mesquite/creosote/saguaro` (→ `desert_helper` quest complete) plus
     `collect_mesquite`.
   - `observeEcology` now unlocks the **species-specific** notebook entry
     (mesquite/creosote/saguaro) alongside the shared `desert_plant`, so every
     observation is a visible "New field note".
3. `tests/e2e/game-rebuild.act1-acceptance.spec.js` — **strengthened** the final
   notebook assertion to require `mesquite`, `creosote`, `saguaro` (acceptance
   coverage for the completed ecology path). No assertion weakened/removed.

## Validation (runtime + state + UI + test + acceptance all agree)
- `npm run build`: ✓ (17.3s, only pre-existing chunk-size warnings).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.7m)**.
- Runtime state (`act1_player_visible_acceptance_report.json`):
  - `act1Complete: true`, `bridgeReconnected: true`, `widerMapUnlocked: true`,
    `materialTestCount: 4`.
  - Notebook unlocked: **15** (was 13). Ecology entries present:
    `desert_plant, mesquite, creosote, saguaro`.
- Visible feedback: three "New field note" unlocks + per-species ecology feedback
  ("Creosote: spaced leaves, survives dry soil." etc.) on observing the patch.
- Screenshots: `playtest_captures/game_rebuild_act1_acceptance/05_ecology_
  observation.png` (+ full set regenerated).
- Console errors: none.

## Result
- Notebook **15/18** (ecology complete; remaining 3 = language/trust, Phase 2).
- `desert_helper` quest now completes (all 3 ecology objectives reachable).
- Player loop served: **Observe** (three plants, distinct field notes) — the
  first piece of the Observe→Predict→Test→Build→Verify loop.

## Governance
- Free local (code + Playwright); no paid/heavy tools; acceptance-protected;
  small reversible commit; no un-owned drift swept in.

## Lessons learned
- The notebook "count" framing in the roadmap didn't match runtime; verifying the
  actual entries/objectives first avoided building the wrong thing. (Recorded for
  the lessons store: verify notebook/quest wiring against code before trusting a
  count target.)

## Next
Phase 1.2 — Real per-material UTM (player can choose poorly/well; visible,
different outcomes).
