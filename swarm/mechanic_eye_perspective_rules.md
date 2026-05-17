# Mechanic-Eye Perspective Rules

## Core Idea

Mechanic-eye perspective is the project’s emerging educational visual language.

It means the camera and interaction framing should feel like a player leaning in to understand a real mechanism with their eyes and hands.

## What Mechanic-Eye Is

Mechanic-eye framing is:

- intimate
- inspectable
- close enough to read part motion
- focused on cause/effect
- tactile
- quiet
- warm
- grounded in the bike or object being touched

Mechanic-eye framing is not:

- a schematic diagram
- a quiz overlay
- a full simulation UI
- a cinematic cutscene
- a detached tutorial panel
- a distant objective prompt

## Framing Rules

### Show Input and Result

Whenever possible, frame the player action and the mechanical response together.

Examples:

- brake lever and caliper/wheel contact
- pedal and chain path
- pump and tire/pressure response
- patch and tube surface

### Stay Close Enough to Read Motion

If the player cannot see the part move, the view is too distant.

The smallest moving part that matters should be readable without squinting.

### Keep Cause/Effect in One Thought

The player should be able to understand:

`I did this -> the mechanism did that.`

If the cause and effect cannot fit in one shot, use a calm two-step view rather than a busy wide view.

### Preserve Orientation

Close views should not make the player feel lost.

Before and after a close inspection:

- return to the same world context
- keep the bike or station visually recognizable
- avoid abrupt disorientation

### Prefer Hands-On Scale

Frame parts at the scale of touch.

Good:

- lever moving under a hand
- tire compressing under pressure
- chain settling onto teeth
- pump handle moving

Risky:

- full-bike wide view where the important part is tiny
- abstract icons showing success
- labels pointing to invisible motion

## UI Rules

UI should never compete with the mechanism.

Allowed:

- small part labels near the active part
- short action prompts
- tiny completion confirmation after mechanical proof

Avoid:

- large text panels
- constant labels
- tutorial overlays
- progress bars as the primary mechanic
- reward popups before verification

## Motion Rules

Motion must be readable before it is pretty.

Preferred motion traits:

- slower than realistic if needed for understanding
- slightly exaggerated only at the point of contact
- repeated enough to observe
- quiet in amplitude

Avoid:

- fast tiny motion
- decorative bounce
- particles as proof
- animation that does not correspond to force transfer

## Sound Rules

Sound should support tactile understanding.

Examples:

- cable tug
- pad contact
- chain clunk
- smooth chain roll
- pump air
- patch press

Avoid:

- fanfare as proof
- loud stingers
- excessive reward cues
- audio that hides the mechanical sound

## Text Rules

Text should name what the player is already seeing.

Good:

- `Brake lever`
- `Cable tightens`
- `Caliper closes`
- `Wheel stopped`

Risky:

- `The brake system converts hand force into friction at the wheel.`

The rule: show the concept first, name it second.

## Emotional Rules

Mechanic-eye should feel:

- safe
- patient
- curious
- familiar
- tactile

It should not feel:

- clinical
- high-stakes
- flashy
- overproduced
- like a textbook

## First Use Case Standard

The brake test should become the reference implementation.

Minimum mechanic-eye brake standard:

1. Close view of brake lever/cable/caliper/wheel.
2. Player holds input.
3. Lever moves.
4. Cable tightens.
5. Caliper closes.
6. Wheel stops.
7. Release restores neutral position.
8. Completion follows mechanical verification.

If this works, every later mechanic should inherit the same language.
