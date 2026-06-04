# ComfyUI Validation Report

Date: 2026-05-26

## Install Location

Validated local install:

- `C:\AI\ComfyUI`
- Python: `C:\AI\ComfyUI\venv\Scripts\python.exe`
- Start script: `C:\AI\start_comfyui.ps1`
- BikeBrowser repo helper: `C:\dev\bikebrowser\tools\start-comfyui.ps1`

Other common locations were not needed because the active install is complete at `C:\AI\ComfyUI`.

## Server

ComfyUI starts and responds at:

- `http://127.0.0.1:8188`

Validated endpoints:

- `/system_stats`
- `/object_info/CheckpointLoaderSimple`
- `/object_info/SaveImage`

## Version And Runtime

Observed from `/system_stats` and startup logs:

- ComfyUI: `0.22.0`
- Frontend package: `1.44.19`
- Workflow templates: `0.9.82`
- Python: `3.11.9`
- PyTorch: `2.11.0+cu128`
- RAM: about 64 GB

## GPU Status

ComfyUI and PyTorch both see two GPUs:

- `cuda:0 NVIDIA GeForce RTX 5090`, about 31.8 GiB VRAM
- `cuda:1 NVIDIA GeForce RTX 5090`, about 31.8 GiB VRAM

ComfyUI is usable for local SDXL concept generation. The current launch should prefer PyTorch attention on this 5090 stack because xformers reported unsupported attention operators for compute capability 12.0.

Recommended startup flag for now:

```powershell
python main.py --listen 127.0.0.1 --port 8188 --disable-xformers
```

## Directories

Present:

- `C:\AI\ComfyUI\models`
- `C:\AI\ComfyUI\custom_nodes`
- `C:\AI\ComfyUI\output`
- `C:\AI\ComfyUI\input`
- `C:\AI\ComfyUI\user`

Custom nodes present:

- `ComfyUI-Manager`
- `comfyui_controlnet_aux`
- `ComfyUI-Advanced-ControlNet`
- `ComfyUI_IPAdapter_plus`

## Generation Test

Attempt 1:

- Model: `sd_xl_base_1.0.safetensors`
- Workflow: `C:\AI\BikeBrowserConcepts\02_workflows\sdxl_tire_repair_smoke_api_workflow.json`
- Result: blocked by xformers operator support on RTX 5090.

Attempt 2:

- Relaunched ComfyUI with `--disable-xformers`
- Result: generation succeeded
- Output copied to `C:\AI\BikeBrowserConcepts\tire_repair\sdxl_smoke_tire_repair_00001_.png`

## Validation Conclusion

ComfyUI is locally usable as a BikeBrowser concept/staging layer. SDXL generation works when ComfyUI is launched with PyTorch attention. Flux is not locally usable yet because the gated model repository has not been fully approved/downloaded into the correct model folders.
