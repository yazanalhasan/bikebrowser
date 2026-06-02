# BikeBrowser — Legacy vs Rebuild Inventory (Phase 1)

**Method:** Evidence-based, reality-first. Two parallel game codebases coexist in one repo and are
served as two different routes by the same Vite/React SPA. Both confirmed HTTP 200 live
(`curl http://127.0.0.1:5173/game-rebuild` and `/legacy-play` → 200). LOC/byte counts measured with
`wc`; routing confirmed in `src/renderer/App.jsx`. **Reality > design docs**: where code exists but a
scene/system is never reached at runtime, that is noted.

**Date:** 2026-06-02

---

## 0. Tree mapping (verified)

| | LEGACY | REBUILD |
|---|---|---|
| Source root | `src/renderer/game/` | `src/game/` (live runtime under `src/game/phaser/`) |
| Route | `/legacy-play` (`App.jsx:81`) | `/game-rebuild` (`App.jsx:80`) |
| UI label | "Legacy Play" | "Game Rebuild" |
| Page component | `pages/GamePage.jsx` → `game/GameContainer.jsx` | `pages/GameRebuildPage.jsx` → `game/GameShell.jsx` |
| Phaser bootstrap | `game/config.js:93 createGameConfig()` | `game/phaser/createGame.js:10 createGame()` |
| Total JS/JSX LOC | **53,739** (`src/renderer/game/**`) | **4,943** (`src/game/**`) |
| Live runtime LOC (scenes+systems) | ~34k (24 scenes 11,309 + 40+ systems 22,628) | ~3.5k (7 scenes 1,794 + 20 systems 1,678) |
| Source bytes (JS only) | 2,108,186 B | 195,622 B |
| Source dir size (all) | 2.7 MB | 3.4 MB (3.1 MB is bundled art under `src/game/art/`) |

---

## 1. Build / run commands (shared)

Both trees ship from the same app; there is no separate build per tree.

- Dev: `npm run dev:react` (Vite, `package.json:12`) → `http://127.0.0.1:5173`
- Full dev (api+vite): `npm run dev:web` (`package.json:10`)
- Build: `npm run build` → `vite build` (`package.json:9`)
- Electron shell: `npm start` (`package.json:7`)
- Routes: Legacy = `/legacy-play`; Rebuild = `/game-rebuild`.

The two codebases are code-split: `GameRebuildPage` is `lazy()`-imported (`App.jsx:21`), so the
rebuild Phaser graph and the legacy Phaser graph load as separate chunks only when their route is hit.

---

## 2. Scenes

| | LEGACY | REBUILD |
|---|---|---|
| Scene files | 24 (`src/renderer/game/scenes/`) | 7 (`src/game/phaser/scenes/`) |
| Registered in config | 21 + 2 aliases (`config.js:52-72`) | 7 (`createGame.js:28-36`) |
| Start scene | `ZuzuGarageScene` (`GameContainer.jsx:450`) | `BootScene`→`PreloadScene`→`NeighborhoodScene` |
| Biggest scene | `WorldMapScene.js` **1,705 LOC** (real overworld with travel) | `NeighborhoodScene.js` **1,586 LOC** (single street) |
| Lab/minigame scenes | `MaterialLabScene` (911), `LabRigBase` (923), `ThermalRigScene` (368), `DryWashScene` (604, click-to-place bridge build) | none — all interaction is press-E zones in one scene |
| Reachable at runtime | Multi-scene world: overworld + ~17 sub-scenes via WorldMap travel + edge sensors (`seamlessTraversal.js`) | **One playable scene** (`NeighborhoodScene`); `WorldMapScene.js` is a 5-LOC empty stub (dead end) |

Rebuild scene LOC: `NeighborhoodScene 1586`, `DialogueScene 84`, `QuestScene 47`, `DebugScene 34`,
`PreloadScene 29`, `BootScene 9`, `WorldMapScene 5` (stub).

---

## 3. Data sources

| | LEGACY | REBUILD |
|---|---|---|
| Data dir | `src/renderer/game/data/` — **11,664 LOC** across 40+ files | `src/game/data/act1/` — **706 LOC**, 11 files |
| Quests | `data/quests.js` **1,690 LOC**, **21 quests** with typed multi-step chains | `data/act1/act1Quests.js` **122 LOC**, **10 quests / 30 objectives** |
| Materials | `data/materials.js` + `systems/materials/materialDatabase.js` (full property db) | `act1Materials.js` — **4 materials** |
| Dialogue | `dialogueTemplates.js` (241), `npcDialogueTemplates.js` (469), `npcProfiles.js`, `npcAppearances.js` | `act1Dialogue.js` — **11 dialogue entries** |
| Chemistry | `plantChemistry.js`, `plantEffects.js`, `recipes.js`, `workbenchRecipes.js` | `act1Chemistry.js` (1 sealant recipe) |
| Ecology/biology | `flora.js`, `fauna.js`, `ecology.js`, `biology.js`, `regions.js` | `act1Ecology.js` (handful of species) |
| Economy | `shop.js`, Zuzubucks + reputation (`questSystem.finishQuest`, `quests.js`) | **none** — no currency/shop |
| Notebook/learning | curriculum dir, explainers dir, `knowledgeConcepts.js` | `act1NotebookEntries.js` — **16 authored field-note entries** |
| Re-export plumbing | direct imports | `phaser/data/quests.js`, `dialogue.js` are 3-LOC re-exports of `act1*` |

The rebuild's runtime systems import from `phaser/data/*.js`, which **re-export** `act1*` data
(`phaser/data/quests.js:1-3` → `act1Quests`). So the full Act-1 content is live.

---

## 4. Assets

| | LEGACY | REBUILD |
|---|---|---|
| Asset strategy | Shared repo `assets/` + Aseprite/legacy graphics fallbacks drawn in scene code | Self-contained `src/game/art/` (**3.1 MB**), with curated/final/generated/placeholder tiers |
| Provenanced art | scattered; many scenes draw Phaser Graphics primitives | `AssetRegistry.js` (368 LOC) with provenance fallback chain + `PLACEHOLDER_ASSET_CONTRACT` |
| Characters | NPC sprites via `npcAppearances.js` | 4 final animated Aseprite characters (Zuzu, Chen, Ramirez, Mariam); passed character-art audit |
| Audio | `audioLanguageSystem.js` (301) + TTS coaching | `phaser/audio/` exists but **Phaser booted with `audio:{noAudio:true}`** (`createGame.js:37`) — audio disabled in live build |

---

## 5. Quest system

| | LEGACY | REBUILD |
|---|---|---|
| Engine | `systems/questSystem.js` (287 LOC) — pure functional, operates on save state | `systems/QuestSystem.js` (95 LOC) — Map/Set tracker |
| Step types | `dialogue, inspect, use_item, quiz, forage, craft, observe, explainer, complete` — **enforced** (`questSystem.js:174-226`) | objectives have `id/label/hook`; **no per-step enforcement** |
| Gating | hard gates: `use_item` checks inventory, `quiz` checks correct choice, `observe` checks observations | tracked + displayed but not enforced; only real gate is `unlockWiderMap` requiring `bridgeReconnected` (`Act1RuntimeSystem.js:276-289`) |
| Discovery→quest bridge | yes (`initDiscoveryQuestBridge`, reachability audit) | linear `next` chaining only |
| Rewards | items + Zuzubucks + reputation (`finishQuest`, `quests.js:21+`) | notebook unlocks only |

---

## 6. NPC / dialogue system

| | LEGACY | REBUILD |
|---|---|---|
| Dialogue engine | templated + adaptive: `dialogueDifficulty.js` (118), `npcLanguageSystem.js` (339), `languageProgressionSystem.js` (318), `languageCoachAssistant.js` (339) | `systems/DialogueSystem.js` (48 LOC) — static scripted line walker |
| NPC entities | `entities/Npc.js`, `npcProfiles.js`, `npcAppearances.js` | inline interaction zones in `NeighborhoodScene.createInteractions()` |
| Adaptivity | difficulty banding, AI dialogue enrichment, heritage-language progression | none — one-and-done lines, no branching |
| Heritage language | full Spanish/Arabic progression + coach | static Spanish (Ramirez) + Arabic (Mariam) trust lines via `LanguageSystem.js` (32 LOC) |

---

## 7. Educational systems

| | LEGACY | REBUILD |
|---|---|---|
| Engineering/materials | `materialEngine.js` (761), `materials/materialTestingEngine.js` (379), `compositeEngine.js` (243), real UTM/scale/calipers/density lab (`MaterialLabScene`, `LabRigBase`) | `MaterialsLabSystem.js` (71) — banded score from 5 numeric props (`testMaterial`) |
| Simulation | `simulationEngine.js` (928) graph-validated build scoring; `stressSimulation.js` (421) | none |
| Chemistry | `chemistrySystem.js` (437) property-driven extraction/refinement | `ChemistrySystem.js` (39) — composes an explanation string |
| Biology | `systems/biology/**` Stage-1 recipe engine real; **Stage 2/3 throw** (`biology/index.js:158-255`) | none |
| Ecology | `ecologyEngine.js` (485) seeded procedural flora/fauna spawning | `EcologyObservationSystem.js` (35) — records observed Set |
| Cognitive/quiz | `cognitiveQuestSystem.js`, `education/quizQuestionGenerator.js` (512), `CognitiveQuestScene` | none |
| Other domains | battery/ebike/mining/factory/crafting/foraging/genetics systems | none |
| Learning artifact | journal + explainers + curriculum data | `NotebookSystem.js` (64) — 3-tab Field Notebook, 16 authored entries |
| Design-only (0 JS) | `ethnobotany/`, `pharmacology/`, `phytochemistry/`, `reasoning/`, `knowledgeState/` are `.md` only | n/a |

---

## 8. Side-by-side summary table

| Dimension | LEGACY | REBUILD |
|---|---|---|
| Route | `/legacy-play` | `/game-rebuild` |
| LOC (live) | ~34k | ~3.5k |
| Scenes (playable) | ~18 reachable via world map | 1 |
| Systems | 40+ (deep, uneven; some throw/dead) | 20 (shallow, clean, all wired) |
| Quests | 21, multi-step **enforced** | 10 / 30 obj, tracked **not enforced** |
| Materials | full property physics + lab rigs | 4 materials, banded test |
| Simulation | graph validator (928 LOC), stress sim | none |
| Biology/ecology/chemistry | deep engines (some Stage 2/3 throw) | observation/recipe stubs |
| Economy | Zuzubucks + shop + reputation | none |
| Art | mixed Aseprite + Graphics fallbacks | curated tiers + provenance registry, 4 polished characters |
| Audio | TTS coaching system | disabled (`noAudio:true`) |
| Polish/coherence | uneven; placeholder text, design-only dirs | high; single tight Act-1 vertical slice |
| Time-to-complete | open-ended | ~1.5 min Act 1 |
