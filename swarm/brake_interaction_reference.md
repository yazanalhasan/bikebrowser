# Brake Interaction Reference

## Goal

The first embodied mechanics prototype should teach this idea:

```text
pressing the brake lever pulls a cable, closes the brake, and stops the wheel
```

The player should verify "the brakes work" by seeing the wheel stop, not by reading a success message.

## Player Sequence

1. Approach the bike or brake station.
2. See the brake lever as an interactable part.
3. Spin the wheel or observe it already spinning slowly.
4. Hold the brake.
5. Watch the lever rotate.
6. Watch the cable tighten.
7. Watch the caliper close.
8. Watch pads contact the rim or rotor.
9. Watch the wheel slow to a stop.
10. Release the brake and see the rig relax.

## Required Visible Parts

```text
BrakeRig
  FrontWheel
  BrakeLeverFront
  BrakeCableFront
  FrontCaliper
  BrakePadLeft
  BrakePadRight
  RotorOrRimContact
```

Optional later parts:

```text
BrakeLeverRear
BrakeCableRear
RearCaliper
RearWheel
CableHousing
AdjustmentBarrel
```

## State Channels

```text
lever_pull: 0.0 resting, 1.0 fully pressed
cable_tension: 0.0 slack, 1.0 taut
caliper_closure: 0.0 open, 1.0 closed
pad_contact: 0.0 no contact, 1.0 firm contact
wheel_spin: 0.0 stopped, 1.0 fast
verified_stop: false or true
```

## Coupling Rules

```text
hold_brake input increases lever_pull
lever_pull increases cable_tension
cable_tension closes caliper arms
caliper_closure creates pad_contact near end of travel
pad_contact decays wheel_spin
wheel_spin below threshold while pad_contact is high sets verified_stop
release_brake relaxes lever, cable, caliper, and pads
```

Use readable curves:

- Lever starts moving immediately.
- Cable becomes visibly taut by mid-pull.
- Caliper closure slightly lags cable tension.
- Pad contact happens near the final third of pull.
- Wheel deceleration accelerates once pad contact is visible.

## Visual Readability Requirements

### Lever Rotation

The lever should rotate enough to read at gameplay scale. It does not need exact brake-lever geometry. It needs a clear before/after silhouette.

### Cable Tension

The cable should change from relaxed to taut. Possible visual cues:

- Straighten the cable path.
- Slightly brighten or sharpen the cable.
- Reduce a small slack curve.
- Add a tiny tension tick at peak pull.

### Caliper Closure

Caliper arms should move symmetrically toward the rim or rotor. The player should be able to trace the cable to the caliper and see the closure as the cable tightens.

### Rotor or Rim Compression

The contact moment should be visible. Possible cues:

- Pads overlap or touch the rim/rotor edge.
- A small contact spark/squeak line appears.
- The rotor/rim briefly darkens at contact.
- The wheel spin blur shortens.

### Wheel Stopping

Wheel motion should make brake function obvious:

- Before braking: spoke/rim spin or rotation blur.
- During braking: spin rate visibly decays.
- After braking: wheel holds still while brake is held.
- On release: wheel may remain stopped unless spun again.

## Input Model

Minimum:

```text
near lever + hold interact = brake pull
near wheel + tap/hold interact = spin wheel
```

Alternative:

```text
single station prompt starts wheel spin, then asks for brake hold
```

Preferred first prototype:

- Give the player control of both spin and brake.
- Keep prompts terse: `Spin Wheel`, `Hold Brake`.
- Let the mechanism explain the relationship.

## Success Condition

```text
verified_stop = wheel_spin <= 0.05 for 0.4 seconds while pad_contact >= 0.85
```

This condition avoids rewarding a brake press before the wheel has actually stopped.

## Failure or Incomplete States

Failure should be readable and gentle:

- If the player taps too briefly, lever moves but wheel only slows.
- If the wheel is not spinning, braking still shows linkage movement but verification waits for a spin test.
- If this becomes an adjustment quest later, loose brakes can show lever pull without enough caliper closure.

Do not punish. Let the player try again and see more.

## Sound and Feel

Use sound as secondary proof:

- Light cable tick when tension reaches midpoint.
- Soft pad contact sound.
- Wheel spin loop fades as friction rises.
- Gentle stop sound when wheel reaches zero.

Avoid loud success stingers as the primary proof.

## Asset Requirements

Minimum 2D prototype assets:

- Bike side-view or close-up brake assembly.
- Lever part that can rotate.
- Cable line or segmented cable.
- Caliper left and right parts.
- Wheel/rotor/rim part that can rotate.
- Brake pads or contact markers.

Minimum 3D/Godot prototype assets:

- Separated named nodes for lever, cable, caliper arms, pads, wheel.
- Optional Blender-authored animation clips for rest-to-pull poses.

## Architecture Safety

Implement first as a local station or local rig controller. It should not require changes to:

- QuestRegistry
- RewardBridge
- EventBus
- SaveService
- RuntimeValidator
- React/Godot bridge schema
- global mission orchestration

The station can expose one local result: `brake_verified`. Later, a quest step can consume that result through the existing mission pattern.

## Godot Integration Notes

Safe first structure:

```text
BikeBrowserWorld/
  Systems/
    Mechanics/
      MechanicalRig.gd
      BrakeRig.gd
      MechanismChannel.gd
  Regions/
    Garage/
      BrakeTestStation.tscn
      BrakeTestStation.gd
```

Keep exported variables for node paths:

```text
lever_node
cable_node
caliper_left_node
caliper_right_node
wheel_node
pad_left_node
pad_right_node
```

This keeps the rig reusable without forcing a global registry.

## Prototype Acceptance

The brake prototype is acceptable when a playtester can say:

- "This is the brake lever."
- "The lever pulls the cable."
- "The cable closes the brake."
- "The brake touches the wheel."
- "The wheel stopped, so the brake works."

If the player instead says "I pressed the prompt and got credit," the prototype has failed the lane.

