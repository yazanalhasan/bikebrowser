# Phase 1.9.4 — Investigation UI (player-reachable)

**Goal (user):** The Dry Wash investigation — observe → hypothesize → gather
evidence → revise → conclude — must be performable through *real gameplay*
(keyboard/mouse/UI), not only via `window.__GAME__`. Same dual-acceptance
standard as 1.9.2/1.9.3, with the **Player Reachability** test as the primary
criterion. Must deliver **Fun = choice → consequence → payoff** through the UI.

This is the final milestone of the Phase 1.9 Player Reachability Sprint.

## What shipped

A player-facing `InvestigationScene` overlay (the same overlay-scene + modal-guard
pattern as `PredictionScene` and `BridgeDesignScene`):

- **Trigger (player-reachable):** a new "Investigate the washout" marker + zone
  in the Dry Wash area (`investigate_wash` at 1130,700; >24px from every
  neighbouring zone, so it never shadows ecology/bridge navigation). Walk up,
  press **E** → the investigation opens. Previously the loop was only callable
  via `__GAME__.observeMystery/...`.
- **Observe:** the mystery title + observation are shown ("You notice: the old
  footings are exposed and the gravel is scooped into a hollow").
- **Hypothesize (the choice):** two explanations as cards; **▲▼** to choose,
  **E** to commit. The misleading one is *not* marked — the player can be wrong.
- **Investigate (the consequence, made visible):** evidence is revealed one clue
  at a time (**E** for the next clue). If a clue contradicts the player's chosen
  hypothesis, that card **turns red and shakes** with a "✗ doesn't fit" tag —
  the player *sees* their guess fail, rather than reading a verdict.
- **Conclude (the payoff):** the better explanation is shown. If the player had
  picked the misleading hypothesis, the headline is **"You changed your mind
  with the evidence"** — being wrong-then-corrected is rewarded, mirroring the
  reasoning grader, not penalised. Notebook entry recorded.
- **Summary + exit:** "Mystery solved · +1 notebook entry"; **E** closes. **Esc**
  exits from any phase — never trapped (`modalActive` released).

`window.__INVESTIGATION__` mirrors phase / hypothesisId / evidenceShown /
disprovesHypothesis / correctedFromMisleading / conclusionText so the
player-reachability spec can assert without performing the action via debug API.

The investigation drives the *real* runtime (`observeMystery` →
`hypothesizeMystery` → `investigateMystery` → `concludeMystery`); the overlay is
pure presentation over the existing `InvestigationSystem`, so the player path and
the engine path exercise the same logic.

## Dual acceptance — both GREEN

| Layer | Spec | Result |
|---|---|---|
| **Player Reachability (primary)** | `game-rebuild.investigation-reachability.spec.js` | **2 passed (1.0m)** — real player walks to the marker, observes, picks the *misleading* hypothesis, gathers evidence that disproves it, concludes (corrected), closes; second test: Esc exits, never trapped |
| Engine Acceptance | `game-rebuild.act1-acceptance.spec.js` | GREEN — full Act 1 walkthrough still passes with the new zone present (investigation engine drive unchanged) |

The player-reachability test deliberately selects the **misleading** hypothesis
(`weak_materials`) and asserts `disprovesHypothesis === true` and
`correctedFromMisleading === true` — i.e. it proves the loop *teaches*, not just
that it runs.

## Fun (objective: choice → consequence → payoff)

- **Choice:** the player picks one of two explanations (can be wrong).
- **Consequence:** evidence visibly contradicts a wrong guess on screen (red,
  shake, "doesn't fit").
- **Payoff:** the real explanation + "you changed your mind with the evidence" +
  notebook entry.

→ Investigation is now **Player Reachable ✅** and **Fun ✅**.

## Phase 1.9 sprint — complete

All four player-reachable systems are delivered: Predict (1.9.2 / 1.9.2A-C),
Bridge design (1.9.3), Investigation (1.9.4), on the Reachable → Understandable →
Fun priority order. Every player-facing system now has both an Engine and a
Player Reachability test, and prediction gates intervention (arc.md). Phase 2
(Ecology Loop / Discovery Registry / World Map), previously paused behind the
reachability gap, is now unblocked for reconsideration.
