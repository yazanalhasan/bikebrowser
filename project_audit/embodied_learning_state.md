# Embodied Learning State

Date: 2026-05-17
Scope: BrakeRig, ChainRig, force transfer, tension, friction, mechanic-eye perspective, tactile verification.

## Current Thesis

The project's strongest learning idea is no longer "bike facts through quests." It is "mechanical understanding through embodied repair." The player is being asked to feel a system stabilize: pull, tension, contact, resistance, alignment, seating, spin, verification.

That is the right direction. The remaining work is consistency, not expansion.

## BrakeRig

BrakeRig is the strongest embodied mechanic.

Why it works:

- The state ladder is physically legible.
- Lever pull causes cable tension.
- Cable tension causes caliper closure.
- Caliper closure causes pad contact.
- Pad contact creates friction load.
- Friction load slows the wheel.
- Verification waits until the wheel has visibly stopped.

The mechanic avoids fake completion because pressing alone does not verify the repair. The wheel must reach a sustained stopped state. That makes the lesson observable rather than symbolic.

Main risk:

BrakeRig can become schematic if labels, glows, and state cues become more visually dominant than the physical movement. The visual hierarchy should keep the moving parts primary and instructional overlays secondary.

## ChainRig

ChainRig is the strongest integrated mechanic because it lives inside a real repair context.

Why it works:

- The player holds the pedal rather than clicking through steps.
- Chain tension rises over time.
- The chain is guided, seated, and then tested through wheel spin.
- ChainHotspot records objectives at meaningful state transitions.
- Verification is tied to clean drivetrain motion, not arbitrary input count.

Current state ladder:

`chain_slipped -> pedal_rotated -> chain_tension_visible -> chain_guided -> chain_seated -> wheel_turns_cleanly -> chain_verified`

Main risk:

`[Hold E] Pedal` may be under-taught for players trained by tap-to-interact games. If a player releases repeatedly, the mechanic may feel like the input is failing rather than like tension is being lost.

## Force-Transfer Readability

Best current force-transfer readability: BrakeRig.

The brake mechanic makes energy transfer easier to infer because it maps a hand action to a visible wheel outcome. ChainRig is almost as strong, but drivetrain transfer is more abstract because chain seating and wheel spin are visually close together. It may need slightly more mechanical-eye framing around the path from pedal/crank to chainring, chain, sprocket, and wheel.

## Tension Readability

Brake cable tension and chain tension are both represented as rising scalar states with visible modulation. This is good because the player can see intermediate states before success.

Risk:

Tension may still read as "highlight intensity" rather than "stored pull/load" unless the physical object visibly changes shape, slack, angle, or contact.

## Friction Readability

Friction is clearest in BrakeRig because the wheel slows under pad contact. This is a concrete, player-observable outcome.

ChainRig has less friction semantics and more alignment/seating semantics. That is appropriate. Do not force friction language into ChainRig; keep it about tension, alignment, seating, and clean rotation.

## Mechanic-Eye Perspective

ChainHotspot has the right mechanic-eye idea: it zooms gently toward the drivetrain when engaged and restores the wider view after verification. That supports inspection without turning the moment into a minigame popup.

Risk:

The mechanic-eye perspective must be standardized. BrakeRig and ChainRig should share:

- one engage cue,
- one sustained input grammar,
- one visual causality path,
- one verification moment,
- one quiet post-repair response.

## Tactile Verification

The current verification pattern is good:

- BrakeRig: wheel stop is required before brake verification.
- ChainRig: clean wheel rotation is required before chain verification.
- ChainHotspot: quest objectives map to rig states, and reward intent fires after embodied completion.

This is materially better than a press-count ladder.

## Fake Interaction Loops Remaining

- The legacy Phaser `/play` surface still exposes many UI buttons and quest/report systems that feel like app controls rather than embodied play.
- Some frontend quest tests still complete quests by directly mutating state rather than playing physical interactions.
- The Godot prototype route exists in tests and code but is not registered in the active React routes, so it behaves like a stale integration idea.
- Side regions appear represented in data and assets, but their embodied grammar is not yet as mature as the garage/neighborhood repair loop.

## Abstraction Leakage

- React/Phaser HUD buttons expose inventory, shop, notebook, audio, brain, report, pause, and chart controls directly over the game.
- Godot validation and export systems are strong, but the user-facing shell makes engine identity visible.
- Telemetry names such as `release_count`, `rig_session`, and state transitions are useful internally but should not leak into child-facing UI.

## Remaining Gamey Behavior

- "Hold E until success" can still become a progress-bar behavior if the player is watching the UI rather than the mechanism.
- Reward intent and quest completion are technically correct, but payoff should remain subtle enough that the bike, not the badge, feels like the win.
- The prompt grammar is not yet proven with external players.

## Metrics That Matter For Embodied Understanding

High value:

- `first_engage_ms`: did the player find the mechanic quickly?
- `time_to_verify_ms`: did the player understand the sustained action?
- `release_count`: did the player tap/release because the grammar was unclear?
- ordered `state_transitions`: where did the player stall?
- re-engage after verification: did the player test the repaired system again?
- proximity dwell before interaction: did the player inspect or wander confused?

Lower value by itself:

- raw completion count,
- reward fired,
- total session duration,
- state reached only through automated test,
- zero-release success from a scripted path.

## Recommendation

Refine the shared embodied grammar before adding new mechanics. The next best improvement is not another repair system; it is an external playtest pass that asks whether players can explain braking, chain tension, drivetrain transfer, force transfer, and wheel resistance after interacting without being told the answer.
