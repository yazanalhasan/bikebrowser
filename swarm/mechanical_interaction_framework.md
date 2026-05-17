# Mechanical Interaction Framework

## Core Thesis

BikeBrowser should teach mechanics by letting the player touch a system and watch the system answer. The smallest useful framework is an authored articulated rig driven by a few normalized state channels.

The model should be understandable in one glance:

```text
player input -> control channel -> coupled parts -> visible response -> verification
```

## Smallest Reusable Model

```text
MechanismRig
  id
  parts
  controls
  channels
  couplings
  visualizers
  verification
```

### Part

A `Part` is a named visible object. It may be a Godot node, sprite, bone, mesh, line, or particle cue.

Examples:

- `front_brake_lever`
- `front_brake_cable`
- `front_caliper_left`
- `front_caliper_right`
- `front_rotor`
- `front_wheel`

Part rules:

- Names should match what a player can point at.
- Hidden math helpers should not be treated as educational parts.
- Static anchor positions belong in scene/layout data, not hard-coded coordinates.

### Control

A `Control` is a player action mapped to a state channel.

Examples:

- `hold_front_brake`
- `spin_front_wheel`
- `press_tire`
- `turn_crank`
- `push_handlebar`

Control rules:

- Controls should be physical verbs.
- Avoid abstract verbs like `inspect`, `confirm`, or `continue` when the system can ask for a direct action.
- The control should create immediate visible movement.

### Channel

A `Channel` is a normalized mechanical value from `0.0` to `1.0`, or a simple signed range where needed.

Examples:

- `lever_pull`: `0.0..1.0`
- `cable_tension`: `0.0..1.0`
- `caliper_closure`: `0.0..1.0`
- `wheel_spin`: `0.0..1.0`
- `brake_contact`: `0.0..1.0`
- `chain_phase`: looping `0.0..1.0`

Channel rules:

- Use readable state before physical fidelity.
- One channel should answer one visual question.
- Derived channels should be inspectable in debug builds.

### Coupling

A `Coupling` maps one channel to another or maps a channel to a part transform.

Examples:

```text
lever_pull -> cable_tension
cable_tension -> caliper_closure
caliper_closure -> brake_contact
brake_contact -> wheel_spin_decay
crank_angle -> chain_phase
chain_phase -> rear_sprocket_rotation
```

Coupling rules:

- Couplings should be monotonic when possible so players can see progression.
- Exaggerate the visual response slightly when a real motion would be too subtle.
- Clamp motion to clear limits.

### Visualizer

A `Visualizer` makes invisible mechanical state visible.

Examples:

- Cable line straightens and brightens under tension.
- Brake pad contact produces a tiny compression mark.
- Wheel spin ghosting fades as friction increases.
- Chain slack resolves into a taut line.
- Suspension travel leaves a short rebound smear.

Visualizer rules:

- Prefer physical-looking cues over UI meters.
- Use UI only when the physical cue cannot carry the lesson alone.
- Keep labels temporary and attached to the moving part.

### Verification

Verification is the proof that the mechanism works.

Examples:

- Wheel stops when the brake is held.
- Tire holds shape after inflation.
- Chain runs smoothly after seating.
- Steering turns wheel and fork together.
- Suspension compresses and rebounds without sticking.

Verification rules:

- Completion follows proof, not prompt sequence.
- The player should be able to say what worked before any reward fires.
- Verification should reuse the same rig, not switch to a text explanation.

## Brake Prototype State Model

```text
BrakeRig
  controls:
    hold_brake
    spin_wheel
  channels:
    lever_pull
    cable_tension
    caliper_closure
    pad_contact
    wheel_spin
    verified_stop
  couplings:
    hold_brake -> lever_pull
    lever_pull -> cable_tension
    cable_tension -> caliper_closure
    caliper_closure -> pad_contact
    pad_contact -> wheel_spin_decay
    wheel_spin == 0 while pad_contact high -> verified_stop
```

Readable sequence:

1. Wheel spins freely.
2. Player presses brake lever.
3. Lever rotates.
4. Cable becomes taut.
5. Caliper arms close.
6. Pads contact rotor or rim.
7. Wheel slows and stops.
8. Player releases brake and sees the system relax.

## Chain Prototype State Model

```text
ChainRig
  controls:
    turn_crank
  channels:
    crank_angle
    chain_phase
    chain_tension
    chain_alignment
    rear_sprocket_rotation
    rear_wheel_spin
  couplings:
    crank_angle -> chain_phase
    chain_phase -> rear_sprocket_rotation
    rear_sprocket_rotation -> rear_wheel_spin
    chain_alignment low -> clunk and lateral wobble
    chain_alignment high -> smooth loop
```

Readable sequence:

1. Player turns crank.
2. Chain moves around sprockets.
3. Rear wheel responds.
4. Misalignment makes the chain visibly wander or clunk.
5. Seating the chain restores a clean path.

## Suspension Prototype State Model

```text
SuspensionRig
  controls:
    press_handlebar
  channels:
    compression
    rebound
    damping_health
  couplings:
    press_handlebar -> compression
    release -> rebound
    damping_health low -> sticky or bouncy return
    damping_health high -> smooth return
```

This can wait. It is a good second-category proof after brakes and chain.

## Data Shape

Use a small data format that can be loaded by a Godot mechanism controller later:

```json
{
  "id": "front_brake",
  "channels": {
    "lever_pull": { "min": 0, "max": 1, "rest": 0 },
    "wheel_spin": { "min": 0, "max": 1, "rest": 0.7 }
  },
  "couplings": [
    { "from": "lever_pull", "to": "cable_tension", "curve": "linear" },
    { "from": "cable_tension", "to": "caliper_closure", "curve": "ease_out" },
    { "from": "caliper_closure", "to": "wheel_spin", "effect": "decay" }
  ],
  "verification": {
    "kind": "channel_below_threshold",
    "channel": "wheel_spin",
    "threshold": 0.05,
    "while": { "channel": "caliper_closure", "min": 0.85 }
  }
}
```

This is intentionally not a physics format. It is a readable interaction format.

## Runtime Boundary

The mechanics framework should live beside gameplay systems, not inside canonical orchestration. It should emit simple outcomes like:

- `mechanism_started`
- `mechanism_channel_changed`
- `mechanism_verified`

The first prototype can avoid global events entirely and keep state local to the scene or station. Broader integration should wait until the interaction is fun, readable, and stable.

Do not modify:

- QuestRegistry
- RewardBridge
- EventBus
- SaveService
- RuntimeValidator
- cross-scene orchestration

## Mechanical Readability Rules

1. Visible force transfer: each action moves a connected part.
2. Visible linkage: the player can trace cause/effect through the mechanism.
3. Visible tension: cables, chains, straps, and springs show tautness.
4. Visible compression: pads, tires, springs, and seals visibly compress.
5. Visible friction: contact slows, rubs, or resists motion.
6. Visible progression: before, during, and after states are distinct.
7. Readable silhouette changes: motion is large enough to read at gameplay scale.
8. Local labels only: labels follow the part and vanish after use.
9. Verification before reward: proof comes from the mechanism.
10. Determinism over realism: the same action should produce the same lesson.

