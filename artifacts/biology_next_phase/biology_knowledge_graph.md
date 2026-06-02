# Biology Knowledge Graph — formal schema

Formalizes the Unified Biological Knowledge Graph named in arc.md §3.
Biology is a **graph**, not a stack of subjects: one organism is a node
reachable from many directions (ecology, use, compound, gene, quest,
engineering lesson). This doc defines entity types, relationships (edge
types), queries, and gameplay uses. No game code — schema only.

## 0. The substrate-vs-mode rule (resolves audit §2)

> A new biology concept becomes its **own substrate** only if it owns a
> new **edge type between entity types**. If it is only a deeper *view*
> of an entity the workbench already owns, it is a **Biology Workbench
> mode**, not a substrate.

- Substrates (own edges): Ecology (Organism↔Organism), Ethnobotany
  (Organism↔Use↔Culture), Phytochemistry (Organism↔Compound),
  Pharmacology (Compound↔Effect↔Pathway), Food-Web (Phase 4; the
  relationship edges).
- Modes (deeper views, no new entity type): Cellular, Microbiology,
  Molecular, Systems, and the Biological-Engineering stages.

This is the test for every future addition.

## 1. Entity types (nodes)

| Node type | Key | Owned by | Example |
|---|---|---|---|
| **Organism** | `speciesId` | ecology + dataset | `saguaro` |
| **Use** | `useId` | ethnobotany | `yucca_cordage` |
| **Culture** | `cultureId` (GATED) | ethnobotany (human brief) | — |
| **Compound** | `compoundId` (PubChem/ChEBI) | phytochemistry/chemistry | `salicin` |
| **Effect** | `effectId` | pharmacology | `cox_inhibition` |
| **Pathway** | `pathwayId` | molecular mode | `CAM_photosynthesis` |
| **Gene/Trait** | `traitId` | bio-engineering mode | `drought_tolerance` |
| **EcosystemRole** | `roleId` | systems mode + food-web | `keystone_pollinator_host` |
| **Adaptation** | `adaptationId` | cellular mode | `pleated_water_storage` |
| **Quest** | `questId` | quest engine | `bake_trail_bread` |
| **Instrument** | `instrumentId` | carry-forward systems | `UTM`, `microscope` |
| **EngineeringLesson** | `lessonId` | vehicle spine | `density_vs_strength` |
| **ReasoningTag / HierarchyLevel** | — | reasoning substrate | `systems_thinking` / `predict` |

New facets to add to the dataset entity (audit §4 gap):
`microbiology` (associated microbes / soil-life) and `systems_role`
(ecosystem function: producer, N-fixer, pollinator-host, decomposer-
substrate, nurse, water-indicator).

## 2. Relationships (edge types)

```
Organism  --POLLINATED_BY-->        Organism (insect/bird/bat)
Organism  --EATEN_BY/EATS-->        Organism            (food-web, Phase 4)
Organism  --NURSES-->               Organism            (palo verde → saguaro)
Organism  --MUTUALIST_OF-->         Organism            (yucca ↔ yucca moth)
Organism  --HAS_USE-->              Use
Use       --ATTRIBUTED_TO-->        Culture (GATED)
Organism  --CONTAINS-->             Compound
Compound  --EXTRACTED_BY-->         Process (water/alcohol/oil/resin)
Compound  --PRODUCES-->             Effect              (pharmacology)
Effect    --ACTS_ON-->              Pathway
Organism  --EXPRESSES-->            Trait  --ENCODED_BY--> Gene
Organism  --HAS_ADAPTATION-->       Adaptation --USES--> Pathway
Organism  --PLAYS-->                EcosystemRole
Organism  --REQUIRES-->             Resource (soil/water/light)
* (any node) --TEACHES-->           EngineeringLesson
* (any node) --APPEARS_IN-->        Quest --TESTS--> ReasoningTag/Hierarchy
* (any node) --STUDIED_WITH-->      Instrument
```

Edges are typed and directional; the food-web substrate (Phase 4) owns
the ecological edges (pollinated_by, eats, nurses, mutualist_of, plays).

## 3. Worked node — Saguaro (one organism, many directions)

```
saguaro
 ├─ POLLINATED_BY → white_winged_dove, lesser_long_nosed_bat, white_lined_sphinx_moth
 ├─ NEST_HOST_FOR → gila_woodpecker, gilded_flicker, elf_owl
 ├─ PLAYS         → keystone (food + nesting); systems_role
 ├─ HAS_ADAPTATION→ pleated_water_storage, shallow_root_mat
 │                   └─ USES → CAM_photosynthesis (pathway)
 ├─ CONTAINS      → mucilage_polysaccharides
 ├─ HAS_USE       → rib_pole (construction)  ──ATTRIBUTED_TO→ [GATED culture]
 ├─ EXPRESSES     → drought_tolerance (trait) ──ENCODED_BY→ [genes, late-game]
 ├─ TEACHES       → "water storage vs structure", "CAM night-breathing"
 ├─ STUDIED_WITH  → microscope (cells), ecosystem_simulator (role)
 └─ APPEARS_IN    → quests: "why does the saguaro breathe at night?" (Explain),
                    "what nests in the saguaro?" (Observe→systems Predict)
```

One organism is discoverable from: an insect (pollinator), a bird
(nest), a compound, an adaptation, a pathway, a use, an engineering
lesson, or a quest — exactly the goal.

## 4. Graph queries (the API the substrates expose)

- `neighbors(node, edgeType?)` — e.g. `neighbors(saguaro, POLLINATED_BY)`.
- `pathTo(a, b)` — shortest typed path; powers "connect-the-facets"
  discovery (the learning *is* the path: yucca → moth → mutualism →
  systems collapse prediction).
- `byRole(roleId)` — all N-fixers / pollinator-hosts (terraforming &
  systems quests).
- `byChapterScope(n)` — entities/uses unlocked at vehicle chapter n.
- `teaches(lessonId)` — all nodes that teach an engineering lesson
  (cross-spine reinforcement).
- `reachableFrom(node, hierarchyLevel)` — quests on this node at a given
  Educational-Hierarchy level (no-dead-end enforcement: every Observe
  node must have a reachable Explain/Predict quest).

## 5. Gameplay uses

- **Discovery from many directions:** scan a bee → it points to the
  flowers it pollinates → those plants' uses/compounds → quests. Scan a
  plant → its pollinators, compounds, role. (No Man's Sky scanning over a
  real graph.)
- **Connect-the-facets = the reward:** completing a `pathTo` between two
  facets of the same organism flips knowledge-state `understood` (you
  understood *why*, not *what*).
- **Systems prediction:** the Ecosystem Simulator (Systems mode) reads
  the graph's ecological edges to predict "remove the yucca moth → yucca
  recruitment collapses."
- **Engineering reinforcement:** `teaches` edges let a biology discovery
  unlock or hint a vehicle lesson (ironwood density → Ch6 strength-to-
  weight).

## 6. Storage & discipline

- The graph is **derived from data**, not a separate database: nodes are
  dataset/substrate records; edges are declared in data (food-web tables,
  compound links, pathway links). Single-authority per arc.md §8.6 — no
  parallel graph store; the graph is an index over canonical data.
- GATED culture nodes/edges remain null until human-brief (arc.md §2).
- Knowledge-state writes go through the knowledge-state substrate only
  (arc.md §8.5); the graph never forks `state.knowledge`.

## 7. Open questions
- Edge weighting (is "keystone" a stronger edge than "occasional
  visitor")? Needed for systems-simulation realism vs simplicity.
- How many hops a Chapter-1 player can traverse before it's overwhelming
  (UX, not schema).
- Whether `pathTo` rewards should be authored per-pair or generated.
