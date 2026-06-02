# Phase 1.9 — Player Reachability Sprint

**Highest-priority correction** (before any Phase-2 world expansion). The QA
audit proved a gap the milestones/governance/acceptance all missed:
**Implemented + Accepted ≠ Player Reachable.** Full evidence:
`artifacts/qa_audit/player_reachability_audit.md`.

Goal: convert Implemented/Accepted → **Player Reachable** — a real player performs
Observe → Predict → Test → Build → Verify via keyboard/mouse/UI, **no debug API**.

## 1.9.1 — Reachability gateway (this slice, DONE)
**Issue 1 (CRITICAL): the Phase-1 build was orphaned.** Home's Play card went to
`/play` (Godot); `/game-rebuild` was linked from no player-facing surface.

- Fix: `HomePage.jsx` Play card → **`/game-rebuild`** (the canonical Act-1
  build), title "Play BikeBrowser — Act 1". The Godot `/play` route remains for
  the prototype but is no longer the primary Play CTA.
- **Player-reachable acceptance** (the new standard): new spec
  `tests/e2e/game-rebuild.player-reachability.spec.js` drives a **real mouse
  click** on the Home Play card and asserts it lands on `/game-rebuild` (not
  `/play`) with `__bikebrowserRebuildReady` and the canvas visible. **No
  `__GAME__` for the action.** GREEN (1 passed, 1.9s).
- `npm run build`: ✓.

## Remaining 1.9 slices (planned, next cycles)
- **1.9.2 Predict-before-test UI (arc.md compliance):** an in-scene prediction
  prompt (will it hold? + confidence) that **gates** the UTM — intervention
  requires a prediction first. Player-reachable acceptance via key presses.
- **1.9.3 Bridge design UI:** choose a material per role, see the consequence,
  iterate — via UI, no `designBridge` debug call.
- **1.9.4 Investigation UI:** observe → choose hypothesis → gather evidence →
  conclude — in gameplay.
- Each adds player-reachable (keyboard/mouse) acceptance and flips the system's
  **Player Reachable** status to ✅ only when proven by real input.

## New tracked status: Player Reachable
The alignment dashboard now carries a **Player Reachable (PR)** status, distinct
from Implemented/Wired/Playable/Accepted. Honest current state:
- Gateway (Home → canonical game): **✅ reachable** (1.9.1).
- UTM / predict / bridge design / investigation: **❌ not yet player-reachable**
  (engine works; UI exposure is 1.9.2–1.9.4).

## Definition of done (sprint)
A real player can complete Observe → Predict → Test → Build → Verify through the
UI with no `__GAME__` calls, prediction gates intervention (arc.md), and
player-reachable specs prove each. Only then does Phase 2 resume.

## Note on the QA specs
The headless `__GAME__`-driven assertions are **kept** — they validate the engine
(unit-level). They are now complemented by **player-reachable** specs that drive
real inputs. Engine specs + player specs together = both "the logic is right" and
"the player can reach it."
