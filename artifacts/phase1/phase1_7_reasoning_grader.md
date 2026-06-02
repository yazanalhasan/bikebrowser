# Phase 1.7 — Reasoning Grader (a learning system, not a score calculator)

Grade **how** the player reasoned, not whether they were lucky. Evidence usage
and correction-after-failure are weighted above raw correctness, and every grade
ships with teaching feedback (why right, why wrong, how to improve).

## Five dimensions (per the directive)
1. **Prediction quality** — did the player commit a hypothesis before testing?
2. **Evidence usage** — did they test candidates rather than guess?
3. **Correction after failure** — after a wrong prediction, did they avoid
   trusting the failed material? (the core learning signal)
4. **Confidence calibration** — did high confidence track being right?
5. **Explanation quality** — did they say WHY (testable reasoning)?

Weights: `0.2 prediction + 0.3 evidence + 0.3 correction + 0.1 calibration +
0.1 explanation`. Band: ≥0.75 strong · ≥0.5 solid · else developing.

## The design property (proven)
- **Good:** wrong prediction + high confidence + real test + belief updated →
  **strong** (the acceptance scenario: weak_scrap predicted safe, tested, found
  unsafe, then NOT used in the bridge → band `strong`, 0.97).
- **Bad:** lucky guess + no evidence + no explanation → **developing** (low
  evidence/correction/explanation collapse the grade even if the guess was
  "right"). Correctness alone is not rewarded.

## Changes (one scoped slice)
1. **New** `src/game/phaser/systems/ReasoningGrader.js` — `assess(context)`
   returns per-dimension scores, an overall + band, and `learnings` (teaching
   strings), plus `rewardsReasoningNotCorrectness: true`.
2. `PredictionSystem.record` + `Act1RuntimeSystem.predictMaterial` — optional
   `explanation` captured (the "why").
3. `Act1RuntimeSystem.assessReasoning()` aggregates predictions + tests + bridge
   plan; added to `getAct1State().reasoning` and the `__GAME__` API.
4. `acceptance spec` — predictions now carry explanations; **asserts** the
   learning-system behavior: evidence=1, correction=1, band ≠ developing,
   learnings present, `rewardsReasoningNotCorrectness`, AND that the weak_scrap
   prediction was **wrong** yet the grade is still strong. Coverage strengthened.

## Validation
- `npm run build`: ✓ (8.2s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.7m)**.
- Reasoning (live): `band: strong, overall: 0.97`, dims `{prediction:1,
  evidence:1, correction:1, calibration:0.67, explanation:1}`, 3 learnings.
- Console errors: none.

## Result — the player learns why
The grade is feedback, not a verdict: it names what the player did well
(predicted, tested, corrected), what evidence overturned a belief, and how to
improve (explain your reasoning; test every candidate). A wrong-but-corrected
hypothesis is celebrated; a lucky evidence-free guess is not.

## Next
Phase 1.8 — Dry Wash region, emphasizing **observation → hypothesis →
investigation** (a reasoning loop in a new place), not merely a new map area.
Then arc_alignment_report.md updated.
