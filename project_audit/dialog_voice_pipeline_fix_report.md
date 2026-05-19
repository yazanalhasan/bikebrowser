# Dialog / Voice Pipeline Fix Report

Date: 2026-05-19

## Phase 1 Diagnosis Summary

Diagnosis is in `project_audit/dialog_voice_pipeline_diagnosis.md`.

Root causes found: 5

1. Dialog UI was scene-local and missing from `DesertTrail`, `SaltRiver`, and `CopperMine`.
2. Dialog and HUD used implicit CanvasLayer ordering, so HUD/quest card could compete with dialog.
3. NPC/station overlap allowed stations to win the `E` press and emit quest-card progress without a speech act.
4. `SafetyCheckStation` recorded `talk_to_mrs_ramirez` from the station hold path.
5. TTS skip/failure paths were too quiet, and three placeholder/debug-like labels were visible.

## Repairs Applied

| Area | Files / lines | Fix |
| --- | --- | --- |
| Runtime UI availability | `BikeBrowserWorld/Systems/World/RegionScene.gd:15`, `:24` | Every RegionScene now ensures `DialogBox` and `Hud` exist. Dialog layer is 30; HUD layer is 5. |
| Dialog over HUD | `DialogController.gd:17`, `HudController.gd:18` | Dialog and HUD set explicit CanvasLayer values. |
| NPC input priority | `NpcInteraction.gd:50`, `AnimatedNpcInteraction.gd:59` | NPC talk handles input in `_input` before station `_unhandled_input`, so overlapping NPCs win when the player is in talk range. |
| Quest-card-only dialog suppression | `NpcInteraction.gd:66`, `AnimatedNpcInteraction.gd:100` | NPCs no longer emit redundant quest-card feedback when real dialog starts successfully. |
| Mrs. Ramirez safety gate | `SafetyCheckStation.gd:133`, `:159`, `:231` | Brake hold cannot start until `talk_to_mrs_ramirez` was recorded by dialog completion; prompt points back to Mrs. Ramirez first. |
| TTS fallback logging | `AudioService.gd:154`, `:497`, `:516` | Muted/locked/disabled/empty/native-unavailable TTS now logs clear fallback and emits `tts_unavailable`; dialog text remains visible. |
| Playtest validation hook | `RegionScene.gd:41`, `GodotPrototypePage.jsx:11` | Explicit `?playtest=1&playtestRegion=<id>` loads a target region for browser validation only; normal `/play` is unchanged. |
| Placeholder labels | `NeighborhoodStreet.tscn:471`, `:872`, `:899` | Replaced `slow bikes`, `Bridge Later`, and `Review Later`. |

## Instances Fixed

| NPC | Scene | Status | Screenshot |
| --- | --- | --- | --- |
| Mrs. Ramirez | `NeighborhoodStreet.tscn` | Dialog panel visible; TTS attempted; station no longer substitutes for talk. | `project_audit/dialog_voice_pipeline_fix_screenshots/mrs_ramirez_dialog.png` |
| Mr. Chen | `NeighborhoodStreet.tscn` | Dialog panel visible; TTS attempted; overlapping bridge-review station no longer wins. | `project_audit/dialog_voice_pipeline_fix_screenshots/mr_chen_dialog.png` |
| Ranger Nita | `DesertTrail.tscn` | DialogBox now present; browser playtest-region smoke shows dialog and voice attempt. | `project_audit/dialog_voice_pipeline_fix_screenshots/ranger_nita_dialog.png` |
| Dr. Maya | `SaltRiver.tscn` | DialogBox now present; browser playtest-region smoke shows dialog and voice attempt. | `project_audit/dialog_voice_pipeline_fix_screenshots/dr_maya_dialog.png` |
| Old Miner Pete | `CopperMine.tscn` | DialogBox now present; browser playtest-region smoke shows dialog and voice attempt. | `project_audit/dialog_voice_pipeline_fix_screenshots/old_miner_pete_dialog.png` |

Hold-E sites fixed/validated: 3

- `SafetyCheckStation`: requires Mrs. Ramirez dialog before brake hold; tap/hold before dialog does not start the quest.
- `ChainHotspot`: existing hold-driven chain rig remains validated.
- `TireRepairStation`: existing hold-driven tire rig remains validated.

Placeholder labels removed: 3

- `slow bikes` -> `Slow Bikes Please`
- `Bridge Later` -> `Bridge Review`
- `Review Later` -> `Act 1 Review`

## Validation Results

Passed:

- `npm run build`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/dialog_voice_pipeline_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/safety_hold_requires_npc_dialog_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/vertical_slice_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/dialogue_modal_input_lock_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/audio_unlock_cue_playback_check.gd`
- `godot --headless --path .\BikeBrowserWorld --script res://tests/voice_identity_profile_check.gd`
- `tools/export-godot-web.ps1`
- `git diff --check`
- Browser `/play` HTTP 200 and canvas load; no console errors captured.
- Browser NPC smoke screenshots for all 5 NPCs; each voice attempt reached `BikeBrowserAudioState.lastSpeechStatus = "speaking"` and `lastCue = "dialogue_open"`.

Known non-blocking validation noise:

- Godot headless still prints existing ObjectDB/resource cleanup warnings.
- Headless native TTS reports `Native TTS unavailable; showing text only`, which is the intended fallback path.
- Browser still shows React Router future warnings and WebGL ReadPixels performance warnings; no page errors or console errors were captured.

Fresh export:

- `public/godot/BikeBrowserWorld/version.json`
- `exported_at: 2026-05-19T09:22:21Z`
- `git_sha: 9ca435f0dc83e7f7ea3047092d796b4c85ffc7be`

## Remaining Risks

Physical speaker audibility still needs human/device confirmation. Browser automation proves unlock, cue path, and TTS invocation state, not that a specific speaker played sound.

The `playtestRegion` hook is intentionally narrow and inert unless `playtest=1` is present. It exists to validate gated regions without changing quest progression.

## Follow-Up Unblocked

Creativity-Agent work is unblocked because every Act 1 mentor can now surface dialog in-region.

Mechanic-Art-Agent work is unblocked because NPC/station input priority no longer confuses mechanic station interaction with mentor dialog.
