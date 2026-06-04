# ComfyUI Script Integration

Date: 2026-05-26

## Scripts Created

| Script | Purpose |
| --- | --- |
| `C:\dev\bikebrowser\tools\start-comfyui.ps1` | Starts ComfyUI from `C:\AI\ComfyUI` if port 8188 is not already listening |
| `C:\dev\bikebrowser\tools\comfyui-healthcheck.ps1` | Calls `/system_stats` and lists active devices/checkpoints |
| `C:\dev\bikebrowser\tools\open-bikebrowser-concepts.ps1` | Opens `C:\AI\BikeBrowserConcepts` |
| `C:\dev\bikebrowser\tools\comfyui-batch-notes.ps1` | Creates a timestamped concept batch folder and notes file |

## Current Startup Recommendation

Use this for RTX 5090 stability until xformers/Triton support catches up:

```powershell
cd C:\AI\ComfyUI
.\venv\Scripts\python.exe main.py --listen 127.0.0.1 --port 8188 --disable-xformers
```

The repo helper currently starts the standard server. If xformers errors return, launch with the manual command above or extend `tools\start-comfyui.ps1` with a `-DisableXformers` switch.

## Healthcheck

```powershell
powershell -ExecutionPolicy Bypass -File C:\dev\bikebrowser\tools\comfyui-healthcheck.ps1
```

Expected healthy result:

- ComfyUI version present
- PyTorch version present
- two RTX 5090 devices listed
- `sd_xl_base_1.0.safetensors` listed as a checkpoint

## Batch Notes

```powershell
powershell -ExecutionPolicy Bypass -File C:\dev\bikebrowser\tools\comfyui-batch-notes.ps1 -Track tire_repair
```

Use the generated notes file to record prompt, selected outputs, rejected artifacts, and Aseprite handoff decisions.
