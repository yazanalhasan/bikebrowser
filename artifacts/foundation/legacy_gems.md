# Legacy Gems — Top 25 Highest-Value Features

The 25 legacy features most worth preserving, ranked by combined
educational + gameplay + engineering value. Evidence: `artifacts/
legacy_vs_rebuild/`. Fields: **Edu / Gameplay / Eng** (value 1–5),
**Maturity** (Stub/Partial/Mature), **Port** (Low/Med/High complexity).

| # | Gem | Why valuable | Edu | Gp | Eng | Maturity | Port |
|---|---|---|---|---|---|---|---|
| 1 | **Stress-strain UTM simulator** (`materialTestingEngine.js`) | Real σ–ε curves; the canonical "test-before-you-trust" turned deep — the single best teaching tool in either tree | 5 | 4 | 5 | Mature | Med |
| 2 | **Adaptive reasoning grader** (`CognitiveEngine.js`) | Elicits a hypothesis and *grades the reasoning*, not the answer — exactly the Educational Hierarchy's Explain/Predict | 5 | 3 | 4 | Mature | Med |
| 3 | **Interactive click-to-place bridge** (`DryWashScene.js`+`constructionSystem.js`) | Real player choice/mastery in construction; the rebuild only hard-codes the plan | 4 | 5 | 5 | Mature | Med-High |
| 4 | **Multi-biome world** (24 scenes, ~13 biomes) | Exploration breadth: desert, mountain, lake, mine, pool, fields — the world the rebuild lacks entirely | 3 | 5 | 3 | Mature/rough | High |
| 5 | **Thermal rig** (real α coefficients) | Thermal expansion as a playable instrument; pairs with UTM for materials science | 5 | 3 | 4 | Mature | Med |
| 6 | **World-map fast travel** (overworld + hub) | Navigation intent + payoff; converts the rebuild's dead-end wider-map into a real reward | 2 | 4 | 3 | Partial | Med |
| 7 | **E-bike system + system-graph** (`ebikeSystem.js`,`systemGraph.js`) | The first real vehicle beyond the bike-stub; component graph teaches subsystems | 4 | 4 | 5 | Mature | Med |
| 8 | **Economy / Zuzubucks / shop** | A metagame loop (earn→spend) that motivates exploration and crafting | 2 | 4 | 2 | Mature | Med |
| 9 | **Cognitive quests** (10 authored + engine) | Reasoning-first quests with a real grader; content the rebuild has zero of | 5 | 3 | 3 | Mature | Med |
| 10 | **Chemistry engine** (multi-reagent) | Deeper than the rebuild's 2-recipe canned stub; real mixing/dose | 4 | 3 | 3 | Medium | Med |
| 11 | **Foraging** (`foragingSystem.js`+scene) | Resource discovery tied to ecology + economy; rewards exploration | 3 | 4 | 2 | Mature | Med |
| 12 | **Crafting** (`craftingSystem.js`) | Turns gathered materials into tools/parts; the make-loop | 3 | 4 | 3 | Mature | Med |
| 13 | **Mining** (`miningSystem.js`+CopperMine) | A distinct resource activity + biome; metallurgy hook | 3 | 3 | 3 | Mature | Med |
| 14 | **Language progression** (6-region mastery) | Language-as-gameplay (trust, prices, recipes) far beyond rebuild's greeting | 4 | 3 | 2 | Mature | Med |
| 15 | **Discovery / milestone engine** | Tracks discoveries → progression beats; the connective tissue | 3 | 3 | 3 | Med-High | Med |
| 16 | **Enforced quest step-gating** (`questSystem.js`) | Typed, order-enforced steps — the rebuild tracks but doesn't enforce | 3 | 3 | 3 | Mature | Low-Med |
| 17 | **Inventory metadata** (`inventorySystem.js`) | Rich item types (raw/tested/crafted) the rebuild lacks | 3 | 3 | 2 | Medium | Low |
| 18 | **Battery system + chemistry** | Energy storage as a teachable system; pairs with e-bike | 4 | 3 | 4 | Mature | Med |
| 19 | **Ecology graph + flora/fauna** (12/9) | A real (if static) food-web/observation library | 3 | 3 | 2 | Medium | Med |
| 20 | **Lab scenes** (instrument-grade UX) | Dedicated lab spaces give instruments room to teach | 4 | 3 | 3 | Mature | Med |
| 21 | **NPC dialogue templating** (`questTemplating.js`) | Reusable dialogue/quest scaffolds; content velocity | 2 | 3 | 3 | Medium | Low-Med |
| 22 | **Seamless traversal** (`seamlessTraversal.js`) | Scene-to-scene movement without hard cuts; world cohesion | 2 | 4 | 3 | Medium | Med |
| 23 | **Science interactions** (`scienceInteractions.js`) | Reusable "do a science action" verbs across scenes | 4 | 3 | 3 | Medium | Med |
| 24 | **Interactive explainer system** | In-world explanations tied to actions (not text dumps) | 4 | 2 | 2 | Medium | Med |
| 25 | **Save system breadth** (`saveSystem.js`) | Persists a much larger world-state than the rebuild's slice | 2 | 3 | 3 | Mature | Med |

## Headline gems (the 5 that most define "best game possible")
1. **Stress-strain UTM** — the deepest, most transferable science loop.
2. **Adaptive reasoning grader** — grades *thinking*, the heart of the
   Educational Hierarchy.
3. **Interactive bridge construction** — real engineering mastery.
4. **Multi-biome world** — the exploration the rebuild cannot fake.
5. **E-bike + economy** — the first true progression beyond Act 1.

These five, ported onto the rebuild spine behind the acceptance pipeline,
are what turn a polished 90-second slice into a deep, fun, teachable game.
