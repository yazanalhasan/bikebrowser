# BikeBrowser — Per-Subsystem Comparison (Phase 7)

**Method:** Real code read in both trees, cited `file:line`. Each subsystem scored independently:
**Legacy Wins / Rebuild Wins / Tie**. No global winner is declared. The headline tension —
*legacy has far more systems but they are uneven (some throw, some unreachable); rebuild has fewer
systems but they are all wired, clean, and coherent* — is quantified per row. **Reality > design
docs:** a deep legacy engine that no live scene calls is scored as *breadth/quality of code*, with the
reachability caveat stated explicitly.

**Date:** 2026-06-02

---

## Scope / depth at a glance

- **Legacy** runtime: ~34k LOC, 40+ systems, ~18 reachable scenes. Greatest depth, lowest evenness.
  Some headline systems throw (`biology` Stage 2/3) or feed unreachable scenes.
- **Rebuild** runtime: ~3.5k LOC, 20 systems, 1 scene. Lowest depth, highest evenness/polish. Every
  system is instantiated and bound by `Act1RuntimeSystem.js:36-69`.

---

## 1. Quest engine

- **Legacy** — `systems/questSystem.js` (287 LOC). Functional, save-state-driven. **Enforced** typed
  steps: `use_item` checks inventory (`questSystem.js:174-182`), `forage`/`craft`/`observe`/`quiz`
  gate advancement (`:184-226`), `quiz` rejects wrong answers (`:218-226`). Rewards = items +
  Zuzubucks + reputation (`finishQuest`, `:247-287`). Discovery→quest bridge + reachability audit
  (`:39-94`). Data: **21 quests**, `data/quests.js` (1,690 LOC).
- **Rebuild** — `systems/QuestSystem.js` (95 LOC). Map/Set tracker; `completeObjective`→
  `maybeCompleteQuest`→advance `next` (`QuestSystem.js:17-49`). **No enforcement** — objectives are
  displayed but any zone fires on press-E (`NeighborhoodScene.js:1145-1146`,
  `runtime.handleInteraction(nearest.action)` with no step-gate). Data: **10 quests / 30 objectives**,
  clean and coherent.
- **Depth/quality:** Legacy is deeper and actually *gates* play; rebuild is cleaner but cosmetic.
- **Verdict: LEGACY WINS** (real progression enforcement + 2× the quests).

---

## 2. Inventory

- **Legacy** — `systems/inventorySystem.js` (53 LOC) over `data/items.js`. Add/remove/has/resolve
  with metadata fallback (`inventorySystem.js:11-52`); consumed by quest `use_item` gates and crafting.
- **Rebuild** — `systems/InventorySystem.js` (32 LOC). A `Set` of item ids
  (`InventorySystem.js:8-22`); seeded with `bike/patch_kit/tire_lever`. No quantities, no metadata,
  no remove, no UI to open (per runtime audit).
- **Depth/quality:** Comparable scope (both thin), but legacy resolves metadata, supports removal, and
  is wired into quest gating; rebuild's is a membership set used only to flip flags.
- **Verdict: LEGACY WINS** (narrow — both are simple).

---

## 3. Dialogue

- **Legacy** — adaptive stack: `dialogueDifficulty.js` (118), `npcLanguageSystem.js` (339),
  `languageProgressionSystem.js` (318), `languageCoachAssistant.js` (339), data
  `npcDialogueTemplates.js` (469) + `dialogueTemplates.js` (241). Difficulty banding + heritage-language
  progression + AI enrichment.
- **Rebuild** — `systems/DialogueSystem.js` (48 LOC): linear line walker over 11 static entries
  (`DialogueSystem.js:10-47`), one-and-done, no branching. Carries emotion/pacing/voiceId metadata but
  audio is disabled (`createGame.js:37 noAudio:true`).
- **Depth/quality:** Legacy is vastly deeper (adaptive, multilingual). Rebuild is cleaner-rendered but
  static.
- **Verdict: LEGACY WINS** (depth), with the caveat that the rebuild's static lines are coherent and
  bug-free while the legacy adaptivity is partly unverified at runtime.

---

## 4. Workbenches (materials lab / labs)

- **Legacy** — full lab scenes: `MaterialLabScene.js` (911) + `LabRigBase.js` (923) +
  `ThermalRigScene.js` (368), backed by `lab/scaleStation.js`, `lab/calipers.js`,
  `lab/densitySlate.js`, `lab/densityChart.js`, `materials/materialTestingEngine.js` (379),
  `materialEngine.js` (761). Real instruments: weigh, caliper, density chart, thermal rig.
- **Rebuild** — `systems/MaterialsLabSystem.js` (71). One UTM "test": score = mean of 5 numeric props,
  deformation + strength bands + a child-readable tactile cue (`MaterialsLabSystem.js:16-44`) over **4**
  materials. The UTM visualizer animates in `NeighborhoodScene`.
- **Depth/quality:** Legacy has a multi-instrument lab with real measurement workflows; rebuild has one
  tidy animated UTM test. Legacy is far deeper *and* reachable (a genuine strength).
- **Verdict: LEGACY WINS.**

---

## 5. Repair / construction

- **Legacy** — `systems/construction/constructionSystem.js` (559). General **place-parts → validate →
  permanent world change** engine: click *or* drag placement, ghost/placed render hooks, per-slot
  `requiredItem` gates, persistence, completion dispatch (`constructionSystem.js:82-90`, JSDoc
  `:21-80`). First consumer `DryWashScene.js` (604) — a real click-to-place mesquite-beam bridge build
  with a load-test bike animation (`DryWashScene.js:1-44`, `BUILD_STEP_INDEX=14`).
- **Rebuild** — `systems/ConstructionSystem.js` (81). **Evidence-gated** but not interactive:
  `completeBridgePlan` refuses unless all 4 materials were tested (`ConstructionSystem.js:25-27`) and
  rejects weak-scrap (`:18-23`); `repairBridge` swaps the sprite + celebration FX. No placement — the
  plan is hardcoded (`:28-37`).
- **Depth/quality:** Different strengths. Legacy = a real *interactive* build minigame (place each
  beam). Rebuild = a tighter *pedagogical* gate ("you tested before you built") with polished FX, but
  the player doesn't actually construct anything.
- **Verdict: LEGACY WINS** on interactivity/depth; the rebuild's evidence-gating is the cleaner
  *lesson* but is mechanically thinner.

---

## 6. Biology systems

- **Legacy** — `systems/biology/**`: Stage-1 recipe engine is **real** (`registerRecipe`,
  `attemptRecipe`, event-driven outcomes, `Organism`/`Recipe` classes — `biology/index.js:61-141`).
  But **Stage 2 (parametric) and Stage 3 (simulation) THROW** — `designOrganism`, `validateOrganism`,
  `createEcosystem`, `stepSimulation`, `observeEcosystemState` all
  `throw new Error(...DEFERRED)` (`biology/index.js:158-255`). `biologySystem.js` (399) +
  `geneticEngineering.js` (426) add more surface. Design-only dirs `ethnobotany/pharmacology/
  phytochemistry/reasoning` are **`.md` only, 0 JS**.
- **Rebuild** — **no biology system at all.**
- **Depth/quality:** Legacy has a working Stage-1 plus a large but **non-functional** (throwing)
  Stage 2/3 surface; the rebuild simply has nothing here.
- **Verdict: LEGACY WINS** (it has *something* real at Stage 1), but heavily caveated — the impressive
  parts (organism design, ecosystem sim) are throwing stubs, so this is "breadth of intent," not
  shipped depth.

---

## 7. Engineering systems (vehicles / battery / factory / crafting)

- **Legacy** — broad: `ebikeSystem.js`, `batterySystem.js`, `batteryChemistry.js` (331),
  `miningSystem.js` (302), `factorySystem.js` (248), `craftingSystem.js` (389),
  `foragingSystem.js` (275), `materialEngine.js` (761, real deformation/fracture/fatigue/thermal —
  `applyForce` at `materialEngine.js:30-69`). A genuine multi-domain engineering sandbox.
- **Rebuild** — `systems/BikeSystem.js` (31) is a flag holder: `checkBike()`/`upgradeBike()` set
  booleans (`BikeSystem.js:13-21`). No battery/factory/crafting/mining.
- **Depth/quality:** No contest on breadth or physical fidelity.
- **Verdict: LEGACY WINS** decisively.

---

## 8. Simulation systems

- **Legacy** — `systems/simulationEngine.js` (928): graph-validated build scoring with
  errors/warnings/metrics and per-failure explanations (`simulationEngine.js:1-60+`), built on
  `systemGraph.js` (369) + `materialEngine.js`; plus `stressSimulation.js` (421),
  `ecologyEngine.js` (485 — seeded procedural flora/fauna, `hashPosition` PRNG at
  `ecologyEngine.js:22-30`). This is the legacy's strongest engineering asset.
- **Rebuild** — **no simulation engine.** `EcologyObservationSystem.js` (35) records an observed Set;
  `ChemistrySystem.js` (39) composes an explanation string (`ChemistrySystem.js:15-27`). Nothing
  time-steps or scores.
- **Depth/quality:** Legacy has real simulation/validation; rebuild has observation stubs.
- **Verdict: LEGACY WINS** decisively (caveat from prior audit: legacy *biology* dynamic sim throws,
  but `simulationEngine`/`ecologyEngine` themselves are real and run).

---

## 9. Notebook / learning artifact (added — rebuild's strong card)

- **Legacy** — journal lines + `explainers/` + `curriculum/` + `knowledgeConcepts.js`; scattered, not a
  single cohesive artifact.
- **Rebuild** — `systems/NotebookSystem.js` (64) + `act1NotebookEntries.js` (**16 authored entries**
  spanning Bike/Observation/Construction/Material/Test/Ecology/Chemistry/Language/Trust/Map). A
  3-tab in-world Field Notebook that is the spine of the learning loop.
- **Verdict: REBUILD WINS** — coherent, age-appropriate, central learning artifact vs legacy's
  scattered journal/explainer data.

---

## 10. Trust / heritage-language social layer

- **Legacy** — full language progression + coach (deep, see §3) but social "trust" is implicit.
- **Rebuild** — explicit `TrustSystem.js` (35) with per-character trust + milestones
  (`TrustSystem.js:18-23`) and `LanguageSystem.js` (32) surfacing Spanish/Arabic *in relationship,
  not as a quiz*. Small but clean and shipped.
- **Verdict: TIE** — legacy has deeper language tech; rebuild has a cleaner, actually-wired
  trust+heritage social loop. Different axes, both real.

---

## 11. Art pipeline / asset integrity

- **Legacy** — mixed: some Aseprite, heavy reliance on in-code Phaser Graphics fallbacks; no central
  provenance registry.
- **Rebuild** — `systems/AssetRegistry.js` (368) with tiered art (curated/final/generated/placeholder),
  provenance fallback chain, `PLACEHOLDER_ASSET_CONTRACT`, and `CharacterArtAuditBridge.js` (115). 4
  final animated characters passed the character-art audit.
- **Verdict: REBUILD WINS** — disciplined, auditable asset pipeline and finished characters, even
  though much *environment* art is still placeholder geometry (per runtime audit).

---

## Scorecard

| Subsystem | Verdict | One-line why |
|---|---|---|
| Quest engine | **Legacy** | enforced typed steps + 21 quests vs tracked-only 10 |
| Inventory | **Legacy** | metadata + removal + quest gating vs membership Set |
| Dialogue | **Legacy** | adaptive/multilingual vs static line walker |
| Workbenches | **Legacy** | multi-instrument labs vs one UTM test |
| Repair/construction | **Legacy** | interactive place-each-beam build vs hardcoded plan |
| Biology | **Legacy** (caveated) | Stage-1 real; Stage 2/3 throw; rebuild has none |
| Engineering | **Legacy** | battery/factory/crafting/material physics vs flag stub |
| Simulation | **Legacy** | real graph validator + ecology PRNG vs none |
| Notebook/learning artifact | **Rebuild** | cohesive 16-entry Field Notebook vs scattered journal |
| Trust/heritage social | **Tie** | legacy depth vs rebuild's clean wired loop |
| Art pipeline | **Rebuild** | provenance registry + finished characters |

**Tally:** Legacy 7 (1 heavily caveated), Rebuild 2, Tie 1. **But scope-weighted reality:** Legacy
wins on *system breadth and depth* almost everywhere it competes — yet a large fraction of that breadth
is uneven (throwing Stage 2/3 biology, `.md`-only design dirs, and per prior audit unreachable scenes
behind a stub WorldMap). The Rebuild wins exactly where it chose to invest — a single coherent,
fully-wired, polished Act-1 vertical slice (notebook + characters + UTM/bridge loop) with **zero dead
systems**. **No global winner is declared:** legacy is the bigger, deeper, lumpier engine; rebuild is
the smaller, smoother, finished slice.
