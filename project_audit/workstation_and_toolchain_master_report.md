# Workstation And Toolchain Master Report

Date: 2026-05-26

## What Is Excellent Already

- Dual RTX 5090 GPUs with 32 GB VRAM each.
- CUDA toolkit and PyTorch are functional.
- Godot 4.6.2, Node 22, Playwright, Electron, OpenClaw, Codex, and Claude Code are installed.
- Aseprite CLI works and is already integrated into the project style contract.
- Blender 5.1.1 is installed and launchable by full path.
- FFmpeg is a modern CUDA-enabled build.
- VS Code already has tasks for build, validation, screenshot capture, telemetry, and CUDA analysis.
- ComfyUI is now installed, running, and connected to SDXL/ControlNet/IPAdapter-ready tooling.

## Biggest Bottlenecks

- HF auth is invalid, blocking Flux and gated model downloads.
- Blender is not on PATH.
- ControlNet model weights still need to be downloaded.
- ComfyUI workflows are not yet BikeBrowser-specific.
- Automated browser prompt tests still need stronger semantic assertions.
- Full human-style Godot input automation is incomplete.

## Highest-Value Adds

1. Fix Hugging Face auth and download Flux.1-dev.
2. Add ControlNet lineart/canny/depth/softedge weights.
3. Create BikeBrowser ComfyUI workflow JSONs.
4. Add Blender PATH/helper script.
5. Build deterministic station-substate screenshot routes for chain/tire/bridge/copper.
6. Expand CUDA visual analysis from blankness/active-area into mechanic readability and UI overlap scoring.

## What Should Become Canonical

- `C:\AI\ComfyUI` for local concept generation.
- `C:\AI\BikeBrowserConcepts` for generated concept/staging work.
- Aseprite beside every surfaced runtime PNG.
- Godot `/play` as canonical runtime.
- Playwright screenshots as player-facing truth.
- CUDA visual analysis as nightly triage.
- Telegram summaries for overnight governance.

## What Should Not Be Added Yet

- Another SD web UI competing with ComfyUI.
- Unreviewed AI sprite replacement directly into runtime assets.
- Multi-agent autonomous asset commits without screenshot approval.
- More quest data without surfaced station/interaction wiring.

## Recommended Act 1 Completion Workflow

1. Keep Act 1 implementation in Godot.
2. Use ComfyUI only for staging and reference.
3. Finalize visuals in Aseprite.
4. Enforce asset/schema/evidence checks.
5. Run Playwright and Godot validation.
6. Run a human comprehension playtest.
7. Send Telegram summary with remaining blockers.

## Current Verdict

The workstation is now an unusually strong local game-production machine. The correct production architecture is in place: ComfyUI for concepting, Blender for mechanical reference, Aseprite for final pixel art, Godot for embodied gameplay, and Playwright/CUDA for runtime truth.
