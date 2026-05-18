# Full Runtime Resource Inventory

Date: 2026-05-17
Sprint: Full System Utilization + Autonomous Game Evolution Sprint
Scope: BikeBrowser / BikeBrowserWorld only.

## Executive Summary

The workstation is suitable for aggressive parallel validation, browser/runtime exploration, Godot export work, and CUDA-assisted screenshot or asset analysis.

The main constraint is not hardware. It is governance/tool readiness:

- Telegram report-only governance is requested, but OpenClaw currently reports no configured chat channels. Phase reports cannot be delivered until a Telegram channel/target is configured.
- Blender is installed under `C:\Program Files\Blender Foundation`, but `blender` does not resolve on PATH in this session.
- The git worktree already had pre-existing uncommitted changes before this sprint began.

## Repository State

- Repo: `C:\dev\bikebrowser`
- Branch: `repair/runtime-canonicalization`
- Remote state at start: ahead of `origin/repair/runtime-canonicalization` by 2 commits.
- Pre-existing dirty files:
  - `src/renderer/game/GameContainer.jsx`
  - `src/renderer/game/ui/gameHud.js`
  - `tests/e2e/mission-inventory-hud.smoke.spec.js`

These were not modified during Phase 1 inventory.

## CPU And Memory

- CPU: Intel Core Ultra 9 285K
- Physical cores reported: 24
- Logical processors reported: 24
- Max clock reported: 3700 MHz
- L2 cache: 40960 KB
- L3 cache: 36864 KB
- RAM: 67,938,451,456 bytes, approximately 64 GiB

Recommended use:

- Run Playwright and static scans with CPU parallelism.
- Keep Godot validation scripts serialized when they share project cache/output.
- Use CPU for repo-wide text, JSON, GDScript, and scene contract scans.

## GPU, CUDA, And PyTorch

Detected GPUs:

| Index | GPU | Driver | Memory | Free at audit | Temp | Utilization |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | NVIDIA GeForce RTX 5090 | 591.86 | 32607 MiB | 31692 MiB | 51 C | 0% |
| 1 | NVIDIA GeForce RTX 5090 | 591.86 | 32607 MiB | 31692 MiB | 34 C | 0% |

CUDA readiness:

- NVIDIA driver reports CUDA Version 13.1.
- CUDA toolkit: 12.9, `nvcc` V12.9.41.
- PyTorch: `2.8.0+cu129`.
- `torch.cuda.is_available()`: true.
- PyTorch device count: 2.
- PyTorch device names: two NVIDIA GeForce RTX 5090 devices.

Recommended use:

- Use CUDA for screenshot embedding/comparison, visual clustering, local CV checks, and batch asset validation.
- Do not force GPU usage for repo scans, JSON validation, or small deterministic tests where CPU tooling is simpler and faster.

## Node, Browser, Electron, And Build Runtime

- Node: v22.22.3
- npm: 10.9.8
- Playwright: 1.59.1
- Electron: v28.3.3
- Vite/React app scripts are present.

Important npm scripts:

- `npm run build`
- `npm run lint`
- `npm run test:e2e`
- `npm run test:e2e:smoke`
- `npm run test:e2e:playthrough`
- `npm run dev:react`
- `npm run dev:electron`
- `npm run dev:web`

Recommended use:

- Treat Playwright as the browser/runtime truth layer.
- Use screenshots, console capture, failed request capture, and canvas presence checks for regression discovery.
- Keep `/play` canonical and avoid reintroducing app-shell/dashboard dominance.

## Godot Runtime

- Godot: 4.6.2 stable official, build `71f334935`.
- Headless boot of `BikeBrowserWorld` succeeds.
- Runtime boot loaded 18 missions:
  - `algae_bloom_source`
  - `bike_safety_check`
  - `bridge_material_test`
  - `bridge_quest_1`
  - `bridge_quest_2`
  - `bridge_quest_3`
  - `bridge_quest_4`
  - `bridge_quest_5`
  - `chain_repair`
  - `copper_rock_id`
  - `desert_plant_observation`
  - `first_safety_check`
  - `flat_tire_repair`
  - `mine_cart_repair`
  - `test_water_quality`
  - `track_the_animal`
  - `water_sample_observation`
  - `workshop_first_build`
- Quest validation: 0 errors, 0 warnings.
- RuntimeValidator summary:
  - errors: 0
  - warnings: 1
  - quests loaded: 18
  - dialogue files: 25
  - regions: 7
  - audio mappings: 7/7

Known headless shutdown noise:

- Godot reports one leaked ObjectDB/resource-at-exit message after validation. Existing audits indicate this is expected shutdown noise unless RuntimeValidator reports errors.

Recommended use:

- Use Godot headless checks as the first validation layer for embodied systems.
- Re-export web after source changes before judging `/play`/iframe parity.

## Godot Validation And Export Surface

Tracked validation scripts include:

- `BikeBrowserWorld/tests/vertical_slice_check.gd`
- `BikeBrowserWorld/tests/brake_rig_state_check.gd`
- `BikeBrowserWorld/tests/chain_rig_state_check.gd`
- `BikeBrowserWorld/tests/tire_rig_state_check.gd`
- `BikeBrowserWorld/tests/chain_hotspot_embodied_check.gd`
- `BikeBrowserWorld/tests/interaction_overlap_check.gd`
- `BikeBrowserWorld/tests/input_prompt_mapping_check.gd`
- `BikeBrowserWorld/tests/safety_check_brake_integration_check.gd`
- `BikeBrowserWorld/project_audit/runtime_repair_smoke.gd`

Export tooling:

- `tools/export-godot-web.ps1` exports `BikeBrowserWorld` to `public/godot/BikeBrowserWorld/`.
- Prior audits identify export freshness as load-bearing for `/play` and `/godot-prototype` runtime truth.

Recommended use:

- Run targeted Godot checks after each embodied-system change.
- Run `tools/export-godot-web.ps1` after any Godot source or asset change that must be reflected in browser play.

## Asset, Animation, And Media Tools

- Aseprite: 1.3.17.2-x64, resolves in this session.
- FFmpeg: 8.1.1 full build, resolves in this session.
- Blender: installed under `C:\Program Files\Blender Foundation`, but `blender` does not resolve on PATH in this session.
- BikeBrowserWorld includes Aseprite import tooling/addons.

Recommended use:

- Use Aseprite for restrained sprite readability, mechanic-eye overlays, deformation frames, contact patches, and tactile state diagrams.
- Use Blender only after PATH or explicit executable path is resolved.
- Use FFmpeg for playtest capture processing and short before/after clips if useful.

## OpenClaw, Codex, Claude, And AI Runtimes

Available CLIs:

- OpenClaw: 2026.5.12
- Codex CLI: 0.130.0
- Claude Code: 2.1.143

OpenClaw runtime:

- Gateway reachable on local loopback.
- Active agent workspace: main.
- Enabled plugins: `codex`, `openai`, `memory-core`.
- Doctor warnings:
  - bundled provider discovery still in legacy compatibility mode while `plugins.allow` is restrictive
  - personal Codex assets exist outside isolated OpenClaw agent homes
  - no command owner configured
- Skills eligible: 9.
- Plugins loaded: 3, disabled: 87, errors: 0.
- Chat channels: none configured.

Recommended AI routing:

- Use GPT-5.5/Codex for architecture, integration judgment, precise patches, and validation loops.
- Use Claude Code for broad implementation only when a bounded non-overlapping change set is useful.
- Use local CUDA/PyTorch for mechanical screenshot analysis and asset similarity rather than spending frontier tokens on bulk visual comparison.

## Telemetry And Runtime Observability

Observed telemetry/observability systems:

- `RuntimeValidator` autoload in Godot.
- `PlaytestRigTelemetry` for rig state observation.
- `window.__UX_AUDIT__` from the React runtime audit hook.
- Playwright smoke/playthrough tests.
- Godot export `version.json` provenance.

Recommended use:

- Treat telemetry as a playtest-readiness asset, not debug clutter.
- Keep debug surfaces hidden by default.
- Use telemetry to answer child playtest questions: where the player hesitated, what they inspected, which physical checks they completed, and where recovery was needed.

## Governance Status

Telegram report-only governance was requested for this sprint.

Current status:

- `openclaw channels list`: no configured chat channels.
- `openclaw channels status`: gateway reachable, but no Telegram channel is available.

Impact:

- Phase reports cannot currently be sent through Telegram.
- This is a governance blocker, not a game/runtime blocker.

Required follow-up:

- Configure an OpenClaw Telegram channel and target, or provide the exact reporting target already used by this project.

## Phase 1 Readiness Verdict

Phase 1 inventory is complete enough to proceed.

Proceed with:

1. Full gameplay/system exploration.
2. Baseline validation ladder.
3. Playwright and Godot runtime mapping.
4. Systemic bug discovery.
5. Small, checkpointed improvements that preserve the canonical `/play` experience.

Do not proceed with:

- Public debug exposure.
- Telegram assumptions without a configured channel.
- Blender-dependent work until PATH or executable resolution is fixed.
