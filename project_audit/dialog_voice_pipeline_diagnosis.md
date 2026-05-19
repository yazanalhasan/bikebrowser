# Dialog / Voice / Interaction Pipeline Diagnosis

Date: 2026-05-19
Scope: canonical Godot `/play` export path in `BikeBrowserWorld`.

## Phase 1 Inventory

### 1. Backend Dialog Data

Dialog source directory: `BikeBrowserWorld/Data/dialogue/*.json`

| NPC | Dialog files | Line counts | Quest-state bindings |
| --- | --- | ---: | --- |
| Mrs. Ramirez | `mrs_ramirez_intro.json`, `mrs_ramirez_after_safety.json`, `mrs_ramirez_after_chain.json`, `mrs_ramirez_questline.json` | 3, 3, 3, 9 | `mrs_ramirez_intro` has `onComplete: start_quest bike_safety_check`; `NpcInteraction._current_dialogue_id()` switches to after-safety/after-chain by completed quest state. |
| Mr. Chen | `mr_chen_chain.json`, `mr_chen_after_safety.json`, `mr_chen_after_chain.json`, `mr_chen_bridge.json`, `mr_chen_expanded.json` | 3, 3, 3, 10, 9 | `mr_chen_chain` and `mr_chen_after_safety` start `chain_repair`; `NpcInteraction._current_dialogue_id()` switches by completed quest state. |
| Ranger Nita | `ranger_nita_intro.json`, `ranger_nita_expanded.json` | 1, 5 | `RangerNitaNpc.tscn` binds `dialogue_id = "ranger_nita_intro"`; plant station separately records `desert_plant_observation` objectives. |
| Dr. Maya | `dr_maya_intro.json`, `dr_maya_expanded.json` | 1, 7 | `DrMayaNpc.tscn` binds `dialogue_id = "dr_maya_intro"`; water station separately records `test_water_quality` objectives. |
| Old Miner Pete | `old_miner_intro.json`, `old_miner_pete_expanded.json` | 1, 7 | `OldMinerPeteNpc.tscn` binds `dialogue_id = "old_miner_intro"`; copper station separately records `copper_rock_id` objectives. |

Runtime loader: `BikeBrowserWorld/Core/DialogueManager/DialogueManager.gd`, functions `start_dialogue()`, `load_dialogue()`, and `normalize_dialogue()`.

### 2. Backend Voice Profiles

Voice source file: `BikeBrowserWorld/Data/audio/voice_profiles.json`

All five required NPCs have profiles:

- Mrs. Ramirez: warm feminine, pitch 1.08, rate 0.98
- Mr. Chen: older thoughtful, pitch 0.86, rate 0.88
- Ranger Nita: calm outdoors, pitch 1.03, rate 0.94
- Dr. Maya: measured thoughtful, pitch 1.02, rate 0.91
- Old Miner Pete / Miner Pete: older grounded, pitch 0.90, rate 0.86

Runtime resolver: `BikeBrowserWorld/Core/AudioService/AudioService.gd`, functions `resolve_voice_profile()`, `resolve_tts_voice_id()`, and `speak()`.

### 3. Frontend Dialog Rendering (Godot)

Dialog panel scene: `BikeBrowserWorld/Regions/UI/DialogBox.tscn`

Controller: `BikeBrowserWorld/Systems/UI/DialogController.gd`

Expected call path:

`NpcInteraction._unhandled_input()` or `AnimatedNpcInteraction._unhandled_input()` -> `interact()/trigger_dialogue()` -> `DialogueManager.start_dialogue()` -> `EventBus.dialogue_requested.emit(dialogue)` -> `DialogController._on_dialogue_requested()`

Findings:

1. `DialogBox.tscn` is only instanced in `NeighborhoodStreet.tscn` and `ZuzuGarage.tscn`.
2. `DesertTrail.tscn`, `SaltRiver.tscn`, and `CopperMine.tscn` contain NPCs but no `DialogBox`, so Ranger Nita, Dr. Maya, and Old Miner Pete cannot render dialog in those scenes.
3. `DialogBox` and `Hud` are both default `CanvasLayer` layer 1. In `NeighborhoodStreet.tscn`, `DialogBox` is instanced before `Hud`, so HUD/quest-card drawing can sit above dialog unless layer ordering is explicitly fixed.
4. Mrs. Ramirez is near `SafetyCheckStation`. The safety station can consume `ui_accept` and start/advance objectives independently of NPC dialog, so the player can see quest-card feedback and objective progress without a visible NPC speech act.

### 4. Audio / TTS Pipeline

Audio boot path:

`AudioService._ready()` loads `voice_profiles.json`, sets native players, connects `region_entered`, `interaction_feedback`, and `reward_feedback`, then installs the web audio runtime on web exports.

First-gesture unlock:

`AudioService._input()` calls `unlock_audio()` on the first pressed non-echo input. Web unlock calls `window.BikeBrowserAudio.unlock()` and hides `window.BikeBrowserAudioUnlockUI`.

NPC dialog to voice path:

`DialogController._show_current_line()` -> `AudioService.speak(target_text, speaker_label.text)` -> web `window.BikeBrowserAudio.speak(...)` or native `DisplayServer.tts_speak(...)`.

Provider chain:

NPC voice does not use the UX audit service provider chain. It uses browser `speechSynthesis` on web and Godot native TTS where available. No paid API key is required for this repair.

Risk found:

`AudioService.speak()` returns silently when muted, voice disabled, audio locked, or empty text. The visible dialog remains, but there is no Godot-side warning for skipped TTS, making failed voice attempts hard to diagnose.

### 5. Interaction Verb Layer

`Hold E` sites found:

- `SafetyCheckStation.gd`: prompt says `[Hold E] Squeeze Brakes`; brake hold is handled through `BrakeRig`, but the station also records `talk_to_mrs_ramirez` when the brake check starts, so NPC talk can be bypassed.
- `ChainHotspot.gd`: prompt says `[Hold E] Pedal`; hold drives `ChainRig.set_pedal_pressed()`.
- `TireRepairStation.gd`: prompt says `[Hold E]`; hold drives `TireRig.set_current_action_pressed()`.

Confirmed bug class:

The safety check couples a mechanical hold action to `talk_to_mrs_ramirez`. A single press can start the safety quest and move progress to 2/5 without a preceding dialog panel, which matches the external report.

### 6. Quest Card Occlusion

React `/play` route: `src/renderer/pages/GodotPrototypePage.jsx`

The React shell only overlays a small home button by default. The visible quest card is Godot HUD: `BikeBrowserWorld/Regions/UI/Hud.tscn`, controlled by `HudController.gd`.

Finding:

`Hud` and `DialogBox` have no explicit layer values. The HUD panel sits upper-left and can draw above dialog/prompt surfaces when layer order is not explicit. It does not eat iframe input from React, but it can visually compete with in-Godot UI.

### 7. Placeholder Labels

Confirmed visible placeholders/debug-like labels:

- `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn:471`: `slow bikes`
- `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn:872`: `locked_sign_text = "Bridge Later"`
- `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn:899`: `locked_sign_text = "Review Later"`

Classification:

- `slow bikes`: intentional environmental sign, but reads as placeholder due lowercase/debug style.
- `Bridge Later`: placeholder gate copy.
- `Review Later`: placeholder gate copy.

### 8. Scope Assessment

Dialog rendering is broken for some NPCs, not all: Ranger Nita, Dr. Maya, and Old Miner Pete lack a dialog renderer in their starting scenes; Mrs. Ramirez and Mr. Chen have a renderer but are vulnerable to UI layering and overlapping station input.

Voice/TTS is structurally available for all five NPCs, but voice attempts are silent when audio is locked/unavailable and need explicit logging/fallback status.

This appears to be a never-completed integration, not a regression: the backend data and profiles existed, but scene-level dialog UI and interaction priority were incomplete.

Root causes found: 5

1. Dialog UI is scene-local and missing from three Act 1 NPC regions.
2. Dialog/HUD canvas layers are not explicitly ordered, so quest HUD can visually compete with dialog.
3. Safety check records `talk_to_mrs_ramirez` from the station hold path, allowing quest progress without an NPC speech act.
4. TTS skip/failure states are not logged clearly from Godot when audio is locked, muted, disabled, unavailable, or empty.
5. Placeholder/debug-like in-world labels remain in the Act 1 neighborhood surface.

Top suspect for the external Mrs. Ramirez observation: overlapping safety-station interaction and quest progress can consume the player’s `E` press and emit quest-card feedback without requiring the NPC dialog pipeline.
