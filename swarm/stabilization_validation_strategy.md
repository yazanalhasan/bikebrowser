# Stabilization Validation Strategy

Generated: 2026-05-16

## Goal

Verify reward validation stabilizes without increasing emotional density, reward spectacle, or runtime architecture risk.

## 1. Minimal Validation Commands

Run from `C:\Users\yazan\bikebrowser`.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://tests/vertical_slice_check.gd
```

Expected after stabilization:

- `chain_repair emits reward_intent` passes.
- `reward_intent includes quest id` passes.
- `flat_tire_repair emits reward_intent` passes.
- `flat_tire_repair reward includes badge feedback` passes.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd
```

Expected:

- Runtime smoke passes.
- RuntimeValidator reports 0 errors.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
```

Expected:

- Scene loads.
- Runtime validation remains clean except known warnings.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Garage/ZuzuGarage.tscn --quit-after 2
```

Expected:

- Scene loads.
- Runtime validation remains clean except known warnings.

## 2. Smoke Test Sequence

1. Run vertical slice check first to verify the targeted failure.
2. Run runtime repair smoke to confirm canonical systems still load.
3. Run neighborhood scene load.
4. Run garage scene load.
5. Record results in `swarm/lane9-integration/validation.md` or the implementing lane's `validation.md`.

## 3. Required Reward-Flow Assertions

Validation should prove:

- `chain_repair` emits reward intent only after all required non-dialogue objectives complete.
- `chain_repair` reward payload includes `questId == "chain_repair"`.
- `flat_tire_repair` objective ids match between mission data, station behavior, and validation.
- `flat_tire_repair` emits reward intent after its full objective sequence.
- `flat_tire_repair` reward payload includes badge feedback: `Patch Hero`.

Validation should not require:

- Larger reward amounts.
- Extra stingers.
- Extra reward UI.
- Dialogue praise.
- Visual glints.
- New reward architecture.

## 4. Emotional Regression Checks

Manual or code-review checks:

- No new reward cue is added.
- No new audio cue is added.
- No reward panel behavior is expanded.
- No NPC praise is added.
- Chain repair remains tactile and multi-step.
- Tire repair remains stabilized but not foregrounded as a polished feature.
- Garage completion still follows `swarm/payoff_cue_policy.md`.

## 5. Success

Stabilization succeeds when:

- The vertical slice reward assertions pass.
- Runtime smoke still passes.
- Neighborhood and garage still load.
- No protected system was modified.
- Reward flow remains calm and tactile.
- The implementation diff is limited to validation sequencing and objective-id alignment.

## 6. Acceptable Warning

Acceptable if unchanged from prior audits:

- Native TTS unavailable warning.
- Godot headless ObjectDB/resource warning on shutdown.
- Existing non-reward warnings already documented in validation overview.

## 7. Dangerous Regression

Stop and return to root-cause analysis if any occur:

- `QuestRegistry` or `RewardBridge` modified without explicit integration approval.
- Reward emits before quest completion.
- Mission validation gains errors or warnings.
- Reward payload loses `questId`.
- Reward payload loses `badge` for flat tire.
- UI/audio/dialogue reward feedback becomes louder or more layered.
- Tire repair is expanded visually or mechanically during stabilization.

## 8. Merge Gate

The stabilization branch is merge-ready only if the lane report includes:

- Exact files changed.
- Which issue each file addresses.
- Proof no protected systems changed.
- Command outputs summarized.
- Confirmation that payoff cue policy was not weakened.
