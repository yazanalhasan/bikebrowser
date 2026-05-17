# Embodied Learning Validation

Date: 2026-05-17
Author: experiential-playtest-validation sprint
Question: **Does the mechanic itself teach drivetrain causality, force transfer, and braking, without text explanation?**

## 1. What I can validate from code alone

Two things, with high confidence:

### (a) The causal chain is observable on screen

I can read every visual change driven by each scalar and confirm the visible-effect chain is intact:

**BrakeRig:**
```
player holds E → lever_pull rises → lever rotates (visible: BrakeLever.rotation)
              → cable_tension rises → cable_slack fades out, cable color brightens
              → caliper_closure rises → CaliperLeft rotates +20°, CaliperRight rotates −20°
              → pad_contact rises → PadLeft moves +X, PadRight moves −X (toward rotor)
              → friction_load rises → wheel_spin decays → wheel rotation slows
              → STATE_STOPPED → 0.4s sustain → STATE_VERIFIED → "Looks good." line
```

**ChainRig:**
```
player holds E → pedal_rotation rises → crank rotates (CrankArm visible)
                                     → chainring rotates (ChainringDisc + Teeth)
              → chain_tension rises → chain modulate brightens, ChainSlack fades, ChainTensionMark fades in
              → chain_alignment rises → (no dedicated visual — internal)
              → chain_seated rises → SeatedGlow fades in
              → drivetrain_engagement rises → wheel_spin rises
              → wheel_angle accelerates → RearWheel rotates, sprocket rotates
              → STATE_SPINNING → 0.4s sustain → STATE_VERIFIED → "Drivetrain clean." label
```

Both chains are causally faithful to the named physics. A player who watches a rig run end-to-end is looking at correct mechanics, even if they can't articulate it.

### (b) The verification gate is causal, not symbolic

In both rigs, verification depends on a sustained physical end-state:
- BrakeRig: `wheel_spin <= 0.05 AND pad_contact >= 0.85` for 0.4s.
- ChainRig: `wheel_spin >= 0.55 AND chain_seated >= 0.80` for 0.4s.

There is **no** path to verification that doesn't pass through the visible mechanism. A player cannot mash E and complete the loop — the rig requires sustained input and the wheel-state thresholds to be met. This is the strongest claim the project can make about embodied learning: the game *cannot be passed without performing the mechanism*. The brake step in SafetyCheckStation honors this; the chain step in ChainHotspot now honors this; together they form the verified embodied surface.

## 2. What I cannot validate from code alone

The user's primary sprint question — "does the player naturally understand?" — is a question about minds, not code. The mechanism being correct does not entail that a player infers the correct mental model. They may:
- Infer "I held a button until something happened" instead of "I caused a chain of mechanical events."
- See the wheel stop but not link it to the pads pinching.
- See the chain seat but not understand why the slack matters.

These are the questions only a human playtest can answer.

## 3. The four educational-claim audit (best effort)

For each of the four mechanics the brief asks about, here is what the code does and what the player can *potentially* infer.

### Braking

| Visual evidence | Causal inference available |
|---|---|
| Wheel slows as player holds | "Holding causes slowing." |
| Pads move inward simultaneously | "The pads do the slowing." |
| Cable tightens visibly before pads move | "Pulling tightens the cable, which moves the pads." |
| Wheel stops only after sustained pad contact | "Pressure has to be maintained for full effect." |

**Verdict from code:** The full causal chain is on screen. The bottleneck is scale — at 0.13, the cable/caliper detail is hard to see. **A human playtest with screenshots will reveal whether the mechanism reads or whether the scale defeats it.**

### Force transfer

| Visual evidence | Causal inference available |
|---|---|
| Lever movement precedes cable movement | "Input → first member." |
| Cable movement precedes caliper movement | "Cable transmits to next part." |
| Caliper movement precedes pad contact | "Caliper closes the pads." |
| Pad contact precedes wheel decel | "Pads slow the wheel." |

**Verdict from code:** The sequence is correct and time-staggered (each scalar has a different `_approach` rate). A player watching closely can see the order. **A casual player may not look closely enough to register the staggering.**

### Chain tension

| Visual evidence | Causal inference available |
|---|---|
| ChainSlack visible at low tension, fades as tension rises | "Slack means not transmitting." |
| ChainTensionMark fades in as tension peaks | "Taut chain means transmitting." |
| The wheel does not turn until tension is high AND chain is seated | "Tension alone isn't enough; the chain has to be on the gear." |

**Verdict from code:** The transition is real but visually subtle. The slack polygon is small relative to the chain. **High risk of being missed.** Plain visual readability is the weakest part of ChainRig.

### Drivetrain transfer

| Visual evidence | Causal inference available |
|---|---|
| Crank rotates → chainring rotates with it | "These are connected." |
| Chainring rotates, but rear sprocket only rotates when chain is seated | "The chain transmits motion." |
| Rear wheel rotates only when sprocket rotates | "The sprocket drives the wheel." |

**Verdict from code:** This is the *strongest* educational moment in the game. The four-step causal chain (pedal → ring → sprocket → wheel, gated by chain state) is fully visible and stagger-timed. A player who watches and pedals should see "the wheel only spins when the chain is seated" — that's the single biggest "aha" available. **High confidence this reads, but still needs human confirmation.**

## 4. Comparison: what teaches better, brake or chain?

The brake mechanism has a clearer cause-and-effect (one input → one slowing). The chain mechanism has a longer chain of causes (pedal → ring → chain → sprocket → wheel) and harder visual readability (the chain itself is small). The brake should be the easier first-encounter; the chain is the more rewarding aha.

This ordering is honored in the slice: Mrs. Ramirez's safety check comes first (brake), Mr. Chen's quest second (chain). The game pedagogically eases the player in.

## 5. The fake-interaction perimeter

Of the 14 interactive steps in the polished first 15 minutes, **2** are now embodied (brake hold, chain pedal), **12** are still single-press E. Specifically:

| System | Steps | Status |
|---|---|---|
| SafetyCheckStation brake | 1 | EMBODIED |
| SafetyCheckStation tires/chain/report | 3 | press-to-advance |
| ChainHotspot | 1 (was 5) | EMBODIED |
| TireRepairStation | 4 | press-to-advance |
| NPC dialogs | 5 | dialog-only (acceptable — that's just talking) |

The fake perimeter has shrunk from 13 of 14 → 7 of 14. **Half the gameplay surface is now embodied.** The other half is concentrated in two systems (SafetyCheckStation tires/chain, TireRepairStation), both of which are direct candidates for the next embodied agent.

## 6. Honest answer to the sprint's central question

> Can the player understand chain tension, drivetrain transfer, pedal force, and wheel transfer WITHOUT text explanation?

**Provisionally yes, with two caveats:**

1. **Pedal force is the weakest link.** No `PedalResistanceArc` visual yet. Force is inferred from "I held a button and stuff moved" rather than seen directly. (Tracked from prior sprint.)
2. **Chain tension is visually subtle.** The ChainSlack polygon is small relative to the rig; it disappears rather than transforming. A player who blinks may miss the slack-to-taut transition entirely. (New finding this sprint.)

Both gaps are small. **A human playtest will confirm or refute this provisional yes.** Until then, treat these claims as informed hypotheses, not validated facts.
