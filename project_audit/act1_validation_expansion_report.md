# Act 1 Validation Expansion Report

Date: 2026-05-26

## Added Checks

- `art_asset_contract_check.gd`: surfaced Act 1 repair assets must be production PNGs with adjacent `.aseprite` sources.
- `chain_orientation_check.gd`: validates rear wheel, rear sprocket, chainring, chain path, and pedal-driven wheel motion for the right-facing bike.
- `tire_patch_alignment_check.gd`: validates single-patch art, leak alignment, pump hose, and inflation/readiness states.
- `quest_objective_schema_check.gd`: rejects undeclared objective recording and audits known station/script references.
- `data_only_quest_check.gd`: reports registered quests without player-facing wiring unless explicitly deferred/backend-only.
- `station_evidence_check.gd`: rejects bridge lesson completion by repeated generic station clicks.

## Existing Checks Retained

- `chain_rig_state_check.gd`
- `tire_rig_state_check.gd`
- `chain_hotspot_embodied_check.gd`
- `act1_player_path_check.gd`
- `act1_regional_readiness_check.gd`
- `notebook_inventory_check.gd`
- `runtime_repair_smoke.gd`

## Screenshot/Browser Coverage

`godot-bike-repair-visual.smoke.spec.js` captures close-up chain/tire repair preview states and exercises the Mrs. Ramirez prompt with keyboard and tap interaction.
