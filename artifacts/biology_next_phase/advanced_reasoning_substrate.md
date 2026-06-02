# Advanced Reasoning Substrate — higher-order domains

Extends `reasoning-substrate.md`. The base substrate has nine domains
(pattern_recognition, spatial_reasoning, logical_deduction,
causal_reasoning, estimation, optimization, experimental_design,
systems_thinking, language_reasoning). This doc adds **five higher-order
domains** that become load-bearing in biology, engineering, ecosystems,
spacecraft, and terraforming — the Predict → Engineer → Teach end of the
Educational Hierarchy.

These are not new mechanics; they are **tags** on in-world problems
(never questions), surfacing mainly Grade 4+ / Chapters 4–7 / Acts 2–3.

## The five advanced domains

```
advanced_reasoning_domains:
  model_building:        # build a simplified representation that predicts
  tradeoff_analysis:     # reason about competing goals; no free lunch
  uncertainty_reasoning: # act under incomplete/variable information
  evidence_evaluation:   # weigh sources, distinguish strong vs weak data
  feedback_loop_reasoning: # reason about loops that amplify or dampen
```

### model_building
*Build a simplified model that predicts the real thing.* The cognitive
core of the UTM pattern and every simulator. The player abstracts: a
bridge → load paths; an ecosystem → a food-web graph; a pathway →
molecule→mechanism. **Appears in:** materials/UTM, molecular biology
(pathway models), systems biology (ecosystem models), Genome Simulator.
Hierarchy: Predict → Engineer.

### tradeoff_analysis
*Optimize when goals compete and gains cost something.* Distinct from
plain `optimization` (best under fixed constraints) — here the player
must *choose what to sacrifice*. **Appears in:** strength-vs-weight
(plane), drought-tolerance-vs-yield (selective breeding), growth-vs-
resilience (parametric biology), mass-vs-redundancy (life support).
Enforces the "no dominant strategy" guardrail (bio-eng review). Hierarchy:
Predict → Engineer.

### uncertainty_reasoning
*Act well with incomplete or variable information.* The desert is
variable (monsoon timing, harvest windows); experiments have noise;
ecosystems are stochastic. The player learns to hedge, test, and not
over-commit. **Appears in:** harvest-ethics (seasonal windows),
experimental_design (replication), terraforming (will it stay stable?).
Hierarchy: Predict.

### evidence_evaluation
*Weigh sources; distinguish strong evidence from weak.* Directly serves
the "relationships not facts" canon and the data-provenance discipline
(draft_unverified vs verified). The player learns that a single
observation ≠ proof, and that some sources are stronger. **Appears in:**
acceptance/audit reasoning, pharmacology (evidence strength, never
efficacy beyond data), phytochemistry (does the extraction really
explain the result?). Hierarchy: Explain → Predict.

### feedback_loop_reasoning
*Reason about loops that amplify (positive) or dampen (negative).* The
signature of systems thinking made explicit: thermostats, predator-prey
cycles, nutrient loops, runaway vs self-correcting. **Appears in:**
thermal regulation (engine/greenhouse), population dynamics (Population
Simulator), closed life-support loops, terraforming stability. Hierarchy:
Predict → Engineer.

## Where each is load-bearing

| Domain | Biology | Engineering | Ecosystems | Spacecraft | Terraforming |
|---|---|---|---|---|---|
| model_building | molecular/systems | all simulators | food-web model | flight/orbit model | ecosystem model |
| tradeoff_analysis | breeding, parametric | strength-to-weight | growth vs resilience | mass vs redundancy | growth vs stability |
| uncertainty_reasoning | harvest, trials | safety factors | stochastic dynamics | failure margins | will-it-hold |
| evidence_evaluation | pharma, phytochem | test validity | observation vs proof | telemetry | review gate |
| feedback_loop_reasoning | populations | thermal control | predator-prey | life-support loops | runaway vs self-correct |

## Discipline (inherits reasoning-substrate §9)
- These are **hidden tags**, never quiz prompts. Surfaced as harder
  in-world problems (the Mensa-style "can you figure it out?").
- A quest may carry base + advanced domains; advanced domains should be a
  **minority at Grade 2–3** and grow through Grade 4+.
- Standards posture unchanged: advanced reasoning is **enrichment depth**,
  never required for progression (arc.md §2).

## Integration
The base `reasoning-substrate.md` `reasoning_domains` enum should be
extended with these five (additive). The quest-taxonomy (Phase 8) treats
all 14 domains uniformly in tags. No new system — one reasoning substrate.
