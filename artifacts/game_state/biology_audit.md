# Biology Audit — Phase 6 (Evidence-Based Reality)

**Scope:** biology workbench, ecology systems, Sonoran dataset, educational/biology content, simulation.
**Rule applied:** reality > design docs; runtime > docs; implementation > architecture.
**Live runtime under audit:** `src/game/` tree (`/game-rebuild`). The `src/renderer/game/` tree is `/legacy-play` — OFF the shipping path.
**Date of audit basis:** 2026-06-02.

---

## TL;DR classification table

| Area | What it is | Classification |
|---|---|---|
| Live "biology" experience (`src/game/`) | Ecology *observation* of 4 named desert species (no simulation) | **Functional Prototype** (data-flagging, not biology) |
| Live materials/UTM workbench | Deterministic material-property scoring + deformation visualizer | **Functional Prototype** (the one polished science loop) |
| Live chemistry "workbench" | 2 hard-coded recipes, no real mixing | **Stub** |
| Renderer biology workbench (`systems/biology/`, legacy) | Stage-1 recipe engine real; Stage 2/3 throwing stubs | **Partial** (off-path) |
| Renderer ecology (`systems/ecology/`, legacy) | Static FLORA/FAUNA graph + observe/forage hooks; no population sim | **Partial** (off-path) |
| `simulationEngine.js` (legacy) | Graph **validator** for bike/battery/e-bike builds — NOT biology, NOT a time-stepper | **Functional** (but it is a vehicle build-checker, mislabeled) |
| Sonoran dataset (`data/sonoran/plants.sonoran.js`) | 12 plant records, `draft_unverified`, 0 JS importers | **Documentation / Data Only** |
| `ethnobotany / phytochemistry / pharmacology / reasoning / knowledgeState` | Lone `*-substrate.md`, 0 JS | **Design Only** |
| `artifacts/biology_next_phase/*.md`, `data/curriculum/chapter-map.md` | Roadmaps/quest sets/frameworks authored recently | **Design Only** |

---

## 1. What is PLAYABLE today (live `src/game/` runtime)

The live runtime instantiates exactly these systems in `Act1RuntimeSystem`
(`src/game/phaser/systems/Act1RuntimeSystem.js:36-48`) and binds them to the
Phaser registry (`:55-70`). The only scene that consumes them is
`NeighborhoodScene.js` (1586 LOC). There is **no biology system on the live
path at all** — the word "biology" appears in zero live-tree files; the
nearest live analogue is *ecology observation*.

### 1a. Ecology Observation — `EcologyObservationSystem.js` (35 LOC)
- **What runs:** `observe(speciesId)` adds an id to a `Set` and returns the
  static record (`EcologyObservationSystem.js:15-20`). State = "which of 4
  species have I clicked."
- **Data:** `act1Ecology` — **4 hand-authored records** (mesquite, creosote,
  saguaro, wash_marker) with prose fields `heat / water / habitat /
  harvestEthic` (`src/game/data/act1/act1Ecology.js:1-6`). These are
  **strings, not parameters** ("shade maker", "deep roots").
- **In-scene:** one interaction zone `ecology_patch` →
  `action:'ecology_patch'` (`NeighborhoodScene.js:730-735`) which collects
  mesquite, unlocks notebook entries, and calls `observeEcology('mesquite')`
  (`Act1RuntimeSystem.js:166-171, 234-248`). A small `EcologyVisualizer`
  container renders the patch (`NeighborhoodScene.js:937+`).
- **Verdict:** This is **observation-and-flag**, not biology. No organisms,
  no populations, no interactions between species, no time. It teaches "name
  the plant and respect harvest limits" via static prose. **Functional
  Prototype of a field-guide, not a living system.**

### 1b. Materials / UTM Workbench — `MaterialsLabSystem.js` (71 LOC)  ← strongest science loop
- **What runs:** `testMaterial(id)` computes a deterministic `score` and
  `deformation` from fixed material properties
  (`MaterialsLabSystem.js:19-20`), maps them to readable bands
  ("strong candidate" / "useful with limits" / "comparison failure",
  `:34-36`), and records a tactile cue (`:22-26`).
- **Data:** `act1Materials` — 4 materials with real numeric properties
  (tensile/compressive/elasticity/brittleness/bridgeUsefulness),
  `src/game/data/act1/act1Materials.js:1-62`.
- **Visualizer:** `createUtmVisualizer` / `updateUtmVisualizer`
  (`NeighborhoodScene.js:868-917`) physically scales/rotates the sample
  rectangle by `deformation` and flips the label to "holds shape / bends some
  / fails test" — the deformation is **visibly rendered**, not just text.
- **Caveat (honesty):** the live UTM interaction tests **all four materials in
  one click** — `utm: () => ['mesquite','steel','copper_brace','weak_scrap']
  .map(id => testMaterial(id))` (`Act1RuntimeSystem.js:173`). There is **no
  interactive per-material prediction prompt**; "predict-then-test" is a
  *theme* ("Test before you trust", quest `test_materials`,
  `act1Quests.js:42-53`; trader dialogue, `act1Dialogue.js`), realized as a
  visualization, not as a captured hypothesis the game checks.
- **Verdict:** **Functional Prototype** and the single most credible
  science-learning artifact in the build. It is *materials engineering*, not
  biology — but biology rides on the same `act1Ecology` data and only reaches
  the "observation" tier.

### 1c. Construction — `ConstructionSystem.js` (81 LOC)
- Real gate: `completeBridgePlan` refuses unless all 4 materials were tested
  (`ConstructionSystem.js:25-27`) and rejects a weak-scrap-only plan
  (`:18-23`). This is the **one place the runtime enforces "use your
  evidence."** Not biology, but the strongest *engineering-from-evidence*
  moment. **Functional Prototype.**

### 1d. Chemistry — `ChemistrySystem.js` (39 LOC)
- `runRecipe` looks up one of **2 hard-coded recipes** and returns a canned
  explanation string with `stages:['mix','wait','test']`
  (`ChemistrySystem.js:18-26`; data `act1Chemistry.js:1-4`). No reagent
  combination, no failure modes, no parameters. **Stub** dressed as a loop.

### 1e. Notebook / Trust / Language (supporting)
- `NotebookSystem` (64 LOC): unlock/track 16 evidence cards
  (`act1NotebookEntries.js`, 16 entries). Real progress-tracking; this is the
  "13/16 clues" Field Notebook. **Functional Prototype.**
- `TrustSystem` (35 LOC): integer trust counters for 3 NPCs
  (`TrustSystem.js:8-22`). **Stub-tier social layer.**

---

## 2. What is only ARCHITECTURE (real JS, off-path or stubbed)

These live in `src/renderer/game/` (`/legacy-play`). **Confirmed: nothing in
`src/game/` imports them** (`grep "systems/biology" src/game/` → no hits).

### 2a. Biology Workbench — `systems/biology/` (1181 LOC, 7 JS + 44 KB substrate)
- **Real Stage 1:** `Stage1RecipeEngine.js` (166 LOC) +
  `recipeRegistry.js` + `Recipe.js`/`Organism.js` validators implement a
  working recipe-attempt/outcome-event surface (`index.js:61-141`).
- **Stage 2 & 3 are THROWING STUBS** — every one is "halt-and-surface":
  `designOrganism`, `validateOrganism`, `emitOrganismDesignEvent`
  (`index.js:158-185`), `createEcosystem`, `introduceOrganism`,
  `stepSimulation`, `observeEcosystemState`, `emitSimulationEvent`
  (`index.js:200-255`), `upgradeOrganismToNextStage` (`:268-270`) — each is
  `throw new Error('... deferred ...')`. **There is no organism design and no
  ecosystem simulation anywhere in the codebase.**
- **Importers:** only the renderer tree imports it (`biologySystem.js`,
  `geneticEngineering.js`, and the legacy `NeighborhoodScene` references
  `biologySystem`). **Off the shipping path.**
- **Classification: Partial (Stage 1 only), off-path.**

### 2b. Ecology Engine — `systems/ecology/` (2000 LOC)
- Real read-only graph: `speciesResolver.js` (297 LOC) wraps static
  `data/flora.js` / `data/fauna.js` (`speciesResolver.js:30-31`) with
  by-biome / by-time accessors. `ecologyTicker.js` (230 LOC) is an **opt-in
  visibility/time-of-day ticker that toggles interaction zones** — it
  explicitly "does not destroy entities at runtime" and is **not a population
  simulator** (`ecologyTicker.js:6-39,153`).
- **`registerProcedural(scene, options)` throws** — "deferred to Phase 6"
  (`ecology/index.js:422-423`). So even procedural population spawning is a
  stub.
- **No dynamic/population simulation exists.** This is a static relationship
  graph + observe/forage event emitters (`emitObservation`/`emitForage`,
  `index.js:437-456`). **Classification: Partial, off-path.**

### 2c. `simulationEngine.js` (legacy `systems/simulationEngine.js`)
- Self-described as "validates builds and produces scored results" for
  **bike / battery / e-bike** system graphs (`simulationEngine.js:1-38`). It
  calls `validateGraph` + material-engine load tests and returns
  `{success, errors, warnings, score, metrics}`. Helpers `isBikeRideable`,
  `isBatterySafe` (`:902-920`).
- **It is a graph VALIDATOR, not a time-stepper, and not biology.** No
  `deltaTime`, no population step. **Functional (as a vehicle build-checker),
  mislabeled as "simulation."**

---

## 3. What is only DOCUMENTATION / DATA (no JS, no imports)

### 3a. Sonoran dataset — `data/sonoran/plants.sonoran.js`
- **12 plant records** (verified `grep -c scientific_name` = 12), each with
  ecology/culture/ethnobotany/chemistry/pharmacology/biology facets
  (`plants.sonoran.js:38+`). **Provenance `draft_unverified`**; indigenous
  culture **gated** (`requiresHumanBrief:true`, `:34`).
- **Zero JS importers** — referenced only by sibling docs (`README.md`,
  `data/curriculum/chapter-map.md`). **Data Only / unwired.**

### 3b. Design-only substrates (0 JS)
- `systems/ethnobotany`, `systems/phytochemistry`, `systems/pharmacology`,
  `systems/reasoning`, `systems/knowledgeState` each contain **exactly one
  `*-substrate.md` and no `.js`** (verified `find ... -name "*.js"` → empty).
  **Design Only.**

### 3c. Roadmaps & quest sets — `artifacts/biology_next_phase/*.md`
- 10 markdown docs (architecture audit, knowledge graph, food-web substrate,
  Stage-2/3 plans, Chapter-1 100-quest taxonomy, progression framework,
  dataset expansion plan). **All design; none generate runtime behavior.**

---

## 4. Brutally honest summary

There is **no biology and no simulation in the shipping game**. The live
runtime's "biology/educational" experience is (a) a deterministic
materials-testing visualizer (the genuine, polished piece), (b) a static
4-species ecology *field-guide* with harvest-ethics prose, and (c) a
canned 2-recipe chemistry stub — all wired through a notebook tracker. The
~3 KLOC of real biology/ecology JS in the renderer tree is off-path and its
dynamic parts (organism design, ecosystem step, procedural population) are
**explicit throwing stubs**. The Sonoran dataset and the five "-ology"
substrates are unwired documents. The elaborate Grade-2→4 curriculum is a
design framework, not implemented behavior.
