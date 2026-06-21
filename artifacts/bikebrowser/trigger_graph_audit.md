# Trigger-Graph Audit (Executive Brain)

Finding code that is **wired but never fired** — the class of bug behind
`loadTest:done` (emitted, no listener → a built bridge never got placed over the
wash). Reusable script: `scripts/audit/trigger_graph.mjs`
(`npm run audit:triggers`, `npm run audit:triggers:strict` for a CI gate).

## Method — four lenses
1. **Event graph** — `registry.events.emit('X')` vs `registry.events.on/once('X')`
   (tolerates optional chaining `registry?.events?.emit`). Flags **orphan emits**
   (no listener) and **dead listeners** (no emitter).
2. **Action coverage** — interaction `action:'X'` registrations (+ inline
   `nearest.action==='X'` scene branches) vs `handleInteraction` handler keys.
   Flags **unhandled actions** and **handlers nothing routes to**.
3. **Dead private methods** — `_private(` defined but never referenced as `.private`.
4. **Condition-gate reachability** (reasoning, not pure grep) — handlers gated by a
   state only that same handler sets, or registered actions a scene intercepts
   before the handler runs.

An **allowlist** marks reviewed/benign items so `--strict` fails only on NEW ones.

## Results (live game, `src/game`, 74 files, 21 event types)

### 🔴 Confirmed real gap — FIXED this session
- **`loadTest:done`** — emitted by `LoadTestScene`, **no listener**. A successful
  build emitted it into the void, so the bridge was never placed over the wash.
  Fixed (commit `36b8278`): `NeighborhoodScene` now listens → `repairBridge()` +
  Community Crossing. The audit confirms it is no longer an orphan.

### 🟠 Benign orphans (reviewed — unused hooks, no functional break; allowlisted)
- **Six `:done` completion events** — `biome:done`, `ecology:done`,
  `investigation:done`, `prediction:done`, `bridgeDesign:done`, `crossing:done`.
  Each scene applies its own effects and emits `quest:changed` (which **is**
  listened), so these are fire-and-forget pings. Safe to leave; available as hooks
  if a future feature wants to react to a specific completion.
- **`reward:quest`** — emitted on a quest-reward grant for a special celebratory
  flourish that was never wired. The reward still applies via `zuzubucks:changed`
  (HUD) + `recordFeedback`. *Optional enhancement:* wire it to a one-off quest-reward
  animation/sound if desired; otherwise harmless.

### 🟡 Dead listener (reviewed — unused path; allowlisted)
- **`dialogue:advance`** — `DialogueScene` listens, but nothing emits it. Advancing
  dialogue is keyboard/pointer-driven. Dead wiring; safe to remove or leave.

### 🟠 Superseded / debug-only handlers (reasoning lens)
- **`spanish_neighbor`** (flagged by the script) — runtime handler with no
  registration/branch; the `neighbor` dialogue routing supersedes it. Debug-only.
- **`utm`, `bridge_plan`** (manual finding; the script can't see this) — these *are*
  registered actions, but `NeighborhoodScene` intercepts them and routes to the
  richer flows (`prediction:start`, `bridgeDesign:start`) **without** calling
  `handleInteraction`. So the runtime `utm` (batch-test-all) and `bridge_plan`
  (auto-plan) handlers are **dead in the player path** — used only by debug/e2e.
  Not bugs, but a future edit to them would silently not affect players.

### Clean
- Registered actions with no handler: **0**.
- Dead private methods (2-space-indented `_` helpers): **0**.

## Severity summary
| Item | Severity | Status |
|---|---|---|
| `loadTest:done` no listener | 🔴 real bug | **FIXED** (36b8278) |
| 6 `:done` orphan emits | 🟠 unused hooks | allowlisted (benign) |
| `reward:quest` orphan | 🟠 unused flourish hook | allowlisted; optional wire-up |
| `dialogue:advance` dead listener | 🟡 dead wiring | allowlisted |
| `spanish_neighbor` / `utm` / `bridge_plan` handlers | 🟠 debug-only/superseded | documented |

**Net: one real defect (fixed), the rest benign/known.** The codebase is otherwise
clean of orphaned actions and dead private methods.

## Known limitations (so findings aren't over-trusted)
- Static only: it can't see "registered-but-intercepted" actions (the `utm`/
  `bridge_plan` case) or chicken-and-egg condition gates — those need the reasoning
  lens, or a **dynamic probe** (drive each system to its `:done` and assert state
  advanced), which is the recommended next addition.
- Dead-method heuristic checks 2-space-indented `_`-prefixed methods only.
- Scope is `registry.events`; intra-scene `this.events`/input handlers are excluded
  by design.

## How to keep it honest going forward
- `npm run audit:triggers:strict` in CI — fails on any NEW non-allowlisted orphan,
  so the next `loadTest:done` is caught at the diff, not in playtest.
- When intentionally adding a fire-and-forget event, add it to the allowlist with a
  one-line "reviewed" note (the script enforces this discipline).
