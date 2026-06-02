# Legacy Preservation Registry

Formal disposition of every significant legacy subsystem **before** Phase-1
implementation. Source evidence: the committed `artifacts/legacy_vs_rebuild/`
audit (14 docs) + `artifacts/game_state/` reality audit. No code merged.

**Classification:** PRESERVE (must exist in final game) · PORT (move impl
into rebuild) · REFERENCE (keep as design inspiration) · ARCHIVE (store,
don't actively use) · REMOVE (safe to discard).

**Trees:** LEGACY = `src/renderer/game/` (`/legacy-play`). REBUILD =
`src/game/` (`/game-rebuild`, canonical spine).

| # | Subsystem | Source (legacy) | Class | Phase | Maturity | Port complexity | Reachability caveat |
|---|---|---|---|---|---|---|---|
| 1 | **Stress-strain UTM simulator** | `systems/materialTestingEngine.js`, `materialEngine.js`, `scenes/MaterialLabScene.js` | **PORT** | **2** | High (real σ–ε curves) | Medium | reachable via force-start; instrument UX solid |
| 2 | **Adaptive reasoning grader** | `systems/cognitive/CognitiveEngine.js`, `cognitiveQuestSystem.js`, `data/cognitiveQuests/` | **PORT** | **2** | High (elicit-and-grade) | Medium | quests reachable; grader is the gem |
| 3 | **Interactive click-to-place bridge** | `scenes/DryWashScene.js` (604 LOC), `systems/construction/constructionSystem.js` (559) | **PORT** | **3** | High (3-phase placement) | Medium-High | playable in legacy; merge behind rebuild evidence-gate |
| 4 | **Multi-biome world** | `scenes/{DesertTrail,Mountain,LakeEdge,CopperMine,CommunityPool,DogPark,DesertForaging,...}` (24 scenes) | **PRESERVE+PORT** | **3** | Mature but rough | High | 15/17 render; some half-empty/blank |
| 5 | **World-map fast travel** | overworld node map + `WorldMapScene`/travel hub | **PORT** | **3** | Partial (cold/half-empty) | Medium | renders but sparse; rebuild's is a 5-LOC dead-end stub |
| 6 | **Thermal rig** | thermal-expansion lab (real α), lab scenes | **PORT** | **2** | High | Medium | pairs with UTM port |
| 7 | **Chemistry engine** | `systems/chemistrySystem.js`, `batteryChemistry.js` | **MERGE→PORT** | **2** | Medium (deeper than rebuild's 2-recipe stub) | Medium | legacy multi-reagent vs rebuild canned strings |
| 8 | **Quest step-gating (enforced)** | `systems/questSystem.js` (typed enforced steps) | **PRESERVE (concept)** | **1** | High | Low–Medium | concept ports to rebuild QuestSystem now |
| 9 | **Inventory metadata** | `systems/inventorySystem.js` | **PORT (concept)** | **1** | Medium | Low | richer item metadata than rebuild |
| 10 | **Cognitive quests (content+engine)** | `data/cognitiveQuests/arizonaCognitiveQuests.js` (10) + CognitiveEngine | **PORT** | **2** | High | Medium | 0 importers in rebuild today |
| 11 | **Discovery systems** | `systems/discoverySystem.js`, `discoveryBridge.js`, `milestoneEngine.js` | **PORT** | **2–3** | Medium-High | Medium | drives progression/notebook |
| 12 | **Language progression** | `languageProgressionSystem.js`, `npcLanguageSystem.js`, `phraseBuilder.js`, `languageCoachAssistant.js` | **PORT** | **3** | Mature (6-region mastery) | Medium | rebuild has only greeting/trust |
| 13 | **NPC dialogue templates** | `questTemplating.js`, `dialogueDifficulty.js` | **REFERENCE→PORT** | **3** | Medium | Low–Medium | templating ideas valuable |
| 14 | **E-bike system** | `systems/ebikeSystem.js`, `systemGraph.js` | **PORT (deferred)** | **3+** | Mature (system-graph) | Medium | rebuild bike is 31-LOC stub |
| 15 | **Battery system** | `batterySystem.js`, `batteryChemistry.js` | **PORT (deferred)** | **3+** | Mature | Medium | pairs with e-bike |
| 16 | **Economy / Zuzubucks / Shop** | `playerStats.js` (currency), shop UI, board quests | **PORT** | **3** | Mature | Medium | metagame loop legacy-only |
| 17 | **Foraging** | `systems/foragingSystem.js`, `DesertForagingScene.js` | **PORT** | **3** | Mature | Medium | ties to ecology/economy |
| 18 | **Mining** | `systems/miningSystem.js`, `CopperMineScene.js` | **ARCHIVE→PORT** | **deferred** | Mature | Medium | needs a gameplay reason first |
| 19 | **Crafting** | `systems/craftingSystem.js` | **PORT** | **3** | Mature | Medium | pairs with materials/economy |
| 20 | **Ecology systems** | `systems/ecology/` (2000), `ecologyEngine.js`, flora(12)/fauna(9) | **REFERENCE→PORT** | **3** | Medium (static graph) | Medium | rebuild has lighter EcologyObservationSystem |
| 21 | **Simulation engine** | `systems/simulationEngine.js` (920) | **REFERENCE** | **deferred** | Graph validator (not time-stepper) | High | reframe before any port |
| 22 | **Vehicle simulation / stress sim** | `stressSimulation.js`, `physicsbridge.js`, `systemGraph.js` | **REFERENCE/ARCHIVE** | **deferred** | Mixed | High | feeds e-bike; not Phase-1 |
| 23 | **Biology Stage 1 + genetics** | `systems/biology/` (Stage1 + `geneticEngineering.js`) | **ARCHIVE** | **deferred** | Stage1 orphaned; Stage2/3 throw | High | unbuilt in both trees |
| 24 | **Factory system** | `systems/factorySystem.js` | **ARCHIVE** | **deferred** | Built but orphaned | Medium | no live importer |
| 25 | **Design-only substrates** | `systems/{ethnobotany,phytochemistry,pharmacology,reasoning,knowledgeState}/*.md` | **REFERENCE** | **deferred** | Docs only (0 JS) | n/a | design inspiration, not code |

## Per-subsystem answers (the six questions, condensed)

**What should ABSOLUTELY survive (never lose):** the stress-strain UTM,
the adaptive reasoning grader, the interactive bridge construction,
multi-biome exploration, world-map travel, enforced quest step-gating,
discovery/progression, and the chemistry/thermal depth. These are
captured in `non_negotiable_legacy_features.md`.

**What should NEVER be rebuilt from scratch (copy/port, don't re-invent):**
the UTM physics (`materialTestingEngine.js`), the reasoning grader
(`CognitiveEngine.js`), the bridge placement logic
(`constructionSystem.js`), and the biome scene library — these are mature
and expensive to re-derive.

**What should be REWRITTEN (idea good, impl rough/off-spec):** the
world-map (legacy renders half-empty), ecology (static graph → wire to
rebuild's observation UX), the simulation engine (reframe as a real
time-stepper before use), and dialogue templating (modernize onto the
rebuild DialogueSystem).

**What should be COPIED DIRECTLY (low-risk, high-value):** enforced
quest-step types (concept), inventory metadata fields, and the
σ–ε/thermal curve math.

**What the rebuild currently LACKS (the gap to close):** any second area,
economy, vehicle variety, instrument-grade lab depth, reasoning
assessment, world-map payoff, and per-material UTM testing — all present
in legacy, all on the port roadmap.

## Disposition summary
- **PORT:** 1,2,3,5,6,7,10,11,12,16,17,19 (+ concepts 8,9) — the depth.
- **PRESERVE:** 4,8 (must exist in final game).
- **PORT-deferred:** 14,15,18,22.
- **ARCHIVE:** 18,23,24.
- **REFERENCE:** 13,20,21,25.
- **REMOVE:** none yet — per the Preservation Principles, nothing is
  discarded merely for living in legacy (`canonical_hybrid_architecture.md`).
