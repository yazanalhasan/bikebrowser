# Embodied Mechanics Prototype Plan

## Purpose

Create the first mechanically readable interaction prototype: a brake test where the player presses a brake lever, sees force transfer through cable and caliper, watches the wheel stop, and verifies that the brakes work.

This plan is documentation-first. It does not authorize runtime architecture churn.

## 1. Safest First Prototype

Build a local brake test station, preferably in the Godot prototype garage or an isolated mechanics test scene.

Core loop:

```text
Spin Wheel -> Hold Brake -> lever rotates -> cable tightens -> caliper closes -> pad contact -> wheel stops -> verified
```

Why this first:

- It is already the top embodied learning priority.
- It has clear before/during/after states.
- It is emotionally aligned with safety and care.
- It does not require new global systems.
- It creates a reusable pattern for chain, tire, steering, and suspension.

## 2. Required Assets

Minimum:

- Side-view or close-up bike front wheel.
- Separate brake lever part.
- Separate brake cable visual.
- Separate caliper left and right arms.
- Separate brake pads.
- Wheel, rim, or rotor that can rotate.
- Small contact cue at pad/rim or pad/rotor.

Nice later:

- Cable housing.
- Rear brake variant.
- Loose brake state.
- Adjustment barrel.
- Subtle hand interaction pose.

Asset naming should use educational part names:

```text
front_brake_lever
front_brake_cable
front_caliper_left
front_caliper_right
front_brake_pad_left
front_brake_pad_right
front_wheel
front_rotor_or_rim
```

## 3. Required Rig Structure

```text
BikeRig
  FrontWheel
  BrakeLeverFront
  BrakeCableFront
  FrontCaliper
  FrontBrakePadLeft
  FrontBrakePadRight
```

Prototype script structure:

```text
BrakeRig
  channels:
    lever_pull
    cable_tension
    caliper_closure
    pad_contact
    wheel_spin
    verified_stop
  controls:
    spin_wheel
    hold_brake
```

Do not build a full vehicle simulation. This is an educational rig with readable couplings.

## 4. Required Interactions

Minimum interactions:

- `Spin Wheel`: starts or increases visible wheel spin.
- `Hold Brake`: increases lever pull while held.
- `Release Brake`: relaxes the lever, cable, caliper, and pads.

Prompt language:

- Use physical verbs.
- Keep text short.
- Avoid explanatory panels.

## 5. Required Animations

Lever:

- Rest pose to pulled pose.
- Large enough rotation to read.

Cable:

- Slack/relaxed state to taut/straightened state.
- Slight visual emphasis at high tension.

Caliper:

- Left and right arms close toward wheel.
- Pads meet rim or rotor near full closure.

Wheel:

- Spin animation before braking.
- Deceleration under pad contact.
- Full stop while brake is held.

Contact:

- Small visual cue when pads touch.
- Cue should support the mechanism, not replace it.

## 6. Required Feedback Loops

Primary feedback:

- The mechanism moves.

Secondary feedback:

- Cable tick at tension.
- Soft pad contact.
- Wheel spin sound fades.
- Gentle stop sound.

Verification:

```text
wheel_spin <= 0.05 for 0.4 seconds while pad_contact >= 0.85
```

Avoid:

- Reward before wheel stop.
- Large success UI as proof.
- Text explanations of force transfer.

## 7. Implementation Surface Area

Safe surface:

- New local mechanics rig script.
- New local brake rig script.
- New local brake station scene/script.
- New prototype assets.
- Optional local test scene.
- Optional local automated check for channel coupling math.

Do not touch:

- QuestRegistry
- RewardBridge
- EventBus
- SaveService
- RuntimeValidator
- global orchestration systems
- React/Godot bridge schema

If the prototype is implemented in the Phaser scene tree first, obey the layout rule: all static positions must come from `public/layouts/<scene>.layout.json` through `loadLayout(this, '<key>')`. Do not write literal pixel coordinates in scene files.

## 8. Architecture Safety

Phase 1 should remain local:

```text
BrakeTestStation owns BrakeRig
BrakeRig owns local channels
BrakeRig updates visible nodes
BrakeTestStation reads verified_stop
```

Only after playtesting should this become shared:

```text
Systems/Mechanics/MechanicalRig
Systems/Mechanics/BrakeRig
Systems/Mechanics/ChainRig
```

Promotion criteria:

- Brake interaction is readable.
- Coupling model is small.
- Chain or tire can reuse the same model.
- No global system needs to know per-frame mechanical state.

## 9. Emotional Fit

The brake test should feel practical and caring:

- "Check that the bike is safe."
- "Try the lever."
- "The wheel stopped."

It should not feel like:

- A racing brake calibration screen.
- A CAD rig editor.
- A robotics simulator.
- A quiz about brake vocabulary.

Part names should appear only near the part being used, and only when helpful.

## 10. Overengineering Risks

Dangerous traps:

- Full brake physics.
- Fluid dynamics for hydraulic brakes.
- Per-link chain simulation before a brake prototype.
- Importing URDF or robotics middleware.
- Building a global simulation manager first.
- Adding dense telemetry UI.
- Tuning racing-style vehicle dynamics.
- Creating a universal vehicle framework before one interaction works.
- Using ragdoll or physical-bone systems for deterministic brake motion.

Protection rules:

- One prototype, one mechanism, one verification.
- Use normalized channels before physical units.
- Author visible motion when physics is not required.
- Promote shared architecture only after the second mechanism reuses it.
- Measure success by player explanation, not technical sophistication.

## Research Summary

Reusable:

- Godot 2D/3D node hierarchies and small property animations.
- Blender-authored separated parts and baked/simple animations.
- URDF vocabulary for links, joints, axes, limits, mimic behavior, and transmission.

Not reusable as runtime:

- Full URDF integration.
- Rigid-body chain physics.
- Ragdoll/PhysicalBone brake behavior.
- Racing vehicle dynamics frameworks.

## First Implementation Slice

Recommended first engineering slice:

1. Create an isolated brake test scene with placeholder parts.
2. Add normalized brake channels.
3. Add `spin_wheel` and `hold_brake` controls.
4. Map channels to lever, cable, caliper, pad, and wheel visuals.
5. Add verification when the wheel stops under brake contact.
6. Playtest only for readability.
7. Refine silhouettes and timings.
8. Only then connect to a quest step.

## Success Criteria

The prototype succeeds when:

- The player can identify the brake lever.
- Pressing the lever visibly tightens a cable.
- Cable tension visibly closes a caliper.
- Pad contact visibly stops the wheel.
- Verification follows the stopped wheel.
- No large simulation framework was introduced.
- The interaction teaches through physical intuition.

