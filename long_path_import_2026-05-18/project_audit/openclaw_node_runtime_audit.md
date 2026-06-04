# OpenClaw Node Runtime Audit

Date: 2026-05-17

## Initial state

Observed Node installations:
- `C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64\node.exe`
- `C:\Program Files\nodejs\node.exe`

Observed versions:
- shell default at start of audit: `node v20.20.2`, `npm 10.8.2`
- machine-wide install at `C:\Program Files\nodejs\node.exe`: `node v25.9.0`, `npm 11.12.1`

OpenClaw resolution surfaces:
- `openclaw` resolved to `C:\Users\admin\AppData\Roaming\npm\openclaw.ps1`
- generated gateway launcher at `C:\Users\admin\.openclaw\gateway.cmd`

## Key finding

The workstation was not actually coherent even though the shell reported Node 20.

Mismatch found:
- interactive PowerShell resolved `node.exe` to Node 20
- OpenClaw-generated launcher artifacts still referenced Node 25

Critical evidence:
- `C:\Users\admin\.openclaw\gateway.cmd` explicitly pointed to `C:\Program Files\nodejs\node.exe`

## Node 20 assumption review

The original stabilization hypothesis was wrong for the current OpenClaw build.

Direct startup result under Node 20:
- `openclaw: Node.js v22.12+ is required (current: v20.20.2).`

Conclusion:
- Node 20 is not a supported runtime for the installed OpenClaw version.
- Standardizing on Node 20 would not restore stability because OpenClaw refuses to start on it.

## Final aligned runtime

Installed supported runtime:
- `OpenJS.NodeJS.22` via WinGet
- resolved version: `v22.22.3`

Final shell resolution:
- `where.exe node` returns Node 22 first
- `node --version` returns `v22.22.3`
- `npm --version` returns `10.9.8`

## Outcome

OpenClaw runtime alignment now targets Node 22, which matches the tool's stated requirement and eliminated the runtime mismatch with the old Node 25 launcher path.
