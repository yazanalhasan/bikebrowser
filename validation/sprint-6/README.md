# Sprint 6 Validation Notes

Completed:
- Godot headless project validation after UTM wiring: 0 quest errors, 0 runtime errors, existing ObjectDB leak warning only.
- Focused quest wiring audit: bridge_quest_3 moved from DATA_ONLY to PLAYABLE.
- All five objectives have PLAYABLE_REAL producers.

Degraded:
- The optional scripted UTM flow harness under validation/sprint-6/utm_flow_validation.gd did not complete promptly in headless script mode and was terminated.
- Manual/browser playthrough screenshot was not captured during this phase.

Required daytime QA:
- Walk to garage with bridge_quest_3 active.
- Clamp wood, steel, composite; pull lever until each observation records.
- Try composite as beam and confirm redirect.
- Choose steel or wood and confirm quest completion.
