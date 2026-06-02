# Food-Web Substrate Design — `EcologicalRelationship` Carry-Forward System

**Status:** Phase-2 design document. No code shipped.
**Verdict tag:** `[design-only]`.

Resolves the structural gap named in the biology architecture audit (§4):
the **ecological relationship layer** that systems biology, biological
engineering, and terraforming all depend on did not exist as a structure.
This substrate owns the **edges** of the Biology Knowledge Graph
(Phase 2) — the relationships between organisms and their resources.

**Companion:** `ecology-substrate.md` (owns the organism node;
food-web owns the edges between nodes), `biology-substrate.md` §13.4
(Systems Mode / Ecosystem Simulator consumes this), `biology_knowledge_graph.md`.

## 1. Purpose

**Role.** `EcologicalRelationship` owns the typed, directional
**relationships** among living things and their abiotic resources:

```
Plant ↔ Pollinator ↔ Predator ↔ Decomposer ↔ Soil ↔ Water
```

It is the foundation the Ecosystem Simulator runs on. Per arc.md it
expresses "Desert ecology … food-chain discovery, predator/prey
observation" (§3 Act 1) and scales to depletion dynamics (Act 2) and
closed-loop simulation (Act 3). It follows the biology loop **Observe →
Test → Model → Predict → Engineer** at the *network* level.

**Not.** It does not own organisms (ecology / dataset), uses
(ethnobotany), compounds (phytochemistry), or scene layout. It does not
*simulate* by itself — it provides the typed graph the Systems Mode
simulator and the terraforming engine read. It writes observations and
(reserved) knowledge-state; it never forks the species store.

## 2. Edge types (the relationship taxonomy)

```
POLLINATED_BY      plant   → pollinator      (mutualism; may be obligate)
MUTUALIST_OF       org     ↔ org             (yucca ↔ yucca moth)
EATS / EATEN_BY    org     → org             (herbivory / predation)
DECOMPOSES         decomposer → substrate    (termite/fungus → wood)
NURSES            org     → org             (palo verde → saguaro seedling)
DISPERSES         animal  → plant           (dove/ant → seeds)
NEST_HOST_FOR      plant   → animal          (saguaro → woodpecker)
REQUIRES_SOIL      org     → SoilType        (biocrust, mycorrhiza)
REQUIRES_WATER     org     → WaterRegime     (riparian vs xeric)
FIXES_NITROGEN     org     → Soil            (legume/rhizobia, biocrust)
COMPETES_WITH      org     ↔ org             (allelopathy: creosote)
```

Each edge carries: `strength` (keystone | strong | occasional),
`obligacy` (obligate | facultative), `seasonality`, `evidence`
(observation hooks that reveal it), `provenance`.

## 3. Abiotic nodes (resources)
- **SoilType** — sand / rock / alluvial / biocrust; ties to terrain
  (arc.md §8.4) and to mycorrhiza/N-fixers.
- **WaterRegime** — xeric / wash / riparian / ephemeral; ties to the
  hydrology the player learns to read (wash-finding quests).
- **NutrientPool** — N / organic matter; the currency of decomposition →
  the bridge to life-support nutrient loops (Act 3).

## 4. Data model

```
relationship:
  id:           "saguaro__pollinated_by__white_winged_dove"
  from:         speciesId | resourceId
  to:           speciesId | resourceId
  edgeType:     POLLINATED_BY | EATS | DECOMPOSES | NURSES | ...
  strength:     keystone | strong | occasional
  obligacy:     obligate | facultative
  seasonality:  string|null
  evidence:     { observeHooks: string[] }    // how the player discovers it
  drives:       { quests: questId[], simulation: bool, engineering: bool }
  provenance:   { status: "draft_unverified", sources[], license }
```

## 5. What relationships drive (the point of the layer)

- **Quests.** Edges generate in-world problems: "find the saguaro's
  pollinators," "what eats the kangaroo rat?", "trace where the nutrients
  go." (Observe → Predict.)
- **Ecosystem simulations.** The Systems Mode simulator (biology §13.4)
  loads the edge set as its model: remove a node/edge → predict
  cascading effects (keystone removal, pollinator loss, decomposer loss).
- **Biological engineering.** Selective breeding / microbial engineering
  / synthetic biology all operate **on** relationships (a nitrogen-fixer
  changes the Soil node; a new pollinator changes recruitment). The
  prediction-precedes-intervention rule is enforced *here*: you must
  predict the edge effects before you may modify them.
- **Terraforming.** Act 3 = assembling a *stable* set of edges (producers,
  N-fixers, decomposers, pollinators, water loop) — the food-web graph
  is literally the terraforming design surface.

## 6. Public API
- `addRelationship(rel)` — validate both endpoints resolve (organism in
  dataset or a resource node); freeze provenance.
- `edges(node, edgeType?)` / `neighbors(node)` — graph traversal.
- `removeAndPredict(node|edge)` — returns the predicted cascade (pure,
  for the simulator and for "predict before you act" quests). Does **not**
  mutate the live world — that is the simulator's gated job.
- `stability(edgeSet)` — biodiversity / redundancy / resilience metrics
  for terraforming review (Act 3 success criteria: biodiversity,
  resilience, reversibility, containment).

## 7. World-model integration (arc.md §8.1)
- **Consults:** biome, terrain, time-of-day, water regime (all via
  ecology/world-model primitives — never hardcoded).
- **Updates:** observations (`state.observations` for newly discovered
  edges); reserved knowledge-state (an edge `understood` when the player
  can predict its removal effect). Never writes the species store.
- **Act 1→3:** Act 1 single-region food web (discover edges); Act 2
  per-region webs + depletion (removing a producer has consequences);
  Act 3 the simulator + terraforming assemble/repair webs. No
  act-specific carve-outs (arc.md §8.2).

## 8. Discipline
1. **Edges are data, single-authority.** No parallel relationship store;
   the graph is an index over these declarations (arc.md §8.6).
2. **Endpoints must resolve** to a dataset organism or a declared
   resource node (halt-and-surface otherwise).
3. **Prediction gate.** `removeAndPredict` is read-only; live ecosystem
   change happens only through the gated simulator/engineering pipeline
   (prediction precedes intervention, arc.md §2).
4. **No "kill the ecosystem" power fantasy** — destabilization is a
   *lesson with consequences*, rewarded toward stewardship (arc.md §3).
5. Provenance per edge; cultural edges (use-attribution) stay GATED.

## 9. Open questions
- Edge `strength` weighting model for the simulator (realism vs
  child-legibility).
- How many edges a Chapter-1 web should expose before it overwhelms
  (start with ~1–2 per organism, grow with chapter).
- Whether abiotic nodes (Soil/Water/Nutrient) are full graph nodes or a
  lighter "resource" type (recommend lighter type to start).
- Reversibility tooling shared with biology §14.3 (containment/rollback).
