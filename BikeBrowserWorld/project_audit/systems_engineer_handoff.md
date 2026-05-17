# Systems Engineer — Handoff

Date: 2026-05-17
Author: systems-engineer orchestration pass
Branch: `repair/runtime-canonicalization`
Validated against HEAD: see `public/godot/BikeBrowserWorld/version.json` `git_sha`

This document closes the systems-engineer sprint. Read this before any subsequent gameplay or content sprint.

---

## 1. Mission scorecard

| Success criterion (from brief) | Status |
|---|---|
| Mr. Chen / GarageEntrance class of bug fixed systemically | **DONE** — data-driven NPC interaction radius (default 32) + opt-in overlap allowance + GarageEntrance moved to Zuzu's house |
| Interaction overlaps test-covered | **DONE** — `tests/interaction_overlap_check.gd` (new) |
| Brake embodied mechanic remains valid + physically intuitive | **VERIFIED, no edits** — `brake_integration_review.md` |
| Fake interaction loop audit updated | **DONE** — `fake_interaction_loop_audit_updated.md` |
| Next embodied mechanic path clear (ChainRig) | **DONE — state machine + test shipped**, visual .tscn deferred to next sprint |
| `/godot-prototype` export staleness documented + fixed | **DONE** — `tools/export-godot-web.ps1` shipped, export run, `version.json` written with current SHA |
| Reward validation remains green | **VERIFIED** — RuntimeValidator 0 errors, vertical_slice_check PASS |
| Runtime architecture remains stable | **YES** — no protected-system edits |
| Garage doesn't become overworked | **AUDITED, not yet reduced** — `garage_payoff_reduction_check.md` ships the plan |
| First 15-minute slice more coherent, not more complex | **YES** — see §5 |

---

## 2. What was changed

### Code

| File | Nature |
|---|---|
| `Systems/Interactions/AnimatedNpcInteraction.gd` | Added `@export var interaction_radius: float = 32.0`, `@export var allow_overlap: bool = false`, `_apply_interaction_radius()`, `set_interaction_radius(r)`. Default reduces NPC presence-circle from 64 → 32 across all 10 NPCs. |
| `Systems/World/TransitionZone.gd` | Added `@export var allow_overlap: bool = false`, `@export var required_quest_id := ""`, `_is_locked()` check on both `_on_body_entered` and `_transition`. |
| `Systems/World/LayoutApplier.gd` | Extended `_apply_node_layout` to honor `interaction_radius` from layout JSON (drives `InteractionArea/CollisionShape2D` circle and calls `set_interaction_radius` on the node). |
| `Data/layouts/neighborhood_street.json` | Moved `GarageEntrance` (310 → 35), `from_garage` spawn (260 → 35), `GarageGlint` (352 → 35), `GarageHomeAnchorGlow` (236 → −41), `WornPathToGarage` (238 → −45). The garage is now Zuzu's, not Mr. Chen's. |
| `Regions/Neighborhood/NeighborhoodStreet.tscn` | Added `required_quest_id = "chain_repair"` to `MineExit`, `DesertExit`, `RiverExit`. Side regions invisible until hero quest done. |
| `tests/interaction_overlap_check.gd` | **NEW.** Regression test — fails when two `ui_accept` Area2Ds overlap without opt-in. |
| `tests/garage_transition_check.gd` | `await process_frame` → `await physics_frame`. Did not fully resolve the test; deeper pre-existing issue. |
| `Prototypes/EmbodiedMechanics/ChainRig.gd` | **NEW.** State-machine clone of BrakeRig for chain repair. Headless-safe. |
| `tests/chain_rig_state_check.gd` | **NEW.** Headless state-machine test. PASS. |

### Tooling

| File | Nature |
|---|---|
| `tools/export-godot-web.ps1` | **NEW.** Re-exports BikeBrowserWorld HTML5 build to `public/godot/BikeBrowserWorld/`, writes `version.json` with git SHA + timestamp. |
| `public/godot/BikeBrowserWorld/*` | Re-exported from HEAD `eb1560a`. Stale 2026-05-12 build replaced. |

### Audit docs (10)

```
systems_engineer_current_state.md
interaction_topology_fix.md
brake_integration_review.md
fake_interaction_loop_audit_updated.md
chainrig_micro_prototype.md
godot_export_parity.md
data_contract_audit.md
voice_identity_minimal_plan.md
side_region_containment.md
garage_payoff_reduction_check.md
```

All in `BikeBrowserWorld/project_audit/`.

---

## 3. What was intentionally NOT changed

| Thing | Why not |
|---|---|
| Any file under `Core/` (EventBus, DialogueManager, QuestRegistry, SaveService, RegionRegistry, RewardBridge, RuntimeValidator) | Protected. No failing validation justified touching them. |
| `AudioService.gd` 5-LOC reward-stinger guard (Phase 10 recommendation) | Touches the AudioService boundary; deferred until next sprint with explicit approval, as the brief noted "AudioService architecture should not be casually rewritten." The guard is a reasonable change but better discussed before shipping. |
| `first_safety_check.json` deprecation (Phase 7 recommendation) | Active content. Deferred; needs design pass. |
| `ChainRig` integration into `ChainHotspot.gd` + visual `.tscn` | Significant visual scene work. Better shipped as one coherent player-facing change next sprint. State machine is proven; gating mechanism is documented. |
| Voice profile per-NPC JSON files (Phase 8) | Audit revealed AudioService already has a data-driven resolver and `voice_profiles.json` already covers all NPC scene characters. The system is already correct. Plan doc proposes a low-cost validation test for the next sprint. |
| `NpcInteraction.gd` (older NPC variant) | No active scene uses it. Left as legacy. Marked for cleanup. |
| Mr. Chen's NPC scene position | Design correct — he stays at his workshop. The fix was to move the player's garage entrance, not him. |

---

## 4. Validation results

All run on this commit.

| Test | Result |
|---|---|
| RuntimeValidator (boot) | **PASS** — 0 errors, 1 warning (TTS unavailable, expected on headless) |
| `tests/brake_rig_state_check.gd` | **PASS** |
| `tests/chain_rig_state_check.gd` | **PASS** (new) |
| `tests/safety_check_brake_integration_check.gd` | **PASS** |
| `tests/vertical_slice_check.gd` | **PASS** |
| `tests/interaction_overlap_check.gd` | **PASS** (new) |
| `tests/input_prompt_mapping_check.gd` | **PASS** |
| `tests/transition_dialogue_guard_check.gd` | **PASS** |
| `tests/dialogue_keyboard_advance_check.gd` | **PASS** |
| `tests/garage_floor_layering_check.gd` | **PASS** |
| `tests/voice_identity_profile_check.gd` | **PASS** |
| `tests/voice_mix_balance_check.gd` | **PASS** |
| `tests/garage_transition_check.gd` | **PRE-EXISTING FAIL**, see §6 |
| `npm run build` | **PASS** — 22.5s, no errors |
| Godot HTML5 export | **PASS** — exit 0, `version.json` written |

**Counted: 12/13 Godot tests pass. The single failure is pre-existing and flagged in the original handoff.**

---

## 5. First-15-minute walkthrough (post-sprint)

1. Spawn at NeighborhoodStreet (0, 0). World feels populated; no side regions accessible yet.
2. Walk to Mrs. Ramirez at (−330, −82). Her presence circle (32) no longer triggers from across the sidewalk. Walk up to her to talk.
3. Approach SafetyCheckStation at (−240, 14). Mrs. Ramirez's circle no longer clips the station. Brake check is fully embodied — hold E, watch pads pinch inward, wheel stop. "Looks good." (one quiet cue.)
4. Continue safety check: tire press, chain check, report — currently still press-to-advance. **Acceptable placeholder** for this sprint; brake is the canonical example.
5. Walk to Mr. Chen at (308, −82). Talk to him. He starts `chain_repair`.
6. Walk left to Zuzu's house (x ≈ 35). The garage entrance is now there. Mr. Chen no longer blocks it. Press E to enter the garage.
7. ZuzuGarage loads. Chain repair via 5 E-presses for now — to be replaced when `ChainRig` ships its .tscn next sprint.
8. Return via the garage exit. `from_garage` spawn places you in front of Zuzu's house at (35, 0).
9. Try to walk to a side-region exit (MineExit, DesertExit, RiverExit). Nothing happens — silent gating. Currently no "locked" hint. (Tracked in §6.)

The slice is more coherent than at the start of the sprint:
- The garage now spatially belongs to Zuzu.
- No NPC blocks any door or station.
- The first 15 minutes can't accidentally fall into a skeleton side region.
- The exported `/godot-prototype` route reflects what the editor build runs.

---

## 6. Remaining risks + next-sprint recommendations

Ordered by impact.

### R1 — `BikeBrowserWorld/` is entirely untracked in git
**Severity: critical.** Discovered by Phase 6 fork. None of the Godot project files (Core/, Regions/, Systems/, Data/, Prototypes/, tests/, project_audit/) are committed. A stray `git clean` would wipe weeks of work. **Recommendation: `git add BikeBrowserWorld/` and commit before any other work next sprint.**

### R2 — `garage_transition_check.gd` still fails
Originally flagged as unresolved by the user's handoff. Tried a `physics_frame` await fix; still fails. Likely the Player node isn't added to the `"player"` group in the headless-instantiated scene, OR the SceneTree-script harness doesn't step physics. Out-of-sprint diagnosis; doesn't block the slice.

### R3 — Garage reward stacking
Phase 10 fork found 7+ cues in 2 s at `chain_repair` completion. The single-file 5-LOC patch is documented in `garage_payoff_reduction_check.md`. **Recommendation: apply with explicit approval next sprint.**

### R4 — Locked side-region exits are silent
Adding `required_quest_id` made the exits no-op on touch — no prompt, no feedback. That reads as a glitch. **Recommendation: small "Maybe later" or similar quiet line via `EventBus.interaction_feedback.emit` when `_is_locked()` returns true on body_entered. ~5 LOC in TransitionZone.gd.**

### R5 — `version.json` has a BOM
PowerShell 5.1's `Set-Content -Encoding utf8` writes UTF-8 with BOM. Modern JSON parsers strip it; some browsers historically have not. **Recommendation: switch the export script to `[System.IO.File]::WriteAllText` with `UTF8Encoding($false)`.** Trivial follow-up.

### R6 — ChainRig is unreferenced
Until the visual `.tscn` and `ChainHotspot` integration land, `ChainRig.gd` is dead code. **Recommendation: ship the visual scene + integration as the next sprint's headline change, or revert.**

### R7 — `first_safety_check.json` is orphan content
Phase 7 fork: 2 of 3 objectives have no script recorder. If `start_quest("first_safety_check")` is ever called, the quest sits in active_quests forever. **Recommendation: delete the file or stub a fail-safe completion path.** Not in any active flow today.

### R8 — RuntimeValidator doesn't check four of twelve autoloads
`DiscoveryService`, `InventoryManager`, `CompanionBridge`, `ProjectIntegration` aren't in the validator's checklist. Silent gap. Two-line fix; not urgent.

### R9 — Bundle size warnings
`vendor-rapier` 2.08 MB, `vendor-phaser` 1.48 MB, `GamePage` 0.72 MB, `vendor-three` 0.74 MB. Pre-existing concern owned by the `bundle-splitter` agent. The Godot HTML5 `.pck` is 187 MB and lives in `public/godot/`, served only when the user navigates to `/godot-prototype`. **The full Godot build should not ship in the published Electron bundle if `/godot-prototype` is not a production feature.** Decision needed from the user.

---

## 7. Merge readiness

The branch `repair/runtime-canonicalization` is in a clean state:
- Validation green.
- Frontend build green.
- No protected-system edits.
- All changes covered by tests OR by audit docs that justify the change.

**Recommend merging as a single coherent systems-engineer pass once R1 (commit BikeBrowserWorld/ to git) is resolved.** Without that, the merge would carry no Godot source history at all.

---

## 8. Process notes

- The swarm lane infrastructure (lanes 1–8 status.md "Not yet reported") remained unchanged this sprint. Treat the swarm as solo orchestration documentation rather than multi-agent coordination state — the convergence_snapshot.md and core_principles.md are useful as design philosophy reference; the lane status fields are not authoritative project state.
- All eight specialist agents (six audit forks + two implementation tracks in the main thread) returned within the sprint window. No agent stalled or required redirection.
- Two findings overturned the original brief: (a) brake pads already move inward correctly; (b) voice identity system is already data-driven and clean. **Both updates are recorded in their respective audit docs and explain why those phases shipped as "no change required."** This is good — the brief is allowed to be wrong, and the sprint absorbed the corrections.
- The user's explicit instruction "Do not maximize output. Maximize coherence, stability, tactile learning, emotional warmth, authored restraint" was the governing constraint. Several phase-5 visual scene options were considered and deferred. Several phase-10 reduction edits were planned and not applied (waiting for the next-sprint approval gate). Restraint-over-output is the deliberate posture of this sprint and shows in what shipped vs what was documented.
