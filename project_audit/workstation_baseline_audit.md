# Workstation Baseline Audit

Date: 2026-05-26

## Hardware

| Area | Result |
| --- | --- |
| CPU | Intel Core Ultra 9 285K, 24 cores / 24 logical processors |
| RAM | 64 GB installed |
| Disk C | 4 TB class drive, about 1.8 TB free during audit |
| Disk D | 1 TB external `My Passport`, about 942 GB free |
| GPUs | 2x NVIDIA GeForce RTX 5090, each 32 GB VRAM |
| iGPU | Intel Graphics present |

## Core Runtime Tools

| Tool | Status |
| --- | --- |
| PowerShell | 7.6.2 |
| Node | v22.22.3 |
| npm | 10.9.8 |
| Python | 3.11.9 via `py -3.11` / `C:\Python\python.exe` |
| Git | 2.54.0.windows.1 |
| Git LFS | 3.7.1, installed and initialized |
| VS Code | 1.121.0 |
| OpenClaw | 2026.5.20 |
| Codex CLI | 0.130.0 |
| Claude Code | 2.1.143 |
| Godot | 4.6.2 stable |
| Electron | 28.3.3 in repo |
| Playwright | 1.59.1 in repo |

## Notes

- The workstation is well above the needs of BikeBrowser's current Godot/React workflow.
- The strongest installed axis is dual-GPU local AI + visual QA.
- Existing docs that mention an older AMD/RX580 machine are stale for this workstation.
