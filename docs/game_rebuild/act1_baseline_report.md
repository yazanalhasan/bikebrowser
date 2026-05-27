# Act 1 Baseline Report

Date: 2026-05-27

## Current Route State

- `/game-rebuild` exists as a Phaser route mounted through `src/game/GameShell.jsx`.
- The route uses `src/game/phaser/createGame.js`.
- Current default playable scene is `NeighborhoodScene`.
- The rebuild route is intended to be separate from canonical Godot `/play` and legacy Phaser `/legacy-play`.

## Current Systems

Existing Phaser rebuild systems:

- `QuestSystem`
- `DialogueSystem`
- `InputSystem`
- `InteractionSystem`
- `CameraSystem`
- `SaveSystem`
- `AssetRegistry`

Current data files:

- `src/game/phaser/data/quests.js`
- `src/game/phaser/data/dialogue.js`
- `src/game/phaser/data/characters.js`
- `src/game/phaser/data/locations.js`
- `src/game/phaser/data/items.js`

Current scene list:

- `BootScene`
- `PreloadScene`
- `WorldMapScene`
- `NeighborhoodScene`
- `QuestScene`
- `DialogueScene`
- `DebugScene`

## Current Tests

Required baseline commands:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js
```

Results:

- `npm run build`: passed.
- `npm run test:e2e -- game-rebuild.smoke.spec.js`: failed.

Smoke failure:

- The test emitted `dialogue:start` for `mr_chen_bridge_intro`.
- It pressed `KeyE` twice.
- Quest objective `talk_to_mr_chen` did not complete.

This indicates that current dialogue/objective advancement is too brittle for automation and must be corrected before Act 1 can be considered playable.

## Current Validators

Available route validators:

- `npm run build`
- `npm run test:e2e -- game-rebuild.smoke.spec.js`
- existing Playwright smoke tests under `tests/e2e/`

Act 1-specific full progression validation does not exist yet.

## Current Limitations

- Only one starter quest exists: `bridge_dry_wash_intro`.
- Quest data is too small for Act 1.
- No notebook system exists.
- No inventory system exists.
- No portable bike state system exists.
- No material testing / UTM system exists.
- No construction/bridge system exists.
- No ecology system exists.
- No chemistry system exists.
- No trust system exists.
- No language state system exists.
- No fog-of-war discovery map exists.
- Save system is not yet responsible for Act 1 state.
- Scene layout contains a clean placeholder neighborhood but not all required Act 1 areas.
- Debug/test hooks are incomplete.

## Architecture Gaps

- Carry-forward systems are not yet declared with environmental primitives, progression primitives, and Act 1-to-Act 3 scaling paths.
- Quest logic remains mostly tied to dialogue completion rather than broad system evidence.
- AssetRegistry is placeholder-only and needs Act 1 keys for UTM, ecology, chemistry, notebook, and map UI.
- The scene is not yet an Act 1 orchestrated world; it is a substrate demonstration.

## Expected Touched Files

Expected new/updated areas:

- `docs/game_rebuild/`
- `src/game/data/act1/`
- `src/game/phaser/data/`
- `src/game/phaser/systems/`
- `src/game/phaser/scenes/`
- `tests/e2e/`
- `playtest_captures/game_rebuild_act1_complete/`

## Baseline Conclusion

The clean Phaser substrate is present and buildable, but Act 1 is not implemented. The existing smoke failure must be fixed as part of the Act 1 progression work. The next implementation should remain data-first and portable, with scenes wiring interactions only.
