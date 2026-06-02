# Reasoning Substrate Design — `ReasoningTag` & Standards-Alignment System

**Status:** Phase-2 design document. No code is shipped by this document.
**Verdict tag:** `[design-only]`.

**Companion documents:**
- `arc.md` — especially §2 (Educational Hierarchy; prediction-precedes-
  intervention; academic-standards posture; "relationships not facts"),
  §3 (the vehicle + biological progression spines), §8 (World Model
  Alignment Layer).
- `knowledge-state-substrate.md` — Seen/Interacted/Understood is the
  *content* mastery model; this substrate is the *reasoning* and
  *standards* model. The two are distinct and complementary.

---

## 1. Purpose

**Role.** The Reasoning Substrate is how BikeBrowser+ carries
educational rigor **without ever showing a school question.** It does
two things:

1. **Tags every quest, system, and curriculum element** with the
   reasoning it exercises and the Educational Hierarchy level it targets.
2. **Aligns that tagging to academic standards** so coverage can be
   measured and reported, with Arizona as the minimum-mastery baseline.

The player never sees a quiz. They see a problem in the world (repair a
bag, test a beam, predict an ecosystem). This substrate is the invisible
layer that records *what kind of thinking* the problem required and
*which standard* it satisfied.

**Not.** It is **not** a question bank, a test engine, or a grade book
shown to the player. It does not gate gameplay on enrichment/gifted
content (arc.md §2 — no enrichment may be required for progression). It
does not own quest logic (`data/quests.js`) or content mastery
(knowledge-state); it annotates them.

---

## 2. Reasoning domains (the taxonomy)

Every quest receives **one or more** reasoning tags from this canonical
set:

```
reasoning_domains:
  pattern_recognition:   # see the rule behind examples
  spatial_reasoning:     # shape, layout, rotation, structure, maps
  logical_deduction:     # if/then, elimination, proof-by-cases
  causal_reasoning:      # cause → effect, mechanism, "why"
  estimation:            # order-of-magnitude, approximation, units
  optimization:          # best tradeoff under constraints
  experimental_design:   # variable control, fair tests, evidence
  systems_thinking:      # feedback, interdependence, emergence
  language_reasoning:    # decode meaning, follow instructions, translate
                         # across the six language tracks (§5); read signs,
                         # diagrams, recipes, and NPC dialogue as evidence
```

`language_reasoning` ties the Language & Geography layer (arc.md §5) into
the reasoning system: greetings that unlock trust, region-specific
technical terms, and reading a diagram or recipe are all reasoning acts,
never vocabulary quizzes.

These map naturally onto the game's instruments: the UTM rig exercises
`experimental_design` + `causal_reasoning`; the Construction system
`spatial_reasoning` + `optimization`; the Ecosystem Simulator
`systems_thinking` + `causal_reasoning`; bridge/material selection
`estimation` + `optimization`.

## 3. Educational Hierarchy levels (per arc.md §2)

Every quest also carries exactly one **primary** hierarchy level (and
may carry secondary ones):

```
hierarchy_levels:
  1_observe:   notice and record
  2_explain:   say why
  3_predict:   say what will happen before it does
  4_engineer:  change the system to a chosen outcome
  5_teach:     explain it so someone else can predict it
```

Canon: the player is almost never asked "what is the answer?" — quests
target `predict` and above wherever the content supports it. A quest
whose primary level is `observe` should still point toward a later
`explain`/`predict` quest on the same object (no dead-end facts).

## 4. Quest tag schema

```
questTag:
  questId:            FK -> data/quests.js
  reasoningDomains:   reasoning_domain[]      # one or more
  hierarchyPrimary:   hierarchy_level         # exactly one
  hierarchySecondary: hierarchy_level[]
  standards:          StandardRef[]           # see §5
  biologicalDomain:   ecology|ethnobotany|phytochemistry|pharmacology|
                      cellular|molecular|microbiology|systems|bioengineering|null
  engineeringDomain:  mechanical|electrical|combustion|integration|
                      fluid|aero|vacuum|construction|materials|null
  vehicleChapter:     1..7 | null
```

A single quest is typically tagged across several axes — e.g. *"repair
the bike bag with yucca fiber"* → reasoning `[experimental_design,
causal_reasoning]`, hierarchy `engineer` (secondary `observe`,
`predict`), biologicalDomain `ethnobotany`, engineeringDomain
`materials`, chapter 1.

## 5. Standards alignment (canon posture, arc.md §2)

```
standards:
  primary:        arizona_academic_standards     # MINIMUM mastery baseline
  enrichment:                                    # advanced, never required
    - massachusetts_science
    - california_mathematics_framework
    - virginia_stem
    - singapore_math
  optional_depth:                                # gifted, never required
    - beast_academy
    - art_of_problem_solving
    - mensa_for_kids_concepts
```

Rules:
- **Arizona standards are the progression floor.** Every chapter's
  required quests must, in aggregate, cover the Arizona grade band for
  that chapter (see §6).
- **Enrichment and gifted tags are additive only.** No quest tagged
  *only* with enrichment/gifted standards may be on the required path.
- **Coverage is reportable, not graded to the player.** A developer/
  parent report can show Arizona coverage %, enrichment reach, and
  reasoning-domain balance. The player sees none of it.

## 6. Grade-band mapping (Grade 2 → 3 → 4 starting point)

The target learner spans roughly Grade 2–4 at Chapter 1, rising with the
spine. Initial banding (to be refined with a standards specialist):

| Vehicle chapter | Target grade band | Dominant hierarchy | Notes |
|---|---|---|---|
| Ch1 Bike | Grade 2 → 3 | Observe → Explain | foundation; concrete, hands-on |
| Ch2 E-bike | Grade 3 | Explain | first abstraction (electricity) |
| Ch3 Motorcycle | Grade 3 → 4 | Explain → Predict | extraction, ratios |
| Ch4 Car | Grade 4 | Predict | systems integration |
| Ch5–6 Boat/Plane | Grade 4+ | Predict → Engineer | fluid/aero, optimization |
| Ch7 Spacecraft | Grade 4+ / enrichment | Engineer → Teach | systems + bio-engineering |

A full grade-by-grade curriculum map is a separate build (flagged in
arc.md §6 / future work); this section is the canonical skeleton.

## 7. Public API

- `tagQuest(questTag)` — validate FK to `data/quests.js`; require
  `hierarchyPrimary` and ≥1 `reasoningDomain`; throw if a required-path
  quest carries only enrichment/gifted standards (§5).
- `coverageReport({ chapter?, standardSet? })` — developer/parent-facing
  aggregate (Arizona coverage %, reasoning-domain balance, hierarchy
  distribution). Never shown to the player.
- `queryQuestsByReasoning(domain)` / `byHierarchy(level)` / `byStandard(ref)`.

## 8. World-model primitive integration (arc.md §8.1)

- **Environmental primitives consulted:** none (operates on quest
  metadata).
- **Progression primitives updated:** none directly — it annotates;
  knowledge-state and quest-state remain the authorities. Reserved: a
  future `understood`-correlated reasoning-mastery view.
- **Act 1 → Act 3 scaling:** the taxonomy is act-invariant (no
  act-specific carve-outs, §8.2); only the standards grade-band and
  hierarchy emphasis shift upward.

## 9. Discipline rules

1. **No school questions, ever.** Rigor is carried by tagging real
   in-world problems, not by quizzes (arc.md §2 canon rule).
2. **Enrichment/gifted is never required for progression** (arc.md §2).
3. **Every required quest maps to ≥1 Arizona standard** in aggregate per
   chapter.
4. **Predict-and-above is the target.** Minimize pure `observe`/recall
   quests; never dead-end them.
5. **Player never sees the gradebook.** Coverage reporting is
   developer/parent-facing only.
6. **Data-driven and portable** — tags live in data; no per-scene logic.

## 10. Out of scope

- Quiz/test/flashcard mechanics; visible grades or scores-as-grades.
- Gating gameplay on enrichment/gifted content.
- Owning quest logic or content mastery (those are quests / knowledge-
  state).
- Standardized-test prep framing.

## 11. Open questions

- **11.1** Exact Arizona standard codes per Chapter-1 quest (needs a
  standards specialist; blocks the full coverage report, not the
  taxonomy).
- **11.2** How (and to whom) the coverage report surfaces — parent
  dashboard? dev-only? (cross-pillar with BikeBrowser+ Discovery
  learning tracking, arc.md Context — out of scope without a brief).
- **11.3** Reasoning-mastery model — do we track reasoning growth
  separately from content `understood`, and how?
- **11.4** Grade-band boundaries vs the player's actual demonstrated
  level (adaptive vs fixed).
