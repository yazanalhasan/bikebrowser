# GPU CUDA PyTorch Audit

Date: 2026-05-26

## NVIDIA Runtime

| Area | Result |
| --- | --- |
| Driver | 591.86 |
| Driver-advertised CUDA | 13.1 |
| CUDA Toolkit | 12.9 at `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9` |
| `nvcc` | Works, reports CUDA 12.9 V12.9.41 |
| Nsight | Nsight Compute 2025.2.0 and Nsight Systems 2025.1.3 installed |
| TensorRT | Not found in PATH/common NVIDIA folders |

## Global Python

Global `C:\Python` has `torch 2.8.0+cu129`. It sees both RTX 5090s and passed CUDA matmul smoke on both devices.

## ComfyUI Venv

`C:\AI\ComfyUI\venv` has:

- `torch 2.11.0+cu128`
- `torchvision 0.26.0+cu128`
- `torchaudio 2.11.0+cu128`
- CUDA visible: yes
- Device count: 2
- Device 0: NVIDIA GeForce RTX 5090, 31.84 GB
- Device 1: NVIDIA GeForce RTX 5090, 31.84 GB
- CUDA matmul smoke: pass on both GPUs

## Practical GPU Strategy

- GPU 0: ComfyUI interactive generation.
- GPU 1: Playwright screenshot analysis, visual clustering, embeddings, multimodal analysis, or batch QA.
- Multi-GPU diffusion is not the first target; process-level split is simpler and more stable.

## Caveat

ComfyUI warns that PyTorch cu130+ would unlock newer optimized CUDA operations. The requested cu128 stack is functional, but future RTX 5090 optimization may benefit from a later PyTorch/CUDA wheel once stable.
