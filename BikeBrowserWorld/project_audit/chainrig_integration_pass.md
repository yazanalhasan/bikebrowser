# ChainRig Integration Pass

Date: 2026-05-17
Author: chainrig-integration sprint
Status: **shipped, validated end-to-end**

## 1. What changed

The first-15-minute hero quest — `chain_repair` — no longer advances through five E-presses that swap a texture. It now requires the player to **physically pedal** a visible drivetrain until it reconnects.

### Files changed

| File | Nature |
|---|---|
| `Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn` | **NEW.** Standalone visual rig: crank + pedal, chainring (front gear with teeth), chain (top + bottom segments + slack pool + tension mark), sprocket (rear gear), rear wheel (rim + spokes + hub), seated glow, spin ghost, five state-driven labels. ~50 nodes, no sprite art — Polygon2D geometry only. Reusable: instances anywhere via `instance=ExtResource(...)`. |
| `Systems/Interactions/ChainHotspot.gd` | **REWROTE.** Removed the press-to-advance ladder. New flow: pressing E engages the rig (`set_pedal_pressed(true)`); holding advances the rig through its state machine; `_track_rig_state` records the matching `chain_repair` objective at every state transition; `chain_verified_changed(true)` is the only path to completion. Camera zoom + visibility toggle handled in the same script. |
| `Regions/Garage/ZuzuGarage.tscn` | Added `[ext_resource ChainRigEmbedded.tscn]`, added `ChainHotspot/BikeVisual/ChainRig` (instance, hidden by default, `z_index=12` so it renders in front of the legacy prop sprites). Prompt text changed from `[E] Inspect Chain` to `[Hold E] Pedal`. |
| `tests/chain_hotspot_embodied_check.gd` | **NEW.** End-to-end integration test — loads ZuzuGarage, places player in the hotspot, drives the rig through `STATE_SLIPPED → STATE_PEDAL → STATE_TENSION → STATE_GUIDED → STATE_SEATED → STATE_SPINNING → STATE_VERIFIED`, asserts that every `chain_repair` objective lands and the reward intent fires. |

### Files NOT changed

- `Data/missions/chain_repair.json` — objective IDs unchanged. The new system records the same five IDs (`inspect_chain`, `rotate_pedals`, `align_chain`, `seat_chain`, `test_rotation`) at meaningful state transitions instead of on each E-press. Save data, vertical_slice_check.gd, and dialogue contracts continue to hold unchanged.
- `tests/vertical_slice_check.gd` — unchanged; still passes (the test directly drives `QuestRegistry.record_objective` and never depended on ChainHotspot's internal mechanism).
- `Prototypes/EmbodiedMechanics/ChainRig.gd` — unchanged; the state machine from the prior sprint integrated as-shipped.
- Any Core/* file.

## 2. Objective recording — state-transition mapping

```
STATE_SLIPPED  → STATE_PEDAL    : record "inspect_chain"   (first contact)
STATE_PEDAL    → STATE_TENSION  : record "rotate_pedals"
STATE_TENSION  → STATE_GUIDED   : record "align_chain"
STATE_GUIDED   → STATE_SEATED   : record "seat_chain"
STATE_SEATED   → STATE_SPINNING : record "test_rotation"
STATE_SPINNING → STATE_VERIFIED : (no record — quest already complete)
```

Each objective records exactly once via `recorded_objectives` dictionary. The same dictionary drives the texture-swap of the legacy `RepairBike` sprite (SLIPPED → ALIGNING → SEATED) so the static prop and the active rig agree on progress.

## 3. Mechanic-eye perspective

Camera zoom on engagement: `1.0 → 1.45` over 0.42s, sine-eased. Restored on disengagement OR on chain_verified (so the world breathes again after the repair lands; the player isn't held in close-up).

This is the minimum mechanic-eye implementation that respects the calm-pacing rule. No dedicated inspection scene, no scene swap, no camera lerp framework. The player's existing Camera2D zooms gently. The wider garage stays in peripheral view.

## 4. Fake-loop removal — by-the-numbers

Before this sprint, `chain_repair` advanced through `event.is_action_pressed("ui_accept")` five separate times — once per step. **Each press recorded its objective with zero physical context.**

After this sprint:
- One `ui_accept` press = engage (start pedaling).
- Sustained pedal hold = mechanism advances.
- Release = chain_alignment decays (you have to keep pedaling to align), but seated chain persists (the chain stays on the sprocket).
- Wheel spinning = verification.

Net presses to complete: **1 + duration of hold ≈ 2 seconds.** Net mechanism-readable transitions: **6 state changes the player sees on-screen.**

## 5. Validation

```
chain_hotspot_embodied_check          PASS  (new — end-to-end embodied loop)
chain_rig_state_check                 PASS
interaction_overlap_check             PASS
vertical_slice_check                  PASS
brake_rig_state_check                 PASS
safety_check_brake_integration_check  PASS
input_prompt_mapping_check            PASS
transition_dialogue_guard_check       PASS
dialogue_keyboard_advance_check       PASS
garage_floor_layering_check           PASS
voice_identity_profile_check          PASS
voice_mix_balance_check               PASS
```

**12 / 12 Godot tests pass.** RuntimeValidator: 0 errors / 1 warning (TTS unavailable, expected on headless).

`npm run build` clean (~24s). Godot HTML5 export refreshed with current HEAD.

## 6. Remaining prototype energy

- The geometric chain (two thin polygons + slack pool) reads as "wrapped chain" at gameplay distance but won't survive close inspection. If a future pass adds a chain-link texture or Line2D with bead segments, the visual readability score will go up. **Not in this sprint** — readable-is-enough.
- `LooseChainProp`, `RepairGlint`, `DrivetrainFocusGlow` legacy sprites still sit behind the rig. They become decorative once the rig is engaged. Should be considered for reduction in the garage-payoff sprint, not here.
- The `RepairBike` sprite still texture-swaps SLIPPED → ALIGNING → SEATED in lockstep with state transitions. This duplicates the rig's visual progression — kept on purpose so the static bike view and the active rig agree. Could be removed later if it reads as redundant.

## 7. Overengineering risks I deliberately avoided

- **Chain link physics.** The chain is two Polygon2D rectangles, not a 30-link articulating body. The educational message ("the chain wraps both gears") survives; the simulation noise does not.
- **Mechanic-eye inspection scene.** Camera zoom on the existing Camera2D was enough. No scene swap, no viewport, no camera director.
- **Generalized drivetrain framework.** ChainRig is a sibling of BrakeRig, not a derivation. When TireRig lands it should be a sibling too. Three concrete rigs before any base class.
- **Objective ID restructure.** The 5 IDs stayed; only the trigger changed. Zero data-contract churn.
- **Reward spectacle.** The "Drivetrain clean." label on the rig is the only quiet secondary cue. Primary payoff is the spinning wheel. No stinger, no badge popup, no NPC praise stacking.
