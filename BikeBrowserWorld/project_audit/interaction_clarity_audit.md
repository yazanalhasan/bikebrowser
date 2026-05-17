# Interaction Clarity Audit

Date: 2026-05-17
Author: experiential-playtest-validation sprint

Code-level readability audit of every interactive element in the first 15 minutes. For each, I name: what the player sees, what's clear, what's likely confusing, and a minimum-effort fix.

## 1. Prompts (text the player reads)

| Location | Current text | Read |
|---|---|---|
| SafetyCheckStation, brake step | `[Hold E] Squeeze Brakes` | ✓ Tells them this one is a hold. |
| SafetyCheckStation, tires/chain/report | `[E] Press Tire`, `[E] Turn Pedal`, `[E] Tell Mrs. Ramirez` | ✓ Clear, but ✗ jarring after a hold-based brake. Player has just learned "hold to interact"; now they press once. |
| GarageEntrance | `[E] Garage` (after Phase 2 prompt rewrite) | ✓ Direct. |
| ChainHotspot | `[Hold E] Pedal` | ✓ Consistent with brake; primes the player for holding. |
| Mr. Chen / Mrs. Ramirez NPCs | No persistent prompt — proximity triggers dialog | ✓ Quiet. |

**Worst inconsistency:** brake is `[Hold E] Squeeze Brakes` but tires/chain are `[E] Press Tire / Turn Pedal`. The grammar suggests embodied for all three; only the first is.

## 2. BrakeRig (SafetyCheckStation)

**What works:**
- Pads correctly move inward toward rotor (verified in `brake_integration_review.md`).
- Cable tension visible via modulate change.
- Wheel slows as friction_load rises — the primary tactile payoff.
- `LeverResistanceArc` fades in as you hold — the "your finger is doing work" cue ChainRig lacks.

**What is likely confusing:**
- **Scale 0.13.** The brake rig is embedded inside the SafetyCheckStation at this scale. At 1280×720 viewport, the entire rig occupies maybe ~50×50 pixels. The pads moving inward by ±16 px (`caliper_closure * 15.0`) at scale 0.13 = ~2 px on screen. **A player can probably see the wheel decel but not the pad mechanism.**
- **No camera zoom.** Unlike ChainRig (which zooms 1.0 → 1.45 on engage), BrakeRig stays at default. The grammar says "mechanic-eye perspective"; the brake doesn't deliver it. This is the single biggest readability inconsistency.
- The `verification_label` line is on the rig but the rig is tiny. The "Looks good." feedback comes through `EventBus.interaction_feedback.emit`, which is good (HUD picks it up), but the on-rig label adds noise that can't be read at scale.

**Minimum fix:** Either bump SafetyCheckStation.BrakeRig scale from 0.13 to ~0.3, OR add a camera zoom on engage analogous to ChainHotspot. The latter is the grammar-consistent move. **Tracked, not in this sprint.**

## 3. ChainRig (ChainHotspot)

**What works:**
- Camera zoom 1.0 → 1.45 on engage delivers mechanic-eye. The rig is rendered at full scale, ~400×250 px area.
- Crank rotates visibly as you pedal. Chainring teeth rotate with it.
- Rear wheel begins rotating only when chain is seated. Strong causal link.
- `[Hold E] Pedal` prompt sets correct expectation.
- "Drivetrain clean." label is restrained and quiet.

**What is likely confusing:**
- **Chain slack→taut transition is subtle.** `ChainSlack` is a single drooping polygon under the chainring; on engagement it just fades out (`visible = chain_tension < 0.88`). A player who blinks may miss it. Better: an animated tween where slack visibly "pulls up" into the chain.
- **No `PedalResistanceArc`.** Pedaling effort is implied. Player infers from "wheel spins after I hold." Adding a small arc analogous to BrakeRig's `LeverResistanceArc` would tighten the grammar (see `interaction_grammar_alignment.md` §6).
- **Chain top/bottom segments don't change shape.** They're static polygons regardless of state. The visible difference between slipped and seated is the slack/glow toggle, not the chain line itself.
- **The labels (Pedal · Crank, Chain · Tension, Sprocket, Rear Wheel) fade on/off based on state.** Players who don't catch the fade may not know which polygon is which part. The labels are quiet enough not to be annoying but may not register as informative either.
- **Static `LooseChainProp` and `RepairBike` sprites underneath.** The bike sprite texture-swaps SLIPPED → ALIGNING → SEATED in lockstep with rig state. This is *correct* (the static prop agrees with the active rig) but if z-ordering ever drifts, the player would see two contradictory chains.

**Minimum fix:** Animate `ChainSlack`'s `position.y` upward as `chain_tension` rises (instead of just fading), so the slack visibly *retracts into* the chain. Add `PedalResistanceArc`. Both ~15 LOC.

## 4. Mechanic-eye camera framing

| Mechanism | Has camera zoom? | Effective rig size on screen |
|---|---|---|
| BrakeRig | No | ~50×50 px (scale 0.13 of native) |
| ChainRig | Yes (1.0→1.45) | ~580×360 px (zoomed) |

**Verdict:** ChainRig delivers mechanic-eye. BrakeRig does not. The grammar implies both should. Top priority readability fix.

## 5. Visible-causality audit

What does each rig deliver at each second of engagement? Estimated, based on `_resolve_state` thresholds.

### BrakeRig timeline (rough, assuming default `_approach` rates)

| t (s) | Visible | Inferred |
|---|---|---|
| 0.0 | Lever held; subtle rotate (~10°) | Pressed something. |
| 0.3 | Cable modulate brightens; cable_pull_arrow visible | Something is being pulled. |
| 0.6 | Calipers rotate inward (±20°); CaliperLabel becomes visible | Calipers are closing. |
| 1.0 | Pads contact rotor; ContactPinch visible | Pads are touching. |
| 1.4 | FrictionBand visible; wheel modulate shifts | Friction is happening. |
| 1.6 | Wheel rotation slows visibly | Wheel is being stopped. |
| 2.0 | Wheel stopped; SpinGhost fades | Done. |
| 2.4 | "Looks good." feedback line | Validated. |

### ChainRig timeline (analogous)

| t (s) | Visible | Inferred |
|---|---|---|
| 0.0 | Pedal arm visible at rest | I'm at the chain. |
| 0.1 | Pedal/crank rotating; chainring rotating | Cranking. |
| 0.4 | ChainTensionMark fades in | Tension is rising. |
| 0.6 | ChainSlack fades out | Slack is gone. |
| 0.9 | SeatedGlow fades in under sprocket | The chain is on. |
| 1.2 | Sprocket starts rotating | Drive engaged. |
| 1.5 | Rear wheel starts rotating | The bike would roll. |
| 1.8 | Wheel rotation peaks; SpinGhost fades in | Strong drive. |
| 2.0 | Wheel maintained at peak | Verified threshold met. |
| 2.4 | "Drivetrain clean." label visible | Validated. |

Both are ~2 seconds of visible causality. Both have ~8 distinct visible state changes. **In terms of richness of visible cause-and-effect, they are equivalent.** The difference is whether the player CAN see those changes at the rendered scale.

## 6. Confusing motions / fake-feeling moments

Reviewed both rigs and surrounding interactions for moments that might read as "fake" or "abstract" rather than physical:

| Element | Verdict |
|---|---|
| BrakeRig cable_pull_arrow at position.x = `-92.0 + cable_tension * 18.0` | Reads as a small arrow that nudges 18 px as tension builds. **Subtle but honest.** |
| BrakeRig friction_band rotation = `-wheel_angle * 0.18 + sin(hold_time * 28.0) * friction_load * 0.012` | The sin wobble at 28Hz with tiny amplitude = a barely visible jitter. Reads as friction granularity. **OK.** |
| ChainRig SeatedGlow visible at chain_seated > 0.50 with `scale = Vector2.ONE * (0.88 + chain_seated * 0.16)` | A glow that grows from 0.88 to 1.04 scale = ~18% size change. Subtle but present. **OK.** |
| ChainRig wheel rotation when not seated | wheel_spin only rises when drivetrain_engagement > 0.05, which requires chain_seated. So wheel correctly does NOT rotate when chain is slipped. **Strongest single causal link in the game.** |
| RepairBike texture swap on chain_repair progress | The static sprite swaps SLIPPED → ALIGNING → SEATED in lockstep with rig state. Reads as bike condition tracking. **Mildly redundant with the active rig but supportive.** |

No moments read as fake-feeling on code review. **Live human playtest will confirm or refute.**

## 7. Interaction pacing

| Interaction | Hold duration to verify | Pacing read |
|---|---|---|
| BrakeRig | ~2.0–2.4s | Calm, deliberate. Matches braking-as-care-for-your-bike metaphor. |
| ChainRig | ~2.0–2.4s | Same. Matches pedaling-restores-the-drive metaphor. |
| Press-to-advance steps | Instant | Jarring contrast after embodied steps. |

The two embodied mechanics have aligned pacing. The press-to-advance steps disrupt the rhythm.

## 8. Top three readability fixes (ordered by impact)

1. **BrakeRig mechanic-eye camera zoom** (or scale bump). Highest leverage. Makes the brake mechanism visually first-class.
2. **ChainRig PedalResistanceArc + animated slack retraction.** Two ~15-LOC additions that close the grammar gap and the chain-readability gap.
3. **TireRepairStation → TireRig.** Eliminates the largest remaining fake-interaction block. Same agent/template as chain.

Estimated total scope: ~3 weeks of focused work to close. None of it requires architectural change.

## 9. What the audit cannot determine

- Whether players who DO see the staggered scalars register them as causation, or as "stuff happening."
- Whether players articulate the mechanism correctly, or guess.
- Whether the camera zoom on ChainRig feels inviting or claustrophobic.
- Whether labels are read at all.

These require a real session. See `experiential_playtest_report.md` for the protocol.
