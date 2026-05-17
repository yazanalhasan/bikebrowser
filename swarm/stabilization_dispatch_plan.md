# Stabilization Dispatch Plan

Generated: 2026-05-16

## Dispatch Goal

Stabilize reward validation with the smallest possible corrections, while preserving calm tactile reward identity. This is not a reward redesign sprint.

## Task Classification

| Issue | Classification | Evidence | Dispatch Decision |
| --- | --- | --- | --- |
| `chain_repair` reward expected after one objective | Validation drift + sequencing mismatch | Test records only `inspect_chain`; mission requires five non-dialogue repair objectives | Validation-only correction. |
| `flat_tire_repair` reward never emitted | Naming-contract mismatch | Test/station use `inspect_wheel`, `remove_tube`, `apply_patch`; mission uses `find_puncture`, `remove_tire`, `patch_tube` | Naming alignment at smallest boundary. |
| RewardBridge suspected failure | Not true gameplay instability | RewardBridge emits payload when QuestRegistry completes a quest | No change. Freeze. |
| QuestRegistry suspected failure | Not true gameplay instability | Completion logic is consistent with mission steps | No change. Freeze. |
| TireRepairStation visual unevenness | Acceptable temporary prototype energy if peripheral; harmful if foregrounded | Known weaker than garage chain repair | Do not polish during stabilization; hide/soften later if needed. |

## Dispatch Items

| Issue | Responsible Lane | Exact Files Likely Involved | Fix Type | Emotional Risk | Merge Risk | Expected Convergence Impact |
| --- | --- | --- | --- | --- | --- | --- |
| Chain reward validation sequencing | Lane 9 integration or a dedicated validation lane | `C:\Users\yazan\bikebrowser\BikeBrowserWorld\tests\vertical_slice_check.gd` | validation-only | Low if no reward presentation changes | Low-medium because test defines merge gate | Removes false prototype signal and confirms reward only after true tactile completion. |
| Flat tire objective-id mismatch | Dedicated stabilization lane, with integration review | `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Data\missions\flat_tire_repair.json`; possibly `C:\Users\yazan\bikebrowser\BikeBrowserWorld\tests\vertical_slice_check.gd`; avoid `TireRepairStation.gd` unless choosing the mission ids as canonical | naming alignment | Medium because tire repair can become more visible before it is polished | Medium because mission data affects quest completion | Restores reward validation without changing reward architecture. |
| Reward payload verification | Lane 9 validation oversight | `C:\Users\yazan\bikebrowser\BikeBrowserWorld\tests\vertical_slice_check.gd` | validation-only | Low | Low | Confirms RewardBridge works without louder feedback. |
| Payoff restraint check | Lane 9 integration | `swarm/payoff_cue_policy.md`; lane reports | validation governance | High if ignored | Medium | Prevents stabilization from becoming reward spectacle. |

## What Must Not Change

- Do not modify `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\RewardBridge\RewardBridge.gd`.
- Do not modify `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\QuestRegistry\QuestRegistry.gd`.
- Do not modify `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\EventBus\EventBus.gd`.
- Do not modify `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\RuntimeValidator\RuntimeValidator.gd` to hide failures.
- Do not modify scenes, layouts, or assets.
- Do not add reward sounds, glints, UI panels, dialogue praise, or completion delays.
- Do not introduce objective aliases or broad compatibility layers.
- Do not use this pass to improve TireRepairStation visuals.

## Minimal Fix Shape

### Chain Repair

- In `vertical_slice_check.gd`, record all required non-dialogue chain objectives before expecting reward intent:
  - `inspect_chain`
  - `rotate_pedals`
  - `align_chain`
  - `seat_chain`
  - `test_rotation`
- Keep existing assertions that reward intent exists and includes `questId == "chain_repair"`.
- Do not change quest data or runtime completion logic.

### Flat Tire Repair

- Pick one canonical objective vocabulary.
- Recommended smallest path: update `flat_tire_repair.json` to match the station script and existing validation:
  - `inspect_wheel`
  - `remove_tube`
  - `apply_patch`
  - `inflate_tire`
- Do not change the reward amount, badge, audio, UI, or scene presentation in this pass.
- If another lane has already standardized mission ids elsewhere, use that standard instead, but do not create aliases.

## Overcorrection Risks

- Partial objective rewards would make tactile repair sequencing less meaningful.
- RewardBridge rewrites could destabilize all reward flows.
- QuestRegistry changes could affect every mission.
- More reward feedback could make completion feel gamified rather than grounded.
- Fixing tire repair by polishing its UI/audio could expose its visual mismatch sooner.

## Garage Protection

Reward stabilization must not increase garage density. Chain completion should still read as:

1. Physical repair success.
2. Optional soft confirmation.
3. Compact reward payload validation in code.

The player should not receive a new stacked reward event as a side effect of validation cleanup.

## Dispatch Gate

The implementing lane may proceed only if it agrees this is the complete scope:

- One validation sequencing correction.
- One objective-id alignment.
- No architecture changes.
- No reward presentation changes.
- Run the validation strategy in `swarm/stabilization_validation_strategy.md`.
