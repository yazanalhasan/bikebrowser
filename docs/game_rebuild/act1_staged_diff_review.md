# Act 1 Staged Diff Review

Date: 2026-05-27

## Staged Scope

The staged diff is cleanly scoped to the `/game-rebuild` Act 1 playable substrate and polish pass.

Staged areas:

- Act 1 documentation under `docs/game_rebuild/`
- `/game-rebuild` Phaser shell under `src/game/`
- Act 1 data under `src/game/data/act1/`
- portable Phaser systems under `src/game/phaser/systems/`
- `/game-rebuild` scenes under `src/game/phaser/scenes/`
- Phaser data re-exports under `src/game/phaser/data/`
- route integration files:
  - `src/renderer/App.jsx`
  - `src/renderer/components/AppLayout.jsx`
  - `src/renderer/pages/GameRebuildPage.jsx`
  - `src/renderer/utils/uxSafety.js`
- Act 1 Playwright tests:
  - `tests/e2e/game-rebuild.smoke.spec.js`
  - `tests/e2e/game-rebuild.act1-complete.spec.js`
  - `tests/e2e/game-rebuild.act1-visual-capture.spec.js`
  - `tests/e2e/game-rebuild.act1-polish.spec.js`
- scoped visual captures under `playtest_captures/game_rebuild_act1_complete/`

## Validation Commands And Results

```powershell
npm run build
```

Result: passed.

```powershell
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js
```

Result: passed, 7 tests.

```powershell
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Result: passed. CUDA available on NVIDIA GeForce RTX 5090. Images analyzed: 8. Findings: 0.

## Excluded Files

Excluded dirty worktree is documented in:

- `docs/game_rebuild/act1_excluded_dirty_worktree.md`

Major excluded groups:

- unrelated Godot tire rig/runtime export work
- unrelated BikeRepair Aseprite/PNG assets
- unrelated ComfyUI/toolchain helper scripts and audits
- broad `project_audit` scratch files
- unrelated screenshots, backups, imports, and visual diff folders

## Risks

- This is a large first commit for `/game-rebuild` because the substrate was previously untracked.
- Scoped screenshots are included as review artifacts; they are small and Act 1 specific.
- Existing repo line-ending settings emit LF-to-CRLF warnings when staging, but build/tests passed after staging.
- Broader worktree remains dirty after commit by design.

## Recommended Commit Message

```text
Add playable Act 1 game-rebuild substrate
```

## Commit Readiness

The staged diff is Act 1 scoped and ready to commit.
