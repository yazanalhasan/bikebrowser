# BikeBrowser — Current Game Inventory (Phase 1)

**Audit date:** 2026-06-02
**Method:** Read-only, evidence-based. Reality > docs; runtime > architecture.
**Classification taxonomy:** Production / Functional Prototype / Partial / Stub / Design Only / Missing

---

## ⚠️ CRITICAL GROUND-TRUTH CORRECTION (verified, contradicts the dispatch brief)

The dispatch brief states `/game-rebuild` is served from `src/renderer/game/` (the 70k-LOC tree). **This is false.** Runtime routing proves the opposite:

- `src/renderer/App.jsx:80` — `<Route path="/game-rebuild" element={<GameRebuildPage />} />`
- `src/renderer/pages/GameRebuildPage.jsx:1` — `import GameShell from '../../game/GameShell'` → resolves to **`src/game/GameShell.jsx`** (the *legacy* ~5k-LOC tree)
- `src/game/GameShell.jsx:2,11` — mounts `createGame()` from `src/game/phaser/createGame.js`
- `src/game/phaser/createGame.js:28-36` — boots `BootScene, PreloadScene, WorldMapScene, NeighborhoodScene, QuestScene, DialogueScene, DebugScene` (7 scenes, all from `src/game/`)

The 51k-LOC `src/renderer/game/` tree is mounted at **`/legacy-play`** (`App.jsx:81` → `GamePage.jsx:1` → `src/renderer/game/GameContainer.jsx`).

**Both trees boot in the runtime.** `/game-rebuild` = the **polished Act 1 vertical slice** (`src/game`, 4918 JS LOC, `NeighborhoodScene.js` = 1586 LOC). `/legacy-play` = the **large unfinished systems sandbox** (`src/renderer/game`, 51026 JS LOC, 173 files). Evidence: 9 of the e2e specs `goto('/game-rebuild')`; the act1-acceptance spec drives `scene.getScene('NeighborhoodScene')` from the `src/game` tree (`tests/e2e/game-rebuild.act1-acceptance.spec.js:7,13`). The route serving the renderer tree is literally named `legacy-play`.

**Consequence for this inventory:** "Live / shipped" = what `/game-rebuild` (`src/game`) renders. "Systems sandbox" = the larger `src/renderer/game` tree reachable at `/legacy-play`. Most rich biology/ecology *systems* live in the sandbox tree; most polished *content* lives in the live tree.

---

## LOC census (evidence)

| Tree | Files (JS) | JS LOC | Route | Status |
|---|---|---|---|---|
| `src/game/` (Act 1 slice) | 49 | 4918 | **`/game-rebuild`** (live) | Functional Prototype (polished slice) |
| `src/renderer/game/` (sandbox) | 173 | 51026 | `/legacy-play` | Partial (mostly built, partly wired) |

`src/renderer/game` sub-LOC: data 12280 · systems 22628 · scenes 11309 · entities+prefabs+ui+components 1323.

---

## CORE GAMEPLAY

| System | Class | Evidence |
|---|---|---|
| Movement (WASD/arrows) | **Production** (live tree) | `src/game/phaser/systems/InputSystem.js`; `NeighborhoodScene.js:73` help text "WASD / arrows move"; e2e drives `scene.player.x/y` via key holds (`game-rebuild.act1-acceptance.spec.js:13,22`) |
| Interaction (E/Space proximity) | **Production** (live) | `src/game/phaser/systems/InteractionSystem.js`; `scene.interactions.nearest(scene.player)` (act1-acceptance spec:30); 13 interactions wired in `NeighborhoodScene.js` |
| Dialogue | **Functional Prototype** | `src/game/phaser/scenes/DialogueScene.js` (84 LOC) + `DialogueSystem.js`; `data/act1/act1Dialogue.js`. Sandbox tree adds `npcDialogueTemplates.js` (469 LOC) — richer but in `/legacy-play` |
| Inventory | **Functional Prototype** | `src/game/phaser/systems/InventorySystem.js`; sandbox `systems/inventorySystem.js` imported in 2 files; HUD via `gameHud.js` |
| Quests | **Functional Prototype** (live) / **Partial** (sandbox) | Live: `src/game/phaser/systems/QuestSystem.js` + `data/act1/act1Quests.js`. Sandbox: `data/quests.js` (1690 LOC, ~42 quest objects), `questSystem.js` imported in 14 files |
| Notebook (field journal) | **Production** (live, signature feature) | `src/game/phaser/systems/NotebookSystem.js` + `data/act1/act1NotebookEntries.js`; `NeighborhoodScene.js:56` `field_notebook_reward`; dedicated playtest captures `02_bike_repair_notebook.png`, `07_trust_language_notebook.png` |
| Exploration (overworld/world map) | **Functional Prototype** | Live: `src/game/phaser/scenes/WorldMapScene.js` (5 LOC stub) + `DiscoveryMapSystem.js`. Sandbox: full `OverworldScene.js` + `WorldMapScene.js` (1705 LOC) + data-driven `sceneRegistry.js` (18 scenes) |
| Progression (reputation/unlocks) | **Functional Prototype** | Sandbox: `sceneRegistry.js:401 isSceneUnlocked()` (reputation + questsAny/All gates), `milestoneEngine.js`, `data/progression.js`, `data/milestones.js`. Live tree: `TrustSystem.js` (trust/reputation) |

## VEHICLE SYSTEMS

| System | Class | Evidence |
|---|---|---|
| Bike (repair/build) | **Production** | Live `src/game/phaser/systems/BikeSystem.js`; flat-tire repair is the spine (`tests/e2e/flat-tire-flow.smoke.spec.js`, `NeighborhoodScene.js:55` `chemistry_maker_surface`/tire). Sandbox: `ebikeSystem.js` + `systemGraph.js` + `simulationEngine.js` (real graph sim) |
| E-bike (battery/electrical) | **Functional Prototype** (sandbox only) | `systems/ebikeSystem.js` merges bike+battery+electrical graphs; `simulationEngine.js:62` `case 'ebike'`; `data/ebikeParts.js`, `data/batteryParts.js`, `batterySystem.js`, `batteryChemistry.js`. Not in live `/game-rebuild` |
| Boat / watercraft | **Stub** | `simulationEngine.js` has `case 'watercraft'` (runWatercraftSimulation) but no scene/UI mounts it; no watercraft data file. Architecture hook only |
| Aircraft | **Missing** | No reference anywhere (`grep aircraft/airplane` → 0 system files) |
| Spacecraft | **Missing** | No reference anywhere |

## BIOLOGY SYSTEMS

| System | Class | Evidence |
|---|---|---|
| Ecology (observation/forage) | **Functional Prototype** (sandbox) | `systems/ecology/index.js` (526 LOC): `registerEntity`, observation events, forage→inventory grants, interaction zones, time-of-day fade. **No population dynamics** — `registerProcedural()` throws "deferred to Phase 6" (`index.js:422`). Used by 2 scenes (`NeighborhoodScene`, `StreetBlockScene`). Live tree has its own lighter `EcologyObservationSystem.js` |
| Food web | **Partial** (data only, not simulated) | Relationships derived (`ecology/index.js:151 _deriveRelationshipFields` eats/eatenBy) from `data/ecology.js` PREDATOR_CHAINS. **Not simulated over time** — `ecologyTicker.js` only does proximity + time-of-day fade (lines 85-120), no population evolution. Legacy `ecologyEngine.js:398 applyFoodChain` = spawn-time spatial placement, not dynamics |
| Biology workbench | **Partial / Stub** | `systems/biology/index.js`: Stage 1 (recipe crafting) real (`attemptRecipe`, `Stage1RecipeEngine.js`). Stage 2 (parametric) & Stage 3 (simulation) are **all halt-and-surface stubs that throw** (`index.js:158-255`: designOrganism/createEcosystem/stepSimulation/observeEcosystemState all `throw`). **Not imported by any scene** — orphaned |
| Genetics / biological engineering | **Stub** | `systems/geneticEngineering.js` exists but **imported by 0 files** (verified). `artifacts/biology_next_phase/biological_engineering_review.md` is design-only |
| Ethnobotany | **Design Only** | `systems/ethnobotany/ethnobotany-substrate.md` only (24KB, 0 JS). Authored 2026-06-02 (commit eb1bd0e). Zero ESM imports |
| Phytochemistry | **Design Only** | `systems/phytochemistry/phytochemistry-substrate.md` only (0 JS). "phytochemistry" appears only as string props in data files |
| Pharmacology | **Design Only** | `systems/pharmacology/pharmacology-substrate.md` only (0 JS). String-only references in `data/plantEffects.js` etc. |
| Knowledge-state | **Design Only** | `systems/knowledgeState/knowledge-state-substrate.md` (61KB, 0 JS) |

## ENGINEERING SYSTEMS

| System | Class | Evidence |
|---|---|---|
| Bike/structure simulation | **Functional Prototype** (sandbox) | `systems/simulationEngine.js` (920 LOC): real graph-based validation, `simulate()` dispatch over bike/battery/ebike/structure/vehicle (`:38`), `isBikeRideable`, `computeScore`. Genuinely substantial |
| Materials testing (UTM) | **Functional Prototype** | `systems/materials/materialTestingEngine.js` (13KB): real stress-strain curves, yield/necking model (`sigma = sigma_u*(1-exp(-8ε))`, header lines 10-19). Mounted in `MaterialLabScene.js`. Live tree: `MaterialsLabSystem.js` |
| Thermal rig | **Functional Prototype** | `systems/materials/thermalRigEngine.js` + `thermalRigDatabase.js`; `ThermalRigScene.js` (Mrs. Ramirez thermal expansion, `sceneRegistry.js:99`) |
| Construction (bridge build) | **Functional Prototype** | `systems/construction/constructionSystem.js` (22KB) wired in `DryWashScene.js:28` (ghost-beam mesquite bridge, `bridgeBlueprint.js`). Reachable via WorldMap |
| Composite/material engine | **Functional Prototype** | `systems/materials/compositeEngine.js`, `materialEngine.js` (imported 2x), `bridgeMaterialScoring.js`, `materialDatabase.js` |
| Workbenches (lab tools) | **Functional Prototype** | `systems/lab/` (calipers, densityChart, densitySlate, scaleStation — 506 LOC); `data/workbenchRecipes.js` |
| Factory system | **Stub** | `systems/factorySystem.js` exists but **imported by 0 files**; `data/factories.js` content unused |

## EDUCATIONAL SYSTEMS

| System | Class | Evidence |
|---|---|---|
| Physics education | **Functional Prototype** | `systems/education/physicsEducationSystem.js` (9KB) |
| Quiz generation | **Functional Prototype** | `systems/education/quizQuestionGenerator.js` (22KB) — but consumed only by AI/MCP layer (`ai/aiFallbacks.js`, `MCPSystem.js`), not by scenes directly |
| Reasoning | **Design Only** | `systems/reasoning/reasoning-substrate.md` only (0 JS, authored 2026-06-02 commit). `artifacts/biology_next_phase/advanced_reasoning_substrate.md` design-only |
| Standards mapping | **Design Only** | `data/curriculum/chapter-map.md` (0 JS, **not referenced by any code** — verified grep). `artifacts/.../educational_progression_framework.md` design-only |
| Curriculum / progression spine | **Design Only → Partial** | Curriculum: design-only MD. Runtime progression exists separately via `milestoneEngine.js` + `sceneRegistry` gates (Functional Prototype) but is not curriculum-mapped |
| Cognitive quests | **Functional Prototype** | `systems/cognitive/CognitiveEngine.js` + handlers (157 LOC) + `cognitiveQuestSystem.js`; `CognitiveQuestScene.js` consumes it; `data/cognitiveQuests/` |
| Language / trust coaching | **Functional Prototype** | Live: `src/game/phaser/systems/LanguageSystem.js` + `TrustSystem.js` (Spanish/trust mechanic, playtest `07_trust_language_notebook.png`). Sandbox: `npcLanguageSystem.js`, `languageProgressionSystem.js`, `phraseBuilder.js` |

## WORLD SYSTEMS

| System | Class | Evidence |
|---|---|---|
| NPCs | **Functional Prototype** | Live: Chen + Ramirez authored (`NeighborhoodScene.js:101` `chen.repair` anim, `data/act1/act1Characters.js`). Sandbox: `data/npcProfiles.js`, `npcDialogueTemplates.js` (469 LOC), `npcAppearances.js` |
| Environments / scenes | **Functional Prototype** (sandbox) / **Production** (live Act 1) | Sandbox: 18 reachable scenes in `sceneRegistry.js` (Garage, MaterialLab, ThermalRig, StreetBlock, DogPark, LakeEdge, SportsFields, CommunityPool, DesertTrail, Mountain, WorldMap, DesertForaging, CopperMine, SaltRiver, DryWash + legacy). Live: single polished Neighborhood Act 1 |
| Terrain | **Functional Prototype** | Sandbox `WorldMapScene.js:908` procedural heightmap terrain v2 (cols×rows tiles + fog). Legacy `ecologyEngine.js` noise-based elevation/moisture |
| Buildings / props | **Production** (live Act 1) | Authored Arizona homes/mountains/bridge debris (`NeighborhoodScene.js:166-247`); commits "Strengthen Act 1 Arizona neighborhood backdrop", "Refine Act 1 southwest homes" |
| Assets / art | **Functional Prototype + placeholder mix** | Live `src/game/art/` (curated/final/generated/placeholder/source aseprite); `AssetRegistry.js` with `provenancedTextureOrFallback` (NeighborhoodScene.js:170 — fallbacks indicate not all assets final). Sandbox `assetPackLoader.js`, `ecologyAssetManifest.js` |
| Sonoran plant seed | **Design Only / unwired** | `data/sonoran/plants.sonoran.js` (227 LOC, 12-plant seed) **imported by 0 code files** (verified). Authored 2026-06-02 commit a0eb95a |

---

## Summary counts

- **Production:** movement, interaction, notebook, bike repair, Act 1 buildings/props (all in live `src/game` tree)
- **Functional Prototype:** dialogue, inventory, quests, exploration, progression, e-bike sim, materials/thermal/construction engines, ecology observation, cognitive quests, NPCs, scenes (mostly sandbox `src/renderer/game`)
- **Partial:** food web (data, not simulated), biology workbench (Stage 1 only)
- **Stub:** watercraft, genetics, factory (code exists, 0 imports or throws)
- **Design Only:** ethnobotany, phytochemistry, pharmacology, knowledge-state, reasoning, curriculum/standards, sonoran seed, all `artifacts/biology_next_phase/*.md`
- **Missing:** aircraft, spacecraft
