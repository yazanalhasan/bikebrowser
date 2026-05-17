# ChainRig Micro-Prototype — Phase 5

Date: 2026-05-17
Author: systems-engineer pass
Status: **state machine shipped + test passing; visual .tscn and integration are next sprint**

## 1. Why ChainRig now

Phase 4 (fake interaction loop audit) confirmed ChainRig as the right next embodied mechanic:

1. **Chain repair is the hero quest of the polished slice.** The currently-shipping flow is 5 E-presses that swap a texture. The most visible fake loop sits inside the most authored arc.
2. **Three authored chain textures already exist** (`SLIPPED`, `ALIGNING`, `SEATED` in `ChainHotspot.gd:5-7`). ChainRig replaces the press gate, not the artwork.
3. **BrakeRig's template maps directly.** Cloning once proves the embodied pattern is reusable beyond a single prototype — that's the architectural insurance the project needs.

Rejected alternatives: TireRig (improves a side beat, not the climactic one); BrakeRig polish (polishes a working system, doesn't convert a hollow one).

## 2. What shipped this sprint

- `Prototypes/EmbodiedMechanics/ChainRig.gd` — state machine clone of BrakeRig with chain-specific scalars and visual driver. ~200 LOC. All visual node references are optional so the script runs headless.
- `tests/chain_rig_state_check.gd` — headless test that drives the rig through `STATE_SLIPPED → STATE_PEDAL → STATE_TENSION → STATE_GUIDED → STATE_SEATED → STATE_SPINNING → STATE_VERIFIED`, asserts the verified signal emits exactly once, and confirms verified state sticks after the player releases. **Passes on first commit.**

## 3. What is intentionally NOT shipped this sprint

- **`ChainRigPrototype.tscn`** — the visual scene that wires up sprites for the crank, chainring, chain polyline, sprocket, rear wheel, plus the tension/seated/spin overlay elements. Scope-managed deferral.
- **Integration into `ChainHotspot.gd`** — swapping the 5-press loop for `chain_verified_changed(true)` gating. Should land alongside the visual .tscn so they ship as one player-visible change.
- **A standalone `ChainTestPrototype.tscn`** scene like the brake's. Useful for tuning but not required to validate the state machine.

These are deferred because the visual scene is substantial work (sprite authoring + node-path wiring) and should land as a single coherent player-facing change rather than a half-step.

## 4. State machine + scalar mapping (BrakeRig → ChainRig)

| BrakeRig | ChainRig | Educational meaning |
|---|---|---|
| `STATE_IDLE` | `STATE_SLIPPED` | Resting: chain hangs off chainring; no force transmission. |
| `STATE_LEVER` | `STATE_PEDAL` | Player action begins (squeezing / pedaling). |
| `STATE_CABLE` | `STATE_TENSION` | Force transmission member tightens (cable / chain). |
| `STATE_CALIPER` | `STATE_GUIDED` | Closing/aligning toward engagement. |
| `STATE_STOPPED` | `STATE_SEATED` | Engagement made (pads bite rotor / chain bites sprocket). |
| `STATE_VERIFIED` | `STATE_VERIFIED` | Sustained for verification window → emit signal. |

ChainRig adds one extra state — `STATE_SPINNING` — between SEATED and VERIFIED. Reason: a chain that's seated but slipping under load is a real failure mode in cycling; the SEATED → SPINNING transition makes the player see the seat actually transmit force to the rear wheel before the world verifies the repair. This is the only state-machine difference from BrakeRig and is justified by mechanism honesty.

Scalar mapping:

| BrakeRig | ChainRig | Direction |
|---|---|---|
| `lever_pull` | `pedal_rotation` | rises while action held, decays on release |
| `cable_tension` | `chain_tension` | follows pedal with `_readable_curve` threshold 0.18 |
| `caliper_closure` | `chain_alignment` | follows tension with threshold 0.40 |
| `pad_contact` | `chain_seated` | follows alignment with threshold 0.66; **stays seated after release if ≥ 0.82** |
| `friction_load` | `drivetrain_engagement` | follows seated with threshold 0.74 |
| `wheel_spin` (decreasing toward 0) | `wheel_spin` (increasing toward drivetrain_engagement) | inverted polarity vs brake |

The wheel-spin polarity inversion is the educational point: braking *removes* spin, pedaling *adds* spin. Both verifications come from observing the wheel.

One asymmetry deserves the comment in the code: once `chain_seated ≥ 0.82`, releasing the pedal does NOT unseat the chain. A working chain stays on the sprocket. This matches real bicycles and prevents the "you must hold E forever after success" failure mode.

## 5. Next sprint — visual .tscn checklist

A sketch for whoever picks this up (do NOT do this in the current sprint):

Scene shape (~scale 0.5 of an inspectable bike):

```
ChainRigPrototype (Node2D)
├── Crank (Node2D)
│   └── ChainringTeeth (Sprite2D or Polygon2D — radial)
├── Chain (Line2D — polyline from chainring around sprocket back to chainring)
├── ChainSlack (Polygon2D — visible when chain_tension < 0.88, fades out)
├── ChainTensionMark (Polygon2D — narrow band on the chain, fades in as tension rises)
├── Sprocket (Node2D)
│   └── SprocketTeeth (Sprite2D or Polygon2D — radial, smaller than chainring)
├── SeatedGlow (Polygon2D — soft pool under sprocket, fades in as chain_seated rises)
├── RearWheel (Node2D)
│   └── WheelRim, WheelSpokes
├── SpinGhost (CanvasItem — motion-blur ring on rear wheel)
├── PedalLabel, ChainLabel, SprocketLabel, WheelLabel (Labels with visibility tied to state)
└── VerificationLabel (Label — "Chain seated. Drivetrain clean." or similar)
```

Wire the node paths in the .tscn `[node]` instance properties so the existing `@export` paths resolve. No script edits needed for visual scene wiring.

**Hard discipline for the visual pass:**
- One primary payoff: the rear wheel spinning cleanly. That's the tactile verification.
- One optional soft secondary: the `VerificationLabel` showing a short quiet line. NO stinger, NO panel, NO NPC praise stacking on top.
- The chain should READ as wrapped around both teeth gears. A polyline with 4-6 control points is enough; do not author a 30-link spline.

## 6. Integration into ChainHotspot.gd (sketch)

When the visual .tscn is ready and `ChainHotspot.gd` is ready to be rewritten:

```gdscript
# Replace _on_player_interact's 5-press ladder with a single embedded ChainRig.
# Mirror SafetyCheckStation.gd:54-56:
@onready var chain_rig: Node = get_node_or_null("RepairBike/ChainRig")

func _ready() -> void:
    if chain_rig and chain_rig.has_signal("chain_verified_changed"):
        chain_rig.chain_verified_changed.connect(_on_chain_verified_changed)
    ...

func _on_chain_verified_changed(verified: bool) -> void:
    if not verified or chain_repair_recorded:
        return
    chain_repair_recorded = true
    QuestRegistry.record_objective("chain_repair", "seat_chain")
    EventBus.interaction_feedback.emit("Chain seated. The drivetrain runs clean.", "quiet")
```

The five existing texture-swap objective IDs in `chain_repair.json` should collapse to one. Or — gentler migration — keep the JSON shape and have `_on_chain_verified_changed` record them all in sequence, so existing save data and the vertical_slice_check.gd test continue to pass without changes.

Pick the migration discipline at integration time; both work.

## 7. Validation

- `chain_rig_state_check.gd` — PASS
- No existing test affected (ChainRig is currently unreferenced by any scene).
- RuntimeValidator unchanged.

## 8. Risks tracked, not addressed

- **ChainHotspot's existing `chain_repair.json` step IDs and the vertical_slice_check.gd walkthrough assume 5 sub-steps.** Any rewrite must preserve those objective IDs or update both files atomically.
- **The current `ChainHotspot.gd` is wired into `ZuzuGarage.tscn` as a specific NPC interaction context** (Zevon as observer). When the embodied rig drops in, Zevon's observe-and-react flow must still trigger off the verified signal, not the legacy 5th press.
- The rig is currently UNREFERENCED. If left unused it becomes dead code; the next sprint must either ship the .tscn + integration or remove the rig with a `git reset`.
