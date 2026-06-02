# Golden Baseline — canonical pre-Phase-1 reference

The reference point for all Phase-1 work. Captured once the acceptance gate
was green (3/3). Phase-1 changes are measured against this.

## Commit / tag
- **Commit:** `84a3766` ("fix(acceptance): deterministic walk navigation").
- **Baseline WIP preserved at:** `0523c7e` (parent: pre-WIP rebuild state).
- **Tag:** `baseline_pre_phase1` → the golden-baseline commit.

## Acceptance — GREEN
- **Playwright** `game-rebuild.act1-acceptance`: **3/3 consecutive PASS**
  (1.5m / 1.6m / 1.5m). Final-state assertions all pass: `act1Complete=true`,
  `bridgeReconnected=true`, `widerMapUnlocked=true`, required notebook
  entries unlocked, `materialTestCount=4` (≥4), feedback contains "Wider map
  unlocked".
- **Brain acceptance audit** (`run_act1_acceptance_audit`): **PASS**, evidence
  fresh. Scores: quest_playability 88, visual 84, audio 90, npc 85, notebook
  82, educational 84, exploration 82, world_scale 82, placeholder 88,
  completion 88 (min scored = **82**, threshold 80).

## Runtime state (the Act-1 vertical slice, playable)
- **Act 1 completes end-to-end** through visible UI: bike check → Mr. Chen →
  dry wash → collect materials → UTM tests → bridge plan → repair → cross →
  trust → wider-map unlock → Field Notebook.
- **Notebook: 13/16** clues unlocked (the 16/16 is a Phase-1 target — the
  `desert_helper` `observe_creosote`/`observe_saguaro` objectives are not yet
  scene-wired).
- **Material tests: 4.** Bridge reconnected. Wider map unlocked.
- **4 characters** (Zuzu, Mr. Chen, Mrs. Ramirez, Auntie Mariam) — art audit
  PASS.

## Evidence captured
- Screenshots: `playtest_captures/game_rebuild_act1_acceptance/00_start.png
  … 11_final_notebook_completion.png` (regenerated this run).
- Player report: `…/act1_player_visible_acceptance_report.json`
  (playerVisibleWalkthrough=true, backendCompletionShortcutsUsed=false,
  finalState.act1Complete=true).
- Brain reports: `artifacts/act1_acceptance/act1_acceptance_summary.{json,md}`
  + `history.jsonl` (PASS row).

## Performance reference
- Rebuild game chunk ~174 kB; boots a single scene; sub-second load.

## What this baseline means
This is the **canonical reference**. Every Phase-1 change must keep this
GREEN (Playwright 3/3 + Brain PASS) and should *improve* a measured
dimension (e.g. notebook 13→16) without regressing any other. The
`phase1_change_log.md` will track score deltas against this baseline.
