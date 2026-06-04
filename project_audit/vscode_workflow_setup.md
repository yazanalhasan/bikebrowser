# VS Code Workflow Setup

Date: 2026-05-18

## Scope

Workflow optimization only for the canonical BikeBrowser workspace at `C:\dev\bikebrowser`.

No gameplay systems, runtime architecture, missions, or embodied-learning mechanics were modified.

## Canonical workspace

Canonical repo configured:
- `C:\dev\bikebrowser`

Evidence:
- `C:\dev\bikebrowser\.vscode\settings.json` exists
- `C:\Users\admin\Documents\New project 3\bikebrowser\.vscode\settings.json` does not exist

Operational note:
- If VS Code is still open on the long-path clone, reopen the window on `C:\dev\bikebrowser` so the new `.vscode` workflow files actually govern the session.

## Workspace files created

Created under `.vscode/`:
- `settings.json`
- `tasks.json`
- `launch.json`
- `extensions.json`
- `playwright.mobile.config.js`

Created workflow support folders:
- `playtest_captures/`
- `telemetry/`
- `screenshot_baselines/`
- `visual_diffs/`

## Terminal standard

VS Code terminal standard is now:
- default profile: PowerShell 7 (`pwsh.exe`)
- working directory: `${workspaceFolder}`
- integrated terminal PATH prepends Node 22 and npm global shims

Prepended runtime paths:
- `C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.22_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v22.22.3-win-x64`
- `C:\Users\admin\AppData\Roaming\npm`

Verified runtime commands:
- `node --version` -> `v22.22.3`
- `npm --version` -> `10.9.8`
- `where.exe node` -> Node 22 first, Node 20 second
- `openclaw --version` -> `OpenClaw 2026.5.12 (f066dd2)`

## Task architecture

Configured one-click tasks for:
- `npm run build`
- `npm run dev`
- `npm run test:e2e`
- `RuntimeValidator`
- `vertical_slice_check.gd`
- `brake_rig_state_check.gd`
- `chain_rig_state_check.gd`
- `tire_rig_state_check.gd`
- `interaction_overlap_check.gd`
- `export-godot-web.ps1`
- `OpenClaw launch`
- `Playwright smoke suite`
- `Playwright mobile sweep`
- `telemetry analysis`

Godot validation tasks target the real test files under `BikeBrowserWorld/tests/` and use the WinGet Godot launcher path already verified on this machine.

## Launch configurations

Configured launch profiles for:
- Electron app
- Vite frontend
- Playwright headed
- Playwright mobile
- Godot validation
- OpenClaw launch
- export validation

## Extensions

Required extensions installed/recommended:
- installed: `eamodio.gitlens`
- installed: `usernamehw.errorlens`
- installed: `dbaeumer.vscode-eslint`
- installed: `esbenp.prettier-vscode`
- installed: `ms-vscode.powershell`
- installed: `ms-python.python`
- installed during this pass: `ms-playwright.playwright`
- installed during this pass: `geequlim.godot-tools`

Optional recommendations:
- `rangav.vscode-thunder-client`
- `gruntfuggly.todo-tree`

AI-overlap guardrails:
- workspace recommendations explicitly avoid adding more assistant overlap
- unwanted recommendations list includes `TabNine.tabnine-vscode`, `Codeium.codeium`, `sourcegraph.cody-ai`, `Continue.continue`

## Performance tuning

Settings added for large-repo responsiveness:
- watcher exclusions for `node_modules`, build outputs, Playwright reports, Godot cache/output, runtime data, and new visual-analysis folders
- search exclusions for the same generated paths
- minimap disabled
- auto-save after short delay
- VS Code telemetry level set to `off`
- TypeScript server memory raised to 4096 MB

## Known pitfalls

1. The current VS Code window may still be attached to the long-path clone; reopen on `C:\dev\bikebrowser` if the new workspace files are not taking effect.
2. Plain `python` is not bound in shell PATH on this machine; workflow commands use `py -3` instead.
3. Node 20 is still installed for compatibility testing, but Node 22 is the canonical runtime and is forced first in VS Code terminals.
