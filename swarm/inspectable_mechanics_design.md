# Inspectable Mechanics Design

## Purpose

Inspectable mechanics are small embodied learning loops where the player observes a mechanism closely, acts on it, sees cause/effect, and verifies the result.

This document defines how to design those loops without turning the project into a simulation-heavy tool.

## Core Loop

Every inspectable mechanic should follow:

1. Notice the part.
2. Touch or manipulate the part.
3. See the mechanical response.
4. Observe whether it worked.
5. Verify the outcome.
6. Receive quiet acknowledgment.

The mechanic should teach before the text does.

## Anatomy of an Inspectable Mechanic

### Part

The object or component the player can understand.

Examples:

- brake lever
- cable
- caliper
- chain
- sprocket
- tire
- tube
- patch
- pump

### Action

The player’s physical input.

Examples:

- hold brake
- spin wheel
- press tire
- turn pedal
- press patch
- pump air

### Response

The visible mechanical consequence.

Examples:

- caliper closes
- wheel stops
- tire compresses
- chain moves
- patch flattens
- pressure rises

### Verification

The proof that learning happened.

Examples:

- wheel no longer spins under brake
- chain rolls quietly
- tire holds pressure
- patch seal remains flat

## Design Requirements

### One Mechanic Per Loop

Do not teach multiple systems at once.

Brake test teaches brakes. Chain repair teaches drivetrain motion. Tire repair teaches pressure and sealing.

### One Primary Cause/Effect

Avoid stacking multiple cues.

For a brake test, the primary cue is wheel stopping. Audio or text may support it, but they are not the lesson.

### Manipulation Before Reward

Rewards should follow demonstrated mechanical behavior.

Do not reward:

- dialogue completion alone
- key press count
- checklist advancement
- passive confirmation

Reward after:

- visible stop
- smooth spin
- pressure hold
- sealed patch

### Close Framing Before Explanation

If a part needs explanation, first make it visible.

The design question should be:

`What does the player need to see moving?`

not:

`What text explains this?`

## Interaction Patterns

### Hold-to-Observe

Use when the player should feel sustained pressure or contact.

Good for:

- brake lever
- patch press
- tire squeeze
- suspension compression

### Repeat-to-Build

Use when the player should understand accumulation.

Good for:

- pumping air
- tightening gradually
- testing multiple rotations

### Spin-to-Inspect

Use when motion reveals condition.

Good for:

- wheel wobble
- chain smoothness
- brake drag

### Nudge-to-Align

Use when the player should understand position and fit.

Good for:

- chain seating
- derailleur alignment
- wheel centering

## Brake Test Design Sketch

Smallest authentic loop:

1. Enter mechanic-eye view near Mrs. Ramirez’s bike.
2. Prompt: `Hold Brake`.
3. Lever rotates inward.
4. Cable line tightens.
5. Caliper arms close.
6. Wheel spin slows to stop.
7. Prompt shifts to `Release`.
8. Lever/caliper return.
9. Small confirmation: `Brake catches clean.`

No quiz. No large popup. No reward until this proof happens.

## Drivetrain Design Sketch

Smallest authentic loop:

1. Enter close view of chain and sprocket.
2. Prompt: `Turn Pedal`.
3. Pedal rotates, chain moves.
4. Slipped chain jumps/clunks.
5. Prompt: `Guide Chain`.
6. Chain path moves toward teeth.
7. Prompt: `Test Spin`.
8. Chain rolls smoothly.

Primary payoff: smooth, quiet motion.

## Tire Design Sketch

Smallest authentic loop:

1. Enter close view of tire/tube.
2. Prompt: `Press Tire`.
3. Tire compresses too much.
4. Prompt: `Press Patch`.
5. Holding input flattens patch edge.
6. Prompt: `Pump Air`.
7. Tire rounds out, pressure reaches green.
8. Prompt: `Press Tire`.
9. Tire compresses slightly and rebounds.

Primary payoff: tire holds shape.

## Camera Design Requirements

Inspectable mechanics need camera review before merge.

Camera must confirm:

- the active part is readable
- the force path is readable
- the result is readable
- UI does not cover the mechanism
- the player can return to normal play without confusion

## Overdesign Guardrails

Stop before adding:

- multiple tools for one simple lesson
- complex failure states
- exact physics values
- large overlays
- persistent anatomy HUD
- collectible part encyclopedia

The first success condition is not realism.

The first success condition is:

`The player can explain what happened because they saw it happen.`

## Next Implementation Recommendation

Implement the brake test as the first inspectable mechanic.

It should prove:

- mechanic-eye framing works
- force transfer can teach silently
- small physical loops feel better than fake keypress progression
- the project’s educational identity is strongest when intimate and tactile
