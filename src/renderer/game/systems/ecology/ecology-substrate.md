# Ecology Substrate Design — `EcologyEntity` Carry-Forward System

**Status:** Phase-2 design document. No code is shipped by this document.
Phase 3 (skeleton stand-up) is gated on this design landing and on the
companion `biology-substrate.md` (paired dispatch, same commit).
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when Phase 3+ implementations ship.

**Companion documents (read alongside):**
- `src/renderer/game/systems/biology/biology-substrate.md` — paired in
  this commit; the two systems share a Species concept and an
  observation-event surface.
- `arc.md` — strategic vision (especially §4 Carry-Forward Systems and
  §8 World Model Alignment Layer).
- `.claude/bugs/2026-04-27-ecology-substrate-vs-static-layout-audit.md`
  — Phase 0 audit recommending Path B (port `populateWorld` rather than
  quarantine it).
- `.claude/bugs/2026-04-27-neighborhood-orphan-inventory.md` — entity
  inventory the substrate must subsume.
- `.claude/plans/items-1-8-playbook-2026-04-27.md` §A.9 — phased
  dispatch plan.
- `src/renderer/game/data/ecology.js` — canonical substrate data:
  `PLANT_ECOLOGY`, `PREDATOR_CHAINS`, `TIME_BEHAVIOR`, `BIOMES`,
  `getBiome()`, `getLinkedAnimals()`, `getPredators()`, `getPreyFor()`.

---

## 1. Purpose

**Role.** `EcologyEntity` is the carry-forward system that owns living
things in the game world — plants, animals, microbes, and (in Act 2+)
regional flora and fauna — as **scene-independent typed instances** with
species ids, observation hooks, foraging hooks, and relational tags
sourced from `data/ecology.js`. It is the runtime home of the food-web
model that arc.md §3 Act 1 names as "Desert ecology … animal habitats"
and that arc.md §4 Biology Workbench Stage 3 ("Simulation Biology")
inherits as its progenitor. The substrate sits in
`src/renderer/game/systems/ecology/` per the arc.md §4 architectural
discipline — carry-forward systems live there with **no scene imports**.

**Not.** `EcologyEntity` is **not** a renderer. It does not own sprites,
tweens, or visual style. It does not own scene layout — those positions
live in `public/layouts/<scene>.layout.json` and are loaded via
`loadLayout()`. It does not own quest state — quests live in
`data/quests.js` and are advanced through `state.observations` and
`state.inventory`, never through direct quest mutation. It does not own
the species data — that data is canonical in `data/ecology.js`,
`data/flora.js`, and `data/fauna.js`, and is read-only from the
substrate's perspective. It is **not** the Knowledge State System:
discovery state (geographic) and knowledge state (conceptual) are
explicitly distinct per arc.md §8.5; the ecology substrate writes
observations only.

**Curriculum served.** Act 1 desert ecology (food-chain discovery,
predator–prey observation, foraging-with-ethics, dose-response framing
through plant identification). Act 2 regional ecology (per arc.md §3
Act 2 — extraction has consequences, depletion dynamics, scale to seven
Earth regions). Act 3 closed-loop ecology (per arc.md §3 Act 3 and §4
Stage-3 Simulation Biology — the simulator that runs ecosystems before
deployment consumes the same `EcologyEntity` schema; alien species
register through the same `FLORA`/`FAUNA`/`PLANT_ECOLOGY` pattern with
no act-specific carve-outs per arc.md §8.2).

---

## 2. Data substrate consumption

`data/ecology.js` is canonical. The substrate consumes it; it does not
redesign it. Every table below is read-only from the substrate's
perspective. New species are added by editing the data tables in
`data/`, never by code in `systems/ecology/`.

### 2.1 `FLORA` (in `data/flora.js`)

**Provides.** Per-species visual tokens (color, size, height offset),
spawn density, biome affinity, forage product mappings.

**Substrate query API.**

```
getFloraSpecies(speciesId)            // → record or null
listFloraSpeciesByBiome(biomeId)      // → speciesId[]
isFloraSpecies(speciesId)             // → boolean
```

**Invariants enforced by the substrate.** None — `data/flora.js` is
authoritative. The substrate will halt-and-surface (in dev mode) on a
registration that names a species id missing from FLORA + FAUNA;
production builds log the warning and skip the registration.

**Invariants NOT enforced by the substrate.** Cross-table consistency
(e.g., a `supports` entry in `PLANT_ECOLOGY` that names a species
absent from FAUNA) is enforced by `data-schema-keeper`-style audits at
build time, not at runtime. The substrate trusts the data.

**Typical query.** "What plants grow in `desert_scrub`?" →
`listFloraSpeciesByBiome('desert_scrub')` returns
`['creosote', 'mesquite', 'prickly_pear']` (per `BIOMES.desert_scrub`).

### 2.2 `FAUNA` (in `data/fauna.js`)

**Provides.** Per-species visual tokens (emoji, color, speed, aerial
flag), `requiresPlants` constraint, `activeTimes` (day/night/dawn/dusk).

**Substrate query API.**

```
getFaunaSpecies(speciesId)            // → record or null
listFaunaSpeciesByTime(timeOfDay)     // → speciesId[]   delegates to TIME_BEHAVIOR
listFaunaSpeciesRequiring(plantSpeciesId)
                                       // → speciesId[]   reverse lookup
```

**Invariants enforced.** Same as flora — substrate trusts the table.

**Typical query.** "What animals are active at night and require
mesquite or prickly_pear?" → composed from
`listFaunaSpeciesByTime('night')` ∩
`listFaunaSpeciesRequiring('mesquite')` ∪
`listFaunaSpeciesRequiring('prickly_pear')`.

### 2.3 `PLANT_ECOLOGY` (in `data/ecology.js`)

**Provides.** Per-plant relational metadata: `supports` (which animals
the plant feeds), `predatorsNearby` (which predators tend to be near
that plant because their prey is), `pollinators`, `spawnBoost`,
`biome`, and feature flags (`producesFood`, `providesNesting`,
`providesShade`, `waterSource`).

**Substrate query API.**

```
getPlantEcology(speciesId)            // → record or null
getLinkedAnimals(speciesId)           // → speciesId[]   (delegates to data/ecology.js)
getRelationTags(speciesId)            // → string[]   composed: 'supports:javelina',
                                       //               'predatorsNearby:hawk',
                                       //               'feature:producesFood', etc.
```

**Invariants enforced.** None. Substrate exposes whatever the table
contains.

**Typical query.** "Player observed mesquite — what relational tags
should fire as secondary observations?" → `getRelationTags('mesquite')`
returns
`['supports:javelina', 'supports:rabbit', 'supports:quail', 'predatorsNearby:coyote', 'feature:producesFood', 'biome:desert_scrub']`.
Whether to fire secondary events is governed by the open-question §13.1
("atomic vs separate secondary observation events").

### 2.4 `PREDATOR_CHAINS` (in `data/ecology.js`)

**Provides.** `{ prey, predator, probability }` edges. Eight committed
edges for Act 1 (per the audit §2 matrix).

**Substrate query API.** Delegates to existing functions:

```
getPredators(preySpeciesId)           // → [{ species, probability }]
getPreyFor(predatorSpeciesId)         // → [{ species, probability }]
listChainEdges()                      // → PREDATOR_CHAINS clone (read-only)
```

**Invariants enforced.** None at runtime. (Build-time audit verifies
every prey/predator name resolves to FAUNA.)

**Typical query.** Stage 3 simulator asks "what eats javelina?" →
`getPredators('javelina')` returns `[{ species: 'coyote', probability: 0.3 }]`.

### 2.5 `BIOMES` and `getBiome(elevation, moisture)`

**Provides.** Per-biome elevation/moisture envelope, dominant plants,
canonical temperature.

**Substrate query API.**

```
getBiomeAt(elevation, moisture)       // → { id, ...biome }   (delegates)
getBiomeById(biomeId)                 // → biome record or null
listBiomes()                          // → biomeId[]
```

**Invariants enforced.** None — `getBiome()` already falls back to
`desert_scrub` when no envelope matches. Per arc.md §8.6 ("primitive
fragmentation is CRITICAL"), substrate consumers must use
`getBiomeAt()` rather than hardcoding biome strings; that is a
discipline rule, enforced by review.

### 2.6 `TIME_BEHAVIOR`

**Provides.** Per-time-of-day active animals list, plant activity
phase, visibility, temperature.

**Substrate query API.**

```
getTimeBehavior(timeOfDay)            // → record
isAnimalActiveAt(speciesId, timeOfDay)// → boolean
listActiveAnimals(timeOfDay)          // → speciesId[]
```

**Invariants enforced.** None.

**Typical query.** "Player is in `desert_scrub` at night — what fauna
should be observable?" →
`listActiveAnimals('night')` ∩ `listFaunaSpeciesByBiome('desert_scrub')`.

### 2.7 Time-of-day, elevation, and other rules

Time-of-day rule consumption is canonical (per `TIME_BEHAVIOR`).
Elevation rule consumption is via `getBiomeAt()`. There is no separate
"weather" or "season" table today; if one is added it lives in
`data/ecology.js` and the substrate exposes it through the same
read-only API pattern.

---

## 3. Entity model

An `EcologyEntity` is a runtime record produced by `registerEntity()`
and stored in the substrate's per-scene registry. It is **not** stored
in `data/`; it is produced from data plus runtime context.

### Required fields (every entity)

| Field | Type | Source | Notes |
|---|---|---|---|
| `id` | string | substrate | Unique within the substrate. Format: `<sceneKey>:<speciesId>:<n>` for scene-attached, `proc:<seed>:<n>` for procedural (Phase 6). |
| `speciesId` | string | caller / data | Must resolve to FLORA or FAUNA. |
| `type` | `'flora' \| 'fauna' \| 'microbe'` | derived | From which table the speciesId resolves to. (`'microbe'` reserved for Stage 1 biology — see §7 below.) |
| `sceneKey` | string | caller | The Phaser scene key the entity is attached to. Used for cleanup on `scene.shutdown`. |
| `x` | number | caller / layout | World x. Layout-driven for static entities (per CLAUDE.md layout-system rule); procedural for Phase 6 spawns. |
| `y` | number | caller / layout | World y. Same. |
| `spawnedBy` | `'layout' \| 'procedural' \| 'biology'` | caller | Tracks origin for save/refresh decisions. |

### Optional fields (with defaults)

| Field | Type | Default | Notes |
|---|---|---|---|
| `interactionRadius` | number | `48` | Pixel radius for proximity events. |
| `observable` | boolean | `true` | If false, entity is decorative-only (no observation events fire). |
| `forageable` | boolean | derived from `grantsItemId` | If `grantsItemId` is set, defaults `true`. |
| `grantsItemId` | string \| null | `null` | The `data/items.js` id granted on forage interaction. Reads existing `sceneItemGrants.js` mapping by default. |
| `questObservationId` | string \| null | `speciesId` | Override only when the quest expects a non-species observation string (e.g., `'composite_created'`). |
| `inspectText` | string \| null | `null` | Optional rich-inspect text; falls back to `data/flora.js`/`data/fauna.js` description. |
| `timeOfDayRule` | `'always' \| 'fauna-default' \| 'plant-default' \| 'custom'` | `'fauna-default'` (fauna), `'always'` (flora) | How `TIME_BEHAVIOR` is applied. See open question §13.4. |
| `biomeRule` | `'enforced' \| 'soft' \| 'ignored'` | `'soft'` | `'enforced'` skips registration when the biome at `(x,y)` does not match `getPlantEcology(speciesId).biome`; `'soft'` warns; `'ignored'` skips the check. |

### Relationship fields (populated at registration)

These are computed from `data/ecology.js` at registration time and
cached on the entity:

| Field | Type | Source |
|---|---|---|
| `eats` | speciesId[] | For fauna: `getPreyFor(speciesId)` species list. For flora: `[]`. |
| `eatenBy` | speciesId[] | For flora: `getPlantEcology(speciesId).supports` (animals that feed on it). For fauna: `getPredators(speciesId)` species list. |
| `nearbyAttractors` | speciesId[] | For flora: `getPlantEcology(speciesId).predatorsNearby`. For fauna: `[]`. |
| `relationTags` | string[] | Output of `getRelationTags(speciesId)` (see §2.3). Used in observation events for category-based quest gating. |

These fields are not editable post-registration. Re-derive by
re-registering.

---

## 4. Public API

The substrate is exposed through `src/renderer/game/systems/ecology/index.js`
(barrel export). Internal modules (`ecologyState.js`,
`ecologyQueries.js`, `ecologyTicker.js` — per playbook §A.9.2) are
implementation details and not part of the public surface.

```
registerEntity(scene, partial)         // → EcologyEntity
registerEntities(scene, partial[])     // → EcologyEntity[]
registerProcedural(scene, options)     // Phase 6 only — see §8 below
queryEntities(predicate)               // → EcologyEntity[]
emitObservation(entity, source)        // pushes speciesId + relationTags into state.observations
emitForage(entity, source)              // grants grantsItemId (via foragingSystem) + emits ecology.forage
debugDrawEcologyEntities(scene)         // dev-only overlay (private; behind a debug flag)
```

### `registerEntity(scene, partial)`

**Contract.**
1. `partial.speciesId` must resolve to FLORA or FAUNA (or be a known
   `'microbe'` id if the biology system has registered that species —
   see §7).
2. `partial.x`, `partial.y` must be numbers.
3. The substrate computes `type` from data, derives relationship fields,
   resolves `grantsItemId` (default lookup falls back to
   `sceneItemGrants.js` for the scene+species pair), and assigns an
   `id`.
4. The substrate calls the private `attachInteractionZone(scene, entity)`
   to install a Phaser interaction zone honoring `interactionRadius`,
   `observable`, and `forageable`. The zone is **owned by the scene's
   lifecycle** (cleaned up on `scene.shutdown` per §10).
5. The entity is appended to the substrate's per-scene registry.
6. **Return value** is the populated `EcologyEntity`. Callers MAY
   attach the entity to their own depth-sortable list (per existing
   scenes' `_depthSortables` pattern) — the substrate does not own
   render order.

**Errors.** Unknown speciesId → halt-and-surface in dev (`throw`),
warn-and-skip in production. Missing `x`/`y` → throw.

### `registerEntities(scene, partial[])`

Convenience wrapper. Iterates `registerEntity()`. Returns the array of
populated entities. Used by scenes that consume `layout.plants` lists.

### `registerProcedural(scene, options)` — DEFERRED to Phase 6

**Contract (specified now, implemented later).**

```
registerProcedural(scene, {
  regionId,                  // required — drives biome lookup
  gridSize,                  // sample density (default 60 per legacy populateWorld)
  timeOfDay,                 // 'day' | 'night' | 'dawn' | 'dusk'
  seed,                      // deterministic seed (per open question §13.6)
  excludeZones,              // function(x, y) → boolean
}) → EcologyEntity[]
```

The Phase-6 implementation moves `populateWorld` /
`spawnFlora` / `spawnFauna` / `applyFoodChain` from
`ecologyEngine.js` into `ecologyTicker.js` per playbook §A.9.6.
Phase 6 is gated on the `navigation-substrate.md` decision (A.7
reframe) — if marker-based navigation wins, `registerProcedural` is
deferred indefinitely; only `registerEntity` / `registerEntities`
ship in Phases 3–5.

### `queryEntities(predicate)`

Returns all currently-registered entities matching the predicate.
Predicate is a function `(entity) => boolean` or one of the named
helpers:

```
queryEntities.bySpecies(speciesId)
queryEntities.byScene(sceneKey)
queryEntities.byTag(relationTag)        // e.g., 'supports:javelina'
queryEntities.byBiome(biomeId)
```

Used by the Stage-3 simulator (per §7) and by debug tooling. **Not** a
quest-gating mechanism: quests gate on `state.observations`, never on
`queryEntities()` results.

### `emitObservation(entity, source)`

Called by the private interaction zone and (rarely) by scene code that
wants to programmatically observe an entity (e.g., a cutscene). Effects:

1. Pushes `entity.questObservationId` (or `entity.speciesId`) into
   `state.observations` (if not already present, per open question §13.3).
2. If the open-question §13.1 resolves to "atomic", also pushes each
   `entity.relationTags` element into `state.observations` as a tagged
   secondary observation.
3. Emits the `ecology.observation` event with the full payload (see §5).

`source` is one of `'proximity'`, `'interact'`, `'inspect'`,
`'programmatic'`. Used by quest hint UIs and by analytics; does not
affect quest advancement.

### `emitForage(entity, source)`

Called by the private interaction zone when the player executes a
foraging action on a `forageable` entity. Effects:

1. Calls `foragingSystem.grantItem(entity.grantsItemId, source)`.
2. Emits `ecology.forage` event (see §5).
3. If the open-question §13.2 resolves to "deplete", marks the entity
   `forageable: false` until refresh; otherwise leaves it forageable.

Does **not** emit an observation by default. (A separate observation,
if desired, is wired by quest-aware code calling `emitObservation`.)

### `attachInteractionZone(scene, entity)` — PRIVATE

Installs the Phaser zone, hover/inspect, click→forage, proximity→
observation. Clean up via `scene.events.once('shutdown', ...)`. Not part
of the public API; documented here so the implementation in Phase 3 has
a clear contract.

### `debugDrawEcologyEntities(scene)` — PRIVATE / DEV-ONLY

Overlay for `?debug=ecology` URL flag. Renders entity bounds, speciesId
labels, relationTag swatches. Phase 3 implementation.

---

## 5. Event model

The substrate emits and listens for events through Phaser's global
event bus (`scene.game.events`) so events cross scene boundaries (a
biology workbench in one scene listens to ecology events fired in
another).

### Events emitted

#### `ecology.observation`

Fired by `emitObservation()` and by automatic proximity detection.

```
{
  type: 'ecology.observation',
  speciesId: 'mesquite',
  questObservationId: 'mesquite',
  relationTags: ['supports:javelina', 'supports:rabbit', 'supports:quail',
                 'predatorsNearby:coyote', 'feature:producesFood',
                 'biome:desert_scrub'],
  source: 'proximity' | 'interact' | 'inspect' | 'programmatic',
  sceneKey: 'StreetBlockScene',
  entityId: 'StreetBlockScene:mesquite:0',
  timestamp: <ms>,
}
```

**relationTags-in-payload pattern.** Quest steps may name not only a
species observation but a relational *category* — e.g., a future quest
step requiring "observe any predator near a mesquite". The quest engine
matches `requiredObservation` against either `speciesId`,
`questObservationId`, OR (for tag-prefixed strings) any element of
`relationTags`. This is the documented contract: tag-prefixed
observations begin with one of the canonical prefixes
(`supports:`, `predatorsNearby:`, `pollinators:`, `feature:`, `biome:`).
Quests not using tag prefixes are unaffected.

#### `ecology.forage`

Fired by `emitForage()`.

```
{
  type: 'ecology.forage',
  speciesId,
  grantsItemId,
  source: 'interact' | 'programmatic',
  sceneKey,
  entityId,
  remaining: <int>  // post-grant forageable count for this entity (0 or 1 today)
  timestamp,
}
```

#### `ecology.proximity` — DEFERRED

A throttled event for fauna AI / Stage-3 simulator use cases that need
"the player is near species X." Phase 6+. Specified here so the schema
does not drift later.

```
{
  type: 'ecology.proximity',
  speciesId,
  entityId,
  distance,
  sceneKey,
  timestamp,
}
```

### Events listened for

#### `scene.shutdown`

Substrate listens via `scene.events.once('shutdown', ...)` per scene
registration. Cleans up that scene's interaction zones, removes
entities from the registry, releases timers. Procedural populations
(when Phase 6 lands) serialize per-region state to
`state.ecology[regionId]` before shutdown so re-mount restores
identical placement.

#### `game.timeOfDay`

When the world model emits a time-of-day change, the substrate
re-evaluates `timeOfDayRule` on every fauna entity. Behavior depends on
open question §13.4 (disappear / fade / non-interactive). Default
proposed: `'fauna-default'` rule = entity becomes
`observable: false, forageable: false` while inactive; visual handling
is the renderer's responsibility (the substrate does not hide sprites).

---

## 6. World-model primitive integration

Per arc.md §8.1, every carry-forward system must declare the primitives
it consults and updates.

### Environmental primitives consulted

- **Biome** — read via `getBiomeAt(elevation, moisture)` from
  `data/ecology.js`. The substrate enforces (per `biomeRule`) that
  registered entities belong to a biome consistent with the species's
  `PLANT_ECOLOGY.biome` (where defined).
- **Terrain** — per arc.md §8.4, terrain is a constraint engine, not
  decoration. Procedural population (Phase 6) honors terrain when
  selecting spawn cells (sand → unstable foundations is the
  construction analog; ecology analog: `barrel_cactus` does not spawn
  on `rock` terrain). Static (layout-driven) registrations trust the
  layout author.
- **Time of day** — read via `TIME_BEHAVIOR`. See `timeOfDayRule` field.
- **Elevation / moisture** — only via `getBiomeAt()`; not consulted
  directly. Per arc.md §8.6, fragmenting biome lookup by hardcoding
  elevation thresholds is a CRITICAL violation.

### Progression primitives updated

- **Discovery state** — NOT updated by the substrate. Discovery state
  is geographic (per arc.md §8.5); ecology entities are not landmarks.
  Adding a landmark category for "first sighting of a species" is
  out-of-scope here — if needed, propose via `discovery-substrate.md`
  (does not exist; flagged in §13.7).
- **Knowledge state** — NOT consumed and NOT updated. Per arc.md §8.5,
  no system may consume knowledge-state queries before
  `knowledge-state-substrate.md` lands. Reserved API surface: when
  that doc lands, `emitObservation()` may, in addition, push a
  `Seen`-state entry for the species. **Today, the substrate writes
  only to `state.observations`.**
- **Observations** — primary update target.
  `state.observations.push(speciesId)` (deduplicated per open question
  §13.3). The relationTags-in-payload pattern (§5) lets quests gate on
  category strings without polluting `state.observations` with derived
  entries — that decision is open per §13.1.
- **Landmarks** — NOT updated. (Same reasoning as discovery state.)

### Act 1 → Act 3 scaling (per arc.md §8.1)

- **Act 1.** Single region (Sonoran). Static entities registered from
  scene layouts; procedural population is the Phase-6 layer that
  augments without replacing. Quest gating on
  `food_chain_tracker.observe_mesquite` and `.observe_javelina` is the
  primary use case.
- **Act 2.** Multi-region. Per playbook §A.9.6 / Phase 7, the substrate
  accepts a `regionId` parameter on procedural population; species
  tables for each region (Mexico/Andes, Arabian, Anatolian, Zagros,
  Swahili, Yunnan) extend `data/flora.js` / `data/fauna.js` /
  `data/ecology.js` per the cultural-representation rule of arc.md §2.
  Depletion semantics (per open question §13.2) become load-bearing
  here for the curriculum bullet "extraction has consequences."
- **Act 3.** Same schema. Alien species register through the same
  FLORA/FAUNA/PLANT_ECOLOGY pattern (with new biome ids in
  `BIOMES`). The Stage-3 Simulation Biology workbench (per
  `biology-substrate.md` §3 Stage 3) reads ecology entities directly via
  `queryEntities()` to populate its in-silico ecosystem; **no
  act-specific carve-outs** per arc.md §8.2.

---

## 7. Stage progression and the Biology bridge

The biology substrate progresses through three stages per arc.md §4.
Each stage asks something different of ecology. **This section is paired
with `biology-substrate.md` §8 "Ecology bridge contract" and must
agree.** Drift between the two is non-shippable per the dispatch's
cross-consistency requirement.

### Stage 1 — Recipe Biology

**What biology asks of ecology.** Read-only species lookup. Recipes
take a `bio_sample_<species>` as input. The biology workbench validates
that the input item exists in inventory and (if it carries a species
id) that the species id resolves through `getFloraSpecies()` /
`getFaunaSpecies()`. No relational data is consumed. No procedural
population is consumed.

**What ecology guarantees.** Stable speciesIds, stable
`grantsItemId → speciesId` mapping (so a `mesquite_pods` item in
inventory traces back to the `mesquite` species).

**Exchange format.** None — biology reads inventory and species data
directly. No event traffic between systems.

### Stage 2 — Parametric Biology

**What biology asks of ecology.** Same as Stage 1, plus access to
`PLANT_ECOLOGY.biome` and `BIOMES.<biomeId>` so the parametric
workbench can offer "growth rate vs biome temperature" parameter
sweeps. Read-only.

**What ecology guarantees.** Per arc.md §4 Stage-2 unlock open question,
the biology substrate may not exist when ecology Phase 3 ships. The
ecology substrate's API does not change to accommodate Stage 2; biology
adapts.

**Exchange format.** Read-only data queries. Possibly a one-way
`biology.organism.designed` event consumed by ecology if the design
includes an in-world planting plan (open question — see §13.5).

### Stage 3 — Simulation Biology

**Most demanding consumer.** Stage 3 simulates ecosystems in silico.
Per arc.md §4 Stage 3, the simulator drops candidate organisms into a
sketched ecosystem (soil chemistry, atmosphere, temperature, water,
native organisms) and observes outcomes. The simulator MUST consume
the same relational schema as the live world (per arc.md §8.2 — no
act-specific carve-outs).

**Exact data shape Stage 3 needs from ecology:**

```
{
  species: {
    [speciesId]: {
      type,                 // 'flora' | 'fauna' | 'microbe'
      biome,                // from PLANT_ECOLOGY or FAUNA.biome
      eats: speciesId[],
      eatenBy: speciesId[],
      relationTags: string[],
      requirements: {       // FAUNA.requiresPlants for fauna; FLORA.biome for flora
        plants: speciesId[],
        biomes: biomeId[],
        timeActive: ('day'|'night'|'dawn'|'dusk')[],
      },
      visualToken: { color, emoji?, size },
    },
  },
  chains: PREDATOR_CHAINS,   // pass-through
  biomes: BIOMES,            // pass-through
  timeBehavior: TIME_BEHAVIOR,
}
```

This shape is produced by the substrate's `exportSimulationSnapshot()`
function — specified now, implemented in Phase 7. The simulator does
**not** invent its own predator–prey model; it consumes
`PREDATOR_CHAINS` directly and treats `probability` as a
per-tick edge-firing chance modulated by population density.

**Microbes** (for engineered bacteria per `engineer_bacteria` quest)
register through the same schema with `type: 'microbe'`. Adding a new
microbe is a `data/fauna.js`-shape addition (or a separate
`data/microbes.js` table — open question, deferred to Phase 7 design).

**What ecology guarantees Stage 3.** Schema stability. If the substrate
adds new relationship fields, they are additive and tagged with a
schema version on `exportSimulationSnapshot()`.

**What ecology does NOT guarantee Stage 3.** Live tick rate, real-time
performance, or in-world consequence propagation. Whether engineered
organisms escape simulation and affect the live world is the
**engineered-organism consequence model** open question per arc.md §6
and `biology-substrate.md` §9 — that is biology's design call, not
ecology's.

---

## 8. Procedural population layer (deferred to Phase 6)

**What `populateWorld` currently does** (per
`.claude/bugs/2026-04-27-neighborhood-orphan-inventory.md` §1):

- Walks a `WORLD.width × WORLD.height` (1536×1024) grid at a configurable
  sampling cell size (default 60 px).
- Calls `spawnFlora()` per cell — rolls per-species density rolls
  against `FLORA`, applies biome filtering via `getBiomeAt()`, applies
  `isExcludedZone()` (roads, garage area, NPC zones, world boundary).
- Calls `spawnFauna()` on a 3×-coarser grid — applies
  `requiresPlants` filter against nearby flora, applies time-of-day
  filtering via `TIME_BEHAVIOR.activeAnimals`.
- Calls `applyFoodChain()` — appends predators near matching prey using
  probabilities from `PREDATOR_CHAINS`.
- Returns `{ plants: [], animals: [] }` plain objects with `{ type,
  species, x, y, size, color, heightOffset }` for plants and `{ type,
  species, x, y, color, emoji, speed, aerial }` for animals.
- **Single caller**: `NeighborhoodScene.js:196`. Renders as plain
  `Phaser.GameObjects.Graphics` (plants) and emoji `Text` (animals)
  with **no interaction zones, no observation emitters, no quest
  bridge** — this is the orphan the audit identified.

**How Phase 6 will port it.**

1. Move the `populateWorld` body into
   `src/renderer/game/systems/ecology/ecologyTicker.js`. Preserve
   `data/ecology.js` unchanged.
2. Wrap the result in `EcologyEntity` records (with `spawnedBy:
   'procedural'`, `observable: true`, `forageable` derived from
   species). Each entity goes through the same
   `attachInteractionZone()` path as static entities — meaning a
   procedurally-spawned mesquite IS observable and IS forageable, fixing
   the orphan.
3. Serialize per-region populations to `state.ecology[regionId]` so
   re-mount of the scene restores identical placement (per audit §3 R2
   risk).
4. `ecologyEngine.js` becomes a thin compat shim re-exporting the new
   ticker for any pre-existing imports; eventually deleted in playbook
   §A.9.7 / Phase 8.

**Dependency on the navigation-substrate decision** (playbook §A.7
reframe). The procedural layer is only useful in scenes where the
player can walk into a procedurally-spawned cluster. If
`navigation-substrate.md` selects marker-based navigation (no
edge-walking, no large-canvas exploration), Phase 6 is deferred until a
new edge-walkable scene exists OR is dropped entirely — Phases 3–5
(static-entity wiring) remain valuable on their own. The orphan
inventory tally confirms zero current quest is blocked by the absence
of procedural population.

---

## 9. Save state model

### What persists

- **Static entities (`spawnedBy: 'layout'`).** Not persisted by
  the substrate — they are reconstructed from layout JSON every scene
  mount. Their **runtime state** (forage depletion, observation history)
  IS persisted, indirectly: observation history lives in
  `state.observations` (the existing save shape), and forage depletion
  (if the open question §13.2 resolves to "deplete") lives in
  `state.ecology.foraged[entityId]` keyed by stable id.
- **Procedural entities (`spawnedBy: 'procedural'`, Phase 6).** The
  full population is persisted to `state.ecology[regionId]` as a list
  of `{ speciesId, x, y, seedTag }` records. Re-mount reconstructs
  entities deterministically.
- **Biology-spawned entities (`spawnedBy: 'biology'`).** Persisted with
  full state. The biology substrate owns the lifecycle (e.g., an
  engineered organism the player released into the world); ecology
  hosts it.

### What does not persist

- Visual tokens (color, emoji) — re-derived from data on load.
- Relationship fields (`eats`, `eatenBy`, `relationTags`) — re-derived
  on load.
- Interaction zones — re-attached on scene mount.

### Authority separation (per cross-consistency rule §5)

- Per-species runtime state (observations, forage depletion, procedural
  population per region) → ecology owns.
- Per-recipe and per-organism runtime state (Stage 1/2/3 outputs,
  parametric trial results) → biology owns.
- No overlap. If a future feature needs cross-cutting state (e.g.,
  "this engineered organism, currently planted in the world, has its
  population evolving"), the data shape is co-designed and one system
  owns it explicitly.

---

## 10. Performance and lifecycle

### Registration cost

`registerEntity` is O(1) per call: data lookups are object accesses,
relationship-field derivation is two array iterations. Static-entity
registration on scene mount is bounded by the layout's plant count
(~10–30 per scene today). Procedural population (Phase 6) is bounded
by `WORLD.width × WORLD.height / gridSize²` = ~432 cells × per-species
rolls (per audit §R7); legacy `populateWorld` already runs in this
budget without observable lag.

### Per-frame cost

Zero. The substrate has no `update()` hook. Interaction zones are
event-driven (proximity is computed via Phaser's existing input
manager, not by per-frame iteration over the registry).

The `ecology.proximity` event (Phase 6+) requires a throttled
per-frame check; budget specified at the time of implementation, not
here. Default: at most one proximity scan per 250 ms with an early-out
when the player has not moved.

### Scene shutdown

`scene.events.once('shutdown', () => substrate.releaseScene(sceneKey))`.
Releases interaction zones, removes registry entries, does NOT clear
`state.observations` or `state.ecology[regionId]` (those are save
state).

### HMR

Per-scene registry survives HMR. On a hot reload, scenes re-register
their entities; the substrate detects duplicate ids and replaces (same
behavior as the existing scene-reload pattern).

### Per-scene entity caps

Open question §13.5 — proposing default cap of 200 entities/scene to
guard against runaway procedural spawns. Static entities are
unconstrained (their cap is the layout author's discipline).

---

## 11. Discipline rules

These are non-negotiable per arc.md §4:

1. **No scene imports inside `systems/ecology/`.** Verified in code
   review and by `data-schema-keeper`-style audit.
2. **No direct quest mutation.** The substrate writes to
   `state.observations` only. It does not call `questSystem.advance()`.
3. **Data-only authoring for new species.** Adding a species is
   `data/flora.js` or `data/fauna.js` + (optionally) a `PLANT_ECOLOGY`
   row + (optionally) a `PREDATOR_CHAINS` edge. **Never** a code
   change in the substrate.
4. **No hardcoded biome strings.** Use `getBiomeAt()` per arc.md §8.6.
5. **No hardcoded elevation/moisture thresholds.** Compose through
   `BIOMES`. Per arc.md §8.6, fragmentation is a CRITICAL violation.
6. **Layout positions in JSON.** Per CLAUDE.md, static entities place
   from `public/layouts/<scene>.layout.json`, never from literal
   coordinates in scene code or substrate code.
7. **Procedural seed determinism.** Phase 6's `registerProcedural`
   takes an explicit seed. Reseeding produces identical output for the
   same input. Open question §13.6 governs the seed-source choice.
8. **No knowledge-state coupling** until `knowledge-state-substrate.md`
   lands per arc.md §8.5.
9. **Cultural-representation rule.** Per arc.md §2, naming any
   non-Sonoran species in Phase 7 requires a human-authored design
   brief. Phase-7 dispatch halts-and-surfaces when absent.
10. **Asset-token boundary.** Visual tokens (emoji strings, colors) come
    from `data/flora.js` / `data/fauna.js`. The asset-import dispatch
    (separate, later) may swap tokens for licensed sprites without
    code changes inside the substrate.

---

## 12. Out of scope

- **Asset import.** Licensed sprites for flora and fauna are a
  separate dispatch. The substrate exposes a visual-token field; the
  asset layer owns the token-to-sprite mapping.
- **Field guide UI.** A "compendium" or "encyclopedia" UI surface for
  observed species is a renderer / UX concern, not a substrate concern.
  The substrate exposes `queryEntities()` and `state.observations`;
  the UI builds on top.
- **Procedural implementation details.** Phase 6 is gated on
  navigation-substrate decision; specification only.
- **Knowledge state internals.** Per arc.md §8.5.
- **Combat.** No combat system exists (per arc.md §7 out-of-scope).
- **Photorealism.** Visual token system is intentionally minimal
  (color + emoji). Realism is an asset concern, not a substrate
  concern.
- **Multiplayer.** Per arc.md §7.
- **Cross-scene movement of entities.** An entity's `sceneKey` is
  fixed at registration. Migrating an entity (e.g., "the deer walked
  to the next scene") is out-of-scope; it would re-register at the new
  scene.

---

## 13. Open questions for resolution before Phase 3

These do not block this design document. They DO need resolution before
Phase 3 (skeleton stand-up) ships. Each question lists the options and a
proposed default; the user decides.

### 13.1 Atomic vs separate secondary relationTag observation events

When the player observes `mesquite`, should the substrate also push the
relation tags into `state.observations` (so a quest can gate on
`'supports:javelina'`), or does it ONLY push `mesquite` and the quest
engine reads the tags from the event payload?

- **Option A (atomic).** Push `mesquite` + each relation tag.
  Pro: simple quest authoring (`requiredObservation: 'supports:javelina'`
  works directly). Con: pollutes `state.observations` with derived
  entries.
- **Option B (event-payload only).** Push `mesquite` only; relation
  tags ride in the event payload. Quest engine extends to match against
  payload tags. Pro: clean state. Con: quest engine change required.
- **Proposed default:** **B.** State stays clean; the quest engine is
  already due for an extension to support tag-matching per the event-
  payload pattern. **Decision blocks Phase 3.**

### 13.2 Foraging depletion or always-succeed

Today, `_handlePlantInteract` (per `StreetBlockScene`) always succeeds
on forage. Should the substrate enforce per-entity depletion?

- **Option A (deplete).** First forage succeeds, subsequent forages on
  the same entity fail with a "no more here" message; entity refreshes
  on time-of-day change or scene refresh.
- **Option B (always succeed).** Status quo.
- **Proposed default:** **A**, because arc.md §3 Act 2 names "extraction
  has consequences" and arc.md §3 Act 1 names "ecological limits, harvest
  ethics" — depletion is the curriculum mechanic. Implementation in
  Phase 4 (scene wiring), not Phase 3.

### 13.3 First-time vs repeated observations

Does `emitObservation` deduplicate (push only the first time per
species per save) or emit every time?

- **Option A (dedupe).** State stays small. Quest gating uses
  `Array.includes()` semantics already.
- **Option B (every time).** Future analytics use case.
- **Proposed default:** **A** for state, **B** for events. Push to
  state only on first observation; emit `ecology.observation` on every
  observation. Best of both. **Decision is non-blocking** — both can
  ship Phase 3 with this hybrid.

### 13.4 Time-of-day rule enforcement

When a fauna entity's `activeTimes` does not include the current time,
should it disappear, fade, or become non-interactive?

- **Option A (disappear).** Entity hidden by renderer; no events fire.
  Strongest curriculum signal.
- **Option B (fade).** Entity visible at low opacity; events fire but
  tagged "inactive" — quest decisions may discount.
- **Option C (non-interactive).** Entity visible at full opacity but
  observation/forage events do not fire.
- **Proposed default:** **C** for static-entity wiring (Phase 4) so a
  "decoration" hawk remains visible day or night without confusing
  the player; **A** for procedural fauna (Phase 6) so the food-chain
  quest naturally surfaces day-vs-night animal sets. **Decision blocks
  Phase 4.**

### 13.5 Per-scene entity caps

Default proposed: 200 entities per scene. Higher caps require explicit
opt-in. Procedural population auto-throttles to fit the cap. Open for
playtest tuning.

### 13.6 Procedural seed determinism

What seeds the procedural population? Options: save-game UUID; region
id alone; per-scene-mount fresh roll. Proposed default: save-game UUID
+ region id (so the same player gets the same desert layout, but two
players see different deserts). Affects whether `state.ecology[regionId]`
serialization is even necessary or whether re-derivation from the seed
suffices.

### 13.7 Discovery-substrate dependency

If a future quest wants "discover N species" gating, does that go
through ecology (count of unique entries in `state.observations`
intersected with species ids) or through a hypothetical
`discovery-substrate.md` (geographic discovery state)? Proposed
default: ecology, until `discovery-substrate.md` is authored. Aligns
with arc.md §8.5 — discovery state and conceptual progression are
distinct.

### 13.8 Microbe table separation

Should microbes (engineered bacteria, soil microbes, alien microbes)
live in `data/fauna.js` or in a new `data/microbes.js`? Proposed
default: defer to Phase 7. Until then, microbes register as
`type: 'microbe'` ad-hoc through the biology substrate's
`registerOrganism()` API (per `biology-substrate.md` §3).

### 13.9 Cross-cutting open questions (ecology × biology × world model)

- **Knowledge state integration.** Both substrates flag this — neither
  consumes knowledge state until `knowledge-state-substrate.md` lands
  per arc.md §8.5.
- **Navigation paradigm dependency.** Phase 6 (procedural population) is
  gated on the `navigation-substrate.md` (A.7 reframe) decision;
  marker-based navigation defers Phase 6 indefinitely.
- **Asset pipeline dependency.** Phase 4 wiring uses the existing
  emoji/color visual tokens; the licensed-asset import dispatch (later,
  separate) swaps tokens with no substrate changes.
