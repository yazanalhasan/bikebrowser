# Systems Engineer — Current State of Truth

Date: 2026-05-17
Author: systems-engineer orchestration pass
Method: read of the live repo (Core, Systems, Regions, Data, Prototypes, tests, swarm/, docs/, host app) plus six parallel survey forks. This document is the truth baseline that every subsequent phase in this sprint depends on; if a claim here is wrong, fix this file before fixing anything else.

## 1. Game runtimes shipping in this repo

Three coexisting game runtimes inside one Electron+Vite host (`src/main/main.js`, `vite.config.js`, `src/renderer/App.jsx:69-83`):

| Route | Stack | Status |
|---|---|---|
| `/play` | Phaser 3, 24 scenes, layout editor wired to dev-server `POST /api/save-layout` | Mature, default game, Playwright `test:e2e:playthrough` passes 4/4. |
| `/play3d` | React-Three-Fiber + Rapier + Three | Parallel evaluation. |
| `/godot-prototype` | Godot 4.6 HTML5 export in `<iframe>` | **The "BikeBrowserWorld" prototype.** |

`/godot-prototype` is **a parallel prototype evaluation, not a Phaser replacement**. Phaser remains the fallback.

## 2. Godot source vs exported web build

- Live source: `BikeBrowserWorld/` (gdscript + .tscn).
- Exported HTML5 build: `public/godot/BikeBrowserWorld/` (loaded by `src/renderer/pages/GodotPrototypePage.jsx:8`).
- **Critical workflow risk:** editing `.gd` files updates the editor build (`godot --path BikeBrowserWorld`) but does NOT update what `/godot-prototype` serves until a re-export. This is the load-bearing footgun for any in-browser testing.
- Export staleness measurement is owned by the Phase 6 fork; this document records the risk, not the measurement.

## 3. Current autoloads (project.godot:17-30, 12 total)

```
EventBus, SaveService, RegionRegistry, QuestRegistry, DiscoveryService,
InventoryManager, DialogueManager, CompanionBridge, RewardBridge,
AudioService, RuntimeValidator, ProjectIntegration
```

The handoff brief enumerates 8 "canonical" autoloads. The four extras (`DiscoveryService`, `InventoryManager`, `CompanionBridge`, `ProjectIntegration`) are not in the protected list and are **not checked by RuntimeValidator**. Silent gap.

## 4. Protected systems (honored this sprint)

`Core/EventBus`, `Core/DialogueManager`, `Core/QuestRegistry`, `Core/SaveService`, `Core/RegionRegistry`, `Core/RewardBridge`, `Core/RuntimeValidator`. No edits to these files this sprint without a failing validation that proves necessity.

## 5. Current tests

`tests/*.gd` SceneTree scripts (10):

- `vertical_slice_check.gd` — chain_repair end-to-end; de-facto integration gate
- `brake_rig_state_check.gd` — BrakeRig state machine
- `safety_check_brake_integration_check.gd` — station gates on `brake_verified_changed(true)`
- `garage_transition_check.gd` — Neighborhood → Garage; **fragility flagged (uses `/root/RegionRegistry` lookup that may be brittle under raw `--script` boot)**
- `input_prompt_mapping_check.gd` — E/Enter/Space → ui_accept
- `transition_dialogue_guard_check.gd`
- `dialogue_keyboard_advance_check.gd`
- `garage_floor_layering_check.gd`
- `voice_identity_profile_check.gd`
- `voice_mix_balance_check.gd`

`RuntimeValidator.gd` runs at boot and validates autoloads / region scenes / quest counts / dialogue normalization / NPC `.tscn` shape / audio mappings. Latest report: 0 errors.

**Not currently tested** (covered in Phase 2 + Phase 7):
- Spatial overlap between two `ui_accept`-driven Area2Ds (the live Mr. Chen vs GarageEntrance bug class).
- Layout-rule enforcement (no test fails on inline `position = Vector2(…)` in `.tscn`).
- Reward stacking against the payoff-cue policy.
- Mission-objective-ID consistency between station scripts and mission JSON.

## 6. Active embodied prototype

`BikeBrowserWorld/Prototypes/EmbodiedMechanics/`:

- `BrakeRig.gd` — state machine `IDLE → LEVER → CABLE → CALIPER → STOPPED → VERIFIED`. Pads correctly move inward (`BrakeRig.gd:182-185`). Signal `brake_verified_changed(verified: bool)`. **Genuinely embodied.**
- `BrakeTestPrototype.tscn` + `.gd` — isolated scene to drive the rig.
- Integrated into `SafetyCheckStation.gd:134` — brake step is genuinely gated.

**Nothing else is embodied.** ChainHotspot (5 E-presses) and TireRepairStation (4 E-presses) remain texture-swap press-to-advance. Chain repair is the hero quest of the slice; it is the next embodied target.

## 7. Current first-15-minute flow

Verified by reading `SafetyCheckStation.gd`, `ChainHotspot.gd`, `bike_safety_check.json`, `chain_repair.json`, `NeighborhoodStreet.tscn`, `ZuzuGarage.tscn`:

1. Spawn in NeighborhoodStreet (default spawn x=0, y=0).
2. Optional: meet Mrs. Ramirez at (−330, −82). Open dialog with E.
3. Approach SafetyCheckStation at (−240, 14). Hold E to do brake check — **truly embodied**. Then press E for tire check (placeholder), then chain check (placeholder), then "tell Mrs. Ramirez" close-out. Quest `bike_safety_check` completes; reward emits.
4. Approach Mr. Chen at (308, −82). Open dialog. Starts `chain_repair`.
5. **Approach GarageEntrance — currently blocked.** Entrance is at (310, −76); Mr. Chen's 64-radius circle reaches into the entrance rect. His dialog wins the E-press; the entrance transition silently no-ops because `TransitionZone._dialogue_is_active()` guard fires.
6. (If user pushes through:) ZuzuGarage loads. Chain repair via 5 E-press texture swaps. Reward emits.
7. Return to neighborhood via garage exit.

The slice is **playable end-to-end except** for step 5 (overlap bug) and the press-to-advance feel of steps 3.2/3.3 (tires, chain) and 6 (whole chain repair).

## 8. Current systemic risks (this sprint's targets)

- **R1 — NPC interaction radius is hardcoded 64px in every NPC `.tscn`.** Not data-driven, not in layout JSON, not overridable per-region. Cause of the Mr. Chen overlap and at least one latent issue (Mrs. Ramirez circle reaches into SafetyCheckStation rect). **Phase 2 target.**
- **R2 — Chain repair is fake-press.** Game's hero quest doesn't deliver the stated identity. **Phase 4/5 target.**
- **R3 — Godot HTML5 export likely stale.** `/godot-prototype` does not reflect current source. **Phase 6 target.**
- **R4 — Mission/dialogue schema drift.** 3 mission schemas, 3 dialogue schemas, 12/18 missions missing `giver`. Objective-ID drift between station scripts and mission JSON is unchecked. **Phase 7 target.**
- **R5 — Side regions (Mine/Desert/River) are skeleton stubs** and reachable from the neighborhood with no gating. First 15 minutes can break tone. **Phase 9 target.**
- **R6 — Garage may stack reward cues** against the explicit payoff-cue policy. **Phase 10 target.**
- **R7 — Voice identity is hardcoded for Mr. Chen, generic fallback for everyone.** **Phase 8 plan-only target.**
- **R8 — SaveService has no schema contract** with the services it serialises. Out of this sprint's scope; tracked.
- **R9 — Swarm lanes 1–8 status.md all read "Not yet reported"** since the swarm started. Out of this sprint's scope; tracked as a process truth (the swarm is solo orchestration documentation framed as multi-agent, and the docs should be read with that in mind).

## 9. Active prototype agent surfaces (other than BrakeRig)

None. The BrakeRig is the only embodied mechanism in the repo. Every other "interaction" is either NPC dialog, single-press E, or texture-swap state advance.

## 10. Truth lines from doc currency check

- `docs/godot-next-steps.md` is **stale** (still Phase 0 framing) while repo is mid-Phase 3.
- `swarm/convergence_snapshot.md` 2026-05-16 reports score 7.2/10 — still current.
- `project_audit/latest_runtime_validation.md` last green (0 errors) at the previous handoff.
- `project_audit/` exists at **two roots** (repo root + `BikeBrowserWorld/project_audit/`). The systems-engineer pass writes to `BikeBrowserWorld/project_audit/` since that's where `RuntimeValidator` writes and where most existing audits live; the root `project_audit/` holds the embodied-mechanics narrative. Confusion risk noted.

---

This file is the baseline. Subsequent phase docs in this folder must cite or amend it, not replace it.
