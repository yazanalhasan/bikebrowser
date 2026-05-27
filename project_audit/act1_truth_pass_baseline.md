# Act 1 Truth Pass Baseline

Date: 2026-05-26
Branch: `overnight/sprint-1-phase-2`
Workspace: `C:\dev\bikebrowser`

## Safety Checks

| Check | Result |
| --- | --- |
| Current branch | `overnight/sprint-1-phase-2` |
| Git status | Dirty working tree with existing Act 1/game/export changes; preserved as sprint baseline |
| `/play` canonical Godot route | PASS: `src/renderer/App.jsx` routes `/play` to `GodotPrototypePage` |
| `/legacy-play` exists | PASS: `src/renderer/App.jsx` routes `/legacy-play` to `GamePage` |
| Node 22 active | PASS: `v22.22.3` |
| OpenClaw Telegram helper | PASS: `tools/send-openclaw-report.ps1`, `C:\OpenClaw\.env.telegram`, and notifier script present |
| Workspace writable | PASS: baseline audit file written |

## Baseline Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run build` | PASS | Vite build completed; existing chunk-size/module-type warnings remain |
| Playwright `/play` smoke | PASS | `npx playwright test godot-prototype.smoke.spec.js --project=chromium` passed 2/2 after clearing stale 5173 listener |
| Playwright `/legacy-play`/route smoke | PASS | `npx playwright test route-coherence.smoke.spec.js --project=chromium` passed 2/2 after clearing stale 5173 listener |
| Godot RuntimeValidator | PASS | Via boot during Godot script checks: 0 errors, 1 warning |
| `vertical_slice_check.gd` | PASS | Exit 0 |
| `act1_player_path_check.gd` | PASS | Exit 0 |
| `act1_regional_readiness_check.gd` | PASS | Exit 0 |
| `chain_hotspot_embodied_check.gd` | PASS | Exit 0 |
| `chain_rig_state_check.gd` | PASS | Exit 0 |
| `tire_rig_state_check.gd` | PASS | Exit 0 |
| `notebook_inventory_check.gd` | PASS | Exit 0 |
| `runtime_repair_smoke.gd` | PASS | Exit 0 |
| `tools/export-godot-web.ps1` | PASS | Export completed |

## Baseline Notes

- Initial Playwright attempts reused an existing stale listener on port 5173 that served only `Initializing...`; this was environment state, not a route assertion failure.
- Clearing the 5173 listeners allowed Playwright to start the repo Vite server and both smoke groups passed.
- Godot script runs consistently emit resource/ObjectDB leak warnings at shutdown while still exiting 0.
- Baseline known truth gaps remain: bike art regression, missing Aseprite sources for surfaced bike props, `cement_set` objective drift, data-only `bridge_quest_2`, and generic station-click completion for surfaced learning objectives.
