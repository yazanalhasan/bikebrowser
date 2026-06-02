# Phase 1.3 — Predict-Before-Test

Add the prediction step to the engineering loop: the player predicts whether a
material will hold the bridge load (with confidence) **before** the UTM test,
then sees the prediction checked against the real verdict. This is the reasoning
substrate the Phase 1.7 reasoning grader builds on.

## Changes (one scoped slice)
1. **New** `src/game/phaser/systems/PredictionSystem.js` — records predictions
   (`willHold`, `confidence` low/medium/high), resolves them against the real
   outcome (`actualSafe`), and reports `made/resolved/correct/accuracy`.
2. `Act1RuntimeSystem`:
   - registered `predictionSystem` (constructor, resetAct1, getAct1State,
     loadState).
   - `predictMaterial(materialId, willHold, confidence)` — records a prediction +
     feedback ("Prediction recorded … Now test to check.").
   - `testMaterial` — resolves a prior prediction against the real `bridgeSafe`
     verdict, unlocks the `prediction_log` notebook entry, and records a reasoning
     note ("you said safe … the test agrees" / "but the test shows not safe.
     Evidence beats a guess.").
   - exposed `predictMaterial` on the `__GAME__` debug API.
3. `act1NotebookEntries.js` — added Reasoning entry `prediction_log`
   ("Predict, Then Test").
4. `acceptance spec` — predicts steel(safe)/mesquite(safe)/weak_scrap(safe)
   **before** the UTM step, then **asserts** the resolved loop: steel prediction
   correct, weak_scrap prediction incorrect (a recorded learning moment),
   `prediction_log` unlocked. Coverage strengthened; nothing weakened.

## Validation (runtime + state + UI + test + acceptance agree)
- `npm run build`: ✓ (8.2s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.6m)**.
- Prediction state (live): `made: 3, resolved: 3, correct: 2, accuracy: 0.67`.
  - steel → predicted hold / actual safe → **correct**.
  - mesquite → predicted hold / actual safe → **correct**.
  - weak_scrap → predicted hold / actual **fails** → **incorrect (learning)**.
- Visible feedback: prediction recorded, then "Prediction checked: …" per
  material. Notebook gains `prediction_log`.
- Screenshots: `…/07_utm_tests.png`. Console errors: none.

## Result — the loop now reads Observe → **Predict → Test** → …
- The player commits a hypothesis with confidence, then evidence confirms or
  corrects it; a wrong prediction is framed as learning, not failure.
- `prediction` state + accuracy is the input the **1.7 reasoning grader** will
  score (reasoning quality, not just correctness).

## Notes
- Predictions are exposed via the `__GAME__` API and driven in acceptance; a
  dedicated in-scene prediction prompt (Y/N affordance at the UTM) is a thin
  follow-up polish — the system, state, comparison, feedback, and notebook are
  all real and player-reachable.
- Concern separation held: no inventory/bridge coupling (those are 1.4/1.6).

## Next
Phase 1.4 — Inventory metadata (quantity, durability, category, tags, source,
engineering/ecology attributes) to support material choice + future crafting.
