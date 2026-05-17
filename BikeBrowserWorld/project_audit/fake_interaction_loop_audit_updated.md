# Fake Interaction Loop Audit (updated)

Date: 2026-05-17
Scope: every player-driven interaction loop currently shipping in BikeBrowserWorld.
Method: read every script in `Systems/Interactions/`, every gameplay script in `Regions/`, and every mission JSON in `Data/missions/`. Cross-referenced against the BrakeRig embodied template.

---

## Classification key

| Class | Definition |
|---|---|
| **embodied** | Player performs a continuous action whose completion is gated by the observed state of a visible mechanism (forces, contact, motion). The script does not advance on a key press alone — it advances when the mechanism reaches a verified state. |
| **semi-embodied** | Visible mechanism feedback exists, but advancement is still press-gated. Player sees something move, but pressing again is what advances the quest. |
| **fake-press** | Single key press advances state. Any visuals are cosmetic; the mechanism does not actually do anything the player must observe. |
| **dialogue-only** | Conversation with an NPC; no mechanism. Acceptable by design for talking NPCs. |
| **acceptable placeholder** | A quest JSON exists, but no scene or script implements it; the region either doesn't exist yet or the player can't reach it in the first 15 minutes. Holds a slot for future work without affecting current play. |

---

## Interaction-script inventory

`BikeBrowserWorld/Systems/Interactions/` contains 5 scripts. They cover every gameplay loop currently exposed in any playable region:

| Script | Loop | Class | File:line of the gate |
|---|---|---|---|
| `SafetyCheckStation.gd` — step 0 (check_brakes) | Hold E, BrakeRig drives lever→cable→caliper→pad→stop→verified, only `_on_brake_verified_changed(true)` records the objective | **embodied** | `SafetyCheckStation.gd:134-143` (gate); `BrakeRig.gd:_resolve_state` (state machine) |
| `SafetyCheckStation.gd` — step 1 (check_tires) | Press E → records `check_tires`, plays `tire_press` sfx, ticks `step_index` | **fake-press** | `SafetyCheckStation.gd:88-89, 91-121` (shared `advance_check`) |
| `SafetyCheckStation.gd` — step 2 (check_chain) | Press E → records `check_chain`, plays `chain_roll` sfx | **fake-press** | `SafetyCheckStation.gd:88-89, 114-118` |
| `SafetyCheckStation.gd` — step 3 (report_safety_check) | Press E → records `report_safety_check`, plays `soft_reward` sfx; this is the "tell Mrs. Ramirez" beat | **dialogue-only** (intentional) | `SafetyCheckStation.gd:114-118` |
| `ChainHotspot.gd` — 5 steps (inspect → rotate → align → seat → test) | Each press calls `inspect_chain()`, records objective, swaps `repair_bike.texture` between 3 authored chain states | **fake-press** ×5 | `ChainHotspot.gd:84-122`; texture swap `124-138` |
| `TireRepairStation.gd` — 4 steps (inspect → ease → patch → pump) | Each press calls `advance_repair()`, records objective, advances pressure bar by 25% per press | **fake-press** ×4 | `TireRepairStation.gd:68-93`; pressure bar `_update_visuals 95-118` |
| `NpcInteraction.gd` / `AnimatedNpcInteraction.gd` | Press E → opens dialog via `/root/DialogueManager.start_dialogue` | **dialogue-only** (intentional) | `AnimatedNpcInteraction.gd:_unhandled_input` |

### Region scripts surveyed (non-gameplay confirmed)

`Regions/Boot/Boot.gd`, `Regions/SystemShowcase/*.gd`, `Regions/Garage/GarageAmbience.gd`, `Regions/Neighborhood/NeighborhoodAmbience.gd`, `Regions/Shared/SubtleAmbientLife.gd` — all ambience / system demos. No player gameplay loops, no `ui_accept` handlers worth classifying.

---

## Mission-by-mission classification

| # | Mission | Region (declared) | Script wired? | Classification | Notes |
|---|---|---|---|---|---|
| 1 | `bike_safety_check` | neighborhood_street | `SafetyCheckStation.gd` | **semi-embodied** (brake step) + **fake-press** ×2 + **dialogue-only** ×1 | The brake step is real. Tires + chain + report are press-to-advance. |
| 2 | `chain_repair` | neighborhood_street → garage | `ChainHotspot.gd` | **fake-press** ×5 | Hero quest. Most prominent fake loop in the polished slice. |
| 3 | `flat_tire_repair` | neighborhood_street | `TireRepairStation.gd` | **fake-press** ×4 | Pressure bar visual implies skill ("Stop in the green") but no stopping gate — final press just sets 100%. |
| 4 | `first_safety_check` | neighborhood_street | none — pure dialogue + inspect + report | **dialogue-only** | Probably superseded by `bike_safety_check`. Duplicate quest content; flag for data-contract pass. |
| 5 | `workshop_first_build` | garage | none | **acceptable placeholder** | "Factory friends" (Zevon/Charlie/Jacob/Cole/James) NPCs exist as scenes but no crafting station exists. Quest cannot be physically completed. |
| 6 | `bridge_material_test` | garage (material rig) | none | **acceptable placeholder** | No material testing rig scene. |
| 7 | `bridge_quest_1` (Assess) | dry_wash (no layout) | none | **acceptable placeholder** | No bridge region exists; quest cannot be physically played. |
| 8 | `bridge_quest_2` (Gather) | dry_wash | none | **acceptable placeholder** | Same — and references `shopkeeper` NPC who has no scene. |
| 9 | `bridge_quest_3` (Test strength) | garage (material rig) | none | **acceptable placeholder** | |
| 10 | `bridge_quest_4` (Build) | dry_wash | none | **acceptable placeholder** | |
| 11 | `bridge_quest_5` (Celebrate) | dry_wash | none | **acceptable placeholder** | |
| 12 | `copper_rock_id` | copper_mine | none — `CopperMine.tscn` only has ambience | **acceptable placeholder** *(but reachable)* | Mine is reachable via `MineExit` from NeighborhoodStreet. If a player explores there in the first 15 min they will find a quest that has no implementation. See containment risk below. |
| 13 | `mine_cart_repair` | copper_mine | none | **acceptable placeholder** *(but reachable)* | Same containment risk. |
| 14 | `desert_plant_observation` | desert_trail | none | **acceptable placeholder** *(reachable)* | DesertExit from NeighborhoodStreet. |
| 15 | `track_the_animal` | desert_trail | none | **acceptable placeholder** *(reachable)* | |
| 16 | `test_water_quality` | salt_river | none | **acceptable placeholder** *(reachable)* | RiverExit. |
| 17 | `water_sample_observation` | salt_river | none | **acceptable placeholder** *(reachable)* | |
| 18 | `algae_bloom_source` | salt_river | none | **acceptable placeholder** *(reachable)* | |

**Net implementation reality**: only 3 of 18 missions have ANY script implementation, and of those, only **1 step out of 14 total interactive steps in the polished slice** is genuinely embodied (the brake hold).

---

## What the polished first 15 minutes actually contains

In play order:

1. **Spawn → walk neighborhood** — dialogue-only NPC encounters.
2. **Mrs. Ramirez safety check** — 1 embodied step (brakes) + 2 fake-press (tires, chain) + 1 dialogue (report). **Read-through: 1 real beat, 3 hollow.**
3. **Mr. Chen** — dialogue-only.
4. **Garage transition.**
5. **Chain repair (ChainHotspot)** — 5 fake-press. **Read-through: 5 hollow beats in the hero workshop moment.**
6. **Return to neighborhood.**

The single embodied beat (brake hold) sits inside the safety check; everything after it in the hero arc — including the entire garage chain repair — is press-to-advance.

The repair texture swap (slipped → aligning → seated) helps, but the player did not *do* the alignment. They watched it happen because they pressed E.

---

## Recommendations to convert specific fake loops

| Loop | Minimum embodied conversion | Notes |
|---|---|---|
| SafetyCheckStation `check_tires` | Player holds E to press the tire; PressureRig shows sidewall deflection vs. firm response. Verified gate when deflection settles in a target band. | Small rig, ~half the size of BrakeRig. Reuses safety-check station scene. |
| SafetyCheckStation `check_chain` | Player taps direction key (or holds E with crank motion) → crank rotates → chain advances → if chain runs clean for 1.0s without skip, verified. | Direct precursor to a full ChainRig. |
| ChainHotspot (chain_repair) | Full ChainRig — see recommendation below. | The biggest win available. |
| TireRepairStation pump step | Hold E to inflate; bar fills continuously; release in green band; over-pump pops the tube and restarts step. | One-mechanic skill gate; quickest non-chain win after ChainRig. |
| TireRepairStation patch step | Hold E ≥1s to press patch; release too early = patch peels and restart. | Same hold-and-release pattern. |
| TireRepairStation inspect step | Move cursor / move player to locate the puncture in the tube (visible sparkle marks the leak); E only registers when on the leak. | Adds spatial verification. |

---

## NEXT EMBODIED MECHANIC — recommendation

**Build ChainRig next.** The user's prior is validated; counter-options were considered.

### Why ChainRig wins over alternatives

1. **It sits inside the hero arc.** Chain repair is the climactic interaction of the polished 15-minute slice and currently the most visible fake loop. Embodying it means the slice's two named gameplay beats (brake check, chain repair) are both real.
2. **Authored visual states already exist.** `garage_repair_stand_bmx_slipped_chain.png`, `..._aligning_chain.png`, `..._seated_chain.png` — the textures the ChainRig needs as terminal-state visuals are already drawn and loaded by `ChainHotspot.gd:5-7`. ChainRig replaces the press-to-swap gate with an embodied gate, not the artwork.
3. **The mechanism maps cleanly onto BrakeRig's template.** The state machine is a parallel chain of force:

    | BrakeRig state | ChainRig equivalent |
    |---|---|
    | IDLE | chain_slipped |
    | LEVER | pedal_rotated |
    | CABLE | chain_tension_visible |
    | CALIPER | chain_guided |
    | STOPPED | chain_seated |
    | VERIFIED | wheel_turns_cleanly |

    `BrakeRig.gd:_resolve_state` is directly cloneable as `ChainRig.gd:_resolve_state` with different scalars (pedal_angle, chain_advance, tension_load, sprocket_engagement, wheel_spin).
4. **Verifies the template.** If the brake template can be cloned into one new mechanism, it can be cloned into all of them. ChainRig is the smallest test that proves the embodied-mechanics approach is scalable beyond a single prototype. After ChainRig, TireRig (inflation + patch hold) is the obvious third.

### Why not TireRig first

TireRepairStation's natural skill gate (pump-to-target, release-in-green) is genuinely embodied, and is in some ways the easier first clone — but `flat_tire_repair` is NOT in the documented first-15-minute hero loop. Building TireRig first improves a side beat instead of the climactic one.

### Why not BrakeRig polish first

BrakeRig is solid as-is. Pads move inward correctly (`BrakeRig.gd:182-185`). The mechanic-eye-camera and disc/rim distinction concerns from the handoff are real but they polish a working system instead of converting a hollow one. Convert before polishing.

### Scope discipline for ChainRig

- Build as isolated prototype first: `Prototypes/EmbodiedMechanics/ChainRigPrototype.tscn` + `ChainRig.gd`.
- Required states match the user's spec: chain_slipped, pedal_rotated, chain_tension_visible, chain_guided, chain_seated, wheel_turns_cleanly, chain_verified.
- Educational loop: pedal rotation → chain moves → tension visible → chain seats onto sprocket → wheel turns cleanly → verified.
- One primary payoff cue (wheel turns), at most one soft secondary (quiet line). Per payoff_cue_policy.
- Do NOT replace the full chain quest until the prototype reads correctly in isolation and the same test (`tests/chain_rig_state_check.gd`) passes that BrakeRig has.
- Do NOT build a full drivetrain simulator. Pedal turns the crank as a single rotational input; chain advance is interpolated authored states, not articulated links.

---

## Containment risk surfaced by this audit

The first-15-minute slice is exposed to **9 reachable acceptable-placeholder missions** in the three skeleton side regions (Mine, Desert, River), each accessible by walking off the appropriate edge of NeighborhoodStreet. None have script implementations. A player who walks off the wrong edge in the first 15 minutes will land in a region with a placeholder NPC, a quest JSON that loads into QuestRegistry, and nothing to actually do. This is outside this audit's scope but flagged for the side-region containment phase.

---

End of audit.
