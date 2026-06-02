# BikeBrowser — Simulation Readiness (Phase 13)

**Audit date:** 2026-06-02
**Question:** Which systems are actually ready for *simulation* (state evolving over time / dynamic models) vs only architecture vs only docs?
**Method:** Read the ecology/biology/engineering JS directly. Verdicts: **Sim-Ready** / **Architecture-Only** / **Docs-Only**.

Definition of "simulation" here = a model that *advances state over time* (populations, physics, dynamics), not just one-shot validation or static lookup. By that strict bar, BikeBrowser has **almost no live simulation** — its strongest "simulation" systems are actually *one-shot validators/calculators*.

---

## Engineering — the most real "simulation" (but it's validation, not dynamics)

### simulationEngine.js — **Architecture-Only → Sim-Ready (as a validator)**
`systems/simulationEngine.js` (920 LOC). `simulate(graph, systemType, context)` (`:38`) runs structural graph validation + system-specific rules and returns `{success, errors, warnings, score, metrics}`. Dispatches over `bike / battery / ebike / plant_battery / bio_production / structure / vehicle / watercraft` (`:55-95`).
- **Real:** bike rideability (`isBikeRideable:902`), battery safety (`isBatterySafe:910`), scoring (`computeScore`). This is a genuine, substantial constraint engine.
- **But it is NOT a time-stepping simulation** — it evaluates a static graph once and returns a verdict. No `step(dt)`, no state evolution. Verdict: **ready as a one-shot system validator**, not as a dynamic simulator. `watercraft`/`vehicle` cases are hooks with thin/absent UI.

### materialTestingEngine.js — **Sim-Ready (parametric model)**
`systems/materials/materialTestingEngine.js`. Produces real stress-strain curves with an elastic→yield→hardening→necking model (`sigma = sigma_u*(1-exp(-8·ε_plastic))`, header `:18`), force/displacement output. Explicitly quasi-static (no strain-rate, `:15`). This is the closest thing to a true *physical simulation* in the codebase and it is mounted (`MaterialLabScene`). **Ready** — for what it models (a UTM pull test).

### thermalRigEngine.js — **Sim-Ready (parametric model)**
`systems/materials/thermalRigEngine.js` + `thermalRigDatabase.js`: thermal-expansion model wired into `ThermalRigScene`. Parametric, real, mounted. **Ready** (narrow scope).

### constructionSystem.js — **Architecture-Only (assembly, not sim)**
`systems/construction/constructionSystem.js` (22KB) wired in `DryWashScene.js:28`. Ghost-beam placement + completion check against `bridgeBlueprint.js`. It's a *build/assembly puzzle*, not a structural simulation (no load/stress dynamics on the assembled bridge). Construction is real; "simulation" of the structure is not.

---

## Ecology / Food web — **Architecture-Only (NO simulation)**

### systems/ecology/ — observation substrate, not a simulator
Read of `systems/ecology/index.js` (526 LOC) + `ecologyTicker.js` (231 LOC):
- **What exists:** `registerEntity` (spawn entities with derived eats/eatenBy relations from `data/ecology.js`), proximity observation events, forage→inventory grants, time-of-day fade/enable. Used by 2 scenes.
- **What does NOT exist:** any population dynamics. The only per-frame loop is `ecologyTicker.js:85-120` which does (1) time-of-day alpha fade and (2) throttled proximity event emission. **No births, deaths, predation, energy flow, or population state advances over time.**
- The food-web relationships ARE computed (`index.js:151 _deriveRelationshipFields` → eats/eatenBy/nearbyAttractors) but are used **only for display/lookup**, never iterated.
- `registerProcedural()` (`index.js:422`) — the one function that would populate/simulate a world — **throws** "deferred to Phase 6."

**Verdict: Architecture-Only.** The food web is a static relationship graph with observation hooks. It is *ready to be observed*, not *ready to be simulated*.

### ecologyEngine.js (legacy) — spawn-time placement, not dynamics
`applyFoodChain(animals, plants, timeOfDay)` (`:398`) places predators spatially near prey **at world-generation**, using `PREDATOR_CHAINS` probabilities. One-shot procedural spawn, not a running ecosystem. **Architecture-Only.**

---

## Biology — **Docs-Only / Architecture-Only (simulation explicitly stubbed)**

### systems/biology/ — Stage-1 crafting works; simulation throws
Read of `systems/biology/index.js`:
- **Stage 1 (Recipe Biology):** real — `attemptRecipe` (`Stage1RecipeEngine.js`), recipe registry, outcome events. This is *crafting*, not simulation.
- **Stage 2 (Parametric / organism design):** `designOrganism`, `validateOrganism`, `emitOrganismDesignEvent`, `upgradeOrganismToNextStage` — **all `throw` "deferred to Phase 5"** (`:158-185, :268`).
- **Stage 3 (Simulation):** `createEcosystem`, `introduceOrganism`, **`stepSimulation`**, `observeEcosystemState`, `emitSimulationEvent` — **all `throw` "deferred to Phase 6"** (`:200-255`). The literal `stepSimulation(ecosystem, deltaTime)` — the heart of any ecosystem sim — throws unconditionally.
- Also: the whole biology module is **imported by no scene** — orphaned even at Stage 1.

**Verdict: Architecture-Only for Stage 1 (and orphaned); Docs-Only for the actual simulation (Stage 2/3 are throwing placeholders + `biology-substrate.md` §15).**

### Genetics / biological engineering — **Docs-Only**
`systems/geneticEngineering.js` exists but is imported by 0 files. `artifacts/biology_next_phase/biological_engineering_review.md` + `food_web_substrate.md` + `living_systems_roadmap.md` are design docs (0 JS). The "living systems / food-web simulation" vision exists **only as markdown** authored 2026-06-02.

### Ethnobotany / phytochemistry / pharmacology — **Docs-Only**
`systems/{ethnobotany,phytochemistry,pharmacology}/` each contain a single `*-substrate.md`, **zero JS, zero imports.** No simulation, no architecture — design only.

---

## Life support — **Missing**
No life-support / metabolism / habitat-survival simulation exists in either tree (no matching system files; battery/thermal are the only "resource" models, and they're static calculators).

---

## Readiness matrix

| System | Time-stepping sim? | Verdict |
|---|---|---|
| Material testing (UTM) | Parametric curve | **Sim-Ready** (narrow) |
| Thermal rig | Parametric | **Sim-Ready** (narrow) |
| Bike/ebike/battery (simulationEngine) | No — one-shot validation | **Architecture-Only** (strong validator) |
| Construction (bridge) | No — assembly puzzle | **Architecture-Only** |
| Ecology / food web | **No** | **Architecture-Only** (static graph + observation) |
| Biology Stage 1 (recipes) | No — crafting | Architecture-Only, **orphaned** |
| Biology Stage 2/3 (organism/ecosystem sim) | Stubs that `throw` | **Docs-Only** |
| Genetics / bio-engineering | 0 imports / md | **Docs-Only** |
| Ethnobotany / phytochem / pharmacology | md only | **Docs-Only** |
| Life support | — | **Missing** |

---

## Bottom line for simulation readiness

- **Nothing in BikeBrowser runs a population/ecosystem/dynamics simulation today.** The food-web is data + observation hooks; `stepSimulation` literally throws.
- The only systems that *model continuous physical behavior* are the **materials and thermal rigs** (parametric stress-strain / expansion) — these are sim-ready but tiny in scope.
- The **graph engine (`simulationEngine.js`)** is the most architecturally substantial "sim" but is a **one-shot validator**, not a dynamic simulator — it's the best foundation to build dynamics *on*, not a dynamic system itself.
- Everything in the biology spine that the design docs frame as "simulation" (ecosystems, organisms, living systems, food-web dynamics) is **Docs-Only or throwing stubs** — the simulation layer is designed but not implemented.
