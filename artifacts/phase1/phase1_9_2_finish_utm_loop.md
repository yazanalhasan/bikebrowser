# Phase 1.9.2A–C — Finish the UTM loop (Reachable → Understandable → Fun)

Make the predict-before-test loop not just reachable but **understandable and
fun**: the player SEES the outcome, the loop always finishes and closes, and
every result belongs to the action that made it.

## 1.9.2A — See bend / hold / break (not just text)
The result is now **visual**, driven by the material's test verdict:
- **strong candidate → HOLD:** the beam stays straight + green; the load drops
  and it holds (✅ it HELD).
- **useful with limits → BEND:** the beam tilts/sags amber but holds (🟡 it BENT,
  but held).
- **comparison failure → BREAK:** the straight beam hides and **snaps into a
  broken red V** (💥 it SNAPPED).
A load weight drops onto the beam each test. The text now *labels* what the
player already saw, plus a one-line `material: verdict` explanation.

## 1.9.2B — Exit flow (never trapped)
- After the last material, a **summary** appears: `N held · M snapped · you
  guessed K/N right` + a takeaway, then **E to close**.
- **Esc exits at any phase** (choose/result/summary) and releases the modal — the
  player can always leave.
- On close the overlay hides and `modalActive` is cleared (player + world
  interactive again).

## 1.9.2C — Feedback integrity
- Each result is rendered fresh per material: the beam/weight/colors reset in
  `_showChoose`, and the result names **this** material + **its** verdict — no
  stale carryover from the previous test.
- `window.__PREDICTION__` carries `materialId`, `outcome`, and the per-material
  `results[]` so a result can always be traced to its action.

## Changes
- Rewrote `PredictionScene.js`: deforming beam (straight/tilt/broken-V) + load
  weight; `summary` phase; `Escape` exit; per-material reset; richer
  `__PREDICTION__` mirror (`phase` now: choose | result | summary | idle).
- Specs advance through the new `summary` phase and close it; the reachability
  spec adds an **Escape-exits** test (never trapped).

## Dual acceptance
- **Engine:** main walkthrough drives the overlay through choose→result→summary→
  close via real keyboard; gating assertion intact. GREEN.
- **Player Reachability (primary):** keyboard-only predict + summary close +
  Escape-exit. GREEN. Screenshots: `01_predict_choose`, `02_predict_result`,
  `03_predict_summary`.

## Fun (new dashboard metric)
Not subjective scoring — **does the player get choice → consequence → payoff via
the UI?** For predict-before-test: **choice** (HOLD/BREAK + how-sure),
**consequence** (beam holds/bends/breaks before their eyes), **payoff** (visual
verdict + run summary + reasoning credit). → **Fun ✅.**

## Status
UTM loop is now **Reachable + Understandable + Fun**. Next: 1.9.3 Bridge Design
UI (same dual-acceptance + Fun bar), then 1.9.4 Investigation UI. Phase 2 paused.
