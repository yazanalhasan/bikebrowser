# ComfyUI Pipeline Integration

Date: 2026-05-26

## Decision

BikeBrowser will use ComfyUI as a disciplined visual ideation engine, not an uncontrolled asset dump.

## Canonical Roles

| Tool | Role |
| --- | --- |
| ComfyUI / SDXL / Flux | concept generation, staging, mood, composition, palette, silhouette exploration |
| Blender | mechanical and perspective reference |
| Aseprite | final authored pixel-art source |
| Godot | runtime implementation and scene truth |
| Playwright + CUDA | visual QA, screenshots, clustering, regression checks |

## Installed Local Layer

- ComfyUI path: `C:\AI\ComfyUI`
- Concept workspace: `C:\AI\BikeBrowserConcepts`
- Working checkpoint: `sd_xl_base_1.0.safetensors`
- Flux: partially downloaded metadata only, local generation blocked until gated weights are approved/downloaded
- Custom nodes: Manager, ControlNet Aux, Advanced ControlNet, IPAdapter

## Production Loop

1. Open a concept batch in `C:\AI\BikeBrowserConcepts`.
2. Generate concepts with SDXL or Flux.
3. Select 3 to 5 outputs.
4. Create Aseprite briefs.
5. Author final art in Aseprite.
6. Export final PNG/JSON.
7. Integrate into Godot.
8. Capture Playwright screenshots.
9. Run Visual-Truth-Agent review.
10. Commit only runtime-authored outputs and audit notes.

## Guardrails

- No raw ComfyUI output directly into `BikeBrowserWorld\Assets`.
- No generated text in runtime notebook pages.
- No bike mechanic accepted without screenshot validation.
- No concept selected unless it improves mechanic readability.
- Aseprite source is required for surfaced production assets.

## First Target Areas

1. Tire repair close-up repair mat.
2. Chain repair mechanic-eye drivetrain.
3. Mr. Chen bridge notebook page.
4. Regional science evidence boards.
5. NPC mentor mood studies.
