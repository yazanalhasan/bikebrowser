# Biological Engineering Review — stress test

Reviews `biology-substrate.md` §14 + arc.md §3 capstone against five
guarantees. **Verdict: all five hold by design**, with three guardrails
that must be enforced in implementation (flagged ⚠).

## The five guarantees (and how the architecture enforces them)
| Guarantee | Mechanism | Holds? |
|---|---|---|
| Not a power fantasy | "stewardship not domination" canon rule; success = biodiversity/resilience/reversibility/containment, never max growth | ✅ |
| Prediction-first | prediction-precedes-intervention canon rule (arc.md §2); Genetics Workbench is a *comprehension gate* before any tool | ✅ |
| Cannot bypass ecology | every stage operates on Food-Web edges (Phase 4); a trait's effect is evaluated against the ecosystem, not in a vacuum | ✅ |
| Cannot bypass systems thinking | Stage gating requires the Systems Mode simulator; "remove/add → predict cascade" is mandatory | ✅ |
| Cannot become a gene-editing toy | no direct world edit; mandatory pipeline Simulation → Containment → Small-scale → Ecosystem review → Release | ✅ |

## Stage-by-stage stress test

### Stage 1 — Selective Breeding (lowest risk)
- **Educational value:** inheritance, trait combination, tradeoffs
  (drought tolerance vs yield) — concrete, age-appropriate, no molecular
  abstraction required. Strong G3–G4 fit.
- **Gameplay value:** Trait Simulator "A + B = ?" loop; predict then
  cross; observe over generations (Population Simulator). Satisfying,
  Kerbal-style test-improve.
- **Abuse risks:** trivial "best trait spam." ⚠ Mitigation: enforce
  **visible tradeoffs** (every gain costs something) so there is no
  dominant strategy.
- **Architectural risks:** could be built as a standalone minigame. ⚠
  Mitigation: it is a Biology Workbench mode reading Trait/Population
  nodes; no separate system.

### Stage 2 — Microbial Engineering
- **Educational value:** nutrient cycles, N-fixation, decomposition,
  fermentation — the soil/microbiology bridge; sets up life support.
- **Gameplay value:** tune a Growth Chamber / Fermentation Bench; build a
  compost or N-fixing culture that changes a Soil node. Visible ecosystem
  effect.
- **Abuse risks:** "microbe bomb" optimization. ⚠ Mitigation: microbes
  act on Food-Web Soil/Nutrient edges with dose-response (too much →
  imbalance), not a linear buff.
- **Architectural risks:** none new — reuses Microbiology Mode (§13.2)
  and the food-web layer. **Focus stays on ecosystems, not genes** (per
  arc canon). ✅

### Stage 3 — Synthetic Biology (simulation only)
- **Educational value:** what traits are needed; tradeoffs; unintended
  effects — the heart of "predict before you build."
- **Gameplay value:** Genome Simulator; design a trait, simulate it in an
  ecosystem, observe emergent failure. High-agency, high-learning.
- **Abuse risks:** the highest. "design a superorganism." ⚠⚠ Mitigation
  (load-bearing): **simulation-only**; nothing leaves the simulator
  without the full release pipeline; every design surfaces tradeoffs and
  at least one unintended effect; success is defined by *system stability*
  not trait magnitude.
- **Architectural risks:** scope creep toward real genetic engineering
  (out of scope, arc.md §7). ⚠ Mitigation: 5 visible parameter
  dimensions max early (per biology §15.5); "realistic genetic
  engineering simulation" explicitly out-of-scope.

### Stage 4 — Life Support Engineering
- **Educational value:** closed loops (food/oxygen/water/waste); mass
  balance; redundancy. Directly the spacecraft/habitat curriculum.
- **Gameplay value:** assemble a closed loop from biological parts the
  player has mastered; test it under failure (a crop dies → predict the
  cascade). Kerbal-for-ecosystems.
- **Abuse risks:** "infinite life support." ⚠ Mitigation: conservation
  constraints (mass/energy must balance); failures propagate.
- **Architectural risks:** none new — consumes Systems Mode + food-web.

### Stage 5 — Terraforming Biology (capstone)
- **Educational value:** ecological succession, carrying capacity,
  resilience, reversibility, containment — systems thinking at its peak.
- **Gameplay value:** Terra Nil-style restoration; success = a *stable,
  reversible, contained* ecosystem, then leave without harm.
- **Abuse risks:** "conquer the planet" extraction framing (explicitly
  out of scope, arc.md §7). ⚠⚠ Mitigation: win condition is **stability +
  stewardship**, never growth/domination; an unstable or runaway system
  is a failure state with visible consequences.
- **Architectural risks:** none — it is the food-web + simulator at
  planetary scale, same schema (no alien carve-out, arc.md §8.2).

## Cross-cutting guardrails (must implement)
1. **The release pipeline is non-bypassable** (Simulation → Containment →
   Small-scale → Ecosystem review → Release). A code path that releases
   an organism skipping a step = halt-and-surface. This is the single
   most important enforcement point.
2. **Every intervention surfaces benefits + costs + ≥1 unintended
   effect.** No monotonic "more is better" anywhere (Universal
   Dose-Response Principle).
3. **Stewardship is the scored outcome.** Leaderboards/rewards key off
   stability, biodiversity, reversibility, containment — never trait
   magnitude or growth rate.

## Conclusion
The biological-engineering ladder is **prediction-first, ecology-bound,
systems-gated, and stewardship-scored.** It is the culmination of the
spine (plant → cell → molecule → ecosystem → engineer), not a gene-editor
toy. The three guardrails above are the implementation contract; with
them enforced, the five guarantees hold.
