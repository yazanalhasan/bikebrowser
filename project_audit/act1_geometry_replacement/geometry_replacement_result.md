# Act 1 broad geometry replacement wave

## Scope
Replaced or governed broad production geometry categories in the active Phaser Act 1 neighborhood scene:

- mountains / background vista
- vegetation and ecology visuals
- road / sidewalk / lane primitives
- quest and NPC cue graphics
- HUD / map frame geometry

## Runtime assets added

- `act1.environment.sonoran_mountain_vista`
- `act1.environment.desert_road_system`
- `act1.environment.vegetation_cluster`
- `act1.environment.ecology_patch`
- `act1.ui.npc_cue_wrench`
- `act1.ui.npc_cue_heart`
- `act1.ui.npc_cue_star`
- `act1.ui.map_frame`

All are registered as `final_ready`, `PROJECT_LOCAL_AUTHORED`, and `approved: true` in the Act 1 manifest.

## Evidence

- Before: `C:/dev/bikebrowser/project_audit/act1_geometry_replacement/before_geometry_wave.png`
- After: `C:/dev/bikebrowser/project_audit/act1_geometry_replacement/after_geometry_wave.png`
- Contact sheet: `C:/dev/bikebrowser/project_audit/act1_geometry_replacement/act1_geometry_before_after_contact_sheet.png`

## Validation

- `npm run build`: pass
- `npx playwright test tests/e2e/game-rebuild.act1-visual-capture.spec.js --project=chromium`: pass
- `python -m brain.cli assets validate`: pass, blocked_count 0

## Notes

Legacy renderer scenes and AssetRegistry placeholder factories are now classified as legacy fallback or placeholder factory records, not current production blockers. Dynamic world-map route drawing is classified as visualization; the static map frame is now an approved asset.
