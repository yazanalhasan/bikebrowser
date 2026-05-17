# Brake Interaction Tactile Pass

## Goal

Sprint 2 moves the brake prototype from structural demonstration toward physical intuition. The player should be able to visually trace:

```text
brake lever -> cable tension -> caliper compression -> rotor/rim contact -> wheel resistance
```

The pass stays isolated in the prototype scene. It does not add new systems or integrate with quest/reward runtime.

## Files Changed

```text
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeRig.gd
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeTestPrototype.tscn
BikeBrowserWorld/tests/brake_rig_state_check.gd
project_audit/brake_interaction_tactile_pass.md
project_audit/physical_intuition_report.md
```

## Readability Improvements

The prototype now uses clearer stylized mechanical shapes:

- Thicker warm bike frame silhouette.
- Larger wheel, rim, spokes, and rotor.
- More readable handlebar, grip, lever, and pivot.
- Larger caliper arms and brake pads.
- Caliper bridge to make the brake assembly feel like one part.
- Contact and compression cues near the rim/rotor.

The goal is not realism. The goal is a readable teaching object at gameplay scale.

## Force-Transfer Improvements

Added visual force path:

```text
BrakeRig/ForcePath
```

This path appears softly while the brake is held, connecting the lever, cable, caliper, and wheel. It is intentionally subtle, more like a visible mechanical hint than an instructional overlay.

Added pull direction:

```text
BrakeRig/CablePullArrow
```

The arrow moves and fades with cable tension so the player can see that the lever is pulling the system toward the brake.

## Cable Tension Improvements

Added:

```text
BrakeRig/CableSlack
BrakeRig/BrakeCable
```

The slack cable fades as the taut cable brightens. This makes the transition from loose line to tensioned line more readable than opacity alone.

The cable no longer just changes color; it now has a before/after tension read.

## Caliper Compression Improvements

Added:

```text
BrakeRig/CompressionGlow
BrakeRig/ContactPoint
```

The caliper arms close farther, brake pads move more visibly, and a soft compression/contact cue appears as pad contact rises. The visual language is still calm and non-spectacular.

## Wheel Resistance Improvements

Added:

```text
BrakeRig/Wheel/SpinGhost
```

The wheel now has a soft rotational ghost that fades as braking force increases. The stop is less binary because the wheel's motion and visual blur decay together.

The braking curve was also adjusted so contact applies increasing resistance rather than a flat stop rate.

## Tactile Feedback Improvements

The rig now adds small physical cues:

- slight lever vibration under pad contact.
- softer staged cable tension.
- delayed caliper closure after cable tension.
- compression glow during contact.
- wheel ghost fade during slowdown.

These cues are local visual feedback. No reward spectacle was added.

## Validation

Focused validation command:

```text
godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd
```

Latest observed result:

```text
Brake rig state check passed
```

The test now checks that the prototype includes:

- cable slack cue.
- cable pull direction cue.
- wheel momentum/resistance cue.
- compression/contact cue.
- force-transfer path cue.
- previous brake state ordering and verification rules.

Godot still emits the project's known headless shutdown cleanup warning after script tests quit. The command exits with code 0 and the brake assertions pass.

## Remaining Fake-Mechanic Feeling

- The cable slack is still a stylized duplicate line rather than a real geometric cable shortening.
- The caliper pads are simple rectangles.
- There is no hand or finger pressing the lever.
- The bike is still a simplified side-view rig, not production art.
- Audio feedback is still represented by signal names and hint text, not final tactile sound.

## Overengineering Risks Avoided

- No physics simulator.
- No full vehicle framework.
- No new quest, reward, event, save, or validation systems.
- No quiz overlay.
- No detailed anatomy UI.
- No car, motorcycle, boat, plane, or spacecraft expansion.

## Next Recommendation

Do one live visual review. If the player can explain the force path without reading a report, integrate this into Mrs. Ramirez's safety check by waiting for `brake_verified_changed(true)` before recording the brake objective.

