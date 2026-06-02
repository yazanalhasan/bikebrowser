# Gameplay Comparison (Phase 4) — Legacy vs Rebuild

**Audit date:** 2026-06-02 · **Method:** evidence-based code reading of both trees. Reality > docs.
**Scope:** game-design / product audit, per-subsystem. **No merge, no delete, no global winner.**

## The two implementations (verified mapping)

| | LEGACY | REBUILD |
|---|---|---|
| Path | `src/renderer/game/` → route `/legacy-play` | `src/game/phaser/` → route `/game-rebuild` |
| Size | ~51k LOC (`content_vs_systems_report.md:18`) | 4,918 LOC live tree |
| Scenes | 24 scene files / 18 registry entries (`systems/sceneRegistry.js:27-377`) | 7 scene files; **1 playable** (`NeighborhoodScene.js`, 1586 LOC) |
| Live? | **NOT reachable from `/game-rebuild`** (`runtime_reality_audit.md:18-28`) | **The runtime reality** — verified acceptance run |
| Nature | engineering/simulation **sandbox** | polished Act-1 **vertical slice** |

> Architectural truth (`runtime_reality_audit.md:0`): the ~20 legacy scenes and the legacy
> place-each-beam bridge minigame **are not what a player loads today**. "Legacy Wins" below means
> *the legacy code is the better-designed artifact for that subsystem* — not that it ships. Where a
> player-facing experience is required, the live rebuild has a structural advantage simply by being
> reachable; the per-subsystem scores judge design quality of the actual code in each tree.

---

## Subsystem scorecard

| Subsystem | Winner | Margin |
|---|---|---|
| Exploration & world structure | **Legacy** | clear |
| Quest flow & coherence | **Rebuild** | clear |
| Progression | **Tie** (different philosophies) | — |
| Mystery | **Rebuild** | slight |
| Discovery | **Legacy** | slight |
| Educational integration | **Legacy** (breadth) / Rebuild (focus) → **Tie** | — |
| Vehicle interaction | **Legacy** | decisive |
| Repair systems (bridge) | **Tie** (different strengths) | — |
| Workbench / testing systems | **Legacy** (depth) / Rebuild (wired) → **Tie**, lean Rebuild | — |

---

## 1. Exploration & world structure — **LEGACY WINS**

**Legacy:** A three-layer world — `overworld` macro-map, `local` playable zones, `micro` overlays
(`sceneRegistry.js:5-21`). 18 registered scenes with real `exits`, named `spawns`, and gated
`unlockReq` (reputation + quest + item + knowledge gates), e.g. `LakeEdgeScene` needs `reputation:10`
+ a repair quest (`sceneRegistry.js:173-180`); `MountainScene` needs `reputation:35` + active
`bridge_collapse` (`:265-272`). Distinct biomes: Garage, Materials Lab, Thermal Lab, Street, Dog
Park, Lake Edge, Sports Fields, Community Pool, Desert Trail, Mountain, Copper Mine, Salt River,
Desert Foraging, Dry Wash (`sceneRegistry.js:54-376`). `seamlessTraversal.js` (416 LOC) and a
`WorldMapScene` (74KB) back a genuinely navigable region.

**Rebuild:** **One** playable scene — a single side-on 1600×1000 street; "everything in Act 1 happens
here" (`runtime_reality_audit.md:32-34`). 11 named locations exist as **coordinate anchors inside the
one scene** (`act1Locations.js:1-13`), not separate scenes. The "wider map" is a dead-end gate that
unlocks a notebook entry, not a new area (`Act1RuntimeSystem.unlockWiderMap:276-289`). No scene
exits (`runtime_reality_audit.md:173`).

**Verdict: Legacy wins decisively on breadth, biome variety, and gated nonlinear traversal.** The
rebuild is deliberately a one-room slice.

## 2. Quest flow & coherence — **REBUILD WINS**

**Rebuild:** A single linear, fully-wired chain of 11 quests / 32 objectives
(`act1Quests.js:1-122`), each quest pointing to its successor via `next` (`act1Quests.js:14,27,…`).
`QuestSystem.maybeCompleteQuest` auto-advances `activeQuestId` when every objective is done
(`QuestSystem.js:38-49`). Objectives are completed by real scene interactions: `createInteractions()`
registers ~13 zones each carrying an `action`/`dialogueId` (`NeighborhoodScene.js:588-767`), routed
through `Act1RuntimeSystem.handleInteraction` (`:137-182`). **Honest gating / failure paths:**
`completeBridgePlan` rejects `weak_scrap_only` and blocks on missing UTM tests
(`ConstructionSystem.js:18-27`); `repairBridge` refuses without a plan (`:41`); `unlockWiderMap`
refuses until the bridge is reconnected (`Act1RuntimeSystem.js:277`). Every step reinforces one
theme — *test before you trust* — and feeds the same notebook/trust/audio handlers. This is a
coherent, complete-able (~1.5 min) loop.

**Legacy:** 21 top-level quests (`data/quests.js`, 1690 LOC) + a 23-entry quest board
(`data/questBoard.js`) + 27 language quests + 10 cognitive quests. Per-quest schema is rich
(`steps[]` with `dialogue|inspect|use_item|quiz|explainer|complete` types, `reward{items,xp,
zuzubucks,reputation}` — `quests.js:21-98`). But quests are **standalone**, reputation-gated, and
spread across scenes with no single authored throughline; the prior audit found much of this
sandbox is off the playable path.

**Verdict: Rebuild wins on flow, coherence, and end-to-end wiring.** Legacy has more quests but no
spine; the rebuild's chain is the only thing that actually plays start-to-finish as a designed arc.

## 3. Progression — **TIE** (different philosophies)

**Legacy** = systemic gating: a **reputation economy** (`reputation:10/20/35`) + per-quest XP +
**Zuzubucks currency** (`quests.js:93-97`) + knowledge-concept unlocks + `milestoneEngine.js`
(435 LOC) gate access to new scenes (`sceneRegistry.isSceneUnlocked:401-444`). Real metagame loop.

**Rebuild** = narrative gating: progression IS the linear quest chain; the only "currency" is
**evidence** (tested materials unlock the plan; the plan unlocks the repair; the repair unlocks the
map — `ConstructionSystem.js` + `Act1RuntimeSystem.js:201-289`). There is **no XP, currency, or
reward economy** in the live game (`runtime_reality_audit.md:154-155`). Notebook clue count
(13/16) is the visible progress meter.

**Verdict: Tie.** Legacy offers a richer, replayable metagame economy; the rebuild offers tighter,
more legible cause→effect progression. Neither dominates; they optimize for different goals.

## 4. Mystery — **REBUILD WINS (slight)**

**Rebuild:** A focused central question ("Something's Wrong at the Wash" → why is the bridge unsafe,
which materials can be trusted) with a deliberate cliffhanger: the wider-gate clue shows "a wheel, a
bridge, and something shaped like a tiny spacecraft frame" (`act1Dialogue.js`, `wider_gate_clue`),
explicitly teasing a larger systems mystery (`unlockWiderMap` feedback `:287`). One mystery, well
seeded.

**Legacy:** Mystery is **distributed** across many independent quest hooks (cognitive deduction
puzzles like "The Silent Leak", "Navigation Without Map" — `arizonaCognitiveQuests.js`), but there's
no overarching authored enigma binding them; the `invisible_map`/`toxic_knowledge` quests gesture at
intrigue but stand alone.

**Verdict: Rebuild wins slightly** — its single, deliberately-seeded Act-1 mystery with a sequel
hook reads as authored intent; legacy's mysteries are puzzle-sized and uncoordinated.

## 5. Discovery — **LEGACY WINS (slight)**

**Legacy:** Discovery is spatial and rewarded — `discoverySystem.js` + `discoveryBridge.js` +
`foragingSystem.js` (275 LOC) let players physically find plants/ore/animals across biomes;
`knowledgeSystem.js` + `discoveryUnlocks.js` convert finds into concept unlocks. Exploring an
unlocked scene reveals new species and recipes.

**Rebuild:** `DiscoveryMapSystem.js` (45 LOC) is a flag-setting map of named nodes
(`discover('dry_wash')`, `discover('bridge')` — `Act1RuntimeSystem.js:150-151`); discovery is
**scripted by interaction**, not emergent exploration. The Field Notebook (13/16 clues) is a strong
*record* of discovery but the discoveries themselves are on-rails.

**Verdict: Legacy wins slightly** on emergent, spatial discovery; the rebuild's discovery is real but
authored and linear.

## 6. Educational integration — **TIE** (Legacy breadth / Rebuild focus)

**Legacy:** Enormous curricular surface — `scienceInteractions.js` (384), `materialEngine.js`,
`batteryChemistry.js`, `chemistrySystem.js`, `biologySystem.js`, `ecologyEngine.js`,
`geneticEngineering.js`, plus `education/` (784 LOC) and explicit `learningGoal`/`lessonTitle`/
`presentation[]` slides inside quests (`quests.js` `bridge_collapse.triangle_bridge_lesson` with a
4-panel bridge-engineering lecture). Covers physics, materials, chemistry, ecology, genetics,
pharmacology. **But** prior audit: biology Stage 2/3 throws, much is content/design not wired.

**Rebuild:** Education is **embedded in the mechanic, not bolted on as a lesson**. The UTM produces
real comparative evidence (strength/deformation/usefulness bands from material properties —
`MaterialsLabSystem.testMaterial:16-44`), the bridge plan teaches load paths
(`ConstructionSystem.js:28-36` `loadPath:['deck','support','triangle_brace','ground']`), ecology
teaches harvest ethics (`act1Ecology.js` `harvestEthic`), and notebook entries phrase each lesson in
child-readable terms (`act1NotebookEntries.js:1-16`). Narrow (bridge/materials/ecology/chemistry/
language) but every lesson is reachable and reinforced by play.

**Verdict: Tie.** Legacy has vastly more *topics*; the rebuild has *better-integrated, actually-
playable* pedagogy. Breadth vs depth-of-integration cancel out.

## 7. Vehicle interaction — **LEGACY WINS (decisive)**

**Legacy:** A genuine vehicle-engineering model. `ebikeSystem.js` (160 LOC) builds a **system graph**
merging bike + battery + electrical sub-graphs, runs `simulationEngine.js` (920 LOC) with cross-
system constraints (voltage matching, current limits — `ebikeSystem.js:1-46`), and computes range,
top speed, efficiency, build score, errors/warnings (`getEbikeMetrics:116-145`, `computeRange:156`).
Backed by data: `BIKE_PARTS` (153 LOC), `EBIKE_PARTS` (143), `batteryParts.js` (214) with weights,
voltages, costs, dependency rules (`bikeParts.js:8-52`). Mining + factory systems exist for sourcing
parts.

**Rebuild:** `BikeSystem.js` is a **31-LOC two-boolean stub** — `checked` and `upgraded` flags,
`checkBike()`/`upgradeBike()` set them true, no model, no parts, no simulation
(`BikeSystem.js:8-31`). The bike is narrative furniture ("inspect the bike" completes an objective).

**Verdict: Legacy wins decisively.** This is the clearest gap. Legacy has a real multi-domain vehicle
simulator with e-bike/battery/electrical integration; the rebuild has a flag.
**Caveat:** `ebikeSystem`/`miningSystem`/`factorySystem` have **zero imports** outside their own
files (verified) — the legacy vehicle sim is *built but orphaned*, so neither tree exposes deep
vehicle play to a live player. Legacy still wins on engineering substance.

## 8. Repair systems (bridge) — **TIE** (different strengths)

**Legacy:** `DryWashScene.js` (604 LOC) hosts a **3-phase, click-to-place bridge-construction
minigame** (`construction/constructionSystem.js`, 559 LOC) driven by `BRIDGE_MESQUITE_BLUEPRINT`:
visit phase → build phase (mount construction system at the `build_bridge` quest step) → post-build
finished sprite (`DryWashScene.js:7-28,344-394`). The `bridge_collapse` quest teaches truss theory
with a 4-panel lecture + quiz before building (`quests.js` `triangle_bridge_lesson`,
`quiz_triangle_truss`). Tactile *place-each-beam* interaction.

**Rebuild:** A **rule-checked design loop** rather than a placement minigame. The player must (1) test
4 materials in the UTM, (2) build a plan that the system *validates against the test evidence*
(rejects weak scrap, blocks on missing tests — `ConstructionSystem.js:18-27`), (3) repair (refused
without a plan, `:41`), (4) cross. Repair produces a scripted **emotional beat**: before/transition/
after narration + social acknowledgement ("Mr. Chen nods: 'You did not guess. You tested, then
built.'") + a child-summary (`ConstructionSystem.js:43-49`).

**Verdict: Tie.** Legacy's repair is more *tactile and interactive* (place beams, see it collapse if
wrong-shaped). Rebuild's repair is more *coherent and evidence-gated* (you cannot build until your
data justifies the design) and is **the only one wired into a complete, reachable quest chain**.
Tactility vs evidence-rigor + reachability balance out.

## 9. Workbench / testing systems — **TIE** (lean Rebuild)

**Legacy:** Deep but fragmented. `MaterialLabScene` + `ThermalRigScene` (a thermal-expansion rig),
`materialTestingEngine.js` (~360 LOC stress-strain physics), `craftingSystem.js` (389),
`workbenchRecipes.js`, `recipes.js`, `materials/` (1260 LOC), `factorySystem.js` (248). Multiple
specialized benches; richer physics. But spread across scenes and partly orphaned (`craftingSystem`
imported only by data files; `factorySystem` 0 imports — verified).

**Rebuild:** One UTM + one chemistry bench, both **fully wired** into the quest chain.
`MaterialsLabSystem.testMaterial` computes a score, deformation band, strength band, tactile cue and
best-use from real material properties (`:16-44`); `hasTested` gates the bridge plan. `ChemistrySystem`
(39 LOC) runs a mix→dry→test recipe. Fewer benches, less physics depth, but every test produces
evidence that *matters* to the next step.

**Verdict: Tie, leaning Rebuild for product purposes.** Legacy has more workbench *types* and deeper
materials physics; the rebuild has a single testing loop that is consequential and reachable. Depth
vs consequence-of-use balance; reachability tips it slightly toward the rebuild.

---

## Summary

Legacy wins **exploration, vehicle interaction (decisive), and discovery**; Rebuild wins **quest
flow/coherence and mystery**; **progression, educational integration, bridge repair, and workbench
systems are ties** with opposite strengths (legacy = breadth/depth/tactility, rebuild =
coherence/evidence-rigor/reachability). The legacy tree is a genuinely impressive but largely-
orphaned engineering sandbox (24 scenes, e-bike system graph + 920-LOC sim, 6-region language model,
54+ quests) that **does not load at `/game-rebuild`**; the rebuild is a thin (4.9k-LOC), one-scene,
11-quest slice whose every system is wired, honest about failure, and actually playable end-to-end.
Neither is a global winner: legacy is the better *parts bin and simulator*, the rebuild is the better
*game*.
