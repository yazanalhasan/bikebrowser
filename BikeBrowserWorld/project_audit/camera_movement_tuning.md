# Camera + Movement Tuning

Generated: 2026-05-15

## Scope

This pass only changed camera feel, player movement feel, interaction responsiveness, tactile timing, and transition feel. It did not modify QuestRegistry, DialogueManager, SaveService, region architecture, quest flow, or content scope.

One non-feel file, `Core/AudioService/AudioService.gd`, received strict type annotations only because its existing ambience helper failed GDScript parsing during validation. No audio behavior, routing, service ownership, or AudioService architecture was changed.

The requested reference files `project_audit/game_feel_tuning.md` and `project_audit/polish_pass_report.md` were not present in this checkout. The pass followed the available adjacent audit sources:

- `project_audit/art_direction_rules.md`
- `project_audit/player_controller_audit.md`
- `project_audit/current_gameplay_state.md`
- `project_audit/vertical_slice_report.md`

## Active Camera Audit

Playable region scenes use a child `Camera2D` under `Player`:

- `Regions/Neighborhood/NeighborhoodStreet.tscn`
- `Regions/Garage/ZuzuGarage.tscn`
- `Regions/Desert/DesertTrail.tscn`
- `Regions/Mine/CopperMine.tscn`
- `Regions/River/SaltRiver.tscn`

The active camera is still scene-local, matching the existing player-controller audit. This pass did not replace it with a new camera architecture.

## Camera Tuning Values

Runtime camera setup in `Systems/World/ZuzuController.gd`:

| Setting | Value |
| --- | ---: |
| `process_callback` | `Camera2D.CAMERA2D_PROCESS_PHYSICS` |
| `position_smoothing_enabled` | `true` |
| `position_smoothing_speed` | `8.0` |
| `drag_horizontal_enabled` | `false` |
| `drag_vertical_enabled` | `false` |
| `camera_lookahead_distance` | `34.0` |
| `camera_lookahead_speed` | `6.5` |
| lookahead pixel snapping | `camera.position = _camera_lookahead.round()` |

Scene camera nodes were also made explicit with:

```gdscript
process_callback = 0
position_smoothing_enabled = true
```

Godot 4 camera jitter risk was addressed by physics-synchronizing the active Camera2D and updating the lookahead from `_physics_process`.

## Camera2DPlus Tuning

`CameraSystem/Camera2DPlus.gd` is not the current scene-local active camera, but it was aligned with the same feel target so future use does not reintroduce idle callback jitter.

| Setting | Before | After |
| --- | ---: | ---: |
| `smoothing_speed` | `8.0` | `8.5` |
| `look_ahead_distance` | `80.0` | `38.0` |
| `look_ahead_speed` | `5.0` | `6.5` |
| `dead_zone` | `Vector2(60, 36)` | `Vector2(42, 26)` |
| update callback | `_process` | `_physics_process` |
| position output | raw lerp | rounded lerp |

## Movement Tuning Values

`Systems/World/ZuzuController.gd` remains the canonical player controller.

| Setting | Before | After |
| --- | ---: | ---: |
| `speed` | `190.0` | `190.0` |
| `acceleration` | `18.0` | `22.0` |
| `deceleration` | `20.0` | `28.0` |
| `turn_response` | none | `18.0` |
| `stop_snap_speed` | none | `8.0` |
| `safe_margin` | default | `0.5` |

Movement still normalizes diagonal input, so diagonal movement does not become faster than cardinal movement. Stops now snap to zero at very low velocity to remove tiny drift and prototype-like float.

## Body Motion Tuning

The existing subtle lean/squash pass was reduced and grounded:

| Motion | Before | After |
| --- | ---: | ---: |
| walk time rate | `9.0` | `8.0` |
| idle breathe rate | `2.0` | `1.55` |
| lean rotation | `0.08` rad | `0.045` rad scaled by speed |
| squash/stretch | up to `0.04` | up to `0.022` |
| idle breathe amplitude | `0.025` | `0.012` |
| moving breathe amplitude | `0.025` | `0.008` |
| head bob | `1.8 px` | `1.0 px` |
| animation speed scale | fixed | `0.85-1.08` |

The target is tactile motion without bouncy cartoon exaggeration.

## Interaction Timing

Interaction scripts now include short settle delays and lockouts:

| Script | Settle delay | Re-trigger lockout |
| --- | ---: | ---: |
| `NpcInteraction.gd` | `0.08 s` before dialogue | `0.18 s` |
| `AnimatedNpcInteraction.gd` | `0.08 s` before dialogue | `0.18 s` |
| `TransitionZone.gd` | `0.12 s` before region change | transition locks until scene swap |
| `SafetyCheckStation.gd` | `0.06 s` before step | `0.10 s` |
| `ChainHotspot.gd` | `0.06 s` before step | `0.10 s` |
| `TireRepairStation.gd` | `0.06 s` before step | `0.10 s` |

If the player leaves range during the short delay, the interaction cancels cleanly. This keeps interactions intentional without feeling like slow UI.

## Prompt Feel

Existing prompt fade/pulse patterns were preserved. New interaction pulses use tiny prompt scale tweens:

- Transition pulse: `1.00 -> 1.06 -> 1.00`
- Repair/check pulse: `1.00 -> 1.04 -> 1.00`

No aggressive shake, zoom, or abrupt camera movement was added.

## Collision Feel

The player retains its circular collision footprint. `safe_margin = 0.5` was set in the controller to make collision recovery more forgiving around edges without changing scene collision layouts. The low-speed stop snap also reduces wall-side micro-vibration when input is released near collision.

## Known Remaining Rough Edges

- Native manual playtesting is still required to judge subjective comfort, especially around garage doorway alignment and dense prop edges.
- The scene-local camera has no authored room bounds or drag-margin composition per region yet. This pass avoided adding a new camera system.
- Some interaction prompts are still raw Label nodes visually; this pass tuned timing rather than replacing UI art.
- The requested `game_feel_tuning.md` and `polish_pass_report.md` source references were absent.
