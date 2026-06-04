# Overnight VS Code Orchestration Mode

Date: 2026-05-18

## Scope

This pass extends the existing VS Code cockpit for overnight autonomous workflow execution without changing gameplay systems, runtime architecture, or embodied-learning mechanics.

## Overnight cockpit additions

Added overnight-oriented workflow surfaces:
- `.vscode/playwright.overnight.config.js`
- `tools/summarize-route-capture.ps1`
- expanded `tools/visual-runtime-capture.mjs`
- new tasks and launch entries for overnight sweep, screenshot capture, telemetry digest, and CUDA visual analysis

## Runtime guardrails

The overnight shell model remains anchored to:
- PowerShell 7
- Node 22.22.3 first in PATH
- npm global shims in PATH
- `C:\Python` present in VS Code PATH to avoid the Windows Store alias for legacy helper scripts
- canonical repo root `C:\dev\bikebrowser`

Verified commands:
- `node --version` -> `v22.22.3`
- `npm --version` -> `10.9.8`
- `where.exe node` -> Node 22 first, Node 20 second, no Node 25 path remains
- `openclaw --version` -> `OpenClaw 2026.5.12 (f066dd2)`
- `$PSVersionTable.PSVersion` -> PowerShell 7

## Overnight Playwright posture

Configured a dedicated overnight Playwright config with:
- desktop, tablet portrait, mobile portrait, mobile landscape, and low-resolution projects
- `8` workers by default, capped at `12`
- `repeatEach = 2` by default for reload/stability pressure
- HTML report under `playtest_captures/`
- JSON report under `telemetry/`

Current limitation:
- the existing test suite does not yet contain dedicated Playwright specs for TireRig, BrakeRig, and ChainRig walkthroughs. Those mechanic checks are still covered primarily by Godot headless validation tasks.

## Screenshot + telemetry loop

`tools/visual-runtime-capture.mjs` now focuses on gameplay-relevant routes and writes:
- screenshots to `playtest_captures/runtime_screens/`
- route telemetry to `telemetry/route_capture_report.json`

The capture report includes:
- route and viewport coverage
- repeat iteration index for stress reloads
- page errors
- request failures
- warning/error console messages

`tools/summarize-route-capture.ps1` condenses that into `telemetry/route_capture_summary.json`.

## CUDA analysis posture

CUDA remains available through `py -3` / `C:\Python\python.exe`.
The overnight CUDA task analyzes captured screenshots in batches using PyTorch and emits `telemetry/visual_runtime_analysis.json`.

Current limitation:
- the analyzer still runs on a single CUDA device per invocation. The workstation has additional GPU headroom available, but this pass stayed scoped to stable orchestration rather than rewriting the analysis stack for multi-GPU dispatch.

## Result

VS Code is now configured for restrained overnight exploration loops:
1. run Playwright overnight sweep
2. capture gameplay-focused route screenshots
3. summarize capture telemetry
4. run CUDA visual analysis
5. review failures and weak spots in `project_audit/`, `telemetry/`, and `playtest_captures/`

This keeps the cockpit pointed at embodied repair-world quality rather than toolkit sprawl.

## Execution snapshot

One real overnight-style validation cycle was executed after configuration.

Verified runtime state during the pass:
- `node --version` -> `v22.22.3`
- `npm --version` -> `10.9.8`
- `openclaw --version` -> `OpenClaw 2026.5.12 (f066dd2)`
- `$PSVersionTable.PSVersion` -> `7.6.1`
- `py -3 -c "import torch; print(torch.cuda.is_available())"` -> `True`

Playwright overnight config discovery result:
- 5 projects (`desktop-chrome`, `tablet-portrait`, `mobile-portrait`, `mobile-landscape`, `low-res`)
- repeat-each enabled
- 100 discovered tests across 7 spec files in the current suite

Screenshot capture result:
- 50 screenshots produced
- 5 gameplay-relevant routes
- 5 viewports
- 2 repeats per route
- concurrency `8`

Telemetry findings from the first capture pass:
1. Every capture was marked noteworthy because the current digest treats warning-bearing routes as failures.
2. `/play` and `/godot-prototype?diagnostics=1` repeatedly showed aborted `index.wasm` and `index.pck` fetches during the headless screenshot pass.
3. Most routes emitted React Router v7 future-flag warnings.
4. `/play3d` emitted Three.js deprecation warnings for `THREE.Clock` and `PCFSoftShadowMap`.

CUDA analysis result:
- device used: `cuda:0`
- GPU: `NVIDIA GeForce RTX 5090`
- images analyzed: `50`
- findings emitted: `8`

Interpretation:
- the overnight cockpit is operational
- the first real pass is already surfacing runtime-noise issues worth cleanup
- the highest-value next overnight friction reduction is warning hygiene and Godot asset-fetch stability during browser route capture
