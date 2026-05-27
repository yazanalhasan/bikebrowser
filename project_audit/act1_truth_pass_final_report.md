# Act 1 Truth Pass Final Report

Date: 2026-05-26

## What Was Wrong

- Runtime bike sprites had regressed from the better `*_pass1_backup.png` quality baseline.
- Surfaced Act 1 repair sprites did not consistently have `.aseprite` sources beside runtime PNGs.
- Quest objective recording accepted undeclared objective IDs.
- `bridge_quest_2` existed as registered mission data without player-facing Act 1 wiring.
- `bridge_quest_5` notebook learning objectives could be advanced by generic station interaction.
- Copper evidence was staged as a generic quest station instead of a visible sample/probe evidence loop.

## What Was Fixed

- Restored garage repair stand and safety bike runtime art from the higher-quality baseline.
- Recovered `.aseprite` sources for surfaced Act 1 bike, tire, chain, patch, pump, and tool sprites.
- Added strict objective schema checks to `QuestRegistry.gd`.
- Added `cement_set` to the bike safety mission schema because tire repair uses it as a real step.
- Marked `bridge_quest_2` as `deferred_backend_only` so it is no longer an implied surfaced Act 1 promise.
- Gated `bridge_quest_5` notebook objectives behind actual lesson evidence.
- Added `CopperEvidenceStation.gd` so the copper station now shows a sample/probe/test-light sequence before reporting.
- Updated HUD validation to match the truthful bridge lesson title.
- Added `/legacy-play` and mobile `/play` browser smokes.

## Assets Changed

- `Assets/Props/Bike/garage_repair_stand_bmx_*_chain.png`
- `Assets/Props/Bike/small_safety_check_bike*.png`
- New `.aseprite` sources for surfaced repair assets across:
  - `Assets/Props/Bike`
  - `Assets/Props/BikeRepair`
  - `Assets/Props/Repair`

## Quest and Validation Changes

- New/updated Godot tests cover art contracts, chain orientation, tire patch alignment, quest schema truth, data-only quests, station evidence, HUD guidance, and Act 1 player path.
- Targeted Playwright coverage now includes canonical `/play`, `/legacy-play`, prompt acceptance, close-up repair captures, and mobile route loading.

## Deferred

- The full `bridge_quest_2` material-gathering chapter remains deferred/backend-only until it receives a real owner, scene entry, objective progression, notebook artifact, and validation.
- Full `npm run test:e2e` remains a broader suite outside this targeted Act 1 correction pass.

## Readiness

Act 1 is now substantially more truthful and playtest-ready: the repair visuals are back on the Aseprite-quality path, chain/tire mechanics validate physically, surfaced quest objectives are schema-aware, and known data-only quest promises are either reconciled or explicitly deferred.
