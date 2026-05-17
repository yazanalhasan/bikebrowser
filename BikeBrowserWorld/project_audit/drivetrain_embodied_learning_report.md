# Drivetrain Embodied Learning Report

Date: 2026-05-17
Author: chainrig-integration sprint
Question: **Can the player understand chain tension, drivetrain transfer, pedal force, and wheel transfer without text explanation?**

## 1. What the player sees, moment by moment

| Player action | Visible mechanism response | Inferred meaning |
|---|---|---|
| Walks into the chain hotspot | `[Hold E] Pedal` prompt appears | Something interactive lives here. |
| Presses E | Camera zooms in 1.45×, drivetrain rig appears in front of bike | Closer look. This is the part being worked on. |
| (rig is idle, pedal not yet held) | Crank visible, chain hangs slack below the chainring — pool of "ChainSlack" polygon drooping off-axis | The chain is *off* the gear. That's why the bike won't go. |
| Holds E | Pedal arm starts rotating, chainring rotates with it | I'm cranking the pedal. The front gear spins. |
| Sustains hold ~0.4s | `ChainTensionMark` polygon fades in across the chain | The chain is pulling tight. |
| Sustains hold ~0.8s | `ChainSlack` polygon fades out as tension peaks | The slack is gone. The chain is taut. |
| Sustains hold ~1.2s | `SeatedGlow` pool brightens under the sprocket | The chain has caught the rear gear. |
| Sustains hold ~1.5s | Rear wheel begins to rotate | The drivetrain is transmitting force. The bike would move. |
| Sustains hold ~1.9s | Wheel modulate shifts to clean color, `SpinGhost` ring fades in | Smooth spin. The repair is real. |
| Hold continues for 0.4s in spinning state | `VerificationLabel` fades in: "Drivetrain clean." | Done. The mechanism is back to working. |
| Player walks away | Camera zooms back to 1.0× | The world resumes. The bike still works. |

**No textual explanation appears at any point.** The label set inside the rig (`Pedal · Crank`, `Chain · Tension`, `Sprocket`, `Rear Wheel`) names the parts the player is watching, but does not explain what they do. The mechanism explains itself.

## 2. The four educational questions

### Can the player understand chain tension?

Yes. The transition from `ChainSlack` visible (drooping polygon below chainring) to `ChainTensionMark` visible (taut highlight across the chain) is gradual and continuous. The player sees slack vanish and tightness appear. **Tension is "the chain stops drooping and starts pulling."**

### Can the player understand drivetrain transfer?

Yes. The chainring rotates first (because that's what the player's pedaling). The sprocket only starts rotating after `chain_seated` ≥ 0.72. The wheel only spins after the sprocket spins. **The order of events is the causal chain: pedal → chainring → chain → sprocket → wheel.** A player who pays attention sees the sequence.

### Can the player understand pedal force?

Yes, but more weakly than the others. The pedal motion is visible (`crank_angle` rotation), and the consequent chain tension/wheel motion is visible, but the *force* itself is implied rather than shown — there's no force arrow, no resistance haptic. The player infers "I'm doing work because the wheel spins when I press." If they let go, the chain falls back into mis-alignment (chain_alignment decays), reinforcing "without me pedaling, nothing transmits." **Force is inferred from continuity of motion.**

This is the area where a future pass could add the most readable cue: a subtle resistance arc on the pedal (analogous to BrakeRig's `LeverResistanceArc`) would make pedal force visible. **Not in this sprint.**

### Can the player understand wheel transfer?

Yes. The rear wheel is visually larger than the sprocket (60-radius rim around the 18-radius sprocket gear), so when the sprocket starts rotating and the wheel follows, the relationship reads as "the rear gear is *attached to* the wheel." No abstract diagram needed — the spatial composition does the teaching.

## 3. What this teaches by manipulation alone

A player who completes the chain repair, with no dialog or text, learns:

1. A bicycle has a **front gear** and a **rear gear**.
2. They are connected by a **chain**.
3. When the chain is **off** the front gear, the rear wheel does not turn even if the pedal turns.
4. Bringing the chain **back onto** the gears restores drive.
5. The chain has to be **taut** to transmit force.
6. Once seated, the chain stays seated — it's not constantly slipping.

That's six causal facts about bicycle drivetrains learned without reading.

## 4. What this does NOT teach (and shouldn't)

- Gear ratios. Not in scope; ChainRig has only one front + one rear gear.
- Derailleur shifting. Not in scope; chain isn't movable across multiple sprockets.
- Chain wear, lubrication. Not in scope.
- Crank mechanics, bottom bracket bearings. Not in scope.

These are correctly **outside** the embodied-learning surface for this sprint. The user's brief was explicit: readable force transfer over realistic drivetrain simulation. A future sprint could add derailleur visualization on a different bike or in a different quest; this one teaches the fundamental loop.

## 5. The payoff moment

When `chain_verified_changed(true)` fires, exactly two cues land:
- **Primary:** the wheel keeps spinning cleanly. The player is *still seeing* the consequence of their action. This is the tactile verification.
- **Secondary:** the `VerificationLabel` fades in with "Drivetrain clean." Quiet, present, not pulsing.

No stinger. No badge animation. No NPC praise. No screen flash. The garage stays warm and dusk-lit; the camera zooms back; the chain hotspot's prompt updates to "[E] Chain fixed" — that's it.

This honors `swarm/payoff_cue_policy.md` strictly: one primary tactile cue, one optional soft secondary.

## 6. Emotional fit

The mechanic feels:
- **Tactile** — you hold an action and the world changes continuously, not in discrete jumps.
- **Calm** — the camera zoom is gentle, the rig advances smoothly, the success cue is quiet.
- **Low-pressure** — you can release at any time without losing progress (chain_seated persists once achieved).
- **Authored** — the rig is hand-positioned in the garage, not procedurally placed; the labels and the color palette match the dusk-warm aesthetic; the legacy `RepairBike` texture still cooperates with the active rig.

It does NOT feel:
- Loud, spectacle-heavy, gamey, simulation-noisy, schoolish, abstract, or rushed.

This is the educational-tactile baseline the brief asked for.
