# RECOVERY EVENT — world-path-renderer

**Recovered by:** swarm-orchestrator
**Recovery timestamp:** 2026-04-25T23:25:00Z
**Original dispatch:** 2026-04-25T23:00:00Z
**Sibling worker:** world-landmarks (completed normally with own receipt)

## Why recovery was needed

`world-path-renderer` was dispatched as part of a parallel batch with
`world-landmarks`. Per the Agent tool's return summary, the worker
hit max_turns (22) while running a syntax-check tool AFTER its file
edits had already been applied to `src/renderer/game/scenes/WorldMapScene.js`.

The worker's last visible tool message:

> "The module not found error is expected (it's a Phaser/vite project,
>  not standalone node modules). The syntax is fine since there's no
>  syntax error — it failed at module resolution, not parsing. Let me
>  do a proper syntax check with acorn or just use node --check"

It then ran out of turns before writing
`.claude/swarm/receipts/world-path-renderer-2026-04-25T23-00-00Z.json`.

## Verification performed by orchestrator before synthesizing receipt

1. **File on disk:** `git diff HEAD --stat src/renderer/game/scenes/WorldMapScene.js`
   → 351 insertions / 10 deletions in a single file. Within the spec's
   expected scope.

2. **Expected symbols present** (grep on the working-tree file):
   - Line 20 — `hash2` added to `terrainNoise.js` import.
   - Line 160 — `this._renderPathLayer({ ... })` call site added in `create()` before node loop.
   - Line 310 — `_renderPathLayer({ locations, state, homeX, homeY, padX, padY, usableW, usableH })` method declaration.
   - Line 393 — `const hSign = hash2(0x9a7b, seedA, seedB)` — deterministic curve-sign.
   - Original `line.lineBetween(centerX, centerY, x, y)` block deleted from inside the location loop.

3. **Syntax:** `node --check src/renderer/game/scenes/WorldMapScene.js` → `SYNTAX_OK`. The worker's stalled syntax check would have produced the same result; recovery rolled past its tool-budget consumption.

4. **Spec coverage**, mapped item-by-item to lines in the diff:

| Spec item | Implemented | Line(s) |
|---|---|---|
| 1 — Bezier path with deterministic perpendicular sign | YES | 393, 401-413 (20-step approximation) |
| 2 — Color paths by terrain biome | YES | 351-371 (DESERT/GRASSLAND/MOUNTAIN/default) |
| 3 — Path width 2-3 desert/grass, 3-4 mountain | PARTIAL — chose lower-bound (2 / 2 / 3) | 355, 360, 365 |
| 4 — Layer order above terrain, below nodes | YES | depth -50 at 319 |
| 5 — Dashed for pending discovery unlocks | NOT THIS CYCLE — TODO in code | comment at 306-308 |
| 6 — WATER skipped | YES | 342 |
| 7 — Hash-determined curve direction | YES | 388-395 |

5. **Sibling confirmation:** `world-landmarks` receipt independently states:

   > "Path-renderer agent edits were fully merged (bezier paths,
   > _renderPathLayer method, hash2 import) before landmark layer was
   > added. No collision occurred."

   This is third-party witness from a separate Agent process that
   inspected the file mid-run.

## What was synthesized vs. observed

| Field | Source |
|---|---|
| `files_changed` | observed (`git diff --stat`) |
| `status: complete_with_recovery` | synthesized (per orchestrator policy) |
| `recovery.*` block | synthesized (orchestrator self-report) |
| Spec-item line ranges in `notes` | observed (`Read` of the working-tree file) |
| Hash function constant `0x9a7b` | observed (line 393 in code) |
| `existing_path_code_line_range_replaced` | observed (`git diff HEAD`) |
| `discoveryUnlocks_status` | observed (file does not exist on disk) |
| `git_diff_summary` (351 / 10) | observed |
| `performance_estimate` | **synthesized estimate**, not measured. The worker did not bracket the render with `performance.now()`, so no real measurement is available. Reviewer should flag this as a gap if performance was a hard requirement (the spec did not list one). |

## Limits of this recovery

- No real frame-time measurement. If the reviewer or polish pass needs
  it, world-map-polish can add the bracket.
- No automated visual verification — the user's planned visual review
  in Prompt 2 remains the authoritative check.
- Receipt fields beyond what the spec required (e.g. `awkward overlaps`
  tuning notes) are best-effort guesses; flag with the user if any are
  contradicted by visual review.

## Reviewer instructions

The reviewer should treat this receipt the same as a worker-written
one — verify `files_changed` against `git diff HEAD~ -- <file>`, score
against the agent's spec, and produce a verdict. If the reviewer flags
any spec item the orchestrator missed in synthesis, that's a normal
NEEDS_REVISION outcome; recovery does not exempt the work from quality
review.
