# Runtime Environment Standardization

Date: 2026-05-18

## Canonical standards

Standardized developer environment for BikeBrowser workflows:
- repo root: `C:\dev\bikebrowser`
- shell: PowerShell 7
- Node runtime: 22.22.3
- npm global shim path: `C:\Users\admin\AppData\Roaming\npm`
- OpenClaw runtime: current global install resolving through Node 22
- Godot executable: `C:\Users\admin\AppData\Local\Microsoft\WinGet\Links\godot.exe`
- Python launcher for tooling: `py -3`

## Verification snapshot

Node and npm:
- `node --version` -> `v22.22.3`
- `npm --version` -> `10.9.8`
- `where.exe node` -> Node 22 first, Node 20 second

OpenClaw:
- `openclaw --version` -> `OpenClaw 2026.5.12 (f066dd2)`

Python / CUDA:
- `py -3 -c "import sys, torch; ..."` -> interpreter `C:\Python\python.exe`
- `torch.cuda.is_available()` -> `True`
- detected GPU -> `NVIDIA GeForce RTX 5090`

## Tooling consequences

1. VS Code integrated terminals now inherit a workspace-local PATH prefix that keeps Node 22 canonical even if a stale shell would otherwise drift.
2. Task and launch environments use the same PATH prefix, so Playwright, Electron, OpenClaw, and npm commands share one runtime assumption.
3. Telemetry and CUDA-oriented screenshot analysis should use `py -3`, not plain `python`, because the Python Store alias is still intercepting `python`.

## Known noncanonical residue

- Node 20 remains installed for compatibility testing only.
- The long-path clone still exists on disk, but it is no longer the configured VS Code cockpit target.

## Standardization verdict

Runtime standardization is complete for the canonical workstation workflow:
- PowerShell 7 canonical
- Node 22 canonical
- OpenClaw canonical runtime coherent
- npm global shims restored
- GPU tooling reachable through `py -3`
