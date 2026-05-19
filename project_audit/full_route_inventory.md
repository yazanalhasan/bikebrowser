# Full Route Inventory - UX Playtest Pass

Date: 2026-05-18
Agent: UX-Playtest-Agent
Authority: `project_audit/act1_completion_task_list.md`

## Method

- Ran Vite at `http://127.0.0.1:5173`.
- Captured `/play` manually with Playwright on desktop `1280x800` and Pixel 5 portrait.
- Ran route capture across home, `/play`, `/legacy-play`, `/godot-prototype?diagnostics=1`, and `/play3d` at desktop, lowres, mobile landscape, mobile portrait, and tablet portrait.
- Screenshots: `project_audit/visual_runtime_screens_ux_playtest/` and `playtest_captures/ux-playtest-*.png`.
- Raw route report: `project_audit/visual_runtime_capture_ux_playtest.json`.
- CUDA visual analysis: `project_audit/visual_runtime_analysis_ux_playtest.json`.

## Browser Routes

| Route | Player role | Status | Playtest notes |
| --- | --- | --- | --- |
| `/` | Home launcher | Pass with density caveat | Clear `Play BikeBrowserWorld` entry. Home remains dense with many non-Act-1 learning surfaces below the fold. |
| `/play` | Canonical Godot Act 1 route | Pass with UX issues | Loads the Godot export, diagnostics hidden, home escape visible. Desktop looks lively. Portrait mobile wastes large top/bottom space and tap-only play does not communicate controls. |
| `/legacy-play` | Legacy Phaser fallback | Pass, should stay noncanonical | Stable route, but still reads like a separate complete game shell. Keep it out of child-facing Act 1 promises. |
| `/godot-prototype?diagnostics=1` | Developer diagnostics | Pass | Diagnostics are opt-in. Route should remain tooling-only. |
| `/play3d` | Experimental 3D surface | Pass, defer | Visually runs, but route copy and console warnings confirm prototype/tooling energy. Do not expand for Act 1. |

## Godot Runtime Routes And Stations

| Surface | Visible nodes / entry | Status | Playtest notes |
| --- | --- | --- | --- |
| NeighborhoodStreet | Mrs. Ramirez, Mr. Chen, safety bike, Garage, Mine, Desert, River, Bridge Review, Act 1 Review | Core route | Strong first impression. It also exposes too many future/regional affordances before the first safety objective is settled. |
| ZuzuGarage | ChainHotspot, TireRepairStation, WorkshopBuildStation, Zevon, Jacob, Charlie, Cole, James | Core but gated by player understanding | Richer and warmer than a kiosk, but reached before the safety HUD story resolves if the player wanders right. |
| CopperMine | Old Miner Pete, CopperEvidenceStation, back transition | Surfaced side region | Clear station/NPC pairing in data. Needs route gating clarity in player flow. |
| DesertTrail | Ranger Nita, PlantObservationStation, back transition | Surfaced side region | Reads as a real ecology station, but should not pull attention before neighborhood repair clarity. |
| SaltRiver | Dr. Maya, WaterQualityStation, back transition | Surfaced side region | Clear water station and mentor presence. Still feels station-first rather than story-first until dialogue proves otherwise. |
| BridgeReviewStation | Neighborhood station | Surfaced condensed bridge arc | Visible, but it appears as an early landmark labelled `Bridge Review`; the missing bridge build-up can still feel like skipped chapters. |
| Act1CapstoneStation | Neighborhood station | Surfaced capstone | Label appears immediately. This risks implying the player can/should review Act 1 before knowing the first task. |
| SystemShowcase | Demo/tooling region | Defer/hide | Listed in prior inventory as tooling. Do not treat as Act 1 content. |

## Loaded Backend Quest Inventory

Runtime console reports 19 loaded missions with quest validation at 0 errors, 0 warnings:

- Current surfaced critical spine: `bike_safety_check`, `flat_tire_repair`, `chain_repair`, `bridge_quest_5`, `desert_plant_observation`, `test_water_quality`, `copper_rock_id`, `workshop_first_build`, `act1_regional_readiness`.
- Loaded but still expectation-risk content: `bridge_quest_1`, `bridge_quest_2`, `bridge_quest_3`, `bridge_quest_4`, `bridge_material_test`, `water_sample_observation`, `algae_bloom_source`, `track_the_animal`, `mine_cart_repair`, `first_safety_check`.

## Route Verdict

`/play` is correctly canonical and stable. The current route risk is not boot failure; it is expectation overload. The first screen shows the safety bike, Mrs. Ramirez, garage/workshop, bridge review, Act 1 review, and three regional exits at once. That richness helps the world feel alive, but it weakens the first-task signal for low-attention players.
