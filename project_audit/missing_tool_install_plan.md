# Missing Tool Install Plan

Date: 2026-05-26

## Completed In This Pass

- Created `C:\AI`.
- Cloned ComfyUI to `C:\AI\ComfyUI`.
- Created Python 3.11 venv.
- Installed RTX 5090-capable PyTorch cu128 stack.
- Installed ComfyUI requirements.
- Installed ComfyUI Manager.
- Installed SDXL base checkpoint.
- Installed ControlNet Aux, Advanced ControlNet, and IPAdapter custom nodes.
- Created BikeBrowser concept folders:
  - `C:\AI\BikeBrowserConcepts\bridge`
  - `C:\AI\BikeBrowserConcepts\tire_repair`
  - `C:\AI\BikeBrowserConcepts\chain_repair`
  - `C:\AI\BikeBrowserConcepts\notebook`
  - `C:\AI\BikeBrowserConcepts\npcs`
  - `C:\AI\BikeBrowserConcepts\workshop`
- Created `C:\AI\start_comfyui.ps1`.

## Still Needed

1. Fix Hugging Face model approval/auth:
   ```powershell
   C:\AI\ComfyUI\venv\Scripts\hf.exe auth login --force
   ```
   The token used during setup still did not have access to `black-forest-labs/FLUX.1-dev`; accept/request access on Hugging Face first.

2. Download Flux after approval:
   ```powershell
   C:\AI\ComfyUI\venv\Scripts\hf.exe download black-forest-labs/FLUX.1-dev --local-dir C:\AI\ComfyUI\models\checkpoints\flux-dev
   ```

3. Download ControlNet models:
   - canny
   - lineart
   - depth
   - softedge

4. Add Blender to PATH or create `C:\AI\blender.ps1`.

5. Create canonical BikeBrowser ComfyUI workflows and store them under:
   ```text
   C:\AI\BikeBrowserConcepts\workflows
   ```

## Not Recommended

- Do not make ComfyUI output the final runtime sprite without Aseprite cleanup.
- Do not let AI-generated visuals overwrite `BikeBrowserWorld\Assets` without manifest + screenshot validation.
- Do not install multiple competing SD web UIs until ComfyUI is stable and productive.
