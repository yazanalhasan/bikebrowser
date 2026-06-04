# OpenClaw VS Code Coexistence

Date: 2026-05-18

## Goal

Keep VS Code, OpenClaw, Telegram governance, Playwright, Electron, Godot, and validation tooling operating from one coherent developer shell model.

## Coexistence result

Coexistence is clean under the canonical repo configuration.

Verified:
- VS Code terminals are standardized on PowerShell 7
- VS Code terminal PATH prepends Node 22 and npm global shims
- `openclaw --version` resolves successfully from the same standardized PATH
- `where.exe node` no longer resolves Node 25 because Node 25 was removed from the workstation
- Telegram governance integration remains externalized through `tools/send-openclaw-report.ps1`

## OpenClaw workflow integration

VS Code task added:
- `OpenClaw launch`

VS Code launch profile added:
- `OpenClaw launch`

These use the same runtime assumptions as the rest of the workspace:
- PowerShell 7
- Node 22.22.3 first in PATH
- npm shim directory present

## Drift controls

Drift reduced by:
- removing Node 25 from the machine
- restoring `C:\Users\admin\AppData\Roaming\npm` to persisted user PATH
- prepending Node 22 inside VS Code integrated terminals and task/launch environments
- keeping the canonical repo at `C:\dev\bikebrowser`

## AI-assistant overlap posture

Installed assistants observed on the workstation include:
- `github.copilot-chat`
- `anthropic.claude-code`

This pass did not disable user-installed assistants, but the workspace recommendations were kept narrow and the unwanted recommendations list blocks adding more overlapping assistant extensions through workspace prompts.

Practical rule for this workspace:
- use OpenClaw for orchestration/session workflows
- use Copilot in-editor for coding assistance when needed
- do not add additional assistant extensions unless there is a proven gap

## Known limitations

1. If the current VS Code window stays attached to the long-path clone, the canonical `.vscode` configuration will not govern that window.
2. `python` is not directly bound in PATH, so CUDA and screenshot-analysis flows should use `py -3`.
3. The workspace recommendations can install or suggest extensions, but they do not remove already-installed assistants automatically.

## Conclusion

VS Code and OpenClaw now coexist on one stable runtime foundation without Node drift, missing npm shims, or launcher ambiguity.
