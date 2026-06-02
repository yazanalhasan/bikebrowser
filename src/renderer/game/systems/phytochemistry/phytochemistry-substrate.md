# Phytochemistry Substrate Design — `CompoundUseEntity` Carry-Forward System

**Status:** Phase-2 design document. No code is shipped by this document.
Implementation is gated on this design landing and on the companion
`ethnobotany-substrate.md` (shared `speciesId`) and the Chemistry Lab /
Extraction Bench data (shared `compoundId`).
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when implementation ships.

**Companion documents (read alongside):**
- `src/renderer/game/systems/ethnobotany/ethnobotany-substrate.md` —
  upstream: a plant use that has a chemical basis becomes a
  phytochemistry entry.
- `src/renderer/game/systems/pharmacology/pharmacology-substrate.md` —
  downstream: a compound that *does something* becomes a pharmacology
  entry.
- `src/renderer/game/systems/ecology/ecology-substrate.md` and
  `biology/biology-substrate.md` — shared Species concept; the molecule
  scale of the Biology Workbench.
- `arc.md` — especially §2 (UTM + biology rule + dose-response + the
  "relationships not facts" canon rule), §3 (Biological Progression
  Spine + the Unified Biological Knowledge Graph + the Willow example),
  §4 (Carry-Forward Systems, Extraction Bench), §8 (World Model
  Alignment Layer), §9 (Open Knowledge & Data Sources).

---

## 1. Purpose

**Role.** `CompoundUseEntity` is the carry-forward system that owns the
**plant → molecule → outcome** relationship: *what molecules are inside
a plant, and how processing changes what the player recovers and can
use.* It is the **Ethnobotany ↔ Chemistry ↔ Pharmacology** bridge of the
Unified Biological Knowledge Graph (arc.md §3). It is introduced with
the **motorcycle** (Chapter 3 — plants become fuels, lubricants, resins,
gums) and is central from there. It expresses the biology loop
**Observe → Test → Model → Predict → Engineer** through the Extraction
Bench: the player discovers, by experiment, why **water (boiling)**,
**alcohol**, **oil**, and **resin/distillation** extractions recover
different compounds — never by reading a list.

**Not.** It does **not** own the plant (that is ethnobotany /
`speciesId`), the molecule definition (that is chemistry data /
`compoundId`, sourced from PubChem/ChEBI/ChemSpider — read-only here),
or what the molecule *does* in a living system (that is pharmacology).
It is **not** a renderer, a quest store, or the Knowledge State System;
it writes observations and (when knowledge-state ships) emits
Seen/Interacted/Understood transitions, never consuming knowledge-state
queries before that system lands (arc.md §8.5). It does **not** model
real synthetic chemistry or pharmacology beyond age-appropriate,
sourced, educational depth (arc.md §2, §7).

**Curriculum served.** Compound families discovered as the *answer to a
problem*, not memorized: **alkaloids, terpenes, phenolics, flavonoids,
resins, tannins, essential oils.** Ch3 fuels/lubricants/resins (pine
resin, frankincense, mastic, acacia gum); Ch4 industrial materials
(cellulose, rubber latex); Ch5 waterproofing resins; Ch6
strength-to-weight bio-composites; Ch7 life-support chemistry. The
dose/ratio framing carries the Universal Dose-Response Principle.

---

## 2. Data substrate consumption

### 2.1 The compound-use table (`data/phytochemistry.js`)

Canonical, read-only from the substrate. One record per **(plant,
compound, extraction-method)** outcome, keyed by `id`. Built from the
Tier-3 chemistry sources of arc.md §9 (PubChem, ChEBI, ChemSpider) plus
the extraction/use context from the ethnobotany Tier-1/2 sources.

- **`speciesId`** — FK into `data/flora.js` (must resolve; §11.1).
- **`compoundId`** — reference into chemistry data (PubChem CID / ChEBI
  id). The substrate stores the *link*, not the molecule.
- **`compoundFamily`** — one of the seven families above (data enum).
- **`extractionMethod`** — `water | alcohol | oil | resin | distillation`.
- **`yield`**, **`properties`** — recovered-fraction + property tags
  surfaced for the rig (solubility, volatility, thermal tolerance).

### 2.2 Shared ids (single-authority)

`speciesId` is shared with ecology/ethnobotany; `compoundId` with
chemistry/pharmacology. Phytochemistry never invents a species or a
molecule another substrate owns (halt-and-surface, §11.1). Biome/season
context is read via the plant record / `getBiomeAt()`, never re-derived
(arc.md §8.6 CRITICAL).

---

## 3. Entity model

```
id:               stable key, e.g. "willow_salicin_water"
speciesId:        FK -> data/flora.js
compoundId:       FK -> chemistry data (PubChem/ChEBI)
scientificName:   plant binomial (denormalized for UI)
compoundFamily:   alkaloid | terpene | phenolic | flavonoid | resin | tannin | essential_oil
extraction: {
  method:         water | alcohol | oil | resin | distillation
  inputs:         { plantPartId, solventId, heat, time, ratio }
  yield:          0..1
  failureModes:   string[]   // wrong solvent, overheated, degraded
}
properties:       tag[]       // solubility, volatility, thermalTolerance, …
provenance:       { sources: SourceRef[], license, reviewedBy|null }
gameplay: {                    // the biology loop, molecule scale
  observe:  { hook }           // notice a plant has a usable compound
  test:     TestRef[]          // Extraction Bench / Chemistry Lab rig ids
  model:    { compoundFamily, why }   // the relationship learned
  predict:  { property -> outcome }   // dose/ratio prediction
  engineer: CraftRef[]         // sealant, lubricant base, dye, remedy-to-investigate
}
knowledge:        { domain: "phytochemistry", seen, interacted, understood }
chapterScope:     3..7
links:            { pharmacologyEffectIds[], materialSampleIds[] }
```

---

## 4. Public API

- `registerCompoundUse(partial)` — validate `speciesId` + `compoundId`
  FKs; freeze provenance; throw on unsourced entry (§11.3).
- `registerCompoundUses(partial[])`.
- `queryCompoundUses(predicate)` — by family, method, plant, or
  `chapterScope <= currentChapter`.
- `emitExtracted(entity, method, result)` — records an extraction-bench
  outcome (the primary "Test" event); yields a typed inventory item
  (raw extract vs purified compound).
- `emitObservation(entity, source)` / reserved knowledge-state
  `Seen`/`Interacted`/`Understood` (the only path to `understood` is a
  demonstrated extraction or craft, arc.md §2).
- `debugDrawCompoundUses(scene)` — PRIVATE / DEV-ONLY.

## 5. Event model

Emits `phytochem:extracted`, `phytochem:crafted`,
`phytochem:understood` (reserved). Listens for `ethnobotany:processed`
(upstream hand-off of a plant part) and `chemistry:reacted` (the rig
firing). Hands a compound downstream via a typed reference the
Pharmacology Substrate consumes — it does not write pharmacology state.

## 6. World-model primitive integration

Per arc.md §8.1:

- **Environmental primitives consulted:** biome / season (via the plant
  record) for what is harvestable to extract; terrain only indirectly
  (through ethnobotany). No direct biome string (arc.md §8.6).
- **Progression primitives updated:** observations (`state.observations`);
  typed inventory (raw extract / purified compound / tested compound);
  knowledge state reserved, not consumed before `knowledge-state-substrate.md`
  ships (arc.md §8.5). Discovery/landmarks: not updated.
- **Act 1 → Act 3 scaling:** Ch3 fuels/resins → Ch6 bio-composite
  chemistry → Ch7 life-support chemistry; alien compounds register
  through the same schema with new `compoundId`s. No act-specific
  carve-outs (arc.md §8.2).

## 7. Bridge contracts

```
Ethnobotany → Phytochemistry → Pharmacology
                     ↓
              Materials / Chemistry Lab
```

- **Ethnobotany → here:** a plant use with a chemical basis (`yucca
  saponin`, `willow salicin`) promotes to a compound-use entry.
- **here → Pharmacology:** a compound that *does something in a living
  system* is referenced by a `BioEffectEntity` (pharmacology owns the
  effect; phytochemistry owns the molecule's recovery).
- **here → Materials/Chemistry:** a recovered resin/cellulose becomes a
  materials sample or a chemistry input.

When a bridge would require phytochemistry to write another system's
authoritative state, it halts-and-surfaces (arc.md §4 Portability).

## 8. Save state model

Persists: extraction history, recovered-compound inventory, knowledge
transitions (when that system ships), and `understood` proofs (which
extraction/craft demonstrated the relationship). Does not persist the
compound-use table, molecule definitions, or provenance (all canonical
in data). Single observation/knowledge authority (no parallel store).

## 9. Performance and lifecycle

Event-driven (extract/craft), not ticking. Data loads at startup /
region-enter; entities re-register from data (HMR-safe). No per-frame
cost.

## 10. Discipline rules

1. **FK authority.** `speciesId`/`compoundId` must resolve; inventing a
   plant or molecule another substrate owns is halt-and-surface.
2. **Single observation authority** (arc.md §8.6).
3. **Provenance + license per record** (arc.md §9). No unsourced
   compounds; license recorded per source.
4. **Educational depth only.** Age-appropriate compound depth (arc.md
   §2, §6 open question); no real synthetic-chemistry simulation
   (arc.md §7). Extraction teaches *method changes outcome*, not how to
   make controlled or hazardous substances.
5. **Dose/ratio = dose-response.** Ratio and concentration surface the
   Universal Dose-Response Principle (arc.md §3).
6. **Understood is earned** — only via a demonstrated extraction/craft.
7. **Data-driven, portable, no per-vehicle minigame** (arc.md §4, §8.2).

## 11. Out of scope

- Real synthetic or extraction chemistry for hazardous/controlled
  substances; any "how to make" instruction beyond age-appropriate,
  sourced educational framing.
- Owning the molecule definition (chemistry data) or the biological
  effect (pharmacology).
- Memorization / encyclopedia-completion meta (arc.md §2 canon rule).
- Scene-coupled or per-vehicle implementations (arc.md §8.2).

## 12. Open questions

- **12.1** Compound granularity / age-appropriate depth — how many
  compounds and how much mechanism per plant (cross-ref arc.md §6).
- **12.2** Where exactly Chapter 3 gates phytochemistry vs the
  Chemistry Lab baseline.
- **12.3** Knowledge-state coupling timing (observation-only first vs
  gated on knowledge-state shipping).
- **12.4** Extraction-bench failure model granularity (binary vs graded
  yield).
