# Ideal BikeBrowser Pipeline

Date: 2026-05-26

## Production Architecture

```text
ComfyUI / SDXL / Flux
  -> concept, composition, staging, style exploration

Blender
  -> mechanical reference, perspective, simple object studies

Aseprite
  -> final authored pixel art, spritesheets, runtime source files

Godot
  -> scene composition, mechanics, quest integration

Playwright + CUDA
  -> runtime screenshots, visual QA, clustering, readability checks
```

## Gameplay Iteration

1. Edit Godot scene/script/data.
2. Run focused headless Godot check.
3. Export web build.
4. Run targeted Playwright route/prompt/viewport smoke.
5. Capture screenshots.
6. Run CUDA visual analysis for active area, contrast, and duplicate states.
7. Human playtest only after the automated surface is clean.

## Art Iteration

1. Generate or sketch concepts in ComfyUI.
2. Use Blender only when perspective/mechanics need reference.
3. Author final sprite in Aseprite.
4. Export PNG/JSON beside `.aseprite`.
5. Add asset contract check.
6. Verify in Godot and browser screenshot.

## Overnight Autonomous Work

Recommended overnight sequence:

1. `npm run build`
2. Godot validation pack
3. `tools/export-godot-web.ps1`
4. Playwright overnight sweep
5. screenshot capture
6. telemetry summary
7. CUDA visual analysis
8. Telegram summary with:
   - pass/fail
   - screenshots generated
   - top visual regressions
   - next human-review queue

## AI-Agent Workflow

- Codex: implementation, tests, repo edits.
- OpenClaw: governance/status/overnight coordination.
- ComfyUI: concept image generation.
- CUDA Python: visual QA and clustering.
- Human: art approval and embodied-learning comprehension review.

## Canonical Rule

Runtime truth is the browser/Godot screenshot, not the source asset, prompt, or mission JSON. Every major art or quest change should end with a player-facing screenshot or deterministic state validation.

## ComfyUI Concept Batch Loop

1. Create a batch notes folder with `tools\comfyui-batch-notes.ps1`.
2. Generate 20 concepts in the correct topical folder.
3. Move selected concepts into `C:\AI\BikeBrowserConcepts\04_selected`.
4. Write Aseprite briefs into `C:\AI\BikeBrowserConcepts\05_aseprite_briefs`.
5. Reject outputs that fail mechanical truth, even if visually attractive.
6. Use authored Aseprite files as the only production source.
7. Integrate into Godot and validate with Playwright/CUDA screenshots.

## Recommended Overnight Architecture

- GPU 0: ComfyUI batch generation, only when explicitly scheduled.
- GPU 1: screenshot analysis, clustering, and visual regression.
- OpenClaw: report-only orchestration and Telegram status.
- Codex: implementation, scripts, validation, and audit updates.
- Human review: select concepts, approve briefs, and playtest comprehension.
