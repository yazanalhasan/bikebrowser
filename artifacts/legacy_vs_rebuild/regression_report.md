# Regression Report (Phase 9) — Legacy vs Rebuild

**Date:** 2026-06-02 · **Method:** Synthesized from the 10 Phase 1-8/13 comparison docs in this folder
and the prior reality audit in `artifacts/game_state/`, with key claims re-verified in code
(`ConstructionSystem.js`, `BikeSystem.js`, legacy LOC counts, `WorldMapScene.js` 5-LOC stub).
**Reality > design docs.** This report is a *roadmap input*, not an implementation — **no code is
merged or deleted.**

**Definitions.**
- **LEGACY** = `src/renderer/game/` → `/legacy-play` (~53.7k LOC, 24 scenes, 40+ systems; boots
  clean, genuinely playable, but rough/uneven and has **no acceptance pipeline**).
- **REBUILD** = `src/game/` → `/game-rebuild` (~4.9k LOC, 7 scenes, 20 systems; one polished,
  fully-wired, acceptance-scored Act-1 slice).
- A **regression** here = a capability that *exists and is real* in one tree and is *absent or a stub*
  in the other. Reachability caveats are stated where a legacy system is built-but-orphaned.

**Severity scale (impact on a shippable, teachable, fun game built on the rebuild spine):**
- **Critical** — core to the educational thesis or to "is this a game"; its absence caps the product.
- **High** — major player-facing depth/variety; strongly felt.
- **Medium** — meaningful enrichment; noticeable but not blocking.
- **Low** — polish / nice-to-have / narrow.

---

## Part A — In LEGACY, MISSING (or stubbed) in REBUILD

| # | Feature | Severity | Evidence | Reachability caveat |
|---|---|---|---|---|
| A1 | **Multiple biomes / scenes** — ~15 scenes render real content across 6+ biomes (desert, lake, mountain, mine, river, pool, fields, dog park) | **Critical** | `legacy_runtime_audit.md §3` (15/17 render); `content_comparison.md §4`; rebuild = **1** playable scene, `WorldMapScene.js` is a **5-LOC stub** (verified) | Legacy WorldMap is half-empty; overworld reachability order-sensitive |
| A2 | **Adaptive reasoning engine** — `CognitiveEngine.js` (101 LOC, verified) elicit-and-grade over 5 puzzle types (deduction/pattern/spatial/optimization/sequence), per-skill difficulty adaptation, hints; 10 Arizona cognitive quests | **Critical** | `educational_comparison.md §1`; `CognitiveEngine.js:15-89` | Launches on quest/NPC triggers, not default path (`CognitiveQuestScene` renders blank cold-started) |
| A3 | **Stress-strain UTM simulator** — `materialTestingEngine.js` (379 LOC, verified) real elastic→yield→strain-harden→necking/fracture curve, ASTM E8/E9 + USDA refs; `MaterialLabScene` renders the curve w/ labeled yield/ultimate/fracture | **Critical** | `educational_comparison.md §3`; `visual_comparison.md §10`; rebuild UTM = 5-property average + 3-tier band (`MaterialsLabSystem.js:19-39`) | Scene registered & reachable; this is a genuine legacy strength |
| A4 | **Interactive click-to-place bridge minigame** — `construction/constructionSystem.js` (559 LOC, verified) place-parts→validate→permanent-world-change, per-slot `requiredItem` gates, ghost/placed hooks; consumer `DryWashScene.js` (604 LOC, verified) 3-phase mesquite-beam build + load-test bike animation | **High** | `system_comparison.md §5`; `gameplay_comparison.md §8`; rebuild bridge has **no placement** — plan hardcoded (`ConstructionSystem.js:28-37`, verified) | Reachable in legacy DryWash at `build_bridge` step |
| A5 | **E-bike / vehicle-engineering model** — `ebikeSystem.js` (160 LOC, verified) builds bike+battery+electrical system graph, runs `simulationEngine.js` (928 LOC, verified) for range/top-speed/efficiency/build-score; `BIKE_PARTS`/`EBIKE_PARTS`/`batteryParts` (~510 LOC) | **High** | `gameplay_comparison.md §7`; rebuild `BikeSystem.js` = **31-LOC two-boolean stub** (verified) | **Orphaned:** `ebikeSystem`/`miningSystem`/`factorySystem` have **0 external imports** — built but no live player exposure |
| A6 | **Simulation / graph-validation engine** — `simulationEngine.js` (928 LOC) graph-validated build scoring w/ errors/warnings/metrics + per-failure explanations; `stressSimulation.js` (421); `ecologyEngine.js` (485) seeded procedural flora/fauna PRNG | **High** | `system_comparison.md §8`; rebuild has **no simulation** (Ecology/Chemistry are observation/string stubs) | `simulationEngine`/`ecologyEngine` run; legacy *biology* dynamic sim throws |
| A7 | **~40+ more quests** — 21 main (typed enforced steps) + 23 board + 27 language + 10 cognitive ≈ **54 authored** vs rebuild **11** | **High** | `content_comparison.md §1`; `legacy_vs_rebuild_inventory.md §5` | Fragmented, reputation-gated, no spine; much off-path |
| A8 | **Enforced typed quest steps** — `questSystem.js` (287) hard-gates `use_item`/`quiz`/`forage`/`craft`/`observe`; rejects wrong answers | **High** | `system_comparison.md §1`; rebuild objectives tracked **not enforced** (any zone fires on press-E) | Real progression enforcement legacy-only |
| A9 | **Economy — Zuzubucks currency + shop + reputation** | **High** | `legacy_runtime_audit.md §4`; `gameplay_comparison.md §3`; rebuild has **no currency/shop/inventory UI** | HUD shows "Items"/"Zuzubucks"; shop reachable |
| A10 | **Foraging / mining / crafting / factory** — `foragingSystem.js` (275), `miningSystem.js` (302), `craftingSystem.js` (389), `factorySystem.js` (248) | **High** | `system_comparison.md §7`; rebuild has none | `factorySystem` 0 imports; `craftingSystem` imported only by data — partly orphaned |
| A11 | **World-map fast-travel + overworld node map** — `WorldMapScene.js` (1,705 LOC), `seamlessTraversal.js` (416) edge sensors, three-layer world (overworld/local/micro), `unlockReq` gates | **High** | `gameplay_comparison.md §1`; rebuild "wider map" is a dead-end gate that unlocks a notebook entry | WorldMap renders half-empty cold |
| A12 | **6-region heritage-language progression** — `languages.js` (native script/transliteration/pronunciation/mastery thresholds), `npcLanguageSystem.js` (339), `languageProgressionSystem.js` (318), `languageCoachAssistant.js` (339), 27 language quests | **Medium** | `content_comparison.md §6`; `system_comparison.md §3`; rebuild = 2 inline greetings (Spanish/Arabic) + trust | Depth real; runtime exposure partial |
| A13 | **Thermal-expansion lab** — `ThermalRigScene.js` (368) real α coefficients (steel 12, copper 17, Al 23 ×10⁻⁶/K), live ΔL readout | **Medium** | `legacy_runtime_audit.md §3`; `visual_comparison.md §10`; rebuild has none | Reachable, interactive (4 input objects) |
| A14 | **Chemistry property engine** — `chemistrySystem.js` (437) + `batteryChemistry.js` (331) multi-reagent extraction/refinement | **Medium** | `educational_comparison.md §6`; rebuild = 2 hard-coded recipes returning a canned string (`ChemistrySystem.js:15-27`) | Runtime exposure limited |
| A15 | **Inventory with metadata + quantities + removal** — `inventorySystem.js` over `items.js`, wired into quest `use_item` gates | **Medium** | `system_comparison.md §2`; rebuild = a membership `Set` of ids, no quantities/removal/UI | — |
| A16 | **Adaptive / multilingual dialogue + difficulty banding** — `dialogueDifficulty.js` (118), 815 LOC templates, AI enrichment | **Medium** | `system_comparison.md §3`; `content_comparison.md §3`; rebuild = 48-LOC static line walker | Adaptivity partly unverified at runtime |
| A17 | **12 flora + 9 fauna + ecology relations** — `flora.js` (pharmacology/science/foraging models), `fauna.js` (diet/elevation/predator-prey), `ecology.js` PREDATOR_CHAINS | **Medium** | `content_comparison.md §5`; rebuild = 3 flora / 0 fauna | Data rich; sim mostly visual/off-path |
| A18 | **Biology Stage-1 recipe engine** — `biology/index.js:61-141` real recipe register/attempt | **Low** | `system_comparison.md §6`; rebuild has no biology | **Orphaned** (only `data/recipes.js` imports it); Stage 2/3 **throw** |
| A19 | **TTS audio / language-coaching system** — `audioLanguageSystem.js` (301) + TTS coaching | **Low** | `legacy_vs_rebuild_inventory.md §4`; rebuild boots `noAudio:true` (audio disabled) | Legacy has audio-unlock friction modal |
| A20 | **Larger save/state breadth** — save state spans inventory, Zuzubucks, reputation, quest steps, knowledge concepts, scene unlocks | **Low** | `gameplay_comparison.md §3` (milestoneEngine, sceneRegistry unlock state) | — |

> **Net (Part A):** Legacy's regressions vs rebuild are dominated by **breadth + depth + ceiling** —
> world/biomes (A1), the two genuinely better teaching tools (A2 reasoning, A3 stress-strain UTM),
> interactive construction (A4), the vehicle/sim engines (A5/A6), and the economy/foraging metagame
> (A9/A10). The recurring caveat is **reachability**: several headline legacy systems (A5, A6 partial,
> A10, A18) are *built but orphaned or off-path*, so they are losses of *code asset / ceiling*, not of
> *delivered play*.

---

## Part B — In REBUILD, MISSING in LEGACY

| # | Feature | Severity | Evidence | Note |
|---|---|---|---|---|
| B1 | **Complete acceptance pipeline** — scripted player-visible walkthrough (real avatar movement, no backend shortcuts), hard completion assertions (`act1Complete`/`bridgeReconnected`/`widerMapUnlocked`/≥4 tests), 11 screenshots + machine/human reports, **Brain-scored 87.43 / accepted** | **Critical** | `acceptance_comparison.md` (headline); legacy has **none** — only an ad-hoc reachability probe, no PASS/FAIL, no score | Legacy lacks a completion oracle, readable player coords, and an interactable registry — *cannot be cleanly acceptance-tested today* |
| B2 | **Coherent linear quest flow / spine** — 11 quests / 32 obj chained by `next`, auto-advancing, completable end-to-end (~1.5 min), every step reinforces *test before you trust* | **Critical** | `gameplay_comparison.md §2`; legacy has 54 quests but **no authored throughline** | Legacy is a hub of standalone reputation-gated quests |
| B3 | **Evidence-gated construction** — `completeBridgePlan` hard-refuses untested materials (`:25-27`) and rejects weak-scrap *with a reason* (`:18-23`); payoff "You did not guess. You tested, then built." (verified) — the **only code-enforced learning loop in either tree** | **Critical** | `educational_comparison.md §5`; legacy has no equivalent code gate on the playable path | Mechanically thinner than A4 (no placement) but pedagogically enforced |
| B4 | **Finished animated character art + provenance asset pipeline** — 4 final Aseprite characters (Zuzu/Chen/Ramirez/Mariam); `AssetRegistry.js` (368) tiered curated/final/generated/placeholder + fallback chain + `PLACEHOLDER_ASSET_CONTRACT` + `CharacterArtAuditBridge.js` | **High** | `visual_comparison.md §4`; `system_comparison.md §11`; legacy NPCs are blocky placeholder-grade, no central provenance registry | Rebuild *environment* art still partly placeholder geometry |
| B5 | **Curated 16-entry Field Notebook** — cohesive, child-readable, central learning artifact + visible progress meter (10/16 clues) | **High** | `content_comparison.md §7`; `system_comparison.md §9`; legacy "notebook" is a scattered knowledge-concept/explainer system, no curated booklet | Rebuild's signature content artifact |
| B6 | **Visual storytelling through state** — broken wash → "safe/repaired crossing", GPS unlocks new nodes after repair; diegetic clue text | **Medium** | `visual_comparison.md §7`; legacy storytelling leans on text dialogue boxes + warning toasts | — |
| B7 | **HUD discipline / scene readability / single-biome cohesion** — compact corner-anchored HUD, one painterly readable screen | **Medium** | `visual_comparison.md §2,3`; legacy stacks "No active mission" + heat + "You arrived!" banners over the playfield (worst: StreetBlock) | — |
| B8 | **Relationship-based bilingual trust** — explicit `TrustSystem.js` per-character trust + milestones, language surfaced *in relationship, not as a quiz* | **Medium** | `system_comparison.md §10`; `content_comparison.md §6`; legacy language is deeper tech but quiz/progression-framed, "trust" implicit | Tie on the axis overall; the *wired* trust loop is rebuild-only |
| B9 | **Tiny, fast bundle** — game chunk **174 kB vs 724 kB (~4.2×)**, boots **1 scene vs 21**, lowest heap, trivial per-frame loop | **Medium** | `performance_comparison.md §1-6`; legacy 4× chunk + 21-scene registration → slower cold start | Both pay the shared ~340 kB-gzip phaser tax |
| B10 | **Honest failure paths wired to the chain** — `repairBridge` refuses without a plan, `unlockWiderMap` refuses until bridge reconnected | **Low** | `gameplay_comparison.md §2`; `Act1RuntimeSystem.js:277` | Legacy gates exist but aren't on a completable arc |
| B11 | **Zero dead systems / 100% wired data** — every rebuild system instantiated & bound; every datum consumed | **Low** | `system_comparison.md` (intro); legacy has throwing stubs (biology Stage 2/3), `.md`-only design dirs, orphaned engines | — |

> **Net (Part B):** Rebuild's regressions vs legacy are dominated by **delivery + coherence + polish** —
> the acceptance pipeline (B1, the single biggest structural asset), the wired completable spine (B2),
> the one enforced learning loop (B3), finished characters + auditable art (B4), and the curated
> notebook (B5). These are exactly the things legacy cannot prove or ship today.

---

## Synthesis

The two trees regress against each other on **opposite axes**, which is why no global winner is
declared:

- **Legacy → Rebuild losses are about *ceiling and world*:** ~15 biomes, a real stress-strain UTM and
  an adaptive reasoning grader (the two best *teaching* tools anywhere in the repo), an interactive
  place-each-beam bridge, a vehicle/sim engine, and an economy/foraging metagame — but a large share
  is **orphaned or off-path** (A5/A6/A10/A18), so they are losses of *code asset*, not always of live
  play.
- **Rebuild → Legacy losses are about *floor and proof*:** an end-to-end acceptance pipeline with a
  Brain-scored gate (legacy literally cannot be acceptance-tested today), a coherent completable
  quest spine, the only code-enforced "evidence-before-action" loop, finished character art with a
  provenance pipeline, and a curated field notebook.

**Roadmap implication (carried into Phases 10-11):** the **rebuild is the spine** (it ships, it
proves, it's coherent and fast), and the **legacy gems are the parts bin** — port legacy's reachable,
high-ceiling teaching tools (stress-strain UTM A3, reasoning grader A2, interactive construction A4)
and its world/economy breadth (A1/A9/A11) *onto* the rebuild's acceptance-gated, wired Act-1
backbone, in severity order, while deliberately **deferring the orphaned/stubbed legacy engines**
(A5 vehicle sim, A6 biology Stage 2/3) until the proven loop justifies them.
