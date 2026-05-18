# Overnight Full-Game Pass Summary

Date: 2026-05-18
Branch: repair/runtime-canonicalization
Mode: coordinated Codex + OpenClaw exploration and refinement

## What Was Explored

- Baseline health: git status, Node, npm, OpenClaw, Vite build, Playwright e2e, Godot validation, and Godot web export.
- Route surface sweep: `/`, `/play`, `/legacy-play`, `/godot-prototype`, `/play3d`, `/shop`, `/safe-search`, `/saved-notes`, `/spelling-trainer`, `/youtube/search`, `/youtube/watch/:id`, project builder, and build planner.
- Visual sweep: 13 routes across desktop, wide, tablet, and mobile viewports for 52 screenshots.
- GPU-assisted analysis: CUDA screenshot analysis on RTX 5090 for sparse/blank screens, mobile framing, and HUD density flags.
- Godot world systems: NeighborhoodStreet, ZuzuGarage, side-region registry, BrakeRig, ChainRig, TireRig, transition zones, interaction overlap, and vertical slice checks.
- Walkthrough styles: normal child path, low-attention path, boundary/wander path, quest completion path, reload/re-entry path, mobile path, legacy tooling path, and error recovery path.

## What Was Fixed

- `/youtube/search` no longer sits in a loading state when opened with no query. It now presents a calm search invitation instead of implying work is happening.
- `/play3d` no longer exposes debug-control copy by default. The hint remains available only behind `?controls=1`.
- `tools/visual-runtime-capture.mjs` now covers a broader route set and runs bounded parallel captures through `BIKEBROWSER_AUDIT_CONCURRENCY`.
- Added route-coherence Playwright regression coverage for the YouTube empty state and `/play3d` debug leakage.

## What Improved Most

- Route coherence improved: two prototype-feeling public surfaces now behave more intentionally.
- The audit harness improved: route captures now exercise 13 routes over 4 viewports with high-parallel Playwright contexts.
- Regression coverage improved: e2e coverage moved from 8 route tests at baseline to 10 passing tests after the route-coherence fixes.
- External playtest readiness improved mainly through reduced confusing states and stronger documentation of what still needs attention.

## What Remains Broken Or Risky

- `/play` portrait and tablet framing still show large inactive vertical margins. This is the highest-value remaining child-facing issue.
- Several utility routes still feel sparse in empty states, especially saved notes, safe search, build planner, and no-query YouTube search after the loading fix.
- Spelling trainer still probes an optional local upload helper and logs connection failures when that helper is absent.
- YouTube embed/stat calls can abort in headless route sweeps due third-party network behavior.
- Side regions should remain tightly gated until each has a clear embodied-learning reason to be visible.

## Ready For Playtest

- Desktop/wide `/play` is healthy enough for controlled internal child-path rehearsal.
- BrakeRig, ChainRig, TireRig, vertical slice, and interaction-overlap validations pass.
- `/legacy-play` remains available as contained fallback/tooling.
- Godot web export completes successfully.

## Should Be Deferred

- Expanding new regions or new vehicle systems.
- Publicly exposing SystemShowcase-style surfaces.
- Broad reward or inventory additions before progression invariants get a dedicated pass.
- Heavy aesthetic rework that does not directly improve tactile, calm, physically understandable repair.

## Validation Results

- Node: v22.22.3
- npm: 10.9.8
- OpenClaw: 2026.5.12 (f066dd2)
- Godot: 4.6.2.stable.official.71f334935
- `npm run build`: pass
- `npm run test:e2e`: pass, 10/10
- Playwright route coherence smoke: pass, 2/2
- Godot editor load: pass
- `runtime_repair_smoke.gd`: pass
- `vertical_slice_check.gd`: pass
- `brake_rig_state_check.gd`: pass
- `chain_rig_state_check.gd`: pass
- `tire_rig_state_check.gd`: pass
- `chain_hotspot_embodied_check.gd`: pass
- `interaction_overlap_check.gd`: pass
- `tools/export-godot-web.ps1`: pass
- Electron syntax check: pass for `src/main/main.js` and `src/preload/preload.js`

Known non-blocking validation noise:

- Vite still reports the CJS Node API deprecation warning.
- `postcss.config.js` still reports typeless package metadata warning.
- Vite still reports large chunk warnings.
- Godot still prints known shutdown ObjectDB/resource messages after successful script exits.

## Commits Created

- `5ac5519` - `checkpoint: overnight baseline before game sweep`
- `42c6285` - `fix: improve overnight route coherence`
- `1d4c823` - `audit: add overnight exploration reports`
- Final report commit - `audit: add overnight full game pass summary`

## Next Recommended Sprint

Focus the next sprint on first-15-minutes child readability:

- Fix `/play` portrait/tablet Godot framing and mechanic-eye camera composition.
- Add a reload/re-entry save smoke around the first quest path.
- Quiet optional helper polling so disconnected local services do not look like runtime failure.
- Give sparse empty-state routes one useful child-facing action each, without adding dashboard energy.
- Keep side regions gated until each region supports the warm embodied mechanical learning loop.
