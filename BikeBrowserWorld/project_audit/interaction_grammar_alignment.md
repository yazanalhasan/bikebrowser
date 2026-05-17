# Interaction Grammar Alignment — BrakeRig vs ChainRig

Date: 2026-05-17
Author: chainrig-integration sprint
Purpose: establish that BrakeRig and ChainRig share enough surface to constitute a **reusable embodied-mechanic grammar**, not two unrelated prototypes.

## 1. The seven grammar criteria

| # | Criterion | BrakeRig | ChainRig | Aligned? |
|---|---|---|---|---|
| 1 | **Visible force transfer** | Lever pull → cable tension → caliper closure → pad contact → friction → wheel decel | Pedal turn → chainring rotation → chain tension → chain seat → sprocket rotation → wheel spin | YES |
| 2 | **Tactile manipulation** | `is_action_pressed("ui_accept")` → `set_brake_pressed(true)`; release → `set_brake_pressed(false)`; both polled continuously | `is_action_pressed("ui_accept")` → `set_pedal_pressed(true)`; release → `set_pedal_pressed(false)`; both polled continuously | YES (identical input contract) |
| 3 | **Mechanic-eye readability** | Embedded at scale 0.13 inside SafetyCheckStation; no camera move | Embedded at scale 1.0 inside ChainHotspot with camera zoom 1.0→1.45 on engagement | DIFFERENT — ChainRig adds a zoom step. (Acceptable: it's the harder mechanism, deserves the close look.) |
| 4 | **Physical verification** | `wheel_spin → 0` while pads contact rotor → STATE_STOPPED → 0.4s sustain → `brake_verified_changed(true)` | `drivetrain_engagement` lifts `wheel_spin` while chain seated → STATE_SPINNING → 0.4s sustain → `chain_verified_changed(true)` | YES (mirror-image polarity: brake removes spin, pedal adds spin) |
| 5 | **Calm pacing** | ~2s hold from idle to verified | ~2s hold from slipped to verified | YES |
| 6 | **Restrained payoff** | Single quiet line "Looks good." + observed wheel stop. No stinger, no panel | Single quiet label "Drivetrain clean." + observed wheel spin. No stinger, no panel | YES |
| 7 | **Emotional warmth** | Dusk palette, soft polygon shapes, no harsh edges | Dusk palette, soft polygon shapes, no harsh edges | YES |

**Six of seven exact alignment; one intentional, justified divergence.**

## 2. State-machine structural correspondence

Both rigs use the pattern: `STATE_IDLE_OR_SLIPPED → STATE_ACTION_BEGAN → STATE_FORCE_VISIBLE → STATE_CLOSING_OR_ALIGNING → STATE_ENGAGED → [STATE_TRANSMITTING] → STATE_VERIFIED`.

```
BrakeRig:  IDLE  → LEVER → CABLE   → CALIPER → STOPPED   →                    → VERIFIED
ChainRig:  SLIPPED→ PEDAL → TENSION → GUIDED  → SEATED    → SPINNING           → VERIFIED
```

ChainRig inserts the extra `SPINNING` state between SEATED and VERIFIED because the chain mechanism has a meaningful distinction between "chain on sprocket" and "drivetrain actually transmitting force to wheel." The brake mechanism doesn't have that distinction — pads contacting the rotor and the wheel slowing are the same physical event.

This is an *honest* grammar difference: the mechanics differ in one place, the state machines reflect it. If we forced perfect symmetry the chain would lie about what's happening.

## 3. Shared scalar idiom

Both rigs use the same five-scalar architecture:

```
input_force → coupling_member → engaging_member → contact → result_field
```

| BrakeRig | ChainRig | Role |
|---|---|---|
| `lever_pull` | `pedal_rotation` | input the player drives directly |
| `cable_tension` | `chain_tension` | the slack-removing coupling |
| `caliper_closure` | `chain_alignment` | the closing/aligning gesture |
| `pad_contact` | `chain_seated` | the engagement moment |
| `friction_load` (decelerates wheel) | `drivetrain_engagement` (accelerates wheel) | the transmitted result |

A future rig (TireRig, DerailleurRig, ForkSagRig) should follow this same shape. The shape itself is the grammar.

## 4. Shared signal contract

```
BrakeRig:
  signal brake_soft_feedback(kind: String)
  signal brake_verified_changed(verified: bool)

ChainRig:
  signal chain_soft_feedback(kind: String)
  signal chain_verified_changed(verified: bool)
```

The host (SafetyCheckStation, ChainHotspot) listens for `*_verified_changed(true)` to gate quest progression and `*_soft_feedback(kind)` for optional audio hooks.

## 5. Shared host integration pattern

```
host:
  - has @onready var rig
  - has bike_visual (hidden until first engagement)
  - on player_in_range + ui_accept press: enter "engaged" mode (show rig, start quest, zoom camera, set rig pressed)
  - on ui_accept release: rig pressed = false (rig decays scalars)
  - on body_exited: rig pressed = false, camera restore
  - on rig.verified_changed(true): mark quest objective done, leave rig visible
```

Both `SafetyCheckStation.gd` (brake host) and `ChainHotspot.gd` (chain host) follow this exact pattern after the integration sprint. A third rig + host would follow it with no surprises.

## 6. The one missing grammar element

`BrakeRig` has a `LeverResistanceArc` visual that pulses when the lever is being held — a "your finger is doing work" cue. ChainRig has no equivalent on the pedal. The player experiences chain tension and chain seating, but the *effort of pedaling itself* is implied rather than shown.

**This is the one thing that would tighten the grammar.** A future iteration should add a `PedalResistanceArc` polygon on the crank that fades in proportional to `chain_tension`. ~10 LOC and one tscn node. **Tracked for next sprint.**

## 7. What the grammar enables

With these two rigs in place, the project now has:
- A canonical pattern for building embodied mechanics.
- A canonical host pattern for integrating them into quests.
- A canonical test pattern (state-machine check + host-integration check).
- A canonical payoff discipline (one primary tactile cue, one optional soft secondary).

Future agents adding mechanics — TireRig, DerailleurRig, ForkSagRig — should clone the existing pattern, not invent variations. The first rule of writing the third one is: read these two and don't innovate on grammar.

## 8. Recommendation

**The grammar is established.** This is an architectural milestone: BikeBrowserWorld now has a teachable shape for "embodied mechanic," not just one prototype.

The next embodied mechanic (likely TireRig for `flat_tire_repair`) should be commissioned with these grammar criteria as the acceptance test — not "does it work" but "does it match the grammar."
