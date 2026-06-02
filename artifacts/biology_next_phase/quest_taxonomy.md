# Quest Taxonomy — the complete tag schema

Defines how **every** quest is classified, before generating hundreds.
The goal: a quest generator can eventually compose quests from tags
(`hierarchy × reasoning × domain × gameplayType × difficulty × entity`).
Quests are always **in-world problems**, never questions (arc.md §2).

## Tag schema

```
quest:
  id:                 kebab-case
  title:              player-facing, an invitation ("repair the bike bag…")
  prompt:             the in-world situation (never "what is X?")
  entities:           graphNodeId[]   # ≥1 (species, compound, role, instrument…)
  instruments:        instrumentId[]  # ≥1 (UTM, microscope, extraction bench…)

  hierarchy:
    primary:          observe | explain | predict | engineer | teach   # exactly 1
    secondary:        hierarchyLevel[]

  reasoning:          reasoningDomain[]   # ≥1 of the 14 (base + advanced)

  scientificDomains:  domain[]   # biology | chemistry | ecology | engineering
                                 # | physics | geology | astronomy

  gameplayType:       type[]     # exploration | crafting | investigation
                                 # | construction | experimentation
                                 # | simulation | teaching

  difficulty:
    gradeBand:        G2 | G3 | G4 | G4+
    challenge:        1..5        # within-band difficulty
    track:            core | enrichment | gifted   # core = required path

  links:
    vehicleChapter:   1..7
    biologicalDomain: ecology|ethnobotany|phytochemistry|pharmacology|
                      cellular|molecular|microbiology|systems|bioengineering|null
    engineeringDomain: mechanical|electrical|combustion|integration|fluid|
                      aero|vacuum|construction|materials|navigation|null
    standardsRefs:    StandardRef[]   # coverage check, not the prompt
    predecessors:     questId[]       # gating
    successors:       questId[]       # no-dead-end: every observe links forward
    seedsChapter:     n|null          # cross-chapter foreshadowing
```

## Controlled vocabularies

- **Hierarchy (5):** observe, explain, predict, engineer, teach.
- **Reasoning (14):** pattern_recognition, spatial_reasoning,
  logical_deduction, causal_reasoning, estimation, optimization,
  experimental_design, systems_thinking, language_reasoning,
  model_building, tradeoff_analysis, uncertainty_reasoning,
  evidence_evaluation, feedback_loop_reasoning.
- **Scientific domains (7):** biology, chemistry, ecology, engineering,
  physics, geology, astronomy.
- **Gameplay types (7):** exploration, crafting, investigation,
  construction, experimentation, simulation, teaching.
- **Tracks (3):** core (required, Arizona-floor), enrichment
  (advanced-state, additive), gifted (Beast/AoPS/Mensa, optional depth).

## Generation rules (constraints the generator must satisfy)
1. **Every quest** has ≥1 entity, ≥1 instrument, exactly one hierarchy
   primary, ≥1 reasoning domain, ≥1 scientific domain, ≥1 gameplay type.
2. **No dead-end facts:** every `observe`/`explain` quest declares ≥1
   `successors` (a deeper quest on the same entity).
3. **Predict-and-above majority** at G3+ (generator balances the set).
4. **Reasoning balance:** across a chapter, all relevant domains covered;
   no single domain dominates.
5. **Core before enrichment:** Arizona-floor coverage met by `core`
   quests before any `enrichment`/`gifted` quest is on the path.
6. **Prediction precedes intervention:** any `engineer` quest has a
   `predict` predecessor on the same system (arc.md §2).
7. **Safety:** quests touching toxic/venomous entities are
   `investigation`/`observe` only, with dose-response framing; never
   forage-and-eat (pharmacology discipline).
8. **Cultural gate:** quests referencing `culture` entities require the
   human-brief gate cleared (else the entity's cultural facet is hidden).

## Worked tag example

```
id: repair-bike-bag-with-yucca-fiber
title: "Your bag strap snapped — the desert has an answer."
prompt: "The strap tore on the trail. Banana yucca leaves are full of
         strong fiber. Can you make a cord that holds your gear?"
entities: [banana_yucca]
instruments: [UTM, extraction_bench?]
hierarchy: { primary: engineer, secondary: [observe, predict] }
reasoning: [experimental_design, causal_reasoning, tradeoff_analysis]
scientificDomains: [biology, engineering]
gameplayType: [exploration, crafting, experimentation]
difficulty: { gradeBand: G3, challenge: 2, track: core }
links:
  vehicleChapter: 1
  biologicalDomain: ethnobotany
  engineeringDomain: materials
  successors: [why-did-the-cord-hold]   # the Explain follow-up
  seedsChapter: 6                        # strength-to-weight
```

## Difficulty calibration
- `challenge 1–2` = guided, single variable, one prediction.
- `challenge 3` = multi-step, control a variable, predict + verify.
- `challenge 4–5` = systems/tradeoffs/uncertainty, multiple solutions,
  teach-back. (Gifted track lives mostly here.)

## Toward auto-generation
A generator iterates `(entity × instrument × hierarchy × gameplayType)`
and fills reasoning/scientific/standards by lookup from the entity's
graph node (Phase 2) and the chapter matrix (curriculum map). Human
review remains required for: title/prompt voice (child-friendly, Sierra
tone), safety/cultural gates, and fun. **Tags enable generation; humans
guarantee delight and safety.**
