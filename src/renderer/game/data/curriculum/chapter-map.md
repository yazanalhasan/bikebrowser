# Curriculum Map — vehicle chapters × standards × reasoning × biology × engineering

**Status:** canonical mapping seed (arc.md v1.8). Binds the vehicle spine
(arc.md §3), biological spine (§3), reasoning domains
(`reasoning-substrate.md`), and academic-standards posture (§2). The full
grade-by-grade curriculum and the 100 Chapter-1 quests are multi-pass
builds; this is the skeleton + a worked first batch.

## 1. The seven-chapter matrix

| Ch | Vehicle | Engineering domain (new) | Biological domain | Reasoning emphasis | Hierarchy | Grade band | Standards |
|---|---|---|---|---|---|---|---|
| 1 | Bike | mechanical (structure, gears, friction) | Ecology | spatial, pattern, experimental_design | Observe → Explain | G2→G3 | Arizona floor |
| 2 | E-bike | electrical (circuits, energy) | Ethnobotany | causal, estimation | Explain | G3 | Arizona + enrich |
| 3 | Motorcycle | combustion/thermal | Phytochemistry | causal, experimental_design | Explain → Predict | G3→G4 | Arizona + enrich |
| 4 | Car | systems integration | Cellular Biology | systems_thinking, optimization | Predict | G4 | Arizona + enrich |
| 5 | Boat | fluid dynamics/buoyancy | Microbiology | experimental_design, systems | Predict → Engineer | G4+ | Arizona + enrich |
| 6 | Plane | aerodynamics | Molecular Biology | optimization, logical_deduction | Predict → Engineer | G4+ | + gifted optional |
| 7 | Spacecraft | vacuum/life support | Systems Biology + Bio-Engineering | systems_thinking, optimization | Engineer → Teach | G4+ / enrich | + gifted optional |

Rule (arc.md §2): the Arizona band is the **required** floor at each
chapter; enrichment/gifted tags are additive and never gate progression.

## 2. Grade framework (Grade 2 → 3 → 4 starting point)

- **Grade 2 (Ch1 foundation):** concrete, hands-on. Observe and name
  parts; simple cause→effect ("the chain turns the wheel"); count/measure;
  fair-test intuition. Hierarchy: mostly Observe, first Explain.
- **Grade 3 (Ch1–3):** first abstraction. Explain *why* (friction, simple
  circuits, extraction changes outcome); estimation and units; multi-step
  cause→effect. Hierarchy: Explain, first Predict.
- **Grade 4 (Ch3–4+):** systems and prediction. Predict outcomes;
  optimize under constraints; control variables; read feedback. Hierarchy:
  Predict, first Engineer.

The framework is **demonstrated-mastery driven**, not age-locked: a
player advances by predicting correctly, per the
prediction-precedes-intervention rule (arc.md §2).

## 3. Quest taxonomy (per reasoning-substrate.md §4)

Every quest carries: `reasoningDomains[]`, `hierarchyPrimary`,
`hierarchySecondary[]`, `standards{primary, enrichment[], optional[]}`,
`biologicalDomain`, `engineeringDomain`, `vehicleChapter`, and links to
dataset entities (`speciesIds[]`). No quest is a quiz; each is an
in-world problem.

## 4. Chapter-1 quest seed (10 of ~100; demonstrates the taxonomy)

These tie to `data/sonoran/plants.sonoran.js`. `standards.primary` codes
are placeholders pending the standards-specialist pass (§11.1 of
reasoning-substrate).

1. **Repair the bike bag with yucca fiber** — speciesIds:[banana_yucca].
   reasoning:[experimental_design, causal_reasoning]; hierarchy: Engineer
   (sec: Observe, Predict); bio: ethnobotany; eng: materials; ch1.
   Player harvests → rets fiber → UTM-tests the cord → crafts the strap.
   *Predict which fiber prep holds the load before building it.*
2. **Bake trail bread** — [velvet_mesquite]. reasoning:[estimation,
   causal]; Observe→Explain→Engineer; bio: ethnobotany; eng: materials/
   chemistry-preview; ch1. Harvest pods → grind → ratio → bake.
3. **Why does the saguaro breathe at night?** — [saguaro]. reasoning:
   [causal_reasoning, pattern_recognition]; Explain; bio: ecology/cellular
   preview; ch1. Observe stomata behavior → explain CAM (water saving).
4. **Soap from the desert** — [desert_agave, banana_yucca]. reasoning:
   [causal, experimental_design]; Explain→Predict; bio: ethnobotany/
   phytochem-preview; ch1. Why do saponins foam? Predict which plant
   cleans better. (Safety: external use only.)
5. **Find the wash** — [desert_willow, blue_palo_verde]. reasoning:
   [spatial_reasoning, pattern_recognition]; Observe→Predict; bio:
   ecology; eng: navigation; ch1. Read indicator plants to predict where
   water flows.
6. **Strong but heavy** — [desert_ironwood, blue_palo_verde]. reasoning:
   [optimization, estimation]; Predict; bio: ecology; eng: materials;
   ch1. UTM-test ironwood vs palo verde; predict the density/strength
   tradeoff before choosing a tool wood. (Seeds Ch6 strength-to-weight.)
7. **Pretty can be toxic** — [desert_marigold]. reasoning:[causal,
   logical_deduction]; Observe→Explain; bio: ecology/pharmacology-preview;
   ch1. Observe livestock avoidance → explain dose-response (safety
   lesson, observe-only).
8. **The moth and the yucca** — [banana_yucca]. reasoning:
   [systems_thinking, causal]; Explain→Predict; bio: ecology; ch1.
   Discover the obligate mutualism; predict what happens to one if the
   other disappears. (Seeds Ch7 systems thinking.)
9. **Make a dye** — [engelmann_prickly_pear]. reasoning:[experimental_
   design, causal]; Explain→Engineer; bio: ethnobotany/phytochem-preview;
   ch1. Extract betalain from tunas; test on fiber; predict colorfastness.
10. **Waterproof it** — [ocotillo, creosote_bush]. reasoning:[causal,
    experimental_design]; Explain→Predict; bio: ethnobotany; eng:
    materials; ch1. Why does stem wax/resin shed water? (Explicitly seeds
    Ch5 boat waterproofing.)

## 5. Path to 100 Chapter-1 quests

Generate in batches by **(reasoning domain × hierarchy level × dataset
entity)**, ensuring per the rules:
- Arizona-floor coverage across all required quests before adding
  enrichment.
- Predict-and-above is the majority; pure-Observe quests always point to
  a later Explain/Predict quest on the same entity (no dead-end facts).
- Each quest links ≥1 dataset entity and ≥1 instrument.
- Balance the eight reasoning domains across the set.
Batches: (a) plant-use quests [~30], (b) ecology/food-web quests once the
animal/insect manifest lands [~25], (c) construction/material quests
[~20], (d) chemistry/extraction previews [~15], (e) navigation/map [~10].
Each batch is authored as `data/quests/chapter1.<batch>.js`, tagged via
`reasoning-substrate.tagQuest`, then coverage-reported.
