# Node Runtime Alignment

Date: 2026-05-17

## Goal

Align the workstation so PowerShell, cmd-based launchers, OpenClaw, and the generated gateway all use the same supported Node runtime.

## Changes made

1. Installed Node 22 user-scoped via WinGet:
   - package: `OpenJS.NodeJS.22`
   - version: `22.22.3`

2. Reordered persisted user PATH so Node 22 resolves before Node 20.

3. Updated the user-local OpenClaw launchers to point to Node 22:
   - `C:\Users\admin\AppData\Roaming\npm\openclaw.ps1`
   - `C:\Users\admin\AppData\Roaming\npm\openclaw.cmd`
   - `C:\Users\admin\.openclaw\gateway.cmd`

These are environment/runtime launch surfaces, not OpenClaw internal session logic.

## Final alignment evidence

Shell runtime:
- `node --version` -> `v22.22.3`

OpenClaw main process:
- executable path -> Node 22 WinGet install

OpenClaw gateway process:
- executable path -> Node 22 WinGet install

## Not used

- `nvm` is not installed on this workstation
- no alternative Node manager was active

## Recommendation

Treat Node 22 as the supported OpenClaw runtime on this machine.

Do not rely on the machine-wide `C:\Program Files\nodejs\node.exe` installation for OpenClaw unless it is also updated to a supported version.
