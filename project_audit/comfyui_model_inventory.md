# ComfyUI Model Inventory

Date: 2026-05-26

## Summary

Local ComfyUI has one production-usable image checkpoint installed:

- SDXL Base 1.0: usable now for concept/staging generation.

Flux is partially present only as downloaded metadata and license/readme files under a `flux-dev` folder. The actual Flux weights are not present, so local Flux workflows are blocked until Hugging Face access is approved and the model is downloaded into ComfyUI's Flux-compatible model folders.

## Inventory

| File | Folder | Size | Likely family | SDXL usable | Flux usable | Licensing note | Recommended BikeBrowser use |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `sd_xl_base_1.0.safetensors` | `C:\AI\ComfyUI\models\checkpoints` | 6.46 GiB | SDXL Base 1.0 | Yes | No | Stability AI SDXL licensing applies | Concept sheets, repair staging, notebook composition, palette exploration |
| `flux-dev\README.md` | `C:\AI\ComfyUI\models\checkpoints\flux-dev` | 4.3 KiB | Flux metadata only | No | No | Flux.1-dev non-commercial license referenced | Documentation only until weights are downloaded |
| `flux-dev\LICENSE.md` | `C:\AI\ComfyUI\models\checkpoints\flux-dev` | 18.2 KiB | Flux license only | No | No | Non-commercial license file present | License reference only |

## Empty Or Placeholder Folders

These model folders exist but currently contain only placeholder files or no usable weights:

- `models\diffusion_models`
- `models\vae`
- `models\text_encoders`
- `models\clip`
- `models\clip_vision`
- `models\controlnet`
- `models\loras`
- `models\upscale_models`
- `models\unet`
- `models\style_models`
- `models\embeddings`

## Practical Implications

- Use SDXL Base today for local BikeBrowser concept exploration.
- Do not promise local Flux until Flux weights, VAE, and text encoders are installed in ComfyUI-compatible locations.
- ControlNet custom nodes are installed, but ControlNet model weights are not present. ControlNet workflows should be treated as planned, not ready.
- LoRA and upscaling workflows are planned, not ready.

## Recommended Next Model Additions

1. Flux.1-dev weights after Hugging Face gate approval.
2. ComfyUI Flux text encoders and VAE in the expected folders.
3. ControlNet lineart/canny/depth/softedge models for bike silhouette and notebook-layout conditioning.
4. A clean pixel-art or illustration LoRA only after the base pipeline is stable.
5. One high-quality upscaler for concept board cleanup, not runtime asset replacement.
