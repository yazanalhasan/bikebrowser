# Phase 1.9.3 — Bridge Design UI (player-reachable, fun)

The highest-value remaining mechanic, now a player action: the player **assigns a
tested material to each role**, **builds**, and **sees the bridge hold or fail** —
then iterates. Choice → consequence → payoff, all via keyboard (no `designBridge`
debug call).

## What a real player does
Walk to the bridge workbench → press **E** → the design overlay opens:
- **DECK → SUPPORTS → BRACE**, one role at a time. **◀ ▶** cycles the player's
  **tested** materials; each card shows the evidence they gathered ("test: held
  the load" / "test: snapped"). **E** chooses the material for that role.
- After all three, the bridge **builds** and the player **sees** it:
  - all bridge-safe → the bridge **holds** (green, steady) — "✅ The bridge holds!"
  - a weak part → that part **fails on screen** (red, sags/breaks) — "💥 The
    support failed — …" → **E to redesign** (iterate with the lesson).
- **Esc exits** any time — never trapped.

## Changes
- **New** `src/game/phaser/scenes/BridgeDesignScene.js` — role-by-role material
  chooser + a built-bridge visual (deck/supports/brace) that holds or fails;
  `window.__BRIDGE_DESIGN__` mirror; modal guard; Esc-exit.
- Registered in `createGame.js` + launched in `PreloadScene.js`.
- `NeighborhoodScene` — pressing **E at the bridge workbench emits
  `bridgeDesign:start`** instead of auto-completing a plan. (`designBridge`
  remains on the `__GAME__` engine path.)

## Dual acceptance
- **Engine** — the main walkthrough's bridge step now **drives the overlay via
  real keyboard**: a flawed design (weak-scrap support) fails on screen, the
  player iterates to a sound design that holds and creates the plan. The old
  `__GAME__.designBridge` injection + `bridgeChoice` assertions were removed.
- **Player Reachability (primary)** —
  `game-rebuild.bridge-reachability.spec.js`: walk to the workbench, design with
  keyboard only; the weak design fails (`outcome != safe`), the sound design is
  `safe` and sets the plan; plus an **Escape-exit** test (never trapped).

## Fun (dashboard)
- **choice:** a material per role, from the player's own test evidence.
- **consequence:** the bridge visibly holds or the weak part snaps.
- **payoff:** a holding bridge + the plan unlocks repair/cross; a fail teaches
  which part and why, and invites a better design. → **Fun ✅.**

## Status
Bridge design: **Player Reachable ✅ + Fun ✅** (dual acceptance). Remaining:
1.9.4 Investigation UI. Phase 2 stays paused until it is player-reachable too.
