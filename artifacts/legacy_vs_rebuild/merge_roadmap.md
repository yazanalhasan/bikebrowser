# Merge Roadmap (Phase 11) — Legacy gems onto the Rebuild spine

**Date:** 2026-06-02 · **Method:** Sequenced from the Phase 9 regression severities and the Phase 10
disposition matrix in this folder. **Reality > design docs.**

> **THIS IS A ROADMAP, NOT AN IMPLEMENTATION. No code is merged or deleted in this document.** It
> records *what to port, onto which spine, in what order, with effort/risk* — for a future
> implementation pass.

## Spine decision (load-bearing)

**The REBUILD (`src/game/`, `/game-rebuild`) is the canonical spine.** It ships, it is fully wired,
it has a Brain-scored acceptance pipeline (87.43/accepted), it is 4× lighter, and it has the only
code-enforced learning loop. **The LEGACY (`src/renderer/game/`) is the parts bin** of high-ceiling
teaching tools and world breadth. Every phase below ports a *reachable* legacy gem **onto** the
rebuild backbone, preserving the rebuild's acceptance gate as the non-negotiable: **a port is only
"done" when the acceptance spec still passes (or is extended to cover it).**

**Guardrails carried from the Executive Summary:**
1. Each phase must keep `tests/e2e/game-rebuild.act1-acceptance.spec.js` green and the Brain score
   ≥ accepted.
2. Do **not** port orphaned/stubbed legacy engines (vehicle sim, biology Stage 2/3) until a proven
   loop demands them — they appear only in Phase 3, gated on evidence.
3. Budget every port against the rebuild's measured perf wins (174 kB chunk, 1-scene boot).
4. Stop authoring design `.md`; measure progress in playable runtime + passing acceptance.

---

## Phase 1 — Quick wins (low effort, low risk, high coherence payoff)

*Goal: close the rebuild's honest Act-1 gaps and add the cheapest legacy depth that needs no new
scene. All stay on the single `NeighborhoodScene`.*

| Step | What | Source → Target | Effort | Risk | Notes |
|---|---|---|---|---|---|
| 1.1 | **Finish Act-1 completion gaps** — wire `desert_helper`'s missing `observe_creosote`/`observe_saguaro` zones + the 16th notebook clue | rebuild internal (`act1Quests.js:81-85` vs handlers) | **S** | **Low** | *Completion, not new content* (Exec Summary 10%). Unblocks a clean 16/16 notebook. |
| 1.2 | **Split the one-click UTM into per-material tests** (enables the captured-hypothesis step later) | rebuild internal (`Act1RuntimeSystem.js:173`) | **S** | **Low** | Today all 4 materials test in one click; per-material is the precondition for predict-then-test. |
| 1.3 | **Add captured-hypothesis (predict-then-test) step** before each UTM test | new, on spine | **S-M** | **Low** | Highest-leverage educational fix (Exec 20%); turns the visualization into real learning. Pairs with 1.2. |
| 1.4 | **Adopt legacy inventory metadata + quantities + removal** | `inventorySystem.js:11-52` → rebuild `InventorySystem.js` | **S** | **Low** | Drop-in upgrade of the `Set`; no UI required yet. Prereq for economy (Phase 3). |
| 1.5 | **Add enforced quest step-gating** to the rebuild chain (`use_item`/`observe`/`quiz` gates) | `questSystem.js:174-226` (pattern) → rebuild `QuestSystem.js` | **M** | **Low-Med** | Keep the `next`-chain; add per-objective enforcement so zones can't fire out of order. Re-run acceptance. |

**Exit criteria:** 16/16 notebook reachable; UTM is per-material with a prediction prompt; inventory
has metadata; quest objectives enforce. Acceptance spec still green.

---

## Phase 2 — Medium complexity (the two best legacy *teaching* tools onto the spine)

*Goal: raise the educational ceiling by porting legacy's genuinely-better, reachable teaching engines
behind the rebuild's wired UX. No new biomes yet.*

| Step | What | Source → Target | Effort | Risk | Notes |
|---|---|---|---|---|---|
| 2.1 | **Port real stress-strain physics behind the rebuild UTM** — elastic→yield→fracture curve, labeled yield/ultimate/fracture | `materials/materialTestingEngine.js` (379) + `MaterialLabScene` curve render → behind `MaterialsLabSystem.js` | **M** | **Med** | Replace the 5-prop average with the real curve; keep the rebuild's child-readable band + notebook hook on top. Map legacy material props onto the 4 Act-1 materials. |
| 2.2 | **Port the adaptive reasoning grader and wire it onto the chain** | `cognitive/CognitiveEngine.js` (101) + `cognitiveQuestSystem.js` + 1-2 Arizona cognitive quests → new rebuild system + quest hooks | **M** | **Med** | The only elicit-and-grade engine anywhere. Wire ≥1 puzzle into the Act-1 chain (e.g. "Bridge Load Logic") so it's on the default path, not trigger-gated. Extend acceptance to assert a graded answer. |
| 2.3 | **Upgrade chemistry to legacy's multi-reagent model** | `chemistrySystem.js` (437) → behind rebuild `ChemistrySystem.js` | **M** | **Med** | Replace the 2 canned strings with real reagents/variables/failure; keep the rebuild's mix→dry→test UX + notebook entry. |
| 2.4 | **Pull legacy flora/fauna data into the rebuild ecology field-guide** | `data/flora.js` (12) + `data/fauna.js` (9) → rebuild `act1Ecology.js` + `EcologyObservationSystem` | **S-M** | **Low** | Data-only enrichment (no dynamic sim yet); enriches the field guide + notebook. Defer `ecologyTicker` (it's only a visual fade). |

**Exit criteria:** UTM teaches *why* (curve, not band); a graded reasoning puzzle is on the default
path; chemistry has real variables; ecology guide is data-rich. Acceptance spec extended + green;
Brain score still accepted; bundle delta budgeted.

---

## Phase 3 — Major migrations (interactive depth, a second area, the metagame)

*Goal: turn the 90-second slice into a real Act with interactivity, a second place to go, and a
metagame loop. Highest effort/risk; each is independently shippable.*

| Step | What | Source → Target | Effort | Risk | Notes |
|---|---|---|---|---|---|
| 3.1 | **Graft the interactive place-each-beam bridge onto the evidence gate** | `construction/constructionSystem.js` (559) + `DryWashScene.js` (604) build phase → rebuild bridge flow | **L** | **High** | Keep the rebuild's `completeBridgePlan` evidence-gate as the *unlock* for a placement phase: test → plan (gated) → **place each beam** → load-test animation. The marquee merge: evidence-rigor + tactility. |
| 3.2 | **Port 2-3 reachable legacy biomes as real second/third areas** | `DryWashScene`/`CopperMineScene`/`LakeEdgeScene` (render real content) → new rebuild scenes off `NeighborhoodScene` | **L** | **High** | Make the "wider map" lead *somewhere* (Exec 15%, fun ~2.3/5 from dead ends). Port scene-by-scene; re-skin to the rebuild's painterly palette + HUD discipline so cohesion isn't lost. |
| 3.3 | **Build one real fast-travel map on the spine** (replace the 5-LOC stub) | `WorldMapScene` *design* + `unlockReq` model → fresh rebuild `WorldMapScene.js` | **M-L** | **Med** | Replace, don't salvage (both versions broken). Wire to the biomes from 3.2; node-unlock from quest/evidence state. |
| 3.4 | **Adopt the economy/crafting/foraging metagame** | `shop.js` + Zuzubucks/reputation + `foragingSystem.js`/`craftingSystem.js`/`miningSystem.js` → rebuild, re-wired | **L** | **High** | Depends on Phase-1 inventory (1.4) and Phase-3 biomes (3.2 — somewhere to forage/mine). Re-wire the partly-orphaned legacy systems; add currency/inventory UI the rebuild lacks. |
| 3.5 | **Layer legacy 6-region language progression under the trust loop** | `languages.js` + `languageProgressionSystem.js` (318) → under rebuild `TrustSystem`/`LanguageSystem` | **M** | **Med** | Keep the non-quiz relationship tone; add mastery depth. Lower priority than 3.1-3.4. |

**Exit criteria:** player builds the bridge by hand; ≥1 real second biome reachable via a working
fast-travel map; a currency/forage/craft loop exists; acceptance spec covers the new arc and passes.

---

## Phase 4 — Architecture cleanup (consolidation + deferred systems)

*Goal: pay down the structural debt the audits flagged as the #1 risk, and only now revisit the
deferred high-risk engines.*

| Step | What | Effort | Risk | Notes |
|---|---|---|---|---|
| 4.1 | **Resolve the two-tree split / inverted route names** — declare `src/game/` canonical, retire or archive `src/renderer/game/` once its gems are ported | **L** | **Med** | Exec Summary's #1 (30%) priority. Inverted route names (`/legacy-play` is the *bigger* tree) are a footgun; consolidate after Phases 1-3 have harvested the gems. |
| 4.2 | **Generalize the per-system `getState`/`loadState` save schema** to cover inventory/currency/reputation/unlocks added in Phases 1-3 | **M** | **Low** | Keep the rebuild's clean pattern; widen it as systems land. |
| 4.3 | **Acceptance-pipeline coverage for every ported system** — extend the player-visible spec + Brain dimensions to assert each new loop | **M** | **Low** | Make the acceptance gate (rebuild's #1 asset) the *definition of done* for the whole merge, retroactively. |
| 4.4 | **(Deferred) Real bike-component model**, reusing legacy `BIKE_PARTS` data — *only* if the proven loop now justifies vehicle depth | **L** | **High** | Do **not** port the orphaned `ebikeSystem`/`simulationEngine` wholesale; build a wired component-health model on the spine. Gated on Phases 1-3 succeeding. |
| 4.5 | **(Deferred) Biology** — build fresh Stage-1 on the spine; do **not** revive legacy Stage 2/3 throwing stubs | **L** | **High** | Lowest priority; only after the desert/engineering Act is fun and complete. |

**Exit criteria:** one canonical tree; a unified save schema; acceptance covers all shipped systems;
vehicle/biology remain explicitly deferred until earned.

---

## Sequencing rationale (one paragraph)

Phase 1 is **cheap completion + the single highest-leverage educational fix** (predict-then-test) with
no new scenes. Phase 2 ports the **two legacy tools that genuinely teach better** (stress-strain UTM,
reasoning grader) behind the rebuild's already-wired UX — high pedagogical payoff, contained risk,
still one screen. Phase 3 is the **expensive, world-expanding work** (interactive construction, real
second biomes, fast-travel, economy) that turns a 90-second demo into an Act — deferred until the core
loop is proven and instrumented. Phase 4 **consolidates the two trees and widens the acceptance/save
contracts**, and *only here* reopens the deferred high-risk engines (vehicle sim, biology) that both
trees fail to ship today. Throughout, the **acceptance pipeline is the ratchet**: nothing is "merged"
until the player-visible spec passes and the Brain still accepts — so depth is added without losing the
rebuild's proven, shippable floor.
