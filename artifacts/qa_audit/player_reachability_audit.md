# Player Reachability Audit

A QA finding the implementation milestones, governance, and acceptance suite all
**missed**: **Implemented + Accepted ≠ Player Reachable.** Verified by code, not
assumption. This is the project's current bottleneck.

## The core distinction
The Phase-1 acceptance suite proved the *systems* work by driving
`window.__GAME__` directly. That confirms the logic is correct — but it does
**not** prove a real player (keyboard/mouse/UI) can reach those systems. They
can't, today.

## Finding 1 — the Phase-1 build is orphaned (CRITICAL)
- `src/renderer/pages/HomePage.jsx:24-30,185-186`: the "Play BikeBrowserWorld"
  card navigates to **`/play`** → `GodotPrototypePage` (a different, Godot build).
- `/game-rebuild` (the Phase-1 work, `GameRebuildPage`) is referenced **only** in
  `App.jsx` (route def), `AppLayout.jsx` (nav-container allowlist), and
  `uxSafety.js` (UX rules). **No player-facing link/CTA points to it.**
- ⇒ A player who clicks Play never reaches any Phase-1 work. **Player ≠ Phase-1.**

## Finding 2 — the deepest systems are acceptance-only (CRITICAL)
- `predictMaterial`, `designBridge`, `observeMystery`, `hypothesizeMystery`,
  `investigateMystery`, `concludeMystery` exist in `Act1RuntimeSystem` and are
  exposed on the `__GAME__` debug API — but a repo-wide grep of
  `src/game/phaser/scenes/**` finds **zero** scene/UI call sites.
- The only player interaction is `NeighborhoodScene.js:1146`
  `runtime.handleInteraction(nearest.action)` (walk-up-press-E). The `utm`
  action **batch-tests all four materials at once** with **no prediction**, and
  there is no UI to predict, to choose bridge materials, or to investigate.
- ⇒ The strongest educational systems are **not exposed to the player.**

## Finding 3 — arc.md is violated in play (HIGH)
- Canon (`arc.md`): **"Prediction precedes intervention"** (a halt-and-surface
  rule). The five levels are Observe → Explain → Predict → Engineer → Teach.
- Runtime reality: the player can run the UTM and repair the bridge **without
  ever predicting**. Intervention is allowed without prediction — the opposite of
  the designed model.

## Why acceptance passed anyway
The acceptance spec injects predictions/designs/investigations via
`__GAME__.predictMaterial(...)`, `designBridge(...)`, `observeMystery(...)` in
`before`/inline `page.evaluate` blocks, then asserts state. That validates the
*engine*, not *player access*. "Playable ✅ / Accepted ✅" in the alignment
dashboard reflected **headless API acceptance**, not player-reachable experience.

## Corrective standard (adopted)
1. **Player Reachable** becomes a tracked status (new dashboard column), distinct
   from Implemented/Wired/Playable/Accepted. A system is Player-Reachable only if
   a real player can perform it via **keyboard/mouse/UI**, no `__GAME__`.
2. **Player-reachable acceptance**: new specs drive **real inputs** (navigation
   clicks, key presses) — never `__GAME__` for the action under test.
3. **arc.md enforcement**: prediction must gate intervention (test/build) in play.

## Phase 1.9 plan (this sprint)
- 1.9.1 **Reachability gateway** — Home → canonical `/game-rebuild`; player-
  reachable navigation acceptance. *(this slice)*
- 1.9.2 **Predict-before-test UI** — in-scene prediction (will it hold? +
  confidence) that **gates** the UTM (arc.md compliance).
- 1.9.3 **Bridge design UI** — choose materials per role, see consequence, iterate.
- 1.9.4 **Investigation UI** — observe → choose hypothesis → gather evidence →
  conclude, in gameplay.
- Each with player-reachable (keyboard/mouse) acceptance.

## Acknowledgement
The engine work (Phase 1.1–1.8) is sound; this audit does not undo it. It
identifies the true gap — **player access to the engine** — and makes it the
highest priority before any Phase-2 world expansion.
