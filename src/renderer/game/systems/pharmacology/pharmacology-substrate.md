# Pharmacology Substrate Design — `BioEffectEntity` Carry-Forward System

**Status:** Phase-2 design document. No code is shipped by this document.
Implementation is gated on this design landing and on
`phytochemistry-substrate.md` (shared `compoundId`) and the Biology
Workbench molecule-scale data (shared `pathwayId`).
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when implementation ships.

**Load-bearing safety framing (read first).** Pharmacology in this game
is **educational only — never clinical, never therapeutic, never
diagnostic.** The player investigates *mechanisms*; the player never
prescribes, treats, doses a person, receives medical guidance, or is
told a remedy "works." This is a halt-and-surface discipline (§10.1),
not a soft preference. It implements arc.md §2 (dose-response thinking,
respect for science) and §7 (no real pharmacology / clinical content).

**Companion documents (read alongside):**
- `src/renderer/game/systems/phytochemistry/phytochemistry-substrate.md`
  — upstream: a recovered compound becomes the subject of an effect
  investigation.
- `src/renderer/game/systems/biology/biology-substrate.md` — the
  molecule/cell/systems scales of the Biology Workbench that pharmacology
  reads (pathways, signaling).
- `src/renderer/game/systems/ethnobotany/ethnobotany-substrate.md` and
  `ecology/ecology-substrate.md` — the Species concept and the culture
  context (gated, arc.md §2).
- `arc.md` — §2, §3 (Biological Progression Spine, Unified Biological
  Knowledge Graph, the Willow example, Universal Dose-Response
  Principle), §4 (Pharmacology Bench), §8, §9.

---

## 1. Purpose

**Role.** `BioEffectEntity` is the carry-forward system that owns **what
biological molecules do — as mechanism**: dose-response, potency,
toxicity, adaptation, resistance, feedback loops, receptor signaling,
and metabolism, investigated on the **Pharmacology Bench** through
experiment and simulation. It is the downstream end of the Unified
Biological Knowledge Graph chain *Chemistry → Pharmacology → Cellular →
Molecular → Systems* (arc.md §3). Introduced with phytochemistry
(Chapter 3) and deepening through molecular biology (Chapter 6). It
expresses the biology loop **Observe → Test → Model → Predict →
Engineer**: e.g. *"investigate why willow tea reduces pain"* — the
player follows the chain from observation to the cyclooxygenase pathway,
and never doses or prescribes anything.

**Not.** It does **not** own the molecule (phytochemistry/chemistry,
`compoundId`), the pathway definition (molecular-biology data,
`pathwayId`), or the organism (ecology). It is **not** a clinical,
therapeutic, or diagnostic system in any form — see §10.1. It is **not**
the Knowledge State System; it writes observations and reserved
knowledge-state transitions only (arc.md §8.5). It does **not** simulate
real human physiology or drug action beyond age-appropriate, sourced,
mechanism-level educational depth (arc.md §2, §7).

**Curriculum served.** Mechanism-level reasoning: dose-response curves
(the Universal Dose-Response Principle, arc.md §3), potency vs toxicity,
adaptation and resistance (why a pest or microbe stops responding),
feedback loops, receptor signaling, and metabolism. Ch3 plant-effect
investigation → Ch6 molecular mechanism → Ch7 organism/ecosystem effects
in the Ecosystem Simulator.

---

## 2. Data substrate consumption

### 2.1 The effect table (`data/pharmacology.js`)

Canonical, read-only. One record per **(compound, target, effect)**
mechanism, keyed by `id`. Built from Tier-3 sources (arc.md §9: NIH /
NCCIH evidence, plus pathway data from UniProt / NCBI / PDB at the
molecule scale). **Every record carries mandatory safety annotation**
(§10.2).

- **`compoundId`** — FK into chemistry/phytochemistry data.
- **`targetId`** — receptor / enzyme / pathway reference (`pathwayId`
  into molecular-biology data).
- **`effectType`** — `signaling | inhibition | toxicity | adaptation |
  resistance | metabolism | feedback`.
- **`doseResponse`** — a curve: `{ benefitBand, optimumBand, harmBand }`
  (the canonical dose-response shape).
- **`safety`** — `{ toxicLookalikes[], unsafeQuantities, notes }`
  (required; §10.2).
- **`evidence`** — `SourceRef[]` with strength; no claim beyond it.

### 2.2 Shared ids

`compoundId` shared with phytochemistry/chemistry; `pathwayId` with
molecular-biology data; `speciesId` (via the compound's source plant)
with ecology/ethnobotany. Pharmacology never invents these
(halt-and-surface, §10.3).

---

## 3. Entity model

```
id:             "salicin_cox_inhibition"
compoundId:     FK -> chemistry/phytochemistry
targetId:       FK -> molecular-biology pathway/receptor (pathwayId)
effectType:     signaling | inhibition | toxicity | adaptation | resistance | metabolism | feedback
doseResponse:   { benefitBand, optimumBand, harmBand }   // the curve
safety:         { toxicLookalikes[], unsafeQuantities, notes }   // REQUIRED §10.2
evidence:       { sources: SourceRef[], strength, license }
gameplay: {                              // the biology loop, mechanism scale
  observe:  { hook }                     // notice an effect to investigate
  test:     TestRef[]                    // Pharmacology Bench experiment ids
  model:    { mechanism, pathwayId }     // the relationship learned
  predict:  { dose -> outcomeBand }      // dose-response prediction
  engineer: { ecosystemUseRef|null }     // Ch7: an intervention to SIMULATE first
}
knowledge:      { domain: "pharmacology", seen, interacted, understood }
chapterScope:   3..7
framing:        "educational_mechanism_only"   // immutable; never clinical
```

---

## 4. Public API

- `registerBioEffect(partial)` — validate FKs; **throw if `safety` is
  missing** (§10.2) or `evidence` is unsourced (§10.4); freeze framing
  to `educational_mechanism_only`.
- `queryBioEffects(predicate)` — by compound, effectType, or
  `chapterScope <= currentChapter`.
- `emitInvestigated(entity, experiment, result)` — records a
  Pharmacology-Bench experiment (the "Test"); never a "treatment".
- `predictDoseOutcome(entity, dose)` — returns the band
  (benefit/optimum/harm) for the dose-response *teaching* mechanic; pure
  function over data, no persistence of a "prescription".
- reserved knowledge-state `Seen`/`Interacted`/`Understood` — the only
  path to `understood` is a demonstrated experiment or a correct
  prediction (arc.md §2).
- `debugDrawBioEffects(scene)` — PRIVATE / DEV-ONLY.

## 5. Event model

Emits `pharma:investigated`, `pharma:predicted`, `pharma:understood`
(reserved). Listens for `phytochem:extracted` (upstream compound) and
`biology:molecule_modeled` (the molecular-biology mode firing). At
Chapter 7 it hands an `ecosystemUseRef` to the Ecosystem Simulator —
which is the **only** place an effect may be applied to the world, and
only in simulation first (arc.md §3 "simulation before deployment").

## 6. World-model primitive integration

Per arc.md §8.1:

- **Environmental primitives consulted:** none directly (operates on
  compounds/effects/pathways). Environmental context arrives via the
  compound's plant record.
- **Progression primitives updated:** observations; knowledge state
  (reserved, not consumed before `knowledge-state-substrate.md` ships,
  arc.md §8.5). Inventory: not written (pharmacology produces knowledge,
  not items). Discovery/landmarks: not updated.
- **Act 1 → Act 3 scaling:** Ch3 plant-effect investigation → Ch6
  molecular mechanism (pathways) → Ch7 organism/ecosystem effects fed to
  the Ecosystem Simulator. Alien biochemistry registers through the same
  schema. No act-specific carve-outs (arc.md §8.2).

## 7. Bridge contracts

```
Phytochemistry → Pharmacology → Molecular Biology → Systems Biology
                                        ↓
                               Ecosystem Simulator (Ch7)
```

- **Phytochemistry → here:** a recovered compound becomes the subject of
  an effect investigation.
- **here → Molecular Biology:** the mechanism resolves to a pathway the
  Biology Workbench molecule scale models.
- **here → Systems Biology / Ecosystem Simulator:** an intervention
  (e.g. a pest-resistance trait, a nutrient effect) is *simulated*
  before any world deployment — never applied directly.

When a bridge would require pharmacology to write another system's
authoritative state, or to apply an effect to the live world outside the
simulator, it halts-and-surfaces.

## 8. Save state model

Persists: investigation history, correct/incorrect dose-response
predictions (failure-as-curriculum), knowledge transitions (when that
system ships). Does not persist the effect table, pathway/molecule
definitions, or evidence (canonical in data). Single observation/
knowledge authority.

## 9. Performance and lifecycle

Event-driven (investigate/predict), not ticking — the only ticking
consumer is the Ecosystem Simulator, which *reads* effects. Data loads
at startup; HMR-safe.

## 10. Discipline rules

1. **Educational-only — never clinical (LOAD-BEARING).** No
   prescription, treatment, dosing of a person, diagnosis, or medical
   guidance, in any text, quest, or UI. The player investigates
   mechanisms. A feature drifting toward clinical/therapeutic/diagnostic
   content is a halt-and-surface trigger. `framing` is immutable
   `educational_mechanism_only`.
2. **Mandatory safety annotation.** Every record requires `safety`
   (toxic look-alikes, unsafe quantities). The dose-response mechanic
   *demonstrates* harm bands; it never instructs ingestion. Registration
   throws without `safety`.
3. **FK authority** — `compoundId`/`targetId` must resolve; no invented
   molecules/pathways (halt-and-surface).
4. **Evidence-bounded.** No efficacy claim beyond the sourced evidence
   strength (arc.md §9). Traditional-remedy *culture* content remains
   gated by the §2 cultural-representation rule (human brief + CARE).
5. **Dose-response is universal.** The curve here is the same canonical
   principle used across nutrients, heat, fertilizers, and ecosystem
   interventions (arc.md §3).
6. **Understood is earned** — via a demonstrated experiment or a correct
   dose-response prediction, never by reading.
7. **Data-driven, portable, no per-vehicle minigame** (arc.md §4, §8.2).

## 11. Out of scope

- Any clinical, therapeutic, diagnostic, or "how to treat / what to
  take" content (the central prohibition).
- Real human-physiology or pharmacokinetic simulation (arc.md §7).
- Owning molecule (chemistry) or pathway (molecular biology) definitions.
- Applying an effect to the live world outside the Ecosystem Simulator.
- Memorization / encyclopedia meta (arc.md §2 canon rule).
- Scene-coupled or per-vehicle implementations (arc.md §8.2).

## 12. Open questions

- **12.1** How abstract should receptor/signaling be for the target age
  (arc.md §6)?
- **12.2** Resistance/adaptation as a multi-trial mechanic — how many
  trials before the lesson lands without tedium?
- **12.3** Exact contract by which a Ch7 effect becomes an Ecosystem
  Simulator intervention (cross-ref `biology-substrate.md` §3 Stage 3).
- **12.4** Knowledge-state coupling timing (observation-only first vs
  gated).
