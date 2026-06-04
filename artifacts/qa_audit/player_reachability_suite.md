# Player-Reachability Suite — SOURCE OF TRUTH

Canonical doc for BikeBrowser's acceptance strategy. Co-located with the suite
(`tests/e2e/player-reachability.suite.spec.js`) and CI
(`.github/workflows/acceptance.yml`). Keep this updated on every promotion.

> A feature is **not complete** unless **Implemented + Accepted (engine) +
> Player Reachable** are all true.

---

## Three-layer acceptance

| # | Layer | Question | Drives | Blocking? | Entry point |
|---|---|---|---|---|---|
| 1 | **Engine Acceptance** | Is the logic correct? | `window.__GAME__` / quest system | **YES** | `npm run accept:engine` |
| 2 | **Player Reachability** | Can a real player *access* it? | real keyboard + mouse input | **YES** | `npm run accept:reachability` |
| 3 | **Payoff (future)** | Does it *feel rewarding*? | choice → visible consequence → reward | informational | `npm run accept:payoff` |

`npm run accept` runs all three in order. Layers 1+2 are the completeness gate;
layer 3 is a non-blocking placeholder until payoff is crisply assertable.

CI runs all three on push/PR (`.github/workflows/acceptance.yml`). Engine and
Reachability are required checks; Payoff is informational.

---

## The reachability suite convention (three tiers)

- **`test(...)` GUARD** — a capability that must stay reachable. Green normally;
  **RED on regression** (e.g. the build gets re-orphaned, a modal becomes a trap).
- **`test.fail(...)` WORKLIST** — a known gap. Runs, expected to FAIL today, so the
  suite stays green. When the left tab fixes it Playwright reports **"expected to
  fail, but passed"** (an UNEXPECTED PASS → the job goes RED).
- **`test.fixme(...)`** — a gap not yet crisply assertable (tracked, not run).

### Promotion protocol (REQUIRED)
When a WORKLIST test **unexpectedly passes**:
1. **Report it immediately.**
2. **Verify it's a real fix, not a false positive** — assertions must require the
   player to actually *reach* the feature AND a real player-facing signal to flip
   (never a null-satisfiable check). Confirm against the running build.
3. **Promote** `test.fail(...)` → `test(...)` GUARD, add a `// PROMOTED <date>:`
   note, and log it below.
4. Re-run; confirm the suite is green again.

---

## Current status (updated 2026-06-02)

GREEN. 3 guards pass · 3 worklist expected-fail · 1 payoff fixme. Runtime ~1.3 min.

| Test | Tier | Finding | State |
|---|---|---|---|
| GUARD: Home "Play" reaches build | guard ✅ | Orphaned build | reachable (1.9.1) |
| GUARD: UTM exposes predict choice | guard ✅ | Predict UI | reachable (1.9.2) |
| GUARD: UTM loop can be exited | guard ✅ | Input trap / no exit | **PROMOTED** (1.9.2A-C) |
| GUARD: bridge designed by hand | guard ✅ | `bridge_plan` pre-baked | **PROMOTED** (1.9.3) |
| GUARD: investigation run by hand | guard ✅ | `dry_wash` only mapped | **PROMOTED** (1.9.4) |
| WORKLIST: no shadowed zones | `test.fail` | `spanish_neighbor` == `neighbor` (0px) | still failing |
| PAYOFF: visible load test | `test.fixme` | test was invisible | mostly addressed by 1.9.2A beam; assertion TBD |

Status: GREEN — **5 guards** pass · 1 worklist (shadowed zone) · 1 payoff fixme.

### Promotion log
- **2026-06-02 — "bridge designed by hand" + "investigation run by hand"** WORKLIST → GUARD.
  Wired by the left tab (1.9.3 / 1.9.4): `bridge_plan` now opens `BridgeDesignScene`
  (`__BRIDGE_DESIGN__`), and a new `investigate_wash` zone opens `InvestigationScene`
  (`__INVESTIGATION__`). **Independently reconciled by player-only walkthrough**
  (`phase1-reconcile2.spec.js`, screenshots `…/reconcile2/`): from Home, keyboard-only,
  a player built a safe `player_designed` plan ("The bridge holds!") and concluded the
  Dry Wash mystery ("You changed your mind with the evidence", `correctedFromMisleading`).
  Earlier suite snapshots showed these failing — the build advanced after that run;
  **runtime truth wins.**
- **2026-06-02 — "UTM loop can be exited"** WORKLIST → GUARD. Fixed by commit
  `dbd5f93` (1.9.2A-C: Escape exit + summary + visible hold/bend/break beam).
  Detected as an unexpected pass after correcting the detector to read the real
  modal signal (`window.__PREDICTION__.active` / `modalActive`) instead of
  `scene.isActive()` (the overlay scene never stops).

### False-positive note (why assertions are strict)
Before promotion, the bridge and investigation worklist tests *appeared* to pass
because their assertions were null-satisfiable (e.g. `plan.id !== 'tested_triangle_plan'`
passes when the plan is null / the object was never reached). Verified against the
build: `bridge_plan` still calls `completeBridgePlan('tested_triangle_plan')` and
`dry_wash` still only maps — so those were **false positives, not fixes.** The
assertions are now strict: they require `walkTo(...)` to return reached AND a real
player-facing signal (`__BRIDGE_DESIGN__.active`; per-mystery `observed`/`concluded`).

### Real test hooks (DEV)
- `window.__GAME__` — Act1 runtime debug API (engine).
- `window.__bikebrowserRebuildGame` — the Phaser game (scenes, player, zones).
- `window.__PREDICTION__` — `{active, phase, materialId, results[]}` (UTM modal).
- `window.__BRIDGE_DESIGN__` — `{active, phase, role, candidateId, selection, outcome}` (bridge design modal).
- `window.__INVESTIGATION__` — `{active, phase, investigationId, hypothesisId, hypotheses[], evidenceShown, evidenceCount, correctedFromMisleading, conclusionText}` (Dry Wash investigation modal).

---

## Exploratory specs (evidence capture — keep)
`phase1-experience-explore` (route probe) · `phase1-playthrough` /
`phase1-engineering` (flow + feedback) · `phase1-play-route` (Home Play target) ·
`phase1-play-deep` (walk-to-every-object) · `phase1-utm-predict` (predict loop).
Screenshots/JSON under `artifacts/qa_audit/screenshots/`.

Full experience reviews live in the Executive Brain repo:
`executive-brain/artifacts/qa_audit/phase1_player_experience_review*.md`.
