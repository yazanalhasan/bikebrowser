# Brake Test Micro-Prototype Audit

## Scope

Embodied Mechanics Sprint 1 builds one isolated bicycle brake test prototype. It does not integrate into Mrs. Ramirez's safety check yet because the current `SafetyCheckStation.gd` advances quest objectives directly through QuestRegistry, EventBus, AudioService, and RewardBridge-adjacent flow. The safer first move is to prove the visible mechanic in isolation.

## Prototype Location

```text
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeTestPrototype.tscn
```

Supporting files:

```text
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeRig.gd
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeTestPrototype.gd
BikeBrowserWorld/tests/brake_rig_state_check.gd
```

## Interaction Sequence

1. The prototype starts with the wheel already spinning.
2. The player holds `ui_accept`, which maps to E or Enter in the current Godot input defaults.
3. The brake lever rotates inward.
4. The cable visibly brightens/tightens.
5. The caliper arms close.
6. Brake pads move toward the rotor/rim contact point.
7. Wheel rotation decays until stopped.
8. Verification appears only after the wheel remains stopped under brake contact.
9. Releasing the key relaxes the lever, cable, caliper, and pads.

## Required States

Implemented states:

```text
idle_wheel_spinning
brake_lever_pressed
cable_tension_visible
caliper_closed
wheel_stopped
brake_verified
```

The rig exposes normalized readable channels:

```text
lever_pull
cable_tension
caliper_closure
pad_contact
wheel_spin
brake_verified
```

## Required Visual Parts

Implemented as separated Godot nodes:

- bike frame: `BrakeRig/BikeFrame`
- wheel: `BrakeRig/Wheel`
- brake lever: `BrakeRig/BrakeLever`
- cable: `BrakeRig/BrakeCable`
- caliper: `BrakeRig/CaliperLeft`, `BrakeRig/CaliperRight`
- pads: `BrakeRig/CaliperLeft/PadLeft`, `BrakeRig/CaliperRight/PadRight`
- contact point: `BrakeRig/ContactPoint`

Contextual labels:

- Brake lever
- Cable
- Caliper
- Wheel

Labels are state-gated and local to the part area. They are intentionally small and not a glossary panel.

## Feedback

The prototype emits quiet feedback signals:

```text
soft_lever_click
subtle_cable_tension
soft_wheel_stop
gentle_wheel_stop
```

The scene currently maps those signals to small text hints only. A future integration can route them to existing soft SFX without touching reward or quest systems.

## Validation

Focused validation command:

```text
godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd
```

Validated behavior:

- `BrakeRig.gd` loads.
- `BrakeTestPrototype.tscn` loads.
- wheel, brake lever, cable, and caliper visual parts exist.
- pressing brake advances to `brake_lever_pressed`.
- cable tension appears after lever motion.
- caliper closes after visible cable tension.
- brake verification is not granted at lever press.
- brake verification is not granted at caliper closure alone.
- `wheel_stopped` occurs before `brake_verified`.
- releasing the brake relaxes lever/cable/caliper channels.

Latest observed result:

```text
Brake rig state check passed
```

Godot also emits an existing headless shutdown cleanup warning in this project after test scripts quit. The focused brake assertions pass and the command exits with code 0; the warning is not specific to this brake test because existing Godot-side tests show the same shutdown pattern.

## Protected Systems

No protected runtime architecture files were intentionally changed:

- QuestRegistry
- RewardBridge
- EventBus
- SaveService
- RuntimeValidator

## Remaining Risks

- The prototype uses simple drawn Godot parts, not production bike art.
- It has quiet feedback signal names but no dedicated audio asset wiring yet.
- It is not yet reachable from the live Mrs. Ramirez safety check.
- Visual proportions may need in-editor tuning after a human sees it in motion.
- The current verification is state-based, not a player-facing quest objective.

## Integration Recommendation

Do not replace Mrs. Ramirez's current safety step until the isolated prototype is visually accepted.

Recommended next step:

1. Play the isolated scene and tune part readability.
2. Add a small `BrakeRig` instance under the existing safety station only after visual approval.
3. Change the `check_brakes` objective to advance when `brake_verified_changed(true)` fires, not when the player simply presses accept.
4. Keep the quest/reward/event systems unchanged.
