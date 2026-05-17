# Godot Export Parity Audit

Date: 2026-05-17
Branch: `repair/runtime-canonicalization`
Commit at audit: `eb1560a4f1de96d53c9b857a5449495cf1294652`

## Verdict: **STALE — 5 days behind source, every embodied-mechanics change is missing from the web route.**

## 1. What `/godot-prototype` actually serves

`src/renderer/pages/GodotPrototypePage.jsx:8` iframes a hardcoded path:
`/godot/BikeBrowserWorld/index.html` → `public/godot/BikeBrowserWorld/`.

Current contents (all mtime **2026-05-12 20:06**):

| File | Size |
|---|---|
| `index.html` | 5,446 B |
| `index.js` | 315,759 B |
| `index.pck` | 228,268 B (the resource pack — **this is the snapshot of all .gd/.tscn/.json**) |
| `index.wasm` | 37,695,054 B (~37 MB) |
| `index.audio.worklet.js` | 7,298 B |
| `index.audio.position.worklet.js` | 2,973 B |
| `index.png`, `index.icon.png`, `index.apple-touch-icon.png` | icons |
| `README.md` | export notes only, no version marker |

## 2. Source-vs-export drift

`git status` shows `BikeBrowserWorld/` is **entirely untracked** — no commits to the Godot project exist, so `git log` cannot bound the drift. mtime comparison instead:

- **283 source files** under `BikeBrowserWorld/` (`.gd`, `.tscn`, `.json`, `.cfg`) are newer than `index.wasm`.
- Includes the entire `Core/`, `Regions/`, `Systems/Interactions/`, `Prototypes/EmbodiedMechanics/`, and every NPC `.tscn`.
- BrakeRig, SafetyCheckStation integration, canonical autoload set, fade transition, dialogue normalization passes — **none of it** is in the web build.

Anyone testing in `/godot-prototype` right now is testing a build from **before** the embodied-mechanics breakthrough. Live `godot --path BikeBrowserWorld` (what the user actually runs) and the web iframe are entirely different games.

## 3. Export preset

`BikeBrowserWorld/export_presets.cfg`:
- One preset: **`Web Single Threaded`** (single-threaded for iframe compatibility — correct choice).
- `export_path="exports/web/index.html"` (preset default; will be overridden by CLI arg in the helper script).
- `runnable=true`, `vram_texture_compression/for_desktop=true`, `html/canvas_resize_policy=2`, `progressive_web_app/enabled=false`.
- Godot 4.6.2 export templates are confirmed installed at `%APPDATA%\Godot\export_templates\4.6.2.stable\`.

## 4. Re-export command

Manual:
```powershell
godot --headless --path BikeBrowserWorld `
  --export-release "Web Single Threaded" `
  public/godot/BikeBrowserWorld/index.html
```

Helper script written: **`tools/export-godot-web.ps1`** — resolves Godot from PATH or known fallback (`%USERPROFILE%\Downloads\Godot_v4.6.2-stable_win64.exe\...`), runs the export, then writes a `version.json` next to the build with the git SHA + UTC timestamp + Godot exe path. Idempotent. Only writes inside `public/godot/BikeBrowserWorld/`. To run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\export-godot-web.ps1
```

Proposed npm script (NOT added — package.json untouched per fork scope):
```json
"export:godot": "powershell -ExecutionPolicy Bypass -File tools/export-godot-web.ps1"
```

## 5. Version marker

The helper writes `public/godot/BikeBrowserWorld/version.json`:
```json
{ "git_sha": "...", "exported_at": "2026-05-17T...Z", "godot_exe": "...", "project_path": "BikeBrowserWorld" }
```
A future renderer-side or Playwright test can `fetch('/godot/BikeBrowserWorld/version.json')`, compare against current HEAD, and warn/fail when the iframe is stale. `GodotPrototypePage.jsx` could surface this in the sidebar log too — small addition, deferred.

## 6. Recommended follow-ups (out of fork scope)

1. **Run the export script now** — close the 5-day gap before any human playtests `/godot-prototype`.
2. **Add the `export:godot` npm script** so the workflow is one command.
3. **Add a staleness banner** to `GodotPrototypePage.jsx` when `version.json.git_sha` ≠ current SHA (dev mode only).
4. **Commit the BikeBrowserWorld/ folder** — its untracked state makes drift analysis impossible and risks total loss on a `git clean`.
