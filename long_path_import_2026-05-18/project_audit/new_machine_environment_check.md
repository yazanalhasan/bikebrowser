# New Machine Environment Check

Generated: 2026-05-17 03:13 America/Los_Angeles
Workspace: `C:\Users\admin\Documents\New project 3\bikebrowser`
Branch: `repair/runtime-canonicalization`
Commit: `620d0a123bed193bf4a2c2b30989bced40950284`
Remote: `https://github.com/yazanalhasan/bikebrowser.git`

## Tool Verification

| Tool | Status | Path | Version / Notes |
| --- | --- | --- | --- |
| node | Partial | `C:\Program Files\nodejs\node.exe` and `C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64\node.exe` | System Node is `v25.9.0`; user-scope Node 20 was installed and can be activated by refreshing PATH. |
| npm | Partial | Both system and user-scope Node installs provide npm | System npm is `11.12.1`; Node 20 npm is `10.8.2`. |
| python | OK | `C:\Python\python.exe` | `Python 3.11.9` |
| git | OK | `C:\Program Files\Git\cmd\git.exe` | `git version 2.54.0.windows.1` |
| ffmpeg | OK | `C:\Users\admin\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe` | `ffmpeg version 8.1.1-full_build-www.gyan.dev` |
| godot | OK | `C:\Users\admin\AppData\Local\Microsoft\WinGet\Links\godot.exe` | `4.6.2.stable.official.71f334935` |
| blender | Missing | n/a | `blender` is not on PATH. Full workstation parity is not yet established for Blender-dependent tasks. |
| pwsh | OK | `C:\Program Files\WindowsApps\Microsoft.PowerShell_7.6.1.0_x64__8wekyb3d8bbwe\pwsh.exe` | `PowerShell 7.6.1` |

## PATH Notes

- Godot and FFmpeg resolve through WinGet link shims and are available from the repo root terminal.
- Blender is the only requested executable that is currently missing from PATH.
- A user-scope Node 20 install is now present, but the system-wide Node 25 install is still on disk. Any shell that does not refresh PATH may continue to resolve Node 25 first.

## GPU Visibility

`nvidia-smi` reports both discrete GPUs and the OS also reports both adapters through `Win32_VideoController`.

| Index | GPU | Driver | Total VRAM | Current Use |
| --- | --- | --- | --- | --- |
| 0 | NVIDIA GeForce RTX 5090 | `591.86` | `32607 MiB` | `0 MiB` |
| 1 | NVIDIA GeForce RTX 5090 | `591.86` | `32607 MiB` | `0 MiB` |

Windows also reports an integrated `Intel(R) Graphics` adapter. No GPU processes were active at audit time.

## CUDA Visibility

| Item | Value |
| --- | --- |
| Driver-reported CUDA | `13.1` |
| `CUDA_PATH` | `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9` |
| `nvcc` on PATH | No |
| `nvcc --version` | `Cuda compilation tools, release 12.9, V12.9.41` |

CUDA is installed and usable when addressed directly from the installed toolkit location, but `nvcc` is not currently exposed on PATH.

## Immediate Parity Risks

- Blender is not available on PATH, so Blender-based asset workflows cannot yet be considered parity-complete.
- CUDA toolkit binaries are installed but not fully PATH-exposed.
- `npm install --foreground-scripts` stalls during npm's `idealTree buildDeps` / `reify moves {}` phase under both Node `v25.9.0` and user-scope Node `v20.20.2`, so frontend parity is not yet established.
- Godot headless editor mode cannot create `BikeBrowserWorld/.godot`, which blocks import regeneration, clean validation, and export parity on this workstation.

## Remediation Attempt Summary

- Attempted to install `nvm-windows`, but the installer required an elevated UAC prompt and was cancelled.
- Installed `OpenJS.NodeJS.20` successfully in user scope via WinGet.
- Verified Node 20 activation in a refreshed shell: `node v20.20.2`, `npm 10.8.2`.
- Re-ran `npm install --foreground-scripts --loglevel verbose` under Node 20; the install still stalled before package extraction.
