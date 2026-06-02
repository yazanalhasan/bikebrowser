# Pre-Phase-1 Acceptance Snapshot

The reference snapshot captured immediately after the acceptance gate went
green. Canonical detail in `golden_baseline.md`; this is the at-a-glance
record.

- **Commit:** `84a3766` (acceptance green). Baseline WIP: `0523c7e`.
  **Tag:** `baseline_pre_phase1`.
- **Acceptance score (Brain):** PASS — min scored dimension **82/100**
  (threshold 80); quest_playability 88, visual 84, audio 90, npc 85,
  notebook 82, educational 84, exploration 82, world_scale 82, placeholder
  88, completion 88.
- **Playwright acceptance:** 3/3 PASS.
- **Notebook progress:** **13/16** clues (16/16 is a Phase-1 target).
- **Act 1 completion state:** `act1Complete=true`, `bridgeReconnected=true`,
  `widerMapUnlocked=true`, `materialTestCount=4`.
- **Screenshots:** `playtest_captures/game_rebuild_act1_acceptance/00_start
  … 11_final_notebook_completion.png`.
- **Player report:** `…/act1_player_visible_acceptance_report.json`
  (playerVisibleWalkthrough=true, backendShortcuts=false).

This is the number every Phase-1 step is compared against in
`phase1_change_log.md`.
