# Quest Schema Truth Fix

Date: 2026-05-26

## Problem

`QuestRegistry.record_objective()` previously accepted any objective string for an active quest. That let phantom objectives, especially `cement_set`, enter quest state even when missing from mission JSON.

## Fix

- Added `cement_set` to `act1_pre_ride_check` because it is a real tire-repair learning beat.
- Added schema-aware objective validation in `Core/QuestRegistry/QuestRegistry.gd`.
- Added `get_objective_record_status()` to distinguish:
  - `valid_objective`
  - `duplicate_objective`
  - `undeclared_objective`
  - `completed_objective`
  - `missing_quest`
- `record_objective()` now rejects undeclared objectives and records an error in `objective_record_errors`.
- Added `tests/quest_objective_schema_check.gd` to scan known quest/objective references and prove phantom objectives are rejected.

## Validation

`godot --headless --path BikeBrowserWorld --script tests/quest_objective_schema_check.gd` passes. The test intentionally attempts to record `__phantom_objective__`; `QuestRegistry` rejects it and the test confirms it is not added to quest state.
