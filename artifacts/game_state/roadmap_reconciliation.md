# Roadmap Reconciliation — Design Documents vs. Actual Implementation

**Phase 14 — evidence-based audit. Reality > design docs.**
**Audited:** 2026-06-02 · repo `C:/dev/bikebrowser` · branch `main`

> **Methodology.** For every major design pillar in `arc.md` (v2.0),
> `docs/visual-architecture.md`, the seven `*-substrate.md` design docs, the
> Sonoran dataset, `chapter-map.md`, and `artifacts/biology_next_phase/*.md`, I
> traced the claim to runtime code: (1) does JS exist, (2) is it *reachable* from
> a live scene, (3) is it on the **shipping path**. Two runtimes exist:
> `/game-rebuild` → `src/renderer/pages/GameRebuildPage.jsx` → **`src/game/`**
> (the only thing players experience), and `/legacy-play` →
> `src/renderer/pages/GamePage.jsx` → **`src/renderer/game/`** (off the shipping
> path). Routing: `src/renderer/App.jsx:80-81`.

---

## 0. The two trees (load-bearing context)

| Tree | Route | Page component | LOC (js/ts/jsx) | Shipping? |
|---|---|---|---|---|
| `src/game/` | `/game-rebuild` | `GameRebuildPage.jsx` (`App.jsx:81`) | ~4,943 (`wc -l` on src/game) | **YES — the live slice** |
| `src/renderer/game/` | `/legacy-play` | `GamePage.jsx` (`App.jsx:80`) | ~51,026 | **NO — legacy, off shipping path** |

**Critical finding:** the live `src/game/` tree imports **none** of the design
spine. `grep -rln "biology|ethnobotany|phytochem|pharmacolog|ecologyTicker|terraform" src/game/`
returns **zero hits**. The only "systems" in `src/game/phaser/systems/` are
Bike, Construction, MaterialsLab, Chemistry, Dialogue, Quest, Notebook, Trust,
Ecology**Observation**, Inventory, Discovery, etc. — an Act-1 desert slice.
`BikeSystem.js` is **31 lines** (`src/game/phaser/systems/BikeSystem.js`).

Everything else — every domain substrate, the 7-vehicle spine, the biology
spine, reasoning/curriculum/standards, the knowledge graph, the Sonoran
expansion, visual-architecture v2.0, the MiniMax pipeline — lives in design
`.md` files (git commits `1a34b7e..643f9b9`, all `docs(...)`/`feat(arc)`/
`feat(data)` doc commits authored after the playable slice shipped at
`ef469c8`/`532c3a2`).

---

## 1. Mechanical / Vehicle Progression Spine (bike → spacecraft)

**Design source:** `arc.md §3` "Mechanical Progression Spine — Seven Vehicle
Chapters" (`arc.md:203-272`); `docs/visual-architecture.md §2` (`:76-124`).
Seven chapters: Bike, E-bike, Motorcycle, Car, Boat, Plane, Spacecraft.

| Chapter | Status | Evidence |
|---|---|---|
| 1 — Bike | **Partially Implemented** | `src/game/phaser/systems/BikeSystem.js` exists but is a **31-line** stub; the playable repair loop lives across `ConstructionSystem`, `MaterialsLabSystem`, dialogue/quest data. Bike repair as a vertical slice is real; "modular component health/wear/inspection" per `visual-architecture.md:78-110` is **not** present as a system. |
| 2-7 — E-bike…Spacecraft | **Not Implemented** | No e-bike/motorcycle/car/boat/plane/spacecraft systems in `src/game/`. The only "spacecraft" reference in the live tree is **flavor dialogue**: `src/game/data/act1/act1Dialogue.js:12` ("…something shaped like a tiny spacecraft frame"). Legacy `src/renderer/game/systems/{batterySystem,ebikeSystem,materialEngine}.js` exist but are off the shipping path. |

**Verdict:** 1 of 7 chapters partially real. Chapters 2-7 are pure design.

---

## 2. Biological Progression Spine (7 domains: ecology → terraforming)

**Design source:** `arc.md §3` "Biological Progression Spine — Seven Biological
Domains" (`arc.md:273-412`); `arc.md §4` substrate sections (`:961-1138`);
seven `*-substrate.md` docs; `artifacts/biology_next_phase/*.md`.

| Domain | Design source | Status | Evidence |
|---|---|---|---|
| **Ecology** | `arc.md:961`; `ecology/ecology-substrate.md` | **Partially Implemented (legacy only)** | Real JS substrate: `src/renderer/game/systems/ecology/` (~2,000 LOC — `EcologyEntity`, `ecologyState`, `ecologyTicker`, `ecologyQueries`, `speciesResolver`). BUT `ecologyTicker` is a **time-of-day visual fade** (alpha/visibility — `ecologyTicker.js:162-228`), **not** a population/food-web simulation. Wired only into legacy `StreetBlockScene.js` (off shipping path). The **live** slice uses a separate, simpler `EcologyObservationSystem` + `act1Ecology.js` data. No dynamic sim runs anywhere. |
| **Ethnobotany** | `arc.md:1013`; `ethnobotany/ethnobotany-substrate.md` | **Not Implemented** | Directory `systems/ethnobotany/` contains **only `ethnobotany-substrate.md`** — `0` JS files (`find … -name "*.js" \| wc -l` = 0). |
| **Phytochemistry** | `arc.md:1074`; `phytochemistry-substrate.md` | **Not Implemented** | `systems/phytochemistry/` = **0 JS files**, doc only. |
| **Pharmacology** | `arc.md:1107`; `pharmacology-substrate.md` | **Not Implemented** | `systems/pharmacology/` = **0 JS files**, doc only. |
| **Cellular / Microbiology / Molecular / Systems Biology** | `arc.md:273-412` (spine table) | **Not Implemented** | No directories, no JS. Design table only. |
| **Synthetic Bio / Bio-Engineering** | `arc.md §4 Biology Workbench:769`; `biological_engineering_review.md` | **Not Implemented** | `src/renderer/game/systems/biology/` has Stage-1 only (recipe engine); Stage 2 (`designOrganism`, `validateOrganism`) and Stage 3 (`createEcosystem`, `stepSimulation`) are **throwing stubs**: `biology/index.js:159,172,201,214,227,239,254,269` all `throw new Error(STAGE_2_DEFERRED…/STAGE_3_DEFERRED…)`. Even Stage 1 is **orphaned** — `Stage1RecipeEngine`/`recipeRegistry` are imported only by `data/recipes.js` and **no live scene**. `geneticEngineering.js` (426 LOC) has **zero importers** (`grep` for importers = empty). |
| **Terraforming** | `arc.md §3 Act 3:570`; `living_systems_roadmap.md` | **Not Implemented** | No JS anywhere. Design prose + roadmap doc only. |

**Verdict:** Of 10+ biological domains, only **Ecology** has real (legacy,
non-shipping, visual-only) JS, and **biology Stage 1** exists but is orphaned.
8-9 domains are 100% design.

---

## 3. Biology Workbench — observation-scale modes + Bio-Engineering

**Design source:** `arc.md §4` "Biology Workbench" (`:769-872`), "observation-scale
modes and instruments" (`:890-960`); `docs/visual-architecture.md §4` "three
models per organism" (`:151-184`).

**Status: Not Implemented.** No workbench, no observation-scale modes
(macro→cell→molecular), no microscope/instrument UI in either tree. The biology
`index.js` public API exists but Stage 2/3 (design/simulate organisms) throw.
The "three models per organism" and "pollination & food-web visualization"
(`visual-architecture.md:172-184`) have no rendering code.

---

## 4. Ecology / Food-Web Substrate

**Design source:** `arc.md §4:961` "Ecology Substrate (EcologyEntity)";
`artifacts/biology_next_phase/food_web_substrate.md`;
`artifacts/biology_next_phase/biology_knowledge_graph.md`.

**Status: Partially Implemented (legacy, non-shipping, non-dynamic).**
`EcologyEntity.js` (193 LOC) and the ecology substrate are real code, wired to
legacy `StreetBlockScene`/`NeighborhoodScene`. But: (a) it's a **visual
spawn + time-of-day alpha** system (legacy `ecologyEngine.js` `populateWorld`,
`NeighborhoodScene.js:41,194-250`), not a trophic/food-web simulation; (b) the
**food-web substrate** (`food_web_substrate.md`) has **no JS** — there is no
predator/prey/energy-flow model. The live slice's ecology is observation flavor
(`act1Ecology.js` + `EcologyObservationSystem`).

---

## 5. Reasoning / Educational Hierarchy / Standards / Curriculum

**Design source:** `arc.md §1-2` (North Star, premise, standards posture);
`reasoning/reasoning-substrate.md`; `data/curriculum/chapter-map.md`;
`artifacts/biology_next_phase/{educational_progression_framework,quest_taxonomy,
advanced_reasoning_substrate}.md`.

| Element | Status | Evidence |
|---|---|---|
| Reasoning substrate (spatial, causal, systems_thinking…) | **Not Implemented** | `systems/reasoning/` = **0 JS files**, `reasoning-substrate.md` only. |
| Educational hierarchy (Observe→Explain→Predict→Engineer→Teach) | **Not Implemented** | No JS enforcing/tracking the hierarchy. Design only (`chapter-map.md §1`, `educational_progression_framework.md`). The live slice has quests but no hierarchy gating. |
| Standards (Arizona floor + enrichment) | **Not Implemented** | Tabular design only (`chapter-map.md:11-21`). No standards-tagging code on the shipping path. |
| Curriculum / chapter matrix | **Not Implemented (doc seed)** | `chapter-map.md` is an explicit **"canonical mapping seed … skeleton + a worked first batch"** (`:5-8`). No code consumes it. |
| 25-quest set | **Not Implemented (as designed)** | `chapter1_quest_set_v1.md` describes 25 hierarchy/reasoning-tagged Sonoran quests. The live slice's `act1Quests.js` has ~40 entries but they are the **Act-1 desert quests** (bike repair, bridge, trust), **not** the taxonomy-tagged biology quest set. |

**Verdict:** Entire reasoning/standards/curriculum framework is design-only.

---

## 6. Knowledge State System / Knowledge Graph

**Design source:** `arc.md §4:1164` + `§8.5:1573`; `knowledgeState/knowledge-state-substrate.md`;
`artifacts/biology_next_phase/biology_knowledge_graph.md`.

**Status: Not Implemented.** `systems/knowledgeState/` = **0 JS files** (doc
only). `arc.md` itself concedes this at **`§8.5:1583-1591`**: *"substrate
exists, no system yet consumes its query API … the §8.5 gating clause itself
remains in force until implementation ships."* The biology knowledge graph is a
design `.md`; no graph data structure or query API in code.

---

## 7. Sonoran Dataset

**Design source:** `arc.md §9:1632`; `src/renderer/game/data/sonoran/` (commit
`a0eb95a`); `artifacts/biology_next_phase/sonoran_dataset_expansion_plan.md`.

**Status: Partially Implemented (legacy data, ~12 plants, not consumed by live slice).**
`data/sonoran/plants.sonoran.js` is **227 lines / ~12 plant records**
(`grep -c "id:|commonName:|scientificName:"` = 12). It sits in the **legacy**
`renderer/game` tree. The expansion plan (`sonoran_dataset_expansion_plan.md`)
to many dozens of species is **unbuilt**. The live slice carries its own small
ecology data in `src/game/data/act1/act1Ecology.js`, not this dataset.

---

## 8. Visual Architecture v2.0 / MiniMax Creative Pipeline

**Design source:** `docs/visual-architecture.md` (290 lines, commit `643f9b9`);
`arc.md §11:1748`.

| Element | Status | Evidence |
|---|---|---|
| Six asset functions / modular-asset rules | **Not Implemented** | Design principles (`:16-46`); no asset-metadata schema (`§9:228`) in code. |
| Modular vehicle/building/biology models | **Not Implemented** | "three models per organism", modular building system (`§3-4`) — no rendering code. |
| Asset metadata schema + playability validation | **Not Implemented** | `§9-10` describe a JSON schema and an "Executive Brain rejects failing assets" gate — no such validator in `src/`. |
| **MiniMax creative pipeline** | **Not Implemented** | `grep -rln "MiniMax|minimax" src/` = **zero hits**. Pipeline is governed entirely from docs (`§1,§6-11`) and `memory/procedural/...` policy stubs; **no integration code** exists in the game. |

The **actual** shipped art pipeline is hand-authored Aseprite/curated PNGs under
`src/game/art/` (curated/final/generated/placeholder) — a static Act-1 asset
set, not the modular/MiniMax v2.0 system.

---

## 9. Blunt Summary — % Built vs. Designed

| Pillar | Status |
|---|---|
| Vehicle spine (7 ch) | 1 ch partial → **~7% of spine** |
| Biological spine (10+ domains) | Ecology partial (legacy/visual) + biology Stage-1 orphaned → **~5%** |
| Biology workbench / bio-engineering | **0%** (throwing stubs) |
| Ecology / food-web | partial legacy visual, **no sim** → ~15% of "ecology", 0% food-web |
| Reasoning / hierarchy / standards / curriculum | **0%** |
| Knowledge state / graph | **0%** (arc.md §8.5 admits it) |
| Sonoran dataset | ~12 plants legacy, unconsumed by live slice → **partial seed** |
| Visual architecture v2.0 | **0%** (static hand-art instead) |
| MiniMax / creative pipeline | **0%** (zero code refs) |

### Honest verdict

**The design corpus vastly exceeds the implementation.** The documented vision is
a 3-act, 7-chapter, 7-biological-domain, fully-simulated educational universe
spanning bike→spacecraft and ecology→terraforming, backed by a reasoning engine,
standards-mapped curriculum, knowledge graph, and a MiniMax-driven modular asset
pipeline. **What actually ships** (`/game-rebuild` → `src/game/`, ~5k LOC) is a
single polished **Act-1 Sonoran desert vertical slice**: bike repair, NPCs, dry
wash, UTM material tests, bridge repair, neighborhood trust, wider-map unlock,
Field Notebook. That is **a fraction of Chapter 1 of a 7-chapter, 3-act design** —
roughly **5-10% of the documented vision is real, and even that 5-10% is the
mechanical/desert slice, not the biological/reasoning/curriculum heart of the
design.** The ~51k-LOC legacy `renderer/game` tree contains more real systems
(ecology substrate, biology Stage-1, genetic engineering) but is **off the
shipping path** (`/legacy-play`), much of it orphaned (biology Stage-1,
`geneticEngineering.js`) or stubbed (biology Stage 2/3 throw). The entire
biology spine, vehicle progression beyond the bike, reasoning/standards/
curriculum framework, knowledge graph, Sonoran expansion, visual-architecture
v2.0, and MiniMax pipeline are **design documents authored in a ~1-day commit
burst (`1a34b7e..643f9b9`) that post-dates the playable slice** — they describe a
game that does not yet exist in code.
