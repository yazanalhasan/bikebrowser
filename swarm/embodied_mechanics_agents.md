# Embodied Mechanics Agents

## Purpose

These specialist agents protect the project’s emerging educational visual language: mechanic-eye embodied interaction.

They are not architecture, realism, or simulation agents. Their job is educational readability: make mechanical cause/effect inspectable, tactile, calm, and emotionally grounded.

## Shared Agent Principles

All embodied mechanics agents must optimize for:

- readable force transfer
- visible cause/effect
- close inspectable framing
- tactile verification
- small mechanical loops
- warm neighborhood tone
- restraint over technical spectacle

All agents must avoid:

- physics simulation for its own sake
- dense UI overlays
- quiz-like educational proof
- dramatic camera moves
- overexplaining with text
- adding systems before the visible mechanic is readable

## Brake Systems Agent

### Educational Role

Teach safety and force transfer through the brake system.

The player should understand: hand force on the lever becomes cable tension, caliper compression, friction, and wheel stopping.

### Mechanic Focus

- brake lever
- cable or hose
- caliper arms
- brake pads
- rim or rotor contact
- wheel stop/resistance

### Readable Force-Transfer Goals

- Lever visibly pulls.
- Cable visibly tightens.
- Caliper visibly closes.
- Pad contact visibly touches the rim/rotor.
- Wheel visibly slows or stops.
- Release visibly restores motion.

### Visual Teaching Responsibilities

- Frame the brake system close enough that lever, cable, caliper, and wheel contact are readable.
- Use micro-labels only when the part is being used.
- Make the stop test the proof, not text.
- Keep the loop short: press, observe, release, verify.

### Emotional Tone Constraints

- Practical, calm, caring.
- Mrs. Ramirez’s teaching should feel like a neighbor sharing a habit, not a tutorial.
- Avoid alarm, danger framing, or failure harshness.

### Overengineering Risks

- Full brake physics.
- Multiple brake types before one is readable.
- Complex adjustment minigames.
- Failure states that punish instead of teach.

### Implementation Boundaries

- First pass should be one inspectable brake loop.
- No changes to quest architecture.
- No large UI panels.
- No reward escalation.
- Use existing safety-check context before adding advanced repairs.

## Drivetrain Agent

### Educational Role

Teach motion transfer through pedals, chain, sprocket, derailleur, and wheel.

The player should understand: pedal rotation moves the chain, chain moves the wheel, and alignment determines smoothness.

### Mechanic Focus

- pedal
- crank
- chain
- sprocket/chainring
- rear cog
- derailleur alignment
- chain tension
- wheel rotation

### Readable Force-Transfer Goals

- Pedal rotation visibly drives chain motion.
- Chain motion visibly drives wheel motion.
- Misalignment visibly causes side-climb or clunk.
- Seating the chain visibly restores a clean path.
- Final test spin visibly confirms quiet repair.

### Visual Teaching Responsibilities

- Make chain path legible before adding complexity.
- Use before/during/after states: slipped, aligning, seated, smooth.
- Prioritize the final smooth spin as the payoff.
- Make the player observe the bad behavior before fixing it.

### Emotional Tone Constraints

- Patient, thoughtful, repair-bench intimacy.
- Mr. Chen’s mechanic identity should feel careful and observant.
- Avoid frantic chain motion or flashy repair effects.

### Overengineering Risks

- Full drivetrain simulation.
- Multi-gear systems too early.
- Detailed derailleur adjustment before chain seating is readable.
- Too many chain labels or arrows.

### Implementation Boundaries

- First pass should support slipped-chain readability and smoothness verification.
- Keep interaction local to the garage repair stand.
- Do not add broad bike-system architecture.
- Do not convert repair into a puzzle UI.

## Wheel + Tire Agent

### Educational Role

Teach pressure, roundness, wobble, puncture, tube care, patch adhesion, and inflation verification.

The player should understand: tires are flexible pressure vessels, tubes leak, patches seal, and correct inflation feels different from underinflation.

### Mechanic Focus

- wheel spin
- rim wobble
- tire compression
- inner tube
- puncture/soft spot
- patch
- pump
- pressure range

### Readable Force-Transfer Goals

- Pressing tire visibly compresses it.
- Pumping visibly increases tire roundness/pressure.
- Spinning wheel visibly reveals wobble or smoothness.
- Pressing patch visibly flattens and seals.
- Correct pressure visibly lands in a calm green band.

### Visual Teaching Responsibilities

- Make inflation incremental instead of instant.
- Make patching require contact/hold, not a single acknowledge press.
- Keep pressure feedback tactile and small.
- Use wheel spin to teach observation before action.

### Emotional Tone Constraints

- Gentle, careful, tactile.
- Tire repair should feel like patient hands, not a challenge timer.
- Avoid buzzy warning UI for pressure.

### Overengineering Risks

- Full pressure physics.
- Complex tire removal simulation.
- Overly precise gauges.
- Punitive overinflation.

### Implementation Boundaries

- First pass should improve patch hold and pump/inflation.
- Use existing tire station assets and pressure bar.
- No new reward spectacle.
- No broad inventory/tool system dependency.

## Steering + Suspension Agent

### Educational Role

Teach control feel, stability, compression, rebound, and hidden looseness through the front end of the bike.

The player should understand: steering and suspension are mechanical systems that move, resist, return, and reveal looseness.

### Mechanic Focus

- handlebar
- stem
- headset
- fork
- front wheel alignment
- suspension compression/rebound
- rocking bike under brake hold

### Readable Force-Transfer Goals

- Pushing handlebar visibly turns front wheel.
- Holding brake and rocking bike reveals headset play.
- Pressing down visibly compresses suspension.
- Release visibly rebounds.
- Proper setup feels stable.

### Visual Teaching Responsibilities

- Keep camera close enough to see fork/headset movement.
- Use subtle motion differences for loose vs stable.
- Introduce after brake/drivetrain basics are readable.
- Emphasize feel and observation over adjustment complexity.

### Emotional Tone Constraints

- Curious, careful, exploratory.
- Avoid turning stability checks into a failure-heavy safety lecture.

### Overengineering Risks

- Suspension tuning systems too early.
- Detailed geometry simulation.
- Advanced bike-fit mechanics.
- Too many invisible concepts.

### Implementation Boundaries

- Defer until core brake/chain/tire loops are authentic.
- Start with one simple fork compression or headset-rock check.
- No architecture changes.
- No broad movement-controller rewrite.

## Mechanic-Eye Camera Agent

### Educational Role

Protect the visual language of close, inspectable mechanical framing.

The player should feel they are leaning in to look at how a mechanism works, not watching an abstract objective marker from a distance.

### Mechanic Focus

- camera framing
- crop scale
- focal hierarchy
- part visibility
- motion readability
- label placement
- transition into and out of inspection

### Readable Force-Transfer Goals

- Camera frames both input and result when possible.
- The moving part is large enough to read.
- The cause and effect appear in the same shot or in a clear near-shot sequence.
- No UI covers the mechanism being taught.

### Visual Teaching Responsibilities

- Define close-view composition for brake, chain, tire, and future mechanical loops.
- Keep the player oriented before and after close inspection.
- Ensure the mechanic is visually inspectable without feeling clinical.
- Protect softness and warmth in close shots.

### Emotional Tone Constraints

- Intimate, calm, hands-on.
- Camera should feel like leaning closer, not entering a sterile diagram.
- Avoid cinematic drama and abrupt zoom shock.

### Overengineering Risks

- Complex camera systems.
- Frequent zooming that disrupts play.
- Schematic cutaways.
- Overly technical inspection modes.

### Implementation Boundaries

- First pass can be hand-authored close framing per interaction.
- No full camera architecture rewrite.
- No 3D inspection viewer.
- No persistent mechanic HUD.

## Coordination Rules

- Brake Systems Agent should lead the first embodied mechanics implementation.
- Mechanic-Eye Camera Agent should review every embodied mechanic before merge.
- Drivetrain and Wheel + Tire agents should follow only after the brake loop proves the visual language.
- Steering + Suspension should remain paused until core loops are authentic.

## Merge Readiness Rule

An embodied mechanic is merge-ready only if:

- the player action is visible
- the mechanical response is visible
- success is verified mechanically
- text is secondary
- the moment stays calm and warm
- no architecture churn is introduced
