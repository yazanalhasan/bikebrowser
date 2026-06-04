# ComfyUI Install Report

Date: 2026-05-26

## Installed

- `C:\AI\ComfyUI`
- `C:\AI\ComfyUI\venv`
- `C:\AI\start_comfyui.ps1`
- `C:\AI\BikeBrowserConcepts`

## Verified

- ComfyUI serves at `http://127.0.0.1:8188`.
- PyTorch in venv sees both RTX 5090 GPUs.
- ComfyUI detects both GPUs and enables xformers attention.
- ComfyUI Manager loads.
- ControlNet Aux loads.
- Advanced ControlNet loads.
- IPAdapter Plus loads.
- SDXL base checkpoint exists at:
  `C:\AI\ComfyUI\models\checkpoints\sd_xl_base_1.0.safetensors`

## Warnings

- ComfyUI reports PyTorch cu130+ would enable newer optimized CUDA operations.
- Triton is not available on this Windows stack; xformers still loads.
- Flux.1-dev is gated and was not downloaded. A provided token was tried, but Hugging Face still returned repository approval required.

## Start Command

```powershell
powershell -ExecutionPolicy Bypass -File C:\AI\start_comfyui.ps1
```

## URL

```text
http://127.0.0.1:8188
```
