# Reward Validation Stabilization Plan

Generated: 2026-05-16

## Scope

This is stabilization planning only. Do not redesign `QuestRegistry`, `RewardBridge`, `EventBus`, scenes, layouts, or assets for this phase.

## 1. Exact Failing Validations

Command run:

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://tests/vertical_slice_check.gd
```

Current failing assertions:

- `chain_repair emits reward_intent`
- `reward_intent includes quest id`
- `flat_tire_repair emits reward_intent`
- `flat_tire_repair reward includes badge feedback`

The same run reports:

- QuestRegistry loaded 18 missions.
- Quest validation: 0 errors, 0 warnings.
- Runtime validation: 0 errors, 1 warning.
- Audio mappings: 7/7.

## 2. Root-Cause Analysis

### Chain Repair

`vertical_slice_check.gd` starts `chain_repair`, records only `inspect_chain`, then expects a reward intent.

`chain_repair.json` requires these non-dialogue objectives before completion:

- `inspect_chain`
- `rotate_pedals`
- `align_chain`
- `seat_chain`
- `test_rotation`

`QuestRegistry.record_objective()` only emits reward intent when all non-dialogue objectives are complete. Therefore the test expectation is too early for the current tactile multi-step quest.

Classification: **test drift + sequencing problem**.

Not architectural: `QuestRegistry.complete_quest()` still calls `RewardBridge.emit_reward_intent(...)`, and `RewardBridge` still emits both `reward_intent` and `reward_feedback`.

### Flat Tire Repair

`vertical_slice_check.gd` records:

- `inspect_wheel`
- `remove_tube`
- `apply_patch`
- `inflate_tire`

`TireRepairStation.gd` uses those same ids.

`flat_tire_repair.json` currently defines:

- `find_puncture`
- `remove_tire`
- `patch_tube`
- `inflate_tire`

Because the first three objective ids do not match, `QuestRegistry._quest_objectives_complete()` never sees the quest as complete. No reward intent is emitted.

Classification: **implementation/data contract mismatch + test drift**.

Not architectural: the registry behavior is correct for the data it receives.

## 3. Issue Classification

| Issue | Type | Why |
| --- | --- | --- |
| Chain reward expected after one objective | Sequencing / test drift | Current quest is intentionally multi-step and tactile. |
| Flat tire objective ids mismatch | Implementation/data contract mismatch | Script/test use one objective vocabulary; mission JSON uses another. |
| RewardBridge missing payload | Not supported by evidence | RewardBridge emits payload when `complete_quest()` is reached. |
| QuestRegistry completion broken | Not supported by evidence | Completion logic is consistent; required objectives are not being satisfied. |
| Emotional-policy mismatch | Partial | Old validation expects immediate reward proof, while new direction favors tactile completion pacing. |

## 4. Recommended Minimal Fixes

Do these in the smallest possible stabilization pass, after approval:

1. Update validation sequencing for `chain_repair`.
   - Record all non-dialogue objectives before expecting `reward_intent`.
   - Keep assertion that `reward_intent.questId == "chain_repair"` after completion.

2. Align flat tire objective ids.
   - Preferred minimal path: choose one canonical objective vocabulary and make `flat_tire_repair.json`, `TireRepairStation.gd`, and `vertical_slice_check.gd` agree.
   - Because `TireRepairStation.gd` and the current test already agree, the smallest implementation change is likely updating mission JSON ids to match the interaction script.
   - Do not change QuestRegistry behavior to accept aliases; that would be architecture creep.

3. Keep RewardBridge unchanged.
   - Only inspect it if full objective completion still fails to emit reward payload.

4. Add no reward spectacle while stabilizing.
   - Validation should prove the intent exists, not make the reward louder.

## 5. Risks Of Overcorrecting

- Rewriting `QuestRegistry` could destabilize all mission completion.
- Adding objective aliases could hide data quality problems.
- Making RewardBridge emit partial-progress reward intents would violate tactile quest pacing.
- Adding bigger reward feedback to prove validation visually would increase stimulation.
- Updating tests to expect less than completion could make reward validation meaningless.

## 6. Merge Risks

- `QuestRegistry.gd` and `RewardBridge.gd` are protected systems; avoid edits unless evidence demands them.
- `flat_tire_repair.json` affects quest validation and player-facing tire flow.
- `TireRepairStation.gd` affects prototype-energy exposure; avoid expanding the tire flow during stabilization.
- `vertical_slice_check.gd` is the safest place to correct chain sequencing expectations.

## 7. Emotional Cohesion Risks

- Rewards can become too gamified if validation is interpreted as a request for louder feedback.
- Tire repair can draw attention to prototype energy if fixed by adding UI/reward polish instead of aligning data.
- Chain repair should remain tactile: seated chain and smooth spin first, reward payload second.
- Flat tire should remain secondary until its visual and tactile quality catches up.

## 8. Reward Flow Audit

| Flow | Primary Cue | Optional Secondary Cue | Excess / Duplicate Risk | Policy Action |
| --- | --- | --- | --- | --- |
| Mrs. Ramirez safety check | Safety bike/parts feel ready | Compact reward line or soft click | NPC praise plus reward popup plus audio can overstate a small habit | Keep tactile/check result primary; soften reward. |
| Mr. Chen chain repair | Chain/bike state becomes seated and smooth | Soft audio resolution | Glint, reward popup, dialogue praise, and audio can stack | Keep seated-chain physical state primary; move glint/praise later. |
| Garage repair completion | Smooth spin / quiet chain | Compact reward confirmation | Reward panel and reward chime both competing with object | Merge or soften UI/audio so object stays primary. |
| Return-to-neighborhood progression | World feels open/available | Brief HUD hint | Desert route reward can feel like gamified unlock ceremony | Keep understated; avoid fanfare. |

## 9. Prototype Energy Classification

| Source | Classification | Handling |
| --- | --- | --- |
| Reward validation failures | Harmful prototype energy | Stabilize before broader merges. |
| Chain test sequencing | Harmful validation drift | Correct test sequencing to match tactile multi-step quest. |
| Flat tire id mismatch | Harmful data contract mismatch | Align ids minimally. |
| TireRepairStation visual unevenness | Harmful if foregrounded; acceptable if peripheral | Soften/hide-for-now during first 15 minutes if possible. |
| Side-region reward tone | Acceptable temporary prototype energy | Keep low-priority; do not expand reward ceremony. |
| Reward UI/audio stack | Should-soften-for-now | Keep one primary cue plus one soft support cue. |

## 10. Stabilization Gate

Reward stabilization is ready for implementation only when the implementing lane agrees:

- No RewardBridge rewrite.
- No QuestRegistry rewrite.
- Chain test records all required objectives before expecting reward.
- Flat tire ids are aligned at the smallest contract boundary.
- Payoff cue policy remains intact.
- Validation proves reward intent without adding spectacle.
