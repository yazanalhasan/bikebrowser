# Next Embodied Mechanic Recommendations

Date: 2026-05-17
Author: experiential-playtest-validation sprint
Purpose: name the next mechanic, justify the pick, sketch the grammar, set scope discipline.

## 1. The recommendation

**TireRig.** Replaces `TireRepairStation`'s 4-press loop with embodied tire repair: inspect → ease tube out → press patch on → pump to inflate.

## 2. Why TireRig now (not something else)

Three candidates were on the table:

| Candidate | Pros | Cons |
|---|---|---|
| **TireRig** (flat_tire_repair) | Eliminates the largest remaining fake-interaction block in the slice. Quest is already authored and reachable. Bike-domain consistent. Same grammar fits naturally (hold-to-pump is BrakeRig/ChainRig's hold pattern). | Adds a third rig — risk of feature creep. |
| **PedalResistanceArc** on existing ChainRig | Closes a real grammar gap. Tiny scope (~15 LOC + 1 tscn node). | Doesn't add new embodied surface; polish, not breadth. |
| **BrakeRig mechanic-eye camera** | Closes the biggest grammar inconsistency (brake doesn't deliver mechanic-eye). | Polishes a working system instead of converting a hollow one. |

**TireRig is the right pick because** it converts the biggest remaining hollow loop into the same grammar. After it lands, the slice is **3 of 4 stations embodied** (brake, chain, tire — only safety-check tires/chain remaining), which is the threshold where the embodied-learning identity feels durable rather than provisional.

The two polish items (PedalResistanceArc, BrakeRig camera) should come as **a separate sprint, before TireRig**. They tighten the grammar; TireRig assumes the grammar is tight. Doing the polish first means TireRig is the third instance of a stabilized pattern, not the third draft of an evolving one.

**Recommended sprint sequence:**
- **Sprint N+1:** Grammar tightening — PedalResistanceArc + BrakeRig camera zoom + ChainSlack animation. ~50 LOC + ~2 tscn nodes. Closes all known readability gaps in the existing two rigs.
- **Sprint N+2:** TireRig prototype + integration into TireRepairStation. Mirrors the brake/chain sprint pattern.

## 3. The TireRig grammar contract

Following `interaction_grammar_alignment.md`, the new rig must align on 6 of 7 criteria with one justified divergence allowed.

### State machine (proposed)

```
STATE_FLAT       — tire pressure 0, wheel sags, tube exposed
STATE_INSPECTED  — player has run the visual check (first engage)
STATE_TUBE_OUT   — inner tube partially extracted from rim (visible)
STATE_PATCHED    — patch placed and pressed onto puncture (held)
STATE_REINSERTED — tube tucked back into tire (continued press)
STATE_PUMPED     — pressure rising during inflation hold
STATE_FIRM       — pressure at target (visual: tire rounds out)
STATE_VERIFIED   — sustained 0.4s at firm → emit verified signal
```

This is one state longer than ChainRig because tire repair has more distinct physical sub-steps. **Justified divergence.**

### Scalar architecture

| Role | Scalar | Visible effect |
|---|---|---|
| input | `hand_pressure` | hand visible pressing on patch / pumping |
| coupling | `patch_adhesion` | patch color fills in as it bonds |
| engaging | `tube_seat` | tube position in tire animates upward |
| contact | `tire_seal` | wall-to-wall contact area glows |
| result | `tire_pressure` | tire shape rounds from sagging → firm |

Same five-scalar architecture as BrakeRig/ChainRig. **Grammar honored.**

### Signal contract

```gdscript
signal tire_soft_feedback(kind: String)
signal tire_verified_changed(verified: bool)
```

Identical naming pattern. Host (TireRepairStation) gates `flat_tire_repair` step completion on `tire_verified_changed(true)`.

### Visual node checklist (analogous to ChainRigEmbedded.tscn)

```
TireRig (Node2D, script)
├── Wheel (Node2D)
│   ├── WheelRim (Polygon2D)
│   └── WheelHub (Polygon2D)
├── Tire (Polygon2D — deformable shape, vertices animate with tire_pressure)
├── InnerTube (Polygon2D — visible at low pressure, fades as patched + reinserted)
├── Patch (Polygon2D — fades in as patch_adhesion rises)
├── PumpHandle (Node2D — animates up-down during pump phase)
├── PumpHose (Polygon2D)
├── PressureGauge (Polygon2D — needle rotates with tire_pressure)
├── Labels (5: Tube, Patch, Tire, Pump, Pressure)
└── VerificationLabel ("Tire holds.")
```

## 4. Host integration pattern

`TireRepairStation.gd` should follow the same pattern as `SafetyCheckStation.gd` (brake host) and `ChainHotspot.gd` (chain host):

1. `@onready var tire_rig: Node = get_node_or_null("BikeVisual/TireRig")`.
2. On first engage: show rig, zoom camera, record `inspect_wheel`, set rig pressure pressed.
3. `_track_rig_state` polls `mechanical_state`, records:
   - STATE_TUBE_OUT → `remove_tube`
   - STATE_PATCHED → `apply_patch`
   - STATE_FIRM → `inflate_tire`
4. `tire_verified_changed(true)` completes quest naturally.
5. Camera restore on disengage or verified.

The 4 objective IDs from `flat_tire_repair.json` map 1:1 — no JSON changes needed.

## 5. Scope discipline (in order of importance)

1. **No tire pressure simulator.** The tire shape interpolates between two authored polygons (flat → firm). Real tire physics is out of scope.
2. **No actual pump physics.** The pump animation is a sine wave; pressure rises while held.
3. **No multiple tire sizes / variants.** One tire, one rig.
4. **No nested mini-states.** Each state is one held action; releasing decays state appropriately, identical to ChainRig discipline.
5. **No reward spectacle.** One soft "Tire holds." label. No stinger.

## 6. Risk forecast

- **Tire shape animation is harder than chain.** Deforming a Polygon2D's vertex set between two states requires either a Tween on polygon points (Godot supports this) or a script-driven interpolation. Test with a 4-point flat → 8-point round transition first.
- **PressureGauge needle is a new visual idiom.** First time the game shows a *measured quantity* visually. Decide whether to lean into it (the gauge is honest about pressure rising) or hide it (keep the gauge as background dressing, let the tire shape be the primary cue). Recommend background dressing — the tire shape is the primary cue per grammar.
- **TireRepairStation already has a 4-step ladder.** Same migration discipline as ChainHotspot: keep the objective IDs, change the trigger.

## 7. After TireRig — the third anchor

Once TireRig ships, the slice has three embodied mechanisms (brake, chain, tire) and three press-to-advance steps remaining (SafetyCheckStation tires/chain/report). At that point:

- The SafetyCheckStation tires/chain steps become unjustifiable as press-to-advance. They should either be: (a) folded into TireRig / ChainRig as quick inspection passes, or (b) removed from the quest as redundant.
- The "report_safety_check" step is a dialog beat ("Tell Mrs. Ramirez"). This is acceptable as dialog-only — it's a social verification, not a mechanical one.
- Side-region quests (mine cart repair, plant observation, etc.) can be commissioned as agents with the grammar as the acceptance test.

## 8. The grammar promise

After Sprint N+1 (polish) and Sprint N+2 (TireRig), the project will be able to make this claim:

> Every important mechanical action in BikeBrowserWorld teaches by being performed.

That's the educational identity stabilized. From that point, content expansion (more bikes, more regions, more quests) does not dilute the educational integrity, because every new mechanic gets vetted against the same grammar.

This recommendation is the work plan to get there.
