# Interaction Topology Fix — Phase 2 Result

Date: 2026-05-17
Author: systems-engineer pass
Status: **shipped, validated against new regression test**

## 1. Problem (recap)

NPC `Area2D`s share an input space with `TransitionZone` doorways and station `Area2D`s. When two `ui_accept`-consuming Area2Ds overlap, whichever resolves the input first wins — practically, the NPC's dialog opens, the door's `_transition()` silently no-ops via `_dialogue_is_active()` guard, and the player perceives a stuck door.

The live concrete case: Mr. Chen at world (308, −82) with a 64-px interaction circle reached into the `GarageEntrance` rect at (310, −76, w=156, h=70). Same latent pattern exists for Mrs. Ramirez (−330, −82) whose 64-px circle clipped the `SafetyCheckStation` rect at (−240, 14, w=150, h=92).

Root cause: interaction circle radius was hardcoded `64.0` as a `sub_resource` in every NPC `.tscn`, with no data path to change it.

## 2. Fix (systemic, not a one-off move)

Four code edits + one JSON edit, none in protected systems:

| File | Change |
|---|---|
| `Systems/Interactions/AnimatedNpcInteraction.gd` | Added `@export var interaction_radius: float = 32.0` and `@export var allow_overlap: bool = false`. New `_apply_interaction_radius()` rebuilds the `InteractionArea/CollisionShape2D` shape at `_ready` using the export value. Also exposes `set_interaction_radius(r)` for runtime use by the layout applier. |
| `Systems/World/TransitionZone.gd` | Added `@export var allow_overlap: bool = false` (mirror of the NPC export, used as the opt-in side of the regression test) and `@export var required_quest_id := ""` plus `_is_locked()` check fired from both `_on_body_entered` and `_transition` — used by Phase 9 (side-region gating). |
| `Systems/World/LayoutApplier.gd` | Extended `_apply_node_layout` to honor a new optional `interaction_radius` key. When present, rebuilds the NPC's `InteractionArea/CollisionShape2D` as a `CircleShape2D` and calls `set_interaction_radius` on the node. Per-region override path. |
| `Data/layouts/neighborhood_street.json` | Moved `GarageEntrance` x=310 → x=35 (centered under Zuzu's roof, not Mr. Chen's workshop). Moved `from_garage` spawn x=260 → x=35. Followed three visual cues that point at the door — `GarageGlint`, `GarageHomeAnchorGlow`, `WornPathToGarage` — to align with the new entrance. **Did not** move `Driveway`, `DrivewayPanel`, `ChenWorkshopWarmPool`, `GarageMarker` because those are themed for Mr. Chen's workshop and reading them as "his driveway" is correct after this move. |
| `Regions/Neighborhood/NeighborhoodStreet.tscn` | Added `required_quest_id = "chain_repair"` to `MineExit`, `DesertExit`, `RiverExit` (Phase 9 — side regions stay invisible until the player finishes the hero quest). |

New file: `tests/interaction_overlap_check.gd`. Loads every populated region, locates each `AnimatedNpcInteraction`, `TransitionZone`, and `SafetyCheckStation`, computes circle/rect world-space shapes, runs an exact circle-vs-rect overlap test, fails when any pair overlaps without either side opting in via `allow_overlap = true`. Currently scans NeighborhoodStreet + ZuzuGarage. Result on this commit: **passed.**

## 3. Geometry sanity (post-fix)

| Pair | Pre-fix | Post-fix |
|---|---|---|
| Mr. Chen circle vs GarageEntrance rect | Overlap ~64 px wide | Closest-point distance **195 px**, circle radius 32 → clean |
| Mrs. Ramirez circle vs SafetyCheckStation rect | Overlap ~10 px corner | Closest-point distance **~52 px**, radius 32 → clean |

The new default of 32 px is what the design implicitly wanted: walk up to an NPC to talk, not be greeted from across the sidewalk. 64 was greedy.

## 4. What is NOT touched

- Mr. Chen's NPC scene position. He stays at his workshop, by his workbench, where the design wants him.
- Mr. Chen's workshop visual identity (driveway, warm pool, building). It is correctly identified as *his*, not the player's garage.
- Per-NPC radius overrides in any specific scene. The 32-px default is uniform; if a future scene needs a different value, set it on the scene instance or pass `interaction_radius` via the layout JSON. Both paths are wired.
- `NpcInteraction.gd` (the older non-animated variant). No active scene uses it; left as legacy. If a future scene picks it up, the same export pattern should be copied across.

## 5. Validation

- `interaction_overlap_check.gd` — PASS (new test, this commit)
- `brake_rig_state_check.gd` — PASS
- `safety_check_brake_integration_check.gd` — PASS
- `vertical_slice_check.gd` — PASS
- `input_prompt_mapping_check.gd` — PASS
- `garage_transition_check.gd` — **pre-existing FAIL** flagged in the original handoff. Tried a `physics_frame` await fix; still fails. Root cause is upstream of this phase (likely Player not in `"player"` group at test time, or scene tree not stepping physics under raw `--script` boot). Out of Phase 2 scope; tracked for next sprint.
- RuntimeValidator: 0 errors / 1 warning (TTS unavailable — expected on headless).

## 6. Risks introduced

- Every NPC now has a 32-px circle. They are quieter on approach. If a play-tester expected to be greeted from a distance, they'll notice. Intended behavior change.
- `from_garage` spawn at x=35 puts the player in front of Zuzu's house when returning from the garage. Some downstream content may have assumed they'd reappear by the workshop. Cross-checked: no current dialog or quest reads `from_garage` x value.
- Side-region exits now gated on `chain_repair` completion. A returning player with `chain_repair` complete sees them open as before. A new player cannot wander into Mine/Desert/River in the first 15 minutes — exactly the goal of Phase 9.

## 7. Follow-ups

- Add a small "this way is locked for now" feedback line when the player hits a locked exit. Currently silent — that may read as a glitch. Out of this sprint, tracked.
- Replace `NpcInteraction.gd` with `AnimatedNpcInteraction.gd` or delete it, so the systemic guarantee actually holds across the codebase.
- Add `garage_floor_layering_check.gd`-style coverage for ZuzuGarage's NPC layout (currently the overlap test only scans Neighborhood + Garage; if Garage gets more NPCs they're auto-covered).
