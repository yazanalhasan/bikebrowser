# world-path-renderer — code landed, receipt missing

**Timestamp:** 2026-04-25T23:15:00Z
**Session dispatch_count at incident:** 34 (cumulative)
**Sibling worker (parallel batch):** world-landmarks — completed cleanly with receipt

## What happened

world-path-renderer was dispatched in parallel with world-landmarks.
Per the agent run summary, the worker stalled at max_turns (22) while
trying to run a syntax check (`acorn` / `node --check`) AFTER its
edits were already on disk. Final tool message before timeout:

> "Let me do a proper syntax check with acorn or just use node --check"

It never produced a receipt at
`.claude/swarm/receipts/world-path-renderer-2026-04-25T23-00-00Z.json`.

## What's on disk (verified via git diff HEAD)

`src/renderer/game/scenes/WorldMapScene.js`:

1. Import line extended: `hash2` added to existing `terrainNoise.js` import.
2. `_renderPathLayer({...})` call inserted in `create()` at lines ~156-167.
3. The old straight-line path block (`line.lineBetween(centerX, centerY, x, y)`)
   was removed; its `homeX`/`homeY` declarations were lifted above the
   `_renderPathLayer` call so both path code and home-marker code can
   reference them.
4. New method `_renderPathLayer({...})` (~143 lines) inserted between
   `_selectLocation` (the previous method-end before terrain) and
   `_renderTerrainLayer`. Implements:
   - Quadratic bezier with deterministic perpendicular sign via
     `hash2(0x9a7b, seedA, seedB)` where seeds are sum-of-charCodes of
     the two endpoint ids.
   - Biome-keyed stroke style: DESERT 0xA08250 alpha 0.6 width 2,
     GRASSLAND 0x6E5A32 alpha 0.65 width 2, MOUNTAIN 0x3C3228 alpha 0.75
     width 3, default 0x786446 alpha 0.6 width 2. Locked nodes
     darkened to 35% alpha.
   - WATER endpoint check: skipped per spec (TODO ferry mechanic).
   - 20-step approximation of the bezier via `lineTo` segments.
   - Container `_pathContainer` at depth -50 (above terrain at -100,
     below nodes).

Landmarks's receipt (which landed cleanly) explicitly documents:

> "Path-renderer agent edits were fully merged (bezier paths,
> _renderPathLayer method, hash2 import) before landmark layer was
> added. No collision occurred."

## Why this is a blocker per protocol

Orchestrator step 6: "If no receipt: mark the run failed, log to
.claude/swarm/blockers/, do NOT move X to completed. Skip the review
step."

Hard rule: "Never dispatch the same agent twice in a single session
unless explicitly asked."

So although the code is on disk, the protocol gate requires a receipt
before the reviewer can run. landmarks is review-ready but is in the
same file as path-renderer's unattested code — reviewing one without
the other invites mis-attribution.

## Options for the user

A. **Salvage re-dispatch** — explicitly ask me to re-dispatch
   `world-path-renderer` with a tight scope: "your code is already on
   disk, your only task is to write the receipt at
   `.claude/swarm/receipts/world-path-renderer-2026-04-25T23-00-00Z.json`
   summarizing what's there." This is the lowest-friction path. ~1 turn.

B. **Manual synthesized receipt** — I write a receipt myself based on
   the diff and landmarks's confirmation. Off-spec (workers should
   write their own receipts), but unblocks immediately. The orchestrator
   never edits code, but a receipt is an orchestration artifact, not
   code.

C. **Roll back and re-do** — `git checkout HEAD -- WorldMapScene.js`
   loses both workers' code, then re-dispatch path-renderer fresh
   with stricter "no validation tools, just write code + receipt"
   instructions. Highest cost — also blows up landmarks's clean run.

D. **Re-dispatch via general-purpose** — bypass the "twice" rule by
   routing through general-purpose agent shell with the
   world-path-renderer spec and the existing-code-context embedded.
   Pattern from prior session per saved memory.

## Recommendation

Option A or B. A is technically correct; B is faster. Both let
landmarks's review proceed in the same step.
