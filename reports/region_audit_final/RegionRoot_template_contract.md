# RegionRoot Template Contract

Canonical root child groups for future region cleanup:
Sky, MountainsFar, MountainsMid, Background, Props, Interactables, NPCs, Stations, Pickups, Foreground, Lighting, Overlays, UI.

Sprint 4 applies this conservatively:
- Add missing DialogBox/Hud instances.
- Do not reparent existing nodes when that risks layout/script references.
- Preserve quest_id/objective_id values and node names.
- Leave hidden Polygon2D placeholders in place for daytime removal decisions.
