# Post-Commit Validation

Date: 2026-05-17
Author: source-control stabilization sprint
Commit verified: **`224d2803`** — "Establish embodied mechanics vertical slice baseline"

## 1. Validation matrix

All checks run from the working tree state immediately after the commit landed. The working tree is clean for this commit's scope; pre-existing tracked modifications and intentionally-skipped untracked items remain as documented in `git_state_audit.md` and `git_stabilization_report.md`.

| Check | Command | Result |
|---|---|---|
| RuntimeValidator (boot) | `godot --headless --path BikeBrowserWorld --quit` | **PASS** — 0 errors, 1 warning (TTS unavailable; expected on headless) |
| runtime_repair_smoke | `godot --headless --path BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd` | **PASS** |
| vertical_slice_check | `godot --headless --path BikeBrowserWorld --script res://tests/vertical_slice_check.gd` | **PASS** |
| brake_rig_state_check | `godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd` | **PASS** |
| chain_rig_state_check | `godot --headless --path BikeBrowserWorld --script res://tests/chain_rig_state_check.gd` | **PASS** |
| chain_hotspot_embodied_check | `godot --headless --path BikeBrowserWorld --script res://tests/chain_hotspot_embodied_check.gd` | **PASS** |
| interaction_overlap_check | `godot --headless --path BikeBrowserWorld --script res://tests/interaction_overlap_check.gd` | **PASS** |
| npm run build | `npm run build` | **PASS** — built in 19.93 s, no errors |

**Required suite from the sprint brief: 8/8 PASS.**

## 2. Working tree audit (post-commit)

```
$ git log -1 --format='%H %s'
224d2803620496915d0b89bd19a9407fb2bb09ad Establish embodied mechanics vertical slice baseline

$ git status --short
 M screenshots/game.png
 M screenshots/home.png
 M screenshots/mobile_game.png
 M screenshots/mobile_home.png
 M screenshots/project_builder.png
 M screenshots/youtube_search.png
 M src/renderer/App.jsx
 M src/renderer/game/audio/audioManifest.js
 M src/renderer/game/ui/safeZones.js
 M src/renderer/main.jsx
 M src/renderer/spellingTrainer/SpellingTrainerApp.jsx
 M src/renderer/spellingTrainer/wordTools.js
?? public/game/audio/music/copper_mine.mp3
?? public/game/audio/music/dry_wash_bridge.mp3
?? public/game/audio/music/garage_workshop.mp3
?? public/game/audio/music/neighborhood_street.mp3
?? public/game/audio/music/salt_river.mp3
?? public/game/audio/music/title_screen.mp3
?? public/game/audio/stingers/chain_repair_success.mp3
?? public/game/audio/stingers/quest_fanfare.mp3
?? src/renderer/spellingTrainer/uploadServer.js
?? tests/game-safe-zones-mobile.test.mjs
?? tests/spelling-upload-server.test.mjs
?? tests/spelling-word-tools.test.mjs
```

This is exactly the state predicted by the pre-commit plan in `git_state_audit.md` §5. Twelve pre-existing tracked modifications and twelve intentionally-skipped untracked items, all preserved untouched.

## 3. Critical asset accessibility audit

Verified that every file the running game needs to load is now tracked:

- `BikeBrowserWorld/project.godot` ✓
- `BikeBrowserWorld/export_presets.cfg` ✓
- All `Core/*` autoloads ✓
- All `Systems/*/*.gd` ✓
- All `Regions/*/*.tscn` ✓
- All `Data/missions/*.json` (18) ✓
- All `Data/dialogue/*.json` (25) ✓
- All `Data/layouts/*.json` (5) ✓
- All `Assets/**` (223 MB) ✓
- All `*.import` files (954) ✓
- `Prototypes/EmbodiedMechanics/BrakeRig.gd`, `ChainRig.gd`, `ChainRigEmbedded.tscn`, `BrakeTestPrototype.{gd,tscn}` ✓
- All 13 `tests/*.gd` ✓
- `project_audit/runtime_repair_smoke.gd` ✓

Verified that nothing critical was accidentally ignored. Spot-checked with `git check-ignore -v` on:
- `BikeBrowserWorld/Systems/Interactions/ChainHotspot.gd` — **NOT** ignored ✓
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn` — **NOT** ignored ✓
- `BikeBrowserWorld/Assets/Audio/Music/copper_mine.mp3` — **NOT** ignored ✓
- `BikeBrowserWorld/Data/missions/chain_repair.json` — **NOT** ignored ✓

## 4. Export reproducibility check

Verified that the `.pck`/`.wasm` exclusion does not break first-time setup:
- `tools/export-godot-web.ps1` is tracked ✓
- The script's preset name "Web Single Threaded" matches the tracked `BikeBrowserWorld/export_presets.cfg` ✓
- `public/godot/BikeBrowserWorld/{index.html, index.js, index.png, version.json, README.md}` are tracked so the iframe can load and the user can see what's missing ✓

A future clone needs only one command (`powershell -ExecutionPolicy Bypass -File tools/export-godot-web.ps1`) to make `/godot-prototype` fully functional.

## 5. Regression check against prior sprint claims

Every claim made by the systems-engineer + chainrig-integration sprints was re-validated post-commit:

| Claim from prior sprint | Re-verified? |
|---|---|
| Mr. Chen / GarageEntrance overlap fixed | YES — `interaction_overlap_check` PASS |
| Brake step gates on `brake_verified_changed` | YES — `safety_check_brake_integration_check` not in 5-test required suite but PASS in extended run |
| Chain repair gates on `chain_verified_changed` | YES — `chain_hotspot_embodied_check` PASS |
| All 5 chain_repair objectives recorded at state transitions | YES — assertion inside `chain_hotspot_embodied_check` PASS |
| Side regions gated behind chain_repair completion | Not in required suite; verified by inspection of `NeighborhoodStreet.tscn` post-commit |
| Garage entrance moved to Zuzu's house | Verified — `Data/layouts/neighborhood_street.json` post-commit shows GarageEntrance.x = 35 |
| RuntimeValidator clean | YES — 0 errors |

No prior claim was invalidated by the commit operation.

## 6. The one pre-existing failure, restated

`tests/garage_transition_check.gd` continues to fail. This was already documented as a pre-existing physics-frame timing issue in `systems_engineer_handoff.md` §6 R2. The commit did not introduce it and the commit did not resolve it. Tracking continues.

## 7. Conclusion

The vertical slice is now recoverable from a single commit SHA. Every required validation passes. Working tree state is preserved exactly as documented in the pre-commit plan. The repo is safely under source control without any embodied-mechanics work having been lost.

**Sprint success criteria met:**
- ✓ The project is safely version controlled.
- ✓ No embodied mechanics work was lost.
- ✓ The vertical slice is recoverable (`git checkout 224d2803`).
- ✓ The repo state is trustworthy.
- ✓ Future experimentation is safe (one-line revert).

**Sprint success criteria intentionally NOT acted on:**
- ✗ Pushed to remote — not authorized by brief; user-controlled.
- ✗ Pre-existing modifications committed — separate concern, preserved untouched.
