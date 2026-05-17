# Embodied Learning Priority Queue

## Ranking Method

Priorities are ranked by:

1. Emotional impact.
2. Educational clarity.
3. Tactile readability.
4. Low implementation risk.
5. Fit with the current vertical slice.

## P1 Priorities

### 1. Brake Testing Loop

- Area: Mrs. Ramirez safety check.
- Why first: it is the clearest current fake-interaction risk and the strongest opportunity to establish embodied safety learning.
- Desired loop: identify lever -> press/hold brake -> cable tightens -> caliper closes -> wheel stops -> player verifies brakes work.
- Emotional impact: very high.
- Educational clarity: very high.
- Tactile readability: very high.
- Implementation risk: medium-low.
- Scope control: implement as a small station animation, not a full brake simulation.

### 2. Chain Smoothness Verification

- Area: Mr. Chen chain repair.
- Why first: already visually supported by repair bike textures and wheel motion.
- Desired loop: rotate pedals -> see chain slip/clunk -> align/seat -> rotate again -> see smooth chain.
- Emotional impact: very high.
- Educational clarity: high.
- Tactile readability: high.
- Implementation risk: medium.
- Scope control: improve cause/effect before adding new chain mechanics.

### 3. Tire Inflation Verification

- Area: tire repair station.
- Why first: pressure bar already exists, but currently jumps through state too quickly.
- Desired loop: pump air -> pressure rises gradually -> tire rounds/settles -> stop in green -> verify hold.
- Emotional impact: high.
- Educational clarity: high.
- Tactile readability: high.
- Implementation risk: medium.
- Scope control: use existing pressure bar and tire sprite; avoid complex physics.

### 4. Patch Press-and-Hold

- Area: tire repair station.
- Why first: low implementation cost and high tactile clarity.
- Desired loop: hold patch -> patch compresses -> seal completes -> tube stabilizes.
- Emotional impact: medium-high.
- Educational clarity: high.
- Tactile readability: high.
- Implementation risk: low-medium.
- Scope control: one held input with visual settling.

## P2 Priorities

### 5. Tire Pressure Press Check

- Area: Mrs. Ramirez safety check.
- Desired loop: press tire -> tire visibly compresses -> player learns too soft vs ready.
- Emotional impact: medium-high.
- Educational clarity: high.
- Tactile readability: high.
- Implementation risk: low.

### 6. Bike Anatomy Micro-Labels

- Area: safety check and chain repair.
- Desired loop: labels appear only when interacting with part.
- Emotional impact: medium.
- Educational clarity: high.
- Tactile readability: medium.
- Implementation risk: medium.
- Constraint: no textbook overlay.

### 7. Wheel Wobble Observation

- Area: tire repair or future wheel check.
- Desired loop: spin wheel -> observe wobble -> adjust/repair -> wobble decreases.
- Emotional impact: medium.
- Educational clarity: high.
- Tactile readability: medium-high.
- Implementation risk: medium.

## P3 Priorities

### 8. Material Testing Rig

- Area: bridge/material quests.
- Desired loop: load sample -> apply weight -> see flex/break/resistance.
- Emotional impact: medium.
- Educational clarity: high.
- Implementation risk: medium-high.
- Constraint: defer until bike vertical slice is more authentic.

### 9. Water Quality Test

- Area: river quests.
- Desired loop: collect sample -> dip strip -> compare color -> infer pH.
- Emotional impact: medium.
- Educational clarity: high.
- Implementation risk: medium.
- Constraint: avoid turning into quiz UI.

### 10. Desert Plant Observation

- Area: desert trail.
- Desired loop: inspect plant structure -> notice spines/wax/shade adaptations -> record observation.
- Emotional impact: medium.
- Educational clarity: medium.
- Implementation risk: medium.
- Constraint: lower priority than bike mechanics.

## Pause Guidance

Pause large new quest content until the first bike interactions demonstrate the project’s educational identity.

The next implementation sprint should not add more quest volume. It should convert the existing safety/repair prompts into visible mechanical cause/effect.

## Most Important Next Pass

Build the smallest brake testing loop.

If the brake test works emotionally, it becomes the template for every future learning interaction: small action, visible mechanism, tactile feedback, quiet verification.
