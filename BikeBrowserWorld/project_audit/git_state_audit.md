# Git State Audit — Pre-Stabilization

Date: 2026-05-17
Author: source-control stabilization sprint
Purpose: snapshot the git state of the repository at the moment immediately before the foundational vertical-slice commit.

## 1. Repo identity

- Remote: `origin → https://github.com/yazanalhasan/bikebrowser.git`
- Branch in working tree: `repair/runtime-canonicalization`
- Tracked file count at audit time: **878** (none under `BikeBrowserWorld/`)
- Recent committed history (last 5):
  ```
  eb1560a Add mechanical compatibility intelligence
  156d3ff Save lab improvements and spelling trainer
  8bb3d40 Improve dry wash load test animation
  2c1840a Add dry wash bridge music
  56d9167 Keep quest map destinations revealed
  ```

## 2. Risk surface entering this sprint

The dominant risk: **the entire BikeBrowserWorld Godot project (2,768 non-cache files, ~265 MB excluding editor cache) was untracked.** A `git clean -fd` would have erased the embodied vertical slice, the brake + chain rigs, all integration tests, and the systems-engineer audit history.

Adjacent untracked categories that needed disposition:
- `playtest/` — sidecar QA scaffold (scripts + runtime captures intermingled)
- `tools/export-godot-web.ps1`, `tools/network-diagnostics.ps1` — workflow utilities
- `swarm/` — design + orchestration documentation
- `project_audit/` (repo root) — embodied-mechanics narrative reports
- `docs/godot-*`, `docs/long-term-godot-roadmap.md`, `docs/revised-*`, `docs/superpowers/` — Godot-context design docs
- `reports/` — mix of authored .png diagrams and runtime .log captures
- `public/godot/BikeBrowserWorld/` — exported HTML5 build (216 MB binaries + small text files)
- React side of the Godot bridge: `src/renderer/godot/bridgeEvents.js`, `src/renderer/pages/GodotPrototypePage.jsx`, `src/renderer/bootstrapErrorPolicy.js`
- Tests for the above: `tests/bootstrap-error-policy.test.mjs`, `tests/e2e/godot-prototype.smoke.spec.js`, `tests/godot-bridge.test.mjs`

Pre-existing tracked modifications also present (left **untouched** by this sprint — different concern):
- `screenshots/{game,home,mobile_game,mobile_home,project_builder,youtube_search}.png` — 6 regenerated screenshots
- `src/renderer/App.jsx`, `src/renderer/main.jsx`, `src/renderer/game/audio/audioManifest.js`, `src/renderer/game/ui/safeZones.js`, `src/renderer/spellingTrainer/{SpellingTrainerApp,wordTools}.{jsx,js}` — non-Godot edits

Intentionally **excluded from the foundational commit** (separate concerns, kept untracked for the user to handle later):
- `public/game/audio/music/*.mp3`, `public/game/audio/stingers/*.mp3` — Phaser game audio (used by `/play`, not by `/godot-prototype`)
- `src/renderer/spellingTrainer/uploadServer.js`, `tests/spelling-*.test.mjs` — spelling-trainer infrastructure
- `tests/game-safe-zones-mobile.test.mjs` — Phaser-side mobile test

## 3. Storage analysis

Three large categories required disposition:

| Path | Size | Disposition | Reason |
|---|---|---|---|
| `BikeBrowserWorld/.godot/` | 187 MB | **gitignore** (already covered by `BikeBrowserWorld/.gitignore`) | Godot editor cache; reproduced on first import. |
| `BikeBrowserWorld/exports/` | 37 MB | **gitignore** (new rule) | Older in-project export, predates `tools/export-godot-web.ps1`. Reproducible. |
| `public/godot/BikeBrowserWorld/index.{pck,wasm}` | 216 MB | **gitignore** (new rule), keep companions | Reproducible via `tools/export-godot-web.ps1`. Companion text files (.html, .js, .json, icons, worklets — ~370 KB) committed. |
| `BikeBrowserWorld/Assets/` | 223 MB | **commit** | Authored game assets (Characters 99 MB, Props 53 MB, Audio 46 MB, Backgrounds 20 MB, UI 5 MB). Source material; not regeneratable. |

The three large music files in `Assets/Audio/Music/` (copper_mine 14 MB, dry_wash_bridge 7.4 MB, salt_river 6.8 MB) are committed as game assets. Total committed payload ≈ 235 MB.

## 4. .gitignore changes (additive only — never deleted existing rules)

Pre-sprint `.gitignore` already covered: node_modules, .venv, dist/build, .env*, logs, IDE caches, screenshots/game-studio-audit/, playwright outputs, secrets.

Added (in root `.gitignore`, appended below existing rules):

```
# --- Godot HTML5 export binaries (rebuildable: tools/export-godot-web.ps1) ---
public/godot/BikeBrowserWorld/index.pck
public/godot/BikeBrowserWorld/index.wasm
# Older in-project export dir (predates tools/export-godot-web.ps1). 37 MB.
BikeBrowserWorld/exports/

# --- Playtest runtime captures (regenerated each session) ---
playtest/active_session/
playtest/logs/
playtest/screenshots/
playtest/telemetry/
playtest/issue_reports/
playtest/emotional_notes/

# --- Reports: runtime logs (authored png/svg reports are tracked) ---
reports/network/
reports/*.log
```

`BikeBrowserWorld/.gitignore` (Godot-generated) already covers `.godot/`, `.importality_temp/`, `export-debug.log`. Untouched.

Verified via `git check-ignore -v` that:
- `index.pck`, `index.wasm`, `.godot/uid_cache.bin`, `playtest/screenshots/*`, `reports/network/*` all match ignore rules.
- `index.html`, `version.json`, `ChainHotspot.gd`, `playtest/README.md`, `playtest/log_runtime_output.gd`, `reports/godot-prototype-neighborhood.png` are **not** matched (will be committed).

## 5. Staging summary (pre-commit)

```
2,876 files staged
119,022 insertions
```

Breakdown of staged trees:
- `BikeBrowserWorld/` — ~2,768 files (the entire Godot project minus `.godot/`, `.importality_temp/`, `exports/`)
- `playtest/` — scripts + README + .ps1 launchers (capture dirs gitignored)
- `tools/export-godot-web.ps1`, `tools/network-diagnostics.ps1`
- `swarm/` — design + orchestration docs
- `project_audit/` — embodied-mechanics narrative
- `docs/godot-*.md`, `docs/long-term-godot-roadmap.md`, `docs/revised-*.md`, `docs/superpowers/`
- `reports/` — authored PNG diagrams (network/ + log/ ignored)
- `public/godot/BikeBrowserWorld/` — HTML5 export companion files (binaries ignored)
- React Godot bridge: `src/renderer/godot/bridgeEvents.js`, `src/renderer/pages/GodotPrototypePage.jsx`, `src/renderer/bootstrapErrorPolicy.js`
- Godot bridge tests: `tests/{bootstrap-error-policy.test.mjs, e2e/godot-prototype.smoke.spec.js, godot-bridge.test.mjs}`

Pre-existing tracked modifications (12 files) remained **unstaged** — preserved working state per the sprint brief.

## 6. Validation prior to commit

- `git check-ignore -v` confirmed every intended-ignore actually ignores.
- `git check-ignore -v` confirmed every intended-track actually tracks.
- Scanned filesystem for files > 5 MB outside ignored paths: only the 3 expected music assets surfaced.
- 12 of 13 Godot tests pass at HEAD (pre-existing flagged `garage_transition_check.gd` remains the only failure — documented in earlier handoff).
- `npm run build` clean.

The commit is safe to execute.
