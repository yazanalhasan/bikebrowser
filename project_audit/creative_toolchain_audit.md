# Creative Toolchain Audit

Date: 2026-05-26

## Installed And Working

| Tool | Status | Notes |
| --- | --- | --- |
| Aseprite | Working | `C:\Program Files\Aseprite\Aseprite.exe`, version 1.3.17.2. CLI export/spritesheet smoke passed. |
| Blender | Working by full path | Blender 5.1.1 at `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe`; not on PATH. |
| FFmpeg | Working | 8.1.1 full build with CUDA/NVENC/NVDEC support. |
| ComfyUI | Installed and running | Manual install at `C:\AI\ComfyUI`, serving `http://127.0.0.1:8188`. |
| ComfyUI Manager | Installed | `C:\AI\ComfyUI\custom_nodes\ComfyUI-Manager`, loads at startup. |
| SDXL Base | Installed | `C:\AI\ComfyUI\models\checkpoints\sd_xl_base_1.0.safetensors`. |
| ControlNet Aux | Installed | `comfyui_controlnet_aux`, loads and detects ONNXRuntime acceleration providers. |
| Advanced ControlNet | Installed | `ComfyUI-Advanced-ControlNet`, loads. |
| IPAdapter Plus | Installed | `ComfyUI_IPAdapter_plus`, loads. |
| Diffusers stack | Installed in ComfyUI venv | `diffusers`, `accelerate`, `safetensors`, `xformers`. |

## Partially Configured

| Tool | Status | Next Step |
| --- | --- | --- |
| Blender CLI | Installed but not PATH-wired | Add Blender folder to PATH or create a repo/local helper alias. |
| Hugging Face CLI | Installed, gated model access not approved | Run `hf auth login --force` after approving gated model access. |
| Flux | Metadata only | `FLUX.1-dev` still requires Hugging Face account approval before model download. |
| ControlNet model weights | Directories/custom nodes ready | Download canny, lineart, depth, and softedge model weights. |
| ComfyUI workflows | Templates installed | Create BikeBrowser-specific workflow JSONs. |

## Missing / Recommended

- Flux.1-dev model weights after HF auth.
- ControlNet lineart/canny/depth/softedge weights.
- A few reusable BikeBrowser ComfyUI workflows:
  - repair mat concept
  - mechanic-eye close-up
  - bridge notebook page
  - NPC mood sheet
  - mobile readability composition

## Production Rule

ComfyUI is for concept/staging exploration, not final runtime sprites. Final game art should still be authored or cleaned in Aseprite, committed beside source `.aseprite`, then validated in Godot and browser screenshots.
