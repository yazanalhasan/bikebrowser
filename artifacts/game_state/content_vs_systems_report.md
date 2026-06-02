# BikeBrowser — Content vs Systems Report (Phase 9)

**Audit date:** 2026-06-02
**Question:** How much of BikeBrowser is *content* (quests, plants, NPC dialogue, art) vs *systems* (simulation, repair, food webs, progression, engineering)? Quantified by LOC and counts.

---

## Headline

BikeBrowser is **systems-heavy by raw LOC but content-thin in the shipping path.** The 51k-LOC `src/renderer/game` tree (route `/legacy-play`) is dominated by *systems* code (22.6k LOC) and data tables (12.3k LOC) that is mostly **not in the live `/game-rebuild` experience**. The actually-shipping product (`src/game`, 4.9k LOC) is **content-dominant** — a single hand-authored Act 1 scene (`NeighborhoodScene.js` = 1586 LOC, 32% of the live tree) plus authored quest/dialogue/notebook data.

So the answer is split by tree:
- **Sandbox (`/legacy-play`, 51k LOC):** systems-engineering project, ~44% systems / ~24% data-content / ~22% scenes.
- **Live (`/game-rebuild`, 4.9k LOC):** content-authoring project, one big authored scene + act1 content data.

---

## LOC census — `src/renderer/game` (51026 LOC total)

| Category | LOC | % of tree | Nature |
|---|---|---|---|
| **Systems** (`systems/`) | 22628 | 44% | simulation, ecology, materials, quests, progression engines |
| **Data/content** (`data/`) | 12280 | 24% | quests, flora/fauna, NPC dialogue, recipes, layouts |
| **Scenes** (`scenes/`) | 11309 | 22% | scene authoring (part content, part system glue) |
| **Entities/prefabs/UI/components** | 1323 | 3% | rendering glue |
| **Substrate docs** (`.md` in systems/) | ~180KB | — | design (NOT code) |

## LOC census — `src/game` (4918 LOC total, THE LIVE GAME)

| Category | LOC | % | Nature |
|---|---|---|---|
| **Scenes** (`phaser/scenes/`) | 1794 | 36% | **`NeighborhoodScene.js` alone = 1586** — hand-authored Act 1 content |
| **Systems** (`phaser/systems/`) | 1678 | 34% | 20 lean systems (Bike, Notebook, Trust, Dialogue, Interaction...) |
| **Data/content** (`data/act1/`) | 706 | 14% | act1 quests/dialogue/characters/notebook/ecology/materials |
| **Other** (audio, createGame, GameShell, art glue) | ~740 | 15% | infra |

In the live tree, **content + content-bearing scenes ≈ 50%** of LOC, and the systems are deliberately thin (avg 84 LOC/system).

---

## Content inventory (counts)

| Content type | Count / size | Evidence |
|---|---|---|
| Quests (sandbox) | ~42 quest objects, 1690 LOC | `data/quests.js` |
| Quests (live Act 1) | ~13 authored interactions/beats | `NeighborhoodScene.js` (13 interactions); `act1Quests.js` |
| Flora species | flora.js 400 LOC | `data/flora.js` |
| Fauna species | fauna.js 121 LOC | `data/fauna.js` |
| Ecology relations | ecology.js 232 LOC (PLANT_ECOLOGY, PREDATOR_CHAINS) | `data/ecology.js` |
| Sonoran plant seed | 227 LOC, ~12 plants (**unwired**) | `data/sonoran/plants.sonoran.js` — 0 imports |
| NPC dialogue | 469 LOC templates + 241 LOC generic + 105 LOC profiles = **815 LOC** | `data/npcDialogueTemplates.js`, `dialogueTemplates.js`, `npcProfiles.js` |
| Recipes / workbench | `recipes.js`, `workbenchRecipes.js` | crafting content |
| Materials / parts | `materials.js`, `bikeParts.js`, `ebikeParts.js`, `batteryParts.js` | engineering content |
| Notebook entries (live) | `act1NotebookEntries.js` | signature Act 1 content |
| Art assets | `src/game/art/{curated,final,generated,placeholder,source}` | aseprite + PNG; **mixed final/placeholder** |
| Scenes (navigable) | 18 in `sceneRegistry.js` | sandbox world |

---

## Systems inventory (LOC, by realness)

| System | LOC | Real? |
|---|---|---|
| `simulationEngine.js` | 920 | **Real** — graph sim (bike/battery/ebike/structure/vehicle) |
| `constructionSystem.js` | ~620 (22KB) | **Real** — bridge build, wired in DryWashScene |
| `quizQuestionGenerator.js` | ~600 (22KB) | Real, but AI-layer only |
| `materialTestingEngine.js` | ~360 (13KB) | **Real** — stress-strain physics |
| `ecology/` (8 files) | 2000 | **Real** observation/forage; **no population sim** |
| `materials/` (6 files) | 1260 | Real |
| `biology/` (7 files) | 1181 | Stage 1 real; Stage 2/3 throwing stubs |
| `ai/` (4 files) | 1054 | Real (MCP/quest gen) |
| `education/` (2) | 784 | Real |
| `construction/` (1) | 559 | Real |
| `lab/` (4) | 506 | Real |
| `cognitive/` (7) | 157 | Thin but real |

**Systems that are code-shaped but inert:** geneticEngineering, factorySystem, miningSystem (0 imports); biology Stage 2/3 + ecology procedural (throw).

---

## The content-vs-systems verdict

1. **By raw repo LOC, systems dominate** (22.6k systems vs 12.3k data in the sandbox). BikeBrowser *looks* like a systems/simulation project.
2. **By shipping reality, content dominates.** The only thing a player reaches at `/game-rebuild` is the authored Act 1 — a single 1586-LOC scene + 706 LOC of act1 content, backed by 1678 LOC of lean purpose-built systems. The 22.6k LOC of sandbox systems is reachable only at the `/legacy-play` route and is not the polished experience.
3. **Biology spine is almost entirely content/design, not systems.** The "biology" footprint is dominated by data tables (flora/fauna/ecology/plants ≈ 980 LOC) and **180KB of substrate .md docs**, with only a Stage-1 recipe engine as working system code — and that engine is orphaned (0 scene imports).
4. **Net:** A large *engineering-systems sandbox* (mostly off the shipping path) wrapped around a small, genuinely polished *content slice*. The simulation/engineering systems are the most-real systems; the biology food-web/ethnobotany/pharmacology spine is overwhelmingly content + design docs.
