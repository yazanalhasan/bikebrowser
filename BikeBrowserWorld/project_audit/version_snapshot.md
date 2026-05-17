# Version Snapshot — Embodied Mechanics Vertical Slice Baseline

Date: 2026-05-17
Author: source-control stabilization sprint
Purpose: the canonical record of what shipped as the first authored vertical-slice checkpoint.

## 1. Convergence state

Per `swarm/convergence_snapshot.md` baseline 7.2/10 (2026-05-16), advanced this sprint by:
- Establishing the systemic interaction-topology fix (Mr. Chen / GarageEntrance class of bugs).
- Integrating BrakeRig + ChainRig as the canonical embodied-learning grammar.
- Replacing the chain-repair fake loop with a true drivetrain interaction.
- Installing rig-specific playtest telemetry.
- Closing the side-region first-15-minute exposure risk.
- Refreshing Godot HTML5 export to match source.

Estimated current convergence: ~**7.8 / 10**. Limited by (a) BrakeRig mechanic-eye scale issue, (b) ChainSlack subtle transition, (c) deferred AudioService stinger-stacking guard, (d) the still-fake SafetyCheckStation tires/chain steps + TireRepairStation.

## 2. Embodied systems present

| System | Type | Status |
|---|---|---|
| `BrakeRig` | Embodied state machine | Verified physically correct (pads move inward); integrated into SafetyCheckStation; brake step gates on `brake_verified_changed(true)`. |
| `ChainRig` (state machine) | Embodied state machine | Implemented as BrakeRig clone with one justified state-machine divergence (extra STATE_SPINNING). |
| `ChainRigEmbedded.tscn` | Visual rig scene | Polygon-only geometry. Reusable. Wired into ZuzuGarage via `ChainHotspot/BikeVisual/ChainRig`. |
| `ChainHotspot.gd` | Embodied host | Rewrote from 5-press ladder to embodied gating. Records all 5 `chain_repair` objectives at meaningful state transitions. |
| `PlaytestRigTelemetry.gd` | Sidecar telemetry | Env-gated autoload (`BIKEBROWSER_PLAYTEST=1`). Observes any rig with `mechanical_state` + `*_verified_changed`. |

Press-to-advance loops remaining: `SafetyCheckStation` tires/chain/report (3), `TireRepairStation` (4), assorted side-region quests.

## 3. Current first-15-minute gameplay loop

1. Spawn at NeighborhoodStreet (0, 0).
2. Optional: meet Mrs. Ramirez (32-px circle, no longer greedy).
3. Approach SafetyCheckStation. **Hold E** for embodied brake check (pads pinch, wheel stops, "Looks good."). Press E for the three remaining placeholder steps (tires, chain, report).
4. `bike_safety_check` quest completes; reward emits.
5. Approach Mr. Chen. Dialog starts `chain_repair`.
6. Walk to GarageEntrance under **Zuzu's house** at x ≈ 35 (no longer Mr. Chen's workshop). Press E to enter.
7. Inside ZuzuGarage, approach ChainHotspot. **Hold E to pedal.** Camera zooms 1.45×. ChainRig appears. Watch the drivetrain reconnect over ~2s of sustained input. "Drivetrain clean."
8. Walk to garage exit. Return to NeighborhoodStreet at `from_garage` spawn (also moved to Zuzu's house).
9. `chain_repair` complete. Side-region exits (Mine, Desert, River) now unlock — but those regions are still skeletal.

Estimated playthrough: 10–15 minutes for a careful first-time player.

## 4. Validation passing on this snapshot

| Test | Status |
|---|---|
| RuntimeValidator (boot) | PASS — 0 errors, 1 warning (TTS unavailable, expected on headless) |
| `runtime_repair_smoke.gd` | PASS |
| `vertical_slice_check.gd` | PASS |
| `brake_rig_state_check.gd` | PASS |
| `chain_rig_state_check.gd` | PASS |
| `chain_hotspot_embodied_check.gd` | PASS |
| `interaction_overlap_check.gd` | PASS |
| `input_prompt_mapping_check.gd` | PASS |
| `transition_dialogue_guard_check.gd` | PASS |
| `dialogue_keyboard_advance_check.gd` | PASS |
| `garage_floor_layering_check.gd` | PASS |
| `voice_identity_profile_check.gd` | PASS |
| `voice_mix_balance_check.gd` | PASS |
| `garage_transition_check.gd` | **PRE-EXISTING FAIL** (handoff-flagged) |
| `npm run build` | PASS (~22.5s) |
| Godot HTML5 export | Fresh as of 2026-05-17T08:06:23Z, git_sha eb1560a |

12/13 Godot tests + frontend build + boot validator green.

## 5. Architectural inventory

Autoloads (`project.godot`, 13 total):
```
EventBus, SaveService, RegionRegistry, QuestRegistry, DiscoveryService,
InventoryManager, DialogueManager, CompanionBridge, RewardBridge,
AudioService, RuntimeValidator, ProjectIntegration, PlaytestRigTelemetry
```

Regions implemented (7 in `Data/regions/`): boot, neighborhood_street, garage, copper_mine (skeleton), desert_trail (skeleton), salt_river (skeleton), system_showcase (dev only).

Missions loaded: 18 across three schemas. Active in slice: 3 (bike_safety_check, chain_repair, flat_tire_repair). Other 15: orphan content or unreachable (5 bridge_* missions need a bridge region that doesn't exist).

Dialogue files: 25 across three schemas, all normalized by DialogueManager.

NPC scenes: 10. NPC profile data: 1 (mr_chen.json — others rely on inline scene properties + `voice_profiles.json`).

## 6. Known risks tracked but not addressed this sprint

In rough priority order:

| # | Risk | Source |
|---|---|---|
| R1 | BrakeRig is too small to read at scale 0.13 inside SafetyCheckStation; no mechanic-eye camera zoom unlike ChainRig. | `interaction_clarity_audit.md` |
| R2 | ChainRig is missing `PedalResistanceArc` — pedal force is inferred from continuity, not shown. | `interaction_grammar_alignment.md` §6 |
| R3 | Garage stacks 7+ cues at chain_repair completion against `payoff_cue_policy.md`. 5-LOC fix documented, deferred (AudioService boundary). | `garage_payoff_reduction_check.md` |
| R4 | SafetyCheckStation tires/chain/report + TireRepairStation are still press-to-advance. Next embodied targets. | `fake_interaction_loop_audit_updated.md` |
| R5 | Side regions accessible after `chain_repair` completion but are skeletal (16 nodes each vs 217 in Neighborhood). | `side_region_containment.md` |
| R6 | `garage_transition_check.gd` fails on a pre-existing physics-frame timing issue. | (handoff flagged) |
| R7 | `version.json` has a UTF-8 BOM from PowerShell 5.1 `Set-Content`. JSON consumers may stumble. | `systems_engineer_handoff.md` §6 R5 |
| R8 | `first_safety_check.json` is orphan content (2 of 3 steps have no recorder). | `data_contract_audit.md` |
| R9 | RuntimeValidator doesn't check 4 of 13 autoloads (DiscoveryService, InventoryManager, CompanionBridge, ProjectIntegration). | `systems_engineer_handoff.md` §6 R8 |

## 7. Next-sprint recommendation

From `next_embodied_mechanic_recommendations.md`:

- **Sprint N+1 (polish):** PedalResistanceArc + BrakeRig camera zoom + ChainSlack animated retraction. ~50 LOC + 2 tscn nodes. Closes R1, R2, and the chain-readability gap. **Pre-requisite for TireRig.**
- **Sprint N+2 (TireRig):** Embodied tire repair following the established grammar. Replaces the last big fake-interaction block in the polished surface.

After those two, the slice will be **3 of 4 stations embodied** and the embodied-learning identity will be durable rather than provisional.

## 8. What this snapshot promises

A reader picking up this checkpoint can:
- Run `godot --path BikeBrowserWorld` and play the full first-15-minute loop end-to-end.
- Run `BIKEBROWSER_PLAYTEST=1 godot --path BikeBrowserWorld` for full session telemetry.
- Run any of the 12 passing tests for regression coverage.
- Run `tools/export-godot-web.ps1` to refresh the `/godot-prototype` HTML5 build.
- Read `BikeBrowserWorld/project_audit/*.md` for the complete sprint history.

This is the first stable, recoverable, version-controlled vertical slice of BikeBrowserWorld.
