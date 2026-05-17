# Embodied Learning Systems

## Identity

BikeBrowser's strongest educational identity is a mechanically understandable world. The player should learn by manipulating parts, watching force travel, and verifying that a system now behaves correctly.

This is different from a text-based educational system. Text can name parts, but the machine should carry the lesson.

## Learning Loop

```text
notice part -> try physical action -> observe mechanism -> compare behavior -> verify outcome
```

The loop should be short, tactile, and repeatable. It should feel like learning from a neighbor in a garage, not taking a quiz.

## Core Categories

### Transfer

Transfer systems show motion or force moving from one part to another.

Bike examples:

- Lever pulls cable.
- Pedal turns chain.
- Chain turns sprocket.
- Handlebar turns fork and wheel.

Future examples:

- Car steering wheel turns steering linkage.
- Boat throttle changes propeller spin.
- Plane yoke moves control surfaces.
- Spacecraft RCS input fires paired thrusters.

### Tension

Tension systems show a flexible element becoming taut.

Bike examples:

- Brake cable tightens.
- Chain slack decreases.
- Spoke tension affects wheel wobble.

Future examples:

- Boat line pulls rudder or sail.
- Aircraft cable linkage moves flap.
- Docking tether straightens under load.

### Compression

Compression systems show contact pressure or spring travel.

Bike examples:

- Brake pad compresses on rim or rotor.
- Tire squishes under thumb.
- Suspension fork compresses.
- Patch presses flat against tube.

Future examples:

- Car suspension compresses over bump.
- Boat fender compresses against dock.
- Landing gear strut compresses.

### Friction

Friction systems show motion slowing because of contact.

Bike examples:

- Brake pad slows wheel.
- Misaligned chain rubs and clunks.
- Tire grip resists sliding.

Future examples:

- Car brake pad slows rotor.
- Boat hull drag increases in water.
- Aircraft wheel brakes slow landing roll.

### Flow

Flow systems show a medium moving through or around a mechanism.

Bike examples:

- Pump air inflates tire.
- Air leak stops after patch seals.

Future examples:

- Boat prop wash changes direction.
- Plane airflow over flap changes lift cue.
- Spacecraft propellant line feeds thruster.

### Control Surface

Control-surface systems show orientation changing a larger motion.

Bike examples:

- Fork angle changes travel direction.

Future examples:

- Boat rudder turns wake direction.
- Plane aileron tilts wing response.
- Spacecraft gimbal tilts thrust direction.

### Propulsion

Propulsion systems show an input creating movement.

Bike examples:

- Pedal input drives rear wheel.
- E-bike throttle cue increases assisted wheel spin.

Future examples:

- Car drivetrain turns wheels.
- Boat propeller pushes water.
- Plane propeller or jet thrust pushes air.
- Spacecraft engine bell produces thrust plume.

## Vehicle Expansion Map

### Bike

- Brakes: lever, cable, caliper, rotor/rim, wheel stop.
- Chain: crank, chain, sprocket, cassette, wheel drive.
- Gears: derailleur shifts chain path, cadence changes.
- Steering: handlebar, stem, fork, wheel direction.
- Suspension: fork compression and rebound.

### E-Bike

- Assist: pedal sensor, controller cue, motor support.
- Battery safety: charge state, connector fit, fuse protection.
- Throttle: input channel, motor response, speed limit.

### Motorcycle

- Brake hydraulics as visible pressure transfer.
- Throttle cable or ride-by-wire as input response.
- Suspension sag and rebound.
- Chain or belt drive.

### Car

- Brake pedal, hydraulic line cue, caliper, rotor.
- Steering wheel, rack, tie rods, wheel angle.
- Suspension compression by corner.
- Drivetrain torque path from engine/motor to wheels.

### Boat

- Throttle lever, propeller spin, wake strength.
- Rudder angle, wake direction, hull turn.
- Ballast fill/drain, trim change.
- Mooring line tension.

### Plane

- Flaps change wing silhouette and lift cue.
- Ailerons oppose each other and roll cue appears.
- Rudder deflects tail and yaw cue appears.
- Throttle increases prop wash or thrust stream.

### Spacecraft

- RCS thruster pairs show rotation control.
- Engine gimbal tilts thrust vector.
- Docking latch alignment and capture.
- Staging separates parts in a visible sequence.

## Emotional Fit

The interaction tone should remain warm, practical, and grounded. The player is not becoming a race engineer or aerospace simulation operator. They are learning to trust physical intuition.

Good emotional fit:

- A wheel stops because the player squeezed the brake.
- A chain runs quiet because the player seated it.
- A tire feels firm because the player pumped and checked it.
- A rudder turns water visibly behind a boat.

Poor emotional fit:

- Dense telemetry overlays.
- CAD-like part trees.
- Simulation parameters as primary gameplay.
- Failure states that feel punitive or technical.
- Racing-style tuning as the main reward.

## Readability Scale

Every mechanism should pass these tests:

- Can the player identify the input part?
- Can the player see the connected part move?
- Can the player tell whether the mechanism is more or less engaged?
- Can the player verify the outcome without reading a paragraph?
- Does the silhouette change at gameplay zoom?
- Does the feedback arrive within a fraction of a second?

## Integration Strategy

Start with isolated station-scale mechanics. A station can own a local rig, local state channels, and local verification. Once the pattern works, promote the reusable parts into a small `MechanicsRig` module.

Do not begin by making a global simulation manager. The first proof should be a brake station with visible mechanical response.

Safe path:

1. Local brake rig prototype.
2. Small channel/coupling helper.
3. Chain rig using the same helper.
4. Optional shared debug overlay for mechanism state.
5. Only then consider global events or save integration.

## Overengineering Guardrails

- If a mechanism cannot be explained in one sentence, split it.
- If a state value is not visible, question whether it belongs in the first prototype.
- If a player must read text to know it worked, improve the mechanism first.
- If physics makes the behavior inconsistent, author the behavior instead.
- If a framework does not help brakes, chains, tires, or steering, defer it.

