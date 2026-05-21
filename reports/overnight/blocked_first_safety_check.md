# Sprint 7 - first_safety_check

Decision: marked as STALE_DUPLICATE rather than wiring a second safety-check flow.

Reason:
- first_safety_check is a legacy three-objective quest: talk, inspect, report.
- act1_pre_ride_check is the current, richer playable safety-check quest with exact A-B-C-Quick mechanics, tire repair handoff, and final report.
- Wiring both would duplicate Mrs. Ramirez safety-check content and risk conflicting quest state.

Action:
- Added deprecated true.
- Added supersededBy act1_pre_ride_check.
- Added an overnight note for future audit clarity.
