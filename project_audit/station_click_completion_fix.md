# Station-Click Completion Fix

Date: 2026-05-26

## Problem

`QuestObjectiveStation.complete_station()` could advance every configured objective in order with no objective-specific evidence. That made surfaced learning objectives vulnerable to "stand near station, press E repeatedly" completion.

## Fix

- Added evidence gating in `BikeBrowserWorld/Systems/Interactions/QuestObjectiveStation.gd`.
- `bridge_quest_5` now treats `watch_bridge_presentation` as a launch/record step and blocks the notebook learning objectives until evidence is recorded by the bridge notebook lesson.
- `compare_bridge_types`, `identify_bridge_parts`, `learn_triangles`, and `trace_load_path` no longer complete from the generic station click.
- `talk_to_neighbors`, `receive_badge`, and `unlock_new_area` remain station-driven celebration/capstone steps, but only after the load-path evidence exists.
- Added `BikeBrowserWorld/tests/station_evidence_check.gd` to catch station-click bypass regression.

## Validation

- `godot --headless --path BikeBrowserWorld --script tests\station_evidence_check.gd`
- `godot --headless --path BikeBrowserWorld --script tests\act1_player_path_check.gd`

Both checks pass.
