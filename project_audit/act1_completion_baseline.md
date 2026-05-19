# Act 1 Completion Baseline

Date: 2026-05-18 22:52 PDT
Workspace: `C:\dev\bikebrowser`
Branch: `repair/runtime-canonicalization`

## Environment

- Node: `v22.22.3`
- npm: `10.9.8`
- OpenClaw: `2026.5.12 (f066dd2)`
- PowerShell: `7.6.1`
- Workspace writable: yes

## Baseline Validation

All required baseline commands exited successfully.

| Gate | Result | Duration |
| --- | --- | ---: |
| `npm run build` | PASS | 12.18s |
| `godot --headless --path .\BikeBrowserWorld --quit` | PASS | 1.26s |
| `runtime_repair_smoke.gd` | PASS | 2.40s |
| `vertical_slice_check.gd` | PASS | 3.02s |
| `brake_rig_state_check.gd` | PASS | 2.55s |
| `chain_rig_state_check.gd` | PASS | 2.42s |
| `tire_rig_state_check.gd` | PASS | 4.38s |
| `chain_hotspot_embodied_check.gd` | PASS | 4.85s |
| `interaction_overlap_check.gd` | PASS | 3.76s |
| `act1_player_path_check.gd` | PASS | 4.51s |
| Playwright `/play` smoke | PASS | 3.65s |
| Playwright `/legacy-play` smoke | PASS | 13.65s |
| `tools/export-godot-web.ps1` | PASS | 4.68s |

## Baseline Notes

- Runtime validation loads 19 missions, 25 dialogue files, 7 regions, and 7/7 audio mappings.
- Godot headless exits still print the known ObjectDB/resource cleanup warnings after successful runs.
- `runtime_repair_smoke.gd` exited 0 but printed a stale expected quest-count error before this baseline cleanup: it still expected 18 quests while the runtime now loads 19. That assertion should track the current registry instead of hard-coding an old count.
- The worktree was already dirty before this sprint began, including prior Act 1 systems, tests, export artifacts, screenshots, and audit files. The checkpoint for this phase should preserve that reality rather than imply a clean baseline.

