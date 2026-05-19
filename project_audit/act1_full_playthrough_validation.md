# Act 1 Full Playthrough Validation

Date: 2026-05-18
Agent: Systems-Validation-Agent
Workspace: `C:\dev\bikebrowser`

## Scope

Validated against `project_audit/act1_completion_task_list.md` as authoritative. This pass covers the surfaced Act 1 spine only and does not expand Act 2:

- `bike_safety_check`
- `flat_tire_repair`
- `chain_repair`
- `bridge_quest_5`
- `desert_plant_observation`
- `test_water_quality`
- `copper_rock_id`
- `workshop_first_build`
- `act1_regional_readiness`

## Result

Current validation verdict: Act 1 critical-path validation is green, with caveats.

The playable guided spine is covered by headless Godot tests, browser smoke tests, export/build checks, and a static mission/item audit. The capstone remains gated behind the required Act 1 quests and emits the expected `Systems Thinker` reward with `regional_travel_sketchbook` and `spacecraft_clue_card`.

This does not close the broader content-design caveat from the task list: the backend still contains 19 loaded missions while the player-facing Act 1 spine intentionally validates 9 surfaced missions. The hidden/optional backend quests still need product/design resolution before calling Act 1 fully complete.

## Mission And Reward Audit

Static audit result:

- Registered items: 56
- Loaded mission files: 19
- Missing critical mission files: none
- Missing capstone reward item IDs: none
- Missing critical reward item IDs: none for item-backed rewards

Critical path step coverage found in data:

- `bike_safety_check`: 5 steps, including `talk_to_mrs_ramirez`, brakes, tires, chain, and report.
- `flat_tire_repair`: 5 steps, including inspect, tube removal, patch, inflation, and verification.
- `chain_repair`: 6 steps, including inspect, rotate, align, seat, and test rotation.
- `bridge_quest_5`: 4 steps, including neighbors, badge, new area unlock, and triangles.
- `desert_plant_observation`: 4 steps, including Ranger Nita intro, observation, journal, and return.
- `test_water_quality`: 5 steps, including Dr. Maya intro, sample, pH test, macroinvertebrates, and report.
- `copper_rock_id`: 3 steps, including copper find, conductivity test, and Pete report.
- `workshop_first_build`: 3 steps, including raw material, workshop friend, and first part.
- `act1_regional_readiness`: 6 steps, including the four system reviews, sketchbook question step, and spacecraft clue.

## Quest Gates

Validated by `act1_regional_readiness_check.gd`:

- The Act 1 capstone cannot start before prerequisites.
- Early capstone start emits `quest_locked`.
- The lock payload names missing prerequisites, including `quest:bike_safety_check`.
- Capstone unlocks only after the required 8 prerequisite quests are complete.
- Capstone completion emits reward intent with the expected badge and item rewards.

Validated by `act1_player_path_check.gd`:

- Side-region exits are locked before drivetrain repair.
- Desert, Mine, and River exits unlock after bike safety, tire repair, and chain repair.
- Bridge, garage workshop, desert plant, mine copper, river water, and capstone stations are visible and completable through scene stations.
- The scene-station route completes `act1_regional_readiness`.

## Player-Facing Coverage

Validated by `act1_hud_guidance_check.gd`:

- HUD starts with Bike Safety Check and points to Mrs. Ramirez.
- HUD advances through safety, flat tire, chain, bridge review, desert, water, copper, workshop, and capstone guidance.
- Capstone HUD shows objective-level review guidance after prerequisites.

Browser smoke:

- `/play` renders the canonical Godot world without diagnostics by default.
- Diagnostics remain opt-in at `/godot-prototype?diagnostics=1`.
- Godot bridge event handling remains intact for `quest_started` and `reward_intent`.
- Mission/inventory HUD smoke remains green.
- Legacy Phaser playthrough smoke remains green for regression containment, but `/play` remains canonical.

## Commands Run

- `godot --headless --path .\BikeBrowserWorld --quit`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/act1_regional_readiness_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/act1_player_path_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/act1_hud_guidance_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/act1_modal_interaction_guard_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/playtest_rig_telemetry_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/vertical_slice_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/brake_rig_state_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/chain_hotspot_embodied_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/chain_rig_state_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/tire_rig_state_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/interaction_overlap_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/garage_transition_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/transition_dialogue_guard_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/dialogue_modal_input_lock_check.gd`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\export-godot-web.ps1`
- `npm run build`
- `npx playwright test tests/e2e/godot-prototype.smoke.spec.js`
- `npx playwright test tests/e2e/mission-inventory-hud.smoke.spec.js tests/e2e/route-coherence.smoke.spec.js`
- `npm run test:e2e:playthrough`
- `node --test tests/godot-bridge.test.mjs tests/mechanical-state-simulation.test.mjs tests/mechanical-reasoning-graph.test.mjs`

## Caveats

- Several successful Godot headless runs still print existing ObjectDB/resource cleanup warnings. They did not change exit status, but they remain a stability caveat.
- Vite build emits existing warnings for large chunks, deprecated CJS Node API usage, and package module type inference.
- This pass did not perform a manual human playtest for emotional warmth, mentor characterization, or perceived kiosk/prototype energy. Those remain qualitative Act 1 completion risks.
- Backend quests outside the 9-mission surfaced spine still need explicit surfacing or deferral decisions before Act 1 can be declared fully complete under the task-list definition.
