# Brake Interaction Contact Pass

## Goal

Sprint 3 makes the brake feel more resistant, compressive, and friction-based while keeping the prototype small. The focus is still one embodied interaction:

```text
hold brake -> pressure builds -> cable loads -> pads pinch -> friction resists wheel -> wheel stops
```

No generalized vehicle framework or simulation engine was added.

## Files Changed

```text
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeRig.gd
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeTestPrototype.tscn
BikeBrowserWorld/tests/brake_rig_state_check.gd
project_audit/brake_interaction_contact_pass.md
project_audit/physical_contact_report.md
```

## Contact Improvements

Added explicit contact cues:

```text
BrakeRig/ContactPinch
BrakeRig/FrictionBand
```

`ContactPinch` appears when pad contact rises, giving the brake a visible gripping moment. `FrictionBand` sits at the wheel/rotor area and becomes visible under friction load, making the slowing point easier to read.

The pads also travel farther and slightly over-compress at contact so the player can see a squeeze, not only a closing motion.

## Resistance Improvements

Added a local state channel:

```text
friction_load
```

This is not a physics simulation. It is a readable authored value derived from pad contact. Wheel slowdown now uses a progressive resistance curve:

```text
friction_load -> squared resistance -> gradual wheel_spin decay
```

The wheel now has a clearer resistance band before full stop, preserving the rule that verification waits until the wheel is visibly stopped.

## Friction Readability Improvements

Friction is now shown through:

- a quiet contact pinch shape.
- a warm friction band around the rotor/rim.
- wheel ghost fade under resistance.
- tiny wheel hesitation through visual wobble timing.
- no sparks, no loud effects, no spectacle.

The point is to make friction understandable without making it flashy.

## Tactile Timing Improvements

The sequence now has more pressure buildup:

1. Lever begins moving.
2. Cable loads.
3. Caliper closure follows.
4. Pad contact creates friction load.
5. Wheel resists progressively.
6. Wheel stops.
7. Verification appears after the stop is sustained.

Added:

```text
BrakeRig/LeverResistanceArc
BrakeRig/CableLoadMark
```

These cues make the lever and cable feel loaded rather than merely animated.

## Validation

Focused validation command:

```text
godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd
```

Latest observed result:

```text
Brake rig state check passed
```

The test verifies:

- contact pinch cue exists.
- friction band cue exists.
- lever resistance cue exists.
- cable load cue exists.
- `friction_load` appears after caliper closure.
- the wheel enters a progressive resistance state before stopping.
- brake verification still occurs only after `wheel_stopped`.

Godot still emits the project's known headless shutdown cleanup warning after script tests quit. The command exits with code 0 and the brake assertions pass.

## Remaining Fake-Feeling Areas

- The contact is still a stylized visual cue, not a deforming material.
- The lever resistance is visual, not haptic.
- The caliper is still simplified line-and-rect geometry.
- The cable load does not physically shorten a cable path.
- There is no final audio materiality pass yet.

## Overengineering Risks Avoided

- No rigid-body physics.
- No brake fluid or hydraulic simulation.
- No CAD detail.
- No new global mechanics system.
- No quest/reward/event/save/runtime changes.
- No additional bike systems.

## Next Recommendation

Do a short human visual test:

- Ask what part is applying pressure.
- Ask where friction happens.
- Ask why the wheel stops.

If the answer comes from observation instead of text, the brake is ready for Mrs. Ramirez integration.

