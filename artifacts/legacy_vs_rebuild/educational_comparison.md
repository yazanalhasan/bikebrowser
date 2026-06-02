# Educational Comparison — Legacy vs Rebuild (Phase 5)

**Method:** Evidence-based, per-subsystem. Reality (runtime + reachability) >
docs. No global winner declared; each subsystem scored **Legacy / Rebuild /
Tie** with `file:line` citations. Two competing trees:

- **LEGACY** = `src/renderer/game/` → route `/legacy-play`
  (`src/renderer/App.jsx:81`). Broad educational surface; many systems off the
  primary playable path or stubbed.
- **REBUILD** = `src/game/` → route `/game-rebuild`
  (`src/renderer/App.jsx:80`). Focused Act-1 slice; few systems but one
  genuinely enforced learning loop.

Both routes boot with **zero console errors**
(`playtest_captures/legacy_vs_rebuild/legacy_runtime.json:233`,
`rebuild_runtime.json:113`).

---

## Depth vs Breadth — the headline

| | LEGACY | REBUILD |
|---|---|---|
| Educational systems present (JS) | ~15 (education, ecology 2k LOC, biology 1.2k, materials 1.3k, science, cognitive, knowledge, language, genetics, stress-sim) | 6 (materials, construction, ecology-observe, chemistry, language, notebook) |
| Topics touched | physics d/s/t/a, materials UTM, ecology dynamics, biology recipes, genetics, 5 reasoning-puzzle types, language progression | materials, bridge engineering, ecology field-guide, 2-recipe chemistry, 2-phrase language |
| Scientific fidelity of best system | **HIGH** — real stress-strain curves w/ yield/ultimate/fracture, ASTM/USDA-referenced (`systems/materials/materialTestingEngine.js:1-40`; `scenes/MaterialLabScene.js:418-483,647-655`) | MODERATE — 5-property average + deformation band (`MaterialsLabSystem.js:19-39`) |
| Fraction of surface actually on the playable path | **LOW** — boots into garage hub; most edu systems gated/optional/stubbed | **HIGH** — the entire 10-quest arc is the loop (`data/act1/act1Quests.js`, 40 objectives) |
| Strongest *enforced* learning mechanic | none code-enforced on primary path | **evidence-gated bridge** (`ConstructionSystem.js:18-27,47`) |

**One-line verdict:** Legacy wins on **breadth and per-system scientific
depth** (its UTM and physics tutor are real teaching tools); the Rebuild wins
on **delivered, enforced, completable learning** (the test-then-build loop a
child cannot bypass). Breadth that no child reliably reaches loses to one loop
that every child completes.

---

## Per-subsystem scoring

### 1. Reasoning — **LEGACY**
- **Legacy:** A real *elicit-and-check* reasoning engine. `CognitiveEngine.js`
  evaluates 5 puzzle types (deduction/pattern/spatial/optimization/sequence)
  via dedicated handlers (`systems/cognitive/CognitiveEngine.js:15-48`), adapts
  difficulty to a per-skill profile (`:50-89`), shows hints below mastery, and
  scores answers (`cognitiveQuestSystem.js:19-66`). 10 Arizona cognitive
  quests (`data/cognitiveQuests/arizonaCognitiveQuests.js`). The game *asks a
  question and grades the child's answer.* `CognitiveQuestScene` is a
  registered scene (`legacy_runtime.json:70`).
- **Rebuild:** No reasoning evaluation. "Reasoning" is pre-authored prose the
  game *reveals* (notebook card "stiffness, strength, brittleness, and
  usefulness are not the same thing", `act1NotebookEntries.js`); nothing the
  game elicits or checks. Prior audit graded this C+
  (`artifacts/game_state/educational_audit.md:36`).
- **Why Legacy:** it is the only tree that mechanically tests a child's
  reasoning and adapts. **Caveat:** reachability is conditional — it launches
  on quest/NPC triggers (`cognitiveQuestSystem.js:23-36`), not on the default
  path, so depth is real but exposure is not guaranteed.

### 2. Prediction (predict-then-test) — **TIE (both fail the mechanic)**
- **Rebuild:** "Predict-then-test" is the headline theme but the live UTM
  tests **all 4 materials in one click** (`Act1RuntimeSystem.js:173`) and the
  deformation viz appears *after* the click (`NeighborhoodScene.js:891-901`),
  so the loop is **test → see**, never **predict → test → compare**. No
  captured-hypothesis step (`artifacts/game_state/educational_audit.md:38-49`,
  grade D).
- **Legacy:** Likewise no captured-prediction step on the playable path. The
  `predict/hypothes` tokens appear only in substrate `.md` design docs and in
  `simulationEngine.js:555,572` flavor text ("unpredictable products"), not as
  an interactive predict→compare gate.
- **Why Tie:** neither implements the one mechanic both advertise. Honest call.

### 3. Experimentation — **LEGACY**
- **Legacy:** `materialTestingEngine.js` is a **pure UTM simulator** producing
  real stress-strain curves — elastic ramp → yield → strain-hardening →
  necking/fracture, with ASTM E8/E9 + USDA Wood Handbook references
  (`materialTestingEngine.js:1-40`). `MaterialLabScene.js` renders the curve
  and labels yield/ultimate/fracture points
  (`MaterialLabScene.js:418-483,647-655`). This is a genuine experimentation
  bench; the child reads a curve, not a band. Scene is registered/reachable
  (`legacy_runtime.json:15`).
- **Rebuild:** UTM is a fair comparative bench but shallow — score = average of
  5 properties, deformation = `1 − elasticity + brittleness`
  (`MaterialsLabSystem.js:19-20`), output is a 3-tier band ("strong candidate /
  useful with limits / comparison failure", `:34-35`). Prior audit B+ for
  concept transfer but flagged as "observe a comparison," not experiment
  (`artifacts/game_state/educational_value_audit.md:12-23`).
- **Why Legacy:** stress-strain modeling teaches *why* materials fail; the
  rebuild teaches *that* they differ. **Caveat:** still no learner-controlled
  variable in either (load is fixed both sides).

### 4. Biology — **LEGACY (by default, but mostly unrealized)**
- **Legacy:** Stage-1 Recipe Biology surface exists
  (`systems/biology/index.js:20-53`, `Stage1RecipeEngine.js`,
  `recipeRegistry.js`), plus organism/state models. **But** Stage 2 (organism
  design) and Stage 3 (ecosystem simulation) are explicit **throwing stubs**
  (`systems/biology/index.js:158-255`, "HALT-AND-SURFACE … not implemented"),
  and `attemptRecipe` has **zero runtime callers**
  (grep: no importer of `biology/index` outside `data/recipes.js`) — i.e. the
  biology workbench is not mounted on any scene.
- **Rebuild:** No biology system at all (only ecology-observe + 2-recipe
  chemistry).
- **Why Legacy:** it at least has a non-stub Stage-1 surface and design depth;
  the rebuild has nothing. **Honest caveat:** legacy biology is *built but not
  wired* — near-zero delivered learning. This is a "least-bad" win, not a
  strong one.

### 5. Engineering — **REBUILD** ★ strongest single mechanic in either tree
- **Rebuild:** `ConstructionSystem.completeBridgePlan` **hard-refuses** until
  all 4 materials are tested (`ConstructionSystem.js:25-27`) and **rejects** a
  weak-scrap-only plan *with a reason* (`:18-23`). The payoff names the lesson:
  *"You did not guess. You tested, then built."* (`:47`). Repair → cross →
  upgrade → unlock is gated on a tested plan
  (`Act1RuntimeSystem.js:201-232`). The rule (evidence precedes action) is
  enforced by **code**, not narrated.
- **Legacy:** Has `materials/bridgeMaterialScoring.js` and quest references to
  bridge repair (`data/quests.js:1267`) but **no equivalent code gate** that
  refuses an untested/weak plan on the playable path.
- **Why Rebuild:** this is the only place in either tree where the runtime
  *mechanically requires evidence before action* and a child cannot bypass it.
  Narrow (single correct config) but genuinely enforced — prior audit B
  (`artifacts/game_state/educational_value_audit.md:25-33`).

### 6. Chemistry — **LEGACY**
- **Legacy:** `chemistrySystem.js` (16k) + `batteryChemistry.js` (13k) model
  real reactions/recipes with multiple reagents.
- **Rebuild:** 2 hard-coded recipes returning a canned mix→wait→test string
  (`ChemistrySystem.js:15-27`); no reagents, variables, or failure. Prior
  audit D (`artifacts/game_state/educational_value_audit.md:45-50`).
- **Why Legacy:** more actual chemistry to learn. **Caveat:** legacy
  chemistry's runtime exposure is also limited; this is depth-on-paper beating
  a stub.

### 7. Ecology — **LEGACY**
- **Legacy:** A *dynamic* ecology engine — `ecologyTicker.js`, `ecologyState`,
  `ecologyQueries`, `EcologyEntity` (population/state over time, 2k LOC), plus
  `scienceInteractions.js` layering OYLA-style physics onto the ecology model
  (non-Newtonian terrain, contamination, topology, memory challenge —
  `scienceInteractions.js:1-61`).
- **Rebuild:** `EcologyObservationSystem` is a **static field-guide** — observe
  a species, read prose, mark observed (`EcologyObservationSystem.js:15-30`).
  No dynamics, no over-harvest consequence. Prior audit C-
  (`artifacts/game_state/educational_value_audit.md:35-43`).
- **Why Legacy:** systems-level ecology with behavior over time vs static
  facts. **Caveat:** legacy ecology depth lives in the engine; how much surfaces
  to the player on the default path is partial.

### 8. Progression / Curriculum — **REBUILD**
- **Rebuild:** A complete, completable arc — 10 quests / 40 objectives
  (`data/act1/act1Quests.js`) chained bike-check → wash → collect → UTM → plan
  → repair → cross → ecology → chemistry → trust → unlock, all driven by one
  runtime (`Act1RuntimeSystem.js:137-289`) that the acceptance run completes
  end-to-end (`rebuild_runtime.json:79-111`, 8/8 steps ok).
- **Legacy:** Has a richer adaptive *tutor* (PhysicsEducationSystem mastery
  tiers d/s/t/a, `education/physicsEducationSystem.js:24-55`) and a 100-quest
  curriculum **in design docs** — but the tutor is wired only through
  `MCPSystem.js` (optional MCP integration, no default-path mount) and the
  100-quest curriculum is `.md` only (`data/curriculum/chapter-map.md`). The
  legacy runtime boots into a garage hub
  (`legacy_runtime.json:117,166`) with no enforced linear completion arc.
- **Why Rebuild:** it ships a coherent, finishable progression; legacy's richer
  progression is mostly latent/optional.

---

## Subsystem scorecard

| Subsystem | Winner | Margin | Core evidence |
|---|---|---|---|
| Reasoning | **Legacy** | clear | `CognitiveEngine.js:15-89` (evaluate+adapt) vs rebuild reveals prose |
| Prediction | **Tie** | n/a | neither captures a hypothesis (`Act1RuntimeSystem.js:173`) |
| Experimentation | **Legacy** | clear | stress-strain UTM `materialTestingEngine.js:1-40` vs 5-prop avg `MaterialsLabSystem.js:19` |
| Biology | **Legacy** | weak (legacy mostly stubbed) | Stage-1 surface vs Stage2/3 throwing stubs `biology/index.js:158-255` |
| Engineering | **Rebuild** | strong | evidence-gated bridge `ConstructionSystem.js:18-27,47` |
| Chemistry | **Legacy** | moderate | `chemistrySystem.js` vs 2-recipe stub `ChemistrySystem.js:15-27` |
| Ecology | **Legacy** | clear | dynamic `ecologyTicker.js`/`scienceInteractions.js` vs static `EcologyObservationSystem.js:15-30` |
| Progression | **Rebuild** | clear | completable 10-quest arc `act1Quests.js` vs latent tutor/100-quest docs |

**Tally:** Legacy 5, Rebuild 2, Tie 1 — *on per-subsystem capability*.

---

## Honest synthesis (not a global winner)

- **Legacy teaches more, and its best two systems (UTM stress-strain, adaptive
  reasoning puzzles) teach better than anything in the rebuild.** Its problem is
  **delivery**: most depth is off the default path, optional (MCP-gated), or
  throwing stubs (`biology/index.js:158-255`), and there is no enforced loop a
  child cannot skip.
- **The Rebuild teaches less, but the one thing it teaches is enforced and
  completable**: test-the-materials → evidence-gated build. That single
  mechanic (`ConstructionSystem.js:18-27,47`) is the most credible *delivered*
  learning moment in either tree, and the rebuild's arc actually finishes
  (`rebuild_runtime.json:79-111`).
- **Recommendation framing (no merge/delete):** breadth lives in Legacy, the
  enforced pedagogy lives in Rebuild. If learning *outcomes* are scored on what
  a child reliably does, **Rebuild edges ahead today**; if scored on
  *capability and ceiling*, **Legacy is richer**. They are complementary, not
  redundant.
