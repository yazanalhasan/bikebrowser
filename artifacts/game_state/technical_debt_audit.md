# BikeBrowser — Technical Debt Audit (Phase 8)

**Audit date:** 2026-06-02
**Method:** Read-only. Severity: Critical / High / Medium / Low.

---

## CRITICAL

### 1. Two parallel game trees, both live, with confusingly inverted routes
- `src/game/` — 49 JS files, **4918 LOC**. Served at **`/game-rebuild`** (`App.jsx:80` → `GameRebuildPage.jsx` → `src/game/GameShell.jsx` → `src/game/phaser/createGame.js`). This is the *polished Act 1 slice* — the route name says "rebuild," implying it's the new product.
- `src/renderer/game/` — 173 JS files, **51026 LOC**. Served at **`/legacy-play`** (`App.jsx:81` → `GamePage.jsx` → `src/renderer/game/GameContainer.jsx`). The route name says "legacy," yet this is the *larger, newer-systems* tree.

**The naming is backwards relative to size and is a trap for any future contributor.** A 10× LOC tree (the systems sandbox) is routed as "legacy"; a 5k slice is routed as "rebuild." Both boot in production (`all-scenes.snapshot.spec.js:90,136` snapshots both `/game-rebuild` and `/legacy-play`).

**Duplication quantified — same concepts implemented twice:**

| Concept | `src/game/` (live, /game-rebuild) | `src/renderer/game/` (sandbox, /legacy-play) |
|---|---|---|
| NeighborhoodScene | `phaser/scenes/NeighborhoodScene.js` (1586 LOC, polished) | `scenes/NeighborhoodScene.js` (legacy-compat) |
| WorldMapScene | `phaser/scenes/WorldMapScene.js` (5 LOC stub) | `scenes/WorldMapScene.js` (1705 LOC, full) |
| Quest system | `phaser/systems/QuestSystem.js` | `systems/questSystem.js` (+ sideQuestSystem) |
| Inventory | `phaser/systems/InventorySystem.js` | `systems/inventorySystem.js` |
| Dialogue | `phaser/systems/DialogueSystem.js` + `DialogueScene.js` | `data/npcDialogueTemplates.js` + `npcLanguageSystem.js` |
| Ecology | `phaser/systems/EcologyObservationSystem.js` | `systems/ecology/` (8 files) + `ecologyEngine.js` |
| Construction | `phaser/systems/ConstructionSystem.js` | `systems/construction/constructionSystem.js` |
| Materials | `phaser/systems/MaterialsLabSystem.js` | `systems/materials/` (6 files) |
| Save | `phaser/systems/SaveSystem.js` | `systems/saveSystem.js` |
| Chemistry | `phaser/systems/ChemistrySystem.js` | `systems/chemistrySystem.js` |
| Quest data | `data/act1/act1Quests.js` (706 LOC total act1 data) | `data/quests.js` (1690 LOC) |

**~20 systems are implemented twice.** The live slice (`src/game`) reimplemented the systems it needed from scratch rather than reusing the 51k-LOC sandbox — meaning the bulk of `src/renderer/game` systems work (ecology substrate, simulationEngine, biology recipes) is **not in the shipping path**.

**Cross-tree contamination:** `git status` shows a SECOND legacy `src/game/phaser/scenes/NeighborhoodScene.js` plus `src/game/data/act1/act1AssetManifest.js` are under active edit *simultaneously* with `src/renderer/game` changes — both trees are being touched, multiplying maintenance cost.

### 2. Ecology implemented THREE times within the sandbox tree alone
- `src/renderer/game/systems/ecology/` (new 8-file substrate, used by 2 scenes)
- `src/renderer/game/systems/ecologyEngine.js` (legacy procedural, used only by legacy `NeighborhoodScene.js`)
- `src/renderer/game/systems/foragingSystem.js` + `scienceInteractions.js` (further ecology entry points)
Plus the live tree's `EcologyObservationSystem.js`. **Four ecology implementations across the repo.**

---

## HIGH

### 3. Design docs masquerading as systems (`.md` in `systems/` dirs)
Five `systems/` subdirectories contain **zero JS** — only substrate markdown — yet sit alongside real systems implying they're implemented:
- `systems/ethnobotany/ethnobotany-substrate.md` (24KB) — authored 2026-06-02
- `systems/phytochemistry/phytochemistry-substrate.md` — authored 2026-06-02
- `systems/pharmacology/pharmacology-substrate.md` — authored 2026-06-02
- `systems/reasoning/reasoning-substrate.md` — authored 2026-06-02
- `systems/knowledgeState/knowledge-state-substrate.md` (61KB)

Verified: **0 ESM imports** of any of these (`grep "import.*from.*(ethnobotany|phytochemistry|pharmacology|reasoning|knowledgeState)"` → empty). They look like systems in a directory listing but are pure design. The biology/ecology dirs also each carry a `*-substrate.md` (42KB ecology, 44KB biology) inflating perceived implementation.

### 4. Orphaned "real" systems — code exists, 0 imports
Implemented JS that nothing wires in (dead-on-arrival):
- `systems/geneticEngineering.js` — imported by 0 files
- `systems/factorySystem.js` — imported by 0 files (+ `data/factories.js` unused)
- `systems/biology/` — full Stage-1 recipe engine, but **imported by no scene** (only `data/recipes.js` + the orphaned geneticEngineering reference it)
- `systems/miningSystem.js` — imported by 0 files

### 5. Halt-and-surface stubs shipped as API
`systems/biology/index.js:158-255` exports 8 functions (designOrganism, validateOrganism, createEcosystem, introduceOrganism, stepSimulation, observeEcosystemState, emitSimulationEvent, upgradeOrganismToNextStage) that **all `throw` "deferred to Phase 5/6."** `systems/ecology/index.js:422 registerProcedural` throws "deferred to Phase 6." These are designed-for placeholders that crash if called — fine as scaffolding, but they advertise capability the runtime doesn't have.

### 6. Unwired freshly-authored data (last-day commits, not in runtime)
Authored in commits `1a34b7e..643f9b9` (2026-06-02), **none wired:**
- `data/sonoran/plants.sonoran.js` (227 LOC, 12-plant seed) — 0 imports
- `data/curriculum/chapter-map.md` — 0 code references
- `artifacts/biology_next_phase/*.md` (10 design docs) — 0 JS, pure design
This is a same-day burst of design/data artifacts layered on top without integration.

---

## MEDIUM

### 7. Stale/abandoned experiment directories
- `src/renderer/game/editor-scenes/` (GarageSceneBase, NeighborhoodSceneBase, asset-pack.json) — base-scene experiments not in the boot list
- `src/renderer/game/dev/phaserHmr.js` — dev-only HMR shim
- `src/game/legacy/` — contains only a `README.md` (590 bytes), a tombstone
- Scenes registered in `config.js` but **absent from `sceneRegistry.js`** navigation (orphaned-from-overworld): `CognitiveQuestScene`, `ExplainerScene` (launched as overlays, not navigable locations)
- Scene files present but never registered in either config: `BaseSubScene.js`, `LabRigBase.js`, `LocalSceneBase.js`, `DesertForagingScene` partially (worldPos null)

### 8. Root-level documentation sprawl
~25 top-level `.md`/`.json` strategy docs (OPTIMIZATION_SUMMARY, PERFORMANCE_OPTIMIZATION_GUIDE, UX_AUDIT_REPORT.json, NEXT_STEPS, STATUS, arc.md @ 97KB...) plus `DOCS_INDEX.md` to navigate them. `arc.md` alone is 97581 bytes and was edited 2026-06-02 — a living design doc, not code.

### 9. Placeholder / fallback assets
`AssetRegistry.js` `provenancedTextureOrFallback()` (used at `NeighborhoodScene.js:170`) indicates the live tree still falls back to placeholder textures for some props. `src/game/art/placeholder/` and `art/generated/` coexist with `art/final/` — final art is incomplete.

---

## LOW

### 10. Time-of-day & proximity polling cost
`ecologyTicker.js:85-120` polls every entity every frame for time-of-day rules and (throttled 250ms) proximity. Fine at current entity counts; would need spatial partitioning at scale.

### 11. Heuristic species→item matching
`ecology/index.js:129 _defaultGrantsItemId` uses string `startsWith`/`includes` matching ("mesquite_pods" for "mesquite") with a self-acknowledged "future cycle replaces this" comment — brittle content coupling.

---

## Debt summary

| Severity | Items |
|---|---|
| **Critical** | Two live trees with inverted route names + ~20 duplicated systems; ecology implemented 3–4×; the 51k-LOC tree is largely off the shipping path |
| **High** | 5 md-only "systems" dirs; 4 orphaned (0-import) real systems; 8 throwing stubs as public API; unwired same-day data burst |
| **Medium** | Editor-scenes/legacy/HMR experiments; scenes registered-but-unnavigable; 97KB arc.md + 25-doc sprawl; placeholder-fallback assets |
| **Low** | Per-frame ecology polling; heuristic item matching |
