# Ethnobotany Substrate Design — `PlantUseEntity` Carry-Forward System

**Status:** Phase-2 design document. No code is shipped by this document.
Implementation is gated on this design landing and on the companion
`ecology-substrate.md` (shared Species concept) and
`knowledge-state-substrate.md` (Seen/Interacted/Understood model).
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when implementation ships.

**Companion documents (read alongside):**
- `src/renderer/game/systems/ecology/ecology-substrate.md` — shares the
  Species concept; ecology owns the *living organism in the world*,
  ethnobotany owns *what a culture does with that organism*.
- `src/renderer/game/systems/biology/biology-substrate.md` — the
  Recipe → Parametric → Simulation workbench that ethnobotany feeds
  (a plant use is a recipe input; a terraforming candidate is a Stage-3
  organism).
- `src/renderer/game/systems/knowledgeState/knowledgeState-substrate.md`
  (a.k.a. `knowledge-state-substrate.md`) — the conceptual progression
  layer; ethnobotany is one of its richest domains.
- `arc.md` — strategic vision. Especially §2 (UTM pattern + the
  **cultural representation rule**, which is load-bearing here), §3
  (the seven-chapter vehicle spine this substrate mirrors), §4
  (Carry-Forward Systems), §5 (Language & Geography — the seven
  committed regions), and §8 (World Model Alignment Layer).

---

## 1. Purpose

**Role.** `PlantUseEntity` is the carry-forward system that owns
**ethnobotanical knowledge** — the relationship between a plant, a
culture, and a use — as **scene-independent typed instances** sourced
from `data/ethnobotany.js`. It is the bridge layer that turns the
ecology substrate's *living things* into the chemistry lab's *inputs*,
the materials lab's *samples*, the construction system's *parts*, and
the biology workbench's *recipes*. Per arc.md §2 it is the canonical
expression of the UTM pattern for plants: **Observe → Harvest → Test →
Process → Build something useful** — never "identify this plant" trivia.

It mirrors the seven-chapter vehicle spine of arc.md §3 (see §7 below):
the same plant deepens in meaning as the player's engineering rises —
yucca is *fiber for a bike bag* in Chapter 1 and *strength-to-weight
cordage* by Chapter 6; mesquite is *trail bread* in Chapter 1 and
*charcoal/feedstock chemistry* by Chapter 3.

The substrate lives in `src/renderer/game/systems/ethnobotany/` per the
arc.md §4 architectural discipline — carry-forward systems live there
with **no scene imports**.

**Not.** `PlantUseEntity` is **not** the ecology substrate: it does not
own the organism's existence, population, or food-web relations — those
are `EcologyEntity` (`data/ecology.js`, `data/flora.js`). It does not
own sprites, layout, or quest state. It does not own molecule data —
that is canonical in chemistry data (PubChem/ChEBI-sourced, see §2). It
is **not** the Knowledge State System — it writes observations and
(when that system ships) emits knowledge-state transitions, but
discovery state (geographic) and knowledge state (conceptual) remain
distinct per arc.md §8.5. **It does not author cultural content.** Per
arc.md §2, every culturally-attributed use entry (the `cultures.*` and
`uses.ceremonial` fields especially) requires a human-authored design
brief and sourced provenance — the substrate is the *schema and engine*,
not the *content* (see §11.3, the load-bearing discipline of this doc).

**Curriculum served.** Act 1 Sonoran ethnobotany (desert plant use:
fiber, food, soap, charcoal, cordage). Acts 1→3 the seven-chapter
deepening of §7: plant → chemistry → fuel/resin → industrial material →
marine material → strength-to-weight → closed-loop life support. The
educational thesis (arc.md §2): a child should not memorize plants; they
should *need* yucca fiber to fix a bag, *test* it, and discover why it
works.

---

## 2. Data substrate consumption

### 2.1 The master plant table (`data/ethnobotany.js`)

Canonical, read-only from the substrate's perspective. One record per
**plant** (keyed by `id`), carrying the schema in §3. Built and curated
from open data sources organized in three tiers (provenance + license
discipline in §11.4).

**Tier 1 — Act 1 backbone (Sonoran + USDA baseline):**
- **Native American Ethnobotany Database** (Univ. of Michigan, Moerman)
  — uses-by-culture for North American species. *Traditional-knowledge
  sourcing rules apply (§11.3).*
- **USDA PLANTS Database** — taxonomy, distribution, growth habit,
  USDA-native baseline. Public domain.
- **Native Seeds/SEARCH** — Sonoran/Southwest crop and wild-harvest
  varieties, regional agricultural grounding.

These three alone support most of Act 1 (Chapter 1).

**Tier 2 — historical + agricultural depth (Acts 1–2):**
- **Biodiversity Heritage Library (BHL)** — historical botanical
  literature, illustrations (license varies per item).
- **FAO** — agricultural use, crop ecology, food-system data.
- **Open Context** — archaeological/material-culture context (e.g.
  fiber and resin use in the historical record).

**Tier 3 — plant → molecule (Acts 2–3, chemistry bridge):**
- **PubChem** — compounds, properties (public domain).
- **ChEBI** — chemical ontology, biologically-relevant molecules.
- **NIH / NCCIH herb databases** — medicinal-use evidence and safety
  (dose-response framing per arc.md §2; safety annotations are
  *required*, see §11.5).

### 2.2 Region → primary source mapping

Per arc.md §5's seven committed regions. Each region's content is gated
by a human-authored design brief (§11.3); the table records *where to
source it*, not generated content.

| Region (arc.md §5) | Primary ethnobotanical sources |
|---|---|
| Sonoran Desert / Arizona | Native American Ethnobotany DB, Native Seeds/SEARCH, USDA PLANTS |
| Mexico & Andes | Quechua agricultural literature, CIP (potato/tuber) collections, FAO |
| Arabian Region | Frankincense/date-palm/desert-medicinal literature, BHL |
| Anatolian Plateau | Ottoman agricultural texts, Turkish ethnobotany surveys |
| Zagros / Iranian Plateau | Kurdish medicinal-plant studies |
| East African Savanna / Swahili Coast | Swahili ethnobotany + agroforestry literature, Open Context |
| Yunnan / Xishuangbanna | Chinese Materia Medica, Yunnan biodiversity datasets |

### 2.3 Shared data with adjacent substrates

- **Species id** is shared with `EcologyEntity` (`data/flora.js`). A
  `PlantUseEntity.speciesId` MUST resolve to a flora record; the
  ethnobotany layer never invents a species the ecology layer doesn't
  know (halt-and-surface, §11.1).
- **Compounds** reference chemistry-data ids (PubChem/ChEBI). The
  ethnobotany layer stores the *link*, not the molecule definition.
- **Biome / elevation / climate** are read via `getBiomeAt()` from
  `data/ecology.js` — never re-derived from hardcoded thresholds
  (arc.md §8.6 CRITICAL).

---

## 3. Entity model

The schema generalizes the structure proposed for this system. Required
fields exist on every record; optional/relationship fields default safely.

### Required fields (every record)

```
id:               stable kebab-case key, e.g. "yucca_baccata"
speciesId:        FK into data/flora.js (must resolve; §11.1)
scientificName:   binomial, e.g. "Yucca baccata"
commonNames:      string[]  (UI primary first; localized names allowed)
biome:            biome id (resolved via getBiomeAt; not free string)
regions:          region id[] from arc.md §5 (subset of the seven)
provenance:       { sources: SourceRef[], reviewedBy: string|null }
```

### Optional fields (with defaults)

```
elevation:        { minM, maxM } | null
climate:          tags[]  (arid, monsoon, highland, coastal, …)
uses:             {                      // each value defaults []
  food:           UseRef[]               // pods, flour, fruit, …
  medicine:       MedUseRef[]            // requires safety annotation §11.5
  fiber:          UseRef[]               // cordage, cloth, basketry
  dye:            UseRef[]
  fuel:           UseRef[]               // wood, charcoal, resin, oil
  construction:   UseRef[]               // beams, lashings, waterproofing
  ceremonial:     UseRef[]               // GATED content §11.3 (default [])
}
chemistry:        { compounds: CompoundRef[] }   // PubChem/ChEBI links
harvestEthics:    { sustainable: bool, notes, seasonalWindow } | null
```

### Gameplay fields (the UTM loop)

```
gameplay: {
  observe:   { hook, sceneAgnostic: true }       // emits observation
  harvest:   { yieldItemId, toolRequired, depletes: bool }
  process:   ProcessStep[]                        // dry, ret, extract, ferment
  test:      TestRef[]                            // UTM/thermal/chemistry rig ids
  craft:     CraftRef[]                           // produces a part/material/recipe
}
```

### Knowledge fields (per knowledge-state-substrate.md)

```
knowledge: {
  domain:   "ethnobotany"
  seen:        // set on observe
  interacted:  // set on harvest/process
  understood:  // set when a test or craft demonstrates the principle
}
```

These three states are **written through** the Knowledge State System
when it ships (§6); until then the substrate writes only
`state.observations` (arc.md §8.5 gate).

### Relationship fields (populated at registration)

```
linkedRecipes:    biology-workbench recipe ids that consume this plant
linkedMaterials:  materials-lab sample ids derived from this plant
linkedQuests:     quest ids that gate on this plant (read-only mirror)
chapterScope:     min vehicle chapter at which this use unlocks (1..7)
```

---

## 4. Public API

Mirrors the ecology substrate's shape (register / query / emit). No
scene imports; scene code calls these.

- `registerPlantUse(partial) -> PlantUseEntity` — validate FK to
  `data/flora.js`, resolve biome via `getBiomeAt`, freeze provenance.
  Throws (halt-and-surface) on unresolved `speciesId` or on a
  `ceremonial`/cultural use lacking `provenance.reviewedBy` (§11.3).
- `registerPlantUses(partial[])` — batch.
- `queryPlantUses(predicate)` — e.g. by region, biome, use category,
  `chapterScope <= currentChapter`.
- `emitObservation(entity, source)` — pushes `speciesId` to
  `state.observations`; reserved: emit `Seen` to knowledge state (§6).
- `emitHarvest(entity, source)` — yields the item, applies depletion if
  `harvestEthics.sustainable === false` (the "extraction has
  consequences" curriculum, arc.md §3 Act 2); reserved: emit
  `Interacted`.
- `emitProcessed(entity, step, result)` — records a process step
  outcome; bridges to chemistry/materials (§8).
- `emitUnderstood(entity, viaTestOrCraftId)` — reserved knowledge-state
  transition; the only path to `understood` is a demonstrated test/craft
  (no "read a label → understood"), enforcing arc.md §2 learning-by-doing.
- `debugDrawPlantUses(scene)` — PRIVATE / DEV-ONLY.

---

## 5. Event model

### Events emitted
- `ethnobotany:observed` `{ speciesId, source }`
- `ethnobotany:harvested` `{ speciesId, itemId, depleted }`
- `ethnobotany:processed` `{ speciesId, step, resultId }`
- `ethnobotany:crafted` `{ speciesId, craftId, outputId }`
- `ethnobotany:understood` `{ speciesId, viaId }` (reserved; knowledge-state)

### Events listened for
- `ecology:observed` — when the ecology layer reports a first sighting,
  the ethnobotany layer may surface its `Observe` affordance (it does
  not duplicate the observation write; single authority per §11.2).
- `materials:tested` / `chemistry:reacted` — to mark a use `understood`
  when the demonstrating rig fires (the bridge, §8).

---

## 6. World-model primitive integration

Per arc.md §8.1, every carry-forward system declares the primitives it
consults and updates.

### Environmental primitives consulted
- **Biome** — via `getBiomeAt(elevation, moisture)`; the substrate
  enforces that a plant's `biome` is consistent with its `speciesId`'s
  ecology record. Hardcoding biome strings is a CRITICAL violation
  (arc.md §8.6).
- **Terrain** — consulted for harvest viability (a wash-edge plant does
  not harvest from `rock`); terrain is a constraint engine (arc.md §8.4).
- **Climate / season** — consulted via `harvestEthics.seasonalWindow`
  for the harvest-ethics curriculum.

### Progression primitives updated
- **Observations** — primary write target (`state.observations`).
- **Knowledge state** — NOT consumed and NOT updated until
  `knowledge-state-substrate.md` implementation ships (arc.md §8.5).
  Reserved surface declared above; today the substrate writes only
  observations. Discovery state (geographic) is never written here.
- **Discovery state / landmarks** — NOT updated.
- **Inventory** — harvest/craft write to `state.inventory` with typed
  items (raw material vs tested material vs crafted part vs biological
  sample — the distinct types of arc.md §4 Foraging/Inventory).

### Act 1 → Act 3 scaling (per arc.md §8.1, no act-specific carve-outs)
- **Act 1 (Ground, Ch 1–4).** Single→overland regions. Sonoran plant
  table is the backbone; Chapters 2–4 deepen the *same* plants into
  chemistry, fuel/resin, and industrial materials (§7) rather than
  introducing disjoint content.
- **Act 2 (Sea & Air, Ch 5–6).** Per-region tables (marine fibers,
  strength-to-weight species) extend `data/ethnobotany.js` under the
  cultural-representation rule. Depletion semantics become load-bearing.
- **Act 3 (Space, Ch 7).** Same schema. Earth plant-use knowledge feeds
  the Stage-3 Simulation Biology workbench as candidate closed-loop
  organisms (oxygen, nitrogen-fixing, salt-tolerant, soil-repair). No
  alien-only branch — alien flora register through the same schema.

---

## 7. The seven-chapter ethnobotany progression (mirrors arc.md §3 vehicle spine)

The same plant means more as the player's engineering rises. This is the
ethnobotany expression of the §3 mechanical spine — each chapter adds a
new *lens* on plants, layered on all prior lenses.

### Chapter 1 — Bike (Sonoran Desert): plants as direct materials
Backbone species: **mesquite, saguaro, creosote, cholla, agave, yucca,
desert willow.** Loop: Observe → Harvest → Test → Process → Build.
- **Yucca** — learn cordage, sandals, soap (saponins), basketry. *Quest:
  repair the bike bag with yucca fiber* (harvest → ret/process fiber →
  UTM-test the cord → craft the strap).
- **Mesquite** — learn pods, flour, charcoal, wood. *Quest: bake trail
  bread* (harvest pods → grind → process → bake), and charcoal as a fuel
  preview of Chapter 3.

### Chapter 2 — E-bike: plants become chemistry
Lens: extraction and reaction. Natural **dyes, tannins, fermentation,
oils, bio-based adhesives.** Bridges to the Chemistry Lab and the new
Electrical Bench (arc.md §4). *Quest: build an insulated battery pouch*
from plant-derived fibers + a plant adhesive (fiber tested for thermal
tolerance on the thermal rig).

### Chapter 3 — Motorcycle: plants as fuels, lubricants, resins, gums
Examples: **pine resin, frankincense, mastic, acacia gum.** Loop: Plant
→ Extract → Chemical → Engine application (sealants, lubricant bases,
gasket/adhesive resins). Ties the Arabian region (frankincense) into a
ground-vehicle need; dose/ratio framing carries from Chapter 2.

### Chapter 4 — Car: plants as industrial materials
**Rubber, cellulose, paper, wood composites, natural fibers.** The
question shifts from *"what is this plant?"* to *"why are cars made from
these materials?"* — the player now reasons from material properties
back to source. Bridges to Materials Lab (composite testing) and
Construction (load-bearing fiber composites).

### Chapter 5 — Boat: marine ethnobotany
**Canoe woods, rope plants, waterproofing resins, sails, marine fibers.**
The strongest single ethnobotany chapter — culture and material converge.
Cultural anchors (gated, §11.3): **Swahili Coast** boatbuilding,
**Arabian dhow** traditions, **Andean reed (totora) boats.** Bridges to
the Fluid/Buoyancy Rig (hull woods, waterproofing) — corrosion/rot
testing becomes the UTM lens.

### Chapter 6 — Plane: strength-to-weight ethnobotany
Focus: **strength-to-weight.** Examples: **bamboo, balsa, flax, hemp.**
*Quest: design a lightweight aircraft component from biological
materials* (Aero Rig + UTM fatigue/strength-to-weight). The player now
optimizes a ratio, not just "is it strong enough."

### Chapter 7 — Spacecraft & Terraforming: plants as closed-loop ecology
Ethnobotany becomes life-support systems thinking. Questions:
- Which plants make **oxygen**? Which **fix nitrogen**?
- Which **tolerate salt**? Which **repair soil**?
- Which provide **medicine**? Which provide **calories**?
The player uses everything learned on Earth to choose and (via Stage-3
Simulation Biology) test a closed-loop planting before deploying it
(arc.md §3 Act 3 — simulate before deploy, stewardship over growth).

---

## 8. Bridge contracts (why ethnobotany is the connective tissue)

Ethnobotany is uniquely positioned to connect nearly every major system
in arc.md. Each bridge is a typed contract, not an ad-hoc import.

```
Ecology  ↔  Ethnobotany  ↔  Chemistry  ↔  Materials  ↔  Construction
                ↕                ↕             ↕
            Medicine        Agriculture     Biology  →  Terraforming
```

- **Ecology → Ethnobotany.** Shared `speciesId`. Ecology owns the living
  organism + population; ethnobotany owns culture+use. Observation
  authority stays single (ecology writes the sighting; ethnobotany reads
  it) per §11.2.
- **Ethnobotany → Chemistry.** `chemistry.compounds` link plant → molecule
  (PubChem/ChEBI). `emitProcessed` hands an extract to the Chemistry Lab.
- **Ethnobotany → Materials/UTM.** A processed fiber/wood/composite is a
  materials sample; the UTM marks the use `understood` on a passing test.
- **Ethnobotany → Construction.** Tested fibers/woods become construction
  parts (cordage lashings → bridge → boat hull → aircraft member).
- **Ethnobotany → Medicine.** `uses.medicine` carries dose-response +
  safety annotation (§11.5) — never a "cure" claim; the dose-response
  curriculum of arc.md §2.
- **Ethnobotany → Agriculture.** FAO/Native-Seeds data drives growing
  conditions; bridges to the Biology Workbench Stage-1 recipe (seed +
  water + light + soil).
- **Ethnobotany → Biology → Terraforming.** A plant-use record promoted
  to a Stage-3 candidate organism for closed-loop simulation (Ch 7).

When a bridge would require ethnobotany to *write* another system's
authoritative state, that coupling halts-and-surfaces instead of
shipping (arc.md §4 Portability discipline).

---

## 9. Save state model

**Persists:** per-plant `knowledge` transitions (once knowledge-state
ships), harvested/processed/crafted history, depletion counters per
region, and `understood` proofs (which test/craft demonstrated it).

**Does not persist:** the master plant table (canonical in
`data/ethnobotany.js`), compound definitions (canonical in chemistry
data), provenance (canonical in data). The save stores *what the player
did and learned*, never a copy of the content.

**Authority separation:** observations are owned by the observation
write path (single authority with ecology per §11.2); inventory by
`state.inventory`; knowledge by the Knowledge State System (the only
writer of `state.knowledge`). Ethnobotany never forks a parallel store.

---

## 10. Performance and lifecycle

Registration is data-load + FK validation (cheap, startup or
region-enter). No per-frame cost — the substrate is event-driven
(observe/harvest/process/craft), not a ticking system (the only ticking
consumer is Stage-3 Simulation Biology, which reads ethnobotany records,
it does not run them). Region tables load lazily on region-enter and
unload on exit; the player-owned knowledge persists in save. HMR-safe:
data is canonical, entities re-register from data.

---

## 11. Discipline rules

1. **Species authority.** `speciesId` MUST resolve into `data/flora.js`.
   Inventing a plant the ecology layer doesn't know is halt-and-surface.
2. **Single observation authority.** Ecology writes the sighting;
   ethnobotany reads it. No duplicate `state.observations` writes
   (arc.md §8.6 fragmentation = CRITICAL).
3. **Cultural-content gate (LOAD-BEARING — arc.md §2).** Every
   culturally-attributed entry — all `cultures.*`, every `uses.ceremonial`,
   and any region's traditional-use content — **requires a human-authored
   design brief specific to that culture and sourced provenance**. No
   agent generates indigenous, religious, or marginalized cultural
   content. `registerPlantUse` THROWS on a ceremonial/cultural use whose
   `provenance.reviewedBy` is null. Traditional-knowledge sourcing follows
   Indigenous-data-governance norms (attribution, consent, and the CARE
   principles) in addition to the source license — a permissive software
   license does NOT grant the right to decontextualize traditional
   knowledge. When in doubt, halt-and-surface for human design input.
4. **Provenance + license per record.** Every `uses.*` entry carries a
   `SourceRef` (which Tier-1/2/3 source, with citation). License varies
   per source and per BHL item; the build pipeline records it. No
   unsourced use entries ship.
5. **Medicine safety annotation.** Every `uses.medicine` entry carries a
   dose-response + safety annotation (toxic look-alikes, unsafe doses).
   The game teaches *dose-response and respect*, never "forage and eat
   this." No medicinal claim of efficacy beyond the sourced evidence.
6. **Data-driven, portable.** Plants, uses, compounds, and chapter scope
   live in data; the substrate is one portable system the player owns
   across Act 1→3 (arc.md §4 Portability). No per-scene or per-vehicle
   ethnobotany minigame; no act-specific branch (arc.md §8.2).
7. **Understood is earned.** The only path to `understood` is a
   demonstrated test or craft (arc.md §2 learning-by-doing). Reading a
   label never sets `understood`.

## 12. Out of scope

- Generating cultural/traditional-knowledge content without a human brief
  (arc.md §2; the central prohibition of this doc).
- Foraging/eat-this survival mechanics or medical advice.
- A botanical encyclopedia / Pokédex completion meta as the goal
  (trivia is explicitly the anti-pattern, arc.md §2).
- Owning species existence/population (that is `EcologyEntity`).
- Owning molecule definitions (that is chemistry data).
- Real pharmacology simulation (arc.md §7 out-of-scope).
- Scene-coupled or per-vehicle implementations (arc.md §4 / §8.2).

## 13. Open questions for resolution before implementation

- **13.1 Knowledge-state coupling timing.** Ethnobotany is one of the
  richest knowledge-state domains; should its implementation be gated on
  knowledge-state shipping, or ship observation-only first and add the
  Seen/Interacted/Understood writes when that system lands? (Default:
  observation-only first; reserved API as declared in §4/§6.)
- **13.2 Depletion model.** Per-region harvest depletion vs always-succeed
  (mirrors ecology §13.2). Affects the "extraction has consequences"
  curriculum from Chapter 4 onward.
- **13.3 Chapter-scope gating mechanism.** Is `chapterScope` a hard gate
  (uses hidden until the vehicle chapter) or a soft lens (visible but
  shallow until then)? Affects whether Chapter 1 hints at later uses.
- **13.4 Cultural-content pipeline.** What is the concrete review workflow
  and provenance schema for §11.3? Who authors each region's brief, and
  how is consent/attribution recorded? (Blocks any region's cultural
  content; does not block the Sonoran USDA/structural baseline.)
- **13.5 Compound granularity.** How many compounds per plant surface in
  Tier 3, and at what age-appropriate depth (arc.md §2)?
- **13.6 Terraforming promotion.** The exact contract by which a Ch-7
  plant-use record becomes a Stage-3 Simulation Biology candidate
  (cross-refs biology-substrate.md §3 Stage 3).
