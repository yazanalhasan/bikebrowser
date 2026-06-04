# OpenClaw Act 1 Playthrough Validation

Date started: 2026-05-20

## Phase 2 Baseline

Commands:

- `node scripts/check-health.js`
- `node scripts/check-app.mjs`
- `godot --headless --path BikeBrowserWorld --quit`

Baseline result:

- Local Vite and API were already running.
- Home route loads.
- `/play` loads a full-frame Godot iframe.
- Godot neighborhood renders visibly with HUD, active quest card, Zuzu, NPCs, garage, and region exits.
- Godot runtime validation reports 0 errors and 1 warning: native TTS unavailable.
- Quest registry initially loaded 19 mission files and 7 regions.

Baseline blockers/risks:

- Dry Wash was not registered, so bridge-site play could not be validated end to end.
- Several regional activities were JSON-present or scene-thin rather than fully playable.
- Diagnostics panel received no Godot bridge events during passive load.
- Neighborhood prompt overlays needed a UX pass.

## Phase 19 Fresh Route Playthrough

Date run: 2026-05-20

Validation commands:

- `godot --headless --path BikeBrowserWorld --quit`
- `tools/export-godot-web.ps1`
- `npx playwright test tests/e2e/godot-prototype.smoke.spec.js`
- Playwright route capture across `/play` and `/godot-prototype?diagnostics=1`

Automated route sequence:

1. Boot / neighborhood: `/play?playtest=1`
2. Garage / workshop: `/play?playtest=1&playtestRegion=garage`
3. Dry Wash bridge site: `/play?playtest=1&playtestRegion=dry_wash`
4. Desert Trail: `/play?playtest=1&playtestRegion=desert_trail`
5. Salt River: `/play?playtest=1&playtestRegion=salt_river`
6. Copper Mine: `/play?playtest=1&playtestRegion=copper_mine`
7. Diagnostics bridge: `/godot-prototype?diagnostics=1&playtest=1`

Screenshots:

- `playtest_captures/phase19_boot_neighborhood.png`
- `playtest_captures/phase19_garage.png`
- `playtest_captures/phase19_dry_wash.png`
- `playtest_captures/phase19_desert_trail.png`
- `playtest_captures/phase19_salt_river.png`
- `playtest_captures/phase19_copper_mine.png`
- `playtest_captures/phase19_diagnostics.png`

Results:

- All Act 1 canonical regions loaded through the Godot web runtime with no browser page errors.
- Godot smoke test passed: 2/2.
- Diagnostics route now receives a Godot-origin `debug_log` bridge event: `Godot bridge ready`.
- Headless Godot validation remains clean:
  - 25 missions loaded.
  - 8 regions registered.
  - 8/8 audio mappings valid.
  - 0 quest validation errors.
  - 0 runtime validation errors.
  - Native TTS warning only.
- Backend consistency check found no missing scene quest IDs, scene objective IDs, region scene paths, or mission reward item IDs.
- Local app boot check passed: home loads, `/play` loads, no JS errors.
- Health check passed for Vite, API, Electron, native module, and public site; Cloudflare tunnel is off and not required for local Act 1 validation.

Playable path coverage:

- Neighborhood: visible HUD, active pre-ride quest card, Mrs. Ramirez, Mr. Chen, Garage, Copper Mine, Salt River, Desert Trail, Dry Wash, Bridge Review, and Act 1 Review.
- Garage: workshop build/tire/chain visual surface loads with tools, NPC, bike stand, repair props, and station prompts.
- Dry Wash: bridge damage review, Mr. Chen, broken plank/beam evidence, bridge build station, support piers, staged bridge segment, triangle review, and return transition load visibly.
- Desert Trail: Ranger Nita, plant observation station, migrated foraging props, survival/field-guide challenge props, and desert pickups load visibly.
- Salt River: Dr. Maya, water quality station, algae/microbe/mineral/reed sample props, food-web/flow/irrigation challenge props load visibly.
- Copper Mine: miner, copper evidence station, surface/deep copper, wire spool, conductivity/load/stability props, lantern/support/rubble details load visibly.
- Diagnostics/backend: Godot-to-React bridge emits a valid event on passive load.

Validation limitation:

This pass validates route load, visual content presence, registry consistency, bridge readiness, and smoke-test coverage. It does not prove every interactable objective can be completed by controller/key input in one continuous human-style run, because the project does not currently expose an automated Godot input/playthrough harness for per-object completion. The remaining risk is lower than the baseline because each incorporated station is wired to existing QuestRegistry/InventoryManager/RewardBridge/EventBus primitives and the scene-to-data consistency checks are clean, but a final manual QA pass should still complete every interaction on hardware before release.

