# Full Runtime Resource Inventory

Date: 2026-05-18
Scope: Phase 1 resource/runtime inventory for BikeBrowser / BikeBrowserWorld.
Workspace: `C:\dev\bikebrowser`

## Summary

This machine is ready for parallel browser validation, Godot web export checks, CUDA-assisted visual analysis, Electron smoke work, and asset pipeline inspection. Hardware is not the current limiter.

Planning constraints:

- Worktree is already dirty from other workers; do not infer ownership from modified files outside this report.
- `npm run build` was not executed during this inventory because it writes `build/`; build flow was inspected from `package.json`, lockfile, and installed package versions.
- Blender is installed but not on PATH. Use the explicit install path until PATH is updated.

## Repository State

Commands:

```powershell
Get-Location
git status --short
Get-ChildItem -Force project_audit
```

Results:

- Repo path: `C:\dev\bikebrowser`
- Existing root audit directory: `project_audit/`
- Updated file: `project_audit/full_runtime_resource_inventory.md`
- Dirty worktree observed before this report update, including Godot, React, screenshot, telemetry, test, and audit artifacts from other workers.

## CPU, RAM, OS

Commands:

```powershell
Get-CimInstance Win32_Processor |
  Select Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,L2CacheSize,L3CacheSize
Get-CimInstance Win32_ComputerSystem | Select TotalPhysicalMemory
Get-CimInstance Win32_OperatingSystem |
  Select Caption,Version,BuildNumber,OSArchitecture,FreePhysicalMemory
```

Results:

- OS: Microsoft Windows 11 Pro, version `10.0.26200`, build `26200`, 64-bit.
- CPU: Intel Core Ultra 9 285K.
- CPU topology: 24 physical cores, 24 logical processors.
- Max clock reported: 3700 MHz.
- Cache: L2 40960 KB, L3 36864 KB.
- RAM: 67,938,451,456 bytes, about 64 GiB.
- Free physical memory at probe: 39,205,724 KB, about 37.4 GiB.

Sprint use:

- Safe to run Playwright/static scans in parallel when they do not share writable outputs.
- Serialize Godot export and project-cache-sensitive checks.

## GPU, CUDA, PyTorch

Commands:

```powershell
nvidia-smi --query-gpu=index,name,driver_version,memory.total,memory.free,temperature.gpu,utilization.gpu --format=csv,noheader
nvcc --version
python - <<'PY'
import torch
print(torch.__version__, torch.cuda.is_available(), torch.version.cuda, torch.cuda.device_count())
for i in range(torch.cuda.device_count()):
    print(i, torch.cuda.get_device_name(i))
PY
```

Results:

| GPU | Name | Driver | VRAM | Free at probe | Temp | Util |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | NVIDIA GeForce RTX 5090 | 591.86 | 32607 MiB | 31692 MiB | 51 C | 0% |
| 1 | NVIDIA GeForce RTX 5090 | 591.86 | 32607 MiB | 31692 MiB | 35 C | 0% |

- CUDA toolkit: `nvcc` release 12.9, V12.9.41.
- PyTorch: `2.8.0+cu129`.
- `torch.cuda.is_available()`: `True`.
- PyTorch CUDA runtime: `12.9`.
- PyTorch device count: 2.

Sprint use:

- CUDA is ready for screenshot comparison, visual clustering, asset analysis, and local CV helpers.
- Repo scans, JSON checks, and deterministic smoke tests should remain CPU-first unless visual analysis benefits from GPU.

## Node, npm, Git, PowerShell, Python

Commands:

```powershell
$PSVersionTable | Select PSVersion,PSEdition,GitCommitId,OS,Platform
node --version
npm --version
git --version
python --version
```

Results:

- PowerShell: 7.6.1 Core.
- Node: v22.22.3.
- npm: 10.9.8.
- Git: 2.54.0.windows.1.
- Python: 3.11.9.

## npm, Build, Electron Runtime

Commands:

```powershell
Get-Content package.json
npm ls --depth=0 --json
npx electron --version
```

Installed/runtime highlights:

- Electron CLI: `v28.3.3`.
- Vite installed: `5.4.21`; package range is `^5.0.12`.
- React installed: `18.3.1`; package range is `^18.2.0`.
- Three installed: `0.184.0` with package override.
- Phaser installed: `3.90.0`.
- Playwright installed: `1.59.1`.
- Electron Builder installed: `24.13.3`; package range is `^24.9.1`.

Key npm scripts:

- `npm run dev:web`: API server + Vite.
- `npm run dev:react`: Vite on strict port 5173.
- `npm run dev:electron`: waits for `http://localhost:5173`, then launches Electron.
- `npm run build`: `vite build`, output `build/`.
- `npm run build:electron`: `electron-builder`.
- `npm run lint`: ESLint over `src/**/*.js(x)`.
- `npm run test:e2e`: Playwright suite.
- `npm run test:e2e:smoke`: `playwright test runtime-audit.smoke`.
- `npm run test:e2e:playthrough`: targeted playthrough smoke group.

Vite config notes:

- Dev server: host enabled, strict port `5173`.
- API proxy: `/api` -> `http://localhost:3001`.
- Build output: `build/`.
- Manual chunks split Phaser, Three/R3F/Drei/Rapier, and React Router.
- Dev-only `/api/save-layout` middleware writes constrained layout JSON under `public/layouts/`.

## Playwright / Browser Rendering Readiness

Commands:

```powershell
npx playwright --version
node -e "const {chromium}=require('playwright'); const p=chromium.executablePath(); const fs=require('fs'); console.log(p, fs.existsSync(p));"
node -e "const {chromium}=require('playwright'); (async()=>{ const b=await chromium.launch({headless:true}); const p=await b.newPage(); console.log(await p.evaluate(()=>({ua:navigator.userAgent, webgl:!!document.createElement('canvas').getContext('webgl'), webgl2:!!document.createElement('canvas').getContext('webgl2')}))); await b.close(); })();"
```

Results:

- Playwright: `1.59.1`.
- Chromium executable exists: `C:\Users\admin\AppData\Local\ms-playwright\chromium-1217\chrome-win64\chrome.exe`.
- Headless Chromium launches successfully.
- Browser user agent: HeadlessChrome/147.0.7727.15.
- WebGL: true.
- WebGL2: true.

Project config:

- `playwright.config.js` runs `tests/e2e`, Chromium only, workers `1`, retries `0`.
- Dev server command: `npm run dev:react`.
- Base URL: `http://localhost:5173`.
- Traces/videos retained on failure; screenshots only on failure.

## Godot Runtime, Renderer, Export Tooling

Commands:

```powershell
godot --version
Get-Content BikeBrowserWorld/project.godot
Get-Content BikeBrowserWorld/export_presets.cfg | Select-String "\[preset|platform=|export_path=|runnable=|include_filter=|exclude_filter="
```

Results:

- Godot: `4.6.2.stable.official.71f334935`.
- Project name: `BikeBrowserWorld`.
- Main scene: `res://Regions/Neighborhood/NeighborhoodStreet.tscn`.
- Renderer: `gl_compatibility` for desktop and mobile.
- Viewport: 1280x720, stretch mode `canvas_items`, aspect `expand`.
- Web export preset exists:
  - platform: `Web`
  - runnable: `true`
  - export path: `exports/web/index.html`
  - exclude filter: `exports/web/*`
- Root export helper exists: `tools/export-godot-web.ps1`, targeting browser-facing assets under `public/godot/BikeBrowserWorld/`.

Autoloads relevant to runtime checks:

- `RuntimeValidator`: `res://Core/RuntimeValidator/RuntimeValidator.gd`.
- `PlaytestRigTelemetry`: `res://Systems/Playtest/PlaytestRigTelemetry.gd`.
- Core gameplay services include EventBus, SaveService, RegionRegistry, QuestRegistry, DiscoveryService, InventoryManager, DialogueManager, CompanionBridge, RewardBridge, AudioService, and ProjectIntegration.

## Aseprite, Blender, FFmpeg

Commands:

```powershell
aseprite --version
Get-Content BikeBrowserWorld/tools/aseprite-path.txt
blender --version
Get-ChildItem "C:\Program Files\Blender Foundation"
ffmpeg -version
```

Results:

- Aseprite: `1.3.17.2-x64`.
- Project Aseprite path file: `C:\Program Files\Aseprite\Aseprite.exe`.
- Blender: not found on PATH.
- Blender install directory observed: `C:\Program Files\Blender Foundation\Blender 5.1`.
- FFmpeg: `8.1.1-full_build-www.gyan.dev`.

Project integration:

- Aseprite addons/importers are present under `BikeBrowserWorld/addons/`.
- Aseprite helper scripts exist under `BikeBrowserWorld/tools/`, including sprite/tile export batch files and Lua import helpers.
- Exported sprite/tile assets exist under `BikeBrowserWorld/Assets/Exports/`.

## OpenClaw / Codex / Local Agent Runtime

Commands:

```powershell
openclaw --version
openclaw status
codex --version
claude --version
```

Results:

- OpenClaw: `2026.5.12 (f066dd2)`.
- Dashboard/gateway: `http://127.0.0.1:18789/`, local loopback reachable.
- Gateway service: scheduled task installed/registered; listener detected on port 18789.
- Active agent runtime: OpenAI Codex, default model shown as `gpt-5.5`.
- Enabled/observable memory: `memory-core`.
- Channels: none configured in `openclaw status`.
- Codex CLI: `0.130.0`.
- Claude Code: `2.1.143`.

Planning note:

- OpenClaw/Codex is locally usable for worker coordination and report generation.
- No chat channel delivery should be assumed from this repo without a configured channel target.

## Telemetry and Validation Systems

Commands:

```powershell
rg -n "RuntimeValidator|PlaytestRigTelemetry|__UX_AUDIT__|runtimeAudit|progressionReachabilityAudit|visual-runtime|telemetry|validation|smoke|playtest" src tests tools BikeBrowserWorld
```

Observed systems:

- Godot boot validation: `BikeBrowserWorld/Core/RuntimeValidator/RuntimeValidator.gd`.
- Godot rig telemetry: `BikeBrowserWorld/Systems/Playtest/PlaytestRigTelemetry.gd`.
  - Enabled by `BIKEBROWSER_PLAYTEST=1` or `--playtest`.
  - Writes rig sessions to `playtest/telemetry/rig_session_<timestamp>.json`.
- Godot repair/runtime smoke: `BikeBrowserWorld/project_audit/runtime_repair_smoke.gd`.
- Browser runtime audit: `src/renderer/game/systems/runtimeAudit.js`.
- Browser reachability audit: `src/renderer/game/systems/progressionReachabilityAudit.js`.
- UX audit hook: `src/renderer/hooks/useUXAudit.js`, writes `window.__UX_AUDIT__`.
- Playwright helper waits on `window.__runtimeAuditResult` in `tests/e2e/helpers/gameBoot.js`.
- Playwright smoke/playthrough specs include:
  - `tests/e2e/runtime-audit.smoke.spec.js`
  - `tests/e2e/full-game-playthrough.smoke.spec.js`
  - `tests/e2e/flat-tire-flow.smoke.spec.js`
  - `tests/e2e/gameplay-report-panel.smoke.spec.js`
  - `tests/e2e/godot-prototype.smoke.spec.js`
  - `tests/e2e/mission-inventory-hud.smoke.spec.js`
- Visual runtime tooling:
  - `tools/visual-runtime-capture.mjs`
  - `tools/analyze_visual_runtime_cuda.py`
  - root output dirs currently present: `playtest_captures/`, `visual_diffs/`, `screenshot_baselines/`, `telemetry/`, `test-results/`, `playwright-report/`.

## Readiness Verdict

Phase 1 runtime/resource inventory is complete.

Ready now:

- CUDA/PyTorch visual analysis across two RTX 5090 GPUs.
- Playwright Chromium validation with WebGL/WebGL2.
- Godot 4.6.2 compatibility-renderer project inspection and web export flow.
- Electron 28 runtime smoke work.
- Aseprite/FFmpeg asset and capture workflows.
- OpenClaw/Codex local coordination.

Needs care:

- Dirty parallel worktree: coordinate before editing shared files.
- Build/export commands write outputs; use deliberately and announce ownership.
- Blender requires explicit executable path or PATH update.
- OpenClaw chat/channel reporting is not configured locally.
