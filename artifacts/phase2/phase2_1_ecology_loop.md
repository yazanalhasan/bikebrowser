# Phase 2.1 — Ecology Loop (observe → predict → outcome → payoff)

**Goal (owner):** apply the pattern that succeeded in Predict (1.9.2), Build
(1.9.3), and Investigate (1.9.4) to ecology, so the player **observes**,
**predicts**, sees the **outcome**, and receives a **payoff** through actual
gameplay. Hold it to **three** acceptance layers: Engine, Player Reachability,
and **Payoff**.

## What shipped

A player-facing `EcologyScene` overlay (same overlay-scene + modal-guard pattern
as Prediction/Bridge/Investigation), reached from a new **"Plant the desert"**
marker (`ecology_garden`, kept clear of the wash/ecology zones so it never
shadows them — the lesson from the spanish_neighbor fix):

- **Observe:** a desert site with its conditions ("a bare, sun-blasted bank at
  the wash edge — full sun · wash-edge soil · needs shade + deep roots").
- **Predict (the choice):** cycle the desert plants (◀▶) and plant one (E). The
  player can be wrong — the site does not reveal the answer.
- **Outcome (the consequence, on screen):** the plant **grows green and upright
  (thrives)** if it fits, or **wilts amber and droops (struggles)** if it does
  not — not just text.
- **Payoff:** the reason it fits, plus a **notebook field note**. A wrong pick
  still teaches — the result names the plant that actually fits and *why*
  (mirrors the reasoning grader: being corrected by reality is the lesson).
- **Summary + exit:** "N/N thrived on your first pick" + field notes; Esc exits
  any phase (never trapped).

Two placements ship (`wash_edge_shade` → mesquite; `open_dry_flat` → creosote),
each with a correct plant and targeted "why it fits / why yours didn't"
explanations. The overlay drives the real `EcologyObservationSystem`
(`observePlacement → predictPlacement → resolvePlacement`), so the player path
and the engine path share one code path. `window.__ECOLOGY__` mirrors
phase/option/outcome/payoff for the reachability + payoff specs.

## Three-layer acceptance — all GREEN

| Layer | Spec / gate | Result |
|---|---|---|
| **Engine Acceptance** | `game-rebuild.ecology-engine.spec.js` | 1 passed — gating (predict-before-observe rejected), right plant thrives, wrong plant struggles + names the fit, both notebook entries recorded |
| **Player Reachability** (primary) | `game-rebuild.ecology-reachability.spec.js` | 2 passed — real player walks to the marker, plants a wrong one (struggles) then a right one (thrives), notebook payoff verified; Esc exits, never trapped |
| **Payoff Acceptance** | strict-suite GUARD `a player runs the ecology loop by hand — outcome shown, payoff delivered` | passing — every site resolves to a visible outcome through keyboard play AND the plants reasoned about become notebook field notes |

Strict suite overall: **7 passed / 1 skipped** (the skip is the remaining
UTM-visualizer DOM-assertion `fixme`; the prediction beam animation already
exists). Zero expected-fails.

## Fun (objective: choice → consequence → payoff)

- **Choice:** which plant to put in this site (can be wrong).
- **Consequence:** it thrives (green, grows) or struggles (amber, wilts) on screen.
- **Payoff:** why that plant fits + a notebook field note.

→ Ecology is now **Player Reachable ✅** and **Fun ✅**.

## Notes / next

- The original `ecology_patch` (collect mesquite + observe 3 plants) is unchanged
  — it still serves the engineering flow and the engine walkthrough. The new loop
  is an additive, dedicated planting spot, so nothing regressed.
- This is the first system delivered under the full three-layer standard. The
  same bar applies to the remaining Phase 2 systems: **2.2 Discovery Registry,
  2.3 World Map, 2.4 Multi-Biome.**
