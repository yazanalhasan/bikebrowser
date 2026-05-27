# Bridge Quest Truth Pass

Date: 2026-05-26

## Chosen Act 1 Structure

Act 1 now uses a condensed bridge review path centered on `bridge_quest_5`, with Mr. Chen's bridge notebook lesson as the player-facing source of truth.

The older full chain remains present as content/data, but `bridge_quest_2` is marked `deferred_backend_only` and is not treated as required Act 1 player progression.

## Player-Facing Truth

- The player sees a broken bridge context after bike readiness opens the region routes.
- The bridge lesson explicitly covers bridge types, parts, triangle bracing, and load paths.
- The celebration/unlock steps happen only after the lesson evidence is complete.
- Material testing remains available through `bridge_material_test` and the garage testing machine, but the missing middle chapter is no longer implied as a required surfaced sequence.

## Validation

- `data_only_quest_check.gd` asserts that `bridge_quest_2` is known deferred data-only content.
- `station_evidence_check.gd` asserts bridge notebook objectives cannot be completed by repeated station clicks.
- `act1_player_path_check.gd` completes the condensed Act 1 player path with explicit bridge evidence supplied by the test harness.
