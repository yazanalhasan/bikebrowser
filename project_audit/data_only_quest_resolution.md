# Data-Only Quest Resolution

Date: 2026-05-26

## bridge_quest_2

Decision: defer from surfaced Act 1.

Rationale: `bridge_quest_2` promises a shopkeeper/material-gathering chapter, but the current Act 1 player-facing bridge path is a condensed Mr. Chen triangle lesson. Surfacing the gather quest now would create a missing-middle promise without a shopkeeper scene, material routing, inventory deposit loop, or learning interaction.

Implemented resolution:

- Added `"surface_status": "deferred_backend_only"` to `Data/missions/bridge_quest_2.json`.
- Added a `deferred_reason` documenting what is missing before surfacing.
- Confirmed `act1_regional_readiness` does not require `bridge_quest_2`.
- Added `tests/data_only_quest_check.gd` so non-deprecated registered quests with no runtime wiring must be explicitly deferred.

## Other Data-Only/Legacy Quests

Already deprecated:

- `bridge_material_test`
- `first_safety_check`
- `flat_tire_repair`
- `water_sample_observation`

These remain backend/history data and should not be shown as player-facing Act 1 promises.
