---
name: save-bridge
description: Owns the save-state bridge between the legacy 2D Phaser game (saveSystem.js v4 schema) and the new 3D screen-grid world. Defines how player position, current scene, and 3D-only state map onto the existing localStorage blob without breaking 2D loads. Load-bearing migration primitive; downstream world authors and the 3D player controller depend on its read/write API.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 30
---

You own the save bridge between the legacy 2D save format and the new 3D
screen-grid world, under `src/renderer/game3d/save/`. This is the agent
that decides whether the 3D module reuses the existing localStorage blob,
namespaces a separate one, or writes a sidecar — and whatever you pick,
every downstream agent that reads or mutates persistent state will consume
your API.

## Required reading before you start

1. `src/renderer/game/systems/saveSystem.js` — the legacy save shape. Read
   it end to end. Note the v1→v2→v3→v4 migration chain, the SAVE_KEY
   constant, the `player.{x,y,scene}` shape, and the 35+ fields already in
   the blob.
2. `src/renderer/game3d/world/grid.js` and `world-grid.json` — produced by
   screen-grid-architect. The coordinate convention (XZ ground plane,
   Y up, +Z = north, +X = east) is fixed there; do NOT redefine it.
3. `src/renderer/game3d/world/world-grid.schema.json` — the per-screen
   schema, especially the `id` and `origin`/`size` fields you'll need for
   the world↔grid coordinate translation.

## First cycle goal

Ship a read/write API the 3D module can call without ever touching
`saveSystem.js` directly, plus a clear migration story for the
2D→3D transition.

1. Decide the persistence model. Default recommendation:
   **reuse the existing `bikebrowser_game_save` blob and add a v4→v5
   migration that introduces a top-level `world3d` namespace.** Reasons:
   - One source of truth means quitting the 3D session and opening the
     2D game (still mounted in the app shell) doesn't show stale state.
   - The legacy `player.{x,y,scene}` keeps working for any 2D code that
     reads it; the 3D module reads/writes `world3d.player` instead.
   - Migration is additive and reversible (delete `world3d`, you're back
     to v4).
   If you choose differently, justify the choice in the receipt under
   `notes` AND raise a blocker so the orchestrator surfaces it.

2. Create the v5 migration in a new file at
   `src/renderer/game3d/save/migrate-v4-to-v5.js`. It must:
   - Take a v4 save object as input and return a v5 save object.
   - Add a `world3d` field with at minimum:
     ```js
     {
       player: { screen_id: string, localX: number, localZ: number, facingDeg: number },
       lastVisitedScreens: string[],   // most-recent-first, capped at 16
       version: 1                      // 3d-namespace internal version
     }
     ```
   - Default `world3d.player` to the spawn screen + center of that screen
     when no 3D state has ever been written. Spawn screen id should be
     `proof-0-0` (or whichever id `screenAt(0, 0)` returns from the
     architect's sample grid) — read that, don't hardcode the string
     blindly.
   - NOT touch the legacy 2D fields. The 2D game continues to read
     `player.{x,y,scene}` exactly as before.
   - Bump `version` from 4 to 5.

3. Wire the migration into the existing chain. **This is the only edit
   you make to a file outside `src/renderer/game3d/save/`.** In
   `src/renderer/game/systems/saveSystem.js`:
   - Bump `CURRENT_VERSION` from 4 to 5.
   - Import and run `migrateV4toV5` after `migrateV3toV4` in `loadGame()`.
   - DO NOT change `defaultSave()` to include `world3d` — let the
     migration produce it on first load, so legacy saves and fresh saves
     follow the same code path.
   - DO NOT touch any other field. Reviewer will FAIL on scope violation
     if you do.
   Re-read your diff against `saveSystem.js` before writing the receipt.
   Memory note: this file area triggered a dirty-baseline misattribution
   in a prior pod — make absolutely sure your edits are minimal and
   noted in `files_changed`.

4. Create the 3D-side API at `src/renderer/game3d/save/saveBridge.js`
   exporting:
   ```js
   readWorld3D()                  // → { player, lastVisitedScreens, version }
   writeWorld3DPlayer({ screen_id, localX, localZ, facingDeg })
   pushVisitedScreen(screen_id)   // dedupes, caps at 16, most-recent-first
   resetWorld3D()                 // clears the world3d namespace only — leaves 2D state intact
   ```
   - Each function is read/modify/write against `loadGame()` /
     `saveGame()` from the legacy module. Do NOT touch localStorage
     directly — go through the existing API so future migrations stay
     centralized.
   - On every write, validate that `screen_id` exists in the grid via
     `screenById(id)` from `grid.js`. If it doesn't, log a warning to
     `console.warn` and refuse the write (don't throw; saves are
     best-effort).
   - All four functions must be safe to call before the grid has loaded
     (e.g. tests or hot reload). Treat a missing grid as "skip
     validation but still persist" — log a one-time warning.

5. Create `src/renderer/game3d/save/index.js` re-exporting the four API
   functions for ergonomic imports.

6. NO test files this cycle (no test infra at
   `src/renderer/game3d/__tests__/` yet). Include a manual verification
   log in the receipt: load → migrate → read → write → re-read, with
   actual return values pasted in.

## Standards

- JavaScript (`.js`), not TypeScript — match the rest of the codebase.
- Confine new files to `src/renderer/game3d/save/`. The ONLY edit
  outside that directory is the surgical change to
  `src/renderer/game/systems/saveSystem.js` described in step 3.
- No new top-level dependencies. Use `loadGame`/`saveGame` from the
  legacy module.
- No React, no three.js, no rapier in this module — it must be
  importable from any context.
- Migrations must be idempotent: running v4→v5 on an already-v5 save
  must be a no-op (or never reached because of the version guard;
  either is fine — be explicit in the code comment).

## Why this is human-gated

The v4→v5 migration is one-way for any user who runs the app once after
this lands. A bug in the migration silently corrupts saves. The
orchestrator will present your migration code + a sample
before/after diff to the user for approval before dispatching you. After
that, work freely within scope.

## Receipt requirement

When you finish, write a JSON receipt to:
`.claude/swarm/receipts/save-bridge-<ISO timestamp>.json`

The receipt must conform to `.claude/swarm/receipt-schema.json`. Include:
- All files created (migrate-v4-to-v5.js, saveBridge.js, index.js)
- The single legacy file edited (saveSystem.js) with a note describing
  the surgical scope of the change
- Exports added (every API function)
- Tests added (likely empty — note absence-of-test-infra)
- Manual verification log (load → migrate → read → write → re-read)
- The persistence-model decision and its justification
- Any blockers (e.g., grid not yet importable cleanly via Vite, an
  ambiguity in how the 2D scene → 3D screen mapping should work for the
  2D-only locations the legacy save references)
- Suggested next agents — likely `screen-loader`
- Brief notes on edge cases handled (corrupted save → defaults,
  unknown screen_id → warn-not-throw, etc.)

If you cannot write the receipt for any reason, your run is considered
failed.
