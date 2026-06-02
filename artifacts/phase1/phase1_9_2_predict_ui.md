# Phase 1.9.2 — Predict-before-test UI (player-reachable, game-like)

Make prediction a **player action**, not a debug call — and make it **feel like
gameplay**, not homework. Pressing E at the UTM now opens a quick, visual
prediction overlay; the player picks, commits, tests, and compares in seconds.
This closes the arc.md violation: **prediction precedes intervention.**

## Game-like, not a form (per the directive)
- **Quick / obvious:** a big two-choice pick — **💪 WILL HOLD** vs **💥 WILL
  BREAK** — `← →` to choose (the chosen chip grows + glows). "How sure?" is three
  dots, `↑ ↓`. Then **E to test**.
- **Reversible:** change the pick/confidence freely before pressing E.
- **Visual compare:** on E, a load bar animates — **green holds** / **red snaps** —
  and a result row shows `✓/✗  you: 💪/💥   real: 💪 held / 💥 snapped` with a
  short verdict. The child sees *why* in a glance, no paragraph to read.
- Seconds per material; feels like a guess-and-check mini-game.

## Changes
1. **New** `src/game/phaser/scenes/PredictionScene.js` — the overlay + input
   state machine (choose → result), reversible, with a `window.__PREDICTION__`
   mirror so player-reachable specs can drive/assert via real keys.
2. Registered in `createGame.js` + launched in `PreloadScene.js`.
3. `NeighborhoodScene` — pressing **E at the UTM emits `prediction:start`**
   (with the collected materials) **instead of batch-testing**, so prediction
   gates testing. Added a **modal guard**: while the overlay is open the player
   is frozen and world interactions are ignored; the key that closes the overlay
   is consumed so it cannot re-trigger the UTM (the bug found + fixed this slice).
4. `Act1RuntimeSystem.handleInteraction('utm')` (batch) remains for the engine
   `__GAME__` path; the **player path** is the overlay.

## Player-reachable acceptance (the new standard)
The main Act-1 walkthrough's UTM step was **rewritten to drive the overlay with
real keyboard** (`ArrowLeft` pick, `ArrowUp` how-sure, `KeyE` test) for all four
materials — **no `__GAME__` predict injection**. It also asserts
`prediction.made ≥ materialTests.tested` (a prediction exists for every test —
arc.md compliance) and captures the prediction UI (`07a_prediction_choose.png`,
`07b_prediction_result.png`).

## Validation
- `npm run build`: ✓.
- Playwright `game-rebuild.act1-acceptance`: **GREEN (1 passed, 1.8m)** — the UTM
  is now completed entirely through the player-facing overlay via real keys.
- Recovery in practice: the first run failed (the close-key re-triggered the UTM,
  reopening the overlay and freezing the player). Root-caused, fixed with the
  modal close-key consume, passed on retry. No infinite retry.
- Reasoning/prediction assertions still hold (predictions now made via the
  overlay): steel correct, weak_scrap wrong→learning, reasoning band strong.

## Status
**Predict-before-test: Player Reachable ✅.** Prediction now gates testing in
play. Remaining reachability slices: 1.9.3 bridge design UI, 1.9.4 investigation
UI. Phase 2 stays paused until those are player-reachable too.
