# Act 1 Truth Pass Validation Report

Date: 2026-05-26

## Passed

- `npm run build`
- `node --check src\main\main.js`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\export-godot-web.ps1`
- Playwright targeted smoke:
  - `route-coherence.smoke.spec.js`
  - `godot-prototype.smoke.spec.js`
  - `godot-bike-repair-visual.smoke.spec.js`
- Playwright mobile smoke:
  - `/play` at 390x844 viewport
- Godot checks:
  - `project_audit\runtime_repair_smoke.gd`
  - `tests\vertical_slice_check.gd`
  - `tests\act1_player_path_check.gd`
  - `tests\act1_regional_readiness_check.gd`
  - `tests\chain_hotspot_embodied_check.gd`
  - `tests\chain_rig_state_check.gd`
  - `tests\tire_rig_state_check.gd`
  - `tests\notebook_inventory_check.gd`
  - `tests\art_asset_contract_check.gd`
  - `tests\chain_orientation_check.gd`
  - `tests\tire_patch_alignment_check.gd`
  - `tests\quest_objective_schema_check.gd`
  - `tests\data_only_quest_check.gd`
  - `tests\station_evidence_check.gd`
  - `tests\act1_hud_guidance_check.gd`
  - `tests\input_prompt_mapping_check.gd`

## Captures

Updated Playwright captures:

- `project_audit/screenshots/bike_repair_visual_correctness_rescue/bike_repair_visual_preview.png`
- `project_audit/screenshots/bike_repair_visual_correctness_rescue/mrs_ramirez_prompt_before_accept.png`
- `project_audit/screenshots/bike_repair_visual_correctness_rescue/mrs_ramirez_prompt_after_accept.png`

## Warnings

- Vite still reports existing chunk-size warnings and package module-type warnings.
- Playwright Vite dev server reports `/health` proxy connection refusal when the API server is not running; the browser smoke tests passed.
- Headless Godot still prints resource-leak warnings after checks complete; all relevant scripts exit 0.
- `quest_objective_schema_check.gd` intentionally emits a Godot error for `__phantom_objective__` to prove strict rejection is active, then exits 0.

## Not Run

`npm run test:e2e` full-suite was not run because the requested pass focused on canonical Godot Act 1, targeted route/play/prompt coverage, and the legacy route smoke. The targeted browser suite passed.
