# Acceptance Stabilization Report (Path A)

**Status: RESOLVED — 3/3 consecutive PASS.** No assertions removed, no steps
skipped, no coverage reduced, no failures bypassed. Navigation determinism
only.

## Root cause
The acceptance walkthrough's `walkTo(target)` helper
(`tests/e2e/game-rebuild.act1-acceptance.spec.js`) had a **24–28px dead
band**:
- It **moved** only when `Math.abs(dx) > 28`.
- It **arrived** only when `Math.hypot(dx,dy) < 24` (or the target zone was
  the *nearest* interaction).

When two interaction zones are closely spaced, the player could settle in
that 24–28px band where it **neither moves nor arrives**, and a nearby NPC
zone stayed "nearest". Runtime-confirmed coordinates (via a live diagnostic
eval of `scene.interactions.zones`):
- bike zone `bike_check` at **(470, 432)** (matches the test target).
- neighbor `Ask Mrs. Ramirez` at **(420, 438)** — only ~50px away.
- Player stalled at **(442, 429)**: `dx=28` to the bike (exactly in the dead
  band), and ~24px from the neighbor → `nearest()` returned `neighbor`, so
  `activeInteraction !== 'bike_check'` and `hypot=28 ≥ 24`. Deadlock → 120-
  iteration guard → throw "Could not walk to bike … active neighbor".

Confirmed **deterministic, not flaky** (2/2 identical failures before fix).

## Fix
In `walkTo` only: introduce `ARRIVE=24` and `STEP=6` with `STEP < ARRIVE`
so there is no dead band, plus finer nudges near the target
(`min(220, max(45, |d|*2.0))`) and a larger iteration guard (200). The
arrival condition, the `activeInteraction===id` check, the per-step
`waitFor` state assertions, and the **final-state assertions are unchanged**
(act1Complete, bridgeReconnected, widerMapUnlocked, notebook entries,
materialTestCount≥4, "Wider map unlocked"). This is a navigation-robustness
fix; it does not touch gameplay or the scene.

Commit: `84a3766` "fix(acceptance): deterministic walk navigation".

## Before / After
| | Before | After |
|---|---|---|
| walkTo move threshold | `|d| > 28` | `|d| > 6` |
| Dead band | 24–28px (stall) | none |
| Min nudge | 90ms | 45ms |
| Guard iterations | 120 | 200 |
| Assertions | (unchanged) | (unchanged) |
| Pass rate | **0/2** | **3/3** |

## Pass rate
- Run 1: PASS (1.5m). Run 2: PASS (1.6m). Run 3: PASS (1.5m). **3/3.**
- Brain acceptance audit (`run_act1_acceptance_audit`): **PASS**, fresh,
  all scored dimensions ≥ 82.

The acceptance gate is GREEN and reliable. Phase-1 work may now be
attributed cleanly.
