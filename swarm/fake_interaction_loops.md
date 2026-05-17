# Fake Interaction Loops

## Purpose

This audit identifies places where the current vertical slice risks becoming a fake interaction loop: the player presses a key, quest state advances, and rewards proceed without enough physical understanding.

The project direction should be embodied mechanical learning. The player should understand by doing, observing, testing, and verifying.

## Highest-Risk Issues

### Mrs. Ramirez Safety Check: Brake Step

- Current interaction: player presses `[E] Squeeze Brakes`; quest records `check_brakes`; feedback says brake pads catch clean.
- Classification: semi-embodied, mechanically unclear.
- Why it feels fake: the prompt names a physical action, but the player does not clearly see a lever move, cable tighten, caliper close, rim/rotor pinch, or wheel stop.
- Embodied learning version: player identifies the brake lever, presses/holds it, sees cable tension, sees brake contact, and verifies that wheel motion stops or bike resists rolling.
- Emotional impact: strong opportunity. This could make Mrs. Ramirez feel practical and trustworthy instead of tutorial-like.
- Implementation complexity: medium-low if done as a small animated bike inspection station.
- Priority: P1.

### Mrs. Ramirez Safety Check: Tire Step

- Current interaction: player presses `[E] Press Tire`; quest records `check_tires`; feedback says the tire is firm.
- Classification: semi-embodied.
- Why it feels fake: the player is told the tire is ready, but does not get a tactile pressure response beyond feedback text/audio.
- Embodied learning version: tire visibly compresses a little, underinflated tire compresses too much, correct tire rebounds gently.
- Emotional impact: good tactile warmth, low pressure, fits the neighborhood tone.
- Implementation complexity: low.
- Priority: P2.

### Mrs. Ramirez Safety Check: Chain Step

- Current interaction: player presses `[E] Turn Pedal`; bike sprite rotates subtly; quest records `check_chain`.
- Classification: semi-embodied.
- Why it feels fake: there is some motion, but the chain path and cause/effect are not readable enough.
- Embodied learning version: pedal rotates, chain moves around sprocket, smooth chain motion confirms readiness.
- Emotional impact: reinforces bike anatomy and pre-ride ritual.
- Implementation complexity: medium.
- Priority: P2.

### Mrs. Ramirez Safety Check: Report Step

- Current interaction: player presses `[E] Tell Mrs. Ramirez`; quest records/report/reward proceeds.
- Classification: dialogue-only progression.
- Why it feels fake: reporting can become a reward button after three key presses.
- Embodied learning version: reporting should only occur after visible brake/tire/chain verification. Mrs. Ramirez can acknowledge what the player actually tested.
- Emotional impact: if left as-is, the quest feels like checklist compliance instead of learned care.
- Implementation complexity: low after embodied steps exist.
- Priority: P2.

### Mr. Chen Chain Repair: Inspect Chain

- Current interaction: player presses `[E] Inspect Chain`; feedback names the chain slipping sideways; repair bike texture shows slipped-chain state.
- Classification: semi-embodied.
- Why it can feel fake: inspection is a key press unless the chain path is visually legible.
- Embodied learning version: player hovers/targets chain path, sees misalignment, and identifies where links climb off teeth.
- Emotional impact: high, because this is one of the strongest mechanical identity moments.
- Implementation complexity: medium.
- Priority: P1.

### Mr. Chen Chain Repair: Rotate Pedals

- Current interaction: player presses `[E] Rotate Pedals`; wheel rotates and audio cues play.
- Classification: embodied learning, mechanically partial.
- Why it still risks fakeness: one press advances the objective even if the player has not observed the slip.
- Embodied learning version: pedal rotation visibly drives chain motion; slipping creates clunk/sideways jump before repair.
- Emotional impact: high. Cause/effect can teach drivetrain basics silently.
- Implementation complexity: medium.
- Priority: P1.

### Mr. Chen Chain Repair: Align and Seat Chain

- Current interaction: key presses switch textures from slipped to aligning to seated.
- Classification: semi-embodied.
- Why it feels partially fake: texture progression communicates repair state, but the player is not manipulating chain position.
- Embodied learning version: player nudges chain laterally or guides it onto teeth; chain settles as wheel/pedal turns.
- Emotional impact: strong tactile repair identity.
- Implementation complexity: medium-high.
- Priority: P2.

### Mr. Chen Chain Repair: Test Rotation

- Current interaction: key press records final objective and plays success cue.
- Classification: semi-embodied, could be mechanically authentic with stronger motion.
- Why it can feel fake: if the final test is just a reward press, success becomes declarative.
- Embodied learning version: player spins wheel/pedals and sees smooth chain path with quieter audio.
- Emotional impact: very high. This should be the primary payoff cue.
- Implementation complexity: medium.
- Priority: P1.

### Tire Repair: Spin Wheel

- Current interaction: wheel rotates constantly; key press records inspection.
- Classification: semi-embodied.
- Why it can feel fake: the wheel movement exists, but the player does not control the spin or detect wobble/soft spot.
- Embodied learning version: player spins wheel, observes wobble or deflation, and identifies the tire as the problem.
- Emotional impact: good, especially after the square-wheel bug fix made the wheel readable.
- Implementation complexity: medium.
- Priority: P2.

### Tire Repair: Remove Tube

- Current interaction: key press makes tube visible.
- Classification: fake interaction loop.
- Why it feels fake: tube extraction is a tactile action, but the current interaction is a state reveal.
- Embodied learning version: player gently pulls tube out; too much force is avoided or visually discouraged.
- Emotional impact: good quiet-care moment.
- Implementation complexity: medium.
- Priority: P2.

### Tire Repair: Press Patch

- Current interaction: key press shows patch and pulses it.
- Classification: semi-embodied.
- Why it can feel fake: text says press and hold, but the interaction does not require holding or observing adhesion.
- Embodied learning version: player holds input briefly; patch compresses, seals, and color/edge settles.
- Emotional impact: strong tactile learning.
- Implementation complexity: low-medium.
- Priority: P1.

### Tire Repair: Pump Air

- Current interaction: key press sets pressure fill to final green state.
- Classification: semi-embodied, mechanically unclear.
- Why it feels fake: pumping air should be incremental and readable.
- Embodied learning version: each pump raises pressure; player stops in a calm green band and verifies tire firmness.
- Emotional impact: high. It teaches pressure intuitively.
- Implementation complexity: medium.
- Priority: P1.

### NPC Quest Starts

- Current interaction: player advances dialogue with space; `onComplete` can start a quest.
- Classification: dialogue-only progression.
- Why it can feel fake: talking can be useful framing, but it should not substitute for learning or verification.
- Embodied learning version: NPC dialogue frames a real mechanic; quest completion still requires physical observation/testing.
- Emotional impact: dialogue remains warm, but should become invitation, not proof.
- Implementation complexity: low for policy, medium for quest refactors.
- Priority: P2.

### Bridge, Water, Desert, Mine, Workshop Quest Data

- Current interaction: many quest definitions describe embodied activities but may not yet have embodied runtime loops.
- Classification: passive progression risk.
- Why it can feel fake: descriptions such as “test strength,” “run pH test,” “identify tracks,” or “install wheel” can become checklist state without physical action.
- Embodied learning version: each domain needs one readable cause/effect loop before rewards.
- Emotional impact: future-scope risk. If expanded as text quests, they will dilute the bike-mechanics identity.
- Implementation complexity: varies.
- Priority: P3 for current vertical slice, P1 before those regions become playable focus.

## Summary

The biggest fake interaction risk is not spacebar dialogue itself. It is when a single accept press stands in for a physical test. Spacebar can remain a comfort input for dialogue, but quest objectives should increasingly require visible mechanical cause/effect.
