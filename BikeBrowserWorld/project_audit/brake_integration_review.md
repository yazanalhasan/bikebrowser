# Brake Integration Review — Phase 3

Date: 2026-05-17
Author: systems-engineer pass
Status: **already integrated and physically correct**

## 1. Verdict

The brake mechanic is **the one true embodied loop currently in the project** and the integration into `SafetyCheckStation` is complete and physically intuitive. No edits this phase. This document closes the question.

## 2. Code-level confirmation

### Pads move inward (correct mechanism direction)

`Prototypes/EmbodiedMechanics/BrakeRig.gd:182-185`:

```gdscript
pad_left.position.x = +caliper_closure * 15.0 + pad_contact * 1.5
pad_right.position.x = -caliper_closure * 15.0 - pad_contact * 1.5
```

`PadLeft` sits at world ≈ (124, 2), `PadRight` at world ≈ (196, 2), rotor centered at (160, 58). `PadLeft` moves +X (toward rotor), `PadRight` moves −X (toward rotor). The handoff brief flagged "pads must move inward, not outward" — that requirement is satisfied. Visually, the player sees the calipers clamp inward as the lever is held.

### Brake step gated on verified state (not on key press)

`Systems/Interactions/SafetyCheckStation.gd:134-143`:

```gdscript
func _on_brake_verified_changed(verified: bool) -> void:
	if not verified or brake_check_verified or step_index != 0:
		return
	brake_check_verified = true
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	QuestRegistry.record_objective(quest_id, "check_brakes")
	EventBus.interaction_feedback.emit("Looks good.", "quiet")
	step_index = 1
	_update_visuals()
```

`record_objective("check_brakes")` only fires after `BrakeRig.brake_verified_changed(true)`. The signal in turn only fires after the rig has been in `STATE_STOPPED` for ≥ 0.4 s (`BrakeRig.gd:_set_verified`), which itself only resolves after the wheel-spin scalar decays past threshold under sustained `caliper_closure` and `pad_contact`. **The chain "press → hydraulic build → pad contact → friction → wheel stop → verified" is fully causal.** A player who taps E does nothing useful.

### Payoff restraint (single soft cue)

The only completion cue at the brake step is the line `"Looks good."` at `"quiet"` tone (`SafetyCheckStation.gd:141`). No stinger, no glint, no panel. The primary "payoff" is the player's own observation that the wheel stopped. This matches `swarm/payoff_cue_policy.md` exactly. Do not add cues here.

## 3. Mechanical metaphor honesty

The rig is named for hydraulic discs (Caliper, Rotor) but its underlying drive is cable tension (`BrakeCable` element, `cable_tension` scalar). For the prototype this is fine — the visible chain of cause is still readable as "force travels through a tensioning member to a clamping pair," which is the educational core. If/when the project ships a separate rim-brake or hydraulic-disc variant for a different bike type, the rig should be split or parameterized rather than relabeled.

This is a **future refactor concern**, not a current bug. Tracked.

## 4. What was NOT changed

- No reward spectacle added.
- No extra sound on completion.
- No "great job!" dialog line.
- No camera zoom or particle effect.

The "Looks good." line is the entire payoff. The wheel stopping is the primary cue. The player did the physical verification; the world quietly agrees.

## 5. Mechanic-eye camera (deferred)

The handoff brief asked whether the BrakeRig should be presented in a close-up mechanic-eye view. It currently isn't — it's embedded at scale 0.13 inside the SafetyCheckStation. This is **acceptable for the first slice** because the rig already reads clearly at that size and adding a camera zoom would introduce scene management complexity. When the ChainRig lands (Phase 5), both rigs should be reviewed together for whether a shared `<InspectionFrame>` overlay is worth building. Until then, leave as-is.

## 6. Risks

- The rig will become a template for ChainRig, TireRig, etc. The `STATE_X → STATE_Y → VERIFIED` shape is generalizable, but the visible scalar set (lever_pull → cable_tension → caliper_closure → pad_contact → friction_load) is brake-specific. ChainRig will need its own scalar names; resist the urge to abstract a base class before there are two concrete rigs.
- Headless tests do not exercise the visual decay of `wheel_spin` (no rendering). The brake_rig_state_check validates the state machine logic, not the visible motion. Manual playtest is still the gold standard for the rig.

## 7. Conclusion

Phase 3 closes without code changes. The brake is the canonical embodied template; Phase 5 (ChainRig) clones it.
