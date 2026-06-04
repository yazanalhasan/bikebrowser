# ComfyUI Workflow Inventory

Date: 2026-05-26

## Found Workflows

| Workflow | Location | Classification | Status | Notes |
| --- | --- | --- | --- | --- |
| `sdxl_tire_repair_smoke_api_workflow.json` | `C:\AI\BikeBrowserConcepts\02_workflows` | SDXL text-to-image | Working with `--disable-xformers` | Minimal API workflow for one tire repair mat smoke generation |

## Not Found Yet

No local workflow JSONs were found for:

- SDXL image-to-image
- Flux text-to-image
- Flux image-to-image
- ControlNet lineart/canny/depth
- Upscaling
- Inpainting

## Workflow Policy

BikeBrowser workflows should live under:

- `C:\AI\BikeBrowserConcepts\02_workflows`

Workflow names should include:

- model family: `sdxl`, `flux`
- purpose: `tire_repair`, `chain_repair`, `bridge_notebook`
- mode: `txt2img`, `img2img`, `controlnet`, `upscale`, `inpaint`
- stability: `smoke`, `draft`, `approved`

Example:

```text
sdxl_tire_repair_txt2img_draft_v001.json
```
