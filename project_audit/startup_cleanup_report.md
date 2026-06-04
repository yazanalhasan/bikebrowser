# Startup Cleanup Report

Date: 2026-05-26

## Goal

Reduce reboot/startup load before restarting the workstation while preserving essentials for security, remote access, project orchestration, and normal Windows operation.

## Backups

Registry startup keys were exported before changes:

- `C:\dev\bikebrowser\project_audit\startup_cleanup_20260526_225152\HKCU_Run.reg`
- `C:\dev\bikebrowser\project_audit\startup_cleanup_20260526_225152\HKLM_Run.reg`

## Disabled Or Removed From User Startup

Removed from `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`:

- Microsoft Edge auto-launch
- Google Chrome auto-launch
- Microsoft Copilot auto-launch
- Comet updater user startup
- Docker Desktop auto-launch
- Steam auto-launch

Moved from the user Startup folder:

- `Comet.lnk` moved to `C:\Users\admin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Disabled\Comet.20260526_225152.lnk`

Disabled scheduled task:

- `\PerplexityUser\CometUpdater\CometUpdaterTaskUser145.2.7632.4583{504B34C4-93F2-4FF2-BA35-FCBD667F7E6B}`

## Left Enabled Intentionally

These were left enabled because they are useful or expected for this workstation:

- OneDrive user startup
- Windows Security Health
- Realtek audio service
- NVIDIA services
- Tailscale, RustDesk, and SSH remote access services
- OpenClaw Gateway scheduled task
- Google and Edge updater scheduled tasks

## Stopped Current Heavy Runtime Processes

Stopped currently running development and AI listeners so memory/VRAM can clear before reboot:

- Vite/Node listener on port 5173
- Vite/Node listener on port 5174
- ComfyUI/Python listener on port 8188
- Ollama listener on port 11434
- Ollama tray/app process

## Verification After Cleanup

User Run key now contains only:

- OneDrive

User Startup folder now contains only:

- `Disabled`
- `desktop.ini`

Comet updater scheduled task status:

- Disabled

Checked ports after cleanup:

- 5173: no listener
- 5174: no listener
- 8188: no listener
- 11434: no listener

## Restore Notes

To restore registry auto-start entries, import the backup `.reg` files from the backup directory.

To restore Comet startup, move the quarantined shortcut from the `Disabled` folder back into the user Startup folder and re-enable its scheduled task.

## Restart Readiness

The machine is ready for a cleaner restart. ComfyUI, Ollama, Docker Desktop, Steam, Comet, browser session auto-launch, and Copilot should not automatically consume resources at login.

ComfyUI can still be started manually with:

```powershell
powershell -ExecutionPolicy Bypass -File C:\AI\start_comfyui.ps1
```
