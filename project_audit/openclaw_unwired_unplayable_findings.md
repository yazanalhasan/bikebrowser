# OpenClaw Unwired and Unplayable Findings

Date started: 2026-05-20

## Active Findings

| ID | Phase | Severity | Area | Finding | Status |
|---|---|---|---|---|---|
| U-001 | 1 | High | Dry Wash / bridge | Phaser has `DryWashScene` and bridge-site gameplay; Godot has no registered `dry_wash` region. Bridge quest JSON references dry-wash style conditions but no canonical region is registered. | Resolved in Phase 13 |
| U-012 | 13 | Low | Playtest routing | `/play?playtest=1&playtestRegion=dry_wash` stayed in the neighborhood, while `/godot-prototype?playtest=1&playtestRegion=dry_wash` loaded Dry Wash correctly. | Resolved in Phase 15; stale export/cache timing |
| U-002 | 1 | Medium | Copper Mine | Phaser copper pickups and optional mine stability/conductivity challenges are not represented in current Godot inventory/scene surface. | Resolved in Phase 6 |
| U-011 | 5 | Medium | Copper Mine UX | Phase 5 visual capture confirms migrated Copper Mine props render, but the scene remains sparse and some migrated/legacy props sit near camera edges. Needs Phase 6 visual/framing pass. | Resolved in Phase 6 |

## Phase 6 Copper Mine Validation

- Screenshot: `playtest_captures/phase6_copper_mine_exported.png`
- Runtime validation: 0 errors, 1 native TTS warning.
- Quest registry: 21 missions loaded, 0 quest validation errors.
- Residual risk: full controller/key-driven pickup and challenge completion will be covered again during Phase 19 full Act 1 playthrough.
| U-003 | 1 | Medium | Salt River | Phaser ecology samples and flow/fraction challenges are not represented in current Godot scene surface. | Resolved in Phase 8 |
| U-004 | 1 | Medium | Desert Trail | Phaser foraging pickups and survival/math side challenges are not represented in current Godot scene surface. | Resolved in Phase 10 |
| U-005 | 1 | Medium | Reusable interactions | Godot needs reusable resource pickup, inspectable, and challenge station primitives before content migration to avoid one-off scene hacks. | Resolved in Phase 3 |
| U-006 | 1 | Unknown | Act 1 playability | Mission JSON exists for many Act 1 steps; Phase 2 must verify which steps are actually interactable and completable from a fresh runtime. | Mitigated in Phase 19; route/registry validation clean, manual per-object completion QA remains |
| U-007 | 2 | Medium | Frontend bridge diagnostics | `/godot-prototype?diagnostics=1` loads the Godot iframe, but the diagnostics panel reports "No Godot events received yet" after passive load. Need verify whether Godot bridge events only emit after interaction or whether startup/hydrate events are unwired. | Resolved in Phase 18 |
| U-008 | 2 | Medium | Neighborhood UX | Phase 2 screenshot shows semi-transparent proximity labels and station overlays crowding/overlapping around the road/workshop area. Needs Phase 15/17 prompt and contrast pass. | Resolved in Phase 17 |
| U-009 | 2 | Low | Web capture noise | Playwright reports aborted `index.wasm`/`index.pck` requests during iframe capture while the export still loads visually. Likely navigation/capture artifact, but keep under observation during validation. | Resolved in Phase 17; fresh captures reported no page errors |
| U-010 | 2 | Low | Runtime validation | Godot runtime validation warns that native TTS is unavailable on this platform. Audio mapping validates 7/7, but voiced-line validation needs browser/runtime coverage. | External runtime warning remains; audio mappings validate 8/8 |

## Phase 17 Frontend UX Validation

- Screenshots:
  - `playtest_captures/phase17_neighborhood_after.png`
  - `playtest_captures/phase17_dry_wash_after.png`
  - `playtest_captures/phase17_garage.png`
  - `playtest_captures/phase17_diagnostics.png`
- Repositioned the neighborhood bridge review station near the Dry Wash approach so its label no longer floats over Mr. Chen's workshop.
- Pulled the Dry Wash triangle review station, measuring tape, and rope coil inward so they are not clipped at the right camera edge.
- Browser captures after export reported no page errors.
- Diagnostics bridge was fixed in Phase 18. The clean capture `playtest_captures/phase18_diagnostics_bridge_fixed_clean.png` shows a Godot-origin `debug_log` event with message `Godot bridge ready`.

## Phase 18 Backend Systems Validation

- Added a delayed Godot bridge-ready `debug_log` event in `Core/CompanionBridge/CompanionBridge.gd`.
- Changed web bridge sending to serialize payloads through `JavaScriptBridge.eval(...postMessage(JSON)...)`, ensuring React receives plain browser objects.
- JSON consistency script checked:
  - 25 missions.
  - 69 items.
  - 8 registered regions.
  - 25 region scene files.
  - 9 mission reward item references.
  - 0 missing quest/objective/reward references.
- `godot --headless --path BikeBrowserWorld --quit`: 0 quest errors, 0 runtime errors, native TTS warning only.
- `node scripts/check-app.mjs`: app boots and `/play` loads with no JS errors.
- `npm run check:health`: Vite, API, Electron, native module, and public site pass; Cloudflare tunnel is not running, which is outside local Act 1 validation.
