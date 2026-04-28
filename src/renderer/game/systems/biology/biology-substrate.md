# Biology Substrate Design — Single Workbench, Three Modes

**Status:** Phase-2 design document. No code is shipped by this document.
Stage 1 implementation lands first (Act 1). Stages 2 and 3 are
**designed-for** here, **implemented later** (Act 2 and Act 3
respectively).
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when implementation ships.

**Companion documents (read alongside):**
- `src/renderer/game/systems/ecology/ecology-substrate.md` — paired in
  this commit; the two systems share a Species concept, an
  observation-event surface, and a relational-data model that Stage 3
  consumes directly.
- `arc.md` — strategic vision (especially §4 "Biology Workbench" and
  §6 "Open Design Questions" → "Biology Workbench").
- `.claude/plans/items-1-8-playbook-2026-04-27.md` §A.5 — biology
  workbench substrate placeholder (this document is the deliverable
  it called for).
- `src/renderer/game/data/quests.js` — biology-arc quests:
  `desert_healer`, `medicine_balance`, `extract_dna`,
  `understand_expression`, `engineer_bacteria`,
  `bio_battery_integration`, plus ecology consumers `food_chain_tracker`
  and `the_living_fluid`, and the materials-side `perfect_composite`.

---

## 1. Purpose

**Role.** The biology workbench is one of the most consequential
unbuilt carry-forward systems per arc.md §4. It is a **single workbench
with three modes** — Recipe (Stage 1), Parametric (Stage 2), Simulation
(Stage 3) — each more powerful and more abstract than the last. The
player progresses; they do not choose. The substrate at
`src/renderer/game/systems/biology/` owns living-system state for the
player: the recipes they have learned, the organisms they have
designed, the ecosystems they are simulating. It is portable per
arc.md §4 "Discipline for the biology workbench" — when the player
travels to space and to the alien planet, they take the workbench
with them.

**Not.** The biology workbench is **not** a renderer. It does not own
sprites, particle effects, or the visual identity of organisms (those
are asset / scene concerns). It does not own ecology entity placement
in the live world (that is the ecology substrate). It does not duplicate
the species-observation event surface (`ecology.observation`) — biology
may add biology-specific events but does not re-emit ecology events.
It does not write to `state.observations` directly for species — that
is ecology's authority. It does not own quest definitions or
`questSystem.js`.

**Curriculum served.** Per arc.md §1 ("foraged desert plant becomes
pharmacology and ecology") and §3 Act 1 (foraging, dose-response,
plant identification), Stage 1 teaches that **living systems require
conditions** and **inputs matter**. Per arc.md §3 Act 2 (greenhouse,
life-support), Stage 2 teaches that **biology is parameter-sensitive,
not magical** and that **trade-offs are real**. Per arc.md §3 Act 3
(closed-loop ecology, terraforming, stewardship), Stage 3 teaches
**ecological consequence** and **systems thinking** at its highest form
— "not just 'can I do this' but 'should I.'" Embedded values per
arc.md §2: ecology and stewardship over extraction; engineering
failure as feedback, not punishment.

---

## 2. Three-stage progression model

Per arc.md §4 "Biology Workbench" — the same workbench, three modes.
Each stage's interaction model, data shapes, failure modes, and unlock
trigger are below.

### Stage 1 — Recipe Biology (introduced Act 1, dominant Act 1 → early Act 2)

**Interaction model.** The player drops discrete inputs (items from
inventory) into named slots on the workbench. The workbench runs a
visible process (germination timeline, fermentation curve, extraction
yield). It produces a tagged output. Failure modes are visible and
specific: "too dry," "too cold," "wrong solvent," "bad ratio."

**Data read.**
- `data/items.js` — to validate input items.
- `data/recipes.js` (existing or to-be-extended for biology) — recipe
  definitions: required inputs, conditions, output.
- `data/ecology.js`, `data/flora.js`, `data/fauna.js` — read-only
  species lookup for input items that carry a species id (e.g.,
  `bio_sample_agave → 'agave'`).
- `state.inventory` — player inventory check.

**Data written.**
- `state.inventory` — consume inputs, grant outputs.
- `state.observations` — push the recipe's `outcomeObservationId`
  (e.g., `'dna_extracted'`, `'composite_created'`,
  `'bio_electrolyte_created'`). This is the surface that
  `extract_dna`, `understand_expression`, `engineer_bacteria`,
  `bio_battery_integration`, and `perfect_composite`'s observe-step
  gating already names.
- `state.biology.recipes[recipeId]` — first-success timestamp,
  attempt counter.

**Visible failure modes.**
- Missing input → recipe slot highlighted, "you need X" message.
- Wrong ratio → process visibly under-yields; output is missing or
  defective.
- Wrong condition (e.g., heat too high) → visible animation (sample
  scorches, extract turns brown). Output denied.

**Unlock trigger.** Stage 1 is available from Act 1, gated by the
narrative quest that introduces the workbench (TBD; likely
`desert_healer` Act 1 or a precursor).

### Stage 2 — Parametric Biology (unlocked Act 2, dominant Act 2)

**Interaction model.** Same workbench. The dials are now exposed —
temperature, pH, salinity, water availability, light wavelength /
intensity, nutrient concentration, oxygen / CO₂ balance, growth
rate vs resilience trade-off. The player runs trials to find optimal
conditions for a given organism, or discovers that two desirable
traits trade off against each other.

**Data read.**
- All Stage 1 inputs.
- A new `data/organismParameters.js` (Phase-3-Stage-2; not built today)
  — per-organism viable parameter envelopes.
- `data/ecology.js` `BIOMES` — for biome-derived parameter defaults.

**Data written.**
- `state.biology.organisms[organismId]` — designed organism with its
  parameter values.
- `state.observations` — `'organism_designed'` and per-organism
  observation strings.
- Optional: `biology.organism.designed` event consumed by ecology if
  the design includes an in-world planting plan (see §8).

**Visible failure modes.** Per arc.md §4: an organism survives but
doesn't thrive; a culture grows but is unstable; a plant adapts to one
parameter but becomes vulnerable in another. Each is a separate
visible trial outcome with diagnostic feedback.

**Unlock trigger.** **OPEN per arc.md §6.** Likely quest-gated: the
player demonstrates a successful Stage 1 recipe under varied
conditions, then unlocks narratively when the player needs parametric
work for a spacecraft life-support module or greenhouse. Decision
blocks Stage 2 implementation. See §15.1.

### Stage 3 — Simulation Biology (unlocked Act 3, dominant Act 3)

**Interaction model.** Same workbench. The player drops candidate
organisms (designed in Stage 2) into a simulator that renders a small
ecosystem — soil chemistry, atmosphere, temperature, water cycle,
native organisms (if any) — and observes outcomes over simulated time.
The simulator runs faster than real-time, but slowly enough that the
player sees the dynamics, not just the final state.

**Data read.**
- Stage 2's designed organisms (`state.biology.organisms`).
- Ecology substrate's `exportSimulationSnapshot()` (per
  `ecology-substrate.md` §7) — species relational schema.
- `data/ecology.js` `PREDATOR_CHAINS`, `BIOMES`, `TIME_BEHAVIOR` —
  pass-through.
- `data/alienBiomes.js` (future, Phase-3-Stage-3) — alien
  ecosystem templates.

**Data written.**
- `state.biology.ecosystems[ecosystemId]` — simulator state, simulated
  time, organism populations, environment trajectories.
- `state.observations` — outcome observations
  (`'ecosystem_stable'`, `'organism_overgrew'`, `'species_extinct'`,
  `'oxygen_collapsed'`, etc.).

**Visible failure modes.** Per arc.md §4: organism dies; organism
overgrows; ecosystem collapses; soil poisoned; water consumed; oxygen
or CO₂ destabilized. Each is a graphed time-series the player can
inspect and replay.

**Unlock trigger.** Act 3 narrative gate. Specifically: the player
must have completed Stage 2 unlock and demonstrated successful
parametric design.

---

## 3. Unified data model

The data model is **strictly extension** across stages — Stage 2
extends the Stage 1 Organism shape, Stage 3 extends the Stage 2 shape.
Old saves remain valid; missing optional fields use defaults.

### 3.1 Organism

**Stage 1 Organism (recipe outputs that produce a living thing).**

```
Organism {
  id: string,                     // 'bacteria_v1', 'tincture_creosote_2'
  speciesId: string | null,       // resolves to FLORA/FAUNA/microbes; null for crafted derivatives
  type: 'plant' | 'microbe' | 'animal-sample' | 'extract',
  recipeId: string,               // which Stage 1 recipe produced it
  createdAt: number,              // save timestamp
  attributes: { potency?, doseSafe?, contaminationLevel?, ... }
}
```

**Stage 2 Organism (extends Stage 1).**

```
Organism extends Stage1Organism {
  parameters: {
    temperature, pH, salinity, water, light, nutrients, oxygen, co2,
    growthRate, resilience
  },
  parameterEnvelope: {
    // Viable ranges for each parameter; ML-style "this organism is
    // happy here" envelope. Discovered by the player through trials.
    temperature: [min, max],
    ...
  },
  trials: TrialResult[],          // history of attempts with outcomes
}
```

**Stage 3 Organism (extends Stage 2).**

```
Organism extends Stage2Organism {
  ecosystemBehavior: {
    eats: speciesId[],             // typically inherited from ecology
    eatenBy: speciesId[],
    populationDynamics: { reproductionRate, mortalityRate },
    environmentalImpact: {         // how the organism modifies its environment
      consumes: [{ resource, rate }],
      produces: [{ resource, rate }],
    },
  },
}
```

Stage 3 ecosystem behavior is **co-derived** from ecology — a Stage 3
organism that is also an ecology species inherits `eats` / `eatenBy`
from the substrate's `getRelationTags()` output. Engineered organisms
(no underlying ecology species) declare their own.

### 3.2 Ecosystem (Stage 3 only)

```
Ecosystem {
  id: string,                     // 'mars_test_1'
  templateId: string,             // 'sonoran' | 'mars_basin' | 'europa_ocean'
  environment: {
    biomeId,                       // links to BIOMES
    soilChemistry: { ... },
    atmosphere: { o2, co2, n2, h2o, trace },
    temperature: { day, night, range },
    waterCycle: { precipitation, evaporation, groundwater },
  },
  populations: { [speciesId]: count },
  simulatedTime: number,
  tickRate: 'paused' | 'slow' | 'normal' | 'fast',
  history: TimeseriesSnapshot[],  // for replay
}
```

### 3.3 Recipe (Stage 1 only)

```
Recipe {
  id: string,                     // 'healing_salve', 'dna_extraction'
  name: string,
  inputs: [{ itemId, quantity }],
  conditions: { temperature, ... },  // optional; absent = "no condition"
  output: {
    type: 'item' | 'organism',
    itemId?: string,
    organismTemplateId?: string,
  },
  outcomeObservationId: string,   // pushed to state.observations on success
  failureModes: [
    { trigger: 'missing-input', message },
    { trigger: 'wrong-ratio', message },
    { trigger: 'wrong-condition', message },
  ],
  unlocks?: string[],             // recipes/observations unlocked by first success
}
```

Recipe ids are stable — quests like `desert_healer` (`healing_salve`)
already name them.

---

## 4. Public API

The substrate is exposed through `src/renderer/game/systems/biology/index.js`.
APIs are organized by stage. Stage 2 and Stage 3 APIs are **specified
now** so the codebase can be designed coherently; **implementation is
deferred** to the dispatches that build those stages.

### Stage 1 (Phase 3 implementation candidate)

```
registerRecipe(recipe)                  // load recipe definition (data-additive)
attemptRecipe(recipeId, inputs)         // returns { success, output, failures[] }
emitRecipeOutcome(recipeId, outcome)    // emits biology.recipe.outcome
listKnownRecipes()                       // → recipeId[]
```

### Stage 2 (deferred implementation; API specified)

```
designOrganism(parameters)              // returns Organism (stage-2 shape)
validateOrganism(organism)              // returns { valid, warnings[] }
emitOrganismDesignEvent(organism)       // emits biology.organism.designed
listDesignedOrganisms()                  // → Organism[]
```

### Stage 3 (deferred implementation; API specified)

```
createEcosystem(templateId)             // returns Ecosystem
introduceOrganism(ecosystemId, organism)
                                         // returns { accepted, warnings[] }
stepSimulation(ecosystemId, ticks)       // advances simulation; returns history delta
observeEcosystemState(ecosystemId)       // returns current populations + environment
emitSimulationEvent(ecosystemId, event)  // biology.simulation.tick / .outcome
```

### Cross-stage

```
getStageVisibility()                    // → 'stage-1' | 'stage-2' | 'stage-3'
                                         //   (which UI surfaces are visible to the player)
upgradeOrganismToNextStage(organismId)  // applies the strict-extension shape upgrade
```

`getStageVisibility()` reads from a save-state field
(`state.biology.unlockedStage`) populated by the Stage-2 / Stage-3
unlock triggers (per §2). It is the only way the UI knows which mode
to render.

---

## 5. Event model

### Events emitted

#### `biology.recipe.attempt` (Stage 1)

```
{ type: 'biology.recipe.attempt', recipeId, inputs, sceneKey, timestamp }
```

Fired on every attempt — useful for analytics and tutorials.

#### `biology.recipe.outcome` (Stage 1)

```
{
  type: 'biology.recipe.outcome',
  recipeId,
  success: boolean,
  failures: [{ trigger, message }],
  output,                            // item or organism
  outcomeObservationId,
  sceneKey,
  timestamp,
}
```

Drives observation push to `state.observations` and quest advancement.

#### `biology.organism.designed` (Stage 2)

```
{
  type: 'biology.organism.designed',
  organismId,
  speciesId,                         // null for engineered
  parameters,
  trialResults,
  sceneKey,
  timestamp,
}
```

Optionally consumed by ecology if the design includes a planting plan
(see §8).

#### `biology.simulation.tick` (Stage 3)

Throttled tick event; payload includes population deltas, environment
deltas, alerts. Cadence governed by `Ecosystem.tickRate`.

#### `biology.simulation.outcome` (Stage 3)

Fired on terminal events: ecosystem collapse, stable equilibrium
reached, runaway organism, manual end. Drives observation push for the
"can I run a sustainable closed loop" curriculum bullet of arc.md §3
Act 3.

### Events listened for

#### `ecology.species.discovered` (forward-looking)

If the ecology substrate (Phase 6+) emits a "first observation of a
species" event, biology may use it to unlock recipes that depend on
that species (e.g., once you observe `mesquite`, the
`mesquite_pod_extract` recipe appears). Today, biology can listen for
`ecology.observation` directly. The event-name above is reserved for
the eventual deduplicated form.

#### `knowledge.state.unlocked` (deferred)

Per arc.md §8.5, knowledge state is gated on
`knowledge-state-substrate.md`. When that lands, biology may listen for
"player has Understood concept X" to unlock advanced recipes /
parametric ranges / ecosystem templates. Until then, biology does not
consume knowledge state.

---

## 6. World-model primitive integration

Per arc.md §8.1.

### Environmental primitives consulted

- **Biome** — Stage 2 reads `BIOMES` for parameter defaults; Stage 3
  reads `BIOMES` for ecosystem environment templating. Per arc.md §8.6,
  no hardcoded biome strings: use `getBiomeAt()` / `getBiomeById()`.
- **Terrain.** Not directly consulted today. If a future recipe / Stage
  2 trial cares about terrain (e.g., "this organism only thrives on
  rocky terrain"), it goes through the ecology substrate's
  terrain-aware queries.

### Progression primitives updated

- **Knowledge state.** NOT consumed and NOT updated until
  `knowledge-state-substrate.md` lands (arc.md §8.5).
- **Observations.** `state.observations` receives recipe outcomes
  (`'dna_extracted'`, etc.) and Stage 3 simulation outcomes. Biology
  does NOT push species-observation strings — those are ecology's
  authority.
- **Discovery / landmarks.** Not updated.

### Act 1 → Act 3 scaling

Stages 1 → 2 → 3 are the explicit scaling. Per arc.md §8.2, no
act-specific carve-outs: the same code path handles a Stage 1 healing
salve in Act 1 and a Stage 1 alien tincture in Act 3. Stage gating is
through `getStageVisibility()`, never through act-specific branches.

---

## 7. Portability discipline

Per arc.md §4 "Discipline for the biology workbench" → the workbench
is **portable**. The player owns it; it is not a location they visit.
Portability rules:

1. **State owned by save, not by scene.** `state.biology.*` is the
   authority. Scenes mount the workbench UI; they do not own its data.
2. **Scene-attachment is runtime, not authored.** A scene declares "I
   host the workbench here at (x, y)" via layout JSON; the substrate
   binds to that mount point on scene mount.
3. **Same workbench across acts.** The Act 1 garage workbench and the
   Act 3 alien habitat workbench are the same `BiologyWorkbench`
   substrate, just rendered in different scenes.
4. **No scene imports inside `systems/biology/`.** Per arc.md §4.
5. **The portability mechanism is open per arc.md §6** ("is it a
   literal inventory item, a permanent unlock, part of the ship?").
   The substrate design above is **agnostic** — it works for any of
   the three. The decision affects scene-mount UX, not substrate
   architecture. See §15.6.

---

## 8. Ecology bridge contract

**This section is paired with `ecology-substrate.md` §7 "Stage
progression and the Biology bridge" and must agree.** Drift is
non-shippable.

### Stage 1 ↔ Ecology

**What biology asks.** Read-only species lookup for inputs that carry
a species id. Stable `grantsItemId → speciesId` mapping for input
validation.

**What ecology guarantees.** Stable speciesIds; FLORA and FAUNA tables
do not change shape between stages.

**Exchange format.** Direct data reads from `data/ecology.js`,
`data/flora.js`, `data/fauna.js`. No event traffic. No cross-system
state.

### Stage 2 ↔ Ecology

**What biology asks.** Read-only access to `PLANT_ECOLOGY.biome` and
`BIOMES.<biomeId>` for parameter defaults.

**What ecology guarantees.** No schema changes that break biology's
reads. If a new field is added to BIOMES, biology adapts; biology does
not require ecology to change.

**Exchange format.** Read-only data queries. **Optional** one-way
event `biology.organism.designed` — if the design includes an in-world
planting plan, ecology MAY consume the event to register the planted
organism as a `spawnedBy: 'biology'` ecology entity. **Decision is
open** per §15.4.

### Stage 3 ↔ Ecology

**What biology asks.** The full simulation snapshot per
`ecology-substrate.md` §7 "Exact data shape Stage 3 needs from
ecology" — species records (with `eats`, `eatenBy`, `requirements`,
`visualToken`), `PREDATOR_CHAINS`, `BIOMES`, `TIME_BEHAVIOR`.

**What ecology guarantees.** Schema-versioned `exportSimulationSnapshot()`
that delivers exactly this shape. The simulator does not invent its
own predator–prey model; it consumes `PREDATOR_CHAINS` directly.
Microbes register through ecology with `type: 'microbe'`.

**Exchange format.** Read-only snapshot at simulator creation; biology
holds the snapshot in `Ecosystem.environment` / population tables.
Biology does NOT receive live updates from ecology during simulation
ticks — the snapshot is a frozen baseline.

**Engineered organisms** — biology-only entities without an underlying
ecology species — declare their own `ecosystemBehavior` per §3.1
(Stage 3 Organism extension).

### Cross-cutting consistency rules

These match the dispatch's non-negotiable cross-consistency
requirements:

1. **Species concept.** `speciesId` is authoritative across both
   systems. Biology never invents a parallel id.
2. **Observation events.** Ecology owns `ecology.observation` and the
   species-observation surface. Biology emits its own events
   (`biology.recipe.outcome`, `biology.organism.designed`,
   `biology.simulation.outcome`) for biology-specific outcomes.
3. **Tag system.** `relationTags` are authored in `data/ecology.js`.
   Biology may add biology-specific tags
   (`recipe-output:dna_extracted`, `engineered:true`) on its own
   entities, but never modifies ecology's tags.
4. **Stage 3 ecosystem data shape.** Compatible with ecology's
   relational data per §7 above.
5. **Save state separation.** Ecology stores per-species runtime state;
   biology stores per-recipe and per-organism (and per-ecosystem)
   state; no overlap of authority. Cross-cutting state
   (e.g., a biology-spawned ecology entity) is co-designed and one
   system owns it.
6. **Cross-cutting open questions.** Both substrates flag knowledge
   state, navigation paradigm, and asset pipeline dependencies in
   their open-questions sections.

---

## 9. Engineered-organism consequence model (open per arc.md §6)

Per arc.md §4 Stage 3 and §6, whether failures in Stage 3 propagate to
the live game world is a **Real Game Mechanic decision** that should
be made deliberately. Three plausible models:

### Model A — Pure simulator (in-silico only)

The simulator's outcomes affect simulator state only. A failed organism
"escapes" the simulator only as a UI message. The player's live world is
unaffected.

- **Pro:** safest. Failure is feedback; no save corruption risk.
- **Con:** ethics-as-gameplay weaker — "should I do this" loses bite
  if "this" never leaves the petri dish.

### Model B — Soft consequence (cosmetic / narrative)

The simulator's outcomes affect dialog, NPC trust, and cosmetic world
state but do not propagate to ecology entities or other carry-forward
systems. NPCs may comment on a runaway organism; the world does not
visibly change.

- **Pro:** medium curriculum weight; ethics has narrative consequences
  without simulation engineering complexity.
- **Con:** fakes simulation-vs-reality.

### Model C — Hard consequence (in-world propagation)

A simulator failure spawns a real `EcologyEntity` (with `spawnedBy:
'biology'`) into the live ecology that the player must contain. The
substrate must support reversibility per arc.md §3 Act 3 ("Risk,
containment, reversibility").

- **Pro:** maximum curriculum weight; arc.md §1's stewardship lesson
  lands hardest.
- **Con:** demands a simulation tick architecture in the live engine,
  save robustness for biology-spawned entities, containment mechanics,
  and reversibility tooling. Highest implementation cost. Risk of
  save corruption.

### Recommended default for Phase 3 implementation

**Model A for Phase 3 (Stage 1 ships first; Stage 3 is far later).**
The Phase-3 dispatch builds Stage 1 only; Stage 3 lives in its own
later dispatch where this open question resolves. **Flag for user
decision before Stage 3 is built.** The decision affects
`biology-substrate.md` v2 and the Stage-3 dispatch prompt; it does NOT
affect Phase 3.

Per arc.md §6, this decision is also flagged in the open-questions
list there. This document is the consolidated home of the question —
when it resolves, both arc.md §6 and this document update in the same
commit.

---

## 10. Failure modes and ethics gameplay

Per arc.md §4 "every mode supports observable failure." The substrate
enforces this by REQUIRING every recipe / organism / ecosystem
operation to declare its failure modes alongside its success path.

### Stage 1 failure shapes

- **Missing input** — slot highlighted, "you need X."
- **Wrong ratio** — under-yield, defective output.
- **Wrong condition** — visible damage animation.

### Stage 2 failure shapes

- **Out-of-envelope parameter** — organism dies or becomes unstable.
- **Trade-off violation** — one parameter optimized at the cost of
  another; organism survives but is fragile.

### Stage 3 failure shapes

- **Population collapse** — organism dies out.
- **Population explosion** — organism overgrows; consumes resources;
  collapses other species.
- **Environmental destabilization** — oxygen / CO₂ / soil chemistry
  tips out of bounds.
- **Cascade extinction** — one species's failure propagates through
  `PREDATOR_CHAINS`.

### How each is communicated and recorded

- **Communication:** every failure has a labeled UI surface — recipe
  slot highlight, parameter histogram showing the out-of-envelope
  region, time-series graph of the simulator. **Per arc.md §4
  "Failures must be diagnosable, not just 'you lose.'"**
- **Recording:** every failure pushes a tagged observation
  (`'recipe_failed:wrong_ratio'`, `'organism_unstable'`,
  `'ecosystem_collapsed'`) to `state.observations`. Quests may gate on
  failure observations the same way they gate on success observations
  — failure-as-curriculum.

### Ethics as gameplay

Per arc.md §4 "Ethics is gameplay, not lecture": Stage 3 must
*demonstrate* consequences, not explain them in dialogue. The
simulator's runaway-organism scenario is the lesson — graphed,
visible, recorded. NPC dialog acknowledges the outcome but does not
deliver the moral. Per arc.md §1 "engineering failure as feedback,
not punishment" — failures do not lock the player out of progression;
they are the progression.

---

## 11. Save state model

### What persists

- **Stage 1.** `state.biology.recipes[recipeId]` (first-success
  timestamp, attempt counter), recipe outcomes that affected inventory
  (already in `state.inventory`).
- **Stage 2.** `state.biology.organisms[organismId]` (full Organism
  shape per §3.1).
- **Stage 3.** `state.biology.ecosystems[ecosystemId]` (full Ecosystem
  shape per §3.2). Per-tick history is bounded (last N snapshots) to
  prevent save bloat.
- **`state.biology.unlockedStage`** — `'stage-1' | 'stage-2' | 'stage-3'`.

### What does not persist

- Active simulator ticks (regenerated on resume from snapshot).
- UI state (which dial the player was looking at).
- Recipe definitions (those live in `data/`, not save).

### Authority separation

Per cross-consistency rule §5: biology owns recipe / organism /
ecosystem state. It does not write to ecology's per-species runtime
state. If a Stage 3 simulation produces an in-world entity (Model C in
§9), the entity is registered through the ecology substrate's
`registerEntity()` API with `spawnedBy: 'biology'`; from that point
ecology owns its lifecycle.

---

## 12. Performance and lifecycle

### Registration cost

Recipe registration is O(1). Organism design (Stage 2) is O(P) where P
is the number of parameter dimensions — bounded (10ish). Ecosystem
creation (Stage 3) is O(S) where S is the species count in the
ecosystem template — bounded (typically <30).

### Per-frame cost

- **Stage 1 / 2:** zero. Workbench UI is event-driven.
- **Stage 3 simulation:** bounded by `Ecosystem.tickRate`. Open
  question §15.4 governs the tick model.

### Stage 3 simulation tick model

**Open per §15.4.** Three plausible models:

- **Fixed-step (real-time milliseconds):** simulator ticks at a fixed
  cadence regardless of player action. Pro: feels alive. Con: hard to
  stop and inspect.
- **User-paced (turn-based):** player presses a button to advance one
  tick. Pro: always inspectable. Con: tedious for long runs.
- **Pause-and-step (default proposed):** simulator runs at a
  configurable real-time cadence (`'paused' | 'slow' | 'normal' |
  'fast'`) with explicit pause and single-step controls. Pro: best of
  both. Con: more UI surface.
- **Recommended default:** pause-and-step.

### Scene shutdown

The biology substrate is **portable** and scene-independent. On scene
shutdown, the workbench UI unmounts; the substrate's state survives.
Active simulations continue ticking only if the player explicitly
chooses; otherwise simulators pause on scene unmount and resume on
next mount.

### HMR

Save-backed state survives HMR. UI state is re-derived from save on
remount.

### Performance budget for Stage 3 simulator

Defaults proposed (open for tuning):
- Maximum 30 species per ecosystem.
- Maximum 1000 simulated ticks of history retained.
- Tick cadence at `'fast'` setting: 4 ticks/second.
- Population deltas per tick: O(species × chains) ≈ 30 × 8 = 240 ops.
  Trivial on 2026 hardware.

---

## 13. Discipline rules

Non-negotiable per arc.md §4:

1. **Single workbench, three modes.** Not three workbenches. The UI
   surfaces a different toolset by stage; the substrate is one.
2. **Mode unlock is narrative / quest-gated, not branch-selected.**
   The player progresses; they don't choose. `getStageVisibility()` is
   the only mode-selection surface.
3. **Living-system parameters live in data.** New organisms, new
   soils, new alien biomes are data additions, not code changes.
4. **Every mode supports observable failure.** Failure modes are
   declared alongside success paths in recipe / organism / ecosystem
   definitions. (See §10.)
5. **Ethics is gameplay, not lecture.** Stage 3 demonstrates
   consequences; it does not explain them in dialogue.
6. **Portability.** State owned by save, not scene. Same workbench
   across acts. (See §7.)
7. **No scene imports inside `systems/biology/`.** Per arc.md §4.
8. **No direct quest mutation.** The substrate writes to
   `state.observations` only. It does not call
   `questSystem.advance()`.
9. **No knowledge-state coupling** until
   `knowledge-state-substrate.md` lands per arc.md §8.5.
10. **No species observation duplication.** Biology emits
    biology-specific observations (recipe outcomes, organism designs,
    simulator outcomes). It does not push species ids to
    `state.observations` — that is ecology's authority.

---

## 14. Out of scope

- **Workbench UI rendering.** This document specifies data and events;
  rendering (slot UI, parameter dials, simulator graphs) is a separate
  scene-side concern.
- **Specific recipes / organisms / ecosystems content.** Those are
  data authoring and require curriculum design (see arc.md §2 cultural
  representation rule for any recipe naming a specific cultural
  tradition).
- **Biology-themed asset loading.** Per arc.md §7, asset import is a
  separate dispatch.
- **Multiplayer.** Per arc.md §7.
- **Realistic genetic engineering simulation.** Per arc.md §7. The
  biology workbench is age-appropriate (per the dispatch's "decisions
  that apply without asking").
- **Combat / pathogen warfare.** Per arc.md §7 and the embedded values
  in arc.md §2 (stewardship, not extraction).
- **Cross-pillar feature work** (using browser learning state to
  unlock biology recipes, etc.). Per arc.md Context.

---

## 15. Open questions for resolution before implementation

These do not block this design document. They DO block specific
implementation phases.

### 15.1 Stage 2 unlock trigger (open per arc.md §6)

Quest-gated? Act-gated? Skill-demonstration? Affects whether Stage 1
design needs to anticipate Stage 2 surfacing. Proposed default:
quest-gated, with the quest narratively appearing at Act 2 transition
when the player needs parametric work for a spacecraft life-support
module or greenhouse. **Decision blocks Stage 2 implementation, NOT
Stage 1.**

### 15.2 Engineered-organism consequence model (open per arc.md §6)

See §9. Proposed default: Model A (pure simulator) for the first
Stage 3 implementation; revisit before any "release organism into
world" gameplay surfaces. **Decision blocks Stage 3 implementation.**

### 15.3 Recipe authoring format

Where do biology recipes live — `data/recipes.js` (extending the
existing crafting-recipes format) or a new `data/biologyRecipes.js`?
Proposed default: extend `data/recipes.js` with a `category: 'biology'`
flag. **Decision blocks Phase 3 / Stage 1 implementation.**

### 15.4 Stage 3 tick rate and player pacing

See §12. Proposed default: pause-and-step with `'paused' | 'slow' |
'normal' | 'fast'` cadence. **Decision blocks Stage 3 implementation.**

### 15.5 Number of parameter dimensions visible to a child player at Stage 2

Per arc.md §1 (target learner is upper-elementary to middle-school).
Proposed default: 5 visible dimensions at first unlock (temperature,
water, light, nutrients, pH); 4 advanced dimensions unlock through
Stage 2 progression (salinity, oxygen, CO₂, growth-vs-resilience).
**Decision blocks Stage 2 implementation.**

### 15.6 Whether parametric trials are saved and re-runnable, or one-shot

Saved-and-re-runnable lets the player iterate on a single design;
one-shot enforces commitment. Proposed default: saved-and-re-runnable
with last 10 trials retained per organism. **Decision blocks Stage 2
implementation.**

### 15.7 Portability mechanism (open per arc.md §6)

Inventory item, permanent unlock, ship module? Proposed default:
permanent unlock that the player carries with them implicitly — once
the workbench is introduced narratively, it is always available at any
scene with a designated mount point. **Decision affects scene-mount
UX in Phase 3 implementation, not substrate architecture.**

### 15.8 Cross-cutting open questions (ecology × biology × world model)

- **Knowledge state integration.** Both substrates flag this — neither
  consumes knowledge state until `knowledge-state-substrate.md` lands
  per arc.md §8.5.
- **Navigation paradigm dependency.** Does not directly affect biology
  (the workbench is portable / scene-attached). Flagged for symmetry
  with ecology.
- **Asset pipeline dependency.** Biology workbench UI and Stage 3
  organism/ecosystem visualizations will eventually use licensed
  assets. The substrate's data model is asset-agnostic; the scene-side
  rendering layer owns the asset binding.

---

## Cross-document drift resolution

**Status: NONE.** Cross-consistency review against the dispatch's six
non-negotiable requirements:

1. **Species concept** — both documents reference `data/ecology.js` /
   `data/flora.js` / `data/fauna.js` as canonical; `speciesId` is
   authoritative across both. CLEAN.
2. **Observation events** — ecology owns `ecology.observation` and
   species observation strings. Biology emits its own events
   (`biology.recipe.outcome`, etc.) for biology-specific outcomes; does
   NOT duplicate species observations. CLEAN.
3. **Tag system** — `relationTags` authored in ecology
   (`getRelationTags()`); biology may add biology-specific tags on
   its own entities but never modifies ecology's tags. CLEAN.
4. **Stage 3 ecosystem data shape** — exact shape specified in
   `ecology-substrate.md` §7 and re-stated in `biology-substrate.md`
   §8 (Stage 3 bridge). The simulator consumes `PREDATOR_CHAINS`
   directly. CLEAN.
5. **Save state separation** — ecology owns per-species runtime state
   (`state.observations` for species, `state.ecology[regionId]` for
   procedural populations, `state.ecology.foraged` for depletion);
   biology owns per-recipe and per-organism and per-ecosystem state
   (`state.biology.*`). No overlap of authority. CLEAN.
6. **Cross-cutting open questions** — both flag knowledge state,
   navigation paradigm, and asset pipeline dependencies. CLEAN.

No drift to resolve.
