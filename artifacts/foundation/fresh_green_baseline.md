# Fresh Green Baseline (Phase 0.3)

The restored green baseline after Phase 0 (repo integrity + acceptance recovery).
All Phase 1 work is measured against this.

## Commits
- **BikeBrowser (game):** `76fe40e` — `fix(game): restore Act 1 acceptance by
  separating workbench interaction zones` (branch `overnight/sprint-1-phase-2`).
- **Executive Brain (repo integrity):** `9e227fe0` — `fix(repo): track brain
  artifacts source package` (branch `release-candidate-hardening`).

## Acceptance result — GREEN
- **Playwright** `game-rebuild.act1-acceptance`: **1 passed (1.6m)** after the
  zone-separation fix.
- Final state (from `act1_player_visible_acceptance_report.json`):
  - `act1Complete: true`
  - `bridgeReconnected: true`
  - `widerMapUnlocked: true`
  - `materialTestCount: 4`
  - `playerVisibleWalkthrough: true`, `backendCompletionShortcutsUsed: false`
- **Brain acceptance audit:** prior golden baseline established min score ≥ 82
  (threshold 80); re-run on demand. Playwright is the authoritative player-visible
  signal for this fresh baseline.

## Notebook
- **13 / 16** entries unlocked on the core path (unchanged from golden baseline):
  bike_check, broken_wash, bridge_problem, steel, copper_brace, weak_scrap,
  mesquite, desert_plant, chemistry_result, material_test_results, bridge_plan,
  bridge_repaired, wider_map_unlocked.
- The 3 not on the core path: `spanish_interaction`, `arabic_interaction`,
  `trust_milestone` (language/trust — Phase 2). There are **no** creosote/saguaro
  notebook entries yet (Phase 1.1 ecology-first adds them).

## Screenshots
- 12 fresh frames: `playtest_captures/game_rebuild_act1_acceptance/00_start.png …
  11_final_notebook_completion.png` (regenerated this run).

## Console errors
- **None** recorded (`audioSummary.errors: []`). Audio hook verified
  (`hookVerified: true`); browser TTS path active.

## Executive Brain health
- Full suite: **440 passed** (436 + 4 new repo-integrity guards).
- Clean checkout now imports: `git archive HEAD | tar -x; python -c "import
  brain.cli"` → OK (was ModuleNotFoundError before the integrity fix).

## Known caveats
- `neighborhood.layout.json` carries prior uncommitted layout additions
  (`map_gate`, `garage_workbench_prop`, resized GPS/markers) now committed as
  KEEP; the live runtime uses them.
- Unrelated working-tree drift (Godot prototypes, modified `playtest_captures/
  *.png` from other runs, `generated_assets/`, `backups/`, stray `brain/`,
  `tools/*.mjs`) remains **uncommitted and un-owned** — left for operator review;
  not swept into any commit.
- Acceptance hardening S1 (`interactions.byId()` precise navigation) remains an
  optional defense-in-depth against future closely-spaced zones.
- Interaction-cue SFX + ambient are instrumented-but-silent (known; voice audit).

## Gate status: GREEN ✅ — Phase 1 may begin.
