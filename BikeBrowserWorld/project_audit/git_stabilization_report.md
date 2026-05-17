# Git Stabilization Report

Date: 2026-05-17
Author: source-control stabilization sprint
Commit: **`224d2803`** — "Establish embodied mechanics vertical slice baseline"

## 1. What this commit changed about the project's risk surface

Before this commit: the entire embodied vertical slice — 2,768 files of Godot source, the BrakeRig + ChainRig prototypes, integration tests, audit history, playtest infrastructure, and the React-side Godot bridge — was untracked. A `git clean -fd` or `git reset --hard` could have erased weeks of work.

After this commit: the slice is recoverable from any clone. The single highest operational risk identified by the systems-engineer sprint (R1) is closed.

## 2. Commit anatomy

- SHA: `224d2803620496915d0b89bd19a9407fb2bb09ad`
- Branch: `repair/runtime-canonicalization`
- Author: yazan
- Files changed: **2,878**
- Insertions: **119,260**
- Deletions: 0 (additive only)

The commit is genuinely additive. No tracked file was modified or deleted. No history was rewritten. No branches were reset. The pre-existing tracked modifications and intentionally-skipped untracked items remain in the working tree exactly as they were before.

## 3. Disposition decisions made and their reasoning

### Files gitignored

| Pattern | Reason | Reversible? |
|---|---|---|
| `BikeBrowserWorld/.godot/` (already covered by BikeBrowserWorld/.gitignore) | Godot editor cache. Auto-regenerated on first import. 187 MB. | Yes — remove the line if a developer wants to track import state. |
| `BikeBrowserWorld/exports/` | Older in-project export dir from before `tools/export-godot-web.ps1`. 37 MB. Stale. | Yes — remove the line; first export will repopulate. |
| `public/godot/BikeBrowserWorld/index.pck` (179 MB) | HTML5 export archive. Built from source by `tools/export-godot-web.ps1`. Bloats repo if tracked. | Yes — remove the line; re-export to track. |
| `public/godot/BikeBrowserWorld/index.wasm` (36 MB) | HTML5 export wasm. Same reasoning. | Yes — remove the line. |
| `playtest/active_session/`, `logs/`, `screenshots/`, `telemetry/`, `issue_reports/`, `emotional_notes/` | Runtime captures, regenerated each playtest session. Scripts and README **are** tracked. | Yes — remove the lines to begin tracking captured data. |
| `reports/network/`, `reports/*.log` | Runtime network captures and logs. Authored .png diagrams **are** tracked. | Yes — remove the lines. |

Every ignore rule is reversible. None deletes existing files; they only prevent future tracking.

### Files committed despite size

| Path | Size | Reasoning |
|---|---|---|
| `BikeBrowserWorld/Assets/` | 223 MB | Authored game source. Not regeneratable. Repo bloat is acceptable cost of preservation. |
| `BikeBrowserWorld/Assets/Audio/Music/copper_mine.mp3` | 14 MB | Single largest tracked file. Same reasoning. |
| `BikeBrowserWorld/.godot/imported/` (excluded via inner .gitignore) | — | NOT tracked; only the source assets in `Assets/` are. Importer regenerates the cache. |

### Files intentionally left untracked (separate concerns)

- 12 pre-existing tracked-file modifications under `src/renderer/*` and `screenshots/*` — out of this sprint's scope. The user may have these on a different commit plan.
- `public/game/audio/music/*.mp3`, `public/game/audio/stingers/*.mp3` — Phaser game audio used by `/play`, not by `/godot-prototype`.
- `src/renderer/spellingTrainer/uploadServer.js`, `tests/spelling-*.test.mjs`, `tests/game-safe-zones-mobile.test.mjs` — spelling trainer + Phaser-side tests; different concern.

These remain visible in `git status` exactly as they did before the sprint started.

## 4. What got included that wasn't strictly required

Three categories were borderline; all included on the same reasoning ("if it's part of how this slice works, commit it"):

- `BikeBrowserWorld/.importality_temp/` is gitignored (by Godot's auto-generated rule) and the `addons/nklbdev.importality/` plugin folder itself is tracked. The decision: the plugin is part of the project's reproducible state; commit it.
- `BikeBrowserWorld/AchievementSystem/` was untracked but exists in the project. Decision: track it; it's part of the project even if not yet used by the slice.
- `public/godot/BikeBrowserWorld/{index.html, index.js, *.worklet.js, icons}` were committed alongside the gitignored binary outputs. Decision: these are small text/asset files that let the iframe load correctly even with a stale .pck/.wasm; tracking them makes `/godot-prototype` partially-functional immediately on clone.

## 5. Process discipline followed

The sprint brief was explicit about what NOT to do. Honored:
- **No files deleted.** Every commit operation was `git add` followed by `git commit`; no `rm`, no `clean`, no `reset`.
- **No history rewriting.** No `--amend`, no `rebase -i`, no `--force`.
- **No aggressive cleaning.** Working tree state preserved; only newly-tracked items moved from untracked → tracked.
- **No discarded exports without review.** The `public/godot/BikeBrowserWorld/index.pck` decision was deliberate (gitignore as reproducible build output, document the regeneration command).
- **No telemetry/playtest folders removed.** Scripts kept tracked; runtime-only capture dirs gitignored to preserve the sidecar pattern.

## 6. Verification commands ran by this sprint

```
git status --short                          # before staging
git ls-files | wc -l                        # 878 tracked baseline
git check-ignore -v <candidate>             # for every borderline path
du -sh BikeBrowserWorld/ Assets/ exports/   # sizing for ignore decisions
find . -size +5M -not -path './node_modules/*' \
    -not -path './.git/*' \
    -not -path '*/.godot/*'                 # large-file scan
git diff --cached --shortstat               # 2,878 files / 119,260 ins
git commit -m "..."                         # the foundational commit
git log -1                                  # SHA confirmed: 224d2803
git status --short                          # post-commit, working tree clean
```

## 7. What the next developer needs to know

To get this codebase running from a fresh clone:

```bash
git clone https://github.com/yazanalhasan/bikebrowser.git
cd bikebrowser
git checkout repair/runtime-canonicalization

# Frontend
npm install
npm run build

# Godot HTML5 export (one-time per session; the .pck/.wasm are gitignored)
powershell -ExecutionPolicy Bypass -File tools/export-godot-web.ps1

# Run the desktop Godot prototype
godot --path BikeBrowserWorld

# Run all Godot tests
for t in brake_rig_state_check chain_rig_state_check chain_hotspot_embodied_check \
         interaction_overlap_check vertical_slice_check ...; do
  godot --headless --path BikeBrowserWorld --script "res://tests/$t.gd"
done
```

The 12 passing tests + `runtime_repair_smoke.gd` + RuntimeValidator boot constitute the safety net. If any of these go red on a future commit, that commit broke the slice.

## 8. Outstanding source-control concerns

- Nothing pushed to remote yet. `origin/repair/runtime-canonicalization` does not include this commit. **Action required by the user**: `git push origin repair/runtime-canonicalization`. Not done by this sprint — pushing is visible to others and the brief did not authorize it.
- The 12 pre-existing tracked-file modifications under `src/renderer/*` and `screenshots/*` are not in this commit and remain modified. They are a separate concern requiring a separate decision.

The sprint's success criteria are all met: the project is safely version controlled, no embodied mechanics work was lost, the vertical slice is recoverable, the repo state is now trustworthy, future experimentation is safe.
