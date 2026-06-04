# OpenClaw / Codex / AI Tooling Audit

Date: 2026-05-26

## Installed

| Tooling | Status |
| --- | --- |
| OpenClaw | Installed at `C:\OpenClaw`, CLI working |
| Telegram governance | Working via `tools/send-openclaw-report.ps1` and `C:\OpenClaw\integrations\telegram` |
| Codex | Installed, plugins available |
| Claude Code | Installed, VS Code extension present |
| VS Code orchestration | Tasks exist for build, Godot checks, Playwright, screenshot capture, telemetry, CUDA visual analysis |
| Ollama | Client installed, server not running during audit |
| Local models | OCR/speech/embedding/LLM models exist under `C:\models` and other medical chatbot project folders; not yet organized for BikeBrowser |

## Useful Existing Agents / Plugins

- Game Studio skills for playtesting and game-specific frontend/game work.
- Browser plugin for local route inspection.
- GitHub plugin available.
- Hugging Face plugin available.
- Claude memory plugin available.
- OpenClaw `Creativity-Agent.md` exists.

## Stable Orchestration Pattern

Use Codex for implementation and repo-grounded validation. Use OpenClaw/Telegram for governance summaries and overnight status. Use Playwright and Godot checks as truth signals. Use ComfyUI and Blender for creative inputs, not unchecked runtime replacement.

## Recommended Agent Roles

- Implementation agent: code, scene, data, tests.
- Art director agent: reviews ComfyUI/Blender/Aseprite outputs against style and readability.
- Validation agent: runs Godot checks, Playwright, export, screenshot analysis.
- Playtest agent: produces severity-ordered human-facing findings.
- Screenshot analyst: CUDA-assisted blankness, active-area, contrast, clustering, duplicate-state detection.

## Fragile Areas

- HF auth is invalid.
- Full human-style Godot input completion harness is still incomplete.
- Some screenshot checks prove route/pixel existence but not enough semantic acceptance, such as the Mrs. Ramirez prompt smoke noted in playtest.

## ComfyUI Integration Update

ComfyUI is now a first-class concept/staging system in the OpenClaw/Codex workflow:

- Orchestrator requests a named concept batch.
- ComfyUI generates staging references into `C:\AI\BikeBrowserConcepts`.
- Visual-Truth-Agent reviews outputs against mechanic readability.
- Art-Director-Agent selects concepts and writes Aseprite briefs.
- Aseprite-Agent or human artist authors final `.aseprite` production art.
- Codex integrates exported art into Godot.
- Validation-Agent runs Godot checks, Playwright screenshots, and CUDA visual analysis.

VS Code tasks now include:

- `ComfyUI start`
- `ComfyUI healthcheck`
- `Open BikeBrowser concepts`

Important runtime note: launch ComfyUI with `--disable-xformers` on the current RTX 5090 stack until xformers/Triton support is stable for compute capability 12.0.
