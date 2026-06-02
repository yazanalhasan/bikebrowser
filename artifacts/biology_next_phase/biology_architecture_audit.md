# Biology Architecture Audit — coherence review (no new content)

Scope reviewed: `arc.md` (v1.9, §2/§3/§4/§9/§10), `biology-substrate.md`
(incl. §13 observation-scale modes, §14 biological-engineering),
`ethnobotany-substrate.md`, `phytochemistry-substrate.md`,
`pharmacology-substrate.md`, `reasoning-substrate.md`,
`data/sonoran/` (README + plants.sonoran.js), `data/curriculum/chapter-map.md`.

Verdict: **the architecture is largely coherent.** Biology is already a
shared-entity graph (one `speciesId` with facets), not a stack of
subjects. Below are the real findings, ranked. Five are genuine
issues/risks the next-phase docs must resolve; the rest are confirmations.

## 1. Duplicated concepts
- **No harmful duplication of data.** Species/compound/pathway are
  single-authority (ecology owns the organism; phytochemistry the
  compound link; pharmacology the effect). Confirmed across the four
  substrate "Not." sections.
- **FINDING (minor): the "Unified Biological Knowledge Graph" is
  described prose-only in arc.md §3** and informally in each substrate's
  bridge section. It is not yet a *formal* schema (entity types, edge
  types, queries). → Resolved by Phase 2 (`biology_knowledge_graph.md`).
  This is elaboration, not duplication.
- **FINDING (minor): dose-response is stated in three places** (arc.md §3
  Universal Dose-Response Principle; pharmacology §10; growth-chamber in
  biology §13.2). These agree, but the principle should have **one
  canonical home** (arc.md §3) that the others reference, which they do.
  No drift; keep as cross-reference, do not re-define.

## 2. Systems existing in multiple places
- **Confirmed single-workbench discipline.** Cellular/Microbiology/
  Molecular/Systems are **modes** of the one Biology Workbench
  (`biology-substrate.md` §13), not separate substrates — correct per the
  "no fragmentation" rule.
- **FINDING (real, must document): asymmetry between bridges and scales.**
  Ethnobotany / Phytochemistry / Pharmacology are *separate substrate
  docs*, but Cellular / Molecular / Microbiology / Systems are *workbench
  modes*. This is defensible (bridges own distinct **relationships**
  between entity types; scales are **zoom levels** on organisms the
  workbench already owns) — **but it is not stated anywhere as a rule.**
  → The knowledge-graph doc (Phase 2) must state the test explicitly:
  *"a new biology concept becomes a substrate only if it owns a new edge
  type between entity types; otherwise it is a workbench mode."*

## 3. Contradictions
- **RESOLVED earlier: the Stage 1/2/3 collision** (interaction mode
  Recipe/Parametric/Simulation vs observation scale organism→cell→
  molecule→system). Now an explicit two-axis model (`biology-substrate.md`
  §13 + title). Confirmed non-contradictory.
- **FINDING (real, must reconcile in Phase 10): "acts" are overloaded.**
  arc.md has **three game acts by medium** (Ground / Sea & Air / Space).
  Earlier guidance overlaid a biology cognitive arc (Act 1 Observe / Act 2
  Explain / Act 3 Engineer). This Phase requests a **five-"act" living-
  systems roadmap** (Living Systems / Cells & Molecules / Bio-Engineering
  / Life Support / Terraforming). **These are three different axes and
  must not be called the same "Act".** → `living_systems_roadmap.md` must
  name them **biology phases (BP1–BP5)** mapped onto the 3 game acts +
  7 vehicle chapters, not introduce new game acts. Failing to do this
  would contradict the vehicle-spine canon.

## 4. Gaps between domains
- **Ecology ↔ Ethnobotany ↔ Phytochemistry ↔ Pharmacology:** clean,
  shared-id chain. No gap.
- **Cellular ↔ Molecular ↔ Systems:** present as workbench modes; the
  plant dataset carries `cellular_biology` + `molecular_biology` facets.
  **GAP: no explicit `microbiology` or `systems` facet on the dataset
  entity** (microbes/soil-life and ecosystem-role are implied in ecology
  but not first-class). → Phase 2 schema should add `microbiology` and
  `systems_role` facets; Phase 4 (food-web) supplies the relationships.
- **Systems Biology ↔ Synthetic Biology ↔ Biological Engineering:**
  present in `biology-substrate.md` §14, gated by prediction-precedes-
  intervention. No internal gap. **GAP: the ecological-relationship layer
  that systems/synthetic/terraforming biology depend on does not yet
  exist as a structure** (relationships are scattered in prose). → Phase 4
  (`food_web_substrate.md`) is the missing connective tissue, and is
  correctly prioritized.
- **Net:** the two genuine structural gaps are (a) a formal graph schema
  and (b) a relationship/food-web layer. Both are addressed by Phases 2
  and 4. There is no orphaned or unreachable domain.

## 5. Does every domain connect to gameplay?
Yes, with one weak spot:
- ecology → discovery/observation quests; ethnobotany → craft quests;
  phytochemistry → extraction; pharmacology → investigation; cellular/
  molecular → microscope/model; systems → ecosystem simulator;
  bio-engineering → trait/genome simulators. All have an instrument +
  quest hook in the curriculum map.
- **WEAK SPOT: Molecular Biology Mode's gameplay is the least concrete**
  ("model rather than memorize" — no instrument of its own; it leans on
  the Genetics Workbench/pharmacology). → Phase 8/9 should give it a
  distinctive gameplay verb (e.g., "trace the pathway that explains the
  observation") so it isn't a reading screen.

## 6. Does every domain connect to engineering?
Yes — this is a strength. Each biological domain has an engineering
analog already in canon: ethnobotany→materials, phytochemistry→fuels/
resins, pharmacology→dose-response/systems-testing, cellular→materials-
inspection (microscope), microbiology→chemistry (fermentation), systems→
spacecraft simulation, bio-engineering→life-support/terraforming. The
biological spine and vehicle spine reinforce, not compete. **No gap.**

## 7. Where does it feel like school instead of a game?
Three real risks to guard (do NOT add content that worsens these):
- **R1 — the grade-band tables** (`chapter-map.md` §2,
  `reasoning-substrate.md` §6) read curriculum-first. They are
  *developer-facing* and correctly hidden from the player, but the
  educational-progression doc (Phase 6) must keep examples as **in-world
  problems**, never "Grade 3 multiplication worksheet."
- **R2 — standards codes** risk becoming the design driver. Canon already
  says Arizona = minimum competency *targets, not content* (arc.md §2);
  Phase 6/8 must keep standards as a *coverage check on emergent
  gameplay*, never a quest prompt.
- **R3 — "Observe" quests** can degrade into fact-collection. The
  no-dead-end rule exists (curriculum map) but must be enforced in the
  quest taxonomy (Phase 8): every Observe quest links forward to an
  Explain/Predict quest on the same entity.

## Summary — what the next-phase docs must do
1. **Phase 2:** formalize the graph + add the substrate-vs-mode rule +
   add `microbiology`/`systems_role` facets.
2. **Phase 4:** build the relationship/food-web layer (the real gap).
3. **Phase 10:** name biology phases BP1–BP5 mapped onto the 3 acts /
   7 chapters — never new game acts (the real contradiction risk).
4. **Phases 6/8/9:** keep it a game — in-world problems, hidden tags,
   no dead-end Observe quests, give Molecular Mode a real verb.

No blocking incoherence found. The architecture is sound to expand once
Phases 2 and 4 add the formal graph and relationship layers.
